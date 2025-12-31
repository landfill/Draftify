# Draftify 구현 체크리스트

**버전**: 1.3
**최종 갱신**: 2025-12-29

> **Note**: 이 문서는 구현 체크리스트의 완전한 명세입니다.

---

## 구현 단계

### 1단계: 환경 설정
- [ ] Chrome DevTools MCP 설치 및 설정
- [ ] Claude Agent SDK 설치
- [ ] Python 3.9+ 환경 준비
- [ ] 필요 패키지 설치 (python-pptx, markdown 등)

### 2단계: /auto-draft Skill 구현
- [ ] skill.md 작성 (인자 검증, Main Agent 호출)
- [ ] CLI 옵션 파싱
- [ ] Main Agent Task tool 호출 구현
- [ ] 에러 핸들링 (error-handling.md Section 7.1 참조)

### 2.5단계: 웹 UI 구현
- [ ] Next.js 프로젝트 생성
- [ ] 업로드 화면 (URL, 파일 업로드, 옵션)
- [ ] API Routes 구현
  - [ ] POST /api/draft (Skill 호출 via child_process)
  - [ ] GET /api/status/:id (진행 상태 조회)
- [ ] 진행 상태 화면 (HTTP Polling, 1초 간격)
- [ ] 결과 화면 (다운로드, 미리보기)
- [ ] 세션 관리 (파일 시스템 기반)

### 3단계: auto-draft-orchestrator (Main Agent) 구현
- [ ] agent.md 프롬프트 작성
- [ ] Phase 1-4 워크플로우 제어 로직
- [ ] 서브 에이전트 호출 (Task tool)
- [ ] 에러 핸들링 및 재시도 전략
- [ ] 최소 성공 기준 적용

### 4단계: Phase 1 크롤링 구현
- [ ] Tier 1: DOM 링크 추출
- [ ] Tier 2A: 소스코드 라우트 추출 (--source-dir 제공 시)
- [ ] Tier 2B: 번들 분석 (자동)
- [ ] Tier 2C: 자동 인터랙션 탐색 (선택적)
- [ ] Tier 3: 수동 URL 입력 (--urls 제공 시)
- [ ] Record 모드 (--record 제공 시)
- [ ] URL 정규화 함수
- [ ] 우선순위 계산 함수
- [ ] BFS 알고리즘
- [ ] crawling-result.json 생성

### 5단계: 서브 에이전트 프롬프트 작성
- [ ] input-analyzer.md (Phase 2)
- [ ] policy-generator.md (Phase 3-1)
- [ ] glossary-generator.md (Phase 3-1)
- [ ] screen-generator.md (Phase 3-2)
- [ ] process-generator.md (Phase 3-2)
- [ ] quality-validator.md (Phase 3.5)

### 6단계: Phase 4 구현
- [x] /auto-draft 스킬 (프로젝트 스코프, Phase 4 호출 담당)
- [x] /draftify-ppt 스킬 (프로젝트 스코프)
- [ ] 마크다운 → PPT 변환
- [ ] 스크린샷 임베딩
- [ ] HTML 폴백 (PPT 실패 시)

---

## Phase 1 크롤링 우선순위

### Tier 1 (필수, 1주)
- [ ] DOM 링크 추출 (`<a href>`)
- [ ] sitemap.xml 파싱
- [ ] BFS 알고리즘
- [ ] URL 정규화
- [ ] 스크린샷 캡처

### Tier 2B (권장, 3일)
- [ ] JavaScript 번들 다운로드
- [ ] 경로 패턴 정규식 추출
- [ ] 필터링 (API, 정적 리소스 제외)

### Tier 2A (선택, 3일)
- [ ] Next.js 라우트 추출
- [ ] React Router 파싱
- [ ] Vue Router 파싱

### Tier 2C (선택, 5일)
- [ ] History API 모니터링
- [ ] 안전한 요소 클릭
- [ ] DOM 변화 감지

### Record 모드 (필수, 1주)
- [ ] Record UI 주입
- [ ] 캡처 버튼 이벤트
- [ ] 복구 파일 생성/읽기
- [ ] crawling-result.json (mode: "record")

---

## 검증 항목

### Phase 1 검증
- [ ] Tier 1-3 순차 적용 동작 확인
- [ ] 50페이지 초과 시 우선순위 기반 선택
- [ ] URL 정규화 중복 제거
- [ ] Hash 라우팅 SPA 감지
- [ ] Record 모드 복구 기능

### Phase 2 검증
- [ ] analyzed-structure.json 스키마 준수
- [ ] 최소 1개 screen 존재
- [ ] ID 형식 규칙 준수 (POL-*, SCR-*)

### Phase 3 검증
- [ ] Phase 3-1 → 3-2 순차 실행
- [ ] Phase 3-2 순차 실행 (screen → process)
- [ ] 정책 ID 참조 무결성
- [ ] 화면 ID 참조 무결성 (process → screen)
- [ ] 빈 섹션 생성 (실패 시)

### Phase 3.5 검증
- [ ] validation-report.md 생성
- [ ] PASS/FAIL 판정
- [ ] Broken reference 감지
- [ ] Duplicate ID 감지

### Phase 4 검증
- [ ] PPT 생성 성공
- [ ] 스크린샷 임베딩
- [ ] HTML 폴백 (PPT 실패 시)
- [ ] validation FAIL이어도 생성

---

## 테스트 케이스

### 기본 테스트
1. [ ] 로컬 Todo 앱 (localhost:3000)
2. [ ] Next.js 공식 예제
3. [ ] React Router 예제
4. [ ] State 기반 SPA (Record 모드)
5. [ ] Hash 라우팅 SPA (Record 모드)

### 엣지 케이스 테스트
- [ ] URL 접속 실패 (404)
- [ ] 페이지 < 3개 발견
- [ ] 50페이지 초과
- [ ] input-analyzer 실패
- [ ] validation FAIL
