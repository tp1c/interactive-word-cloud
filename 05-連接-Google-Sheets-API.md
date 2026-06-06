# Claude Code 懶人包 #05：連接 Google Sheets API（OAuth 2.0 授權版）

> 版本：v1.0
> 更新日期：2026-06-06
> 對應測試：Google Cloud 與 Antigravity 連接測試

本懶人包記錄了在 **組織安全性原則限制建立服務帳戶金鑰** 的情況下，如何改用 **OAuth 2.0 用戶端憑證（Desktop Application 流程）** 成功連接 Google Sheets API，並透過 Node.js 自動建立試算表與寫入資料。

---

## 為什麼選擇 OAuth 2.0 個人帳號授權？

1. **繞過組織安全限制**：許多公司或學校的 Google Workspace 會在組織層級限制 `iam.disableServiceAccountKeyCreation`，導致開發者無法下載 Service Account 的 JSON 金鑰。OAuth 2.0 個人授權流不需要機器金鑰。
2. **免除複雜的共用設定**：程式執行時會以「執行者本人」的權限操作雲端硬碟，因此不需要手動把試算表共用給服務帳戶的 Email。
3. **無縫整合個人硬碟**：自動建立的試算表會直接儲存在您個人的 Google 雲端硬碟中，便於隨時查看。

---

## 步驟一：GCP Console 啟用 API 與建立憑證

1. **啟用 Google Sheets API**：
   - 進入 [Google Cloud Console](https://console.cloud.google.com/)。
   - 搜尋並點選進入 **Google Sheets API**，點擊 **Enable (啟用)**。
2. **建立 OAuth 用戶端 ID**：
   - 在左側導覽選單或上方搜尋欄，進入 **APIs & Services (APIs 和服務) -> Credentials (憑證)**。
   - 點擊頂部的 **Create credentials (建立憑證) -> OAuth client ID (OAuth 用戶端 ID)**。
   - **Application type (應用程式類型)** 選擇 **Desktop app (傳統型應用程式)**。
   - **Name (名稱)** 輸入 `Sheets Test`，點擊 **Create (建立)**。
3. **下載金鑰**：
   - 在跳出的視窗中點擊 **Download JSON (下載 JSON)** 檔案。
   - 將檔案重新命名為 **`credentials.json`**，並放到專案的 **`scratch/`** 資料夾中。

---

## 步驟二：解決 403 存取拒絕（測試人員設定）

由於您的 OAuth 同意畫面處於 "Testing" (測試中) 狀態，預設只有名單中的帳號才能登入。
1. 在 GCP Console 進入 **Google Auth Platform -> Audience (受眾)**（舊版介面為 **OAuth consent screen -> Test users**）。
2. 在 **Test users (測試使用者)** 區塊中點選 **Add users (新增使用者)**。
3. 輸入您的 Gmail 帳號（例如：`tp1chen@gmail.com`），點選儲存。

---

## 步驟三：Node.js 連線程式碼實作

程式碼檔案已儲存於 [scratch/test_sheets.js](file:///d:/Data/Home/Antigravity/2026database/scratch/test_sheets.js)，內容包含：
* 偵測本地是否有快取的 Token，若無則開啟瀏覽器進行 OAuth 2.0 登入。
* 登入後將 Access/Refresh Token 快取至 `token.json` 中，避免重複登入。
* 調用 Google Sheets API `v4` 自動在雲端建立試算表，並寫入測試資料。

### 安裝相依套件
在專案目錄下執行：
```bash
npm install googleapis @google-cloud/local-auth
```

### 完整測試程式碼 `test_sheets.js`
```javascript
const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const TOKEN_PATH = path.join(__dirname, 'token.json');

async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  console.log('尚未偵測到 Token，啟動瀏覽器進行 OAuth 驗證...');
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
    console.log('驗證成功！已將 Token 儲存至 scratch/token.json');
  }
  return client;
}

async function createAndWriteSheet(auth) {
  const sheets = google.sheets({ version: 'v4', auth });
  try {
    console.log('正在為您在雲端建立新的 Google 試算表...');
    const createResponse = await sheets.spreadsheets.create({
      resource: {
        properties: {
          title: 'Antigravity AI 測試試算表 (Interactive Word Cloud)',
        },
      },
      fields: 'spreadsheetId,spreadsheetUrl',
    });

    const spreadsheetId = createResponse.data.spreadsheetId;
    const spreadsheetUrl = createResponse.data.spreadsheetUrl;
    console.log(`\n🎉 試算表建立成功！`);
    console.log(`試算表 ID: ${spreadsheetId}`);
    console.log(`試算表網址: ${spreadsheetUrl}`);

    console.log('\n正在寫入測試資料...');
    const values = [
      ['時間戳記 (Timestamp)', '來源 (Source)', '測試詞彙 (Word)', '測試狀態 (Status)'],
      [new Date().toLocaleString(), 'Antigravity AI', 'Hello Google Sheets!', '成功 (Success)'],
      [new Date().toLocaleString(), 'Antigravity AI', 'OAuth 2.0 Flow', '完成 (Done)'],
      [new Date().toLocaleString(), 'User Interface', 'Connection Test', '順利 (Smooth)']
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Sheet1!A1',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values,
      },
    });
    console.log('測試資料寫入完成！請點擊上方網址查看試算表。');
  } catch (err) {
    console.error('執行 API 時發生錯誤:', err);
  }
}

async function run() {
  try {
    const auth = await authorize();
    await createAndWriteSheet(auth);
  } catch (e) {
    console.error('執行失敗:', e);
  }
}

run();
```

---

## 步驟四：執行與驗證結果

1. **執行程式**：
   ```bash
   node scratch/test_sheets.js
   ```
2. **瀏覽器授權**：
   - 程式會自動在瀏覽器中開啟 Google 授權網頁。
   - 登入 `tp1chen@gmail.com`，繞過未經驗證的警告（點選進階 -> 繼續前往）。
   - 勾選允許管理您的試算表權限。
3. **完成驗證與寫入**：
   - 終端機會顯示建立成功的試算表 ID 以及網址，並顯示寫入完成的訊息。
   - 測試用試算表已成功產出：
     * **ID**：`1Sy3N-mkLq6qgmTHs2SCdYjgUGKqkiLT5b1lDQgzs-HU`
     * **網址**：[https://docs.google.com/spreadsheets/d/1Sy3N-mkLq6qgmTHs2SCdYjgUGKqkiLT5b1lDQgzs-HU/edit](https://docs.google.com/spreadsheets/d/1Sy3N-mkLq6qgmTHs2SCdYjgUGKqkiLT5b1lDQgzs-HU/edit)
