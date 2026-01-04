# TASKS (AI 개발 파트너용 프롬프트 설계서)

## 문서 메타데이터
| 항목 | 내용 |
|------|------|
| 세션 ID | draftify-tasks-v1.0 |
| 작성일 | 2026-01-04 |
| 버전 | v1.0 |

---

## 목표

AI 코딩 파트너가 즉시 협업을 시작할 수 있도록, Draftify 프로젝트를 **단계별 마일스톤**과 **실행 가능한 태스크**로 분석하여 제공합니다.

각 태스크는 PRD, TRD, User Flow, Database Design, Design System 문서를 레퍼런스하며, **컨텍스트, 사용자 스토리, 기술 명세, 인수 조건, 자가 수정 지침**을 포함합니다.

---

## M0: 프로젝트 초기화 및 기술 스택 설정

### [M0-1] Next.js 프로젝트 생성

**컨텍스트 및 목표**
- 사용자: "기획자 김"이 사무실 PC에서 로컬로 실행
- 목표: Duolingo처럼 밝고 친절한 UX를 가진 웹사이트 형태의 프론트엔드 구축

**사용자 스토리**
> "URL 입력하고 파일 업로드하면 기획서를 만들어주는 웹사이트가 필요해요"

**기술 명세**
- **프레임워크**: Next.js 15 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS v4
- **컴포넌트**: ShadCN/UI (New York style)

**인수 조건**
1. `npx create-next-app@latest` 실행 완료
2. App Router 활성화
3. TypeScript, Tailwind CSS 설정 완료
4. `localhost:3000` 접속 시 기본 페이지 표시

**자가 수정 지침**
- ❌ Pages Router 사용 → ✅ App Router로 변경
- ❌ JavaScript 사용 → ✅ TypeScript로 변경
- ❌ ShadCN 누락 → ✅ `npx shadcn@latest init` 실행

---

### [M0-2] 기술 스택 의존성 설치

**컨텍스트 및 목표**
- TRD Section 2.1~2.4 참조
- 목표: 크롤링(Puppeteer), 상태 관리(Zustand), Python 통합 준비

**사용자 스토리**
> "기술 스택이 미리 준비되어 있어야 바로 개발을 시작할 수 있어요"

**기술 명세**
```bash
npm install zustand puppeteer python-shell
npm install -D @types/puppeteer
npx shadcn@latest add button input label card alert progress
```

**인수 조건**
1. `package.json`에 모든 의존성 포함
2. ShadCN 컴포넌트 `components/ui/`에 생성 완료
3. Puppeteer Chrome 설치 완료

**자가 수정 지침**
- ❌ python-shell 대신 pythonia 사용 → ✅ python-shell 유지 (표준 통신)
- ❌ ShadCN New York style 미적용 → ✅ 재설정

---

### [M0-3] 폴더 구조 및 기본 설정

**컨텍스트 및 목표**
- TRD Section 3.1 (파일 구조) 참조
- 목표: `outputs/` 디렉토리 생성, 경로 상수 정의

**사용자 스토리**
> "프로젝트가 완료되면 outputs 폴더에 기획서와 PPT가 저장되어야 해요"

**기술 명세**
```
draftify/
├── app/                    # Next.js App Router
│   ├── page.tsx           # 메인 페이지
│   └── layout.tsx
├── components/
│   ├── ui/                # ShadCN 컴포넌트
│   └── crawler/           # 크롤링 관련 컴포넌트
├── lib/
│   ├── constants.ts       # 경로 상수 (OUTPUT_DIR)
│   └── store.ts           # Zustand 스토어
└── outputs/               # 생성된 기획서 저장소
```

**인수 조건**
1. `outputs/` 폴더 생성 및 `.gitignore` 등록
2. `lib/constants.ts`에 경로 상수 정의
3. Zustand 스토어 기본 구조 정의

**자가 수정 지침**
- ❌ outputs 폴더가 .gitignore에 없음 → ✅ 추가
- ❌ 경로 하드코딩 → ✅ constants.ts로 중앙화

---

### [M0-4] i18n (한국어) 설정

**컨텍스트 및 목표**
- PRD Section 10 참조 (언어 및 지역 요구사항)
- Design System Section 9 참조 (i18n 및 한글화)
- 목표: next-intl로 한국어 기본 설정, 번역 파일 구조 생성

**사용자 스토리**
> "모든 UI가 한국어로 보였으면 좋겠어요"

**기술 명세**
- 라이브러리: next-intl
- 기본 언어: 한국어 (ko)
- 번역 파일: JSON 형식, `messages/ko.json`

**인수 조건**
1. `npm install next-intl` 설치 완료
2. `i18n.config.ts` 생성 (locale: 'ko', defaultLocale: 'ko')
3. `messages/ko.json` 생성 (Design System Section 9.2 참조)
4. `app/[locale]/` 구조로 라우팅

**자가 수정 지침**
- ❌ 영어 기본 → ✅ 한국어 기본 (ko)
- ❌ 번역 파일 하드코딩 → ✅ JSON 파일로 분리
- ❌ 폴더 구조 미적용 → ✅ app/[locale]/ 구조 사용

---

## M1: 핵심 UI 및 디자인 시스템 구축

### [M1-1] Design System 토큰 정의

**컨텍스트 및 목표**
- Design System 문서 Section 1~4 참조
- 목표: Duolingo 스타일 (밝은 색감, 친절한 UX) 구현

**사용자 스토리**
> "웹사이트가 밝고 친절하게 보였으면 좋겠어요, Duolingo처럼"

**기술 명세**
- Tailwind CSS v4 토큰 기반 색상 정의
- `app/globals.css`에 커스텀 프로퍼티 정의

**인수 조건**
1. Primary: Blue 500, Secondary: Purple 500, Success: Green 500 등 정의
2. 타이포그래피 스케일 (text-xs ~ text-3xl) 정의
3. 간격 스페이스 (space-1 ~ space-8) 정의

**자가 수정 지침**
- ❌ 다크 모드 기본 → ✅ 라이트 모드 기본
- ❌ 어두운 색상 → ✅ Duolingo 밝은 색상

---

### [M1-2] 메인 페이지 레이아웃

**컨텍스트 및 목표**
- User Flow Scenario 1 참조
- Design System Section 9 참조 (화면별 디자인 레퍼런스)
- 목표: URL 입력, 파일 업로드, 진행률 표시 영역 구현

**사용자 스토리**
> "목업 URL과 PRD 파일을 올리고 시작 버튼을 누르면 돼요"

**기술 명세**
- 컴포넌트: `InputForm`, `FileUploader`, `ProgressBar`, `PhaseStep`
- 레이아웃: 중앙 정렬, 카드 기반
- 디자인 참고: `design-style/new_project_input_screen/code.html`

**인수 조건**
1. 프로젝트명 입력 필드 표시
2. URL 입력 필드 (유효성 검사)
3. 파일 업로드 (PRD/SDD/README)
4. "크롤링 시작" 버튼
5. 단계별 진행률 표시 (크롤링 → 분석 → 생성 → 완료)
6. design-style의 `screen.png`와 동일한 레이아웃

**자가 수정 지침**
- ❌ 복잡한 멀티 페이지 → ✅ 단일 페이지 간단 UI
- ❌ 진행률 미표시 → ✅ Phase별 진행률 필수
- ❌ design-style 레이아웃 무시 → ✅ `design-style/new_project_input_screen/screen.png` 참고

---

## M2: 크롤링 구현 (FEAT-1 - MVP 핵심)

### [M2-1] Puppeteer 기반 SPA 크롤러

**컨텍스트 및 목표**
- TRD Section 2.2 (크롤링 기술) 참조
- PRD Epic 1: "URL만 입력하면 SPA 포함 모든 페이지 크롤링"
- 목표: React/Vue/Next.js 라우팅 따라가기

**사용자 스토리**
> "기존 도구들은 SPA를 크롤링 못해서 직접 캡처했어요, 이건 꼭 필요해요"

**기술 명세**
- **Tier 1**: DOM `<a href>`, `<Link>`, `sitemap.xml`
- **Tier 2**: onClick 핸들러 문자열 경로 추출
- **Tier 3**: 수동 URL 입력 지원
- BFS 탐색, 최대 깊이 5, 최대 50페이지
- URL 정규화 (`/home` = `/home/`)

**인수 조건**
1. `lib/crawler/spa-crawler.ts` 구현
2. Puppeteer CDP로 SPA 라우팅 대기
3. `outputs/<project>/analysis/crawling-result.json` 저장
4. 수동 URL 입력 기능

**자가 수정 지침**
- ❌ 단순 HTTP GET으로만 크롤링 → ✅ Puppeteer로 SPA 라우팅 대기
- ❌ URL 정규화 누락 → ✅ 중복 URL 제거
- ❌ 수동 입력 미지원 → ✅ Tier 3 추가

---

### [M2-2] 스크린샷 자동 캡처

**컨텍스트 및 목표**
- PRD Epic 1: "각 페이지 자동 스크린샷 캡처, 화면 잘림 없이"
- 목표: Puppeteer full-page screenshot

**사용자 스토리**
> "스크린샷이 화면 잘림 없이 깔끔하게 나와야 해요"

**기술 명세**
- Puppeteer `page.screenshot({ fullPage: true })`
- 파일명: `SCR-001_1.png`
- 경로: `outputs/<project>/screenshots/`

**인수 조건**
1. 모든 페이지 스크린샷 캡처 완료
2. 화면 잘림 0%
3. 재캡처 기능 (실패 시)

**자가 수정 지침**
- ❌ 뷰포트만 캡처 → ✅ fullPage 옵션
- ❌ 실패 시 재시도 없음 → ✅ 3회 재시도

---

## M3: 분석 및 생성 (FEAT-2)

### [M3-1] Input Analyzer Agent

**컨텍스트 및 목표**
- TRD Section 1.2 Phase 2 참조
- PRD Epic 2: "수집된 정보로 기획서 생성"
- 목표: crawling-result.json + PRD/SDD → analyzed-structure.json

**사용자 스토리**
> "크롤링한 정보와 문서를 분석해서 구조를 만들어줘야 해요"

**기술 명세**
- 입력: crawling-result.json, PRD/SDD 파일
- 출력: analyzed-structure.json (glossary, policies, screens, flows)
- LLM: GLM 또는 Gemini API (선택적)

**인수 조건**
1. `lib/agents/input-analyzer.ts` 구현
2. `outputs/<project>/analysis/analyzed-structure.json` 저장
3. 용어 추출, 정책 ID 부여 (POL-001...), 화면 ID 부여 (SCR-001...)

**자가 수정 지침**
- ❌ ID 체계 없음 → ✅ POL-*, SCR-* ID 부여
- ❌ LLM 필수 → ✅ 선택적 (로컬에서도 동작)

---

### [M3-2] Policy & Glossary Generator (병렬)

**컨텍스트 및 목표**
- TRD Section 1.2 Phase 3-1 참조
- 목표: 정책정의서, 용어사전 병렬 생성

**사용자 스토리**
> "정책정의서와 용어사전이 동시에 생성되면 빠를 것 같아요"

**기술 명세**
- 병렬 실행: `Promise.all([policyGenerator, glossaryGenerator])`
- 출력: `06-policy-definition.md`, `04-glossary.md`

**인수 조건**
1. `lib/agents/policy-generator.ts` 구현
2. `lib/agents/glossary-generator.ts` 구현
3. 병렬 실행으로 시간 단축

**자가 수정 지침**
- ❌ 순차 실행 → ✅ 병렬 실행
- ❌ ID 참조 없음 → ✅ POL-ID 정확히 참조

---

### [M3-3] Screen & Process Generator (순차)

**컨텍스트 및 목표**
- TRD Section 1.2 Phase 3-2 참조
- 목표: 화면정의서 → 프로세스 흐름 (의존성 있음)

**사용자 스토리**
> "화면정의서가 먼저 만들어져야 프로세스 흐름을 만들 수 있어요"

**기술 명세**
- 순차 실행: screen → process
- screen-generator: 스크린샷, UI 요소, 동작 설명
- process-generator: 화면 간 이동, 정책 ID 참조

**인수 조건**
1. `lib/agents/screen-generator.ts` 구현
2. `lib/agents/process-generator.ts` 구현
3. 프로세스에서 화면 ID, 정책 ID 참조

**자가 수정 지침**
- ❌ 병렬 실행 시도 → ✅ 순차 실행 (의존성)
- ❌ 스크린샷 미첨부 → ✅ 스크린샷 경로 포함

---

## M4: PPT 생성 (FEAT-3)

### [M4-1] Python PPT Generator

**컨텍스트 및 목표**
- TRD Section 2.4 참조
- PRD Epic 3: "생성된 기획서를 PPT 형식으로 다운로드"
- 목표: python-pptx로 마크다운 → PPT 변환

**사용자 스토리**
> "최종적으로 PPT 파일이 나와야 해요"

**기술 명세**
- Python 스크립트: `scripts/generate_ppt.py`
- Node에서 Child Process로 호출
- 입력: `sections/*.md`, 출력: `final-draft.pptx`

**인수 조건**
1. python-pptx 설치
2. 모든 섹션 (정책, 화면, 프로세스, 용어) 포함
3. 스크린샷 이미지 삽입

**자가 수정 지침**
- ❌ 템플릿 없음 → ✅ 기본 템플릿 적용
- ❌ 이미지 누락 → ✅ 스크린샷 포함

---

## M5: 테스트 및 배포

### [M5-1] 종단 간 테스트 (Todo MVP)

**컨텍스트 및 목표**
- PRD Section 8 (검증 방법) 참조
- 목표: Todo MVP 10페이지로 프로토타입 검증

**사용자 스토리**
> "Todo 앱으로 먼저 테스트해보고 싶어요"

**기술 명세**
- 대상: http://localhost:3000 (Todo 앱)
- 기대: 10페이지 크롤링, 스크린샷, 기획서 생성, PPT 출력

**인수 조건**
1. 크롤링 성공률 90%+ (9/10페이지)
2. 스크린샷 화면 잘림 0%
3. 30분 내 완료

**자가 수정 지침**
- ❌ 크롤링 실패 → ✅ 수동 URL 입력 지원
- ❌ 30분 초과 → ✅ 조기 종료 (최소 10페이지)

---

### [M5-2] 로컬 실행 패키징

**컨텍스트 및 목표**
- TRD Section 2.5 참조
- 목표: 각 기획자 PC에서 독립 실행 가능한 패키지

**사용자 스토리**
> "별도의 설치 없이 실행 파일만으로 동작하면 좋겠어요"

**기술 명세**
- 옵션 1: Docker 컨테이너
- 옵션 2: Electron (데스크톱 앱)
- 옵션 3: standalone Node.js 번들

**인수 조건**
1. Chrome/Puppeteer 포함
2. Python 포함
3. 더블 클릭으로 실행

**자가 수정 지침**
- ❌ 클라우드 배포 → ✅ 로컬 실행 우선
- ❌ 복잡한 설치 과정 → ✅ 1파일 실행

---

## 태스크 요약

| 마일스톤 | 태스크 수 | 핵심 목표 | 예상 복잡도 |
|----------|-----------|-----------|-------------|
| M0 | 4 | 프로젝트 초기화 및 i18n | 낮음 |
| M1 | 2 | UI 구축 | 낮음 |
| M2 | 2 | 크롤링 (FEAT-1) | 높음 |
| M3 | 3 | 생성 (FEAT-2) | 중간 |
| M4 | 1 | PPT (FEAT-3) | 중간 |
| M5 | 2 | 테스트 및 배포 | 낮음 |
| **합계** | **14** | | |

---

**문서 끝**
