# 画面遷移図

```mermaid
flowchart TD
  H[/ /] --> B[/booth/[boothId]/]
  B --> Q[/question/[questionId]/]
  Q --> H
  Q --> B
  H --> R[/ranking/]
  H --> M[/me/]
  H --> S[/scan/]
  H --> A[/admin/]
  S --> B
  A --> X[/exchange?token=XXXX/]
  X --> H
```

- ホームはダッシュボードとして機能する。
- 模擬店ページは問題一覧への入口になる。
- 問題詳細は回答と初回ニックネーム登録をまとめる。
- 交換ページは受付 QR のみで到達し、トークン検証後に確定する。
