# Bilibili 下載問題 - 解決方案

## 常見錯誤

### 錯誤 1: "Unable to download webpage"
```
ERROR: [Bilibili] 無法下載
```

### 錯誤 2: "Video unavailable"
```
ERROR: [Bilibili] 影片不存在或地區限制
```

### 錯誤 3: HTTP 403/412 錯誤
Bilibili 攔截咗請求

---

## ✅ 解決方案

### 方案 1: 使用 Cookie 登入（最可靠）

```python
# 喺 Colab 添加呢段代碼

# 方法 A: 上傳 cookies.txt
from google.colab import files
uploaded = files.upload()  # 上傳你嘅 cookies.txt

# 然後下載時使用
cmd = [
    "yt-dlp",
    "--cookies", "cookies.txt",  # 加入呢行
    "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "--referer", "https://www.bilibili.com",
    "--output", output_path,
    url
]
```

**點攞 Cookie:**
1. 安裝瀏覽器擴展 "Get cookies.txt LOCALLY"
2. 登入 Bilibili
3. 點擊擴展，匯出 cookies.txt
4. 上傳到 Colab

---

### 方案 2: 使用 Headers 偽裝

```python
import subprocess

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://www.bilibili.com",
    "Origin": "https://www.bilibili.com"
}

cmd = [
    "yt-dlp",
    "--user-agent", headers["User-Agent"],
    "--referer", headers["Referer"],
    "--add-header", f"Origin:{headers['Origin']}",
    "--output", output_path,
    url
]
```

---

### 方案 3: 使用 bilibili-api-python（推薦）

```python
# 安裝
!pip install bilibili-api-python

# 使用
from bilibili_api import video, Credential

# 需要 SESSDATA
credential = Credential(
    sessdata="你嘅_sessdata",
    bili_jct="你嘅_bili_jct",
    buvid3="你嘅_buvid3"
)

# 下載
v = video.Video(bvid="BVxxxx", credential=credential)
```

---

### 方案 4: 替代工具

| 工具 | 安裝 | 特點 |
|------|------|------|
| **you-get** | `pip install you-get` | 專為中文網站設計 |
| **annie** | 下載二進制 | 輕量級 |
| **lux** | `pip install lux` | 支援多平台 |

**you-get 示例：**
```python
!pip install you-get

import subprocess
subprocess.run([
    "you-get", 
    "--output-dir", DOWNLOAD_DIR,
    "--output-filename", filename,
    url
])
```

---

## 🔧 更新後嘅 Colab 代碼

### Step 2 替換為：

```python
# 安裝依賴 + 替代工具
!pip install -q yt-dlp you-get bilibili-api-python ffmpeg-python
!apt-get update -qq
!apt-get install -y -qq ffmpeg

print("✅ 依賴安裝完成！")
```

### Step 4 替換為：

```python
# 上傳 Cookie（可選）
print("📤 如果需要下載會員/地區限制影片，請上傳 cookies.txt")
print("（普通影片可跳過）")

try:
    from google.colab import files
    uploaded = files.upload()
    COOKIE_FILE = "cookies.txt"
    print(f"✅ 已上傳: {COOKIE_FILE}")
except:
    COOKIE_FILE = None
    print("⚠️ 無 Cookie，將嘗試無登入下載")
```

```python
# 改進嘅下載函數
def download_video(url, filename):
    output_path = f"{DOWNLOAD_DIR}/{filename}.%(ext)s"
    
    # 嘗試方法 1: yt-dlp with cookies
    if COOKIE_FILE and os.path.exists(COOKIE_FILE):
        cmd = [
            "yt-dlp",
            "--cookies", COOKIE_FILE,
            "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "--referer", "https://www.bilibili.com",
            "--output", output_path,
            "--no-warnings",
            url
        ]
        try:
            subprocess.run(cmd, check=True, capture_output=True)
            for f in os.listdir(DOWNLOAD_DIR):
                if f.startswith(filename):
                    return os.path.join(DOWNLOAD_DIR, f)
        except:
            print("  yt-dlp 失敗，嘗試 you-get...")
    
    # 嘗試方法 2: you-get
    try:
        cmd = [
            "you-get",
            "--output-dir", DOWNLOAD_DIR,
            "--output-filename", filename,
            url
        ]
        subprocess.run(cmd, check=True, capture_output=True)
        for f in os.listdir(DOWNLOAD_DIR):
            if f.startswith(filename):
                return os.path.join(DOWNLOAD_DIR, f)
    except Exception as e:
        print(f"  you-get 失敗: {e}")
    
    return None
```

---

## 🚨 如果全部方法都唔得

### 最後手段：手動下載 + 自動轉錄

1. **手動用 Bilibili 官方 App/網站下載影片**
2. **上傳到 Colab/Google Drive**
3. **運行轉錄部分**（Step 5-6）

```python
# 只運行轉錄部分
# 將你手動下載嘅影片放入 /content/drive/MyDrive/bilibili-projects/downloads/

# 然後直接運行轉錄
downloaded = []
for f in os.listdir(DOWNLOAD_DIR):
    if f.endswith(('.mp4', '.flv', '.mkv')):
        downloaded.append({
            'video': {'title': f, 'uploader': '未知', 'duration': 0, 'webpage_url': ''},
            'path': os.path.join(DOWNLOAD_DIR, f),
            'filename': f.split('.')[0]
        })

print(f"找到 {len(downloaded)} 個影片，開始轉錄...")
```

---

老細想試邊個方案？我即刻更新 Colab Notebook！🦐