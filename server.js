
const express = require('express');
const app = express();
const path = require('path');
const db = require('./config/database'); //서버가 켜질 때 DB 연결 시도
const authRoutes = require('./routes/auth');

// 설정: 서버 포트 번호 (3000번)
const PORT = 3000;

// 미들웨어 1: 정적 파일(HTML, CSS, JS)을 public 폴더에서 가져오도록 설정
app.use(express.static(path.join(__dirname, 'public')));

// 미들웨어 2: JSON 데이터 해석 (나중에 로그인, DB 연동 때 필요)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 라우트 등록
app.use('/api/auth', authRoutes);

// 기본 경로('/')로 접속했을 때 index.html 보내주기
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`\n==========================================`);
    console.log(`🚀 Co-Cal 서버가 실행되었습니다!`);
    console.log(`👉 접속 주소: http://localhost:${PORT}`);
    console.log(`==========================================\n`);
});