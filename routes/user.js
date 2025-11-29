const express = require('express');
const router = express.Router();
const db = require('../config/database');

// --- 비밀번호 변경 API (PUT /api/user/password) ---
router.put('/password', async (req, res) => {
    const { userId, currentPassword, newPassword } = req.body;

    if (!userId || !currentPassword || !newPassword) {
        return res.status(400).json({ message: '입력 값이 부족합니다.' });
    }

    try {
        // 1. 사용자 확인 및 기존 비밀번호 검증
        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        const user = users[0];
        // (주의: 실무에선 bcrypt compare 사용 필수)
        if (user.password !== currentPassword) {
            return res.status(401).json({ message: '현재 비밀번호가 일치하지 않습니다.' });
        }

        // 2. 비밀번호 업데이트
        await db.query('UPDATE users SET password = ? WHERE id = ?', [newPassword, userId]);

        res.json({ message: '비밀번호가 성공적으로 변경되었습니다.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// --- 계정 삭제 API (DELETE /api/user/account) ---
router.delete('/account', async (req, res) => {
    const { userId, password } = req.body;

    if (!userId || !password) {
        return res.status(400).json({ message: '비밀번호를 입력해주세요.' });
    }

    try {
        // 1. 사용자 확인 및 비밀번호 검증 (삭제 전 본인 확인)
        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        const user = users[0];
        if (user.password !== password) {
            return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
        }

        // 2. 계정 삭제
        // (주의: 실제로는 외래키 제약조건 때문에 일정(schedules) 등 연관 데이터를 먼저 지워야 할 수도 있음)
        // 예: await db.query('DELETE FROM schedules WHERE user_id = ?', [userId]);
        await db.query('DELETE FROM users WHERE id = ?', [userId]);

        res.json({ message: '계정이 삭제되었습니다.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

module.exports = router;