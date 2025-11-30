
const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 일정 저장 API
router.post('/', async (req, res) => {
    const { user_id, date, content } = req.body;

    // 데이터 검증
    if (!user_id || !date || !content) {
        return res.status(400).json({ message: '날짜와 내용을 모두 입력해주세요.' });
    }

    try {
        // DB에 저장
        const query = 'INSERT INTO schedules (user_id, date, content) VALUES (?, ?, ?)';
        await db.query(query, [user_id, date, content]);

        res.status(201).json({ message: '일정이 저장되었습니다!' });

    } catch (error) {
        console.error('일정 저장 에러:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 일정 조회 API
router.get('/', async (req, res) => {
    const { user_id, group_id } = req.query;

    try {
        let query = '';
        let params = [];

        if (group_id) {
            query = `
                SELECT s.id, s.user_id, s.date, s.content, u.name as user_name
                FROM schedules s
                JOIN users u ON s.user_id = u.id
                JOIN group_members gm ON s.user_id = gm.user_id
                WHERE gm.group_id = ?
            `;
            params = [group_id];
        } else if (user_id) {
            // 개인 일정 조회
            query = 'SELECT * FROM schedules WHERE user_id = ?';
            params = [user_id];
        } else {
            return res.status(400).json({ message: 'user_id 또는 group_id가 필요합니다.' });
        }

        const [rows] = await db.query(query, params);

        // 날짜 포맷 변환 (YYYY-MM-DD)
        const schedules = rows.map(row => {
            const d = new Date(row.date);
            // UTC 변환 없이, 현재 시스템(한국) 시간 기준으로 연/월/일 추출
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            
            return {
                ...row,
                date: `${year}-${month}-${day}`
            };
        });

        res.json(schedules);

    } catch (error) {
        console.error('일정 조회 에러:', error);
        res.status(500).json({ message: '서버 오류' });
    }
});

// 일정 수정 API
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { content, user_id } = req.body;
    try {
        const [result] = await db.query('UPDATE schedules SET content = ? WHERE id = ? AND user_id = ?', [content, id, user_id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: '권한 없음 또는 실패' });
        res.json({ message: '수정되었습니다.' });
    } catch (error) { console.error(error); res.status(500).json({ message: '서버 오류' }); }
});

// 일정 삭제 API
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const { user_id } = req.body; 
    try {
        const [result] = await db.query('DELETE FROM schedules WHERE id = ? AND user_id = ?', [id, user_id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: '권한 없음 또는 실패' });
        res.json({ message: '삭제되었습니다.' });
    } catch (error) { console.error(error); res.status(500).json({ message: '서버 오류' }); }
});

module.exports = router;