# Talk — Progress & Roadmap

> 이 문서는 의미 있는 변경(기능 완료, 결정, 환경 변화)이 있을 때마다 같이 업데이트합니다.
> 가장 위가 가장 최신 — append-only 가 아니라 "Status / Done / Next" 살아있는 문서.

## 📌 Status (2026-06-14)

- **Branch**: `claude/vercel-supabase-migration` (이전: `claude/language-exchange-marketplace-TZwdw` 머지됨)
- **Stage**: v0.1 MVP 코드 완성 → **Vercel + Supabase 로 호스팅/DB 마이그레이션 중**
- **Build**: ✅ `next build` 통과 (19 라우트)
- **Deploy**: Amplify 시도 → 보안 티켓 발생 (SG 0.0.0.0/0) → AWS 전면 철수, **Vercel + Supabase 로 전환**
- **데모 계정** (password: `password123`):
  - 외국인: `emma@talk.dev`, `kenji@talk.dev`
  - 한국인: `minji@talk.dev`, `junho@talk.dev`, `sora@talk.dev`, `hyuk@talk.dev`

---

## ✅ Done

### v0.1 MVP (2026-05-25)
- NextAuth Credentials + 역할 기반 가입 (KOREAN / FOREIGNER)
- 튜터 검색 / 프로필 / 별점 / 리뷰 / 팔로우
- 호스트 가능 시간 편집기 + 14일 슬롯 자동 생성 + 충돌 검사
- Stripe Checkout (+ mock fallback) → Zoom Server-to-Server (+ mock) → Claude 아젠다 생성 (+ mock)
- 8개 기본 커리큘럼 테마 시드
- 세션 종료 후 별점/코멘트 리뷰
- 내 예약 목록 (다가오는 / 지난, Host/Guest 양쪽 뷰)

### Infrastructure 마이그레이션 (2026-06-14)
- `prisma/schema.prisma` provider: `sqlite` → **`postgresql`** (단일 소스)
- `docker-compose.yml` 추가 — 로컬 Postgres 16 (port 5432, user/db 둘 다 `talk`)
- `package.json` 빌드: `prisma generate && prisma db push --accept-data-loss && next build`
- `.env.example` Postgres URL 형식으로 갱신 (Supabase pooler 6543 + direct 5432 가이드)
- `amplify.yml` 및 `DEPLOY_AMPLIFY.md` 제거
- `DEPLOY_VERCEL.md` 신규 — Supabase + Vercel 단계별 가이드
- `README.md` Quick start 갱신 (docker-compose 단계 추가)

### AWS 청소 (2026-06-14 22:09 UTC)
- Amplify 앱 `d10sxkabmueicu` 삭제
- RDS `talk-prod` 삭제 (skip-final-snapshot)
- Security Group `sg-06c8faf91beeb6540` 삭제 (RDS 해제 후)
- /tmp 의 자격 파일 (.awsenv, .rds_password, .dburl, .nextauth_secret, .ghpat, .deploystate) — 세션 종료 시 컨테이너와 함께 소멸

---

## 🚧 In progress

### Vercel + Supabase 배포 세션 (2026-06-14)

| 단계 | 담당 | 상태 |
|---|---|---|
| AWS 자원 삭제 (RDS / Amplify / SG) | 자동 | 진행 중 (RDS 삭제 ~3분) |
| 코드 마이그레이션 (Prisma postgres, docker-compose, Vercel guide) | 자동 | ✅ 완료, 커밋 대기 |
| Supabase 프로젝트 생성 (Seoul, Free) | 사용자 | ⏳ |
| Vercel 가입 + repo import | 사용자 | ⏳ |
| Vercel env vars 입력 | 사용자 / 자동 (토큰 있으면) | ⏳ |
| 첫 배포 + RUN_SEED 검증 | 자동 | ⏳ |
| 동작 확인 + RUN_SEED 제거 | 자동 | ⏳ |
| Phase 2: Supabase Auth 도입 | v0.2 | 후일 |

---

## 🔜 Next / TODO

### 우선순위 높음
- [ ] **Vercel 첫 배포** (이번 세션 마무리)
- [ ] **Prisma migrations 도입** — `db push` → `migrate deploy` 로 운영 등급
- [ ] **Timezone-aware 캘린더** — 호스트/게스트 각자 IANA TZ
- [ ] **이메일 알림** — 예약 확정 / 24h 전 리마인더 (Resend 또는 Supabase SMTP)

### Phase 2 — Auth 강화 (Supabase Auth 도입)
- [ ] `@supabase/supabase-js` + `@supabase/ssr` 추가
- [ ] Google / Apple / Kakao OAuth (Supabase Auth 콘솔에서 설정)
- [ ] 매직 링크 / 비밀번호 reset
- [ ] NextAuth 와 점진적 공존 → 완전 교체

### 우선순위 중간
- [ ] 환불 / 취소 워크플로 (24h 룰 + Stripe refund API)
- [ ] 호스트 onboarding 체크리스트
- [ ] 사전 채팅 (예약 전 짧은 메시지)
- [ ] Saved bookings → Google/Apple Calendar `.ics`
- [ ] Browse 필터 (가격대, 별점, 가용성, 전문 주제)
- [ ] 호스트 정산 (Stripe Connect)

### 우선순위 낮음
- [ ] 노쇼 정책 / 분쟁 처리
- [ ] React Native 모바일 앱 (Expo) — API 재사용
- [ ] i18n (영어 / 일본어 / 중국어 UI)
- [ ] 다대일 그룹 세션
- [ ] 관리자 대시보드

---

## 📝 Decisions Log

| 날짜 | 결정 | 이유 |
|---|---|---|
| 2026-05-25 | Next.js 14 App Router 단일 코드베이스 | 프론트/백 동시 개발, Vercel·Amplify·ECS 모두 호환 |
| 2026-05-25 | Prisma + SQLite 로컬 시작 | 외부 의존 없이 즉시 데모 가능 |
| 2026-05-25 | 모든 외부 서비스 mock fallback | 키 없는 리뷰어/개발자도 전체 흐름 체험 |
| 2026-05-25 | NextAuth Credentials 만 (OAuth 없음) | MVP 범위 축소, OAuth 는 v0.2 |
| 2026-06-14 | ~~배포 옵션 = Amplify Hosting~~ → **Vercel** | Amplify Gen 1 SSR 의 RDS 연결 제약 + Isengard 계정 보안 정책으로 인한 비효율. Vercel 이 Next.js 본진. |
| 2026-06-14 | ~~운영 DB = RDS Postgres~~ → **Supabase** | RDS 는 VPC/SG 부담 + 비용. Supabase 는 public-by-design, free tier, 향후 Auth 도 같이 활용 가능. |
| 2026-06-14 | 스키마 provider 단일 = `postgresql` (sqlite 제거) | 로컬 = docker-compose Postgres, 운영 = Supabase. 단일 소스, drift 없음. |
| 2026-06-14 | `db push --accept-data-loss` 유지 (migrations 는 v0.2) | MVP 배포 우선, 데이터 보존 필요해지면 migrations 도입 |

---

## 🚨 Past incidents

### 2026-06-14 21:38 UTC — RDS SG 0.0.0.0/0 보안 티켓
- **원인**: 초기 Amplify 가이드가 빠른 데모 우선으로 SG inbound 5432 를 0.0.0.0/0 로 권장. 조직 보안 모니터링이 즉시 알람.
- **즉시 조치 (21:39)**: 0.0.0.0/0 revoke, CodeBuild CIDR 화이트리스트로 교체. AWS 자동 remediation 으로 RDS PubliclyAccessible 도 false 로 자동 flip.
- **근본 해결 (22:09)**: AWS 인프라 전면 철수 → Vercel + Supabase 로 이전. SG/VPC 부담 자체가 사라짐.
- **교훈**: "MVP 빠르게" 라는 단서로 `0.0.0.0/0` 권장한 것 자체가 잘못. 조직 보안 정책 가정을 더 보수적으로.

---

## 🔄 업데이트 룰

새 기능 / 버그 수정 / 결정이 생길 때:
1. `Status` 섹션의 날짜 갱신
2. `Done` 으로 옮기기 (또는 신규 추가)
3. `Next` 에서 제거 / 추가
4. 중요한 트레이드오프는 `Decisions Log` 에 한 줄 추가
5. 같은 커밋에 코드 변경과 함께 푸시 (separately update 하지 않음)
