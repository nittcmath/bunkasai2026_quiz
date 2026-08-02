# デプロイ手順

## Next.js

1. `npm install`
2. `npm run dev` でローカル起動
3. `npm run build` で本番ビルド確認
4. Vercel か任意の Node 実行環境へ配置

## GAS

1. Google Spreadsheet を新規作成する
2. Apps Script エディタで `gas/Code.gs` と `gas/appsscript.json` を貼り付ける
3. Spreadsheet に紐づける
4. スクリプトプロパティに `ADMIN_PASSWORD` 相当を保存する
5. Web アプリとしてデプロイし、URL を `NEXT_PUBLIC_API_BASE_URL` に設定する
   - `https://script.google.com/macros/s/AKfycbxt_2ny5Ev5sZLR4IL7lvqcHxF5QOj25WqUFebhxzQ8DK-46V5XcS-ainEtQO8ruiJg/exec`
   - `https://script.google.com/macros/library/d/...` は library 用なので使わない
   - `NEXT_PUBLIC_API_BASE_URL` を変更したら Next.js を再起動する

## 運用接続

- 本番では Next.js から GAS Web App URL へ送信する。
- ローカルでは `/api/gas/*` と `/api/admin/*` が同等処理を担う。
- `lib/api-client.ts` は、`NEXT_PUBLIC_API_BASE_URL` が HTTP URL のときは GAS の `?endpoint=` 形式に自動変換する。
