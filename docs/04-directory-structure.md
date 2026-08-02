# ディレクトリ構成

```text
bunkasai2026/
  app/
    api/
    admin/
    booth/
    exchange/
    me/
    question/
    ranking/
    scan/
    globals.css
    layout.tsx
    page.tsx
  components/
    ui/
    answer-form.tsx
    admin-console.tsx
    exchange-confirm.tsx
    footer-nav.tsx
    modal.tsx
    qr-code.tsx
    scan-client.tsx
    site-header.tsx
    theme-provider.tsx
  docs/
  gas/
    Code.gs
    appsscript.json
  lib/
    auth.ts
    api-client.ts
    format.ts
    mock-data.ts
    rate-limit.ts
    service.ts
    store.ts
    types.ts
    utils.ts
  scripts/
    seed.ts
```

- `app/` は画面と API エンドポイント。
- `lib/` はドメインロジックの中心。
- `gas/` は Spreadsheet 正本のバックエンド移植版。
- `docs/` は運用・設計資料。
