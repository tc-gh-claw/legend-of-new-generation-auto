/**
 * QuizScene - 問答場景
 * 智能出題系統 - 洗牌算法確保不重複
 */

class QuizScene extends Phaser.Scene {
    constructor() {
        super({ key: 'QuizScene' });
    }

    init(data) {
        this.subject = data.subject || 'math';
        this.onComplete = data.onComplete;
        
        // 安全地獲取玩家等級
        let level = 1;
        if (data.playerLevel) {
            level = data.playerLevel;
        } else if (this.game && this.game.globals && this.game.globals.playerLevel) {
            level = this.game.globals.playerLevel;
        }
        this.playerLevel = level;
        
        // 初始化全局題目管理器（如果不存在）
        this.initQuestionManager();
        
        // 獲取下一道題目
        this.currentQuestion = this.getNextQuestion();
    }
    
    /**
     * 初始化全局題目管理器
     * 用於記錄已出過的題目，確保不會重複
     */
    initQuestionManager() {
        if (!this.game.globals.questionManager) {
            this.game.globals.questionManager = {};
        }
        
        const manager = this.game.globals.questionManager;
        
        // 為每個學科初始化
        ['math', 'science', 'english', 'general'].forEach(subject => {
            if (!manager[subject]) {
                // 獲取該學科的所有題目
                const allQuestions = this.getQuestionsBySubject(subject, this.playerLevel);
                // 洗牌並保存索引
                manager[subject] = {
                    indices: this.shuffleArray([...Array(allQuestions.length).keys()]),
                    currentIndex: 0,
                    questions: allQuestions
                };
            }
        });
    }
    
    /**
     * Fisher-Yates 洗牌算法
     */
    shuffleArray(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
    
    /**
     * 獲取下一道題目（不會重複）
     */
    getNextQuestion() {
        const manager = this.game.globals.questionManager[this.subject];
        
        // 如果所有題目都用完了，重新洗牌
        if (manager.currentIndex >= manager.indices.length) {
            manager.indices = this.shuffleArray([...Array(manager.questions.length).keys()]);
            manager.currentIndex = 0;
            console.log(`QuizScene: ${this.subject} 題目已用完，重新洗牌`);
        }
        
        // 獲取下一個索引
        const questionIndex = manager.indices[manager.currentIndex];
        manager.currentIndex++;
        
        return manager.questions[questionIndex];
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // 半透明背景
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
        
        // 題目面板
        this.createQuizPanel();
        
        // 顯示題目
        this.displayQuestion();
    }
    
    createQuizPanel() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // 面板背景
        this.panel = this.add.container(width / 2, height / 2);
        
        const bg = this.add.rectangle(0, 0, 700, 400, 0x2c3e50);
        bg.setStrokeStyle(3, this.getSubjectColor());
        this.panel.add(bg);
        
        // 學科標題
        const subjectNames = {
            'math': '🔢 數學',
            'science': '⚗️ 科學',
            'english': '📖 英文',
            'general': '🌍 常識'
        };
        
        const title = this.add.text(0, -170, subjectNames[this.subject] || '題目', {
            fontSize: '24px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff'
        }).setOrigin(0.5);
        this.panel.add(title);
        
        // 計時器背景
        this.timerBg = this.add.rectangle(0, -130, 600, 10, 0x000000);
        this.panel.add(this.timerBg);
        
        // 計時器條
        this.timerBar = this.add.rectangle(-300, -130, 600, 10, this.getSubjectColor());
        this.timerBar.setOrigin(0, 0.5);
        this.panel.add(this.timerBar);
        
        // 題目文字區域
        this.questionText = this.add.text(0, -60, '', {
            fontSize: '20px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff',
            align: 'center',
            wordWrap: { width: 600 }
        }).setOrigin(0.5);
        this.panel.add(this.questionText);
        
        // 答案按鈕區域
        this.answerButtons = this.add.container(0, 50);
        this.panel.add(this.answerButtons);
        
        // 開始計時
        this.startTimer();
    }
    
    getSubjectColor() {
        const colors = {
            'math': 0x3498db,
            'science': 0x2ecc71,
            'english': 0xf39c12,
            'general': 0x9b59b6
        };
        return colors[this.subject] || 0xffffff;
    }
    
    displayQuestion() {
        // 確保題目存在
        if (!this.currentQuestion) {
            console.warn('QuizScene: currentQuestion 不存在，使用預設題目');
            this.currentQuestion = this.getDefaultQuestion();
        }
        
        // 確保題目有必要嘅屬性
        if (!this.currentQuestion.question) {
            this.currentQuestion.question = '這是一道測試題目';
        }
        if (!this.currentQuestion.options || !Array.isArray(this.currentQuestion.options)) {
            this.currentQuestion.options = ['選項A', '選項B', '選項C', '選項D'];
        }
        if (typeof this.currentQuestion.correct !== 'number') {
            this.currentQuestion.correct = 0;
        }
        
        // 顯示題目
        this.questionText.setText(this.currentQuestion.question);
        
        // 創建答案按鈕
        this.createAnswerButtons(this.currentQuestion.options);
    }
    
    createAnswerButtons(options) {
        this.answerButtons.removeAll(true);
        
        // 檢查 options 係咪有效
        if (!options || !Array.isArray(options) || options.length === 0) {
            console.error('QuizScene: options 無效', options);
            return;
        }
        
        const buttonWidth = 280;
        const buttonHeight = 60;
        const spacing = 20;
        
        options.forEach((option, index) => {
            const col = index % 2;
            const row = Math.floor(index / 2);
            
            const x = (col === 0 ? -1 : 1) * (buttonWidth / 2 + spacing / 2);
            const y = row * (buttonHeight + spacing);
            
            const button = this.createAnswerButton(x, y, buttonWidth, buttonHeight, option, index);
            this.answerButtons.add(button);
        });
    }
    
    createAnswerButton(x, y, width, height, text, index) {
        const container = this.add.container(x, y);
        
        // 選項標籤
        const labels = ['A', 'B', 'C', 'D'];
        
        const bg = this.add.rectangle(0, 0, width, height, 0x34495e);
        bg.setStrokeStyle(2, 0x5d6d7e);
        bg.setInteractive({ useHandCursor: true });
        
        const label = this.add.text(-width / 2 + 20, 0, labels[index] + '.', {
            fontSize: '18px',
            fontFamily: 'Microsoft JhengHei',
            fill: this.getSubjectColor()
        }).setOrigin(0, 0.5);
        
        const optionText = this.add.text(0, 0, text, {
            fontSize: '16px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff',
            align: 'center',
            wordWrap: { width: width - 60 }
        }).setOrigin(0.5);
        
        container.add([bg, label, optionText]);
        
        // 互動效果
        bg.on('pointerover', () => {
            bg.setFillStyle(0x5d6d7e);
            bg.setStrokeStyle(2, this.getSubjectColor());
        });
        
        bg.on('pointerout', () => {
            bg.setFillStyle(0x34495e);
            bg.setStrokeStyle(2, 0x5d6d7e);
        });
        
        bg.on('pointerup', () => {
            this.handleAnswer(index);
        });
        
        // 入場動畫
        container.setAlpha(0);
        container.y += 20;
        
        this.tweens.add({
            targets: container,
            alpha: 1,
            y: y,
            duration: 300,
            delay: index * 100,
            ease: 'Power2'
        });
        
        return container;
    }
    
    startTimer() {
        const timeLimit = 15000; // 15秒
        let remainingTime = timeLimit;
        
        this.timerEvent = this.time.addEvent({
            delay: 100,
            callback: () => {
                remainingTime -= 100;
                
                // 更新計時條
                const percent = remainingTime / timeLimit;
                this.timerBar.setScale(percent, 1);
                
                // 改變顏色
                if (percent < 0.3) {
                    this.timerBar.setFillStyle(0xe74c3c);
                } else if (percent < 0.6) {
                    this.timerBar.setFillStyle(0xf39c12);
                }
                
                // 時間到
                if (remainingTime <= 0) {
                    this.handleTimeUp();
                }
            },
            callbackScope: this,
            loop: true
        });
    }
    
    handleAnswer(selectedIndex) {
        // 停止計時
        if (this.timerEvent) {
            this.timerEvent.remove();
        }
        
        const isCorrect = selectedIndex === this.currentQuestion.correct;
        
        // 顯示結果
        this.showResult(isCorrect);
        
        // 計算傷害
        const damage = isCorrect ? this.calculateDamage() : 0;
        
        // 延遲後返回結果
        this.time.delayedCall(1500, () => {
            if (typeof this.onComplete === 'function') {
                this.onComplete({
                    correct: isCorrect,
                    damage: damage,
                    subject: this.subject
                });
            }
        });
    }
    
    handleTimeUp() {
        if (this.timerEvent) {
            this.timerEvent.remove();
        }
        
        this.showResult(false, '⏰ 時間到！');
        
        this.time.delayedCall(1500, () => {
            if (typeof this.onComplete === 'function') {
                this.onComplete({
                    correct: false,
                    damage: 0,
                    subject: this.subject
                });
            }
        });
    }
    
    showResult(isCorrect, customMessage) {
        // 清除答案按鈕
        this.answerButtons.removeAll(true);
        
        const message = customMessage || (isCorrect ? '✅ 答對了！' : '❌ 答錯了！');
        const color = isCorrect ? 0x2ecc71 : 0xe74c3c;
        
        // 結果文字
        const resultText = this.add.text(0, 0, message, {
            fontSize: '48px',
            fontFamily: 'Microsoft JhengHei',
            fill: isCorrect ? '#2ecc71' : '#e74c3c'
        }).setOrigin(0.5);
        
        this.answerButtons.add(resultText);
        
        // 顯示正確答案
        if (!isCorrect) {
            const correctAnswer = this.currentQuestion.options[this.currentQuestion.correct];
            const correctText = this.add.text(0, 60, `正確答案: ${correctAnswer}`, {
                fontSize: '18px',
                fontFamily: 'Microsoft JhengHei',
                fill: '#ffffff'
            }).setOrigin(0.5);
            this.answerButtons.add(correctText);
        }
        
        // 結果動畫
        this.tweens.add({
            targets: resultText,
            scale: { from: 0.5, to: 1.2 },
            duration: 300,
            ease: 'Back.out',
            yoyo: true
        });
        
        // 面板顏色變化
        this.panel.list[0].setStrokeStyle(5, color);
    }
    
    calculateDamage() {
        // 基礎傷害 + 隨機波動
        const baseDamage = 15;
        const variance = Phaser.Math.Between(-3, 5);
        return Math.max(5, baseDamage + variance);
    }
    
    getQuestionsBySubject(subject, playerLevel = 1) {
        // 從 game.globals.questions 加載完整 200 題題庫
        const allQuestions = this.game.globals.questions || {};
        const subjectData = allQuestions.subjects?.[subject];
        
        if (!subjectData || !subjectData.questions) {
            console.warn(`QuizScene: 找不到 ${subject} 題目，使用預設題目`);
            return [this.getDefaultQuestion()];
        }
        
        // 根據玩家等級確定難度
        let difficulty = 1;
        if (playerLevel >= 8) {
            difficulty = 3;
        } else if (playerLevel >= 4) {
            difficulty = 2;
        }
        
        // 獲取該難度的題目
        let availableQuestions = subjectData.questions.filter(q => q.difficulty === difficulty);
        
        // 如果該難度題目不足，混合較低難度
        if (availableQuestions.length < 10) {
            const lowerDifficulty = subjectData.questions.filter(q => q.difficulty < difficulty);
            availableQuestions = [...availableQuestions, ...lowerDifficulty];
        }
        
        // 轉換格式以兼容現有代碼
        return availableQuestions.map(q => ({
            question: q.question,
            options: q.options,
            correct: q.correct,
            difficulty: q.difficulty,
            topic: q.topic,
            id: q.id
        }));
    }
    
    getDefaultQuestion() {
        return {
            question: '這是一道測試題目',
            options: ['選項A', '選項B', '選項C', '選項D'],
            correct: 0
        };
    }
}
