# Talk — Progress & Roadmap

> 이 문서는 의미 있는 변경(기능 완료, 결정, 환경 변화)이 있을 때마다 같이 업데이트합니다.
> 가장 위가 가장 최신 — append-only 가 아니라 "Status / Done / Next" 살아있는 문서.

## 📌 Status (2026-05-25)

- **Branch**: `claude/language-exchange-marketplace-TZwdw`
- **Stage**: MVP v0.1 — 로컬 SQLite + mock 외부 서비스로 end-to-end 검증 완료
- **Build**: ✅ `next build` 통과 (19 라우트)
- **데모 계정** (password: `password123`):
  - 외국인: `emma@talk.dev`, `kenji@talk.dev`
  - 한국인: `minji@talk.dev`, `junho@talk.dev`, `sora@talk.dev`, `hyuk@talk.dev`

---

## ✅ Done (v0.1 MVP — 2026-05-25)

### Auth & 프로필
- [x] NextAuth Credentials (이메일/비밀번호, bcrypt)
- [x] 가입 시 역할 선택 (KOREAN / FOREIGNER)
- [x] 프로필 편집 (자기소개, 아바타, 국가, 모국어, 시간당 비용, 전문 주제)

### 검색 & 디스커버리
- [x] 튜터 목록 + 텍스트 검색 (이름/소개/전문 주제)
- [x] 랜딩 페이지 (히어로 + 인기 튜터 4명)
- [x] 튜터 상세 (자기소개, 가능 시간 주간 뷰, 리뷰 목록)
- [x] 팔로우 / 언팔로우

### 예약 & 결제
- [x] 호스트 가능 시간 편집기 (요일별 시간대)
- [x] 14일치 슬롯 자동 생성 + 충돌 검사 (현재 호스트 예약과)
- [x] 시간당 비용 × 길이 자동 계산
- [x] Stripe Checkout 통합 (키 있을 때) — `/api/stripe/webhook`
- [x] Mock 결제 경로 (키 없을 때) — `/api/stripe/mock-confirm`

### Zoom & AI 아젠다
- [x] Zoom Server-to-Server OAuth — 결제 완료 시 미팅 자동 생성
- [x] Mock Zoom URL (키 없을 때)
- [x] Anthropic Claude 아젠다 생성 — 학습자 모국어 / 테마 / 요청 토픽 반영
- [x] Mock 아젠다 (키 없을 때, 결정적 출력)
- [x] 아젠다 재생성 버튼
- [x] 8개 기본 커리큘럼 테마 시드

### 리뷰 & 예약 관리
- [x] 세션 종료 후 별점(1~5) + 코멘트 리뷰
- [x] 평균 별점 + 리뷰 수 프로필 표시
- [x] 내 예약 목록 (다가오는 / 지난) — Host/Guest 양쪽 뷰

### 인프라
- [x] Prisma + SQLite (로컬). `provider` 한 줄 바꾸면 PostgreSQL/RDS/Supabase
- [x] `.env.example` — 모든 외부 키 선택, 비워두면 mock 사용
- [x] Tailwind + 커스텀 brand 컬러
- [x] 시드 스크립트 (`npm run db:seed`)

---

## 🚧 In progress

- (없음 — 다음 마일스톤 결정 대기)

---

## 🔜 Next / TODO

### 우선순위 높음
- [ ] **AWS 배포 파이프라인** — 사용자가 결정 필요 (아래 "AWS 배포 옵션" 참고)
  - [ ] Postgres 마이그레이션 (`schema.prisma` provider 교체 + 최초 `migrate dev`)
  - [ ] Dockerfile + ECR
  - [ ] IaC 선택 (CDK / Terraform / SST / Amplify)
  - [ ] Secrets Manager 연동
- [ ] **Timezone-aware 캘린더** — 현재 서버 로컬 시간 기준. 호스트/게스트 각자 IANA TZ 저장
- [ ] **이메일 알림** — 예약 확정 / 24h 전 리마인더 (SES)

### 우선순위 중간
- [ ] 환불 / 취소 워크플로 (24h 룰 + Stripe refund API)
- [ ] 호스트 onboarding 체크리스트 (프로필·가능 시간 미완성 시 가이드)
- [ ] 사전 채팅 (예약 전 짧은 메시지) — DM 또는 폼
- [ ] 결제 직후가 아니라 세션 직전까지 Pending 상태 유지 옵션
- [ ] Saved bookings → Google/Apple Calendar `.ics` 다운로드
- [ ] Browse 필터 (가격대, 별점, 가용성, 전문 주제)
- [ ] 호스트 정산 (Stripe Connect)

### 우선순위 낮음
- [ ] 노쇼 정책 / 분쟁 처리
- [ ] React Native 모바일 앱 (Expo) — API 재사용
- [ ] i18n (영어/일본어/중국어 UI)
- [ ] 다대일 그룹 세션
- [ ] OAuth (Google / Apple / Kakao) 로그인 추가
- [ ] 관리자 대시보드

---

## 🧭 AWS 배포 옵션 (결정 필요)

사용자 본인이 AWS SA 계정 보유. 추천 순:

### A. **GitHub Actions + OIDC + CDK** (강력 추천)
- AWS IAM Role with OIDC trust to GitHub Actions — **장기 키 불필요**
- `cdk deploy` 가 ECR push + ECS Fargate 업데이트 + RDS 마이그레이션
- 장점: 비밀 키가 어디에도 저장되지 않음, PR 머지 즉시 배포
- 작업량: 0.5~1일

### B. **AWS Amplify Hosting** (가장 빠름)
- GitHub 연동 한 번이면 Next.js 자동 빌드/배포
- 환경변수 콘솔에서 설정
- DB는 별도 RDS 또는 Supabase
- 장점: 인프라 코드 거의 없음
- 단점: 커스터마이즈 한계 (예: VPC 내부 통신 제한적)

### C. **ECS Fargate + ALB + RDS** (full-control)
- Dockerfile + Terraform/CDK
- VPC, RDS Postgres, Secrets Manager, CloudWatch
- 장점: 완전한 컨트롤
- 단점: 초기 설정 1~2일

### 🔑 AWS 키를 주면 제가 배포 가능한가?
**기술적으로는 가능, 그러나 권장하지 않습니다.** 이유:
1. 저는 격리된 임시 컨테이너에서 동작 — 세션 종료 시 소멸하지만 그동안 키는 환경에 노출됨
2. 채팅을 통한 장기 키 전달은 감사·회수 어려움
3. 안전한 패턴은: 제가 **IaC 코드 + GitHub Actions workflow 를 작성**하고, 본인이 AWS 콘솔에서 OIDC IAM Role 한 번만 만든 뒤 GitHub repo secret 으로 Role ARN 만 등록 → GitHub Actions 가 short-lived STS 토큰으로 배포

**권장 흐름**:
1. 제가 옵션 A 또는 B 의 코드 + 단계별 가이드를 PR 로 작성
2. 본인이 콘솔에서 OIDC Provider + IAM Role 생성 (안내문 따라 5분)
3. GitHub Actions 가 자동 배포

옵션 B(Amplify) 로 가면 IAM 작업도 거의 없이 첫 배포 가능합니다. 어떤 옵션으로 진행할지 알려주세요.

---

## 📝 Decisions Log

| 날짜 | 결정 | 이유 |
|---|---|---|
| 2026-05-25 | Next.js 14 App Router 단일 코드베이스 | 프론트/백 동시 개발, Vercel·Amplify·ECS 모두 호환 |
| 2026-05-25 | Prisma + SQLite 로컬 시작 | 외부 의존 없이 즉시 데모 가능, 프로덕션은 한 줄로 Postgres 전환 |
| 2026-05-25 | 모든 외부 서비스 mock fallback | 키 없는 리뷰어/개발자도 전체 흐름 체험 가능 |
| 2026-05-25 | Tailwind + 커스텀 brand 컬러 | 컴포넌트 라이브러리 도입 전까지 빠른 일관성 |
| 2026-05-25 | NextAuth Credentials 만 (OAuth 없음) | MVP 범위 축소, OAuth 는 v0.2 |

---

## 🔄 업데이트 룰

새 기능 / 버그 수정 / 결정이 생길 때:
1. `Status` 섹션의 날짜 갱신
2. `Done` 으로 옮기기 (또는 신규 추가)
3. `Next` 에서 제거 / 추가
4. 중요한 트레이드오프는 `Decisions Log` 에 한 줄 추가
5. 같은 커밋에 코드 변경과 함께 푸시 (separately update 하지 않음)
