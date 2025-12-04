
const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

const CALENDARIFIC_API_KEY = process.env.CALENDARIFIC_API_KEY;
const CALENDARIFIC_API_URL = 'https://calendarific.com/api/v2/holidays';

const holidayNameMap = {
    "New Year's Day": "신정",
    "Seollal Holiday": "설날 연휴",
    "Seollal": "설날",
    "Independence Movement Day": "3·1절",
    "Day off for Independence Movement Day": "대체 공휴일(3·1절)",
    "Labor Day": "근로자의 날",
    "Buddha’s Birthday": "부처님 오신 날",
    "Children's Day": "어린이날",
    "Day off for Children's Day": "대체 공휴일(어린이날)",
    "Armed Forces Day": "국군의 날",         
    "Presidential Election": "대통령 선거일",
    "Memorial Day": "현충일",
    "Liberation Day": "광복절",
    "National Foundation Day": "개천절",
    "Chuseok Holiday": "추석 연휴",
    "Chuseok": "추석",
    "Day off for Chuseok Holiday": "대체 공휴일(추석)",
    "Hangeul Proclamation Day": "한글날",
    "Christmas Day": "크리스마스",
    "Alternative holiday": "대체 공휴일",    
    "Substitute Holiday": "대체 공휴일",     
    "Election Day": "선거일",
    "Buddha's Birthday Holiday": "부처님 오신 날",
    "Day off for Buddha’s Birthday" : "대체공휴일",
    "National Assembly Election Day" : "국회의원 선거일"
};

// 공휴일 조회 API
router.get('/', async (req, res) => {
    const { year, country = 'KR' } = req.query; 

    if (!CALENDARIFIC_API_KEY) {
        return res.status(500).json({ message: "API 키 누락" });
    }

    try {
        const url = `${CALENDARIFIC_API_URL}?api_key=${CALENDARIFIC_API_KEY}&country=${country}&year=${year}&type=national&language=ko`;
        
        console.log(`API 요청: ${url}`);

        const response = await fetch(url);
        const data = await response.json();

        if (data.meta && data.meta.code !== 200) {
             return res.status(data.meta.code).json({ message: "API 오류" });
        }
        
        const holidays = data.response.holidays.map(holiday => {
            let finalName = holiday.name;

            if (holidayNameMap[holiday.name]) {
                finalName = holidayNameMap[holiday.name];
            }

            return {
                name: finalName,
                date: holiday.date.iso,
                type: holiday.type.join(', ')
            };
        })
        .filter(holiday => {
            return holiday.name !== '근로자의 날' && holiday.name !== '국군의 날';
        });

        res.json(holidays);

    } catch (error) {
        console.error('에러:', error);
        res.status(500).json({ message: '서버 오류' });
    }
});

module.exports = router;
