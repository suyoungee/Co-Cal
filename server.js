
const express = require('express');
const app = express();
const path = require('path');
const db = require('./config/database');
const initDB = require('./config/init-db');
initDB();
const authRoutes = require('./routes/auth');
const scheduleRoutes = require('./routes/schedule');
const holidayRoutes = require('./routes/holiday');
const groupRoutes = require('./routes/groups');
const timetableRoutes = require('./routes/timetable');
const userRouter = require('./routes/user');


const PORT = 3000;


app.use(express.static(path.join(__dirname, 'public')));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/api/auth', authRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/user', userRouter);


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.listen(PORT, () => {
    console.log(`\n==========================================`);
    console.log(`Co-Cal 서버가 실행되었습니다`);
    console.log(`접속 주소: http://localhost:${PORT}`);
    console.log(`==========================================\n`);
});