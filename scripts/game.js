// game.js - 카드 게임의 핵심 로직

class CardGame {
    constructor() {
        this.gameState = {
            isPlaying: false,
            isPaused: false,
            isGameOver: false,
            level: 1,
            playerName: '',
            cards: [],
            flippedCards: [],
            matchedCards: [],
            moves: 0,
            score: 0,
            timeSpent: 0,
            startTime: null,
            gameTimer: null,
            canFlip: true,
            hintCount: 3
        };
        
        this.gameBoard = document.getElementById('gameBoard');
        this.initializeElements();
    }

    // DOM 요소들 초기화
    initializeElements() {
        this.elements = {
            timer: document.getElementById('timer'),
            moves: document.getElementById('moves'),
            score: document.getElementById('score'),
            pauseBtn: document.getElementById('pauseBtn'),
            resetBtn: document.getElementById('resetBtn'),
            hintBtn: document.getElementById('hintBtn')
        };
    }

    // 새 게임 시작
    startNewGame(level, playerName) {
        this.resetGameState();
        this.gameState.level = level;
        this.gameState.playerName = playerName || '익명';
        
        // 게임 보드 설정
        this.setupGameBoard();
        
        // 카드 생성 및 배치
        this.generateCards();
        this.renderCards();
        
        // 게임 시작
        this.gameState.isPlaying = true;
        this.gameState.startTime = Date.now();
        this.startGameTimer();
        
        // UI 업데이트
        this.updateUI();
        
        console.log(`🎮 새 게임 시작 - 레벨: ${level}, 플레이어: ${this.gameState.playerName}`);
    }

    // 게임 상태 초기화
    resetGameState() {
        this.gameState = {
            isPlaying: false,
            isPaused: false,
            isGameOver: false,
            level: 1,
            playerName: '',
            cards: [],
            flippedCards: [],
            matchedCards: [],
            moves: 0,
            score: 0,
            timeSpent: 0,
            startTime: null,
            gameTimer: null,
            canFlip: true,
            hintCount: 3
        };
        
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
        }
    }

    // 게임 보드 설정
    setupGameBoard() {
        const levelConfig = window.GameConfig.GAME_LEVELS[this.gameState.level];
        this.gameBoard.className = `game-board level-${this.gameState.level} starting`;
        
        // 그리드 스타일 동적 설정
        this.gameBoard.style.gridTemplateColumns = `repeat(${levelConfig.grid.cols}, 1fr)`;
        this.gameBoard.style.gridTemplateRows = `repeat(${levelConfig.grid.rows}, 1fr)`;
        
        // 시작 애니메이션 완료 후 클래스 제거
        setTimeout(() => {
            this.gameBoard.classList.remove('starting');
        }, 1500);
    }

    // 카드 데이터 생성
    generateCards() {
        this.gameState.cards = window.GameConfig.generateRandomCards(
            this.gameState.level,
            'animals' // 기본 테마
        );
        
        // 카드 객체 생성
        this.gameState.cards = this.gameState.cards.map((cardValue, index) => ({
            id: index,
            value: cardValue,
            isFlipped: false,
            isMatched: false,
            element: null
        }));
    }

    // 카드 DOM 렌더링
    renderCards() {
        this.gameBoard.innerHTML = '';
        
        this.gameState.cards.forEach((card, index) => {
            const cardElement = this.createCardElement(card, index);
            this.gameBoard.appendChild(cardElement);
            
            // 등장 애니메이션 (스태거드)
            setTimeout(() => {
                cardElement.classList.add('appearing');
            }, index * 50);
        });
    }

    // 개별 카드 요소 생성
    createCardElement(card, index) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        cardDiv.dataset.cardId = card.id;
        
        cardDiv.innerHTML = `
            <div class="card-inner">
                <div class="card-front">
                    <span>🎴</span>
                </div>
                <div class="card-back">
                    <span>${card.value}</span>
                </div>
            </div>
        `;
        
        // 카드 클릭 이벤트
        cardDiv.addEventListener('click', () => this.handleCardClick(card.id));
        
        // 카드 요소 참조 저장
        card.element = cardDiv;
        
        return cardDiv;
    }

    // 카드 클릭 처리
    handleCardClick(cardId) {
        if (!this.gameState.canFlip || this.gameState.isPaused || this.gameState.isGameOver) {
            return;
        }
        
        const card = this.gameState.cards.find(c => c.id === cardId);
        
        // 이미 뒤집힌 카드나 매칭된 카드는 무시
        if (card.isFlipped || card.isMatched) {
            return;
        }
        
        // 이미 2장이 뒤집혀져 있으면 무시
        if (this.gameState.flippedCards.length >= 2) {
            return;
        }
        
        // 카드 뒤집기
        this.flipCard(card);
        
        // 뒤집힌 카드 목록에 추가
        this.gameState.flippedCards.push(card);
        
        // 2장이 뒤집혔을 때 매칭 체크
        if (this.gameState.flippedCards.length === 2) {
            this.gameState.moves++;
            this.updateUI();
            
            setTimeout(() => {
                this.checkMatch();
            }, 600); // 카드 뒤집기 애니메이션 후 체크
        }
    }

    // 카드 뒤집기 애니메이션
    flipCard(card) {
        card.isFlipped = true;
        card.element.classList.add('flipped');
        
        // 사운드 효과 (선택사항)
        this.playSound('flip');
    }

    // 카드 뒤집기 해제
    unflipCard(card) {
        card.isFlipped = false;
        card.element.classList.remove('flipped');
    }

    // 매칭 체크
    checkMatch() {
        const [card1, card2] = this.gameState.flippedCards;
        
        if (card1.value === card2.value) {
            // 매칭 성공
            this.handleMatch(card1, card2);
        } else {
            // 매칭 실패
            this.handleMismatch(card1, card2);
        }
        
        // 뒤집힌 카드 목록 초기화
        this.gameState.flippedCards = [];
    }

    // 매칭 성공 처리
    handleMatch(card1, card2) {
        // 카드를 매칭 상태로 설정
        card1.isMatched = true;
        card2.isMatched = true;
        
        // 시각적 피드백
        card1.element.classList.add('matched');
        card2.element.classList.add('matched');
        
        // 매칭된 카드 목록에 추가
        this.gameState.matchedCards.push(card1, card2);
        
        // 점수 추가
        this.addScore(100);
        
        // 파티클 효과
        this.createMatchEffect(card1.element);
        this.createMatchEffect(card2.element);
        
        // 사운드 효과
        this.playSound('match');
        
        // 게임 완료 체크
        if (this.gameState.matchedCards.length === this.gameState.cards.length) {
            setTimeout(() => {
                this.handleGameComplete();
            }, 1000);
        }
        
        console.log(`✅ 매칭 성공! (${this.gameState.matchedCards.length}/${this.gameState.cards.length})`);
    }

    // 매칭 실패 처리
    handleMismatch(card1, card2) {
        // 카드 뒤집기 해제 (일시정지 후)
        this.gameState.canFlip = false;
        
        // 흔들기 애니메이션
        card1.element.classList.add('shake');
        card2.element.classList.add('shake');
        
        setTimeout(() => {
            this.unflipCard(card1);
            this.unflipCard(card2);
            
            // 애니메이션 클래스 제거
            card1.element.classList.remove('shake');
            card2.element.classList.remove('shake');
            
            this.gameState.canFlip = true;
        }, 1000);
        
        // 사운드 효과
        this.playSound('mismatch');
    }

    // 점수 추가
    addScore(points) {
        this.gameState.score += points;
        this.elements.score.textContent = this.gameState.score;
        this.elements.score.classList.add('score-increase');
        
        setTimeout(() => {
            this.elements.score.classList.remove('score-increase');
        }, 600);
    }

    // 매칭 효과 파티클 생성
    createMatchEffect(cardElement) {
        const rect = cardElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // 여러 개의 파티클 생성
        for (let i = 0; i < 6; i++) {
            const particle = document.createElement('div');
            particle.className = 'sparkle';
            particle.style.left = centerX + (Math.random() - 0.5) * 40 + 'px';
            particle.style.top = centerY + (Math.random() - 0.5) * 40 + 'px';
            
            document.body.appendChild(particle);
            
            // 파티클 제거
            setTimeout(() => {
                document.body.removeChild(particle);
            }, 1000);
        }
    }

    // 게임 타이머 시작
    startGameTimer() {
        this.gameTimer = setInterval(() => {
            if (!this.gameState.isPaused) {
                this.gameState.timeSpent = Math.floor((Date.now() - this.gameState.startTime) / 1000);
                this.updateTimer();
            }
        }, 1000);
    }

    // 타이머 UI 업데이트
    updateTimer() {
        const formattedTime = window.GameConfig.formatTime(this.gameState.timeSpent);
        this.elements.timer.textContent = formattedTime;
        
        // 시간 제한 경고 (레벨별 제한 시간의 90% 초과시)
        const timeLimit = window.GameConfig.GAME_LEVELS[this.gameState.level].timeLimit;
        if (this.gameState.timeSpent > timeLimit * 0.9) {
            this.elements.timer.classList.add('timer-warning');
        }
    }

    // UI 전체 업데이트
    updateUI() {
        this.elements.moves.textContent = this.gameState.moves;
        this.elements.score.textContent = this.gameState.score;
        
        // 힌트 버튼 상태
        this.elements.hintBtn.disabled = this.gameState.hintCount <= 0;
        this.elements.hintBtn.textContent = `💡 힌트 (${this.gameState.hintCount})`;
    }

    // 게임 완료 처리
    async handleGameComplete() {
        this.gameState.isGameOver = true;
        this.gameState.isPlaying = false;
        
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
        }
        
        // 최종 점수 계산
        const finalScore = window.GameConfig.calculateScore(
            this.gameState.timeSpent,
            this.gameState.moves,
            this.gameState.level
        );
        
        this.gameState.score = finalScore;
        
        // 사운드 효과
        this.playSound('victory');
        
        // 승리 애니메이션
        this.gameBoard.classList.add('victory-animation');
        
        // 점수 저장
        try {
            await window.DatabaseAPI.saveGameScore(
                this.gameState.playerName,
                this.gameState.score,
                this.gameState.level,
                this.gameState.moves,
                this.gameState.timeSpent
            );
        } catch (error) {
            console.error('점수 저장 실패:', error);
        }
        
        // 완료 모달 표시 (1초 후)
        setTimeout(() => {
            this.showGameCompleteModal();
        }, 1000);
        
        console.log(`🎉 게임 완료! 점수: ${this.gameState.score}`);
    }

    // 게임 완료 모달 표시
    showGameCompleteModal() {
        const modal = document.getElementById('gameComplete');
        const finalScore = document.getElementById('finalScore');
        const finalTime = document.getElementById('finalTime');
        const finalMoves = document.getElementById('finalMoves');
        
        finalScore.textContent = this.gameState.score;
        finalTime.textContent = window.GameConfig.formatTime(this.gameState.timeSpent);
        finalMoves.textContent = this.gameState.moves;
        
        modal.classList.add('active');
    }

    // 게임 일시정지/재개
    togglePause() {
        if (!this.gameState.isPlaying || this.gameState.isGameOver) {
            return;
        }
        
        this.gameState.isPaused = !this.gameState.isPaused;
        const pauseOverlay = document.getElementById('pauseOverlay');
        
        if (this.gameState.isPaused) {
            pauseOverlay.classList.remove('hidden');
            this.elements.pauseBtn.textContent = '▶️ 재개';
        } else {
            pauseOverlay.classList.add('hidden');
            this.elements.pauseBtn.textContent = '⏸️ 일시정지';
        }
    }

    // 힌트 기능
    showHint() {
        if (this.gameState.hintCount <= 0 || this.gameState.isPaused || this.gameState.isGameOver) {
            return;
        }
        
        // 매칭되지 않은 카드 중 랜덤하게 2장 찾기
        const unmatchedCards = this.gameState.cards.filter(card => 
            !card.isMatched && !card.isFlipped
        );
        
        if (unmatchedCards.length < 2) {
            return;
        }
        
        // 매칭 가능한 카드 쌍 찾기
        const pairs = this.findMatchingPairs(unmatchedCards);
        
        if (pairs.length > 0) {
            const randomPair = pairs[Math.floor(Math.random() * pairs.length)];
            
            // 힌트 애니메이션
            randomPair.forEach(card => {
                card.element.classList.add('hint');
                setTimeout(() => {
                    card.element.classList.remove('hint');
                }, 2000);
            });
            
            this.gameState.hintCount--;
            this.updateUI();
            
            // 사운드 효과
            this.playSound('hint');
        }
    }

    // 매칭 가능한 카드 쌍 찾기
    findMatchingPairs(cards) {
        const pairs = [];
        const usedCards = new Set();
        
        for (let i = 0; i < cards.length; i++) {
            if (usedCards.has(cards[i].id)) continue;
            
            for (let j = i + 1; j < cards.length; j++) {
                if (usedCards.has(cards[j].id)) continue;
                
                if (cards[i].value === cards[j].value) {
                    pairs.push([cards[i], cards[j]]);
                    usedCards.add(cards[i].id);
                    usedCards.add(cards[j].id);
                    break;
                }
            }
        }
        
        return pairs;
    }

    // 게임 리셋
    resetGame() {
        if (confirm('정말로 게임을 다시 시작하시겠습니까?')) {
            this.startNewGame(this.gameState.level, this.gameState.playerName);
        }
    }

    // 사운드 효과 (선택사항)
    playSound(type) {
        // 사운드가 활성화되어 있고 Web Audio API를 지원하는 경우에만
        if (window.GameConfig.storage.get(window.GameConfig.STORAGE_KEYS.SOUND_ENABLED) !== false) {
            // 간단한 beep 사운드 생성
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                // 사운드 타입별 주파수 설정
                const frequencies = {
                    flip: 400,
                    match: 600,
                    mismatch: 200,
                    victory: 800,
                    hint: 500
                };
                
                oscillator.frequency.value = frequencies[type] || 400;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
            } catch (error) {
                // 사운드 재생 실패시 무시
            }
        }
    }

    // 현재 게임 상태 반환
    getGameState() {
        return { ...this.gameState };
    }
}

// 배경 파티클 생성 함수
function createBackgroundParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    
    // 기존 파티클 제거
    particlesContainer.innerHTML = '';
    
    // 50개의 파티클 생성
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // 랜덤 위치와 지연시간 설정
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = (15 + Math.random() * 10) + 's';
        
        particlesContainer.appendChild(particle);
    }
}

// 페이지 로드시 파티클 생성
document.addEventListener('DOMContentLoaded', () => {
    createBackgroundParticles();
    
    // 30초마다 파티클 갱신
    setInterval(createBackgroundParticles, 30000);
});

// 전역 게임 인스턴스
window.CardGameInstance = new CardGame();