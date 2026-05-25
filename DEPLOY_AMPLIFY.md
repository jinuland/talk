# Deploy Talk to AWS Amplify Hosting — 클릭별 가이드

가장 빠른 경로. **약 30분**, IaC 없이 콘솔에서 끝낸다. RDS Postgres 하나 + Amplify Hosting 앱 하나.

> 사전 준비물:
> - AWS 계정 + IAM 사용자 (또는 SSO) — 콘솔 로그인 가능
> - GitHub 저장소 — 이미 `claude/language-exchange-marketplace-TZwdw` 브랜치에 푸시되어 있음
> - 로컬 터미널 (시크릿 생성용)
> - 약 30분의 집중 시간

---

## 0) 준비물 (1분, 본인 머신)

터미널에서 다음을 실행하고 결과를 **본인만 보관**:

```bash
openssl rand -base64 32   # NEXTAUTH_SECRET — 이 값 어디에도 공유 금지
```

메모장 양식:

```
NEXTAUTH_SECRET = <openssl 결과>
RDS_PASSWORD    = (다음 단계에서 만들어 적기)
RDS_ENDPOINT    = (다음 단계에서 만들어 적기)
DATABASE_URL    = (계산해서 적기)
NEXTAUTH_URL    = (Amplify 첫 배포 후 받음)
```

---

## 1) RDS Postgres 만들기 (5~7분)

**Region 선택**: 콘솔 우상단에서 `ap-northeast-2 (Seoul)` 또는 본인이 자주 쓰는 리전. 이후 Amplify 도 같은 리전.

1. AWS Console → **RDS** 검색 → 좌측 **Databases** → 우상단 주황 **Create database**
2. **Choose a database creation method**
   - 선택: **Standard create**
3. **Engine options**
   - Engine type: **PostgreSQL**
   - Engine Version: **PostgreSQL 16.x (latest)**
4. **Templates**
   - **Free tier** (운영 격상은 나중에 인스턴스 클래스 변경으로 OK)
5. **Settings**
   - DB instance identifier: `talk-prod`
   - Master username: `talkadmin`
   - Master password: 임의 생성. **반드시 영숫자 + `-_~` 만** (`@`, `:`, `/`, `+`, `=` 같은 문자는 URL 인코딩이 필요해져서 골치아픔).
     - 추천 길이 24자.
     - **→ `RDS_PASSWORD` 메모**
   - Confirm password 다시 입력
6. **Instance configuration**
   - DB instance class: **db.t4g.micro** (Free Tier 대상이면 default 그대로)
7. **Storage**
   - Allocated storage: 20 GiB (기본값)
   - Enable storage autoscaling: **체크 유지**
8. **Connectivity** ⚠️ 여기가 핵심
   - VPC: default VPC
   - Subnet group: default
   - **Public access: Yes** ← MVP 빠른 배포용. (운영 단계에서는 No + Amplify VPC connector 로 전환)
   - VPC security group: **Create new** → name: `talk-db-sg`
   - Availability Zone: No preference
   - **Database port: 5432** (기본)
9. **Database authentication**
   - Password authentication (기본 유지)
10. **Additional configuration** (꼭 펴서 보기)
    - **Initial database name: `talk`** ← 이거 안 적으면 빈 DB 만들어지고 나중에 헷갈림
    - Backup retention period: 7 days (기본)
    - Encryption: 기본 유지
    - 나머지 기본
11. 페이지 맨 아래 **예상 월 비용** 확인 (Free Tier 적용 시 $0). **Create database**

→ 인스턴스가 `Available` 상태가 되기까지 **3~6분**. 그동안 다음 단계 진행 가능.

상태가 `Available` 되면:
- **DB identifier 클릭** → Connectivity & security 탭
- **Endpoint** 값 복사: `talk-prod.ab12cd34.ap-northeast-2.rds.amazonaws.com`
- **→ `RDS_ENDPOINT` 메모**

이제 `DATABASE_URL` 조립:
```
postgresql://talkadmin:<RDS_PASSWORD>@<RDS_ENDPOINT>:5432/talk?sslmode=require
```

---

## 2) Security Group 인바운드 열기 (2분) ⚠️ 자주 놓치는 부분

이거 안 하면 Amplify 빌드의 `prisma db push` 가 **timeout** 으로 hang 합니다.

1. RDS 인스턴스 → Connectivity & security → **VPC security groups** 의 `talk-db-sg` 클릭
2. **Inbound rules** 탭 → **Edit inbound rules**
3. **Add rule**
   - Type: **PostgreSQL** (port 5432 자동)
   - Source: **Anywhere-IPv4 (0.0.0.0/0)** ← 임시. 운영 시 Amplify 빌드 환경 IP 또는 VPC 내부로 좁힘
4. **Save rules**

### (선택) 로컬에서 연결 확인
본인 머신에 `psql` 있으면:
```bash
psql "postgresql://talkadmin:<password>@<endpoint>:5432/talk?sslmode=require" -c "select 1;"
```
`1` 이 출력되면 OK. 안 되면:
- Security Group 5432 가 0.0.0.0/0 로 열려있는지
- Password 에 URL 인코딩 필요한 문자가 있는지

---

## 3) Amplify Hosting 앱 만들기 (10분)

**Region 동일** 확인 후:

1. AWS Console → **Amplify** 검색 → 우상단 **Create new app**
2. **Deploy your app** → **GitHub** 선택 → **Continue**
3. **Authorize aws-amplify-console** 팝업
   - 처음이면 GitHub OAuth 동의 필요 (jinuland 또는 본인 GitHub 계정)
   - "Only select repositories" 권장 → `jinuland/talk` 만 허용
4. **Add repository branch**
   - Repository: `jinuland/talk`
   - Branch: `claude/language-exchange-marketplace-TZwdw`
   - (또는 `main` 머지 후 `main`)
   - **Next**
5. **App settings**
   - App name: `talk`
   - Framework: Amplify 가 자동으로 **Next.js - SSR** 인식
   - Build settings: **"Build and test settings"** 자동 펼침
     - 저장소에 `amplify.yml` 이 이미 있으니 **"Edit YML file"** 누르지 말고 그대로 두기. 화면에 표시된 내용이 저장소 amplify.yml 과 일치하는지 한 번만 확인.
   - **Service role**: "Create and use a new service role" 선택 → IAM Role 자동 생성됨
6. **Advanced settings → Environment variables** 펼치기

### 입력할 환경변수 (이 단계에서)

| Key | Value |
|---|---|
| `DATABASE_URL` | 위에서 조립한 postgres URL |
| `NEXTAUTH_SECRET` | 0단계 openssl 결과 |
| `NEXTAUTH_URL` | **임시로 `https://placeholder.local`** (1차 배포 후 실제 도메인으로 교체) |
| `NEXT_PUBLIC_APP_URL` | `NEXTAUTH_URL` 과 동일 (`https://placeholder.local`) |
| `RUN_SEED` | `true` ← 첫 배포에만 |

> Anthropic / Stripe / Zoom 키는 **지금 안 넣어도 됨**. mock fallback 으로 전체 흐름 동작. 나중에 6단계에서 추가.

7. **Next** → **Review** → **Save and deploy**

빌드 진행. **5~10분** 걸림. 로그는 Amplify Console 의 앱 → branch 클릭 → 빌드 단계별로 펼쳐 보면 됨.

### 정상 빌드 로그 핵심 줄
```
Running command npm ci ...
Running command sed -i ...                         ← provider 패치
Running command npx prisma generate                ← Postgres client 생성
Running command npx prisma db push --accept-data-loss   ← 스키마 동기화
→ Seeding demo data                                ← RUN_SEED=true 이면 보임
✓ Done.
Running command npm run build
Compiled successfully
```

빌드 끝나면 Domain 발급: `https://main.d<10자해시>.amplifyapp.com`

---

## 4) NEXTAUTH_URL 보정 + 재배포 (1분)

NextAuth 가 로그인 콜백 검증할 때 `NEXTAUTH_URL` 과 실제 요청 호스트가 일치해야 합니다.

1. Amplify Console → 앱 → **Hosting → Environment variables** → Edit
2. `NEXTAUTH_URL` 값을 진짜 도메인으로 교체 (예: `https://main.d1abc23xyz.amplifyapp.com`) — 끝에 슬래시 **금지**
3. `NEXT_PUBLIC_APP_URL` 도 동일하게
4. `RUN_SEED` **삭제** (이걸 안 지우면 push 마다 sample reviews 가 누적됨)
5. **Save**
6. 좌측 메뉴 **Hosting → Deployments** → 가장 최근 빌드 우측 점 메뉴 → **Redeploy this version**

재배포 ~3분.

---

## 5) 동작 확인 (3분)

브라우저로 발급된 URL 접속:

- [ ] 홈에 인기 튜터 4명이 보임
- [ ] `/browse` 에서 검색 시 결과 나옴
- [ ] `/login` → `emma@talk.dev` / `password123` → 성공
- [ ] 튜터 프로필 → 시간 슬롯 클릭 → 테마 선택 → "결제하고 예약하기"
- [ ] mock checkout → 예약 상세에 **Zoom 참여** 버튼 + **AI 아젠다** 보임
- [ ] **다시 생성** 누르면 새 아젠다 생성됨 (mock 이라 큰 차이 없음)

빌드 또는 동작에서 문제 생기면 **Amplify Console → 빌드 로그 또는 함수 로그** 의 에러 메시지를 챗에 붙여주세요.

---

## 6) (선택) 실제 외부 키 활성화

### Anthropic Claude
- Anthropic Console 에서 API key 생성
- Amplify env 에 `ANTHROPIC_API_KEY` 추가
- `ANTHROPIC_MODEL=claude-sonnet-4-6` (또는 원하는 모델)
- 재배포

### Stripe
1. Stripe Dashboard → Developers → API keys → Secret key (`sk_test_…` 또는 `sk_live_…`) 복사
2. Stripe Dashboard → Developers → Webhooks → **Add endpoint**
   - URL: `https://<amplify-domain>/api/stripe/webhook`
   - Event: `checkout.session.completed`
   - 만들고 나서 **Signing secret** (`whsec_…`) 복사
3. Amplify env 에 추가:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (pk_…)
4. 재배포

### Zoom Server-to-Server OAuth
1. Zoom Marketplace → Develop → Build App → **Server-to-Server OAuth**
2. App credentials 페이지에서 Account ID / Client ID / Client Secret 복사
3. Scopes: `meeting:write:admin`, `user:read:admin` 추가
4. Activate the app
5. Amplify env 에 `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET` 추가 → 재배포

---

## 7) (선택) 커스텀 도메인

Amplify Console → 앱 → **Hosting → Custom domains** → **Add domain**.

- Route 53 도메인이면 한 번에 ACM 인증까지 자동 (~10분)
- 외부 도메인이면 ACM 인증용 DNS 레코드 안내가 나옴 (~20분 ~ 24h)

도메인 붙인 후 다음을 새 도메인으로 모두 교체:
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- Stripe webhook URL

---

## 🛠 트러블슈팅

| 증상 | 원인 / 해결 |
|---|---|
| 빌드 `prisma db push` 가 timeout (~ 5분 hang) | RDS Security Group 5432 인바운드가 안 열림. 2단계 다시. |
| `Error: P1001: Can't reach database server` | `DATABASE_URL` 의 host/port/db 이름 오타. RDS endpoint 다시 복사. |
| `Error: P1000: Authentication failed` | URL 의 비밀번호에 인코딩 필요한 특수문자. 영숫자 비밀번호로 RDS modify. |
| `[next-auth][error][NO_SECRET]` | `NEXTAUTH_SECRET` 미설정. Amplify env vars 다시 확인. |
| 로그인 후 `OAuthCallback` 또는 `CallbackUrl mismatch` | `NEXTAUTH_URL` 과 실제 도메인 불일치 (trailing slash, http vs https, 서브도메인 등). |
| Stripe webhook 401 / `No signatures matching` | `STRIPE_WEBHOOK_SECRET` 이 등록한 endpoint 의 것과 다름. Stripe Webhooks 페이지에서 다시 복사. |
| 두 번째 배포 후 sample reviews 가 누적됨 | `RUN_SEED=true` 가 남아있음. 삭제 후 재배포. |
| `Prisma Client validation: provider mismatch` | amplify.yml 의 sed 가 안 돔. `prisma/schema.prisma` 가 push 된 그대로(`provider = "sqlite"`)인지 확인. 다른 PR 에서 schema 손댔으면 line 형식이 깨졌을 수도 있음. |
| 빌드는 됐는데 `/` 가 500 | CloudWatch Logs (Amplify 함수) 에서 트레이스 확인. 보통 DATABASE_URL 누락 또는 prisma client 가 잘못된 provider 로 생성됨. |

---

## 💰 비용 메모 (대략)

| 항목 | 월 비용 |
|---|---|
| RDS db.t4g.micro (Free Tier 1년) | $0 → 이후 ~$15 |
| Amplify Hosting (~5GB egress + 빌드 시간) | $0~5 |
| RDS 스토리지 20GB | $2.5 |
| Route 53 도메인 (선택) | $0.5/월 + 도메인 등록 비용 |

데모 단계는 사실상 무료. 트래픽 증가 시 RDS 부터 Multi-AZ.

---

## ⏭ 배포 후 v0.2 강화 후보

- Prisma migrations 도입 (`prisma migrate dev --name init` → 커밋 → amplify.yml 에서 `migrate deploy` 로 교체)
- RDS Private subnet + Amplify VPC connector (Public access 끄기)
- AWS Secrets Manager 로 DB credentials 분리
- CloudFront → WAF 추가
- SES 로 예약 알림 이메일
