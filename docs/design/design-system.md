# Design System (기초 디자인 시스템)

## 문서 메타데이터
| 항목 | 내용 |
|------|------|
| 세션 ID | draftify-design-v1.0 |
| 작성일 | 2026-01-04 |
| 버전 | v1.0 |

---

## 1. 색상 팔레트

### 1.1 역할 기반 컬러 (Duolingo 스타일: 밝고 친절)

| 역할 | Token | Light | Dark | 사용 예시 |
|------|-------|-------|------|-----------|
| **Primary** | `color-primary` | `#833CF6` (Purple 500) | `#6C2BD9` (Purple 600) | 주요 버튼, 링크 |
| **Secondary** | `color-secondary` | `#3B82F6` (Blue 500) | `#2563EB` (Blue 600) | 보조 버튼, 강조 |
| **Success** | `color-success` | `#22C55E` (Green 500) | `#16A34A` (Green 600) | 완료 상태, 성공 |
| **Warning** | `color-warning` | `#F59E0B` (Amber 500) | `#D97706` (Amber 600) | 경고, 진행 중 |
| **Error** | `color-error` | `#EF4444` (Red 500) | `#DC2626` (Red 600) | 에러, 실패 |
| **Surface** | `color-surface` | `#FFFFFF` | `#F9FAFB` (Gray 50) | 카드, 모달 |
| **Background** | `color-bg` | `#F9FAFB` (Gray 50) | `#111827` (Gray 900) | 페이지 배경 |
| **Text Primary** | `color-text-primary` | `#111827` (Gray 900) | `#F9FAFB` (Gray 50) | 본문 텍스트 |
| **Text Secondary** | `color-text-secondary` | `#6B7280` (Gray 500) | `#9CA3AF` (Gray 400) | 설명 텍스트 |

### 1.2 의미론적 색상 (Semantic Colors)

| 의미 | 색상 | 사용 예시 |
|------|------|-----------|
| 크롤링 중 | `color-warning` (Amber) | "페이지 수집 중..." |
| 분석 중 | `color-primary` (Purple) | "AI 분석 중..." |
| 생성 중 | `color-secondary` (Blue) | "기획서 생성 중..." |
| 완료 | `color-success` (Green) | "PPT 다운로드" |
| 실패 | `color-error` (Red) | "일부 페이지 실패" |

---

## 2. 타이포그래피

### 2.1 폰트 패밀리

| 용도 | 한글 | 영문 | 대체 |
|------|------|------|------|
| **본문** | `"Inter", -apple-system, BlinkMacSystemFont, "Malgun Gothic", "Apple SD Gothic Neo", sans-serif` | `"Inter", system-ui, -apple-system, sans-serif` | |
| **코드** | `"SF Mono", "Monaco", "Inconsolata", "D2Coding", monospace` | `'SF Mono', 'Monaco', 'Inconsolata', monospace` | |
| **강조** | 위와 동일 (Bold 700) | 위와 동일 (Bold 700) | |

**한글 최적화:**
- macOS: Apple SD Gothic Neo
- Windows: Malgun Gothic (맑은 고딕)
- Linux: Noto Sans KR (CDN 로딩 가능)

### 2.2 타이포그래피 스케일 (Type Scale)

| Token | 크기 | 라인 높이 (영문) | 라인 높이 (한글) | 자간 | 사용 예시 |
|-------|------|------------------|------------------|------|-----------|
| `text-xs` | 12px | 16px | 18px | 0 | 캡션, 라벨, 작은 주석 |
| `text-sm` | 14px | 20px | 22px | 0 | 보조 텍스트, 설명 |
| `text-base` | 16px | 24px | 26px | 0 | 본문 (기본) |
| `text-lg` | 18px | 28px | 30px | 0 | 중요 텍스트, 소제목 |
| `text-xl` | 20px | 28px | 32px | 0 | 소제목 (H3) |
| `text-2xl` | 24px | 32px | 36px | 0 | 제목 (H2) |
| `text-3xl` | 30px | 36px | 40px | 0 | 큰 제목 (H1) |

**한글 가독성:**
- 라인 높이: 폰트 크기의 1.6~1.8배 (영문 1.5배 대비 약간 높게)
- 자간: 0 (기본) / -1% (밀집) / 2% (이왕안) - 상황에 따라 조정

### 2.3 폰트 웨이트 (Font Weight)

| Token | 값 | 사용 예시 |
|-------|-----|-----------|
| `font-normal` | 400 | 본문 |
| `font-medium` | 500 | 강조 |
| `font-semibold` | 600 | 소제목 |
| `font-bold` | 700 | 제목 |

---

## 3. 간격 (Spacing)

| Token | 값 | 사용 예시 |
|-------|-----|-----------|
| `space-1` | 4px | 아이콘 패딩, 작은 간격 |
| `space-2` | 8px | 작은 간격, 인라인 요소 |
| `space-3` | 12px | 텍스트와 아이콘 사이 |
| `space-4` | 16px | 기본 간격 (카드 패딩) |
| `space-6` | 24px | 섹션 간격 |
| `space-8` | 32px | 큰 섹션 간격 |
| `space-12` | 48px | 페이지 레벨 간격 |

---

## 4. 기본 UI 컴포넌트

### 4.1 버튼 (Button)

| 상태 | 스타일 | 배경 | 텍스트 | 테두리 | 사용 예시 |
|------|--------|------|--------|--------|-----------|
| **Primary** | `btn-primary` | Primary | White | 없음 | "크롤링 시작", "생성" |
| **Secondary** | `btn-secondary` | Secondary | White | 없음 | "다음", "계속" |
| **Ghost** | `btn-ghost` | 투명 | Primary | Primary | "수동 입력", "취소" |
| **Disabled** | `btn-disabled` | Gray 300 | Gray 500 | 없음 | 진행 중 버튼 |
| **Loading** | `btn-loading` | Primary | White | 없음 + Spinner | "처리 중..." |

**크기 변형:**
| Token | 높이 | 패딩 | 폰트 |
|-------|------|------|------|
| `btn-sm` | 32px | 8px 16px | text-sm |
| `btn-md` | 40px | 10px 20px | text-base |
| `btn-lg` | 48px | 12px 24px | text-lg |

### 4.2 입력 필드 (Input)

| 상태 | 배경 | 테두리 | 텍스트 | 포커스 |
|------|------|--------|--------|--------|
| **기본** | White | Gray 300 | Text Primary | Primary + 그림자 |
| **Error** | White | Error | Error | Error + 그림자 |
| **Disabled** | Gray 100 | Gray 200 | Gray 400 | 없음 |

**구조:**
```
┌─────────────────────────────────────┐
│ Label                      *        │
├─────────────────────────────────────┤
│ Placeholder...                      │
└─────────────────────────────────────┘
│ Helper text or error message        │
```

### 4.3 진행률 표시 (Progress)

#### Linear Progress (선형)
```
크롤링 중... ████████░░░░░░░░ 8/10 페이지
```

#### Step Progress (단계)
```
[✓ 크롤링] → [• 분석] → [○ 생성] → [○ 완료]
```
- `[✓]` 완료 (Success)
- `[•]` 진행 중 (Primary)
- `[○]` 대기 (Gray)

#### Spinner (로딩)
- Primary 색상 회전 애니메이션
- 텍스트와 함께 사용: "AI 분석 중..."

### 4.4 알림 (Alert)

| 유형 | 배경 | 텍스트 | 아이콘 | 사용 예시 |
|------|------|--------|--------|-----------|
| **Info** | Blue 100 | Blue 700 | ℹ️ | "크롤링을 시작합니다" |
| **Success** | Green 100 | Green 700 | ✓ | "기획서 생성 완료" |
| **Warning** | Amber 100 | Amber 700 | ⚠️ | "일부 페이지를 찾지 못했습니다" |
| **Error** | Red 100 | Red 700 | ✕ | "크롤링에 실패했습니다" |

### 4.5 카드 (Card)

```
┌─────────────────────────────────────┐
│  Header (optional)                  │
├─────────────────────────────────────┤
│  Body content                       │
│                                     │
├─────────────────────────────────────┤
│  Footer (optional)                  │
└─────────────────────────────────────┘
```

- 배경: Surface (White)
- 테두리: Gray 200
- 둥근 모서리: 12px
| 그림자: 0 1px 3px rgba(0,0,0,0.1)

### 4.6 파일 업로더 (FileUploader)

```
┌─────────────────────────────────────┐
│  📁 PRD/SDD 파일 업로드              │
│  드래그 앤 드롭 또는 클릭           │
├─────────────────────────────────────┤
│  📄 prd-v1.0.md     [✕]            │
│  📄 sdd-v1.0.md     [✕]            │
└─────────────────────────────────────┘
```

---

## 5. 레이아웃 (Layout)

### 5.1 컨테이너

| Token | 최대 너비 | 패딩 | 사용 |
|-------|-----------|------|------|
| `container-sm` | 640px | 16px | 작은 폼 |
| `container-md` | 768px | 16px | 기본 |
| `container-lg` | 1024px | 24px | 넓은 콘텐츠 |

### 5.2 그리드 (Grid)

12열 기반:
```
┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
│ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │ 8 │ 9 │10 │11 │12 │
└───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
```

---

## 6. 애니메이션 (Animation)

| 용도 | 지속 시간 | 이징 | 사용 예시 |
|------|-----------|------|-----------|
| **빠른** | 150ms | ease-out | 버튼 호버 |
| **기본** | 300ms | ease-in-out | 모달, 드롭다운 |
| **느린** | 500ms | ease-in-out | 페이지 전환 |

---

## 7. 접근성 (Accessibility) 체크리스트

| 항목 | 기준 | 확인 방법 |
|------|------|-----------|
| **대비비** | 최소 4.5:1 (본문), 3:1 (큰 텍스트) | WCAG 계산기 |
| **포커스 링** | 키보드 탐색 시 2px Primary 테두리 | Tab 키 테스트 |
| **버튼 크기** | 최소 44×44px (터치 가능) | 측정 |
| **색상 의존성** | 색상만으로 정보 전달 ❌ | 아이콘/텍스트 추가 |
| **에러 메시지** | 화면 리더기 읽기 가능 | ARIA 라벨 |
| **이미지 대체** | alt 텍스트 제공 | HTML 검증 |

---

## 8. Tailwind CSS 구현 예시

### tailwind.config.js
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#833CF6',
          dark: '#6C2BD9',
        },
        secondary: {
          DEFAULT: '#3B82F6',
          dark: '#2563EB',
        },
        // ... 기타 색상
      },
      spacing: {
        '18': '4.5rem', // 72px
      },
    },
  },
};
```

### globals.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --color-primary: #833CF6;
    --color-secondary: #3B82F6;
    /* ... 기타 변수 */
  }
}

@layer components {
  .btn-primary {
    @apply bg-primary text-white px-5 py-2.5 rounded-lg;
  }
}
```

---

## 9. 국제화 (i18n) 및 한글화

### 9.1 i18n 전략

| 항목 | 결정 | 이유 |
|------|------|------|
| **지원 언어** | 한국어 (기본) + 영어 (선택) | 내부 도구, 국내 기획자 대상 |
| **i18n 라이브러리** | next-intl | TypeScript 친화적, App Router 지원 |
| **번역 파일** | JSON | 쉽게 수정 가능, Git 친화적 |
| **기본 언어** | 한국어 (ko) | 주요 사용자가 국내 기획자 |

### 9.2 번역 파일 구조

```
messages/
├── ko.json           # 한국어 (기본)
└── en.json           # 영어 (선택)
```

#### ko.json 예시
```json
{
  "common": {
    "start": "시작하기",
    "cancel": "취소",
    "retry": "재시도",
    "download": "다운로드"
  },
  "home": {
    "heroTitle": "목업 → 기획서, 30분 만에",
    "heroSubtitle": "AI가 자동으로 기획서를 작성해드립니다"
  },
  "input": {
    "projectName": "프로젝트명",
    "projectNamePlaceholder": "예: todo-mvp-v1",
    "url": "목업 URL",
    "urlPlaceholder": "https://example.com",
    "uploadFiles": "PRD/SDD 파일 업로드",
    "startCrawling": "크롤링 시작"
  },
  "progress": {
    "crawling": "크롤링 중...",
    "analyzing": "AI 분석 중...",
    "generating": "기획서 생성 중...",
    "complete": "완료"
  },
  "manualInput": {
    "title": "일부 페이지를 찾지 못했습니다",
    "description": "누락된 페이지 URL을 직접 입력해주세요",
    "addUrl": "URL 추가",
    "retry": "재시도"
  },
  "complete": {
    "title": "기획서 생성 완료!",
    "downloadPPT": "PPT 다운로드",
    "newProject": "새 프로젝트"
  }
}
```

### 9.3 한글화 가이드라인

| 항목 | 규칙 | 예시 |
|------|------|------|
| **말투** | 전문적이지만 부드럽게 | "기획서를 생성합니다" (O) / "기획서 만듦" (X) |
| **줄임표** | "..." 사용 | "크롤링 중..." |
| **띄어쓰기** | 한글 맞춤법 준수 | "시작하기" (O) / "시작하기" (X) |
| **용어** | 기술 용어는 원문 그대로 | "URL", "PPT", "PRD" 등 |
| **문장 부호** | 한글 문장 부호 사용 | 따옴표 " " (O) / " " (X) |

### 9.4 UI 텍스트 길이 가이드

한글은 영문보다 약 1.3~1.5배 길이를 차지하므로 UI 설계 시 고려:

| 영문 | 한글 (예상) | 대응 |
|------|-------------|------|
| Start (5) | 시작하기 (4) | 유사 |
| Download (8) | 다운로드 (4) | 더 짧음 |
| Crawling... (12) | 크롤링 중... (7) | 더 짧음 |
| Project Name (12) | 프로젝트명 (5) | 더 짧음 |

**팁**: 버튼, 라벨은 최소 20% 여유 공간 둬야 함

### 9.5 날짜/시간 형식

| 항목 | 한국어 형식 | 예시 |
|------|-------------|------|
| **날짜** | YYYY.MM.DD | 2026.01.04 |
| **시간** | HH:mm (24시간) | 14:30 |
| **날짜+시간** | YYYY.MM.DD HH:mm | 2026.01.04 14:30 |
| **소요 시간** | "X분 Y초" | "30분 15초" |

---

## 10. 화면별 디자인 레퍼런스

> **모든 화면 디자인은 `design-style/` 디렉토리에서 참고할 수 있습니다.**

### 10.1 디자인 파일 구조

```
design-style/
├── draftify_welcome/
│   └── landing_page/
│       ├── code.html       # 랜딩 페이지 HTML 코드
│       └── screen.png      # 랜딩 페이지 스크린샷
├── new_project_input_screen/
│   ├── code.html           # 새 프로젝트 입력 화면 HTML
│   └── screen.png          # 새 프로젝트 입력 화면 스크린샷
├── manual_url_input_for_missing_pages/
│   ├── code.html           # 수동 URL 입력 화면 HTML
│   └── screen.png          # 수동 URL 입력 화면 스크린샷
├── process_progress_screen/
│   ├── code.html           # 진행률 표시 화면 HTML
│   └── screen.png          # 진행률 표시 화면 스크린샷
└── ppt_download_complete_screen/
    ├── code.html           # PPT 다운로드 완료 화면 HTML
    └── screen.png          # PPT 다운로드 완료 화면 스크린샷
```

### 10.2 화면별 상세 가이드

#### 화면 1: 랜딩 페이지 (Welcome)

| 항목 | 내용 |
|------|------|
| **경로** | `design-style/draftify_welcome/landing_page/` |
| **HTML** | `code.html` (16.9 KB) |
| **스크린샷** | `screen.png` (2.6 MB) |
| **용도** | 사용자가 처음 접속하는 환영 화면 |
| **참고 사항** | - Hero 섹션, 가치 제안 표시<br>- "시작하기" 버튼으로 프로젝트 입력 화면 이동 |

**구현 시 체크리스트:**
- [ ] Hero 섹션: "목업 → 기획서, 30분 만에"
- [ ] "시작하기" Primary 버튼
- [ ] Duolingo 스타일 밝은 색상 적용

---

#### 화면 2: 새 프로젝트 입력 (New Project Input)

| 항목 | 내용 |
|------|------|
| **경로** | `design-style/new_project_input_screen/` |
| **HTML** | `code.html` (9.4 KB) |
| **스크린샷** | `screen.png` (183 KB) |
| **용도** | 프로젝트명, URL, PRD/SDD 파일 입력 |
| **참고 사항** | - User Flow Scenario 1 단계 1-4 참조<br>- 파일 업로드는 드래그 앤 드롭 지원 |

**구현 시 체크리스트:**
- [ ] 프로젝트명 입력 필드
- [ ] 목업 URL 입력 필드 (유효성 검사)
- [ ] PRD/SDD 파일 업로더 (FileUploader 컴포넌트)
- [ ] "크롤링 시작" Primary 버튼

---

#### 화면 3: 수동 URL 입력 (Manual URL Input)

| 항목 | 내용 |
|------|------|
| **경로** | `design-style/manual_url_input_for_missing_pages/` |
| **HTML** | `code.html` (9.1 KB) |
| **스크린샷** | `screen.png` (161 KB) |
| **용도** | SPA 크롤링 실패 시 누락된 페이지 수동 입력 |
| **참고 사항** | - User Flow Scenario 2 참조<br>- Tier 3 크롤링 전략의 일부 |

**구현 시 체크리스트:**
- [ ] 안내 메시지: "일부 페이지를 찾지 못했습니다"
- [ ] URL 입력 필드 (다중 입력 가능)
- [ ] "추가" 버튼으로 입력 필드 동적 추가
- [ ] "재시도" Secondary 버튼

---

#### 화면 4: 진행률 표시 (Process Progress)

| 항목 | 내용 |
|------|------|
| **경로** | `design-style/process_progress_screen/` |
| **HTML** | `code.html` (10.1 KB) |
| **스크린샷** | `screen.png` (193 KB) |
| **용도** | Phase별 진행률 실시간 표시 |
| **참고 사항** | - User Flow Scenario 1 단계 5-7 참조<br>- Phase 1~4 단계별 진행률 표시 |

**구현 시 체크리스트:**
- [ ] 단계별 진행률: `[✓ 크롤링] → [• 분석] → [○ 생성] → [○ 완료]`
- [ ] Linear Progress 바 (현재 Phase 진행률)
- [ ] 상태 메시지: "페이지 수집 중... (25/50)"
- [ ] 의미론적 색상 적용 (Amber/Blue/Purple/Green)

---

#### 화면 5: PPT 다운로드 완료 (Download Complete)

| 항목 | 내용 |
|------|------|
| **경로** | `design-style/ppt_download_complete_screen/` |
| **HTML** | `code.html` (12.5 KB) |
| **스크린샷** | `screen.png` (283 KB) |
| **용도** | 기획서 생성 완료 후 PPT 다운로드 |
| **참고 사항** | - User Flow Scenario 1 단계 8 참조<br>- 성공 메시지와 다운로드 버튼 |

**구현 시 체크리스트:**
- [ ] 성공 아이콘/메시지: "기획서 생성 완료!"
- [ ] `final-draft.pptx` 다운로드 Primary 버튼
- [ ] 생성된 파일 정보 표시 (페이지 수, 소요 시간)
- [ ] "새 프로젝트" Ghost 버튼

---

### 10.3 디자인 파일 활용 방법

#### 개발 시 워크플로우

1. **화면 참조**: 구현할 화면의 `screen.png`를 먼저 확인
2. **HTML 분석**: `code.html`을 열어 구조와 클래스명 참고
3. **Tailwind 변환**: HTML을 React/Next.js + Tailwind CSS로 변환
4. **컴포넌트 분리**: ShadCN/UI 컴포넌트 활용하여 재구성

#### HTML 파일 분석 예시

```bash
# 화면별 HTML 파일 확인
open design-style/new_project_input_screen/code.html

# 또는 VS Code로 열어 구조 분석
code design-style/process_progress_screen/code.html
```

#### 스크린샷 비교 가이드

| 단계 | 작업 | 도구 |
|------|------|------|
| 1 | 디자인 파일 스크린샷 확인 | `screen.png` |
| 2 | 구현 후 결과 캡처 | 브라우저 개발자 도구 |
| 3 | 픽셀 퍼펙트 비교 | macOS 미리보기 (나란히 보기) |

---

### 10.4 디자인 일관성 유지

| 항목 | design-style 참고 | Design System 본문 |
|------|-------------------|-------------------|
| **색상** | `screen.png`의 실제 색상 | Section 1: 색상 팔레트 |
| **타�이포그래피** | `code.html`의 폰트/크기 | Section 2: 타이포그래피 |
| **간격** | `code.html`의 padding/margin | Section 3: 간격 |
| **컴포넌트** | `code.html`의 버튼/입력필드 | Section 4: UI 컴포넌트 |

---

### 10.5 AI 개발 파트너에게 디자인 전달 시 프롬프트 예시

```
[컨텍스트]
- Design System Section 10.2 참조
- design-style/new_project_input_screen/code.html 분석 필요

[사용자 스토리]
> "목업 URL과 PRD 파일을 올리고 시작 버튼을 누르면 돼요"

[참고 파일]
1. HTML: design-style/new_project_input_screen/code.html
2. 스크린샷: design-style/new_project_input_screen/screen.png

[인수 조건]
1. design-style의 레이아웃을 그대로 재현
2. ShadCN/UI 컴포넌트 활용 (Input, Button, Card)
3. Tailwind CSS v4 토큰 사용
4. Duolingo 스타일 밝은 색상 적용

[자가 수정 지침]
- ❌ design-style 레이아웃 무시 → ✅ screen.png와 동일하게
- ❌ 원시 HTML 그대로 사용 → ✅ React/Next.js로 변환
```

---

**문서 끝**
