# 互動式即時「文字雲」網頁開發與部署報告

本文件記錄了為 Claude Code 配置 Supabase 連線，並開發一個即時同步、具備動態視覺效果與分享 QR Code 功能的互動式文字雲網頁應用程式的成果。

---

## 實作內容與變更

### 1. 資料庫變更 (`schema.sql`)
*   建立名為 `public.words` 的資料表，用以儲存使用者輸入的詞彙。
*   啟用了 **Row Level Security (RLS)** 行級安全原則。
*   為匿名使用者 (`anon`) 建立了三個 RLS 政策：
    *   `Allow public select`：允許前端直接讀取 (`SELECT`) 詞彙。
    *   `Allow public insert`：允許前端直接新增 (`INSERT`) 詞彙。
    *   `Allow public delete`：允許前端清空文字雲時刪除 (`DELETE`) 詞彙。
*   將 `words` 資料表加入至 `supabase_realtime` 發布中，以啟用 Realtime 即時推播功能。

### 2. 前端應用程式開發
我們在工作區建立了三個核心檔案，建構出完整的單頁網頁應用程式 (SPA)：
*   [index.html](file:///d:/Data/Home/Antigravity/2026database/index.html)：定義骨架，載入 Supabase JS SDK 及 `qrcode` 生成庫。引進了版本控制參數 `style.css?v=2` 防止瀏覽器快取舊的樣式。新增了**清空文字雲**的控制按鈕。
*   [style.css](file:///d:/Data/Home/Antigravity/2026database/style.css)：設計深色霓虹 (Sleek Dark Mode & Neon Lights) 風格，配置玻璃擬物控制面板，並設計了文字雲項目隨機的字體大小、HSL 色彩和三組平滑浮動動畫。新增了紅色警示按鈕 `.btn-clear` 的質感霓虹懸停效果。
*   [app.js](file:///d:/Data/Home/Antigravity/2026database/app.js)：
    *   透過 Publishable Key 安全地與 Supabase 連接。
    *   **網格防重疊演算**：利用 10x7 的虛擬網格系統放置單個詞彙，避免多個詞彙在隨機擺放時發生嚴重重疊。
    *   **樂觀更新 (Optimistic UI) 與去重機制**：當使用者按下「送出」且寫入資料庫成功時，**立即（不用等待 Realtime 回傳）**將字彙渲染至文字雲，提供極速的反饋。同時在 `renderWord` 內部管理 `wordsList` 進行排重，確保歷史載入、樂觀渲染與 WebSocket 即時推播不會產生任何重複文字。
    *   **一鍵清空文字雲**：新增清空按鈕點擊事件，在使用者確認後清除資料庫中所有文字，並重置本機狀態與排版網格。
    *   **Realtime 多端同步清空**：擴展訂閱為 `event: '*'`，當接收到 `DELETE` 事件（即其他使用者點選清空）時，自動將自己網頁上的文字雲同步清除並顯示空狀態。
    *   **顯示切換 (ID 優先權與強制隱藏)**：使用 ID 選擇器優先級 `#cloud-container.hidden` 搭配 `!important` 與 `visibility: hidden;`，確保文字雲隱藏時能徹底從瀏覽器圖層中淡出隱藏，解決部分瀏覽器因 CSS 動畫 GPU 加速導致 `opacity: 0` 失效的問題。
    *   **分享 QR Code**：動態讀取目前的網址 (`window.location.href`)，即時生成分享二維碼，並提供一鍵複製網址的便利按鈕。

---

## 驗證與測試結果

### 1. 本地伺服器運行
我們已為您在本機啟動了輕量網頁伺服器：
*   **本地網址**：`http://127.0.0.1:8080`
*   **指令**：`npx http-server -p 8080` (目前在背景保持運作)

### 2. 即時連線與資料驗證
*   **資料讀寫與清空測試**：網頁載入時會自動拉取最新詞彙。輸入詞彙送出後可即時看到效果；點擊「清空文字雲」按鈕並確認後，網頁與 Supabase 中的資料均被成功清空。
*   **即時同步測試**：開啟多個視窗時，任一視窗輸入的詞彙或進行的「清空」操作，皆能在 1 秒內透過 Realtime 機制同步推播並更新至其他所有視窗。
*   **QR Code 分享測試**：右下角會顯示當前訪問網址的 QR Code，並已實測能點擊複製網址按鈕。
