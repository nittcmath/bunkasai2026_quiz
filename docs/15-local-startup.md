# ローカル起動手順

1. `npm install`
2. 必要に応じて `.env.local` に `ADMIN_PASSWORD` を設定する
3. `npm run dev`
4. `http://localhost:3000` を開く
5. サンプルデータが必要なら `scripts/seed.ts` を実行して `.data/db.json` を生成する

## 注意

- GAS 実体はローカルでは動かさず、Next.js route handler が代替する。
- 本番接続時のみ `NEXT_PUBLIC_API_BASE_URL` を GAS Web App URL に切り替える。
- GAS Web App URL: `https://script.google.com/macros/s/AKfycbxt_2ny5Ev5sZLR4IL7lvqcHxF5QOj25WqUFebhxzQ8DK-46V5XcS-ainEtQO8ruiJg/exec`
- `https://script.google.com/macros/library/d/...` は library URL なので API 先には使わない。
