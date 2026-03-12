#!/usr/bin/env python3
"""
Bilibili 影片下載 + Markdown 轉換器 - 概念驗證腳本
Proof of Concept Script
"""

import os
import sys
import json
import subprocess
from pathlib import Path

# 配置
CONFIG = {
    "playlist_url": "https://space.bilibili.com/1925268550/lists/839662?type=season",
    "output_dir": "./output",
    "download_dir": "./downloads",
    "whisper_model": "small",  # tiny/base/small/medium/large
    "language": "zh",  # 中文
}

def check_dependencies():
    """檢查必要依賴"""
    print("🔍 檢查系統依賴...")
    
    deps = {
        "yt-dlp": "pip install yt-dlp",
        "whisper": "pip install openai-whisper",
        "ffmpeg": "系統安裝: apt install ffmpeg / brew install ffmpeg",
    }
    
    missing = []
    for cmd, install_cmd in deps.items():
        try:
            subprocess.run([cmd, "--version"], capture_output=True, check=True)
            print(f"  ✅ {cmd}")
        except:
            print(f"  ❌ {cmd} - 安裝: {install_cmd}")
            missing.append(cmd)
    
    if missing:
        print(f"\n⚠️ 缺少依賴: {', '.join(missing)}")
        print("請先安裝上述依賴再運行腳本")
        return False
    
    return True

def download_playlist_info(url):
    """
    獲取播放清單資訊 (不下載影片)
    使用 yt-dlp 提取元數據
    """
    print(f"\n📋 解析播放清單...")
    print(f"URL: {url}")
    
    # 這係示例代碼，實際運行需要 yt-dlp
    cmd = [
        "yt-dlp",
        "--flat-playlist",
        "--dump-json",
        "--playlist-end", "5",  # 先測試前5條
        url
    ]
    
    print(f"\n運行指令: {' '.join(cmd)}")
    print("(這係演示，實際運行會獲取影片資訊)")
    
    # 模擬輸出
    sample_videos = [
        {"id": "BV1xx411c7mD", "title": "示例影片 1", "uploader": "頻道名稱", "duration": 600},
        {"id": "BV2xx411c7mE", "title": "示例影片 2", "uploader": "頻道名稱", "duration": 900},
        {"id": "BV3xx411c7mF", "title": "示例影片 3", "uploader": "頻道名稱", "duration": 1200},
    ]
    
    return sample_videos

def download_video(video_id, output_dir):
    """
    下載單個影片
    """
    print(f"\n⬇️  下載影片: {video_id}")
    
    # yt-dlp 指令示例
    cmd = [
        "yt-dlp",
        "--format", "bestvideo[height<=1080]+bestaudio/best",
        "--merge-output-format", "mp4",
        "--output", f"{output_dir}/%(playlist_index)s_%(title)s.%(ext)s",
        f"https://www.bilibili.com/video/{video_id}"
    ]
    
    print(f"指令: {' '.join(cmd)}")
    return True

def extract_audio(video_path, output_path):
    """
    使用 FFmpeg 提取音軌
    """
    print(f"\n🎵 提取音軌: {video_path}")
    
    cmd = [
        "ffmpeg",
        "-i", video_path,
        "-vn",  # 無視頻
        "-acodec", "pcm_s16le",  # PCM 16bit
        "-ar", "16000",  # 16kHz (Whisper 推薦)
        "-ac", "1",  # 單聲道
        output_path
    ]
    
    print(f"指令: {' '.join(cmd)}")
    return True

def transcribe_audio(audio_path, model="small", language="zh"):
    """
    使用 Whisper 轉錄音訊
    """
    print(f"\n📝 語音轉文字: {audio_path}")
    print(f"模型: {model}, 語言: {language}")
    
    # Whisper Python API 示例
    code = f'''
import whisper

model = whisper.load_model("{model}")
result = model.transcribe("{audio_path}", language="{language}")

# 輸出結果
for segment in result["segments"]:
    start = segment["start"]
    end = segment["end"]
    text = segment["text"]
    print(f"[{{start:.2f}} - {{end:.2f}}] {{text}}")

# 儲存為 JSON
import json
with open("{audio_path}.json", "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)
'''
    
    print("Python 代碼:")
    print(code)
    
    # 模擬轉錄結果
    return {
        "segments": [
            {"start": 0, "end": 30, "text": "這係第一段示範文字..."},
            {"start": 30, "end": 60, "text": "這係第二段示範文字..."},
        ],
        "text": "這係完整轉錄文字..."
    }

def generate_markdown(video_info, transcript, output_path):
    """
    生成 Markdown 檔案
    """
    print(f"\n📄 生成 Markdown: {output_path}")
    
    md_content = f"""# {video_info['title']}

## 元數據
- **來源**: Bilibili
- **UP主**: {video_info['uploader']}
- **BV號**: {video_info['id']}
- **時長**: {video_info['duration']} 秒
- **下載日期**: 2025-03-05

---

## 內容轉錄

"""
    
    # 添加時間戳段落
    for seg in transcript.get("segments", []):
        start_min = int(seg["start"] // 60)
        start_sec = int(seg["start"] % 60)
        end_min = int(seg["end"] // 60)
        end_sec = int(seg["end"] % 60)
        
        md_content += f"### {start_min:02d}:{start_sec:02d} - {end_min:02d}:{end_sec:02d}\n\n"
        md_content += f"{seg['text'].strip()}\n\n"
    
    md_content += """---

*由 bilibili-to-markdown 工具自動生成*
"""
    
    print("Markdown 內容預覽:")
    print("=" * 50)
    print(md_content[:500])
    print("...")
    print("=" * 50)
    
    return md_content

def main():
    """主程序"""
    print("=" * 60)
    print("🎬 Bilibili 影片下載 + Markdown 轉換器")
    print("=" * 60)
    
    # 檢查依賴
    if not check_dependencies():
        return 1
    
    # 創建輸出目錄
    os.makedirs(CONFIG["download_dir"], exist_ok=True)
    os.makedirs(CONFIG["output_dir"], exist_ok=True)
    
    # Step 1: 獲取播放清單
    videos = download_playlist_info(CONFIG["playlist_url"])
    print(f"\n✅ 找到 {len(videos)} 條影片")
    
    # Step 2-5: 處理每條影片 (演示)
    for i, video in enumerate(videos, 1):
        print(f"\n{'='*60}")
        print(f"🎥 處理影片 {i}/{len(videos)}: {video['title']}")
        print(f"{'='*60}")
        
        # 模擬處理流程
        video_path = f"{CONFIG['download_dir']}/{i:03d}_{video['title']}.mp4"
        audio_path = f"{CONFIG['download_dir']}/{i:03d}_{video['title']}.wav"
        md_path = f"{CONFIG['output_dir']}/{i:03d}_{video['title']}.md"
        
        # download_video(video['id'], CONFIG["download_dir"])
        # extract_audio(video_path, audio_path)
        transcript = transcribe_audio(audio_path, CONFIG["whisper_model"], CONFIG["language"])
        generate_markdown(video, transcript, md_path)
        
        print(f"\n✅ 完成: {md_path}")
    
    # 生成索引檔案
    print(f"\n{'='*60}")
    print("📑 生成索引檔案")
    print(f"{'='*60}")
    
    summary = f"""# Bilibili 播放清單轉錄索引

**來源**: {CONFIG['playlist_url']}
**生成日期**: 2025-03-05
**總影片數**: {len(videos)}

## 影片列表

"""
    for i, video in enumerate(videos, 1):
        summary += f"{i}. [{video['title']}](./{i:03d}_{video['title']}.md) - {video['uploader']}\n"
    
    summary_path = f"{CONFIG['output_dir']}/summary.md"
    print(f"索引檔案: {summary_path}")
    print(summary)
    
    print("\n" + "=" * 60)
    print("✅ 所有影片處理完成！")
    print(f"輸出目錄: {CONFIG['output_dir']}")
    print("=" * 60)
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
