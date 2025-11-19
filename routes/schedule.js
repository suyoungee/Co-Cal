const express = require('express');
const router = express.Router();
const db = require('../config/database');

// --- 일정 저장 API (POST /api/schedules) ---
router.post('/', async (req, res) => {
    const { user_id, date, content } = req.body;

    // 1. 데이터 검증
    if (!user_id || !date || !content) {
        return res.status(400).json({ message: '날짜와 내용을 모두 입력해주세요.' });
    }

    try {
        // 2. DB에 저장
        const query = 'INSERT INTO schedules (user_id, date, content) VALUES (?, ?, ?)';
        await db.query(query, [user_id, date, content]);

        res.status(201).json({ message: '일정이 저장되었습니다!' });

    } catch (error) {
        console.error('일정 저장 에러:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// --- 일정 조회 API (GET /api/schedules?user_id=1) ---
router.get('/', async (req, res) => {
    const { user_id } = req.query; // 주소창 물음표 뒤의 user_id를 가져옴

    if (!user_id) {
        return res.status(400).json({ message: '로그인이 필요합니다.' });
    }

    try {
        // 해당 유저의 모든 일정을 가져옴
        const query = 'SELECT * FROM schedules WHERE user_id = ?';
        const [rows] = await db.query(query, [user_id]);

        // 날짜 포맷 변환 (로컬 시간 기준 유지)
        const schedules = rows.map(row => {
            const d = new Date(row.date);
            // UTC 변환 없이, 현재 시스템(한국) 시간 기준으로 연/월/일 추출
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            
            return {
                ...row,
                date: `${year}-${month}-${day}` // "YYYY-MM-DD" 형태로 조합
            };
        });

        res.json(schedules);

    } catch (error) {
        console.error('일정 조회 에러:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// --- 일정 수정 API (PUT /api/schedules/:id) ---
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { content, user_id } = req.body; // user_id는 본인 글인지 확인용

    try {
        // 내 글이 맞는지 확인하고 내용 수정
        const query = 'UPDATE schedules SET content = ? WHERE id = ? AND user_id = ?';
        const [result] = await db.query(query, [content, id, user_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '일정을 찾을 수 없거나 수정 권한이 없습니다.' });
        }

        res.json({ message: '일정이 수정되었습니다.' });
    } catch (error) {
        console.error('수정 에러:', error);
        res.status(500).json({ message: '서버 오류' });
    }
});

// --- 일정 삭제 API (DELETE /api/schedules/:id) ---
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    // user_id는 쿼리스트링이나 바디로 받아서 검증해야 안전함 (여기선 간단히 구현)
    const { user_id } = req.body; 

    try {
        const query = 'DELETE FROM schedules WHERE id = ? AND user_id = ?';
        const [result] = await db.query(query, [id, user_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '일정을 찾을 수 없거나 삭제 권한이 없습니다.' });
        }

        res.json({ message: '일정이 삭제되었습니다.' });
    } catch (error) {
        console.error('삭제 에러:', error);
        res.status(500).json({ message: '서버 오류' });
    }
});

module.exports = router;