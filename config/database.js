const mysql = require('mysql2');
require('dotenv').config();

console.log('--- DB 연결 정보 확인 ---');
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('------------------------');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection((err, conn) => {
    if (err) {
        console.error('DB 연결 실패:', err.code);
    } else {
        console.log('MySQL 데이터베이스 연결 성공');
        conn.release();
    }
});

module.exports = pool.promise();