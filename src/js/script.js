// レトロテトリス - メインゲームロジック
class RetroTetris {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        // ゲーム設定
        this.BOARD_WIDTH = 10;
        this.BOARD_HEIGHT = 20;
        this.BLOCK_SIZE = 30;
        
        // ゲーム状態
        this.board = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameRunning = false;
        this.gamePaused = false;
        this.lastTime = 0;
        this.dropTimer = 0;
        this.dropInterval = 1000; // 1秒
        
        // サウンド
        this.audioContext = null;
        this.bgmEnabled = true;
        this.bgmPlaying = false;
        
        // テトロミノの定義
        this.tetrominoes = {
            I: {
                shape: [
                    [0,0,0,0],
                    [1,1,1,1],
                    [0,0,0,0],
                    [0,0,0,0]
                ],
                color: '#00ffff'
            },
            O: {
                shape: [
                    [1,1],
                    [1,1]
                ],
                color: '#ffff00'
            },
            T: {
                shape: [
                    [0,1,0],
                    [1,1,1],
                    [0,0,0]
                ],
                color: '#ff00ff'
            },
            S: {
                shape: [
                    [0,1,1],
                    [1,1,0],
                    [0,0,0]
                ],
                color: '#00ff00'
            },
            Z: {
                shape: [
                    [1,1,0],
                    [0,1,1],
                    [0,0,0]
                ],
                color: '#ff0000'
            },
            J: {
                shape: [
                    [1,0,0],
                    [1,1,1],
                    [0,0,0]
                ],
                color: '#0080ff'
            },
            L: {
                shape: [
                    [0,0,1],
                    [1,1,1],
                    [0,0,0]
                ],
                color: '#ff8000'
            }
        };
        
        this.pieceTypes = Object.keys(this.tetrominoes);
        
        this.init();
    }
    
    init() {
        this.initBoard();
        this.setupEventListeners();
        this.setupAudio();
        this.showStartScreen();
    }
    
    initBoard() {
        this.board = [];
        for (let y = 0; y < this.BOARD_HEIGHT; y++) {
            this.board[y] = [];
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                this.board[y][x] = { filled: false, color: '#000000' };
            }
        }
    }
    
    setupEventListeners() {
        // スタートボタン
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        // リスタートボタン
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartGame();
        });
        
        // サウンドトグル
        document.getElementById('soundToggle').addEventListener('click', () => {
            this.toggleSound();
        });
        
        // キーボード操作
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning || this.gamePaused) return;
            
            switch(e.code) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.movePiece(0, 1);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.rotatePiece();
                    break;
                case 'Space':
                    e.preventDefault();
                    this.hardDrop();
                    break;
                case 'KeyP':
                    e.preventDefault();
                    this.togglePause();
                    break;
            }
        });
    }
    
    setupAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }
    
    // コロベイニキのメロディー（簡略版）
    playKorobeiniki() {
        if (!this.audioContext || !this.bgmEnabled) return;
        
        // コロベイニキの主要なメロディー
        const melody = [
            // E5, B4, C5, D5, C5, B4, A4, A4, C5, E5, D5, C5, B4, B4, C5, D5, E5, C5, A4, A4
            659.25, 493.88, 523.25, 587.33, 523.25, 493.88, 440.00, 440.00, 523.25, 659.25, 587.33, 523.25, 493.88, 493.88, 523.25, 587.33, 659.25, 523.25, 440.00, 440.00,
            // 続き
            587.33, 698.46, 880.00, 783.99, 698.46, 659.25, 523.25, 659.25, 587.33, 523.25, 493.88, 493.88, 523.25, 587.33, 659.25, 523.25, 440.00, 440.00
        ];
        
        const rhythms = [
            0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.5, 0.5, 0.5, 0.5,
            0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.5, 0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.5, 0.5, 0.5
        ];
        
        let time = this.audioContext.currentTime;
        const baseNote = 0.4; // 基本音符の長さ
        
        for (let i = 0; i < melody.length; i++) {
            this.playNote(melody[i], time, rhythms[i] * baseNote);
            time += rhythms[i] * baseNote;
        }
        
        // ループのためのタイマー設定
        if (this.bgmPlaying) {
            setTimeout(() => {
                if (this.bgmPlaying && this.gameRunning) {
                    this.playKorobeiniki();
                }
            }, time * 1000 - this.audioContext.currentTime * 1000 + 1000);
        }
    }
    
    playNote(frequency, startTime, duration) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, startTime);
        oscillator.type = 'square'; // 8ビット風のサウンド
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    }
    
    toggleSound() {
        this.bgmEnabled = !this.bgmEnabled;
        const button = document.getElementById('soundToggle');
        
        if (this.bgmEnabled) {
            button.textContent = 'BGM ON';
            button.className = 'bg-neon-green text-black px-4 py-2 font-bold hover:bg-neon-yellow transition-colors';
            if (this.gameRunning) {
                this.startBGM();
            }
        } else {
            button.textContent = 'BGM OFF';
            button.className = 'bg-gray-500 text-white px-4 py-2 font-bold hover:bg-gray-400 transition-colors';
            this.stopBGM();
        }
    }
    
    startBGM() {
        if (this.bgmEnabled && !this.bgmPlaying && this.audioContext) {
            this.bgmPlaying = true;
            this.playKorobeiniki();
        }
    }
    
    stopBGM() {
        this.bgmPlaying = false;
    }
    
    showStartScreen() {
        document.getElementById('startScreen').style.display = 'flex';
        document.getElementById('gameOverScreen').classList.add('hidden');
    }
    
    hideStartScreen() {
        document.getElementById('startScreen').style.display = 'none';
    }
    
    startGame() {
        this.hideStartScreen();
        this.initBoard();
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameRunning = true;
        this.gamePaused = false;
        this.updateDisplay();
        
        this.currentPiece = this.createPiece();
        this.nextPiece = this.createPiece();
        
        this.startBGM();
        this.gameLoop();
    }
    
    restartGame() {
        document.getElementById('gameOverScreen').classList.add('hidden');
        this.startGame();
    }
    
    createPiece() {
        const type = this.pieceTypes[Math.floor(Math.random() * this.pieceTypes.length)];
        const tetromino = this.tetrominoes[type];
        
        return {
            type: type,
            shape: JSON.parse(JSON.stringify(tetromino.shape)), // ディープコピー
            color: tetromino.color,
            x: Math.floor(this.BOARD_WIDTH / 2) - Math.floor(tetromino.shape[0].length / 2),
            y: 0
        };
    }
    
    movePiece(dx, dy) {
        if (!this.currentPiece) return false;
        
        const newX = this.currentPiece.x + dx;
        const newY = this.currentPiece.y + dy;
        
        if (this.isValidPosition(this.currentPiece.shape, newX, newY)) {
            this.currentPiece.x = newX;
            this.currentPiece.y = newY;
            return true;
        }
        return false;
    }
    
    rotatePiece() {
        if (!this.currentPiece) return;
        
        const rotated = this.rotateMatrix(this.currentPiece.shape);
        
        if (this.isValidPosition(rotated, this.currentPiece.x, this.currentPiece.y)) {
            this.currentPiece.shape = rotated;
        } else {
            // ウォールキック試行
            const kicks = [[-1, 0], [1, 0], [0, -1], [-1, -1], [1, -1]];
            for (let kick of kicks) {
                if (this.isValidPosition(rotated, this.currentPiece.x + kick[0], this.currentPiece.y + kick[1])) {
                    this.currentPiece.shape = rotated;
                    this.currentPiece.x += kick[0];
                    this.currentPiece.y += kick[1];
                    break;
                }
            }
        }
    }
    
    rotateMatrix(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = [];
        
        for (let i = 0; i < cols; i++) {
            rotated[i] = [];
            for (let j = 0; j < rows; j++) {
                rotated[i][j] = matrix[rows - 1 - j][i];
            }
        }
        
        return rotated;
    }
    
    hardDrop() {
        if (!this.currentPiece) return;
        
        let dropDistance = 0;
        while (this.movePiece(0, 1)) {
            dropDistance++;
        }
        
        this.score += dropDistance * 2; // ハードドロップボーナス
        this.placePiece();
    }
    
    isValidPosition(shape, x, y) {
        for (let py = 0; py < shape.length; py++) {
            for (let px = 0; px < shape[py].length; px++) {
                if (shape[py][px]) {
                    const boardX = x + px;
                    const boardY = y + py;
                    
                    // 境界チェック
                    if (boardX < 0 || boardX >= this.BOARD_WIDTH || 
                        boardY >= this.BOARD_HEIGHT) {
                        return false;
                    }
                    
                    // 既存のブロックとの衝突チェック
                    if (boardY >= 0 && this.board[boardY][boardX].filled) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    
    placePiece() {
        if (!this.currentPiece) return;
        
        // ピースをボードに配置
        for (let py = 0; py < this.currentPiece.shape.length; py++) {
            for (let px = 0; px < this.currentPiece.shape[py].length; px++) {
                if (this.currentPiece.shape[py][px]) {
                    const boardX = this.currentPiece.x + px;
                    const boardY = this.currentPiece.y + py;
                    
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = {
                            filled: true,
                            color: this.currentPiece.color
                        };
                    }
                }
            }
        }
        
        // ライン消去チェック
        this.clearLines();
        
        // 新しいピース生成
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.createPiece();
        
        // ゲームオーバーチェック
        if (!this.isValidPosition(this.currentPiece.shape, this.currentPiece.x, this.currentPiece.y)) {
            this.gameOver();
        }
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.BOARD_HEIGHT - 1; y >= 0; y--) {
            let lineComplete = true;
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                if (!this.board[y][x].filled) {
                    lineComplete = false;
                    break;
                }
            }
            
            if (lineComplete) {
                // ライン削除
                this.board.splice(y, 1);
                // 新しい空のラインを上に追加
                const newLine = [];
                for (let x = 0; x < this.BOARD_WIDTH; x++) {
                    newLine[x] = { filled: false, color: '#000000' };
                }
                this.board.unshift(newLine);
                
                linesCleared++;
                y++; // 同じ行を再チェック
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            
            // スコア計算（テトリスの標準的なスコアリング）
            const lineScore = [0, 40, 100, 300, 1200];
            this.score += lineScore[linesCleared] * this.level;
            
            // レベルアップ（10ライン毎）
            const newLevel = Math.floor(this.lines / 10) + 1;
            if (newLevel > this.level) {
                this.level = newLevel;
                this.dropInterval = Math.max(50, 1000 - (this.level - 1) * 50);
            }
            
            this.updateDisplay();
        }
    }
    
    gameOver() {
        this.gameRunning = false;
        this.stopBGM();
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }
    
    togglePause() {
        if (!this.gameRunning) return;
        
        this.gamePaused = !this.gamePaused;
        
        if (this.gamePaused) {
            this.stopBGM();
        } else {
            this.startBGM();
        }
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }
    
    draw() {
        // メインキャンバスをクリア
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // ボードを描画
        this.drawBoard();
        
        // 現在のピースを描画
        if (this.currentPiece) {
            this.drawPiece(this.ctx, this.currentPiece, this.currentPiece.x, this.currentPiece.y);
        }
        
        // 次のピースを描画
        this.drawNextPiece();
        
        // ポーズ中の表示
        if (this.gamePaused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#00ffff';
            this.ctx.font = '24px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
        }
    }
    
    drawBoard() {
        for (let y = 0; y < this.BOARD_HEIGHT; y++) {
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                const cell = this.board[y][x];
                if (cell.filled) {
                    this.drawBlock(this.ctx, x * this.BLOCK_SIZE, y * this.BLOCK_SIZE, cell.color);
                }
            }
        }
    }
    
    drawPiece(ctx, piece, offsetX, offsetY) {
        for (let py = 0; py < piece.shape.length; py++) {
            for (let px = 0; px < piece.shape[py].length; px++) {
                if (piece.shape[py][px]) {
                    const x = (offsetX + px) * this.BLOCK_SIZE;
                    const y = (offsetY + py) * this.BLOCK_SIZE;
                    this.drawBlock(ctx, x, y, piece.color);
                }
            }
        }
    }
    
    drawBlock(ctx, x, y, color) {
        // メインブロック
        ctx.fillStyle = color;
        ctx.fillRect(x, y, this.BLOCK_SIZE, this.BLOCK_SIZE);
        
        // ブロックの境界線（3Dエフェクト）
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, this.BLOCK_SIZE - 2, this.BLOCK_SIZE - 2);
        
        // ハイライト
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(x + 2, y + 2, this.BLOCK_SIZE - 4, 4);
        ctx.fillRect(x + 2, y + 2, 4, this.BLOCK_SIZE - 4);
        
        // シャドウ
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(x + this.BLOCK_SIZE - 6, y + 6, 4, this.BLOCK_SIZE - 6);
        ctx.fillRect(x + 6, y + this.BLOCK_SIZE - 6, this.BLOCK_SIZE - 6, 4);
    }
    
    drawNextPiece() {
        // 次のピースキャンバスをクリア
        this.nextCtx.fillStyle = '#000000';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        if (this.nextPiece) {
            const blockSize = 20;
            const offsetX = (this.nextCanvas.width - this.nextPiece.shape[0].length * blockSize) / 2;
            const offsetY = (this.nextCanvas.height - this.nextPiece.shape.length * blockSize) / 2;
            
            for (let py = 0; py < this.nextPiece.shape.length; py++) {
                for (let px = 0; px < this.nextPiece.shape[py].length; px++) {
                    if (this.nextPiece.shape[py][px]) {
                        const x = offsetX + px * blockSize;
                        const y = offsetY + py * blockSize;
                        
                        this.nextCtx.fillStyle = this.nextPiece.color;
                        this.nextCtx.fillRect(x, y, blockSize, blockSize);
                        
                        this.nextCtx.strokeStyle = '#ffffff';
                        this.nextCtx.lineWidth = 1;
                        this.nextCtx.strokeRect(x, y, blockSize, blockSize);
                    }
                }
            }
        }
    }
    
    gameLoop(currentTime = 0) {
        if (!this.gameRunning) return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        if (!this.gamePaused) {
            this.dropTimer += deltaTime;
            
            if (this.dropTimer >= this.dropInterval) {
                if (!this.movePiece(0, 1)) {
                    this.placePiece();
                }
                this.dropTimer = 0;
            }
        }
        
        this.draw();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// ゲーム初期化
document.addEventListener('DOMContentLoaded', () => {
    const game = new RetroTetris();
});