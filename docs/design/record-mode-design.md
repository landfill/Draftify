# Record 모드 상세 설계

**버전**: 1.3
**최종 갱신**: 2025-12-29
**목적**: State 기반 SPA 스크린샷 자동 캡처 (50% 케이스 대응)

---

## 문제 정의

### State 기반 SPA의 한계

**현재 자동 크롤링 실패 케이스**:
```javascript
// wordcrack.world 같은 앱
URL: / (고정)
State: 'home', 'quiz', 'result'

문제:
→ URL이 바뀌지 않아 각 화면 방문 불가
→ 스크린샷 자동 캡처 불가 ❌
→ 화면정의서 작성 불가 ❌
```

**영향**:
- 전체 SPA의 ~50%
- 자동화 실패 → 도구 가치 하락

---

## 해결책: Record 모드

### 개념

**사용자가 수동으로 탐색 + 시스템이 자동으로 기록**

```
사용자: 화면 클릭 (Movies → Quiz → Result)
시스템: 자동으로 스크린샷 + DOM 캡처
결과: 완전한 crawling-result.json
```

**자동화 수준**: 50% (반자동)
- 탐색: 수동 (사용자)
- 캡처: 자동 (시스템)

---

## CLI 인터페이스

### 옵션

```bash
/auto-draft --url <url> --record [options]

옵션:
  --record              Record 모드 활성화 (필수)
  --source-dir <dir>    소스코드 디렉토리 (선택, 화면 목록 추론용)
  --expected-screens N  예상 화면 개수 (기본값: 자동 감지)
  --output <dir>        출력 디렉토리 (기본값: outputs/<project-name>)
```

### 사용 예시

```bash
# 기본 사용
/auto-draft --url https://wordcrack.world --record

# 소스코드와 함께 (권장)
/auto-draft \
  --url https://wordcrack.world \
  --source-dir ./wordcrack-source \
  --record

# 예상 화면 수 지정
/auto-draft \
  --url https://wordcrack.world \
  --record \
  --expected-screens 5
```

---

## 워크플로우

### Phase 1: 준비

```python
async def record_mode_phase1(url, source_dir, output_dir):
    """
    소스코드 분석 및 예상 화면 목록 추출
    """

    expected_screens = []

    if source_dir:
        # 1. 소스코드에서 화면 목록 추론
        expected_screens = infer_screens_from_source(source_dir)
        # 예: ['home', 'quiz', 'result', 'leaderboard']

    # 2. Chrome 열기
    page = await chrome_devtools_open(url)

    # 3. Record UI 표시 (브라우저 내부 또는 콘솔)
    await inject_record_ui(page, expected_screens)

    return {
        'page': page,
        'expected_screens': expected_screens,
        'output_dir': output_dir
    }
```

**소스코드에서 화면 추론**:
```python
def infer_screens_from_source(source_dir):
    """
    소스코드에서 화면/State 패턴 추출
    """
    screens = set()

    # 패턴 1: State 상수
    # const SCREENS = ['home', 'quiz', 'result'];
    for file in glob(f"{source_dir}/**/*.js"):
        content = open(file).read()

        # 배열 형태의 화면 목록
        matches = re.findall(r'["\']([a-z_]+)["\'],?\s*["\']([a-z_]+)["\']', content)
        screens.update([m for group in matches for m in group])

    # 패턴 2: Switch 문
    # switch(currentScreen) { case 'quiz': ... }
    switch_cases = re.findall(r'case\s+["\']([a-z_]+)["\']:', content)
    screens.update(switch_cases)

    # 패턴 3: 컴포넌트 파일명
    # QuizScreen.jsx, ResultScreen.jsx
    for file in glob(f"{source_dir}/**/*Screen.*"):
        name = os.path.basename(file).replace('Screen', '').lower()
        screens.add(name)

    return list(screens)
```

---

### Phase 2: 사용자 인터랙션 모니터링

```python
async def record_mode_phase2(page, expected_screens, output_dir):
    """
    사용자 클릭 감지 + 자동 스크린샷 캡처
    """

    captured_screens = []
    current_state = await get_page_state(page)

    # UI 주입
    await page.evaluate('''
        // Record UI 생성
        const recordUI = document.createElement('div');
        recordUI.id = 'draftify-record-ui';
        recordUI.innerHTML = `
            <div style="position: fixed; top: 10px; right: 10px;
                        background: black; color: white; padding: 20px;
                        z-index: 999999; border-radius: 8px;">
                <h3>🎥 Record Mode</h3>
                <p>화면을 클릭하여 탐색하세요</p>
                <p>캡처된 화면: <span id="captured-count">0</span></p>
                <button id="capture-btn">📸 현재 화면 캡처</button>
                <button id="done-btn">✅ 완료</button>
            </div>
        `;
        document.body.appendChild(recordUI);

        // 이벤트 리스너
        window.__draftify_done = false;
        window.__draftify_capture = false;

        document.getElementById('capture-btn').onclick = () => {
            window.__draftify_capture = true;
        };

        document.getElementById('done-btn').onclick = () => {
            window.__draftify_done = true;
        };
    ''')

    print("\n🎥 Record 모드 시작")
    print("=" * 50)
    if expected_screens:
        print(f"예상 화면: {', '.join(expected_screens)}")
    print("\n📌 사용자 가이드:")
    print("1. 각 화면을 차례로 탐색하세요")
    print("2. 새 화면이 나타나면 '📸 현재 화면 캡처' 클릭")
    print("3. 모든 화면 캡처 후 '✅ 완료' 클릭")
    print("=" * 50)

    # 메인 루프
    while True:
        # 100ms마다 체크
        await asyncio.sleep(0.1)

        # 완료 버튼 확인
        done = await page.evaluate('window.__draftify_done')
        if done:
            print("\n✅ Record 완료!")
            break

        # 캡처 버튼 확인
        should_capture = await page.evaluate('window.__draftify_capture')
        if should_capture:
            # 캡처 플래그 리셋
            await page.evaluate('window.__draftify_capture = false')

            # 화면 이름 입력 받기
            screen_name = input(f"\n화면 이름 입력 (예: quiz, result): ").strip()
            if not screen_name:
                screen_name = f"screen_{len(captured_screens) + 1}"

            # 스크린샷 캡처
            screenshot_path = f"{output_dir}/screenshots/{screen_name}.png"
            await page.screenshot(path=screenshot_path)

            # DOM 상태 캡처
            dom_state = await capture_dom_state(page)

            # 저장
            captured_screens.append({
                'name': screen_name,
                'url': page.url,
                'screenshot': f"screenshots/{screen_name}.png",
                'dom': dom_state,
                'timestamp': time.time()
            })

            # UI 업데이트
            await page.evaluate(f'''
                document.getElementById('captured-count').textContent = {len(captured_screens)};
            ''')

            print(f"✅ '{screen_name}' 캡처 완료 ({len(captured_screens)}/{len(expected_screens) if expected_screens else '?'})")

    return captured_screens


async def capture_dom_state(page):
    """
    현재 DOM 상태 캡처
    """
    return await page.evaluate('''
        ({
            title: document.title,
            h1: document.querySelector('h1')?.textContent || '',
            h2: document.querySelector('h2')?.textContent || '',
            buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()),
            inputs: Array.from(document.querySelectorAll('input')).map(i => ({
                type: i.type,
                placeholder: i.placeholder,
                name: i.name
            })),
            links: Array.from(document.querySelectorAll('a')).map(a => ({
                text: a.textContent.trim(),
                href: a.href
            })),
            elementCount: document.querySelectorAll('*').length
        })
    ''')
```

---

### Phase 3: 결과 생성

```python
def generate_crawl_result_from_record(captured_screens, base_url, max_pages, source_dir, expected_screens):
    """
    Record 모드 결과를 crawling-result.json 형식으로 변환
    """

    return {
        'metadata': {
            'mode': 'record',
            'timestamp': datetime.now().isoformat(),
            'crawling_strategy': 'record_mode',
            'total_pages': len(captured_screens),
            'max_depth': 0,
            'max_pages': max_pages,
            'base_url': base_url,
            'source_dir_provided': bool(source_dir),
            'expected_screens': expected_screens
        },
        'pages': [
            {
                'url': screen['url'],
                'screen_name': screen['name'],
                'screenshot': screen['screenshot'],
                'dom': screen['dom'],
                'depth': 0,  # Record 모드는 깊이 개념 없음
                'discoveredBy': 'user_interaction'
            }
            for screen in captured_screens
        ],
        'links': [],  # Record 모드는 링크 추출 안 함
    }
```

---

## 자동 감지 개선 (선택적)

### DOM 변화 자동 감지

```python
async def auto_detect_screen_changes(page):
    """
    사용자 클릭 시 DOM 변화 자동 감지
    (선택적 기능 - 사용자가 캡처 버튼 누르지 않아도)
    """

    previous_state = await get_page_signature(page)

    # MutationObserver 주입
    await page.evaluate('''
        window.__draftify_changes = [];

        const observer = new MutationObserver((mutations) => {
            // 큰 변화만 감지 (전체 화면 교체)
            const significantChange = mutations.some(m => {
                return m.addedNodes.length > 5 || m.removedNodes.length > 5;
            });

            if (significantChange) {
                window.__draftify_changes.push({
                    timestamp: Date.now(),
                    mutations: mutations.length
                });
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    ''')

    # 변화 감지 시 자동으로 캡처 제안
    while True:
        await asyncio.sleep(1)

        changes = await page.evaluate('window.__draftify_changes')
        if changes and len(changes) > 0:
            # 변화 플래그 리셋
            await page.evaluate('window.__draftify_changes = []')

            # 현재 상태 확인
            current_state = await get_page_signature(page)

            if current_state != previous_state:
                print("\n🔔 화면 변화 감지! 캡처하시겠습니까? (y/n): ", end='')
                answer = input().strip().lower()

                if answer == 'y':
                    # 자동 캡처
                    await trigger_capture()

                previous_state = current_state
```

---

## crawling-result.json 스키마 확장

```json
{
  "metadata": {
    "mode": "record",
    "timestamp": "2025-12-27T10:30:00Z",
    "crawling_strategy": "record_mode",
    "total_pages": 5,
    "max_depth": 0,
    "max_pages": 50,
    "base_url": "https://wordcrack.world",
    "source_dir_provided": true,
    "expected_screens": ["home", "quiz", "result", "leaderboard", "settings"]
  },
  "pages": [
    {
      "url": "https://wordcrack.world/",
      "screen_name": "home",
      "screenshot": "screenshots/home.png",
      "dom": {
        "title": "Word Crack World",
        "h1": "Word Crack World",
        "h2": "카테고리를 선택하여 퀴즈를 시작하세요!",
        "buttons": ["Movies", "Songs", "Books"],
        "inputs": [],
        "elementCount": 63
      },
      "depth": 0,
      "discoveredBy": "user_interaction"
    },
    {
      "url": "https://wordcrack.world/",
      "screen_name": "quiz",
      "screenshot": "screenshots/quiz.png",
      "dom": {
        "title": "Word Crack World",
        "h1": "Movies Quiz",
        "buttons": ["Submit Answer", "Skip"],
        "inputs": [
          {"type": "text", "placeholder": "Enter your answer", "name": "answer"}
        ],
        "elementCount": 45
      },
      "depth": 0,
      "discoveredBy": "user_interaction"
    }
  ],
  "links": [],
}
```

---

## 에러 처리 (상세)

### 1. 브라우저 연결 끊김 / 크래시

**문제**:
```python
# Record 모드 실행 중 브라우저가 닫히거나 크래시
page = await chrome_open(url)
# 사용자가 브라우저 창을 닫음 ❌
```

**에러 처리**:
```python
import hashlib
import os

def get_recovery_path(url):
    """
    URL 해시 기반 고정 복구 파일 경로 생성
    프로젝트명과 무관하게 동일 URL은 동일 경로
    """
    url_hash = hashlib.md5(url.encode()).hexdigest()[:12]
    recovery_dir = os.path.expanduser("~/.draftify/record-sessions")
    os.makedirs(recovery_dir, exist_ok=True)
    return f"{recovery_dir}/{url_hash}.recovery.json"

async def record_mode_with_recovery(url, source_dir, output_dir):
    """
    브라우저 크래시 복구 로직 포함

    복구 파일은 ~/.draftify/record-sessions/{url-hash}.recovery.json에 저장
    → --output 옵션 없이도 동일 URL 재실행 시 복구 가능
    """

    # 1. 이전 세션 확인 (URL 해시 기반 고정 경로)
    recovery_file = get_recovery_path(url)
    previous_session = load_recovery_file(recovery_file) if os.path.exists(recovery_file) else None

    if previous_session:
        print("\n⚠️ 이전 Record 세션 발견!")
        print(f"캡처된 화면: {len(previous_session['screens'])}개")
        print("\n다음 중 선택하세요:")
        print("1. 이어서 계속")
        print("2. 처음부터 다시 시작")
        choice = input("선택 (1/2): ").strip()

        if choice == '1':
            captured_screens = previous_session['screens']
            expected_screens = previous_session['expected_screens']
            print(f"\n✅ {len(captured_screens)}개 화면 복구됨")
        else:
            captured_screens = []
            expected_screens = infer_screens_from_source(source_dir)
    else:
        captured_screens = []
        expected_screens = infer_screens_from_source(source_dir)

    try:
        # 2. Chrome 열기
        page = await chrome_open(url)

        # 3. 브라우저 종료 이벤트 감지
        page.on('close', lambda: save_recovery_file(recovery_file, {
            'screens': captured_screens,
            'expected_screens': expected_screens,
            'timestamp': datetime.now().isoformat()
        }))

        # 4. Record 모드 실행
        await inject_record_ui(page, expected_screens, captured_screens)

        # ... (기존 로직)

        # 5. 정상 완료 시 복구 파일 삭제
        os.remove(recovery_file)

    except BrowserDisconnectedError:
        print("\n❌ 브라우저 연결이 끊겼습니다.")
        print(f"✅ {len(captured_screens)}개 화면이 자동 저장되었습니다.")
        print("\n다시 실행하면 이어서 계속할 수 있습니다.")
        save_recovery_file(recovery_file, {
            'screens': captured_screens,
            'expected_screens': expected_screens,
            'timestamp': datetime.now().isoformat()
        })
        raise
```

---

### 2. 사용자 중간 포기 (불완전 캡처)

**문제**:
```python
# 10개 화면 중 3개만 캡처하고 "완료" 클릭
# → 나머지 7개는?
```

**에러 처리**:
```python
def validate_record_result(captured_screens, expected_screens):
    """
    Record 결과 검증 및 부분 성공 처리
    """

    if not expected_screens:
        # 소스코드 추론 실패 → 캡처한 화면만으로 진행
        if len(captured_screens) == 0:
            raise RecordModeError("최소 1개 화면이 필요합니다.")
        return True  # ✅ 부분 성공 허용

    # 소스코드에서 예상 화면 목록이 있는 경우
    captured_names = {s['name'] for s in captured_screens}
    expected_names = set(expected_screens)

    missing = expected_names - captured_names
    completion_rate = len(captured_names) / len(expected_names)

    if missing:
        print(f"\n⚠️ 경고: 다음 화면이 캡처되지 않았습니다:")
        for screen in missing:
            print(f"  - {screen}")

        print(f"\n완성도: {completion_rate:.0%} ({len(captured_names)}/{len(expected_names)})")

        # 최소 50% 이상 캡처되었으면 부분 성공
        if completion_rate >= 0.5:
            print("\n계속하시겠습니까? (y/n): ", end='')
            answer = input().strip().lower()

            if answer == 'y':
                print("\n⚠️ 부분 성공으로 진행합니다.")
                print("누락된 화면은 validation-report.md에 기록됩니다.")
                return True  # ✅ 부분 성공
            else:
                print("\nRecord 모드를 다시 시작하세요.")
                raise RecordModeError("사용자가 부분 성공을 거부했습니다.")
        else:
            # 50% 미만 → 재시작 권장
            print("\n❌ 완성도가 너무 낮습니다 (최소 50% 필요)")
            print("Record 모드를 다시 시작하세요.")
            raise RecordModeError(f"완성도 부족: {completion_rate:.0%} (최소 50% 필요)")

    return True  # ✅ 완전 성공
```

**부분 성공 시 validation-report.md에 기록**:
```markdown
## ⚠️ 누락된 화면 (Record 모드)

다음 화면이 캡처되지 않았습니다:
- `leaderboard`: 순위표 화면
- `settings`: 설정 화면

**권장 조치**:
1. Record 모드를 다시 실행하여 누락 화면 추가 캡처
2. 또는 수동으로 화면정의서에 해당 섹션 작성
```

---

### 3. 소스코드 추론 실패

**문제**:
```python
expected_screens = infer_screens_from_source(source_dir)
# → 빈 리스트 반환 ❌
# → 사용자는 몇 개 화면을 캡처해야 하는지 모름
```

**에러 처리**:
```python
def infer_screens_from_source(source_dir):
    """
    소스코드에서 화면 목록 추론 (실패 가능)
    """

    if not source_dir:
        return []  # 소스코드 미제공

    screens = set()

    try:
        # 패턴 1, 2, 3 시도
        # ... (기존 로직)

        if len(screens) == 0:
            print("\n⚠️ 소스코드에서 화면 목록을 자동으로 추론할 수 없습니다.")
            print("Record 모드는 계속 진행되지만, 진행도 표시가 불가능합니다.")
            print("\n수동으로 예상 화면 개수를 입력하시겠습니까? (y/n): ", end='')

            if input().strip().lower() == 'y':
                count = int(input("예상 화면 개수: "))
                return [f"screen_{i+1}" for i in range(count)]  # 임시 이름
            else:
                return []  # 빈 리스트 → 진행도 없이 진행

        return list(screens)

    except Exception as e:
        print(f"\n⚠️ 소스코드 분석 실패: {e}")
        print("Record 모드는 계속 진행됩니다.")
        return []
```

---

### 4. Chrome DevTools MCP 연결 실패

**문제**:
```python
page = await chrome_devtools_mcp.open(url)
# → MCP 서버 응답 없음
```

**에러 처리**:
```python
async def chrome_open_with_retry(url, max_retries=3):
    """
    Chrome 열기 (재시도 포함)
    """

    for attempt in range(max_retries):
        try:
            page = await chrome_devtools_mcp.open(url)
            return page

        except MCPConnectionError as e:
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt  # 지수 백오프: 1초, 2초, 4초
                print(f"\n⚠️ Chrome 연결 실패 (시도 {attempt+1}/{max_retries})")
                print(f"   {wait_time}초 후 재시도...")
                await asyncio.sleep(wait_time)
            else:
                print("\n❌ Chrome DevTools MCP 연결 실패")
                print("\n해결 방법:")
                print("1. Chrome DevTools MCP가 실행 중인지 확인")
                print("2. /mcp 명령어로 MCP 상태 확인")
                print("3. Claude Code 재시작")
                raise

    raise RecordModeError("Chrome 연결 실패")
```

---

### 5. 스크린샷 저장 실패

**문제**:
```python
await page.screenshot(path=screenshot_path)
# → 디스크 용량 부족, 권한 문제
```

**에러 처리**:
```python
async def capture_screenshot_safe(page, screen_name, output_dir):
    """
    안전한 스크린샷 캡처 (에러 처리 포함)
    """

    screenshot_path = f"{output_dir}/screenshots/{screen_name}.png"

    try:
        # 1. 디렉토리 확인 및 생성
        os.makedirs(os.dirname(screenshot_path), exist_ok=True)

        # 2. 스크린샷 캡처
        await page.screenshot(path=screenshot_path)

        # 3. 파일 크기 확인
        file_size = os.path.getsize(screenshot_path)
        if file_size == 0:
            raise Exception("빈 파일 생성됨")

        return screenshot_path

    except PermissionError:
        print(f"\n❌ 권한 오류: {screenshot_path}")
        print("출력 디렉토리 권한을 확인하세요.")
        raise

    except OSError as e:
        if "No space left" in str(e):
            print(f"\n❌ 디스크 용량 부족")
            print(f"필요 공간: ~{len(captured_screens) * 2}MB")
            raise
        else:
            print(f"\n❌ 스크린샷 저장 실패: {e}")
            raise

    except Exception as e:
        print(f"\n⚠️ 스크린샷 캡처 실패: {e}")
        print("이 화면은 스크린샷 없이 진행됩니다.")
        return None  # ⚠️ 부분 성공 (DOM만 캡처)
```

---

### 6. 에러 요약 및 복구 전략

| 에러 유형 | 심각도 | 복구 전략 | 부분 성공 허용 |
|----------|--------|-----------|---------------|
| **브라우저 크래시** | 🟠 MODERATE | 자동 저장 + 재시작 시 복구 | ✅ YES |
| **사용자 중간 포기** | 🟡 LOW | 50% 이상 캡처 시 부분 성공 | ✅ YES |
| **소스코드 추론 실패** | 🟢 MINOR | 진행도 없이 계속 진행 | ✅ YES |
| **MCP 연결 실패** | 🔴 CRITICAL | 3회 재시도, 실패 시 중단 | ❌ NO |
| **스크린샷 실패** | 🟡 LOW | DOM만 캡처, 계속 진행 | ✅ YES |

---

### 7. 에러 로깅

모든 에러는 `outputs/{project}/logs/record-mode.log`에 기록:

```python
import logging

logger = logging.getLogger('record-mode')
logger.setLevel(logging.DEBUG)

# 파일 핸들러
fh = logging.FileHandler(f'{output_dir}/logs/record-mode.log')
fh.setLevel(logging.DEBUG)

# 콘솔 핸들러
ch = logging.StreamHandler()
ch.setLevel(logging.INFO)

# 포맷
formatter = logging.Formatter('[%(asctime)s] %(levelname)s: %(message)s')
fh.setFormatter(formatter)
ch.setFormatter(formatter)

logger.addHandler(fh)
logger.addHandler(ch)

# 사용 예시
logger.info("Record 모드 시작")
logger.debug(f"예상 화면: {expected_screens}")
logger.error(f"브라우저 크래시 발생: {e}")
```

---

## 통합: Phase 1 크롤링 알고리즘 수정

```python
async def phase1_intelligent_crawling(url, options):
    """
    Tier 순차 적용 + Record 모드
    """

    # Record 모드 확인
    if options.record:
        print("\n🎥 Record 모드 활성화\n")

        # Phase 1: 준비
        context = await record_mode_phase1(url, options.source_dir, options.output_dir)

        # Phase 2: 사용자 인터랙션
        captured_screens = await record_mode_phase2(
            context['page'],
            context['expected_screens'],
            context['output_dir']
        )

        # Phase 3: 검증
        # validate_record_result raises RecordModeError if validation fails
        validate_record_result(captured_screens, context['expected_screens'])

        # Phase 4: 결과 생성
        result = generate_crawl_result_from_record(
            captured_screens,
            url,
            options.max_pages,
            options.source_dir,
            context['expected_screens']
        )

        # crawling-result.json 저장
        save_json(result, f"{context['output_dir']}/analysis/crawling-result.json")

        return result

    # 기존 자동 크롤링 (Tier 1 → 2A → 2B → 2C → 3)
    else:
        # ... 기존 로직
        pass
```

---

## 구현 우선순위

### Phase 1 (MVP) - 기본 Record 모드

- [x] CLI `--record` 옵션
- [x] Chrome 열기
- [x] Record UI 주입
- [x] 수동 캡처 버튼
- [x] 스크린샷 저장
- [x] DOM 상태 캡처
- [x] crawling-result.json 생성

**예상 구현 시간**: 8-12시간

### Phase 2 (개선) - 자동 감지

- [ ] DOM 변화 자동 감지
- [ ] 자동 캡처 제안
- [ ] 소스코드에서 화면 목록 추론
- [ ] 진행도 표시

**예상 구현 시간**: 2-3시간

### Phase 3 (최적화) - UX 개선

- [ ] 브라우저 내 UI 개선 (React 컴포넌트)
- [ ] 키보드 단축키 (Space: 캡처, Esc: 완료)
- [ ] 캡처 미리보기
- [ ] 되돌리기 기능

**예상 구현 시간**: 3-4시간

---

## 성공 기준

### 최소 성공 조건

- ✅ State 기반 SPA에서 스크린샷 캡처 가능
- ✅ crawling-result.json 생성 성공
- ✅ 화면정의서 생성 가능 (스크린샷 포함)

### 목표 성공 조건

- ✅ 사용자가 5분 이내에 5개 화면 캡처
- ✅ 소스코드 제공 시 화면 목록 자동 추론
- ✅ 빠뜨린 화면 경고

---

## 사용자 가이드 (예시)

```markdown
### Record 모드 사용법

1. **명령어 실행**:
   ```bash
   /auto-draft --url https://your-mvp.com --record --source-dir ./source
   ```

2. **브라우저가 열리면**:
   - 오른쪽 상단에 Record UI가 표시됩니다
   - 예상 화면 목록이 표시됩니다 (소스코드 제공 시)

3. **각 화면 캡처**:
   - 앱을 정상적으로 사용하여 각 화면으로 이동
   - 새 화면이 나타나면 "📸 현재 화면 캡처" 버튼 클릭
   - 화면 이름 입력 (예: login, signup, dashboard)

4. **완료**:
   - 모든 화면 캡처 후 "✅ 완료" 버튼 클릭
   - 기획서 생성 시작

**팁**:
- 소스코드를 제공하면 화면 목록을 자동으로 추론합니다
- 빠뜨린 화면이 있으면 경고가 표시됩니다
```

---

## 다음 단계

1. ✅ Record 모드 상세 설계 완료 (이 문서)
2. ✅ implementation-checklist.md 업데이트
3. ✅ PRD 입력 옵션 업데이트 (`--record` 추가)
4. Phase 1 MVP 구현 시작
