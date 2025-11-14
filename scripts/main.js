// main.js - 메인 앱 초기화 및 이벤트 처리

class CardGameApp {
    constructor() {
        this.currentLevel = 1;
        this.currentPlayerName = '';
        this.isInitialized = false;
        
        this.initializeApp();
    }

    // 앱 초기화
    async initializeApp() {
        console.log('🚀 카드 게임 앱 초기화 시작...');
        
        try {
            // Supabase 초기화
            const supabaseInitialized = window.GameConfig.initializeSupabase();
            if (!supabaseInitialized) {
                console.warn('⚠️ Supabase 연결 실패 - 오프라인 모드로 실행');
            }
            
            // DOM 요소 초기화
            this.initializeElements();
            
            // 이벤트 리스너 설정
            this.setupEventListeners();
            
            // 저장된 설정 로드
            this.loadSavedSettings();
            
            // 연결 상태 모니터링 시작
            this.startConnectionMonitoring();
            
            this.isInitialized = true;
            console.log('✅ 앱 초기화 완료');
            
        } catch (error) {
            console.error('❌ 앱 초기화 실패:', error);
            alert('게임 초기화에 실패했습니다. 페이지를 새로고침해주세요.');
        }
    }

    // DOM 요소 초기화
    initializeElements() {
        this.elements = {
            // 모달들
            gameSetupModal: document.getElementById('gameSetup'),
            gameCompleteModal: document.getElementById('gameComplete'),
            leaderboardModal: document.getElementById('leaderboard'),
            pauseOverlay: document.getElementById('pauseOverlay'),
            
            // 입력 요소들
            playerNameInput: document.getElementById('playerName'),
            difficultyButtons: document.querySelectorAll('.difficulty-btn'),
            
            // 버튼들
            startGameBtn: document.getElementById('startGame'),
            pauseBtn: document.getElementById('pauseBtn'),
            resetBtn: document.getElementById('resetBtn'),
            hintBtn: document.getElementById('hintBtn'),
            resumeBtn: document.getElementById('resumeBtn'),
            playAgainBtn: document.getElementById('playAgain'),
            viewLeaderboardBtn: document.getElementById('viewLeaderboard'),
            showLeaderboardBtn: document.getElementById('showLeaderboard'),
            closeLeaderboardBtn: document.getElementById('closeLeaderboard'),
            
            // 리더보드 요소들
            leaderboardList: document.getElementById('leaderboardList'),
            filterButtons: document.querySelectorAll('.filter-btn')
        };
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 게임 설정 모달
        this.elements.difficultyButtons.forEach(btn => {
            btn.addEventListener('click', () => this.selectDifficulty(btn));
        });
        
        this.elements.startGameBtn.addEventListener('click', () => this.startGame());
        
        // 게임 컨트롤 버튼들
        this.elements.pauseBtn.addEventListener('click', () => this.togglePause());
        this.elements.resetBtn.addEventListener('click', () => this.resetGame());
        this.elements.hintBtn.addEventListener('click', () => this.showHint());
        this.elements.resumeBtn.addEventListener('click', () => this.togglePause());
        
        // 게임 완료 모달
        this.elements.playAgainBtn.addEventListener('click', () => this.playAgain());
        this.elements.viewLeaderboardBtn.addEventListener('click', () => this.showLeaderboard());
        
        // 리더보드
        this.elements.showLeaderboardBtn.addEventListener('click', () => this.showLeaderboard());
        this.elements.closeLeaderboardBtn.addEventListener('click', () => this.hideLeaderboard());
        
        this.elements.filterButtons.forEach(btn => {
            btn.addEventListener('click', () => this.filterLeaderboard(btn));
        });
        
        // 모달 외부 클릭으로 닫기
        this.setupModalClickEvents();
        
        // 키보드 단축키
        this.setupKeyboardEvents();
        
        // 페이지 언로드 이벤트
        window.addEventListener('beforeunload', () => this.handlePageUnload());
    }

    // 모달 외부 클릭 이벤트 설정
    setupModalClickEvents() {
        [this.elements.gameSetupModal, this.elements.gameCompleteModal, this.elements.leaderboardModal]
            .forEach(modal => {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.hideAllModals();
                    }
                });
            });
    }

    // 키보드 이벤트 설정
    setupKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            // ESC 키로 모달 닫기
            if (e.key === 'Escape') {
                this.hideAllModals();
            }
            
            // 스페이스바로 일시정지/재개
            if (e.code === 'Space' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                this.togglePause();
            }
            
            // H 키로 힌트
            if (e.key.toLowerCase() === 'h' && !e.target.matches('input, textarea')) {
                this.showHint();
            }
            
            // R 키로 리셋
            if (e.key.toLowerCase() === 'r' && !e.target.matches('input, textarea')) {
                this.resetGame();
            }
        });
    }

    // 저장된 설정 로드
    loadSavedSettings() {
        const savedName = window.GameConfig.storage.get(window.GameConfig.STORAGE_KEYS.PLAYER_NAME);
        if (savedName) {
            this.elements.playerNameInput.value = savedName;
            this.currentPlayerName = savedName;
        }
        
        const savedSettings = window.GameConfig.storage.get(window.GameConfig.STORAGE_KEYS.GAME_SETTINGS);
        if (savedSettings && savedSettings.lastLevel) {
            this.selectDifficultyByLevel(savedSettings.lastLevel);
        }
    }

    // 난이도 선택
    selectDifficulty(selectedBtn) {
        this.elements.difficultyButtons.forEach(btn => btn.classList.remove('active'));
        selectedBtn.classList.add('active');
        this.currentLevel = parseInt(selectedBtn.dataset.level);
    }

    // 레벨로 난이도 선택
    selectDifficultyByLevel(level) {
        const btn = document.querySelector(`[data-level="${level}"]`);
        if (btn) {
            this.selectDifficulty(btn);
        }
    }

    // 게임 시작
    startGame() {
        const playerName = this.elements.playerNameInput.value.trim();
        
        if (playerName) {
            this.currentPlayerName = playerName;
            // 플레이어 이름 저장
            window.GameConfig.storage.set(window.GameConfig.STORAGE_KEYS.PLAYER_NAME, playerName);
        }
        
        // 게임 설정 저장
        const gameSettings = {
            lastLevel: this.currentLevel,
            lastPlayed: new Date().toISOString()
        };
        window.GameConfig.storage.set(window.GameConfig.STORAGE_KEYS.GAME_SETTINGS, gameSettings);
        
        // 모달 숨기기
        this.elements.gameSetupModal.classList.remove('active');
        
        // 게임 인스턴스에서 게임 시작
        window.CardGameInstance.startNewGame(this.currentLevel, this.currentPlayerName);
        
        console.log(`🎮 게임 시작 - 레벨: ${this.currentLevel}, 플레이어: ${this.currentPlayerName || '익명'}`);
    }

    // 게임 일시정지/재개
    togglePause() {
        window.CardGameInstance.togglePause();
    }

    // 게임 리셋
    resetGame() {
        window.CardGameInstance.resetGame();
    }

    // 힌트 표시
    showHint() {
        window.CardGameInstance.showHint();
    }

    // 다시 플레이
    playAgain() {
        this.hideAllModals();
        this.elements.gameSetupModal.classList.add('active');
    }

    // 리더보드 표시
    async showLeaderboard() {
        this.hideAllModals();
        this.elements.leaderboardModal.classList.add('active');
        
        // 기본으로 전체 리더보드 로드
        await this.loadLeaderboard('all');
    }

    // 리더보드 숨기기
    hideLeaderboard() {
        this.elements.leaderboardModal.classList.remove('active');
    }

    // 리더보드 필터링
    async filterLeaderboard(selectedBtn) {
        this.elements.filterButtons.forEach(btn => btn.classList.remove('active'));
        selectedBtn.classList.add('active');
        
        const level = selectedBtn.dataset.level;
        await this.loadLeaderboard(level);
    }

    // 리더보드 로드
    async loadLeaderboard(level = 'all') {
        try {
            // 로딩 표시
            this.elements.leaderboardList.innerHTML = '<div class="loading-container"><div class="loading"></div><p>리더보드를 불러오는 중...</p></div>';
            
            const result = await window.DatabaseAPI.getLeaderboard(level === 'all' ? null : level, 50);
            
            if (result.success) {
                this.renderLeaderboard(result.data, result.isLocal);
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            console.error('리더보드 로드 실패:', error);
            this.elements.leaderboardList.innerHTML = '<p class="error-message">⚠️ 리더보드를 불러올 수 없습니다.</p>';
        }
    }

    // 리더보드 렌더링
    renderLeaderboard(scores, isLocal = false) {
        if (scores.length === 0) {
            this.elements.leaderboardList.innerHTML = '<p class="empty-message">📝 아직 기록이 없습니다.</p>';
            return;
        }
        
        let html = '';
        
        if (isLocal) {
            html += '<div class="local-notice">📱 오프라인 모드 - 로컬 기록만 표시됩니다.</div>';
        }
        
        scores.forEach((score, index) => {
            const rank = index + 1;
            const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
            const levelName = window.GameConfig.GAME_LEVELS[score.level]?.name || '알 수 없음';
            const formattedTime = window.GameConfig.formatTime(score.time_taken);
            const formattedDate = window.GameConfig.formatDate(score.completed_at);
            
            html += `
                <div class="leaderboard-item">
                    <div class="leaderboard-rank ${rankClass}">${rank}</div>
                    <div class="leaderboard-name" title="${score.player_name}">${score.player_name}</div>
                    <div class="leaderboard-score">${score.score.toLocaleString()}</div>
                    <div class="leaderboard-time">${formattedTime}</div>
                    <div class="leaderboard-moves">${score.cards_flipped}</div>
                </div>
            `;
        });
        
        // 헤더 추가
        html = `
            <div class="leaderboard-header">
                <div class="leaderboard-rank">순위</div>
                <div class="leaderboard-name">이름</div>
                <div class="leaderboard-score">점수</div>
                <div class="leaderboard-time">시간</div>
                <div class="leaderboard-moves">시도</div>
            </div>
            ${html}
        `;
        
        this.elements.leaderboardList.innerHTML = html;
    }

    // 모든 모달 숨기기
    hideAllModals() {
        [this.elements.gameSetupModal, this.elements.gameCompleteModal, this.elements.leaderboardModal]
            .forEach(modal => modal.classList.remove('active'));
        
        this.elements.pauseOverlay.classList.add('hidden');
    }

    // 연결 상태 모니터링
    startConnectionMonitoring() {
        // 5분마다 연결 상태 확인
        setInterval(async () => {
            const isOnline = await window.DatabaseAPI.checkConnectionStatus();
            
            if (isOnline && window.DatabaseAPI.getConnectionStatus() === 'offline') {
                // 온라인 상태로 복구되었을 때 오프라인 데이터 동기화
                console.log('🔄 온라인 상태 복구됨. 오프라인 데이터 동기화 시작...');
                await window.DatabaseAPI.syncOfflineData();
            }
        }, 5 * 60 * 1000); // 5분
    }

    // 페이지 언로드 처리
    handlePageUnload() {
        // 게임 진행 중이면 일시정지 상태로 저장
        const gameState = window.CardGameInstance.getGameState();
        
        if (gameState.isPlaying && !gameState.isGameOver) {
            const gameProgress = {
                ...gameState,
                savedAt: new Date().toISOString()
            };
            
            window.GameConfig.storage.set('cardgame_progress', gameProgress);
            console.log('💾 게임 진행상황이 저장되었습니다.');
        }
    }

    // 저장된 게임 복구 (선택사항)
    async restoreSavedGame() {
        const savedProgress = window.GameConfig.storage.get('cardgame_progress');
        
        if (savedProgress && savedProgress.isPlaying && !savedProgress.isGameOver) {
            const now = new Date();
            const savedAt = new Date(savedProgress.savedAt);
            const hoursPassed = (now - savedAt) / (1000 * 60 * 60);
            
            // 1시간 이내에 저장된 게임만 복구 제안
            if (hoursPassed < 1) {
                if (confirm('이전에 진행 중이던 게임이 있습니다. 계속하시겠습니까?')) {
                    // 게임 복구 로직 구현
                    // 현재는 간단하게 새 게임 시작으로 대체
                    this.startGame();
                }
            }
            
            // 저장된 진행상황 제거
            window.GameConfig.storage.remove('cardgame_progress');
        }
    }
}

// DOM이 로드된 후 앱 시작
document.addEventListener('DOMContentLoaded', () => {
    window.CardGameApp = new CardGameApp();
});

// 서비스 워커 등록 (PWA 지원, 선택사항)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('✅ Service Worker 등록 성공:', registration.scope);
            })
            .catch(error => {
                console.log('❌ Service Worker 등록 실패:', error);
            });
    });
}