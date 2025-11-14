// database.js - Supabase 데이터베이스 연동

// 데이터베이스 연결 상태 확인
function checkDatabaseConnection() {
    const supabase = window.GameConfig.supabase();
    return supabase !== null;
}

// 점수 저장 함수
async function saveGameScore(playerName, score, level, cardsFlipped, timeSpent) {
    try {
        const supabase = window.GameConfig.supabase();
        if (!supabase) {
            throw new Error('Supabase 연결이 초기화되지 않았습니다.');
        }

        const gameData = {
            player_name: playerName || '익명',
            score: score,
            level: level,
            cards_flipped: cardsFlipped,
            time_taken: timeSpent
        };

        const { data, error } = await supabase
            .from('card_game_scores')
            .insert([gameData])
            .select();

        if (error) {
            console.error('점수 저장 오류:', error);
            throw error;
        }

        console.log('✅ 점수가 성공적으로 저장되었습니다:', data);
        return { success: true, data };

    } catch (error) {
        console.error('❌ 점수 저장 실패:', error);
        
        // 오프라인 또는 오류시 로컬 스토리지에 저장
        saveScoreToLocal(playerName, score, level, cardsFlipped, timeSpent);
        
        return { success: false, error: error.message };
    }
}

// 로컬 스토리지에 점수 저장 (백업)
function saveScoreToLocal(playerName, score, level, cardsFlipped, timeSpent) {
    try {
        const localScores = window.GameConfig.storage.get(window.GameConfig.STORAGE_KEYS.BEST_SCORES) || [];
        
        const newScore = {
            id: Date.now(), // 임시 ID
            player_name: playerName || '익명',
            score,
            level,
            cards_flipped: cardsFlipped,
            time_taken: timeSpent,
            completed_at: new Date().toISOString(),
            isLocal: true // 로컬 저장 표시
        };

        localScores.push(newScore);
        
        // 최신 20개만 유지
        localScores.sort((a, b) => b.score - a.score);
        localScores.splice(20);
        
        window.GameConfig.storage.set(window.GameConfig.STORAGE_KEYS.BEST_SCORES, localScores);
        console.log('📱 점수가 로컬에 저장되었습니다.');
        
        return true;
    } catch (error) {
        console.error('로컬 저장 실패:', error);
        return false;
    }
}

// 리더보드 조회 함수
async function getLeaderboard(level = null, limit = 50) {
    try {
        const supabase = window.GameConfig.supabase();
        if (!supabase) {
            // Supabase 연결이 없으면 로컬 데이터 반환
            return getLocalLeaderboard(level, limit);
        }

        let query = supabase
            .from('card_game_scores')
            .select('*')
            .order('score', { ascending: false })
            .limit(limit);

        // 레벨 필터링
        if (level && level !== 'all') {
            query = query.eq('level', parseInt(level));
        }

        const { data, error } = await query;

        if (error) {
            console.error('리더보드 조회 오류:', error);
            throw error;
        }

        console.log('✅ 리더보드 조회 성공:', data?.length || 0, '개 기록');
        return { success: true, data: data || [] };

    } catch (error) {
        console.error('❌ 리더보드 조회 실패:', error);
        
        // 오프라인이거나 오류시 로컬 데이터 반환
        return getLocalLeaderboard(level, limit);
    }
}

// 로컬 리더보드 조회
function getLocalLeaderboard(level = null, limit = 50) {
    try {
        let localScores = window.GameConfig.storage.get(window.GameConfig.STORAGE_KEYS.BEST_SCORES) || [];
        
        // 레벨 필터링
        if (level && level !== 'all') {
            localScores = localScores.filter(score => score.level === parseInt(level));
        }
        
        // 점수순 정렬
        localScores.sort((a, b) => b.score - a.score);
        
        // 제한된 수만 반환
        const limitedScores = localScores.slice(0, limit);
        
        console.log('📱 로컬 리더보드 조회:', limitedScores.length, '개 기록');
        return { success: true, data: limitedScores, isLocal: true };
        
    } catch (error) {
        console.error('로컬 리더보드 조회 실패:', error);
        return { success: false, data: [], error: error.message };
    }
}

// 플레이어 최고 점수 조회
async function getPlayerBestScore(playerName, level = null) {
    try {
        const supabase = window.GameConfig.supabase();
        if (!supabase) {
            return getLocalPlayerBestScore(playerName, level);
        }

        let query = supabase
            .from('card_game_scores')
            .select('*')
            .eq('player_name', playerName)
            .order('score', { ascending: false })
            .limit(1);

        if (level) {
            query = query.eq('level', parseInt(level));
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        return { success: true, data: data?.[0] || null };

    } catch (error) {
        console.error('최고 점수 조회 실패:', error);
        return getLocalPlayerBestScore(playerName, level);
    }
}

// 로컬 플레이어 최고 점수 조회
function getLocalPlayerBestScore(playerName, level = null) {
    try {
        let localScores = window.GameConfig.storage.get(window.GameConfig.STORAGE_KEYS.BEST_SCORES) || [];
        
        localScores = localScores.filter(score => score.player_name === playerName);
        
        if (level) {
            localScores = localScores.filter(score => score.level === parseInt(level));
        }
        
        localScores.sort((a, b) => b.score - a.score);
        
        return { success: true, data: localScores[0] || null, isLocal: true };
        
    } catch (error) {
        console.error('로컬 최고 점수 조회 실패:', error);
        return { success: false, data: null, error: error.message };
    }
}

// 게임 통계 조회
async function getGameStats() {
    try {
        const supabase = window.GameConfig.supabase();
        if (!supabase) {
            return getLocalGameStats();
        }

        // 총 게임 수
        const { count: totalGames } = await supabase
            .from('card_game_scores')
            .select('*', { count: 'exact', head: true });

        // 레벨별 평균 점수
        const { data: levelStats } = await supabase
            .from('card_game_scores')
            .select('level, score')
            .order('level');

        // 최고 점수
        const { data: topScore } = await supabase
            .from('card_game_scores')
            .select('*')
            .order('score', { ascending: false })
            .limit(1);

        const stats = {
            totalGames: totalGames || 0,
            topScore: topScore?.[0] || null,
            levelStats: calculateLevelStats(levelStats || [])
        };

        return { success: true, data: stats };

    } catch (error) {
        console.error('통계 조회 실패:', error);
        return getLocalGameStats();
    }
}

// 로컬 게임 통계
function getLocalGameStats() {
    try {
        const localScores = window.GameConfig.storage.get(window.GameConfig.STORAGE_KEYS.BEST_SCORES) || [];
        
        const stats = {
            totalGames: localScores.length,
            topScore: localScores.sort((a, b) => b.score - a.score)[0] || null,
            levelStats: calculateLevelStats(localScores),
            isLocal: true
        };
        
        return { success: true, data: stats };
        
    } catch (error) {
        console.error('로컬 통계 조회 실패:', error);
        return { success: false, data: null, error: error.message };
    }
}

// 레벨별 통계 계산
function calculateLevelStats(scores) {
    const levelStats = {};
    
    scores.forEach(score => {
        const level = score.level;
        if (!levelStats[level]) {
            levelStats[level] = {
                count: 0,
                totalScore: 0,
                avgScore: 0,
                bestScore: 0
            };
        }
        
        levelStats[level].count++;
        levelStats[level].totalScore += score.score;
        levelStats[level].bestScore = Math.max(levelStats[level].bestScore, score.score);
    });
    
    // 평균 계산
    Object.keys(levelStats).forEach(level => {
        const stat = levelStats[level];
        stat.avgScore = Math.round(stat.totalScore / stat.count);
    });
    
    return levelStats;
}

// 연결 상태 모니터링
let connectionStatus = 'checking';

async function checkConnectionStatus() {
    try {
        const supabase = window.GameConfig.supabase();
        if (!supabase) {
            connectionStatus = 'offline';
            return false;
        }

        // 간단한 쿼리로 연결 테스트
        const { data, error } = await supabase
            .from('card_game_scores')
            .select('id')
            .limit(1);

        if (error) {
            connectionStatus = 'error';
            return false;
        }

        connectionStatus = 'online';
        return true;

    } catch (error) {
        connectionStatus = 'offline';
        return false;
    }
}

// 연결 상태 가져오기
function getConnectionStatus() {
    return connectionStatus;
}

// 오프라인 데이터 동기화 (나중에 온라인 상태가 되었을 때)
async function syncOfflineData() {
    try {
        const localScores = window.GameConfig.storage.get(window.GameConfig.STORAGE_KEYS.BEST_SCORES) || [];
        const unsyncedScores = localScores.filter(score => score.isLocal);
        
        if (unsyncedScores.length === 0) {
            console.log('동기화할 오프라인 데이터가 없습니다.');
            return { success: true, synced: 0 };
        }

        const supabase = window.GameConfig.supabase();
        if (!supabase) {
            throw new Error('Supabase 연결이 없습니다.');
        }

        let syncedCount = 0;
        
        for (const score of unsyncedScores) {
            try {
                const { error } = await supabase
                    .from('card_game_scores')
                    .insert([{
                        player_name: score.player_name,
                        score: score.score,
                        level: score.level,
                        cards_flipped: score.cards_flipped,
                        time_taken: score.time_taken
                    }]);

                if (!error) {
                    syncedCount++;
                    // 로컬에서 제거 (isLocal 플래그 제거)
                    score.isLocal = false;
                }
            } catch (syncError) {
                console.error('개별 점수 동기화 실패:', syncError);
            }
        }

        // 동기화된 데이터 업데이트
        window.GameConfig.storage.set(window.GameConfig.STORAGE_KEYS.BEST_SCORES, localScores);
        
        console.log(`✅ ${syncedCount}개의 오프라인 데이터가 동기화되었습니다.`);
        return { success: true, synced: syncedCount };

    } catch (error) {
        console.error('오프라인 데이터 동기화 실패:', error);
        return { success: false, error: error.message };
    }
}

// 데이터베이스 함수들을 전역으로 내보내기
window.DatabaseAPI = {
    checkDatabaseConnection,
    saveGameScore,
    saveScoreToLocal,
    getLeaderboard,
    getLocalLeaderboard,
    getPlayerBestScore,
    getLocalPlayerBestScore,
    getGameStats,
    getLocalGameStats,
    checkConnectionStatus,
    getConnectionStatus,
    syncOfflineData,
    calculateLevelStats
};

// 초기 연결 상태 확인
checkConnectionStatus();