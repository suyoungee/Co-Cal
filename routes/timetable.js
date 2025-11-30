const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 그룹 시간표 조회
router.get('/', async (req, res) => {
    let { group_id, user_id } = req.query;
    group_id = Number(group_id);
    user_id = user_id ? Number(user_id) : null;

    if (!group_id) {
        return res.status(400).json({ message: 'group_id 필요함' });
    }

    try {
        if (user_id) {
            // 내 시간표만 조회
            const [rows] = await db.query(
                `SELECT day_of_week, block
                 FROM study_timetable
                 WHERE group_id = ? AND user_id = ?`,
                [group_id, user_id]
            );
            return res.json(rows);
        } else {
            // 그룹 전체 합산
            const [rows] = await db.query(
                `SELECT day_of_week, block, COUNT(*) AS count
                 FROM study_timetable
                 WHERE group_id = ?
                 GROUP BY day_of_week, block`,
                [group_id]
            );
            return res.json(rows);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '시간표 조회 실패' });
    }
});

// 특정 시간 블록 토글 (내 시간표 수정)
router.post('/', async (req, res) => {
    let { group_id, user_id, day_of_week, block, isOn } = req.body;

    group_id = Number(group_id);
    user_id = Number(user_id);
    day_of_week = Number(day_of_week);
    block = Number(block);

    if (!group_id || !user_id || day_of_week === undefined || block === undefined) {
        return res.status(400).json({ message: '필수 값 누락됨' });
    }

    try {
        if (isOn) {
            await db.query(
                `INSERT IGNORE INTO study_timetable 
                 (group_id, user_id, day_of_week, block)
                 VALUES (?, ?, ?, ?)`,
                [group_id, user_id, day_of_week, block]
            );
        } else {
            await db.query(
                `DELETE FROM study_timetable 
                 WHERE group_id = ? AND user_id = ? 
                 AND day_of_week = ? AND block = ?`,
                [group_id, user_id, day_of_week, block]
            );
        }

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '시간표 업데이트 실패' });
    }
});

module.exports = router;
