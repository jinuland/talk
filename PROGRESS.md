# Talk — Progress & Roadmap

> 이 문서는 의미 있는 변경(기능 완료, 결정, 환경 변화)이 있을 때마다 같이 업데이트합니다.
> 가장 위가 가장 최신 — append-only 가 아니라 "Status / Done / Next" 살아있는 문서.

## 📌 Status (2026-05-25)

- **Branch**: `claude/language-exchange-marketplace-TZwdw`
- **Stage**: MVP v0.1 — 로컬 SQLite + mock 외부 서비스 / Amplify 배포 준비 완료
- **Build**: ✅ `next build` 통과 (19 라우트)
- **Deploy**: AWS Amplify 옵션 선택. `amplify.yml` + `DEPLOY_AMPLIFY.md` 작성됨. RDS + Amplify Console 작업은 사용자가 수행.
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

### 배포 (AWS Amplify Hosting 옵션)
- [x] `amplify.yml` — preBuild 에서 `sqlite → postgresql` 자동 패치 + `prisma generate` + `db push`
- [x] `RUN_SEED=true` 환경변수 한 번 켜면 첫 배포에서 데모 데이터 시드
- [x] `DEPLOY_AMPLIFY.md` — RDS / Amplify Console / Stripe Webhook / Zoom OAuth / 도메인 / 트러블슈팅 단계별 가이드
- [x] `package.json` 빌드 스크립트 단순화 (`prisma migrate deploy` 제거, migrations 없으니 amplify 가 db push 로 해결)

---

## 🚧 In progress

### Amplify 첫 배포 세션 (2026-05-25 ~ 2026-06-14)
사용자가 임시 STS 자격 + GitHub PAT 제공 → 거의 모든 단계 자동화로 진행.

- [x] **0)** `NEXTAUTH_SECRET` 생성 (자동, /tmp 저장)
- [x] **1)** RDS Postgres `talk-prod` 생성 (CLI, `db.t4g.micro`, PG 16.6, Public, initial DB = `talk`, 자동 backup 7일)
- [x] **2)** Security Group `talk-db-sg` (`sg-06c8faf91beeb6540`) 5432/tcp 0.0.0.0/0 인바운드 추가
- [x] **3)** RDS 가용성 확인 (`available`), endpoint = `talk-prod.ckm1qwbku9nl.ap-northeast-2.rds.amazonaws.com`
- [x] **4)** Amplify 앱 `talk` 생성 (App ID `d10sxkabmueicu`, `WEB_COMPUTE`)
- [x] **5)** Env vars 6개 CLI 로 set (DATABASE_URL, NEXTAUTH_URL, NEXT_PUBLIC_APP_URL, NEXTAUTH_SECRET, RUN_SEED=true, ANTHROPIC_MODEL=claude-sonnet-4-6)
- [x] **6)** GitHub `main` 머지 (PR #2 squash, sha 518f112)
- [x] **7)** Amplify 앱 ↔ GitHub `jinuland/talk` 연결 (PAT 사용)
- [x] **8)** `main` 브랜치 생성 (Next.js SSR / PRODUCTION / auto-build)
- [x] **9)** 빌드 job 1 시작 (RUNNING)
- [ ] **10)** 빌드 SUCCEED 대기 (현재 진행 중)
- [ ] **11)** 동작 확인: 로그인 → 예약 → 결제(mock) → Zoom + 아젠다
- [ ] **12)** `RUN_SEED` 삭제 → 재배포 (sample reviews 중복 누적 방지)
- [ ] **13)** (선택) Anthropic / Stripe / Zoom 실제 키 추가
- [ ] **14)** (선택) 커스텀 도메인 + ACM 인증

배포 URL (활성 대기): https://main.d10sxkabmueicu.amplifyapp.com

상세 가이드: [`DEPLOY_AMPLIFY.md`](./DEPLOY_AMPLIFY.md)

---

## 🔜 Next / TODO

### 우선순위 높음
- [ ] **첫 Amplify 배포 실행** — 사용자 작업 (DEPLOY_AMPLIFY.md 절차)
  - [ ] RDS Postgres 생성 (5분)
  - [ ] Amplify Console 에서 GitHub repo 연결 + env vars 입력
  - [ ] 첫 배포 후 `NEXTAUTH_URL` 보정 + `RUN_SEED` 제거
- [ ] **Prisma migrations 도입** — 운영에서 `db push` 대신 `migrate deploy`. 첫 migration 만 만들면 됨
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

## 🧭 AWS 배포 — Amplify 선택 (2026-05-25)

옵션 1 (Amplify Hosting) 채택. **`DEPLOY_AMPLIFY.md`** 에 단계별 가이드.

### 왜 Amplify
- IaC / Dockerfile 없이 콘솔에서 GitHub 연결만으로 배포
- Next.js 14 SSR + API Routes 자동 인식
- 환경변수 콘솔에서 관리 (Secrets Manager 연동은 v0.2)
- 첫 배포까지 ~30분, 비용 ~$0 (RDS Free Tier + Amplify 무료 한도)

### 자동화된 부분 (`amplify.yml`)
- 매 빌드마다 `sqlite → postgresql` 자동 패치
- `prisma generate` + `prisma db push` (스키마 동기화)
- `RUN_SEED=true` env 가 설정되어 있으면 시드 실행 (첫 배포만 켰다 끄기)

### 사용자가 해야 할 작업
1. RDS Postgres 생성 (콘솔)
2. Amplify Console 에서 GitHub 연결 + env vars 입력
3. 도메인 (선택)
4. Stripe webhook URL 등록 (실제 결제 사용 시)

### 🔑 AWS 키 / 채팅 전달 보안 메모
긴 수명의 IAM Access Key 를 채팅으로 받지 않는 게 베스트 프랙티스 (격리 컨테이너라도 키가 환경/로그에 남음). Amplify Console 작업은 본인이 직접 수행하는 게 안전. 추후 IaC 자동화가 필요해지면 GitHub Actions + OIDC 패턴(옵션 A) 으로 무키 배포 추가 가능.

---

## 📝 Decisions Log

| 날짜 | 결정 | 이유 |
|---|---|---|
| 2026-05-25 | Next.js 14 App Router 단일 코드베이스 | 프론트/백 동시 개발, Vercel·Amplify·ECS 모두 호환 |
| 2026-05-25 | Prisma + SQLite 로컬 시작 | 외부 의존 없이 즉시 데모 가능, 프로덕션은 한 줄로 Postgres 전환 |
| 2026-05-25 | 모든 외부 서비스 mock fallback | 키 없는 리뷰어/개발자도 전체 흐름 체험 가능 |
| 2026-05-25 | Tailwind + 커스텀 brand 컬러 | 컴포넌트 라이브러리 도입 전까지 빠른 일관성 |
| 2026-05-25 | NextAuth Credentials 만 (OAuth 없음) | MVP 범위 축소, OAuth 는 v0.2 |
| 2026-05-25 | 배포 옵션 = **Amplify Hosting** | 가장 빠르고 IaC 부담 없음. 운영 강화 필요해지면 ECS+CDK 로 갈아탈 수 있음 |
| 2026-05-25 | 운영 DB = **RDS Postgres** (사용자 콘솔에서 생성) | Amplify Hosting + RDS 가 가장 표준 조합. SQLite 는 로컬만. |
| 2026-05-25 | 스키마 provider 단일 파일 + amplify.yml `sed` 패치 | 별도 prod 스키마 파일을 유지하지 않아 drift 방지 |
| 2026-05-25 | `db push --accept-data-loss` 로 시작, `migrate deploy` 는 v0.2 | MVP 빠른 배포 우선. 첫 migration 만 만들면 곧 전환 가능 |

---

## 🔄 업데이트 룰

새 기능 / 버그 수정 / 결정이 생길 때:
1. `Status` 섹션의 날짜 갱신
2. `Done` 으로 옮기기 (또는 신규 추가)
3. `Next` 에서 제거 / 추가
4. 중요한 트레이드오프는 `Decisions Log` 에 한 줄 추가
5. 같은 커밋에 코드 변경과 함께 푸시 (separately update 하지 않음)
