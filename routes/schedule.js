const express = require('express');
const router = express.Router();
const db = require('../config/database');

// --- 일정 저장 API (POST /api/schedules) ---
// (기존과 동일: 글 쓸 때는 작성자 정보가 필요함)
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

// --- 일정 조회 API (GET /api/schedules) ---
// (수정됨: group_id가 있으면 그룹 전체 조회, user_id만 있으면 개인 조회)
router.get('/', async (req, res) => {
    const { user_id, group_id } = req.query; 

    // ID 정보가 하나도 없으면 에러 처리
    if (!user_id && !group_id) {
        return res.status(400).json({ message: '조회할 ID 정보가 필요합니다.' });
    }

    try {
        let rows = [];

        if (group_id) {
            // [CASE 1] 그룹 조회: 그룹 멤버들의 ID를 먼저 찾고 -> 그들의 일정을 모두 가져옴
            const [members] = await db.query('SELECT user_id FROM group_members WHERE group_id = ?', [group_id]);
            
            if (members.length > 0) {
                const memberIds = members.map(m => m.user_id);
                // IN 절을 위한 물음표 생성 (?, ?, ?)
                const placeholders = memberIds.map(() => '?').join(', ');
                
                // 멤버들의 일정 + 작성자 이름(u.name)까지 조인해서 가져옴
                const query = `
                    SELECT s.*, u.name as user_name 
                    FROM schedules s
                    JOIN users u ON s.user_id = u.id
                    WHERE s.user_id IN (${placeholders})
                `;
                const [result] = await db.query(query, memberIds);
                rows = result;
            }
        } else {
            // [CASE 2] 개인 조회: 기존 로직 유지 (이름 정보도 통일성을 위해 JOIN 추가)
            const query = `
                SELECT s.*, u.name as user_name 
                FROM schedules s
                JOIN users u ON s.user_id = u.id
                WHERE s.user_id = ?
            `;
            const [result] = await db.query(query, [user_id]);
            rows = result;
        }

        // 보내주신 날짜 포맷 변환 로직 유지
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
// (수정됨: 본인 확인 로직 제거 -> 그룹원 누구나 수정 가능)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { content } = req.body; 

    try {
        // [변경] AND user_id = ? 부분을 제거했습니다. (ID만 맞으면 수정 가능)
        const query = 'UPDATE schedules SET content = ? WHERE id = ?';
        const [result] = await db.query(query, [content, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '일정을 찾을 수 없습니다.' });
        }

        res.json({ message: '일정이 수정되었습니다.' });
    } catch (error) {
        console.error('수정 에러:', error);
        res.status(500).json({ message: '서버 오류' });
    }
});

// --- 일정 삭제 API (DELETE /api/schedules/:id) ---
// (수정됨: 본인 확인 로직 제거 -> 그룹원 누구나 삭제 가능)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        // [변경] AND user_id = ? 부분을 제거했습니다. (ID만 맞으면 삭제 가능)
        const query = 'DELETE FROM schedules WHERE id = ?';
        const [result] = await db.query(query, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '일정을 찾을 수 없습니다.' });
        }

        res.json({ message: '일정이 삭제되었습니다.' });
    } catch (error) {
        console.error('삭제 에러:', error);
        res.status(500).json({ message: '서버 오류' });
    }
});

module.exports = router;