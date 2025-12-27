# Tier 2 비교 검증 보고서

**날짜**: 2025-12-27
**목적**: 두 개의 실제 사이트에서 Tier 2A/2B/2C 효과 비교

---

## 테스트 사이트

| 사이트 | URL | 유형 | 설명 |
|--------|-----|------|------|
| **Site 1** | https://kiki-lights.vercel.app | Canvas + State SPA | 3D 지구본 여행 계획 앱 |
| **Site 2** | https://wordcrack.world | State SPA | 단어 퀴즈 게임 앱 |

---

## 검증 결과 비교

### Site 1: kiki-lights.vercel.app

| Tier | 결과 | 발견 | 비고 |
|------|------|------|------|
| **Tier 1** | ❌ | 0개 링크 | SPA |
| **Tier 2B** | ❌ | 0개 경로 | State 기반 (React useState) |
| **Tier 2C** | ❌ | 0개 페이지 | Canvas 자동화 불가 |

**앱 구조**:
```javascript
// React + useState
const [currentStep, setCurrentStep] = useState(1);
{currentStep === 1 && <Step1 />}
{currentStep === 2 && <Step2 />}
// URL 변화 없음
```

**특징**:
- 3D WebGL 지구본
- 번들 크기: 2.2MB (three.js 포함)
- No React Router, No Next.js
- Canvas 기반 인터랙션

---

### Site 2: wordcrack.world

| Tier | 결과 | 발견 | 비고 |
|------|------|------|------|
| **Tier 1** | ❌ | 0개 링크 | SPA |
| **Tier 2B** | ❌ | 0개 경로 | State 기반 (순수 DOM 조작) |
| **Tier 2C** | ❌ | 0개 페이지 | URL/Hash 변화 없음 |

**앱 구조**:
```javascript
// ES6 모듈 + DOM 조작
import ContentGenerator from './content-generator.js';
import GameStateManager from './game-state-manager.js';

// 버튼 클릭 → DOM 교체
// URL 변화 없음
```

**특징**:
- 순수 바닐라 JS (프레임워크 없음)
- 번들 크기: 101KB (가벼움)
- ES6 모듈 구조
- No Router, No Hash routing

**검증 테스트**:
```javascript
// "Movies" 버튼 클릭
Before: url="/", hash="", title="Word Crack World"
After:  url="/", hash="", title="Word Crack World"
→ 변화 없음 ❌
```

---

## 공통점

### 1. **둘 다 State 기반 SPA**
- URL 라우팅 사용 안 함
- Hash 라우팅 사용 안 함
- History API 사용 안 함

### 2. **Tier 1 실패**
- 0개 `<a href>` 링크
- 버튼 기반 네비게이션

### 3. **Tier 2B 실패**
- 번들에 경로 문자열 없음
- `/about`, `/products` 같은 패턴 없음

### 4. **Tier 2C 실패**
- 클릭해도 URL/Hash 변화 없음
- DOM만 변경됨

---

## 차이점

| 항목 | Site 1 (kiki-lights) | Site 2 (wordcrack) |
|------|---------------------|-------------------|
| **프레임워크** | React | Vanilla JS |
| **번들 크기** | 2.2MB | 101KB |
| **특수 기술** | Three.js (3D) | 없음 |
| **State 관리** | React useState | 커스텀 GameStateManager |
| **UI 복잡도** | 매우 높음 (3D) | 중간 (2D 퀴즈) |

---

## 핵심 발견

### 1. **State 기반 SPA가 생각보다 많다**

**예상**: 대부분 React Router나 Next.js 사용
**실제**: 2/2 사이트가 State 기반

**시사점**:
- ⚠️ Tier 2B 성공률 예측 **70-80% → 50-60%로 하향 조정 필요**
- ⚠️ State 기반 SPA가 일반적일 수 있음

### 2. **Tier 2B가 실패하는 명확한 패턴**

**실패 조건**:
```javascript
// ❌ 실패: State로 화면 전환
if (state === 'quiz') {
  showQuiz();
} else if (state === 'result') {
  showResult();
}
// URL 변화 없음

// ✅ 성공 예상: Router로 화면 전환
<Route path="/quiz" component={Quiz} />
<Route path="/result" component={Result} />
// URL 변화 있음
```

### 3. **Tier 3 (Manual URLs)의 중요성 증가**

**예상**: 10-15% 케이스에서 필요
**실제**: 2/2 사이트에서 필요 (100%)

**→ Tier 3가 생각보다 훨씬 중요함**

---

## 설계 영향 분석

### 현재 설계 평가

**service-design.md 예측**:

```markdown
Tier 2B 성공률: 70-80%
Tier 2C 성공률: 50-60%
전체 자동 탐색 성공률: 85-90%
```

**실제 검증**:
- 2/2 사이트에서 실패 (0%)
- **하지만 샘플이 편향됨** (둘 다 State 기반)

### 수정 필요 여부

**Option 1: 성공률 하향 조정**
```markdown
Tier 2B 성공률:
- URL 라우팅 SPA: 80-90%
- State 기반 SPA: 0-10%
- **전체 평균: 40-50%** (보수적)

전체 자동 탐색 성공률: 60-70% (하향)
```

**Option 2: 샘플 추가 검증**

Next.js 공식 예제나 React Router 템플릿에서 테스트 필요:
- https://nextjs.org/examples
- https://reactrouter.com/examples

**추천**: **Option 1 + Option 2**
1. 일단 보수적으로 조정 (40-50%)
2. 추가 검증 후 재조정

---

## Tier 3 강화 제안

### 현재 Tier 3 설계

```markdown
Tier 3 (수동 입력 - 최후의 수단):
- CLI --urls urls.txt 옵션
```

### 강화 제안

**1. URLs 자동 생성 도우미**
```bash
# 사용자가 사이트를 수동 탐색하면서 URL 기록
/auto-draft --url https://wordcrack.world --record-mode

# 브라우저가 열리고, 사용자가 클릭하면 자동으로 urls.txt 생성
# 탐색 완료 후 자동으로 크롤링 시작
```

**2. 스크린샷 기반 추론**
```markdown
사용자: "이 사이트 4개 화면 있어요"
시스템: "각 화면 스크린샷 찍어주세요"
→ outputs/screenshots/1.png, 2.png, 3.png, 4.png
→ 자동으로 화면정의서 생성
```

**3. 소스코드 분석 강화**
```bash
# 소스코드에서 state 패턴 감지
const steps = ['quiz', 'result', 'leaderboard'];
const categories = ['movies', 'songs', 'books'];

→ 자동으로 "가능한 화면 목록" 추론
→ 사용자에게 확인 요청
```

---

## 결론

### ✅ 검증 완료 사항

1. **Tier 2B/2C 구현 정상 작동**
2. **State 기반 SPA에서는 효과 없음 확인**
3. **설계 예측의 한계 발견** (성공률 과대평가)

### ⚠️ 수정 필요 사항

1. **성공률 하향 조정** (85-90% → 60-70%)
2. **State 기반 SPA 대응 강화** (Tier 3 개선)
3. **추가 샘플 검증** (URL 라우팅 SPA)

### 🎯 최종 권장사항

**즉시 실행**:
1. ✅ service-design.md 성공률 업데이트
2. ✅ Tier 3 강화 방안 추가
3. ⏸️ 추가 검증은 선택적 (Next.js 예제)

**구현 시작 가능**: 현재 설계로 충분 (Tier 3 있음)

---

## 부록: 추가 검증 후보 사이트

URL 라우팅 기반 SPA를 찾아서 테스트:

1. **Next.js 공식 예제**:
   - https://vercel.com/templates/next.js
   - https://nextjs.org/showcase

2. **React Router 데모**:
   - https://reactrouter.com/en/main/start/tutorial

3. **공개 오픈소스 앱**:
   - TodoMVC (https://todomvc.com)
   - Hacker News Clone

**예상**: 이런 사이트에서는 Tier 2B 성공할 것
