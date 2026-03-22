# 🔧 音效生成工具指南

由於遊戲音效檔案較大，本項目使用佔位符方式載入音效。開發者可以使用以下工具生成或下載免費音效。

## 🎯 快速生成音效

### 方法1：使用 Chiptone (推薦)

**網址**: https://sfbgames.itch.io/chiptone

步驟：
1. 訪問 Chiptone 網站
2. 點擊以下預設按鈕生成音效：
   - `Pickup/Coin` → 用於 item.wav, save.wav
   - `Laser/Shoot` → 用於 attack.wav, magic-*.wav
   - `Explosion` → 用於 hit.wav, defeat.wav
   - `Powerup` → 用於 levelup.wav, victory.wav
   - `Hit/Hurt` → 用於 hit.wav, miss.wav
   - `Jump` → 用於 footstep.wav
3. 調整參數（音調、持續時間等）
4. 點擊 Export 導出 WAV 文件
5. 將文件複製到對應的 assets/audio/ 目錄

### 方法2：使用 sfxr.me

**網址**: https://sfxr.me/

步驟：
1. 選擇音效類型（Pickup, Laser, Explosion, Powerup, Hit, Jump）
2. 使用 Randomize 按鈕生成隨機變化
3. 使用 Mutate 微調音效
4. 點擊 Export WAV 導出

## 📁 所需音效清單

### UI 音效 (assets/audio/sfx/ui/)
| 文件名 | 建議生成類型 | 用途 |
|--------|-------------|------|
| click.wav | Pickup/Coin | 按鈕點擊 |
| hover.wav | 短促的 blip | 滑鼠懸停 |
| open.wav | Powerup | 選單開啟 |
| close.wav | 反轉的 Powerup | 選單關閉 |
| confirm.wav | 高頻 Pickup | 確認操作 |
| cancel.wav | 低頻 Hit | 取消操作 |

### 戰鬥音效 (assets/audio/sfx/combat/)
| 文件名 | 建議生成類型 | 用途 |
|--------|-------------|------|
| attack.wav | Laser/Shoot | 攻擊音效 |
| hit.wav | Hit/Hurt | 受擊音效 |
| miss.wav | 短促的空氣聲 | 攻擊落空 |
| victory.wav | Powerup (長) | 勝利音效 |
| defeat.wav | Explosion | 失敗音效 |
| levelup.wav | 多層 Powerup | 升級音效 |

### 魔法音效 (assets/audio/sfx/magic/)
| 文件名 | 建議生成類型 | 用途 |
|--------|-------------|------|
| math.wav | 數學感電子音 | 數學技能 |
| science.wav | 科幻感音 | 科學技能 |
| english.wav | 柔和音 | 英文技能 |
| general.wav | 通用魔法音 | 常識技能 |
| heal.wav | 高頻治愈音 | 治療技能 |
| shield.wav | 厚重防禦音 | 防禦技能 |

### 環境音效 (assets/audio/sfx/environment/)
| 文件名 | 建議生成類型 | 用途 |
|--------|-------------|------|
| footstep.wav | Jump (極短) | 腳步聲 |
| encounter.wav | 警告音 | 遭遇敵人 |
| save.wav | Pickup | 存檔音效 |
| item.wav | Coin | 獲得道具 |

## 🎵 背景音樂資源

### 推薦免費8-bit音樂包

1. **OpenGameArt - 8-Bit JRPG Soundtrack**
   - 網址: https://opengameart.org/content/full-8-bit-jrpg-soundtrack-downloadable-and-editable-music-pack
   - 70+首8-bit音樂
   - CC0 授權（可商用）

2. **Kenney - Music Assets**
   - 網址: https://kenney.nl/assets
   - 免費遊戲音樂包
   - CC0 授權

3. **itch.io 音樂包**
   - 網址: https://itch.io/game-assets/free/music
   - 搜索關鍵詞: `chiptune`, `8-bit`, `RPG`

### 所需音樂清單

| 文件名 | 建議風格 | 用途 |
|--------|---------|------|
| menu.ogg | 輕鬆愉快 | 主選單音樂 |
| world.ogg | 冒險感 | 世界地圖音樂 |
| town.ogg | 溫馨寧靜 | 城鎮音樂 |
| normal.ogg | 節奏感 | 普通戰鬥音樂 |
| boss.ogg | 緊張激烈 | Boss戰音樂 |
| final.ogg | 史詩感 | 最終Boss音樂 |
| victory.ogg | 歡快 | 勝利音樂 |
| gameover.ogg | 悲壯 | 遊戲結束音樂 |
| levelup.ogg | 歡慶 | 升級音樂 |

## 🔄 格式轉換

### 使用 Audacity 轉換格式

**網址**: https://www.audacityteam.org/

步驟：
1. 打開 Audacity
2. 文件 → 打開 → 選擇音效文件
3. 文件 → 導出 → 導出為 OGG/MP3/WAV
4. 設置文件名和位置
5. 確認導出設置

### 命令行轉換（使用 ffmpeg）

```bash
# 安裝 ffmpeg
# Ubuntu/Debian: sudo apt-get install ffmpeg
# macOS: brew install ffmpeg

# WAV 轉 OGG
ffmpeg -i input.wav -c:a libvorbis -q:a 4 output.ogg

# WAV 轉 MP3
ffmpeg -i input.wav -codec:a libmp3lame -qscale:a 2 output.mp3
```

## 🎨 音效設計建議

### 8-bit 風格特點
- 簡單波形：方波、三角波、鋸齒波、噪波
- 短促有力：避免過長的尾音
- 清晰可辨：每個音效都要有明確的功能

### 音量平衡
- 背景音樂應該在 -20dB 到 -12dB
- 音效應該在 -10dB 到 -6dB
- 避免峰值超過 -3dB（防止爆音）

### 循環音樂製作
- 確保開頭和結尾可以無縫連接
- 使用 Audacity 的 Crossfade 功能
- 測試循環點是否流暢

## 📦 推薦音效包下載

### 懶人包方案

如果不想自己生成，可以直接下載這些現成的音效包：

1. **512 Sound Effects (8-bit)**
   - 網址: https://opengameart.org/content/512-sound-effects-8-bit-style
   - 包含幾乎所有需要的音效
   - 下載後選擇適合的文件重命名即可

2. **Kenney Audio Packs**
   - 網址: https://kenney.nl/assets
   - 多個分類清晰的音效包
   - UI 音效特別推薦

3. **RPG Sound Effects**
   - 網址: https://opengameart.org/content/rpg-sound-pack
   - 專為 RPG 設計的音效

## ✅ 測試音效

添加音效後，可以在瀏覽器控制台測試：

```javascript
// 獲取音效管理器
const audio = game.audioManager;

// 測試音效
audio.playClick();
audio.playAttack();
audio.playVictory();

// 測試音樂
audio.playMenuBgm();
audio.playBattleBgm();

// 測試音量
audio.setMasterVolume(0.5);
audio.setBgmVolume(0.7);
audio.setSfxVolume(0.8);

// 測試靜音
audio.toggleMute();
```

---

*建議優先從 OpenGameArt 或 Kenney 下載現成音效，如無合適再使用生成工具。*
