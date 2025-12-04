const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 비밀번호 변경 API
router.put('/password', async (req, res) => {
    const { userId, currentPassword, newPassword } = req.body;

    if (!userId || !currentPassword || !newPassword) {
        return res.status(400).json({ message: '입력 값이 부족합니다.' });
    }

    try {
        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        const user = users[0];
        if (user.password !== currentPassword) {
            return res.status(401).json({ message: '현재 비밀번호가 일치하지 않습니다.' });
        }

        await db.query('UPDATE users SET password = ? WHERE id = ?', [newPassword, userId]);

        res.json({ message: '비밀번호가 성공적으로 변경되었습니다.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 계정 삭제 API
router.delete('/account', async (req, res) => {
    const { userId, password } = req.body;

    if (!userId || !password) {
        return res.status(400).json({ message: '비밀번호를 입력해주세요.' });
    }

    try {
        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        const user = users[0];
        
        if (user.password !== password) {
            return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
        }

        // 연관 데이터 삭제 순서 중요 
        
        // 1. 하위 데이터 삭제 (시간표, 일정, 요청)
        
        await db.query('DELETE FROM study_timetable WHERE user_id = ?', [userId]);
        await db.query('DELETE FROM schedules WHERE user_id = ?', [userId]);
        await db.query('DELETE FROM group_join_requests WHERE user_id = ?', [userId]);
        await db.query('DELETE FROM group_members WHERE user_id = ?', [userId]);

        // 2. 내가 방장인 그룹 삭제
        await db.query('DELETE FROM study_groups WHERE created_by = ?', [userId]);
        
        // 3. 사용자 삭제
        await db.query('DELETE FROM users WHERE id = ?', [userId]);

        res.json({ message: '계정과 모든 데이터가 삭제되었습니다.' });

    } catch (error) {
        console.error('계정 삭제 실패:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

module.exports = router;