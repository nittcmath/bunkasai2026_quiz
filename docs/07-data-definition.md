# データ定義書

## Users

- userId: UUIDv4 互換文字列
- nickname: 表示名。初回は空でもよい
- createdAt / lastLogin / lastActivity: ISO8601
- totalPoints: 累積獲得ポイント
- currentPoints: 利用可能ポイント
- correctCount: 正解数
- answerCount: 回答総数
- visitedBooths: 訪問済み模擬店 ID 群

## Questions

- difficulty: 1 から 5
- point: 難易度と一致する推奨ポイント
- correctAnswer: 正誤判定に使うサーバー側正解値
- options: 選択式回答候補。自由入力の場合は空配列

## Answers

- すべての回答を保存する
- isCorrect が true のときのみ earnedPoint を加算する
- 同一問題の重複正答は履歴としては残るが加点しない

## ExchangeTokens

- expireAt は発行から 60 秒後
- used / usedBy で使い回し防止を行う

## Analytics

- 日次集計の保存先
- 参照用途が中心で、手動編集しない
