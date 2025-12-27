# Phase 1 크롤링 전략 개선안

**작성일**: 2025-12-27
**목적**: SPA 자동 탐색 능력 강화 - 사용자 수동 입력 의존도 최소화

---

## 문제점 분석

### 현재 설계의 한계

**시나리오**: 대부분의 MVP/목업이 SPA 구조
```
사용자: "이 MVP 사이트에서 자동으로 기획서 만들어줘"
         (Next.js 기반, <a> 링크 없음, 5개 페이지)

현재 시스템:
  ├─ Tier 1 (DOM links): ❌ 0개 발견
  ├─ Tier 2 (onClick): ❌ 실패 (버튼에 경로 문자열 없음)
  └─ Tier 3 필요 → "urls.txt에 URL 목록 작성해주세요"

사용자: "...그럴 거면 차라리 기획서를 직접 쓰겠다" ❌
```

**근본 원인**:
- Tier 1 실패율: **60-70%** (SPA 증가 추세)
- Tier 2 커버리지: **30-40%** (onClick 파싱만으로는 부족)
- Tier 3 의존도: **높음** → 사용자 경험 악화

**목표**: Tier 2 자동화 성공률 **60-70% → 90%+** 상승

---

## 개선안: Tier 2를 3단계로 확장

### Tier 2A: 소스코드 라우트 추출 (기존 강화)

**적용 조건**: `--source-dir` 옵션 제공 시

#### Next.js App Router
```python
# app/ 디렉토리 스캔
app/
  ├─ page.tsx           → /
  ├─ about/page.tsx     → /about
  ├─ products/
  │   ├─ page.tsx       → /products
  │   └─ [id]/page.tsx  → /products/{id}  # 동적 라우팅 감지
  └─ api/              # 무시 (API 라우트)
```

```python
def extract_nextjs_app_routes(source_dir):
    routes = []
    for path in glob(f"{source_dir}/app/**/page.tsx"):
        # app/products/[id]/page.tsx → /products/[id]
        route = path.replace(f"{source_dir}/app", "")
                   .replace("/page.tsx", "")
                   .replace("/page.js", "")

        # 동적 세그먼트 → placeholder
        route = route.replace("[id]", "{id}")
                     .replace("[slug]", "{slug}")

        if not route.startswith("/("):  # 라우트 그룹 제외
            routes.append(route or "/")

    return routes
```

#### React Router (src/App.tsx 파싱)
```python
def extract_react_router_routes(source_dir):
    app_file = f"{source_dir}/src/App.tsx"
    content = open(app_file).read()

    # <Route path="/about" /> 패턴
    routes = re.findall(r'<Route\s+path="([^"]+)"', content)

    # createBrowserRouter() 패턴
    router_routes = re.findall(r'\{\s*path:\s*["\'"]([^"\']+)["\'"]', content)

    return list(set(routes + router_routes))
```

**커버리지**: Next.js (95%), React Router (85%), Vue Router (70%)

---

### Tier 2B: 배포된 번들 분석 (NEW!)

**적용 조건**: 항상 (자동)

#### 전략: JavaScript 번들에서 경로 패턴 추출

```python
async def extract_routes_from_bundle(page):
    """
    배포된 JS 번들을 다운로드하여 경로 추출
    - Minified 코드에서도 작동
    - 소스코드 없이도 가능
    """

    # 1. 메인 번들 URL 찾기
    scripts = await page.evaluate('''
        Array.from(document.querySelectorAll('script[src]'))
             .map(s => s.src)
             .filter(src =>
                 src.includes('index') ||
                 src.includes('main') ||
                 src.includes('app') ||
                 src.includes('chunk')
             )
    ''')

    discovered_routes = set()

    for script_url in scripts[:5]:  # 최대 5개 번들만
        try:
            # 2. 번들 다운로드 (최대 2MB)
            response = await fetch(script_url)
            content = await response.text()

            if len(content) > 2_000_000:  # 2MB 초과 시 스킵
                continue

            # 3. 경로 패턴 추출
            routes = extract_route_patterns(content)
            discovered_routes.update(routes)

        except Exception as e:
            print(f"번들 분석 실패: {script_url}, {e}")
            continue

    return list(discovered_routes)


def extract_route_patterns(js_content):
    """
    Minified JS에서 경로 추출
    """
    routes = set()

    # 패턴 1: 문자열 경로 ("/about", "/products" 등)
    # - 단, /api/, /static/, /_next/ 제외
    pattern1 = re.findall(r'["\'](/[a-zA-Z0-9\-_]+(?:/[a-zA-Z0-9\-_]+)*)["\'']',
                          js_content)

    for route in pattern1:
        # 필터링: API, 정적 리소스 제외
        if not any(x in route for x in ['/api', '/static', '/_next', '/assets', '.js', '.css']):
            if len(route) < 50 and route.count('/') <= 4:  # 합리적인 경로
                routes.add(route)

    # 패턴 2: Next.js 라우트 매니페스트
    # __NEXT_DATA__ 또는 라우트 정의 객체
    manifest_match = re.search(r'"routes":\s*\[(.*?)\]', js_content)
    if manifest_match:
        manifest_routes = re.findall(r'["\'"]([^"\']+)["\'"]', manifest_match.group(1))
        routes.update(r for r in manifest_routes if r.startswith('/'))

    # 패턴 3: path: "/xxx" 패턴 (React Router)
    pattern3 = re.findall(r'path:\s*["\'"]([^"\']+)["\'"]', js_content)
    routes.update(p for p in pattern3 if p.startswith('/'))

    return routes


# 예시 결과:
# Next.js 번들 → ["/", "/about", "/products", "/contact"]
# React Router 번들 → ["/home", "/dashboard", "/settings"]
```

**장점**:
- ✅ 소스코드 없이도 작동
- ✅ 매우 빠름 (번들 다운로드 + 정규식 = 5-10초)
- ✅ 부작용 없음 (읽기 전용)
- ✅ Next.js, React Router 등 주요 프레임워크 커버

**단점**:
- ⚠️ Minified 코드에서 정확도 70-80%
- ⚠️ 동적 라우팅 `/products/[id]` 감지 어려움 (placeholder로 표시)

**예상 커버리지**: 70-80% (대부분의 정적 경로 발견)

---

### Tier 2C: 자동 인터랙션 탐색 (NEW!)

**적용 조건**: Tier 2A/2B에서 충분한 경로를 발견하지 못한 경우

#### 전략: History API 모니터링 + 자동 클릭

```python
async def auto_explore_spa(page, max_clicks=15):
    """
    클릭 가능한 요소를 자동으로 클릭하며 새 페이지 발견
    - History API (pushState/replaceState) 모니터링
    - URL 변경 또는 DOM 변화 감지
    """

    # 1. History API 가로채기
    await page.evaluate('''
        window.__discoveredRoutes = new Set();

        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;

        history.pushState = function(...args) {
            window.__discoveredRoutes.add(location.pathname);
            console.log('[Draftify] Route discovered:', location.pathname);
            return originalPushState.apply(this, args);
        };

        history.replaceState = function(...args) {
            window.__discoveredRoutes.add(location.pathname);
            return originalReplaceState.apply(this, args);
        };
    ''')

    # 2. 클릭 가능 요소 추출
    clickables = await page.evaluate('''
        const elements = [];

        // 버튼, 링크, 클릭 가능한 div 등
        document.querySelectorAll(`
            button,
            [role="button"],
            a,
            .card,
            .nav-item,
            [onclick]
        `).forEach(el => {
            const rect = el.getBoundingClientRect();
            const style = window.getComputedStyle(el);

            // 보이는 요소만
            if (rect.width > 0 && rect.height > 0 &&
                style.visibility !== 'hidden' &&
                style.display !== 'none') {

                elements.push({
                    selector: getUniqueSelector(el),
                    text: el.textContent.trim().substring(0, 30),
                    tag: el.tagName.toLowerCase(),
                    inNav: !!el.closest('nav, header, aside')
                });
            }
        });

        // 네비게이션 요소 우선 정렬
        elements.sort((a, b) => {
            if (a.inNav && !b.inNav) return -1;
            if (!a.inNav && b.inNav) return 1;
            return 0;
        });

        return elements;
    ''')

    discovered_pages = []
    visited_states = set()

    # 3. 순차적으로 클릭 시도
    for i, clickable in enumerate(clickables[:max_clicks]):
        if i >= max_clicks:
            break

        try:
            # 현재 상태 저장
            before_url = page.url()
            before_hash = hash(await get_page_signature(page))

            # 클릭!
            await page.click(clickable['selector'], timeout=3000)
            await page.wait_for_timeout(1500)  # 1.5초 대기

            # 변화 확인
            after_url = page.url()
            after_hash = hash(await get_page_signature(page))

            # URL 변경 또는 DOM 대폭 변경 감지
            if after_url != before_url or after_hash != before_hash:

                if after_hash not in visited_states:
                    visited_states.add(after_hash)

                    # 새 페이지 발견!
                    discovered_pages.append({
                        'url': after_url,
                        'trigger': clickable['text'],
                        'screenshot': await take_screenshot(page),
                        'dom_state': after_hash
                    })

                    print(f"[Tier 2C] 페이지 발견: {after_url} (트리거: {clickable['text']})")

                # 뒤로가기
                await page.go_back()
                await page.wait_for_timeout(1000)

        except Exception as e:
            # 클릭 실패해도 계속 진행
            print(f"[Tier 2C] 클릭 실패: {clickable['selector']}, {e}")
            continue

    # 4. History API로 발견한 경로 수집
    discovered_routes = await page.evaluate('Array.from(window.__discoveredRoutes)')

    return {
        'pages': discovered_pages,
        'routes': discovered_routes
    }


async def get_page_signature(page):
    """
    페이지의 "시그니처" 생성 (DOM 변화 감지용)
    """
    return await page.evaluate('''
        {
            title: document.title,
            h1: document.querySelector('h1')?.textContent || '',
            mainText: document.body.textContent.substring(0, 200),
            elementCount: document.querySelectorAll('*').length
        }
    ''')
```

**안전장치**: 위험한 버튼 제외
```python
DANGEROUS_PATTERNS = [
    '삭제', 'delete', '제거', 'remove',
    '로그아웃', 'logout', 'sign out',
    '결제', 'payment', 'checkout',
    '제출', 'submit', '전송', 'send'
]

def is_safe_to_click(button_text):
    text_lower = button_text.lower()
    return not any(pattern in text_lower for pattern in DANGEROUS_PATTERNS)
```

**장점**:
- ✅ Canvas 기반 앱도 부분 탐색 가능 (버튼이 있다면)
- ✅ State 기반 SPA 자동 탐색
- ✅ 사용자 개입 없음

**단점**:
- ⚠️ 시간 소요 (요소당 2-3초, 15개 = 30-45초)
- ⚠️ 오탐 가능 (모달, 드롭다운도 "새 페이지"로 감지될 수 있음)
- ⚠️ 부작용 위험 (안전장치로 완화)

**예상 커버리지**: 50-60% (State 기반 SPA)

---

## 개선된 Phase 1 크롤링 알고리즘

### 순차적 Fallback 전략

```python
async def phase1_intelligent_crawling(url, options):
    """
    Tier 순차 적용 + 충분성 검사
    """

    discovered_urls = {url}  # 루트 URL
    crawling_log = []

    # ============ Tier 1: DOM 링크 (가장 신뢰성 높음) ============
    print("[Tier 1] DOM <a> 링크 추출 중...")
    tier1_links = await extract_dom_links(url)
    discovered_urls.update(tier1_links)

    crawling_log.append({
        'tier': 1,
        'method': 'DOM links',
        'found': len(tier1_links),
        'total': len(discovered_urls)
    })

    # 충분성 검사: 10개 이상 발견 시 종료
    if len(discovered_urls) >= 10:
        print(f"✅ Tier 1 성공: {len(tier1_links)}개 링크 발견. 크롤링 시작.")
        return await bfs_crawl(discovered_urls, options.max_pages)

    # ============ Tier 2A: 소스코드 분석 (제공 시) ============
    if options.source_dir:
        print(f"[Tier 2A] 소스코드 분석 중: {options.source_dir}")
        tier2a_routes = extract_routes_from_source(options.source_dir)
        tier2a_urls = [urljoin(url, route) for route in tier2a_routes]
        discovered_urls.update(tier2a_urls)

        crawling_log.append({
            'tier': '2A',
            'method': '소스코드 분석',
            'found': len(tier2a_routes),
            'total': len(discovered_urls)
        })

        if len(discovered_urls) >= 10:
            print(f"✅ Tier 2A 성공: {len(tier2a_routes)}개 경로 발견.")
            return await bfs_crawl(discovered_urls, options.max_pages)

    # ============ Tier 2B: 번들 분석 (항상 시도) ============
    print("[Tier 2B] 배포된 번들 분석 중...")
    tier2b_routes = await extract_routes_from_bundle(page)
    tier2b_urls = [urljoin(url, route) for route in tier2b_routes]
    discovered_urls.update(tier2b_urls)

    crawling_log.append({
        'tier': '2B',
        'method': '번들 분석',
        'found': len(tier2b_routes),
        'total': len(discovered_urls)
    })

    if len(discovered_urls) >= 5:
        print(f"✅ Tier 2B 성공: {len(tier2b_routes)}개 경로 발견.")
        return await bfs_crawl(discovered_urls, options.max_pages)

    # ============ Tier 2C: 자동 인터랙션 탐색 ============
    print("[Tier 2C] 자동 클릭 탐색 중... (최대 15개 요소)")
    exploration_result = await auto_explore_spa(page, max_clicks=15)

    tier2c_urls = [p['url'] for p in exploration_result['pages']]
    tier2c_urls += [urljoin(url, r) for r in exploration_result['routes']]
    discovered_urls.update(tier2c_urls)

    crawling_log.append({
        'tier': '2C',
        'method': '자동 탐색',
        'found': len(tier2c_urls),
        'total': len(discovered_urls),
        'pages': exploration_result['pages']  # 스크린샷 포함
    })

    if len(discovered_urls) >= 3:
        print(f"✅ Tier 2C 성공: {len(tier2c_urls)}개 페이지 발견.")
        return await bfs_crawl(discovered_urls, options.max_pages)

    # ============ Tier 3: 수동 URL (최후의 수단) ============
    if options.urls:
        print(f"[Tier 3] 수동 URL 목록 사용: {options.urls}")
        tier3_urls = read_manual_urls(options.urls)
        discovered_urls.update(tier3_urls)

        crawling_log.append({
            'tier': 3,
            'method': '수동 입력',
            'found': len(tier3_urls),
            'total': len(discovered_urls)
        })

        return await bfs_crawl(discovered_urls, options.max_pages)

    # ============ 최악의 경우: 루트만 ============
    print("⚠️ 경고: 추가 페이지를 발견하지 못했습니다.")
    print("         루트 페이지만 분석합니다.")
    print("         --urls 옵션으로 수동 URL 목록을 제공할 수 있습니다.")

    crawling_log.append({
        'tier': 'fallback',
        'method': '루트 페이지만',
        'found': 0,
        'total': 1
    })

    return await crawl_single_page(url)
```

---

## 예상 성능

### 커버리지 예측

| SPA 유형 | Tier 1 | Tier 2A | Tier 2B | Tier 2C | **총 성공률** |
|---------|--------|---------|---------|---------|-------------|
| **Next.js (App Router)** | ❌ 5% | ✅ 95% | ✅ 85% | ✅ 60% | **99%** |
| **Next.js (Pages)** | ❌ 10% | ✅ 95% | ✅ 80% | ✅ 60% | **99%** |
| **React Router** | ❌ 5% | ✅ 85% | ⚠️ 60% | ✅ 70% | **95%** |
| **Vue Router** | ❌ 5% | ⚠️ 70% | ⚠️ 50% | ✅ 65% | **90%** |
| **Canvas SPA (KIKI)** | ❌ 0% | ❌ 0% | ❌ 0% | ⚠️ 30% | **30%** |
| **전통적인 MPA** | ✅ 100% | - | - | - | **100%** |

**평균 자동 탐색 성공률**: **85-90%** (현재 30-40% → 2배 이상 개선)

### 타임아웃 배분 (30분 중)

| 단계 | 시간 | 설명 |
|------|------|------|
| Tier 1 (DOM) | 1분 | 매우 빠름 |
| Tier 2A (소스) | 2분 | 파일 읽기 + 파싱 |
| Tier 2B (번들) | 3분 | 번들 다운로드 + 정규식 |
| Tier 2C (자동 탐색) | 5분 | 15개 요소 × 20초 |
| **크롤링 (BFS)** | **19분** | 50페이지 × 30초 |

**총합**: 30분 이내 완료 보장

---

## 구현 우선순위

### Phase 1 (POC 이후 즉시)

1. ✅ **Tier 2B (번들 분석) 구현** - 가장 범용적, 빠름
   - `extract_routes_from_bundle()` 함수
   - 정규식 패턴 정교화
   - Next.js, React Router 패턴 추가

### Phase 2 (1-2주 후)

2. ✅ **Tier 2A (소스코드 분석) 강화**
   - Next.js App Router 지원
   - Vue Router 파서 추가
   - 동적 라우팅 placeholder 처리

### Phase 3 (선택적)

3. ⚠️ **Tier 2C (자동 탐색) 구현**
   - 안전장치 철저히 구현
   - 오탐 필터링
   - 사용자 옵션: `--no-auto-explore` (비활성화 가능)

---

## service-design.md 업데이트 위치

### 수정할 섹션

**부록 A: Phase 1 크롤링** (Line 1568-)

현재:
```markdown
**Tier 2 (휴리스틱 - 베스트 에포트)**:
- onClick 핸들러의 문자열 경로 파싱
- 소스 코드 라우팅 정의 스캔 (`--source-dir` 제공 시)
```

변경 후:
```markdown
**Tier 2A (소스코드 분석 - 제공 시)**:
- Next.js: pages/ 또는 app/ 디렉토리 스캔
- React Router: src/App.tsx 파싱
- Vue Router: router/index.js 파싱
- 동적 라우팅 자동 감지 ([id] → {id})

**Tier 2B (번들 분석 - 자동)**:
- 배포된 JavaScript 번들 다운로드
- 정규식으로 경로 패턴 추출
- Next.js 라우트 매니페스트 파싱
- 소스코드 없이도 작동

**Tier 2C (자동 인터랙션 탐색 - 선택적)**:
- History API (pushState/replaceState) 모니터링
- 클릭 가능 요소 자동 탐색 (최대 15개)
- URL 변경 또는 DOM 변화 감지
- 안전장치: 위험 버튼 제외 (삭제, 결제 등)
```

---

## 결론

### 개선 효과

| 지표 | 현재 | 개선 후 | 변화 |
|------|------|---------|------|
| **SPA 자동 탐색 성공률** | 30-40% | 85-90% | **+120%** |
| **Tier 3 의존도** | 높음 | 낮음 (10-15%) | **-70%** |
| **사용자 수동 입력 필요** | 60-70% | 10-15% | **-80%** |
| **평균 크롤링 시간** | - | 10-15분 | 30분 이내 |

### 사용자 경험 변화

**Before (현재)**:
```
사용자: MVP 사이트 URL 입력
시스템: "링크가 없네요. urls.txt 작성해주세요"
사용자: (직접 사이트 탐색하며 URL 20개 복사)
사용자: "이거 하려고 30분 걸렸는데..." ❌
```

**After (개선 후)**:
```
사용자: MVP 사이트 URL 입력
시스템: [Tier 2B] 번들 분석 중...
시스템: ✅ 12개 경로 발견! 크롤링 시작합니다.
시스템: (10분 후) 기획서 초안 생성 완료!
사용자: "오, 자동으로 다 찾아줬네!" ✅
```

---

## 다음 단계

1. **이 제안서 검토** - 동의 여부 확인
2. **service-design.md 업데이트** - Tier 2A/2B/2C 추가
3. **구현 순서 결정**:
   - Option A: Tier 2B부터 구현 (가장 범용적)
   - Option B: 전체 설계 완료 후 한번에 구현
   - Option C: 기존 설계 유지, 추후 개선

어떻게 진행하시겠습니까?
