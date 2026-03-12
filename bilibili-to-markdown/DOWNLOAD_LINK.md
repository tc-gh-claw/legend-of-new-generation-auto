# 快速下載指令

## 方法 1：使用 transfer.sh（最快）

喺你嘅電腦運行：

```bash
# 下載檔案並上傳到 transfer.sh
curl -H "Max-Days: 7" \
  --upload-file colab_notebook.ipynb \
  https://transfer.sh/colab_notebook.ipynb

# 會返回連結，例如：
# https://transfer.sh/xxxxx/colab_notebook.ipynb
```

## 方法 2：直接喺 Kimi 下載

檔案已經喺上方對話傳送，請按「下載」掣。

## 方法 3：複製到 GitHub Gist

如果你想永久連結，可以：

1. 去 https://gist.github.com/
2. 貼上以下代碼內容
3. 儲存後會有公開連結

---

## 📋 Notebook 內容預覽

```python
# 主要功能：
1. 連接 Google Drive
2. 安裝 yt-dlp + Whisper
3. 下載 Bilibili 播放清單
4. 語音轉文字
5. 生成 Markdown 儲存到 Drive
```

---

請用方法 1 或方法 2 攞檔案！🦐
