# Bilibili Cookie 登入方法 - 完整指南

## 📋 步驟總覽

1. **瀏覽器安裝擴展** → 2. **登入 Bilibili** → 3. **匯出 Cookie** → 4. **上傳 Colab** → 5. **運行下載**

---

## Step 1: 安裝 Cookie 擴展

### Chrome / Edge
1. 打開 Chrome Web Store
2. 搜尋 **"Get cookies.txt LOCALLY"**
3. 點擊「加到 Chrome」
4. 安裝完成

### Firefox
1. 打開 Firefox Add-ons
2. 搜尋 **"cookies.txt"**
3. 安裝擴展

---

## Step 2: 登入 Bilibili

1. 打開 https://www.bilibili.com
2. **登入你嘅帳號**（必須！）
3. 確保可以正常睇影片

---

## Step 3: 匯出 Cookie

### Chrome / Edge
1. 喺 Bilibili 網站，點擊工具列嘅 **Get cookies.txt** 圖標
2. 點擊 **"Export"** 或 **"Copy"**
3. 選擇 **"Netscape HTTP Cookie File"** 格式
4. 儲存為 `cookies.txt`

### 檔案內容應該類似：
```
# Netscape HTTP Cookie File
.bilibili.com	TRUE	/	FALSE	1234567890	SESSDATA	你的 sessdata 值
.bilibili.com	TRUE	/	FALSE	1234567890	bili_jct	你的 bili_jct 值
...
```

---

## Step 4: 上傳到 Colab

喺 Colab Notebook 添加呢段代碼：

```python
# 上傳 Cookie 檔案
from google.colab import files
import os

print("📤 請上傳你嘅 cookies.txt 檔案")
print("（從瀏覽器擴展匯出嘅 Netscape 格式 Cookie 檔案）")
print()

try:
    uploaded = files.upload()
    
    # 檢查是否上傳成功
    if 'cookies.txt' in uploaded:
        COOKIE_FILE = 'cookies.txt'
        # 顯示檔案內容（隱藏敏感資訊）
        with open(COOKIE_FILE, 'r') as f:
            lines = f.readlines()
            print(f"✅ Cookie 檔案上傳成功！共 {len(lines)} 行")
            print("\n檔案預覽（前5行）：")
            for line in lines[:5]:
                if not line.startswith('#'):
                    # 隱藏實際值
                    parts = line.strip().split('\t')
                    if len(parts) >= 7:
                        print(f"  網站: {parts[0]}, 名稱: {parts[5]}")
    else:
        print("⚠️ 請確保檔案名稱係 cookies.txt")
        COOKIE_FILE = None
        
except Exception as e:
    print(f"❌ 上傳失敗: {e}")
    print("將嘗試無 Cookie 下載...")
    COOKIE_FILE = None
```

---

## Step 5: 使用 Cookie 下載

### 更新後嘅下載函數：

```python
import subprocess
import os

def download_video_with_cookie(url, filename, cookie_file=None):
    """
    下載 Bilibili 影片，支援 Cookie 登入
    """
    output_path = f"{DOWNLOAD_DIR}/{filename}.%(ext)s"
    
    # 基礎指令
    cmd = [
        "yt-dlp",
        "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "--referer", "https://www.bilibili.com",
        "--output", output_path,
        "--no-warnings",
        "--merge-output-format", "mp4",
    ]
    
    # 如果有 Cookie，加入指令
    if cookie_file and os.path.exists(cookie_file):
        cmd.extend(["--cookies", cookie_file])
        print(f"  🍪 使用 Cookie: {cookie_file}")
    else:
        print("  ⚠️ 無 Cookie，嘗試匿名下載")
    
    cmd.append(url)
    
    try:
        # 運行下載
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        
        if result.returncode == 0:
            # 找到下載嘅檔案
            for f in os.listdir(DOWNLOAD_DIR):
                if f.startswith(filename):
                    return os.path.join(DOWNLOAD_DIR, f)
        else:
            print(f"  ❌ yt-dlp 錯誤: {result.stderr[:200]}")
            
    except subprocess.TimeoutExpired:
        print("  ⏱️ 下載超時")
    except Exception as e:
        print(f"  ❌ 異常: {e}")
    
    return None


def download_video_fallback(url, filename):
    """
    備用下載方法（you-get）
    """
    print("  🔄 嘗試備用方法 you-get...")
    
    try:
        cmd = [
            "you-get",
            "--output-dir", DOWNLOAD_DIR,
            "--output-filename", filename,
            url
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        
        if result.returncode == 0:
            # 找到檔案
            for f in os.listdir(DOWNLOAD_DIR):
                if f.startswith(filename):
                    return os.path.join(DOWNLOAD_DIR, f)
        else:
            print(f"  ❌ you-get 也失敗")
            
    except Exception as e:
        print(f"  ❌ you-get 異常: {e}")
    
    return None


# 主下載流程
def download_video(url, filename):
    """
    嘗試多種方法下載
    """
    print(f"\n⬇️  下載: {filename}")
    
    # 方法 1: yt-dlp + Cookie
    path = download_video_with_cookie(url, filename, COOKIE_FILE)
    if path:
        print(f"  ✅ yt-dlp 成功")
        return path
    
    # 方法 2: you-get（無 Cookie）
    path = download_video_fallback(url, filename)
    if path:
        print(f"  ✅ you-get 成功")
        return path
    
    print(f"  ❌ 全部方法失敗")
    return None
```

---

## 🔄 完整下載流程

```python
# 逐個下載影片
downloaded = []
failed = []

for i, video in enumerate(videos, 1):
    print(f"\n{'='*60}")
    print(f"🎥 [{i}/{len(videos)}] {video['title']}")
    print(f"{'='*60}")
    
    # 清理檔案名稱
    safe_name = "".join(c for c in video['title'] if c.isalnum() or c in " -_")[:50]
    filename = f"{i:03d}_{safe_name}"
    
    # 嘗試下載
    path = download_video(video['webpage_url'], filename)
    
    if path:
        downloaded.append({
            'video': video,
            'path': path,
            'filename': filename
        })
        print(f"✅ 成功: {os.path.basename(path)}")
    else:
        failed.append(video)
        print(f"❌ 失敗: {video['title']}")

# 顯示結果
print(f"\n{'='*60}")
print(f"📊 下載結果:")
print(f"  ✅ 成功: {len(downloaded)}/{len(videos)}")
print(f"  ❌ 失敗: {len(failed)}/{len(videos)}")

if failed:
    print(f"\n失敗列表:")
    for v in failed:
        print(f"  - {v['title']}")
```

---

## 🛠️ 常見問題

### Q1: Cookie 過期點算？
**解決**: Cookie 通常有效期 1-2 個月。過期後重新登入 Bilibili，再匯出新 Cookie。

### Q2: 會員專屬影片都可以下載？
**解決**: 只要你嘅帳號有會員，用 Cookie 登入後就可以下載會員專屬內容。

### Q3: Cookie 安全嗎？
**說明**: 
- ✅ Cookie 只喺你嘅 Google Drive / Colab 使用
- ✅ 唔會傳送畀第三方
- ✅ 建議用專用/小號 Cookie
- ⚠️ 唔好分享 Cookie 檔案畀人

### Q4: 仍然下載失敗？
**嘗試**:
1. 檢查 Cookie 是否正確匯出（Netscape 格式）
2. 確認已登入 Bilibili
3. 嘗試下載其他普通影片測試
4. 使用 you-get 備用方法

---

## 📋 完整 Colab 代碼（Step 4 替換）

將原本 Step 4 嘅代碼完全替換為以上代碼，就可以使用 Cookie 下載！

老細需要我生成完整嘅更新後 Notebook 嗎？🦐