# API仕様書

## 共通レスポンス

```json
{
  "success": true,
  "message": "string",
  "data": {}
}
```

## GAS API

- POST /login
- POST /registerUser
- POST /getUser
- POST /updateNickname
- POST /recordVisit
- GET /getBooths
- GET /getQuestions
- GET /getQuestion
- POST /submitAnswer
- GET /ranking
- POST /getHistory
- POST /generateExchangeToken
- POST /redeemExchangeToken
- POST /manualPointGrant
- POST /manualPointDeduct
- POST /recalculateRanking
- POST /analytics

## 管理系

- POST /login: `password`
- POST /searchUsers: `query`
- POST /addQuestion: `boothId`, `title`, `difficulty`, `point`, `questionText`, `hint`, `imageUrl`, `correctAnswer`, `options`
- POST /editQuestion: `questionId`, `title`, `difficulty`, `point`, `questionText`, `hint`, `imageUrl`, `correctAnswer`, `options`
- POST /deleteQuestion: `questionId`
- POST /addBooth: `boothName`, `description`, `location`
- POST /editBooth: `boothId`, `boothName`, `description`, `location`
- POST /exportCsv

## 主要入力

- submitAnswer: visitorId, nickname, questionId, answer
- redeemExchangeToken: visitorId, token
- generateExchangeToken: prizeName, cost
- manualPointGrant / manualPointDeduct: userId, point, reason

## セキュリティ

- POST は CSRF チェックを行う。
- 点数・正誤はサーバー側のみで確定する。
- 交換トークンは 60 秒で失効し、1 回のみ使用可能。
