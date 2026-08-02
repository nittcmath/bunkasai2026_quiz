# 障害復旧手順

## visitorId 紛失

- 新しい Cookie を再発行する
- 既存の回答履歴は userId 単位で保持しているため、可能なら旧 userId を復旧する

## 交換 QR 誤使用

- used=true のトークンは再利用不可
- 誤交換時は AdminLogs を確認し、手動減算または手動付与で補正する

## Spreadsheet の破損

- バックアップから復元する
- 直後にランキング再計算を実行する

## GAS エラー

- AdminLogs と Stackdriver を確認する
- 直近のスキーマ変更があれば Sheets の列名を再確認する
