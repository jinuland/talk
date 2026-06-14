# Deploy Talk to Vercel + Supabase

스택: **Vercel (Next.js SSR)** × **Supabase (managed Postgres)**. 데모는 무료, 상용화 시 ~$45/월부터.

> 사전 준비물:
> - GitHub 저장소 — 본 repo 이미 푸시되어 있음
> - GitHub 계정 (Vercel/Supabase 가입에 사용)
> - 로컬 터미널

---

## 1) Supabase 프로젝트 생성 (3분)

1. https://supabase.com → **Start your project** → **Sign in with GitHub**
2. **New project**:
   - Name: `talk`
   - Database Password: 강한 비밀번호 (영숫자만 권장 — URL 인코딩 피하기). **메모**.
   - Region: **Northeast Asia (Seoul)** `ap-northeast-2`
   - Plan: **Free**
3. 생성에 ~2분
4. 사이드바 **Settings → Database**:
   - 상단 **Connect** 탭 → **Connection string** 섹션
   - **Transaction pooler (Vercel 용)** 의 URI 복사 (port **6543**, `?pgbouncer=true` 포함)
   - **Session pooler / Direct** URI 도 복사 (port **5432**, 마이그레이션 용)
5. **Settings → API** (Phase 2 auth 작업 시):
   - Project URL: `https://xxxxx.supabase.co`
   - `anon` `public` key
   - `service_role` key

---

## 2) Vercel 가입 + 프로젝트 import (5분)

1. https://vercel.com → **Sign Up** → **Continue with GitHub**
2. Plan: **Hobby** 로 시작 (출시 전엔 충분, Pro $20/seat 는 상업 트래픽 시작 후)
3. **Add New → Project** → `jinuland/talk` 선택 → **Import**
4. **Configure Project** 화면:
   - Framework Preset: **Next.js** (자동 감지)
   - Build Command: 그대로 두기 (`npm run build` — 우리 package.json 이 `prisma generate && prisma db push && next build` 수행)
   - Install Command: `npm install`
   - Output Directory: `.next` (자동)
5. **Environment Variables** — 다음 추가:

   | Key | Value | 비고 |
   |---|---|---|
   | `DATABASE_URL` | Supabase pooler URI (port 6543, `?pgbouncer=true`) | 런타임 + 빌드 |
   | `DIRECT_URL` | Supabase direct URI (port 5432) | 빌드의 `prisma db push` 가 마이그레이션 호환 위해 사용 가능 (선택) |
   | `NEXTAUTH_SECRET` | `openssl rand -base64 32` 결과 | |
   | `NEXTAUTH_URL` | 첫 배포 후 받은 vercel.app URL (커스텀 도메인이면 그걸로) | placeholder 로 시작 가능 |
   | `NEXT_PUBLIC_APP_URL` | 위와 동일 | |
   | `RUN_SEED` | `true` ← 첫 배포만 | 빌드 후 삭제 |
   | `ANTHROPIC_API_KEY` | (선택) | 없으면 mock 아젠다 |
   | `ANTHROPIC_MODEL` | `claude-sonnet-4-6` | |

6. **Deploy** 클릭

빌드 진행 ~3~5분.

---

## 3) NEXTAUTH_URL 보정 + 재배포 (1분)

첫 배포 완료 후 발급된 URL 을 확인 (예: `https://talk-xxxxx.vercel.app`):

1. Vercel 프로젝트 → **Settings → Environment Variables**
2. `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL` 을 실제 URL 로 교체
3. `RUN_SEED` **삭제** (안 지우면 push 마다 sample reviews 누적)
4. **Deployments** → 최신 배포 우측 점 메뉴 → **Redeploy**

---

## 4) 동작 확인 (3분)

브라우저로 발급된 URL 접속:

- [ ] `/` 홈에 인기 한국인 튜터 4명 표시
- [ ] `/browse` 검색 동작
- [ ] `/login` → `emma@talk.dev` / `password123` → 성공
- [ ] 튜터 → 시간 슬롯 → 테마 → "결제하고 예약하기"
- [ ] mock 결제 자동 완료 → 예약 상세에 Zoom 링크 + AI 아젠다 표시
- [ ] **다시 생성** 버튼 동작

---

## 5) (선택) 실제 외부 키 활성화

### Anthropic Claude
- Vercel env 에 `ANTHROPIC_API_KEY` 추가 → redeploy

### Stripe
1. Stripe Dashboard → API keys → secret 복사 → Vercel env `STRIPE_SECRET_KEY`
2. Stripe Dashboard → Webhooks → Add endpoint:
   - URL: `https://<vercel-domain>/api/stripe/webhook`
   - Event: `checkout.session.completed`
   - Signing secret → Vercel env `STRIPE_WEBHOOK_SECRET`
3. `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` 도 추가
4. Redeploy

### Zoom Server-to-Server OAuth
1. Zoom Marketplace → Develop → Build App → Server-to-Server OAuth
2. Scopes: `meeting:write:admin`, `user:read:admin`
3. Activate
4. Vercel env 에 `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET` 추가
5. Redeploy

---

## 6) (선택) 커스텀 도메인

Vercel 프로젝트 → **Settings → Domains** → Add.

- Vercel 에서 도메인 구매: 한 번에 SSL 자동
- 외부 도메인: DNS A/CNAME 안내 따라가면 ~30분 ~ 24h

도메인 붙인 후:
- `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL` 교체
- Stripe webhook URL 도 새 도메인으로 갱신

---

## 7) (선택) Supabase Auth 도입 (Phase 2)

현재는 NextAuth Credentials. 소셜 로그인이 필요해지면:

1. Supabase Dashboard → **Authentication → Providers** 에서 Google / Apple / Kakao 활성화
2. 각 provider 에 redirect URL: `https://<vercel-domain>/auth/callback`
3. `@supabase/supabase-js` + `@supabase/ssr` 패키지 추가
4. 신규 `/auth/callback` 라우트 작성 → NextAuth 와 공존 또는 점진적 교체

상세는 https://supabase.com/docs/guides/auth

---

## 🛠 트러블슈팅

| 증상 | 원인 / 해결 |
|---|---|
| 빌드 중 `Error: P1001: Can't reach database server` | `DATABASE_URL` 의 host / port / 비밀번호 확인. 비밀번호에 `@`/`:`/`/` 들어가면 URL 인코딩 필요. |
| 빌드 중 `Error: prepared statement "s0" already exists` | Supabase pooler (port 6543) 는 transaction mode → `?pgbouncer=true` 옵션 누락. URL 끝에 추가. |
| 로그인 후 `CallbackUrl mismatch` | `NEXTAUTH_URL` 이 실제 도메인과 정확히 일치해야 함 (trailing slash 없이, https). |
| 두 번째 배포 후 sample reviews 누적 | `RUN_SEED=true` 가 남아있음. 삭제 후 redeploy. |
| Vercel 함수 timeout 10s 초과 | Hobby plan 의 함수 타임아웃. Claude API 호출이 오래 걸리면 streaming 으로 바꾸거나 Pro 로 업그레이드. |
| `Prisma Client did not initialize` | `prisma generate` 가 빌드 단계에서 실행되어야 함. `package.json` 의 `build` 스크립트 확인. |

---

## 💰 비용

| 단계 | Supabase | Vercel | 월 합계 |
|---|---|---|---|
| 데모 / 출시 전 | Free (500MB DB, 50K MAU) | Hobby (개인) | **$0** |
| 출시 직후 (저트래픽) | Free 또는 Pro $25 | Pro $20/seat | **$0 ~ $45** |
| 본격 운영 | 사용량 | 사용량 | 트래픽 비례 |
