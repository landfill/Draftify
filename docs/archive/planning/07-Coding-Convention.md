# Coding Convention & AI Collaboration Guide (코딩 컨벤션 및 AI 협업 가이드)

## 문서 메타데이터
| 항목 | 내용 |
|------|------|
| 세션 ID | draftify-convention-v1.0 |
| 작성일 | 2026-01-04 |
| 버전 | v1.0 |

---

## 1. 핵심 원칙

> **"신뢰하되, 검증하라"**

AI 코딩 파트너가 생성한 코드는 **즉시 신뢰하지 않고**, 반드시 아래 기준으로 검증한 후 커밋합니다:
1. **타입 안전성**: TypeScript 타입 오류 없음
2. **기능 동작**: 인수 조건 충족
3. **스타일 일관성**: 이 가이드라인 준수
4. **보안**: 민감 정보 노출 없음

---

## 2. 프로젝트 설정 및 기술 스택

### 2.1 기본 설정

| 항목 | 설정 |
|------|------|
| **언어** | TypeScript 5+ |
| **런타임** | Node.js 20+ |
| **패키지 매니저** | npm |
| **모듈 시스템** | ES Modules (`import`/`export`) |

### 2.2 기술 스택별 설정 가이드

#### Next.js
```bash
npx create-next-app@latest draftify --typescript --tailwind --app
```

#### ShadCN/UI
```bash
npx shadcn@latest init --style new-york
npx shadcn@latest add button input card alert progress
```

#### Python
```bash
pip install python-pptx
```

---

## 3. 아키텍처 및 모듈성

### 3.1 폴더 구조

```
draftify/
├── app/                    # Next.js App Router
│   ├── page.tsx
│   └── layout.tsx
├── components/
│   ├── ui/                # ShadCN 컴포넌트
│   ├── crawler/           # 크롤링 관련
│   └── analyzer/          # 분석 관련
├── lib/
│   ├── constants.ts       # 상수
│   ├── store.ts           # Zustand 스토어
│   ├── crawler/           # 크롤러 로직
│   ├── agents/            # AI 에이전트
│   └── utils/             # 유틸리티
├── scripts/
│   └── generate_ppt.py    # Python PPT 생성
└── outputs/               # 생성된 기획서
```

### 3.2 컴포넌트 분리 원칙

| 원칙 | 설명 |
|------|------|
| **단일 책임** | 한 컴포넌트는 하나의 기능만 담당 |
| **재사용 가능** | UI 컴포넌트는 `components/ui/`에 공통화 |
| **프레젠테이션 분리** | UI 컴포넌트 vs 로직 컴포넌트 분리 |

---

## 4. AI 소통 원칙 (프롬프트 엔지니어링)

### 4.1 효과적인 지시 방법

AI에게 코드를 생성할 때:
1. **컨텍스트 제공**: 관련 문서 섹션 참조 (예: "TRD Section 2.2 참조")
2. **사용자 스토리 포함**: "기획자 김이 ~~를 원해요"
3. **인수 조건 명시**: "반드시 ~~를 충족해야 해요"
4. **자가 수정 지침**: "❌ ~~ 하지 마, ✅ ~~ 해"

### 4.2 예시 프롬프트 템플릿

#### 템플릿 1: 백엔드 로직 (크롤링)

```
[컨텍스트]
- TRD Section 2.2 (크롤링 기술) 참조
- PRD Epic 1: "URL만 입력하면 SPA 포함 모든 페이지 크롤링"

[사용자 스토리]
> "기존 도구들은 SPA를 크롤링 못해서 직접 캡처했어요"

[기술 명세]
- Puppeteer CDP로 SPA 라우팅 대기
- Tier 1: DOM <a>, <Link>, sitemap.xml
- Tier 2: onClick 핸들러
- Tier 3: 수동 URL 입력

[인수 조건]
1. crawling-result.json 저장
2. 최대 50페이지, 깊이 5
3. URL 정규화

[자가 수정 지침]
- ❌ 단순 HTTP GET → ✅ Puppeteer CDP
- ❌ 수동 입력 미지원 → ✅ Tier 3 추가
```

#### 템플릿 2: 프론트엔드 UI (디자인 파일 참고)

```
[컨텍스트]
- Design System Section 9.2 참조 (화면별 디자인 레퍼런스)
- User Flow Scenario 1 단계 1-4 참조
- design-style/new_project_input_screen/code.html 분석 필요

[사용자 스토리]
> "목업 URL과 PRD 파일을 올리고 시작 버튼을 누르면 돼요"

[디자인 참고 파일]
1. HTML: design-style/new_project_input_screen/code.html
2. 스크린샷: design-style/new_project_input_screen/screen.png

[기술 명세]
- Next.js 15 (App Router) + TypeScript
- ShadCN/UI 컴포넌트 활용 (Input, Button, Card)
- Tailwind CSS v4 토큰 사용
- Duolingo 스타일 밝은 색상 적용 (Design System Section 1)

[인수 조건]
1. design-style의 레이아웃을 그대로 재현
2. 프로젝트명, URL 입력 필드 표시
3. 파일 업로더 (Drag & Drop 지원)
4. "크롤링 시작" Primary 버튼

[자가 수정 지침]
- ❌ design-style 레이아웃 무시 → ✅ screen.png와 동일하게
- ❌ 원시 HTML 그대로 사용 → ✅ React/Next.js로 변환
- ❌ ShadCN/UI 미사용 → ✅ Button, Input, Card 컴포넌트 활용
```

---

## 5. 코드 품질 및 보안

### 5.1 보안 체크리스트

| 항목 | 기준 |
|------|------|
| **환경 변수** | `.env.local`에 LLM API 키 저장, `.gitignore` 포함 |
| **민감 정보** | 로그에 URL/파일 내용 노출 ❌ |
| **LLM 전송** | 필요한 정보만 전송, 민감 데이터 마스킹 |
| **파일 경로** | 사용자 입력 검증, 경로 순회 방지 |

### 5.2 환경 변수 관리

```env
# .env.local
LLM_API_KEY=your_api_key_here
LLM_PROVIDER=glm  # or gemini
MAX_PAGES=50
MAX_DEPTH=5
OUTPUT_DIR=outputs
```

### 5.3 에러 핸들링

```typescript
try {
  const result = await crawlPages(url);
  return { success: true, data: result };
} catch (error) {
  console.error('크롤링 실패:', error);
  return {
    success: false,
    error: error instanceof Error ? error.message : '알 수 없는 오류',
    userMessage: '크롤링에 실패했습니다. URL을 확인해주세요.'
  };
}
```

---

## 6. 테스트 및 디버깅

### 6.1 검증 워크플로우

1. **코드 생성**: AI가 코드 생성
2. **타입 검증**: `npx tsc --noEmit` 실행
3. **린팅**: `npm run lint` 실행
4. **수동 테스트**: Todo MVP로 동작 확인
5. **버그 발견 시**: 원인 분석 → AI에 재요청

### 6.2 디버깅 팁

| 상황 | 해결 방법 |
|------|-----------|
| 크롤링 실패 | Puppeteer 헤드리스 모드로 디버깅 |
| LLM 응답 저조 | Few-shot 프롬프트 추가 |
| 타입 오류 | `any` 대신 명시적 타입 정의 |
| PPT 생성 실패 | Python 로그 확인 |

---

## 7. 공통 작성 규칙

### 7.1 TypeScript

| 규칙 | 설명 | 예시 |
|------|------|------|
| **타입 명시** | `any` 사용 ❌, 인터페이스/타입 별칭 사용 ✅ | `const data: CrawlingResult = ...` |
| **null 처리** | `optional chaining (?.)`, `nullish coalescing (??)` 사용 | `user?.name ?? 'Unknown'` |
| **에러 처리** | `try-catch`로 감싸, 사용자에게 친절한 메시지 | 위 예제 참조 |

### 7.2 명명 규칙 (Naming Conventions)

| 유형 | 규칙 | 예시 |
|------|------|------|
| **컴포넌트** | PascalCase | `InputForm.tsx`, `ProgressBar.tsx` |
| **함수** | camelCase | `crawlPages()`, `generatePPT()` |
| **상수** | UPPER_SNAKE_CASE | `MAX_PAGES`, `OUTPUT_DIR` |
| **타입/인터페이스** | PascalCase | `CrawlingResult`, `Page` |
| **파일명** | kebab-case | `spa-crawler.ts`, `policy-generator.ts` |
| **Enum** | PascalCase | `Phase.Crawling` \| `Phase.Analyzing` |

### 7.3 주석 (Comments)

```typescript
/**
 * SPA 기반 크롤러
 *
 * Puppeteer CDP를 사용하여 SPA 라우팅을 대기하며
 * Tier 1~3 전략으로 페이지를 수집합니다.
 *
 * @param url - 시작 URL
 * @param maxDepth - 최대 깊이 (기본값: 5)
 * @returns 크롤링된 페이지 목록
 *
 * @example
 * const pages = await crawlPages('https://example.com', 3);
 */
export async function crawlPages(
  url: string,
  maxDepth: number = 5
): Promise<Page[]> {
  // ...
}
```

### 7.4 함수 작성

```typescript
// ✅ 좋은 예
async function crawlPages(url: string, options: CrawlOptions): Promise<CrawlResult> {
  const { maxDepth = 5, maxPages = 50 } = options;

  const visited = new Set<string>();
  const pages: Page[] = [];

  // 크롤링 로직...

  return { pages, visited: Array.from(visited) };
}

// ❌ 나쁜 예
async function crawl(url: any, opt: any) {
  // any 타입, 부족한 주석
}
```

---

## 8. Git 커밋 규칙

### 8.1 커밋 메시지 형식

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 8.2 Type 카테고리

| Type | 설명 | 예시 |
|------|------|------|
| `feat` | 새로운 기능 | `feat(crawler): SPA 크롤링 구현` |
| `fix` | 버그 수정 | `fix(ppt): 스크린샷 삽입 오류 수정` |
| `refactor` | 리팩토링 | `refactor(store): Zustand 스토어 재구성` |
| `docs` | 문서 | `docs(readme): 설치 가이드 추가` |
| `test` | 테스트 | `test(crawler): Todo MVP 테스트 추가` |
| `chore` | 기타 | `chore(deps): 의존성 업데이트` |

### 8.3 커밋 예시

```
feat(crawler): SPA 크롤링 구현

- Puppeteer CDP로 SPA 라우팅 대기
- Tier 기반 전략 (DOM → onClick → 수동)
- URL 정규화로 중복 제거

Closes #1
```

---

## 9. AI 협업 워크플로우

### 9.1 새로운 기능 추가 시

1. **요청**: 사용자 스토리와 인수 조건 명확히 정의
2. **컨텍스트**: 관련 문서 섹션 참조 (PRD, TRD 등)
3. **생성**: AI가 코드 생성
4. **검증**: 타입 검사, 린팅, 수동 테스트
5. **수정**: 문제 발견 시 자가 수정 지침으로 재요청
6. **커밋**: 명확한 커밋 메시지로 저장

### 9.2 버그 수정 시

1. **재현**: 문제 상황 정확히 설명
2. **진단**: 원인 분석 (AI 협업 가능)
3. **수정**: 최소한의 변경으로 수정
4. **검증**: 재발 방지 확인
5. **테스트**: 관련 테스트 케이스 추가

---

## 10. i18n (국제화) 코딩 규칙

### 10.1 기본 원칙

| 원칙 | 설명 | 예시 |
|------|------|------|
| **하드코딩 금지** | 모든 UI 텍스트는 번역 파일에서 관리 | `t('input.projectName')` |
| **한국어 우선** | 기본 언어는 한국어 (ko) | `defaultLocale: 'ko'` |
| **타입 안전성** | 번역 키에 타입 적용 | `type TranslationKeys = ...` |
| **추가 가능성** | 영어 등 다른 언어 확장 용이 | `messages/en.json` |

### 10.2 번역 파일 구조

```
messages/
├── ko.json           # 한국어 (기본)
└── en.json           # 영어 (선택)
```

### 10.3 사용 방법

#### 컴포넌트에서 번역 사용

```typescript
import { useTranslations } from 'next-intl';

export function InputForm() {
  const t = useTranslations('input'); // 'input' 네임스페이스

  return (
    <div>
      <label>{t('projectName')}</label>  // "프로젝트명"
      <input placeholder={t('projectNamePlaceholder')} />
    </div>
  );
}
```

#### 번역 키 규칙

| 규칙 | 설명 | 예시 |
|------|------|------|
| **네임스페이스** | 기능별 그룹화 | `input.*`, `progress.*` |
| **계층 구조** | `.`로 구분 | `progress.crawling` |
| **카멜 케이스** | 키 이름은 camelCase | `projectNamePlaceholder` |

### 10.4 금지 패턴

```typescript
// ❌ 나쁜 예: 텍스트 하드코딩
<button>시작하기</button>

// ❌ 나쁜 예: 조건문으로 언어 분기
{locale === 'ko' ? <button>시작하기</button> : <button>Start</button>}

// ✅ 좋은 예: 번역 키 사용
<button>{t('common.start')}</button>
```

### 10.5 번역 추가 시 체크리스트

- [ ] `messages/ko.json`에 번역 추가
- [ ] (선택) `messages/en.json`에 영어 번역 추가
- [ ] 번역 키 타입 정의 (TypeScript)
- [ ] 컴포넌트에서 `useTranslations()` 사용
- [ ] 한글 맞춤법 검사

---

**문서 끝**
