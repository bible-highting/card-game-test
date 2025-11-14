#!/usr/bin/env node

// build.js - 빌드 시 환경변수 기반 설정 파일 생성
const fs = require('fs');
const path = require('path');

// 환경변수에서 Supabase 설정 읽기
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

// 빌드 정보
const BUILD_INFO = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    version: process.env.npm_package_version || '1.0.0'
};

// supabase-config.js 파일 내용 생성
const configContent = `// supabase-config.js - 빌드 시 자동 생성됨
// 생성 시간: ${BUILD_INFO.timestamp}
// 환경: ${BUILD_INFO.environment}

window.SUPABASE_CONFIG = {
    url: '${SUPABASE_URL}',
    anonKey: '${SUPABASE_ANON_KEY}',
    buildInfo: {
        timestamp: '${BUILD_INFO.timestamp}',
        environment: '${BUILD_INFO.environment}',
        version: '${BUILD_INFO.version}'
    }
};

// 환경변수 설정 확인
if (!window.SUPABASE_CONFIG.url || !window.SUPABASE_CONFIG.anonKey) {
    console.warn('⚠️ Supabase 환경변수가 설정되지 않았습니다.');
    console.log('필요한 환경변수:', ['SUPABASE_URL', 'SUPABASE_ANON_KEY']);
    
    // 개발환경 기본값 사용 (로컬 개발용)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('🔧 로컬 개발환경 기본값 사용');
        window.SUPABASE_CONFIG = {
            url: 'https://upzorlgkdzxxvavhpjur.supabase.co',
            anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwem9ybGdrZHp4eHZhdmhwanVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5OTM3NjEsImV4cCI6MjA3ODU2OTc2MX0.VC9skry9ip9wc1ODsBNN1U512Ex-rOQy0SleiCvvX6w',
            buildInfo: window.SUPABASE_CONFIG.buildInfo
        };
    }
}

console.log('✅ Supabase 설정 로드 완료', {
    hasUrl: !!window.SUPABASE_CONFIG.url,
    hasKey: !!window.SUPABASE_CONFIG.anonKey,
    environment: window.SUPABASE_CONFIG.buildInfo.environment
});
`;

// 파일 저장
const outputPath = path.join(__dirname, 'supabase-config.js');

try {
    fs.writeFileSync(outputPath, configContent, 'utf8');
    
    console.log('✅ supabase-config.js 생성 완료');
    console.log('📁 경로:', outputPath);
    console.log('🔧 환경:', BUILD_INFO.environment);
    console.log('📅 생성 시간:', BUILD_INFO.timestamp);
    
    // 환경변수 확인 상태 출력
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        console.log('🔐 환경변수 설정됨:', {
            SUPABASE_URL: SUPABASE_URL.substring(0, 30) + '...',
            SUPABASE_ANON_KEY: SUPABASE_ANON_KEY.substring(0, 20) + '...'
        });
    } else {
        console.log('⚠️ 환경변수 누락 - 개발용 기본값이 사용됩니다');
        console.log('필요한 환경변수: SUPABASE_URL, SUPABASE_ANON_KEY');
    }
    
} catch (error) {
    console.error('❌ supabase-config.js 생성 실패:', error.message);
    process.exit(1);
}