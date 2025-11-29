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
// --- 일정 조회 API (수정됨: 개인 또는 그룹 일정 조회) ---
router.get('/', async (req, res) => {
    // 프론트엔드에서 보낸 user_id 또는 group_id를 받습니다.
    const { user_id, group_id } = req.query;

    try {
        let query;
        let params = [];

        // 상황 1: 그룹 버튼을 눌러서 'group_id'가 들어온 경우
        if (group_id) {
            // 1-1. 그 그룹에 속한 멤버들의 ID를 먼저 다 찾습니다.
            const [members] = await db.query('SELECT user_id FROM group_members WHERE group_id = ?', [group_id]);
            
            // 멤버가 한 명도 없으면 빈 배열 반환
            if (members.length === 0) return res.json([]);

            // 1-2. 멤버들의 ID만 뽑아서 리스트로 만듭니다. (예: [1, 3, 5])
            const memberIds = members.map(m => m.user_id);

            // 1-3. 그 멤버들이 쓴 일정을 모두 가져옵니다. (SQL의 IN 문법 사용)
            // 물음표(?)를 멤버 수만큼 만듭니다.
            const placeholders = memberIds.map(() => '?').join(', ');
            
            query = `
                SELECT s.id, s.date, s.content, s.user_id, u.name as user_name
                FROM schedules s
                JOIN users u ON s.user_id = u.id
                WHERE s.user_id IN (${placeholders})
                ORDER BY s.date ASC
            `;
            params = memberIds; 
        } 
        // 상황 2: 그냥 내 캘린더라서 'user_id'만 들어온 경우
        else if (user_id) {
            query = `
                SELECT s.id, s.date, s.content, s.user_id, u.name as user_name
                FROM schedules s
                JOIN users u ON s.user_id = u.id
                WHERE s.user_id = ?
                ORDER BY s.date ASC
            `;
            params = [user_id];
        } else {
            return res.status(400).json({ message: '사용자 ID 또는 그룹 ID가 필요합니다.' });
        }

        const [rows] = await db.query(query, params);
        res.json(rows);

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