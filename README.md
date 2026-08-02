# bunkasai2026_quiz

文化祭向けのポイントラリー & クイズシステムです。Next.js(App Router) のフロントエンドと、Google Apps Script 互換の API 実装を同一リポジトリで管理します。

## ローカル起動

1. `npm install`
2. `npm run dev`
3. `http://localhost:3000` を開く

ローカルでは Next.js 側の route handler がデータ層を担い、同じ処理ロジックを `gas/Code.gs` にも出力しています。

本番で GAS を使う場合は、`NEXT_PUBLIC_API_BASE_URL` に次の Web アプリ URL を設定します。

`https://script.google.com/macros/s/AKfycbxt_2ny5Ev5sZLR4IL7lvqcHxF5QOj25WqUFebhxzQ8DK-46V5XcS-ainEtQO8ruiJg/exec`

`/macros/library/d/...` の URL は library 用で、Web アプリの API には使えません。Apps Script の「デプロイ > デプロイを管理 > Web アプリ」から ` /exec` の URL を使ってください。

## 主要ディレクトリ

- `app/` 画面と route handler
- `components/` UI 部品
- `lib/` データ層と共通ロジック
- `gas/` Google Apps Script 実装
- `docs/` 設計書
- `scripts/seed.ts` サンプルデータ投入
