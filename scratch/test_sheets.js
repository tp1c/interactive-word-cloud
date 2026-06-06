const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');

// Define scopes: we need read/write access to sheets
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const TOKEN_PATH = path.join(__dirname, 'token.json');

/**
 * Loads saved credentials if they exist.
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Saves credentials to a file.
 */
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

/**
 * Authorizes the client.
 */
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

/**
 * Creates a new Google Sheet and populates it with test data.
 */
async function createAndWriteSheet(auth) {
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    console.log('正在為您在雲端建立新的 Google 試算表...');
    
    // 1. Create the spreadsheet
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

    // 2. Add header and dummy rows
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
