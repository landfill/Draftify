# TRD (기술 요구사항 정의서)

## 문서 메타데이터
| 항목 | 내용 |
|------|------|
| 세션 ID | draftify-trd-v1.0 |
| 작성일 | 2026-01-04 |
| 버전 | v1.0 |

---

## 1. 시스템 아키텍처

### 1.1 전체 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                        사용자 (기획자)                          │
│                    로컬 PC에서 독립 실행                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js 웹 프론트엔드                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  URL 입력 │ 파일 업로드 │ 진행률 표시 │ PPT 다운로드       │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      오케스트레이터 (Node.js)                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Phase 1: 크롤링 (Puppeteer/Chrome DevTools MCP)           │ │
│  │  Phase 2: 분석 (Input Analyzer Agent)                      │ │
│  │  Phase 3-1: 병렬 생성 (Policy + Glossary)                  │ │
│  │  Phase 3-2: 순차 생성 (Screen → Process)                   │ │
│  │  Phase 4: PPT 변환 (python-pptx)                           │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
        ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
        │  파일시스템 │ │  LLM API    │ │  출력 폴더  │
        │ JSON/CSV/MD │ │GLM/Gemini   │ │sections/    │
        └─────────────┘ └─────────────┘ └─────────────┘
```

### 1.2 아키텍처 원칙
| 원칙 | 설명 |
|------|------|
| **로컬 우선** | 모든 데이터 로컬 저장, 클라우드 의존 최소화 |
| **Phase 기반** | 크롤링 → 분석 → 생성 → 변환 순차 파이프라인 |
| **병렬 처리** | Phase 3-1 (Policy + Glossary) 병렬 실행 |
| **부분 성공** | 일부 Phase 실패해도 진행, 최소 산출물 제공 |

---

## 2. 권장 기술 스택

### 2.1 프론트엔드

| 항목 | 선택 기술 | 선택 이유 | 대안 | 벤더 락인 리스크 |
|------|-----------|-----------|------|------------------|
| **프레임워크** | **Next.js 15** (App Router) | - AI 코딩 도구 최적화<br>- React 기반 풍생태계<br>- SSR/CSR 유연 | - Vue + Nuxt<br>- SvelteKit | 낮음 (표준 React) |
| **UI 라이브러리** | **ShadCN/UI** | - 토큰 기반 컴포넌트<br>- Tailwind CSS v4 통합<br>- Duolingo 스타일 구현 용이 | - Chakra UI<br>- MUI | 낮음 (소유 코드) |
| **상태 관리** | **Zustand** | - 간단한 API<br>- TypeScript 친화적<br>- 로컬 상태에 충분 | - Redux Toolkit<br>- Jotai | 낮음 |
| **i18n** | **next-intl** | - App Router 공식 지원<br>- TypeScript 친화적<br>- 번역 파일 JSON 기반 | - next-i18next<br>- react-i18next | 낮음 (표준 인터페이스) |
| **스타일** | **Tailwind CSS v4** | - 토큰 기반 디자인 시스템<br>- 런타임 없음<br>- 빠른 빌드 | - CSS Modules<br>- Styled Components | 낮음 |

**i18n 구성:**
```typescript
// i18n.config.ts
export const locales = ['ko', 'en'] as const;
export const defaultLocale = 'ko' as const;
export type Locale = (typeof locales)[number];
```

### 2.2 백엔드

| 항목 | 선택 기술 | 선택 이유 | 대안 | 벤더 락인 리스크 |
|------|-----------|-----------|------|------------------|
| **런타임** | **Node.js** (Next.js API Routes) | - 프론트엔드와 통합<br>- 크롤링 모듈 호환 | - Bun (더 빠름)<br>- Deno | 낮음 |
| **크롤링** | **Puppeteer** + **Chrome DevTools MCP** | - SPA 라우팅 지원<br>- CDP Protocol 직접 제어<br>- 스크린샷 자동 캡처 | - Playwright<br>- Selenium | 중간 (Chrome 의존) |
| **LLM 클라이언트** | **OpenAI SDK** (호환) | - GLM/Gemini 추상화<br>- 표준화된 API | - 각 LLM 전용 SDK | 낮음 (추상화) |

### 2.3 데이터베이스

| 항목 | 선택 기술 | 선택 이유 | 대안 | 벤더 락인 리스크 |
|------|-----------|-----------|------|------------------|
| **저장소** | **파일시스템** (JSON/CSV/MD) | - 로컬 실행에 최적화<br>- DB 설치 불필요<br>- 버전 관리 용이 | - SQLite<br>- Better-SQLite3 | 낮음 (표준 포맷) |
| **스키마** | **TypeScript 인터페이스** | - 타입 안전성<br>- JSON 직렬화 용이 | - Zod<br>- io-ts | 낮음 |

### 2.4 PPT 생성

| 항목 | 선택 기술 | 선택 이유 | 대안 | 벤더 락인 리스크 |
|------|-----------|-----------|------|------------------|
| **PPT 라이브러리** | **python-pptx** | - Python 풍생태계<br>- 템플릿 지원<br>- 이미지 삽입 용이 | - PptxGenJS (JavaScript)<br>- ReportLab (PDF) | 중간 (Python 의존) |
| **실행 방식** | **Child Process** | - Node에서 Python 스크립트 호출<br>- 표준 입출력으로 통신 | - pythonia (Bridge)<br>- 별개 서비스 | 낮음 |

### 2.5 배포/호스팅

| 항목 | 선택 기술 | 예상 비용 | 확장 전략 |
|------|-----------|-----------|-----------|
| **배포 방식** | **로컬 실행 파일** (Electron 또는 standalone) | - 무료<br>- 사용자가 직접 실행 | v2+: 내부 서버 배포 고려 |
| **패키징** | - Next.js 빌드<br>- Node.js 번들<br>- Python 스크립트 포함 | - | Docker 컨테이너화 |

### 2.6 외부 API/서비스

| 항목 | 서비스 | 대체 옵션 |
|------|--------|-----------|
| **LLM** | GLM (1순위) 또는 Gemini API | - OpenAI GPT-4<br>- Claude API<br>- 로컬 LLM (Ollama) |
| **MCP** | Chrome DevTools MCP | - Puppeteer 직접 제어<br>- Playwright CDP |

---

## 3. 데이터베이스 설계

### 3.1 파일 구조

```
outputs/<project-name>/
├─ screenshots/              # 스크린샷 (SCR-001_1.png)
├─ analysis/
│  ├─ crawling-result.json  # 크롤링 결과
│  └─ analyzed-structure.json # 분석된 구조
├─ sections/
│  ├─ 01-project-overview.md
│  ├─ 02-user-persona.md
│  ├─ 03-user-stories.md
│  ├─ 04-glossary.md
│  ├─ 06-policy-definition.md
│  ├─ 08-screen-definition.md
│  ├─ 09-process-flow.md
│  └─ 10-success-metrics.md
├─ validation/
│  └─ validation-report.md
└─ final-draft.pptx
```

### 3.2 주요 데이터 스키마

#### crawling-result.json
```typescript
interface CrawlingResult {
  project: string;
  url: string;
  timestamp: string;
  pages: Page[];
}

interface Page {
  id: string;        // SCR-001
  url: string;
  title: string;
  screenshot: string; // 경로
  elements: UIElement[];
}
```

#### analyzed-structure.json
```typescript
interface AnalyzedStructure {
  project: ProjectMeta;
  glossary: Term[];
  policies: Policy[];
  screens: Screen[];
  flows: ProcessFlow[];
}

interface Policy {
  id: string;        // POL-001
  name: string;
  description: string;
  target: string;
  content: string;
}
```

---

## 4. 비기능적 요구사항

| 항목 | 요구사항 | 측정 방법 |
|------|----------|-----------|
| **성능** | 50페이지 30분 내 완료 | 크롤링 10분 + 생성 15분 + PPT 5분 |
| **SPA 지원** | React/Vue/Next.js 라우팅 따라감 | Tier 1: DOM → Tier 2: onClick → Tier 3: 수동 |
| **보안** | 데이터 로컬 저장, LLM만 외부 전송 | 네트워크 모니터링 |
| **확장성** | 파일시스템 → DB 마이그레이션 용이 | 추상화 레이어 |
| **가용성** | 오프라인에서도 크롤링 가능 (LLM 제외) | 로컬 Puppeteer 동작 |
| **유지보수** | 1인 운영, 최소 업데이트 | 로깅, 에러 핸들링 |

---

## 5. 접근제어·권한 모델

v1.0은 **단일 사용자, 로컬 실행**이므로 인증/권한 불필요.

v2+ (내부 공용 서비스) 시:
| 역할 | 권한 |
|------|------|
| 기획자 | 프로젝트 생성/조회/삭제 |
| 개발자 | 생성된 기획서 조회만 |

---

## 6. 데이터 생명주기

| 단계 | 정책 |
|------|------|
| **수집** | 최소 필요 정보만 (URL, 페이지 데이터) |
| **보존** | 프로젝트 폴더로 영구 보존 (사용자 삭제 시까지) |
| **삭제** | 사용자가 프로젝트 폴더 삭제 시 완전 삭제 |
| **익명화** | LLM 전송 시 민감 정보 마스킹 고려 |

---

**문서 끝**
