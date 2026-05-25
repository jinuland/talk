# Deploy Talk to AWS Amplify Hosting

가장 빠른 경로. **약 30분**, IaC 없이 콘솔에서 끝낸다. RDS Postgres 하나 + Amplify Hosting 앱 하나.

> 사전 준비물: AWS 계정 (SA 있으심), GitHub 저장소 (이미 푸시됨), 카드 등록된 결제 활성 계정.

---

## 1) RDS Postgres 만들기 (5분)

AWS Console → RDS → **Create database**

| 항목 | 값 |
|---|---|
| Engine | PostgreSQL 16 |
| Templates | **Free tier** (시작), 운영 시 Multi-AZ |
| DB instance | `talk-prod` |
| Master username | `talkadmin` |
| Master password | 강한 비밀번호 → **메모** |
| Public access | **Yes** (첫 배포 빠르게 가는 경우. 운영은 VPC peering / private subnet 권장) |
| VPC security group | "Create new" → 이름 `talk-db-sg` |
| Initial database name | `talk` |

생성 후 Endpoint 복사: `talk-prod.xxxxx.ap-northeast-2.rds.amazonaws.com`

⚠️ **Security Group** 편집:
- `talk-db-sg` 의 Inbound rules → **PostgreSQL (5432) / Source: 0.0.0.0/0** 임시 추가
  (운영에서는 Amplify build 환경 IP 또는 VPC peering 으로 좁힐 것)

`DATABASE_URL`:
```
postgresql://talkadmin:<URL_ENCODED_PASSWORD>@talk-prod.xxxxx.ap-northeast-2.rds.amazonaws.com:5432/talk?sslmode=require
```

> 비밀번호에 `@`, `:`, `/` 같은 문자가 있으면 URL 인코딩 필요. 안전하려면 영숫자 + `-_.~` 만 쓰는 게 좋다.

---

## 2) Amplify Hosting 앱 만들기 (10분)

AWS Console → **Amplify** → **Create new app** → **Host web app**

1. GitHub 연결 → repository `jinuland/talk` → branch `claude/language-exchange-marketplace-TZwdw` (또는 `main` 으로 머지 후 선택)
2. **App settings**:
   - App name: `talk`
   - Framework: Amplify 가 Next.js 14 자동 감지
   - Build settings: **Use a buildspec** — 저장소에 이미 `amplify.yml` 있으니 그대로 사용
3. **Advanced settings → Environment variables** (아래 표 채우기):

### 필수 환경변수

| Key | Value |
|---|---|
| `DATABASE_URL` | 위에서 만든 postgres URL |
| `NEXTAUTH_URL` | 배포 후 받게 될 URL (1차 배포 후 수정해도 됨, 형식 예: `https://main.d1abc.amplifyapp.com`) |
| `NEXTAUTH_SECRET` | 로컬에서 `openssl rand -base64 32` 결과 |
| `NEXT_PUBLIC_APP_URL` | `NEXTAUTH_URL` 과 동일 |
| `RUN_SEED` | **`true`** ← 첫 배포만, 이후 제거 |

### 선택 환경변수 (없어도 동작 — mock fallback)

| Key | 설명 |
|---|---|
| `ANTHROPIC_API_KEY` | Claude 실제 호출 |
| `ANTHROPIC_MODEL` | 예: `claude-sonnet-4-6` |
| `STRIPE_SECRET_KEY` | sk_live_… 또는 sk_test_… |
| `STRIPE_WEBHOOK_SECRET` | 4) 단계에서 받음 |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | pk_live_… 또는 pk_test_… |
| `ZOOM_ACCOUNT_ID` / `ZOOM_CLIENT_ID` / `ZOOM_CLIENT_SECRET` | Server-to-Server OAuth |

4. **Save and deploy**

빌드 로그에서 다음 줄이 보이면 정상:
```
→ Seeding demo data
✓ Done.
```

배포 완료 시 URL: `https://main.d<random>.amplifyapp.com`

---

## 3) NEXTAUTH_URL 보정 + 재배포 (1분)

첫 배포 후 발급된 진짜 URL 을 받았으면:

1. Amplify Console → 앱 → **Environment variables** 편집
2. `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL` 을 실제 URL 로 교체
3. `RUN_SEED` 는 **삭제** (이후 push 마다 seed 가 부분적으로 재실행되어 sample reviews 가 누적됨)
4. App settings → **Redeploy this version**

---

## 4) Stripe 웹훅 설정 (실제 결제 쓸 때, 5분)

Stripe Dashboard → Developers → **Webhooks** → **Add endpoint**

- URL: `https://<your-amplify-domain>/api/stripe/webhook`
- Event: `checkout.session.completed`
- **Signing secret** 복사 → Amplify env `STRIPE_WEBHOOK_SECRET` 에 추가 → 재배포

Stripe 키 없이도 mock 경로(`/api/stripe/mock-confirm`)로 데모는 동작합니다.

---

## 5) Zoom Server-to-Server OAuth (실제 미팅 쓸 때)

Zoom Marketplace → **Develop → Build App → Server-to-Server OAuth**

- App credentials 페이지에서 Account ID / Client ID / Client Secret 복사
- 필요한 Scopes: `meeting:write:admin`, `user:read:admin`
- Amplify env 에 `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET` 추가 → 재배포

---

## 6) 커스텀 도메인 (선택)

Amplify Console → 앱 → **Domain management** → **Add domain**.
Route 53 도메인이면 한 번에 SSL 까지 자동. 외부 도메인이면 ACM 인증 + CNAME 안내가 나옴.

도메인 붙인 뒤 `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`, Stripe webhook URL 모두 교체 필요.

---

## 🧪 배포 확인 체크리스트

- [ ] 빌드 로그에 "Skipping seed" 또는 "Seeding demo data" 메시지가 보임
- [ ] `https://<domain>/` 접속 시 인기 튜터 4명이 보임
- [ ] `emma@talk.dev` / `password123` 로그인 성공
- [ ] 튜터 프로필 → 예약 생성 → Stripe(or mock) → Zoom 링크 + AI 아젠다 표시
- [ ] CloudWatch Logs (Amplify 빌드 / 함수) 에 에러 없음

---

## 🛠 트러블슈팅

| 증상 | 원인 / 해결 |
|---|---|
| 빌드 단계에서 `prisma db push` 가 hang | RDS Security Group 5432 인바운드가 막힘. 임시로 0.0.0.0/0 허용. |
| `ECONNREFUSED ::1:5432` | `DATABASE_URL` 에 호스트가 안 들어감. URL 형식 다시 확인. |
| `Authentication failed` | URL 의 비밀번호 인코딩 누락. `@:/` 문자 인코딩. |
| 로그인 후 콜백에서 404 / mismatched URL | `NEXTAUTH_URL` 이 실제 도메인과 정확히 일치하는지 (trailing slash 없이). |
| Stripe webhook 401 | `STRIPE_WEBHOOK_SECRET` 미설정 또는 다른 endpoint 의 secret. |
| 두 번째 배포 후 sample reviews 가 늘어남 | `RUN_SEED=true` 가 아직 남아있음. 삭제 후 재배포. |
| Prisma Client mismatch (sqlite vs postgres) | amplify.yml 의 `sed` 가 안 돈 경우. `prisma/schema.prisma` 가 커밋된 그대로인지 확인. |

---

## 💰 비용 메모 (us-east-1 / ap-northeast-2 기준 대략)

| 항목 | 월 (대략) |
|---|---|
| RDS db.t4g.micro (Free Tier 1년) | $0 → $15 |
| Amplify Hosting (1GB transfer + 빌드 100분) | $0~5 |
| 도메인 (Route 53) | $0.5 |

데모 단계는 사실상 무료. 트래픽 늘면 RDS 부터 Multi-AZ 로.

---

## ⏭ 다음 단계 (v0.2 운영 강화)

- Prisma migrations 도입 (`prisma migrate dev --name init` → 커밋 → amplify.yml 에서 `migrate deploy` 로 교체)
- RDS Private subnet + Amplify VPC connector
- AWS Secrets Manager 로 `DATABASE_URL` 분리
- CloudFront 앞단에 WAF
- SES 로 예약 이메일 알림
