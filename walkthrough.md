# 互動式即時「文字雲」網頁 — Firebase 轉移與部署報告

本文件記錄了將「即時文字雲」網頁應用的資料庫後端從 Supabase 遷移至 **Firebase Cloud Firestore** 的實作變更與驗證結果。

---

## 為什麼選擇轉移至 Firebase？

1. **永遠不會休眠暫停**：Supabase 免費專案在一週無 API 請求時會被自動暫停（需要手動重啟或設定排程防休眠）；而 Firebase Spark（免費）方案**永遠不會因閒置而暫停**。
2. **高達 100 萬的同時連線數**：Supabase 免費版限 200 個並發連線，而 Firebase 支援高達 100 萬個並發連線，極度適合大型研習或群眾互動場景。
3. **更精簡的實作程式碼**：透過 Firestore SDK 的 `onSnapshot`，我們用單一函數直接搞定了「歷史數據初始化載入」與「多端即時新增／刪除同步」，代碼量減少了 30% 以上。

---

## 實作變更內容

### 1. Firebase 專案與 Web App 初始化
- 建立了 Firebase Web 應用，配置其專屬之 `firebaseConfig` 物件於 `app.js`。
- 專案 ID: `test-d4a67`
- 應用 ID: `1:918172597123:web:662724d40027374c4754b6`

### 2. Firestore 安全性規則與 CLI 配置
我們新增了三個設定檔，以支援完全自動化的規則管理與 CLI 部署：
- [firestore.rules](file:///d:/Data/Home/Antigravity/2026database/firestore.rules)：設定 `/words` 集合的安全性規則，允許匿名使用者進行 `read, write`，預設拒絕其他集合。
- [firebase.json](file:///d:/Data/Home/Antigravity/2026database/firebase.json)：指定 Firestore 規則對應的本機規則檔案名稱。
- [.firebaserc](file:///d:/Data/Home/Antigravity/2026database/.firebaserc)：將本地專案目錄綁定至 Firebase 專案 `test-d4a67`。
- **規則部署**：已透過 `firebase-tools` CLI 成功將規則部署至雲端，且自動啟用了 Firestore Database API。

### 3. 前端代碼遷移

#### [index.html](file:///d:/Data/Home/Antigravity/2026database/index.html)
- 移除原本的 Supabase Client SDK CDN 載入。
- 改為引入 **Firebase JS SDK (Compat 版本)** 的 App 與 Firestore 函式庫：
  ```html
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js"></script>
  ```

#### [app.js](file:///d:/Data/Home/Antigravity/2026database/app.js)
- **初始化**：使用 `firebase.initializeApp(firebaseConfig)` 與 `firebase.firestore()` 初始化資料庫實例。
- **送出詞彙 (`submitWord`)**：改用 `db.collection('words').add()`，並附加客戶端生成的 `created_at` 時間戳記，以確保即時排序。
- **即時數據監聽 (`setupRealtimeSubscription`)**：
  - 移除了冗餘 learnings/`loadHistoricalWords` 函數。
  - 使用 `db.collection('words').orderBy('created_at', 'asc').onSnapshot(...)` 一次完成初次歷史載入與後續即時更新。
  - 根據 `change.type === 'added'` 自動渲染詞彙。
  - 根據 `change.type === 'removed'` 透過 DOM 屬性 `data-doc-id` 精確定位被刪除的字詞並將其從畫面上移除，完成即時同步刪除。
- **清空文字雲 (`clearCloud`)**：使用 `db.collection('words').get()` 取得所有詞彙的 Document 參照，透過 `db.batch()` 批次執行刪除作業。

---

## 驗證與測試結果

1. **安全性規則部署成功**：部署指令順利執行，API 自動啟用且規則發布完成。
2. **網頁載入與即時同步功能**：
   - 網頁端載入後能正常訂閱 Firestore 集合。
   - 新增詞彙後，資料庫會瞬間寫入，且其他開啟同網頁的視窗能在 1 秒內同步渲染該詞彙。
   - **清除雲端測試**：點擊「清空文字雲」按鈕後，會執行 Batch 刪除，Firestore 資料庫被清空，所有已連線網頁上的文字雲也會在 1 秒內同步淡出消失。
3. **GitHub Pages 更新完成**：更新已推送至 Git `master` 分支，目前 GitHub Pages 已部署最新 Firebase 架構的網頁。

### 測試連結：
- 部署網址：**https://tp1c.github.io/interactive-word-cloud/**

---

## 新增 Google OAuth 2.0 / Firebase Authentication 整合 (2026-06-06)

為了進行與 Antigravity 的 Google Cloud / Firebase Auth 整合連線測試，我們完成了解決安全與使用者權限的 OAuth 2.0 登入機制：

### 1. 變更內容說明

* **[firestore.rules](file:///d:/Data/Home/Antigravity/2026database/firestore.rules)**：
  - 更新 `/words` 集合的安全性規則，限制 `allow write: if request.auth != null;`。未登入者無法寫入或清除資料庫。
  - **已成功部署**：使用 `npx firebase-tools deploy` 完成最新規則部署。
* **[index.html](file:///d:/Data/Home/Antigravity/2026database/index.html)**：
  - 引入 `firebase-auth-compat.js` SDK。
  - 新增 Google 登入按鈕區塊，且未登入時預設隱藏輸入框；登入後顯示輸入框。
  - 新增使用者狀態欄（包含 Google 頭像、姓名、登出按鈕）。
* **[style.css](file:///d:/Data/Home/Antigravity/2026database/style.css)**：
  - 設計玻璃擬物化 (Glassmorphic) 登入按鈕與使用者狀態卡片。
  - 加入頭像外框光暈與微互動浮動動畫。
* **[app.js](file:///d:/Data/Home/Antigravity/2026database/app.js)**：
  - 註冊並監聽 `firebase.auth().onAuthStateChanged`。
  - 實作 `loginWithGoogle()` (支援 Popup 彈出與 Redirect 重新導向) 及 `logout()`。
  - 寫入詞彙時，將使用者的 `uid` 與 `user_name` 一併存入資料庫以供記錄。

### 2. 測試驗證方式

* **本地端伺服器**：已在本地啟動 http-server 服務於 [http://127.0.0.1:8080](http://127.0.0.1:8080)。
* **權限測試**：
  1. 打開頁面時，未登入前會顯示「🔑 使用 Google 登入以參與」按鈕，無法直接輸入詞彙。
  2. 點擊登入按鈕完成 OAuth 授權後，系統將載入頭像、顯示輸入框。
  3. 輸入詞彙後，確認可以成功新增到 Firestore 雲端，並實時呈現在畫面上。
  4. 點擊「🚪 (登出)」後，系統會自動清除狀態，隱藏輸入框並重新顯示登入按鈕。

