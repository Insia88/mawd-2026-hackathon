# MAWD 후원사 API 호출 준비

키는 이 폴더의 `.env`에 있다. `.env`는 팀방이나 깃헙에 올리지 않는다. 키가 살아 있는지는 아래 명령 하나로 본다.

```bash
node check.mjs
```

## 지금 상태 (11월 14일 기준)

| 서비스 | 키 | 호출 | 남은 일 |
|---|---|---|---|
| Liner | 있음 (`LINER_API_KEY`) | 잔액 조회 정상 | 잔액이 0달러다. 주최 측 크레딧이 들어와야 검색과 에이전트 호출이 된다 |
| VAPI | 있음 (`VAPI_API_KEY`, Private 키) | 어시스턴트 조회 정상 | 쿠폰 20달러 적용됨 |
| 스티비 | 없음 | 미확인 | 계정이 무료 스타터 요금제라 API 키를 만들 수 없다. 주최 측 유료 크레딧이 계정에 들어온 뒤 워크스페이스 설정의 API 키 탭에서 발급 |
| Articul8 Bivia | 있음 (`ARTICUL8_API_KEY`, 90일 유효) | 모델 조회와 `/boolean` 결정 호출 정상 | 없음. On Demand 요금제, Bivia 10억 토큰 무료 |
| Readray | 해당 없음 | 미확인 | 공개 REST API가 없다. MCP 서버로만 붙는다 |

## 셸에서 키 불러오기

```bash
set -a && . ./.env && set +a
```

## Liner

베이스 주소는 `https://platform.liner.com/api/v1`, 헤더는 `X-API-KEY`다.

```bash
curl https://platform.liner.com/api/v1/credits/balance -H "X-API-KEY: $LINER_API_KEY"
```

```bash
curl -X POST https://platform.liner.com/api/v1/tools/search/web -H "X-API-KEY: $LINER_API_KEY" -H "Content-Type: application/json" -d '{"query":"성수동 베이커리 인스타그램 릴스 형식","max_results":10,"include_knowledge":false}'
```

- `include_knowledge`를 빼면 Premium Data가 붙어 요금이 두 배가 된다.
- 1,000건당 요금은 웹 검색 1달러, 학술 검색 0.3달러, Quick Answer 3달러, Search Agent 20달러, Deep Research 200달러다.
- Quick Answer는 `POST /agents/quick-answer`에 `{"messages":[{"role":"user","content":"..."}]}`를 보낸다. 응답은 스트리밍이다.

## VAPI

베이스 주소는 `https://api.vapi.ai`, 헤더는 `Authorization: Bearer`다. 서버 호출에는 Private 키를 쓴다.

```bash
curl "https://api.vapi.ai/assistant?limit=1" -H "Authorization: Bearer $VAPI_API_KEY"
```

- 어시스턴트 생성은 `POST /assistant`, 발신 통화는 `POST /call`이다.
- 무료 Vapi 번호는 수신 전용이다. 발신에는 가져온 번호가 필요하다.
- Vapi 호스팅 요금은 분당 0.05달러이고 음성 인식, 언어 모델, 음성 합성 비용이 따로 붙는다.
- SDK는 npm `@vapi-ai/server-sdk`, 웹용 `@vapi-ai/web`이다.

## 스티비

베이스 주소는 `https://api.stibee.com/v2`, 헤더는 `AccessToken`이다(Bearer가 아니다).

```bash
curl https://api.stibee.com/v2/auth-check -H "AccessToken: $STIBEE_API_KEY"
```

```bash
curl -X POST "https://api.stibee.com/v2/lists/주소록ID/subscribers" -H "AccessToken: $STIBEE_API_KEY" -H "Content-Type: application/json" -d '{"subscriber":{"email":"user@example.com","status":"subscribed","marketingAllowed":true,"fields":{"name":"홍길동"}},"updateEnabled":true}'
```

- 무료 스타터 요금제에는 API가 없다. 스탠다드부터 구독자 API와 자동 이메일 API, 프로부터 이메일 발송 API를 쓸 수 있다. 후원 계정이 어느 등급인지는 로그인해서 확인해야 한다.
- 자동 이메일 API 주소는 자동 이메일의 발송 조건을 "API로 요청하기"로 둔 화면에서만 보인다.
- 주소록 ID는 대시보드 주소에서 확인한다.

## Articul8 Bivia

베이스 주소는 `https://api.articul8.ai/bivia`, 헤더는 `Authorization: Bearer`다. 키 없이는 모든 엔드포인트가 401을 돌려준다. 가입은 주최 측 링크 `https://app.articul8.ai/registration?source=kr-hackathon&code=bivia`로 했고, 키는 Bivia Studio 오른쪽 위 메뉴의 Create API key에서 만든다.

```bash
curl -s https://api.articul8.ai/bivia/boolean -H "Authorization: Bearer $ARTICUL8_API_KEY" -H "Content-Type: application/json" -d '{"state":"오늘 마감 재고가 12개 남았고 평소 같은 시각에는 3개다.","question":"마감 전 소진 알림을 보내야 하는가?"}'
```

- 예와 아니오, 선택, 점수 같은 결정을 확률과 함께 돌려주는 모델이다. 엔드포인트는 `/boolean`, `/choice`, `/decide`, `/score`, `/set`, `/span`, `/extract`, `/ground`다.
- Git Bash에서 `-d`에 한글을 바로 쓰면 400(본문 해석 오류)이 난다. 본문을 UTF-8 파일로 저장해 `--data-binary @파일`로 보내거나 Node의 `fetch`를 쓴다.
- 응답 예: `{"value":"yes","probability":0.97,"status":"answered","billable_tokens":1000}`. 입력이 89토큰이어도 과금 단위는 1,000토큰으로 잡혔다.
- SDK는 pip `bivia`, npm `@articul8/bivia`다.
- 주최 측 안내서 기준 요금은 입력 토큰 100만 개당 4.2센트이고, 한국어를 포함해 50개 이상 언어와 문서, 이미지, 오디오 입력을 받는다. 답이 없으면 답하지 않고 사람에게 넘긴다(응답의 `status`가 `abstained`).
- 안내서에는 키 발급 절차와 해커톤 크레딧 금액이 적혀 있지 않다.

## Readray

REST API와 API 키가 없다. 원격 MCP 서버 `https://mcp.lilys.ai/mcp`에 Readray 로그인으로 붙는다.

```bash
claude mcp add --transport http lilys https://mcp.lilys.ai/mcp
```

※ 호출 형식의 출처는 각 서비스 공식 문서다(liner.com/ko/developers/docs, docs.vapi.ai, developers.stibee.com, docs.articul8.ai/bivia, docs.readray.ai). 스티비 호출은 키가 없어 실제로 보내 보지 못했다.
