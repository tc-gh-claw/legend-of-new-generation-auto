# Bilibili 轉 Markdown - 安裝同使用指南

## 📦 安裝步驟

### 1. 系統要求

- **OS**: Windows 10/11, macOS, 或 Linux
- **Python**: 3.9 或以上
- **RAM**: 最少 8GB，建議 16GB
- **儲存空間**: 最少 10GB（視乎影片數量）

### 2. 安裝依賴

```bash
# 創建項目目錄
mkdir bilibili-to-markdown
cd bilibili-to-markdown

# 創建 Python 虛擬環境
python -m venv venv

# 啟動虛擬環境
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 安裝 Python 依賴
pip install yt-dlp openai-whisper ffmpeg-python
```

### 3. 安裝 FFmpeg

#### Windows
```powershell
# 使用 Chocolatey
choco install ffmpeg

# 或使用 Scoop
scoop install ffmpeg
```

#### macOS
```bash
brew install ffmpeg
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install ffmpeg
```

驗證安裝：
```bash
ffmpeg -version
```

### 4. 準備檔案

```bash
# 下載腳本
curl -O https://raw.githubusercontent.com/your-repo/bilibili_to_md.py

# 或手動複製 bilibili_to_md.py 到項目目錄
```

---

## 🚀 使用方法

### 基本用法

```bash
python bilibili_to_md.py "https://space.bilibili.com/1925268550/lists/839662?type=season"
```

### 常用選項

```bash
# 使用更快嘅模型（但準確度較低）
python bilibili_to_md.py "URL" --model tiny

# 使用更準確嘅模型（但更慢）
python bilibili_to_md.py "URL" --model medium

# 指定輸出目錄
python bilibili_to_md.py "URL" --output ./my_output

# 只處理前 3 條片（測試用）
python bilibili_to_md.py "URL" --limit 3

# 只下載，唔轉錄
python bilibili_to_md.py "URL" --download-only
```

### 完整示例

```bash
# 最佳配置（平衡速度同準確度）
python bilibili_to_md.py \
  "https://space.bilibili.com/1925268550/lists/839662?type=season" \
  --model small \
  --language zh \
  --output ./output
```

---

## 🔧 進階設定

### Cookie 登入（處理會員專屬內容）

如果播放清單包含會員專屬影片，需要先匯出 Cookie：

1. **安裝瀏覽器擴展**:
   - Chrome: "Get cookies.txt LOCALLY"
   - Firefox: "cookies.txt"

2. **匯出 Cookie**:
   - 登入 Bilibili
   - 打開擴展，匯出 cookies.txt

3. **使用 Cookie**:
   ```bash
   python bilibili_to_md.py "URL" --cookies ./cookies.txt
   ```

### Whisper 模型選擇

| 模型 | 大小 | 速度 | 準確度 | 適合場景 |
|------|------|------|--------|----------|
| tiny | 39 MB | ⚡ 最快 | ⭐⭐ | 快速測試 |
| base | 74 MB | 🚀 快 | ⭐⭐⭐ | 草稿 |
| **small** | **244 MB** | **✓ 中等** | **⭐⭐⭐⭐** | **推薦** |
| medium | 769 MB | 🐢 慢 | ⭐⭐⭐⭐⭐ | 高準確度 |
| large | 1.5 GB | 🐌 最慢 | ⭐⭐⭐⭐⭐ | 最佳質素 |

### GPU 加速（可選）

如果有 NVIDIA GPU，Whisper 會自動使用 CUDA 加速：

```bash
# 安裝 PyTorch with CUDA
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

---

## 📁 輸出結構

```
output/
├── 001_影片標題一.md
├── 002_影片標題二.md
├── 003_影片標題三.md
├── ...
└── summary.md          # 索引檔案

downloads/              # 下載嘅影片（臨時）
├── 001_影片標題一.mp4
├── 002_影片標題二.mp4
└── ...

audio/                  # 提取嘅音軌（臨時）
├── 001_影片標題一.wav
├── 002_影片標題二.wav
└── ...
```

---

## ⚠️ 常見問題

### Q1: yt-dlp 報錯 "Unable to extract"

**解決**: 更新 yt-dlp
```bash
pip install -U yt-dlp
```

### Q2: FFmpeg 找不到

**解決**: 確保 FFmpeg 已加入系統 PATH
```bash
# 檢查
which ffmpeg      # macOS/Linux
where ffmpeg      # Windows
```

### Q3: Whisper 模型下載失敗

**解決**: 手動下載模型
```python
import whisper
whisper.load_model("small")  # 首次會自動下載
```

### Q4: 中文識別不準確

**解決**: 確認指定 `--language zh`，或使用更大模型

### Q5: 下載速度很慢

**解決**: 
- 檢查網絡連接
- 嘗試使用 `--cookies` 登入（有時登入後速度更快）

---

## 🔒 注意事項

1. **版權**: 僅供個人學習使用，唔好用於商業用途
2. **私隱**: 所有處理喺本地完成，唔會上傳去第三方
3. **儲存**: 確保有足夠硬碟空間（影片 + 音訊 + Markdown）

---

## 📞 支援

有問題可以：
1. 檢查日誌檔案 `bilibili_to_md.log`
2. 使用 `--help` 查看所有選項
3. 開 GitHub Issue（如果有）

---

**祝你使用愉快！** 🦐
