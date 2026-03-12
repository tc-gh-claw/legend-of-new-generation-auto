#!/usr/bin/env python3
"""
Bilibili 影片下載 + Markdown 轉換器
完整實現版本 v1.0

功能：
1. 下載 Bilibili 播放清單全部影片
2. 提取音訊並使用 Whisper 轉錄
3. 生成帶時間戳嘅 Markdown 檔案

作者：蝦仔
日期：2025-03-05
"""

import os
import sys
import json
import re
import subprocess
import argparse
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional
import logging

# 設定日誌
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('bilibili_to_md.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class BilibiliDownloader:
    """Bilibili 影片下載器"""
    
    def __init__(self, output_dir: str = "./downloads", cookie_file: Optional[str] = None):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.cookie_file = cookie_file
        
    def check_yt_dlp(self) -> bool:
        """檢查 yt-dlp 是否安裝"""
        try:
            result = subprocess.run(
                ["yt-dlp", "--version"],
                capture_output=True,
                text=True,
                check=True
            )
            logger.info(f"yt-dlp 版本: {result.stdout.strip()}")
            return True
        except FileNotFoundError:
            logger.error("yt-dlp 未安裝！請運行: pip install yt-dlp")
            return False
        except Exception as e:
            logger.error(f"檢查 yt-dlp 失敗: {e}")
            return False
    
    def get_playlist_info(self, playlist_url: str) -> List[Dict]:
        """
        獲取播放清單資訊
        
        Args:
            playlist_url: Bilibili 播放清單 URL
            
        Returns:
            影片資訊列表
        """
        logger.info(f"正在解析播放清單: {playlist_url}")
        
        cmd = [
            "yt-dlp",
            "--flat-playlist",
            "--dump-json",
            "--no-warnings"
        ]
        
        if self.cookie_file and Path(self.cookie_file).exists():
            cmd.extend(["--cookies", self.cookie_file])
        
        cmd.append(playlist_url)
        
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                encoding='utf-8',
                check=True
            )
            
            videos = []
            for line in result.stdout.strip().split('\n'):
                if line:
                    try:
                        data = json.loads(line)
                        videos.append({
                            'id': data.get('id', ''),
                            'title': data.get('title', '未知標題'),
                            'uploader': data.get('uploader', '未知UP主'),
                            'duration': data.get('duration', 0),
                            'url': data.get('url', ''),
                            'webpage_url': data.get('webpage_url', ''),
                            'thumbnail': data.get('thumbnail', '')
                        })
                    except json.JSONDecodeError:
                        continue
            
            logger.info(f"成功解析 {len(videos)} 條影片")
            return videos
            
        except subprocess.CalledProcessError as e:
            logger.error(f"解析播放清單失敗: {e}")
            logger.error(f"錯誤輸出: {e.stderr}")
            return []
    
    def download_video(self, video_url: str, filename: str) -> Optional[Path]:
        """
        下載單個影片
        
        Args:
            video_url: 影片 URL
            filename: 檔案名稱（不含副檔名）
            
        Returns:
            下載檔案路徑，失敗則返回 None
        """
        output_path = self.output_dir / f"{filename}.%(ext)s"
        
        cmd = [
            "yt-dlp",
            "--format", "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
            "--merge-output-format", "mp4",
            "--output", str(output_path),
            "--no-warnings",
            "--progress"
        ]
        
        if self.cookie_file and Path(self.cookie_file).exists():
            cmd.extend(["--cookies", self.cookie_file])
        
        cmd.append(video_url)
        
        try:
            logger.info(f"開始下載: {filename}")
            subprocess.run(cmd, check=True)
            
            # 找到下載嘅檔案
            downloaded_files = list(self.output_dir.glob(f"{filename}.*"))
            for f in downloaded_files:
                if f.suffix in ['.mp4', '.webm', '.mkv']:
                    logger.info(f"下載完成: {f}")
                    return f
                    
            return None
            
        except subprocess.CalledProcessError as e:
            logger.error(f"下載失敗: {e}")
            return None


class AudioExtractor:
    """音訊提取器"""
    
    def __init__(self, output_dir: str = "./audio"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def check_ffmpeg(self) -> bool:
        """檢查 FFmpeg 是否安裝"""
        try:
            result = subprocess.run(
                ["ffmpeg", "-version"],
                capture_output=True,
                text=True,
                check=True
            )
            version = result.stdout.split('\n')[0]
            logger.info(f"FFmpeg: {version}")
            return True
        except FileNotFoundError:
            logger.error("FFmpeg 未安裝！")
            logger.error("安裝指令:")
            logger.error("  Ubuntu/Debian: sudo apt install ffmpeg")
            logger.error("  macOS: brew install ffmpeg")
            logger.error("  Windows: choco install ffmpeg")
            return False
    
    def extract(self, video_path: Path, audio_filename: str) -> Optional[Path]:
        """
        從影片提取音軌
        
        Args:
            video_path: 影片檔案路徑
            audio_filename: 音訊檔案名稱（不含副檔名）
            
        Returns:
            音訊檔案路徑
        """
        output_path = self.output_dir / f"{audio_filename}.wav"
        
        cmd = [
            "ffmpeg",
            "-i", str(video_path),
            "-vn",  # 無視頻
            "-acodec", "pcm_s16le",  # PCM 16-bit
            "-ar", "16000",  # 16kHz (Whisper 推薦)
            "-ac", "1",  # 單聲道
            "-y",  # 覆蓋已存在檔案
            str(output_path)
        ]
        
        try:
            logger.info(f"提取音軌: {video_path.name}")
            subprocess.run(
                cmd,
                capture_output=True,
                check=True
            )
            logger.info(f"音軌提取完成: {output_path}")
            return output_path
        except subprocess.CalledProcessError as e:
            logger.error(f"提取音軌失敗: {e}")
            return None


class WhisperTranscriber:
    """Whisper 語音轉文字器"""
    
    MODELS = {
        'tiny': {'size': '39 MB', 'speed': '最快', 'accuracy': '一般'},
        'base': {'size': '74 MB', 'speed': '快', 'accuracy': '良好'},
        'small': {'size': '244 MB', 'speed': '中等', 'accuracy': '好'},
        'medium': {'size': '769 MB', 'speed': '慢', 'accuracy': '很好'},
        'large': {'size': '1550 MB', 'speed': '最慢', 'accuracy': '最好'},
    }
    
    def __init__(self, model: str = "small", language: str = "zh"):
        self.model_name = model
        self.language = language
        self.model = None
        
    def load_model(self):
        """載入 Whisper 模型"""
        try:
            import whisper
            logger.info(f"載入 Whisper 模型: {self.model_name}")
            self.model = whisper.load_model(self.model_name)
            logger.info("模型載入完成")
            return True
        except ImportError:
            logger.error("未安裝 Whisper！請運行: pip install openai-whisper")
            return False
        except Exception as e:
            logger.error(f"載入模型失敗: {e}")
            return False
    
    def transcribe(self, audio_path: Path) -> Optional[Dict]:
        """
        轉錄音訊
        
        Args:
            audio_path: 音訊檔案路徑
            
        Returns:
            轉錄結果字典
        """
        if self.model is None:
            if not self.load_model():
                return None
        
        try:
            logger.info(f"開始轉錄: {audio_path.name}")
            logger.info(f"使用模型: {self.model_name}, 語言: {self.language}")
            
            result = self.model.transcribe(
                str(audio_path),
                language=self.language,
                verbose=False
            )
            
            logger.info(f"轉錄完成！共 {len(result['segments'])} 段落")
            return result
            
        except Exception as e:
            logger.error(f"轉錄失敗: {e}")
            return None


class MarkdownGenerator:
    """Markdown 檔案生成器"""
    
    def __init__(self, output_dir: str = "./output"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def sanitize_filename(self, filename: str) -> str:
        """清理檔案名稱"""
        # 移除非法字符
        filename = re.sub(r'[\\/*?:"<>|]', '', filename)
        # 限制長度
        filename = filename[:100]
        return filename.strip()
    
    def format_timestamp(self, seconds: float) -> str:
        """格式化時間戳"""
        mins = int(seconds // 60)
        secs = int(seconds % 60)
        return f"{mins:02d}:{secs:02d}"
    
    def generate(self, video_info: Dict, transcript: Dict, index: int) -> Path:
        """
        生成 Markdown 檔案
        
        Args:
            video_info: 影片元數據
            transcript: Whisper 轉錄結果
            index: 影片序號
            
        Returns:
            生成嘅檔案路徑
        """
        # 清理標題作為檔案名稱
        safe_title = self.sanitize_filename(video_info['title'])
        filename = f"{index:03d}_{safe_title}.md"
        filepath = self.output_dir / filename
        
        # 計算總時長
        total_duration = video_info.get('duration', 0)
        duration_str = f"{int(total_duration // 60)}:{int(total_duration % 60):02d}"
        
        # 生成 Markdown 內容
        content = f"""# {video_info['title']}

## 元數據

| 項目 | 內容 |
|------|------|
| **來源** | Bilibili |
| **標題** | {video_info['title']} |
| **UP主** | {video_info['uploader']} |
| **時長** | {duration_str} |
| **連結** | {video_info.get('webpage_url', '')} |
| **生成日期** | {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} |

---

## 內容轉錄

"""
        
        # 添加每個段落
        for segment in transcript.get('segments', []):
            start_time = self.format_timestamp(segment['start'])
            end_time = self.format_timestamp(segment['end'])
            text = segment['text'].strip()
            
            if text:  # 只添加非空內容
                content += f"### {start_time} - {end_time}\n\n{text}\n\n"
        
        # 添加頁腳
        content += """---

*由 [bilibili-to-markdown](https://github.com/your-repo) 自動生成*
"""
        
        # 寫入檔案
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        logger.info(f"Markdown 生成完成: {filepath}")
        return filepath
    
    def generate_summary(self, videos: List[Dict], output_name: str = "summary") -> Path:
        """
        生成索引檔案
        
        Args:
            videos: 影片資訊列表
            output_name: 輸出檔案名稱
            
        Returns:
            索引檔案路徑
        """
        filepath = self.output_dir / f"{output_name}.md"
        
        content = f"""# Bilibili 播放清單轉錄索引

**生成時間**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  
**總影片數**: {len(videos)}

---

## 影片列表

| 序號 | 標題 | UP主 | 時長 | 連結 |
|------|------|------|------|------|
"""
        
        for i, video in enumerate(videos, 1):
            safe_title = self.sanitize_filename(video['title'])
            duration = video.get('duration', 0)
            duration_str = f"{int(duration // 60)}:{int(duration % 60):02d}"
            md_filename = f"{i:03d}_{safe_title}.md"
            
            content += f"| {i} | [{video['title']}](./{md_filename}) | {video['uploader']} | {duration_str} | [連結]({video.get('webpage_url', '')}) |\n"
        
        content += """
---

## 使用說明

1. 點擊標題查看詳細轉錄內容
2. 每個 Markdown 檔案包含時間戳分段
3. 原始影片連結可點擊跳轉

---

*由 [bilibili-to-markdown](https://github.com/your-repo) 自動生成*
"""
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        logger.info(f"索引檔案生成完成: {filepath}")
        return filepath


def main():
    """主程序"""
    parser = argparse.ArgumentParser(
        description='Bilibili 影片下載 + Markdown 轉換器',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:
  # 基本用法
  python bilibili_to_md.py "https://space.bilibili.com/xxx/lists/xxx"
  
  # 指定模型（更快但準確度較低）
  python bilibili_to_md.py "URL" --model tiny
  
  # 使用 Cookie 登入
  python bilibili_to_md.py "URL" --cookies cookies.txt
  
  # 只下載，唔轉錄
  python bilibili_to_md.py "URL" --download-only
        """
    )
    
    parser.add_argument('url', help='Bilibili 播放清單 URL')
    parser.add_argument('--model', default='small', 
                       choices=['tiny', 'base', 'small', 'medium', 'large'],
                       help='Whisper 模型大小 (默認: small)')
    parser.add_argument('--language', default='zh',
                       help='語言代碼 (默認: zh 中文)')
    parser.add_argument('--cookies', help='Cookie 檔案路徑')
    parser.add_argument('--output', default='./output',
                       help='輸出目錄 (默認: ./output)')
    parser.add_argument('--download-only', action='store_true',
                       help='只下載，唔進行轉錄')
    parser.add_argument('--limit', type=int,
                       help='只處理前 N 條影片（測試用）')
    
    args = parser.parse_args()
    
    # 顯示配置
    print("=" * 60)
    print("🎬 Bilibili 影片下載 + Markdown 轉換器")
    print("=" * 60)
    print(f"播放清單: {args.url}")
    print(f"Whisper 模型: {args.model}")
    print(f"語言: {args.language}")
    print(f"輸出目錄: {args.output}")
    print("=" * 60)
    
    # 初始化組件
    downloader = BilibiliDownloader(
        output_dir="./downloads",
        cookie_file=args.cookies
    )
    extractor = AudioExtractor(output_dir="./audio")
    transcriber = WhisperTranscriber(model=args.model, language=args.language)
    generator = MarkdownGenerator(output_dir=args.output)
    
    # 檢查依賴
    if not downloader.check_yt_dlp():
        return 1
    if not extractor.check_ffmpeg():
        return 1
    
    # 獲取播放清單
    videos = downloader.get_playlist_info(args.url)
    if not videos:
        logger.error("無法獲取播放清單，請檢查 URL 或網絡連接")
        return 1
    
    # 限制數量（如果指定）
    if args.limit:
        videos = videos[:args.limit]
        logger.info(f"只處理前 {args.limit} 條影片")
    
    print(f"\n📝 共找到 {len(videos)} 條影片\n")
    
    # 處理每條影片
    processed_videos = []
    for i, video in enumerate(videos, 1):
        print(f"\n{'='*60}")
        print(f"🎥 [{i}/{len(videos)}] {video['title']}")
        print(f"{'='*60}")
        
        safe_title = generator.sanitize_filename(video['title'])
        
        # Step 1: 下載影片
        video_path = downloader.download_video(
            video['webpage_url'] or video['url'],
            f"{i:03d}_{safe_title}"
        )
        
        if not video_path:
            logger.error(f"跳過影片 {i}: 下載失敗")
            continue
        
        if args.download_only:
            logger.info("下載模式，跳過轉錄")
            processed_videos.append(video)
            continue
        
        # Step 2: 提取音軌
        audio_path = extractor.extract(video_path, f"{i:03d}_{safe_title}")
        if not audio_path:
            logger.error(f"跳過影片 {i}: 音軌提取失敗")
            continue
        
        # Step 3: 語音轉文字
        transcript = transcriber.transcribe(audio_path)
        if not transcript:
            logger.error(f"跳過影片 {i}: 轉錄失敗")
            continue
        
        # Step 4: 生成 Markdown
        md_path = generator.generate(video, transcript, i)
        processed_videos.append(video)
        
        # 清理臨時檔案（可選）
        # audio_path.unlink()  # 刪除音訊檔案節省空間
        
        print(f"✅ 完成: {md_path.name}")
    
    # 生成索引
    if processed_videos and not args.download_only:
        generator.generate_summary(processed_videos)
    
    print("\n" + "=" * 60)
    print("✅ 全部處理完成！")
    print(f"📁 輸出目錄: {Path(args.output).absolute()}")
    print(f"📊 成功處理: {len(processed_videos)}/{len(videos)} 條影片")
    print("=" * 60)
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
