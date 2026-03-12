# 上傳檔案到 Google Drive 方案

## 方案 1: 使用 gdown + Google Drive 共享連結（最簡單）

### 步驟：

1. **我準備壓縮檔案** → `bilibili-to-markdown.zip`
2. **老細提供 Google Drive 共享資料夾連結**
3. **我透過工具上傳**

### 老細需要提供：
```
1. Google Drive 資料夾連結（可寫入權限）
   例如：https://drive.google.com/drive/folders/xxxxx

2. 或临时上傳服務（如 transfer.sh）
```

---

## 方案 2: 使用 Google Drive API（自動化）

### 需要老細做：

1. **啟用 Google Drive API**:
   - 去 https://console.cloud.google.com/
   - 創建項目 → 啟用 Drive API
   - 下載 `credentials.json`

2. **共享資料夾俾服務帳號**:
   - 分享資料夾俾 `service-account@project.iam.gserviceaccount.com`
   - 畀「編輯者」權限

3. **俾我 credentials.json 內容**

### 我可以幫手：
```python
# 用 pygoogledrive 或直接 API call 上傳
```

---

## 方案 3: 臨時上傳服務（最快）

### 選項：

| 服務 | 限制 | 有效期 |
|------|------|--------|
| transfer.sh | 無限制 | 14 日 |
| WeTransfer | 2GB | 7 日 |
| File.io | 100MB | 1 次下載 |

### 做法：
```bash
# 壓縮檔案
zip -r bilibili-to-markdown.zip bilibili-to-markdown/

# 上傳到 transfer.sh
curl --upload-file bilibili-to-markdown.zip https://transfer.sh/

# 會返回下載連結
# https://transfer.sh/xxxxx/bilibili-to-markdown.zip
```

---

## 🏆 建議：方案 3 (transfer.sh) 最快

老細只需要：
1. 等我上傳完成
2. 我俾你連結
3. 你直接瀏覽器下載

無需設定，即刻可用！

---

## ❓ 老細想點做？

- **A**: 俾我 Google Drive 資料夾連結
- **B**: 俾我 Google API credentials
- **C**: 用 transfer.sh 臨時連結（我推薦）

揀好講聲，我即刻處理！🦐