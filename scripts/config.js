// config.js - Supabase 연결 설정

// Supabase 프로젝트 설정 - 빌드시 자동 생성된 설정 사용
// 보안을 위해 실제 API 키는 환경 변수로 관리하고 빌드시 주입됩니다
function getSupabaseConfig() {
    // 1순위: 빌드시 생성된 설정 파일에서 로드
    if (typeof window !== 'undefined' && window.SUPABASE_CONFIG) {
        console.log('🔧 빌드 설정에서 Supabase 정보 로드');
        return {
            url: window.SUPABASE_CONFIG.url,
            anonKey: window.SUPABASE_CONFIG.anonKey
        };
    }
    
    // 2순위: 런타임 환경 변수 확인
    if (typeof window !== 'undefined' && window.ENV && window.ENV.SUPABASE_URL) {
        console.log('🔧 런타임 환경변수에서 Supabase 정보 로드');
        return {
            url: window.ENV.SUPABASE_URL,
            anonKey: window.ENV.SUPABASE_ANON_KEY
        };
    }
    
    // 3순위: 환경 변수가 없는 경우 에러 처리
    console.error('❌ Supabase 설정을 찾을 수 없습니다!');
    console.error('다음 중 하나의 방법으로 설정하세요:');
    console.error('1. .env 파일 생성 (로컬 개발)');
    console.error('2. npm run build 실행 (프로덕션 배포)');
    console.error('3. 환경 변수 직접 설정');
    
    throw new Error('Supabase configuration is missing. Please check your environment variables or build configuration.');
}

const SUPABASE_CONFIG = getSupabaseConfig();

// Supabase 클라이언트 초기화
let supabase = null;

// Supabase 초기화 함수
function initializeSupabase() {
    try {
        if (typeof window.supabase === 'undefined') {
            console.error('Supabase 라이브러리가 로드되지 않았습니다.');
            return false;
        }

        supabase = window.supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey
        );

        console.log('✅ Supabase 연결 성공');
        return true;
    } catch (error) {
        console.error('❌ Supabase 초기화 실패:', error);
        return false;
    }
}

// 게임 레벨 설정
const GAME_LEVELS = {
    1: {
        name: "쉬움",
        grid: { rows: 3, cols: 4 }, // 6쌍 = 12장
        timeLimit: 120, // 2분
        targetFlips: 12,
        baseScore: 500
    },
    2: {
        name: "보통",
        grid: { rows: 4, cols: 4 }, // 8쌍 = 16장
        timeLimit: 180, // 3분
        targetFlips: 24,
        baseScore: 1000
    },
    3: {
        name: "어려움",
        grid: { rows: 4, cols: 6 }, // 12쌍 = 24장
        timeLimit: 240, // 4분
        targetFlips: 36,
        baseScore: 1500
    }
};

// 카드 데이터 (이모지 사용)
const CARD_DATA = {
    animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐸', '🐵', '🐧', '🐔', '🦆', '🐢', '🐍', '🦋'],
    fruits: ['🍎', '🍊', '🍋', '🍌', '🍇', '🍓', '🍑', '🍒', '🥝', '🍍', '🥭', '🍉', '🥑', '🍅', '🌶️', '🥕'],
    objects: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏓', '🏸', '🥍', '⛳', '🎯', '🎲', '🎮', '🎨', '🎪'],
    nature: ['🌸', '🌺', '🌻', '🌷', '🌹', '🌿', '🍀', '🌱', '🌲', '🌳', '🌴', '🌵', '🌾', '⭐', '🌙', '☀️']
};

// 점수 계산 함수
function calculateScore(timeSpent, cardsFlipped, level) {
    const levelConfig = GAME_LEVELS[level];
    const baseScore = levelConfig.baseScore;
    
    // 시간 보너스 (빨리 완료할수록 높은 점수)
    const remainingTime = Math.max(0, levelConfig.timeLimit - timeSpent);
    const timeBonus = Math.floor(remainingTime * 5);
    
    // 효율성 보너스 (적은 시도로 완료할수록 높은 점수)
    const efficiencyRatio = levelConfig.targetFlips / cardsFlipped;
    const efficiencyBonus = Math.floor(efficiencyRatio * 200);
    
    // 최종 점수 계산
    const finalScore = baseScore + timeBonus + efficiencyBonus;
    
    return Math.max(0, finalScore);
}

// 시간 포맷 함수
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 날짜 포맷 함수
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
        return '오늘';
    } else if (diffDays === 2) {
        return '어제';
    } else if (diffDays <= 7) {
        return `${diffDays - 1}일 전`;
    } else {
        return date.toLocaleDateString('ko-KR');
    }
}

// 랜덤 카드 데이터 생성 함수
function generateRandomCards(level, theme = 'animals') {
    const levelConfig = GAME_LEVELS[level];
    const totalPairs = (levelConfig.grid.rows * levelConfig.grid.cols) / 2;
    const themeCards = CARD_DATA[theme];
    
    // 필요한 수만큼 카드 선택
    const selectedCards = themeCards.slice(0, totalPairs);
    
    // 카드 쌍 생성
    const cards = [];
    selectedCards.forEach(card => {
        cards.push(card, card); // 같은 카드 2장씩
    });
    
    // 카드 섞기
    return shuffleArray(cards);
}

// 배열 섞기 함수 (Fisher-Yates 알고리즘)
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// 로컬 스토리지 키
const STORAGE_KEYS = {
    PLAYER_NAME: 'cardgame_player_name',
    BEST_SCORES: 'cardgame_best_scores',
    GAME_SETTINGS: 'cardgame_settings',
    SOUND_ENABLED: 'cardgame_sound_enabled'
};

// 로컬 스토리지 헬퍼 함수들
const storage = {
    get: (key) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch {
            return null;
        }
    },
    
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    },
    
    remove: (key) => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch {
            return false;
        }
    }
};

// 디버그 모드 (개발용)
const DEBUG_MODE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

if (DEBUG_MODE) {
    console.log('🎮 카드 게임 디버그 모드');
    console.log('설정:', { GAME_LEVELS, CARD_DATA });
}

// 설정을 전역으로 내보내기
window.GameConfig = {
    SUPABASE_CONFIG,
    GAME_LEVELS,
    CARD_DATA,
    STORAGE_KEYS,
    calculateScore,
    formatTime,
    formatDate,
    generateRandomCards,
    shuffleArray,
    storage,
    DEBUG_MODE,
    initializeSupabase,
    supabase: () => supabase
};