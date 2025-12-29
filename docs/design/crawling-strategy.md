# Draftify Phase 1: 크롤링 전략

**버전**: 1.3
**최종 갱신**: 2025-12-29

> **Note**: 이 문서는 Phase 1 크롤링의 완전한 명세입니다. 별도 참조 문서 없이 구현 가능합니다.

---

## 목차

1. [크롤링 전략 개요](#크롤링-전략-개요)
2. [Tier 기반 Fallback 전략](#tier-기반-fallback-전략)
3. [Record 모드 (State 기반 SPA 대응)](#record-모드)
4. [Hash 라우팅 SPA 대응](#hash-라우팅-spa-대응)
5. [URL 정규화 및 우선순위 계산](#url-정규화-및-우선순위-계산)

---

## 크롤링 전략 개요

**목표**: 단일 URL에서 전체 사이트의 모든 페이지를 발견하고 분석

**핵심 알고리즘**: BFS (Breadth-First Search)

**제약 조건**:
- 최대 페이지 수: 50 (기본값, `--max-pages`로 조정 가능)
- 최대 깊이: 5 (기본값, `--max-depth`로 조정 가능)
- 타임아웃: 페이지당 30초
- 50페이지 초과 시: 우선순위 기반 선택

**예상 전체 성공률**: 60-70%
- **URL 라우팅 SPA**: 80-90% 자동 성공
- **State 기반 SPA**: Record 모드 필요 (반자동)

---

## Tier 기반 Fallback 전략

### 순차 적용 원칙

1. **Tier 1** 시도 → 충분하면 종료
2. **Tier 2A** 시도 (소스 제공 시) → 충분하면 종료
3. **Tier 2B** 시도 (항상) → 충분하면 종료
4. **Tier 2C** 시도 (선택적) → 충분하면 종료
5. **자동 크롤링 실패 감지** (< 3개 페이지):
   - Record 모드 권장 메시지 표시
   - 사용자 선택: Record 모드 or Tier 3 or 루트만 크롤링
6. **Tier 3** (최후의 수단)

---

### Tier 1: DOM 링크 (신뢰도 최고)

**발견 방법**:
- `<a href="...">` 링크 태그
- `sitemap.xml` (존재 시)
- React Router `<Link to="...">`
- Next.js `<Link href="...">`

**Hash 링크 처리**:
```markdown
- `<a href="#/about">` 형태 발견 시:
  1. Hash 라우팅 SPA로 판단
  2. 일반 경로 링크 < 3개인 경우:
     - Record 모드가 아니면 → **중단** (사용자 안내)
     - Record 모드이면 → **계속 진행**
  3. 일반 경로 링크 >= 3개인 경우:
     - 일반 링크 우선 크롤링
     - Hash 링크는 무시
```

**충분성 기준**: 10개 이상 발견 시 크롤링 시작

---

### Tier 2A: 소스코드 분석 (정확도 높음)

**적용 조건**: `--source-dir` 옵션 제공 시

**지원 프레임워크**:
- **Next.js App Router**: `app/**/page.tsx` 스캔
  - `app/about/page.tsx` → `/about`
  - `app/products/[id]/page.tsx` → `/products/{id}`
- **Next.js Pages Router**: `pages/**/*.tsx` 스캔
- **React Router**: `src/App.tsx`에서 `<Route path="...">` 파싱
- **Vue Router**: `router/index.js`에서 경로 추출

**성공률**: Next.js 95%, React Router 85%, Vue Router 70%

**충분성 기준**: 10개 이상 발견 시 크롤링 시작

---

### Tier 2B: 번들 분석 (자동, 범용적) ⭐ NEW

**적용 조건**: 항상 (자동)

**동작 원리**:
1. 배포된 JavaScript 번들 다운로드 (index.js, main.js, app.js)
2. 정규식으로 경로 패턴 추출:
   - 문자열 경로: `["/about", "/products", "/contact"]`
   - Next.js 라우트 매니페스트 파싱
   - React Router path 속성: `path: "/dashboard"`
3. 필터링: `/api`, `/static`, `/_next`, `.js`, `.css` 제외

**장점**: 소스코드 없이도 작동, 매우 빠름 (5-10초)

**성공률**: 40-50%

**충분성 기준**: 5개 이상 발견 시 크롤링 시작

---

### Tier 2C: 자동 인터랙션 탐색 (실험적) ⭐ NEW

**적용 조건**: Tier 2A/2B에서 충분한 경로 미발견 시

**동작 원리**:
1. History API (pushState/replaceState) 모니터링
2. 클릭 가능 요소 자동 탐색:
   - `<button>`, `[role="button"]`, `.card`, `.nav-item` 등
   - 네비게이션 요소 우선 클릭
   - 최대 15개 요소 (30-45초 소요)
3. URL 변경 또는 DOM 대폭 변화 감지 시 새 페이지로 인식

**안전장치**: 위험 버튼 제외 (삭제, 로그아웃, 결제, 제출 등)

**성공률**: 50-60% (State 기반 SPA)

**충분성 기준**: 3개 이상 발견 시 크롤링 시작

---

### Tier 3: 수동 입력 (최후의 수단)

**사용 방법**: CLI `--urls urls.txt` 옵션

**사용 시나리오**:
- Canvas/WebGL 기반 복잡한 인터랙션
- 인증 필요 페이지
- 동적 라우팅 (`/user/:id`)의 구체적인 예시 URL
- Hash 라우팅 SPA (`/#/about`, `/#/products`)

---

## Record 모드

### 개요

**목적**: State 기반 SPA 스크린샷 자동 캡처 (~50% 케이스)

**문제**:
```javascript
// wordcrack.world, kiki-lights 같은 앱
URL: / (고정)
State: 'home', 'quiz', 'result'  // React useState

문제:
→ URL 변화 없음
→ Tier 2B/2C 실패
→ 스크린샷 자동 캡처 불가 ❌
```

**해결책**: 사용자가 탐색 + 시스템이 자동 캡처

### CLI 사용법

```bash
/auto-draft --url <url> --record [options]

옵션:
  --record              Record 모드 활성화
  --source-dir <dir>    소스코드 (선택, 화면 목록 추론용)
  --expected-screens N  예상 화면 개수
  --output <name>       프로젝트명 명시 (선택)
```

### 프로젝트명 결정

**프로젝트명 우선순위**:
1. `--output` 옵션 (명시적 지정)
2. PRD `project.name` 필드
3. README.md 첫 번째 제목
4. URL `<title>` 태그
5. 기본값: `mvp-<timestamp>`

### 복구 기능

**복구 파일은 URL 해시 기반 고정 경로에 저장**:
```
~/.draftify/record-sessions/{url-hash}.recovery.json
```

- `--output` 옵션 없이도 동일 URL 재실행 시 자동 복구 가능
- 브라우저 크래시/중단 시 이전 캡처 내용 자동 저장
- 상세 설계: [record-mode-design.md](./record-mode-design.md) 참조

### 워크플로우

1. 소스코드에서 예상 화면 목록 추론 (선택)
2. Chrome 열기 + Record UI 주입
3. 사용자 안내:
   ```
   🎥 Record 모드
   1. 각 화면을 차례로 탐색하세요
   2. 새 화면이 나타나면 '📸 캡처' 버튼 클릭
   3. 모든 화면 완료 후 '✅ 완료' 클릭
   ```
4. 사용자 인터랙션 대기
5. crawling-result.json 생성 (mode: "record")

### 성능

**장점**:
- ✅ State 기반 SPA 100% 지원
- ✅ Canvas/WebGL 앱도 가능
- ✅ 정확한 스크린샷 (실제 사용 화면 그대로)

**단점**:
- ⚠️ 완전 자동 아님 (반자동)
- ⚠️ 사용자 시간 소요 (5-10분)

**예상 시간**:
- 5개 화면: ~5분
- 10개 화면: ~10분

**상세 설계**: record-mode-design.md 참조

---

## Hash 라우팅 SPA 대응

### 문제

```javascript
// Angular.js, 구형 Vue.js, 일부 React 앱
URL: https://example.com/#/about
URL: https://example.com/#/products
URL: https://example.com/#/contact

// Hash만 변경, 서버 요청 없음
// Tier 1-2C 모두 실패
```

**영향도**: 10-15% (레거시 SPA)

### 대응 방법

#### Option A: Record 모드 사용 ⭐ 권장

```bash
/auto-draft --url https://example.com --record --source-dir ./source
```

**이유**:
- ✅ 즉시 사용 가능 (추가 개발 불필요)
- ✅ 100% 성공률 (사용자가 직접 탐색)
- ✅ Canvas/WebGL 앱도 동일 방법으로 대응
- ⚠️ 반자동 (사용자 시간 5-10분 소요)

#### Option B: Tier 2D (Hash 감지) 추가

**구현 시기**: MVP 이후, Phase 2 구현

**예상 성공률**: 40-50%

**제약사항**:
- JavaScript로 동적 생성되는 hash 링크는 발견 어려움
- 여전히 일부 케이스는 Record 모드 필요

**현재 MVP 전략**: Option A (Record 모드) 사용

---

## URL 정규화 및 우선순위 계산

### URL 정규화 규칙

중복 URL 방지:

| 입력 | 출력 | 이유 |
|------|------|------|
| `/home/` | `/home` | 트레일링 슬래시 제거 |
| `/home?utm_source=x` | `/home` | 추적 파라미터 제거 |
| `/home#section` | `/home` | 해시 제거 |
| `/Home` vs `/home` | `/home` | 경로 소문자화 |
| `/page?b=2&a=1` | `/page?a=1&b=2` | 파라미터 정렬 |

**허용된 쿼리 파라미터**: `page`, `tab`, `category`

### 우선순위 계산

50페이지 초과 시 우선순위 점수 기반 선택:

```typescript
function calculatePriority(link: LinkInfo): number {
  let score = 100;  // 기본 점수

  score -= link.depth * 15;             // 깊이 페널티
  score += link.isInMainNav ? 50 : 0;   // 메인 네비게이션 보너스
  score += !link.hasQueryParams ? 30 : 0; // 정적 경로 보너스
  score -= link.isDynamic ? 40 : 0;     // 동적 세그먼트 페널티
  score += tierBonus[link.tier];        // Tier 보너스 (1: +20, 2: +10, 3: 0)

  // 특수 키워드 보너스
  const importantKeywords = ['home', 'about', 'login', 'signup', 'dashboard'];
  if (importantKeywords.some(k => link.url.includes(k))) {
    score += 25;
  }

  return Math.max(0, score);
}
```

**우선순위 점수 해석**:
- **200+**: 최우선 (메인 네비게이션, 정적 경로, 얕은 깊이)
- **100-199**: 높은 우선순위
- **50-99**: 중간 우선순위
- **0-49**: 낮은 우선순위 (50페이지 초과 시 제외 가능)

---

## 자동 크롤링 실패 대응

발견된 페이지 수 < 3개인 경우:

```
⚠️ 자동 크롤링으로 충분한 화면을 발견하지 못했습니다.
발견된 페이지: {count}개

다음과 같은 경우 Record 모드 사용을 권장합니다:
- Hash 라우팅 기반 SPA (예: /#/dashboard)
- State 기반 화면 전환 (URL 변경 없음)
- 인증이 필요한 화면

Record 모드로 재시작하시겠습니까? (y/n)
```

- 사용자가 'y' 선택 시: Record 모드로 자동 재시작
- 사용자가 'n' 선택 시: Tier 3 사용 또는 루트 페이지만 크롤링

---

## 다음 단계

- **Record 모드 상세**: [record-mode-design.md](./record-mode-design.md)
- **데이터 스키마**: [schemas.md](./schemas.md) (crawling-result.json)
- **에러 핸들링**: [error-handling.md](./error-handling.md) (Phase 1 섹션)
