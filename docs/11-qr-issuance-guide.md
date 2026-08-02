# QR発行手順

## 模擬店 QR

1. Booths に模擬店を登録する
2. `https://<domain>/booth/<boothId>` の QR を生成する
3. 模擬店前に掲示する

## 問題 QR

- 通常は模擬店 QR から問題一覧へ入る
- 問題単体に直接飛ばす場合は `/question/<questionId>` を生成する

## 景品交換 QR

1. 管理者が景品名と必要ポイントを入力する
2. `Generate` を押す
3. `exchangeToken` を 60 秒有効で発行する
4. `/exchange?token=XXXX` の QR を受付で提示する

## 運用注意

- 交換 QR は印刷後に長時間放置しない
- 1 回使用したら再利用しない
