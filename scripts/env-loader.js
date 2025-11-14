// env-loader.js - 환경 변수 로더
// 로컬 개발 환경에서만 사용되며, 프로덕션에서는 빌드시 주입된 값을 사용

async function loadEnvironmentVariables() {
    // 이미 환경 변수가 설정되어 있다면 스킵
    if (window.ENV && window.ENV.SUPABASE_URL) {
        return;
    }

    // 로컬 개발 환경에서만 .env 파일 로드 시도
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        try {
            // 간단한 .env 파서 (프로덕션 사용 금지!)
            const response = await fetch('/.env');
            if (response.ok) {
                const envText = await response.text();
                const envVars = parseEnvFile(envText);
                
                window.ENV = window.ENV || {};
                Object.assign(window.ENV, {
                    SUPABASE_URL: envVars.VITE_SUPABASE_URL || '',
                    SUPABASE_ANON_KEY: envVars.VITE_SUPABASE_ANON_KEY || ''
                });
                
                console.log('✅ 로컬 환경 변수 로드 완료');
            }
        } catch (error) {
            console.warn('⚠️ .env 파일을 읽을 수 없습니다:', error.message);
            console.warn('수동으로 환경 변수를 설정하거나 build 스크립트를 사용하세요.');
        }
    }
}

function parseEnvFile(envText) {
    const vars = {};
    envText.split('\n').forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                vars[key.trim()] = valueParts.join('=').trim();
            }
        }
    });
    return vars;
}

// 페이지 로드시 환경 변수 로드
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadEnvironmentVariables);
} else {
    loadEnvironmentVariables();
}