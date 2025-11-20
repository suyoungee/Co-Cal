
const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 그룹 생성 API (POST /api/groups)
router.post('/', async (req, res) => {
    const { name, description, user_id } = req.body;

    // 필수 값 확인
    if (!name || !user_id) {
        return res.status(400).json({ message: '그룹 이름과 개설자 정보가 필요합니다.' });
    }

    // 간단한 순차 실행
    try {
        // 그룹 만들기 (study_groups 테이블에 INSERT)
        const insertGroupQuery = 'INSERT INTO study_groups (name, description, created_by) VALUES (?, ?, ?)';
        const [groupResult] = await db.query(insertGroupQuery, [name, description, user_id]);
        
        const newGroupId = groupResult.insertId; // 방금 생성된 그룹의 ID

        // 개설자를 멤버로 추가하기 (group_members 테이블에 INSERT), 방장도 바로 멤버로
        const insertMemberQuery = 'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)';
        await db.query(insertMemberQuery, [newGroupId, user_id]);

        // 성공 응답
        res.status(201).json({ 
            message: '스터디 그룹이 생성되었습니다!',
            groupId: newGroupId,
            name: name
        });

    } catch (error) {
        console.error('그룹 생성 실패:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 내 그룹 목록 조회 API (GET /api/groups?user_id=1)
// (화면 테스트를 위해 조회 기능도 미리 넣어둡니다)
router.get('/', async (req, res) => {
    const { user_id } = req.query;

    if (!user_id) return res.status(400).json({ message: '로그인이 필요합니다.' });

    try {
        // 내가 속한(group_members에 있는) 그룹 정보를 가져오는 조인(JOIN) 쿼리
        const query = `
            SELECT g.id, g.name, g.description, g.created_by 
            FROM study_groups g
            JOIN group_members m ON g.id = m.group_id
            WHERE m.user_id = ?
            ORDER BY g.created_at DESC
        `;
        const [rows] = await db.query(query, [user_id]);
        
        res.json(rows);

    } catch (error) {
        console.error('그룹 조회 실패:', error);
        res.status(500).json({ message: '서버 오류' });
    }
});

// 그룹 멤버 조회 API (GET /api/groups/:groupId/members)
router.get('/:groupId/members', async (req, res) => {
    const { groupId } = req.params;

    try {
        const query = `
            SELECT u.id, u.name, u.email, m.joined_at
            FROM group_members m
            JOIN users u ON m.user_id = u.id
            WHERE m.group_id = ?
            ORDER BY m.joined_at ASC
        `;
        const [members] = await db.query(query, [groupId]);
        res.json(members);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '서버 오류' });
    }
});

// 그룹 멤버 초대 API (POST /api/groups/:groupId/members)
router.post('/:groupId/members', async (req, res) => {
    const { groupId } = req.params;
    const { email } = req.body; // 초대할 사람 이메일

    if (!email) return res.status(400).json({ message: '초대할 이메일을 입력해주세요.' });

    try {
        // 유저가 존재하는지 확인
        const [users] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ message: '해당 이메일의 사용자를 찾을 수 없습니다.' });
        }
        const targetUserId = users[0].id;

        // 이미 그룹 멤버인지 확인
        const [existing] = await db.query(
            'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
            [groupId, targetUserId]
        );
        if (existing.length > 0) {
            return res.status(409).json({ message: '이미 그룹에 가입된 멤버입니다.' });
        }

        // 멤버 추가
        await db.query(
            'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)',
            [groupId, targetUserId]
        );

        res.status(201).json({ message: '멤버를 초대했습니다!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '서버 오류' });
    }
});

module.exports = router;