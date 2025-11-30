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
        // 사용자 확인 및 기존 비밀번호 검증
        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        const user = users[0];
        if (user.password !== currentPassword) {
            return res.status(401).json({ message: '현재 비밀번호가 일치하지 않습니다.' });
        }

        // 비밀번호 업데이트
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
        // 1. 사용자 확인
        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        const user = users[0];
        
        // 2. 비밀번호 검증
        if (user.password !== password) {
            return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
        }

        // ============================================================
        // [수정된 부분] 연관된 모든 데이터를 순서대로 삭제 (에러 방지)
        // ============================================================
        
        // 1) [요청하신 부분] 그룹 시간표에서 내 데이터 삭제
        await db.query('DELETE FROM study_timetable WHERE user_id = ?', [userId]);

        // 2) 내 개인 캘린더 일정 삭제
        await db.query('DELETE FROM schedules WHERE user_id = ?', [userId]);

        // 3) 가입 신청 내역 삭제
        await db.query('DELETE FROM group_join_requests WHERE user_id = ?', [userId]);

        // 4) 그룹 멤버 목록에서 삭제
        await db.query('DELETE FROM group_members WHERE user_id = ?', [userId]);

        // 5) [중요] 내가 방장으로 있는 스터디 그룹 자체를 삭제
        // (방장이 사라지면 그룹을 관리할 사람이 없으므로 그룹도 삭제하는 것이 일반적입니다)
        await db.query('DELETE FROM study_groups WHERE created_by = ?', [userId]);

        // ============================================================

        // 6. 마지막으로 사용자 계정 삭제
        await db.query('DELETE FROM users WHERE id = ?', [userId]);

        res.json({ message: '계정과 모든 데이터가 삭제되었습니다.' });

    } catch (error) {
        console.error('계정 삭제 실패:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

module.exports = router;