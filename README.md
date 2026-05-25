# Talk — 한국어 회화 마켓플레이스

한국인 튜터와 외국인 학습자를 1:1 Zoom 으로 연결하는 마켓플레이스.
**달력 예약 → Stripe 결제 → 자동 Zoom 생성 → Claude 가 만든 맞춤형 아젠다** 까지 한 흐름으로 끝낸다.

## ✨ Features

- **두 가지 역할** — 한국인 튜터 / 외국인 학습자. 가입 시 선택.
- **검색** — 이름, 자기소개, 전문 주제(태그)로 튜터 검색.
- **프로필** — 한국인은 시간당 가격·전문 주제, 외국인은 모국어·국가 표시. 별점 + 리뷰.
- **팔로우** — 마음에 드는 튜터 팔로우.
- **달력 예약** — 호스트가 등록한 요일별 가능 시간을 기반으로 14일치 슬롯을 자동 생성. 충돌 검사.
- **Stripe 결제** — 시간당 비용 × 길이로 자동 계산. (키 없으면 자동 mock checkout 경로로 fallback)
- **자동 Zoom 미팅** — 결제 완료 즉시 join/start URL 생성. (키 없으면 mock URL)
- **AI 아젠다** — Anthropic Claude 가 학습자 모국어·테마·요청 토픽을 반영해 마크다운 아젠다 생성. (키 없으면 deterministic mock)
- **테마/커리큘럼** — 자기소개, K-Pop, 비즈니스, 슬랭 등 8개 기본 테마 시드.
- **리뷰** — 세션 종료 후 별점(1~5) + 코멘트.

## 🛠 Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- Prisma (default: SQLite, prod: PostgreSQL/RDS/Supabase 어디든)
- NextAuth.js (Credentials)
- Stripe / Zoom Server-to-Server OAuth / Anthropic SDK
- Lucide React 아이콘

## 🚀 Quick start

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 (모든 외부 API 키는 선택 — 비워두면 mock 사용)
cp .env.example .env

# 3. DB 초기화 + 시드 (SQLite, 파일 하나로 끝)
npx prisma db push
npm run db:seed

# 4. 개발 서버
npm run dev
# → http://localhost:3000
```

### 데모 계정 (password: `password123`)
- 외국인 학습자: `emma@talk.dev`, `kenji@talk.dev`
- 한국인 튜터: `minji@talk.dev`, `junho@talk.dev`, `sora@talk.dev`, `hyuk@talk.dev`

### 핵심 흐름 체험
1. `emma@talk.dev` 로 로그인 → 튜터 찾기 → 아무 튜터 프로필 진입
2. 달력에서 시간 선택 → 테마 선택 → "결제하고 예약하기"
3. (mock) 결제 자동 완료 → 예약 상세 페이지에서 Zoom 링크 + AI 아젠다 확인
4. `다시 생성` 누르면 아젠다 재생성

## 🔑 외부 키 활성화

| 서비스 | 환경변수 | 없을 때 |
|---|---|---|
| Anthropic Claude | `ANTHROPIC_API_KEY` | 정해진 mock 아젠다 |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | `/api/stripe/mock-confirm` 으로 자동 확정 |
| Zoom | `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET` | `https://zoom.us/j/<random>?pwd=mock` |

Stripe 실제 사용 시 webhook URL: `https://your-domain/api/stripe/webhook`

## 🏗 프로덕션 배포 메모 (AWS 친화)

- **DB**: `DATABASE_URL` 을 RDS PostgreSQL 또는 Supabase 로 교체.
  - `prisma/schema.prisma` 의 `provider = "sqlite"` → `"postgresql"` 변경 후 `npx prisma migrate dev`
- **Hosting**: Vercel / AWS Amplify / ECS Fargate / EKS / Lambda(Next-on-Lambda) 모두 가능.
- **Storage**: 아바타 업로드를 직접 호스팅하려면 S3 + CloudFront. 현재는 외부 URL 만 받는다.
- **Secrets**: AWS Secrets Manager → 환경변수로 주입.

## 📁 구조

```
app/
  page.tsx              # 랜딩
  browse/               # 튜터 검색
  tutor/[id]/           # 튜터 상세 + 예약 패널
  bookings/             # 내 예약 목록 + 상세
  profile/              # 프로필 편집
  availability/         # 호스트 가능 시간 편집
  login/  signup/
  api/
    auth/               # NextAuth + 회원가입
    bookings/           # 예약 생성 → checkout
    follow/  reviews/
    profile/  availability/
    agenda/regenerate/  # 아젠다 재생성
    stripe/
      webhook/          # 실제 Stripe
      mock-confirm/     # 키 없을 때 fallback
components/
lib/
  db.ts auth.ts utils.ts
  llm.ts                # Claude (+ mock)
  stripe.ts             # Stripe (+ mock)
  zoom.ts               # Zoom (+ mock)
  themes-seed.ts        # 기본 커리큘럼
prisma/
  schema.prisma
  seed.ts
```

## ✅ 의도적으로 단순화한 부분 (다음 마일스톤 후보)

- 결제 후 자동 환불/취소 워크플로
- 실시간 채팅 (사전 일정 조율)
- 호스트의 가능 시간을 timezone-aware 로 처리 (현재는 서버 로컬 시간 기준)
- 노쇼 정책 / 분쟁 처리
- 모바일 앱 (React Native)
