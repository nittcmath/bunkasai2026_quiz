# Google Spreadsheet設計書

## シート一覧

- Users
- Questions
- Answers
- Booths
- BoothVisits
- ExchangeTokens
- Exchanges
- AdminLogs
- Analytics

## 更新ポリシー

- Users は回答・交換・訪問で随時更新する。
- Answers は追記のみ。
- BoothVisits は追記のみ。
- ExchangeTokens は発行時に追記し、使用時に used / usedBy を更新する。
- Exchanges は追記のみ。
- AdminLogs は全操作を追記する。

## 主要列

- Users: userId, nickname, createdAt, lastLogin, totalPoints, currentPoints, correctCount, answerCount, visitedBooths, lastActivity
- Questions: questionId, boothId, title, difficulty, point, questionText, hint, imageUrl, correctAnswer, createdAt
- Answers: answerId, userId, questionId, userAnswer, isCorrect, earnedPoint, timestamp
- Booths: boothId, boothName, description, location
- BoothVisits: visitId, userId, boothId, timestamp
- ExchangeTokens: token, prizeName, cost, createdAt, expireAt, used, usedBy
- Exchanges: exchangeId, userId, nickname, prizeName, cost, timestamp
- AdminLogs: logId, adminAction, detail, timestamp
- Analytics: date, visitors, answers, correctRate, exchangeCount

## 集計

- ランキングは totalPoints 降順、次に correctCount 降順で算出。
- 正答率は Answers の isCorrect を基準に計算する。
