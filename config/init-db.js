const db = require('./database');

// 테이블 생성 쿼리
const initQuery = `
    -- 1. 유저 테이블
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. 스터디 그룹 테이블
    CREATE TABLE IF NOT EXISTS study_groups (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
    );

    -- 3. 일정 테이블
    CREATE TABLE IF NOT EXISTS schedules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        group_id INT NULL,
        date DATE NOT NULL,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE CASCADE
    );
    
    -- 4. 스터디 멤버 테이블
    CREATE TABLE IF NOT EXISTS group_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT NOT NULL,
        user_id INT NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY (group_id, user_id)
    );

    -- 5. 가입 신청 테이블
    CREATE TABLE IF NOT EXISTS group_join_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT NOT NULL,
        user_id INT NOT NULL,
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY uniq_req (group_id, user_id)
    );

    -- 6. 스터디 시간표 테이블
    CREATE TABLE IF NOT EXISTS study_timetable (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT NOT NULL,
        user_id INT NOT NULL,
        day_of_week TINYINT NOT NULL,
        block TINYINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_slot (group_id, user_id, day_of_week, block),
        FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
`;

// 초기 샘플 데이터 삽입 
const seedData = async () => {
    try {
        await db.query(`
            INSERT IGNORE INTO users (id, email, password, name) 
            VALUES (1, 'leader@cocal.com', '1234', '방장');
        `);

        await db.query(`
            INSERT IGNORE INTO users (id, email, password, name) 
            VALUES (2, 'coworker@cocal.com', '1234', '팀원');
        `);

        await db.query(`
            INSERT IGNORE INTO study_groups (id, name, description, created_by) 
            VALUES (1, '웹응용프로그래밍 스터디', '기말고사 대비 스터디', 1), (2, '겨울방학 웹개발 프로젝트', '겨울방학 때 프로젝트 하나 진행하실 분', 1);
        `);

        await db.query(`
            INSERT IGNORE INTO group_members (group_id, user_id) 
            VALUES (1, 1), (2, 1);
        `);

        console.log('샘플 데이터(Seeding) 로드 완료');

    } catch (error) {
        console.error('샘플 데이터 로드 실패:', error);
    }
};

// DB 초기화: 테이블 생성 후 샘플 데이터 삽입
const initDB = async () => {
    try {
        const queries = initQuery.split(';').filter(q => q.trim());
        for (const query of queries) {
            await db.query(query);
        }
        console.log('데이터베이스 테이블 초기화 완료');
        await seedData();
    } catch (error) {
        console.error('초기화 실패:', error);
    }
};

module.exports = initDB;