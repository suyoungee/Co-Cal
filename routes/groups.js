
const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 그룹 생성 API
router.post('/', async (req, res) => {
    const { name, description, user_id } = req.body;

    if (!name || !user_id) {
        return res.status(400).json({ message: '그룹 이름과 개설자 정보가 필요합니다.' });
    }

    try {
        // 그룹 만들기
        const insertGroupQuery = 'INSERT INTO study_groups (name, description, created_by) VALUES (?, ?, ?)';
        const [groupResult] = await db.query(insertGroupQuery, [name, description, user_id]);
        
        const newGroupId = groupResult.insertId;

        // 개설자를 멤버로 추가하기
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

// 내 그룹 목록 조회 API 
router.get('/', async (req, res) => {
    const { user_id } = req.query;

    if (!user_id) return res.status(400).json({ message: '로그인이 필요합니다.' });

    try {
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

// 그룹 멤버 조회 API
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

// 그룹 멤버 초대 API
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

// 그룹 검색 API
router.get('/search/all', async (req, res) => {
    const { keyword } = req.query;
    try {
        let query = `
            SELECT g.id, g.name, g.description, u.name as creator_name, 
            (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
            FROM study_groups g
            JOIN users u ON g.created_by = u.id
        `;
        
        let params = [];
        if (keyword) {
            query += ' WHERE g.name LIKE ?';
            params.push(`%${keyword}%`);
        }
        
        query += ' ORDER BY g.created_at DESC';

        const [groups] = await db.query(query, params);
        res.json(groups);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '서버 오류' });
    }
});

// 가입 신청 API
router.post('/:groupId/join', async (req, res) => {
    const { groupId } = req.params;
    const { user_id } = req.body;

    try {
        // 이미 멤버인지 확인
        const [memberCheck] = await db.query(
            'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
            [groupId, user_id]
        );
        if (memberCheck.length > 0) return res.status(409).json({ message: '이미 가입된 그룹입니다.' });

        // 이미 신청했는지 확인
        const [requestCheck] = await db.query(
            'SELECT id FROM group_join_requests WHERE group_id = ? AND user_id = ?',
            [groupId, user_id]
        );
        if (requestCheck.length > 0) return res.status(409).json({ message: '이미 가입 신청을 했습니다.' });

        // 신청 대기열에 추가
        await db.query(
            'INSERT INTO group_join_requests (group_id, user_id) VALUES (?, ?)',
            [groupId, user_id]
        );
        res.status(201).json({ message: '가입 신청을 보냈습니다. 방장의 승인을 기다리세요.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '서버 오류' });
    }
});

// 가입 신청 목록 조회 (방장 전용)
router.get('/:groupId/requests', async (req, res) => {
    const { groupId } = req.params;
    try {
        const query = `
            SELECT r.id, r.user_id, u.name, u.email, r.requested_at
            FROM group_join_requests r
            JOIN users u ON r.user_id = u.id
            WHERE r.group_id = ?
            ORDER BY r.requested_at ASC
        `;
        const [requests] = await db.query(query, [groupId]);
        res.json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '서버 오류' });
    }
});

// 가입 승인/거절 API
router.post('/:groupId/requests/:requestId/handle', async (req, res) => {
    const { groupId, requestId } = req.params;
    const { action } = req.body; // 'approve' 또는 'reject'

    try {
        // 신청 내역 가져오기
        const [reqData] = await db.query('SELECT user_id FROM group_join_requests WHERE id = ?', [requestId]);
        if (reqData.length === 0) return res.status(404).json({ message: '신청 내역이 없습니다.' });
        
        const targetUserId = reqData[0].user_id;

        if (action === 'approve') {
            await db.query('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)', [groupId, targetUserId]);
        }

        await db.query('DELETE FROM group_join_requests WHERE id = ?', [requestId]);

        res.json({ message: action === 'approve' ? '가입을 승인했습니다.' : '가입을 거절했습니다.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '서버 오류' });
    }
});

// 그룹 삭제 API
router.delete('/:groupId', async (req, res) => {
    const { groupId } = req.params;
    const { user_id } = req.body; // 요청한 사람

    try {
        // 그룹이 존재하고, 요청한 사람이 방장인지 확인
        const [group] = await db.query('SELECT created_by FROM study_groups WHERE id = ?', [groupId]);
        
        if (group.length === 0) {
            return res.status(404).json({ message: '그룹을 찾을 수 없습니다.' });
        }

        if (group[0].created_by !== user_id) {
            return res.status(403).json({ message: '방장만 그룹을 삭제할 수 있습니다.' });
        }

        // 그룹 삭제
        await db.query('DELETE FROM study_groups WHERE id = ?', [groupId]);

        res.json({ message: '스터디 그룹이 삭제되었습니다.' });

    } catch (error) {
        console.error('그룹 삭제 실패:', error);
        res.status(500).json({ message: '서버 오류' });
    }
});

// 멤버 탈퇴/추방 API
router.delete('/:groupId/members/:memberId', async (req, res) => {
    const { groupId, memberId } = req.params;
    const { requesterId } = req.body;

    try {
        // 그룹 정보 조회
        const [group] = await db.query('SELECT created_by FROM study_groups WHERE id = ?', [groupId]);
        if (group.length === 0) return res.status(404).json({ message: '그룹이 없습니다.' });
        
        const leaderId = group[0].created_by;

        // 권한 체크
        if (parseInt(requesterId) !== parseInt(memberId) && parseInt(requesterId) !== leaderId) {
            return res.status(403).json({ message: '권한이 없습니다.' });
        }

        if (parseInt(memberId) === leaderId) {
            return res.status(400).json({ message: '방장은 탈퇴할 수 없습니다. 그룹을 삭제해주세요.' });
        }
        
        // ============================================================
        // [수정 완료] 변수명 통일 & 테이블 이름 변경 (study_timetable)
        // ============================================================
        const deleteTimetableQuery = `
            DELETE FROM study_timetable 
            WHERE group_id = ? AND user_id = ?
        `;

        // 위에서 만든 deleteTimetableQuery 변수를 정확히 사용
        await db.query(deleteTimetableQuery, [groupId, memberId]);
        // ============================================================

        // 멤버 목록에서 삭제
        await db.query('DELETE FROM group_members WHERE group_id = ? AND user_id = ?', [groupId, memberId]);

        const msg = (parseInt(requesterId) === parseInt(memberId)) ? '탈퇴했습니다.' : '멤버를 추방했습니다.';
        res.json({ message: msg });

    } catch (error) {
        console.error('멤버 삭제 실패:', error);
        res.status(500).json({ message: '서버 오류' });
    }
});

module.exports = router;