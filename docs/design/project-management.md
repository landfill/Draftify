# Draftify 프로젝트 관리 전략

**버전**: 1.3
**최종 갱신**: 2025-12-29

> **Note**: 이 문서는 프로젝트 관리의 완전한 명세입니다.

---

## 8.1 출력 디렉토리 구조

```
outputs/
├── todo-app/                    # 프로젝트 A
│   ├── screenshots/
│   │   ├── screen-001.png
│   │   └── screen-002.png
│   ├── analysis/
│   │   ├── crawling-result.json
│   │   └── analyzed-structure.json
│   ├── sections/
│   │   ├── 01-cover.md
│   │   ├── 05-glossary.md
│   │   ├── 06-policy-definition.md
│   │   ├── 07-process-flow.md
│   │   ├── 08-screen-definition.md
│   │   └── ...
│   ├── validation/
│   │   └── validation-report.md
│   ├── logs/
│   │   ├── phase1.log
│   │   └── errors.log
│   └── final-draft.pptx
│
├── blog-mvp/                    # 프로젝트 B
│   └── ...
│
└── ecommerce/                   # 프로젝트 C
    └── ...
```

---

## 8.2 프로젝트명 결정 로직

**우선순위**:
1. CLI `--output` 옵션 (명시적 지정) ← **Record 모드에서 권장**
2. PRD 파일의 `project.name` 필드
3. README.md의 첫 번째 제목 (# ...)
4. URL의 `<title>` 태그
5. **URL 도메인 기반 추론**:
   - `https://my-app.vercel.app` → `my-app`
   - `https://example.com/demo` → `example`
   - `http://localhost:3000` → `localhost-3000`
6. 기본값: `mvp-<timestamp>` (최후의 수단, Record 모드 복구 불가)

**예시**:
- `--output todo-app` → `outputs/todo-app/`
- PRD에 `project: { name: "Todo App" }` → `outputs/todo-app/`
- URL `https://wordcrack.world` → `outputs/wordcrack/`
- 기본값 → `outputs/mvp-20251226-143015/`

---

## 8.3 도메인 추론 규칙

```typescript
function inferProjectNameFromURL(url: string): string {
  const parsed = new URL(url);

  // vercel.app, netlify.app: 서브도메인 사용
  if (parsed.hostname.endsWith('.vercel.app') ||
      parsed.hostname.endsWith('.netlify.app')) {
    return parsed.hostname.split('.')[0];  // "my-app"
  }

  // localhost: 포트 포함
  if (parsed.hostname === 'localhost') {
    return `localhost-${parsed.port}`;  // "localhost-3000"
  }

  // 일반 도메인: 메인 도메인만
  const parts = parsed.hostname.split('.');
  return parts.length > 2 ? parts[parts.length - 2] : parts[0];
}
```

---

## 8.4 Record 모드 복구 파일

**경로**: `~/.draftify/record-sessions/{url-hash}.recovery.json`

> URL 해시 기반 고정 경로 사용으로 `--output` 옵션 없이도 동일 URL 재실행 시 자동 복구 가능

**복구 메커니즘**:
- URL을 MD5 해시하여 고유 파일명 생성
- 예: `https://example.com` → `~/.draftify/record-sessions/a1b2c3d4e5f6.recovery.json`
- 프로젝트명과 무관하게 동일 URL은 동일 복구 파일 사용

**복구 시나리오**:
```bash
# 첫 실행 - 3개 화면 캡처 후 브라우저 크래시
$ /auto-draft --url https://example.com --record

# 재실행 - 동일 URL이면 자동 복구 (--output 불필요)
$ /auto-draft --url https://example.com --record
⚠️ 이전 Record 세션 발견!
캡처된 화면: home, quiz, result (3개)
이어서 진행하시겠습니까? (y/n)
```

**상세 설계**: [record-mode-design.md](./record-mode-design.md) 참조

---

## 8.5 버전 관리 (선택)

**향후 계획**: `outputs/{projectName}/versions/` 구조 지원

```
outputs/todo-app/
├── versions/
│   ├── v1-20251226/
│   ├── v2-20251227/
│   └── latest -> v2-20251227/
└── final-draft.pptx
```

**현재 MVP**: 단일 버전만 지원
