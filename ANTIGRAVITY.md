# ANTIGRAVITY 專案規則

## 專案基本資訊
- **名稱**：interactive-word-cloud (2026database)
- **類型**：即時互動網頁應用 (Firebase / Supabase 遷移版)
- **建立日期**：2026-06-05
- **工作目錄**：`d:\Data\Home\Antigravity\2026database`

## 專案說明
即時文字雲互動網頁應用，支援多人實時投遞詞彙。後端已從 Supabase 遷移至 Firebase Cloud Firestore，解決休眠與連線限制問題，並整合了 Google OAuth 2.0 (Firebase Authentication) 以要求使用者登入後方可發送詞彙。

## 目錄結構
```
2026database/
├── .firebaserc         # Firebase 專案綁定
├── .gitignore          # Git 忽略規則
├── ANTIGRAVITY.md      # 專案規則（本檔）
├── firestore.rules     # Firestore 安全性規則
├── firebase.json       # Firebase 設定
├── index.html          # 前端主畫面
├── style.css           # 樣式表
├── app.js              # 前端邏輯 (Firestore 整合)
└── schema.sql          # 資料庫架構
```

## 開發規則
- 不直接使用 `git add .`，僅 stage 與本次變更相關之檔案。
- 程式碼修改前，遵循 `antigravity-workflow` 之「開工」流程。
- 結束工作時，遵循 `antigravity-workflow` 之「收工」流程。

## 外部服務
- **Firebase**：使用 Firestore 作為即時數據庫。
  - 專案 ID: `test-d4a67`
- **GitHub Pages**：部署於 https://tp1c.github.io/interactive-word-cloud/

## 注意事項
- 嚴禁 commit 任何敏感金鑰或包含私鑰、token 之檔案。
- 任何安全性規則變更需同步更新至 `firestore.rules` 並完成部署。
