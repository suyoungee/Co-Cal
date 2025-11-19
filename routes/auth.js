// routes/auth.js
const express = require('express');
const router = express.Router();
const db = require('../config/database'); // DB 연결 가져오기

// --- 회원가입 API (POST /api/auth/signup) ---
router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;

    // 1. 데이터가 다 왔는지 확인
    if (!name || !email || !password) {
        return res.status(400).json({ message: '모든 항목을 입력해주세요.' });
    }

    try {
        // 2. 이메일 중복 확인 (이미 가입된 사람인지?)
        const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(409).json({ message: '이미 존재하는 이메일입니다.' });
        }

        // 3. DB에 저장 (암호화는 안함)
        await db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, password]);

        res.status(201).json({ message: '회원가입이 완료되었습니다!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// --- 로그인 API (POST /api/auth/login) ---
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // 1. 입력값 확인
    if (!email || !password) {
        return res.status(400).json({ message: '이메일과 비밀번호를 입력해주세요.' });
    }

    try {
        // 2. 이메일로 사용자 찾기
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.status(401).json({ message: '가입되지 않은 이메일입니다.' });
        }

        const user = users[0];

        // 3. 비밀번호 비교 (주의: 실무에선 bcrypt 등으로 암호화된 값을 비교해야 함)
        if (user.password !== password) {
            return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
        }

        // 4. 로그인 성공! (클라이언트에 유저 정보(이름, id)를 보내줌)
        res.json({
            message: '로그인 성공!',
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

module.exports = router;