### 1. 프로젝트 내려받기 (Clone) & 라이브러리 설치
```
git clone https://github.com/suyoungee/Co-Cal.git
cd Co-Cal
npm install
```
- MySQL도 설치해주세요. (설치 시 설정한 root 비밀번호 기억해야합니다.)

### 2. 환경 변수 파일(.env) 생성
DB 비밀번호 등 민감한 정보는 깃허브에 올리지 않았습니다.
1. VS Code로 Co-Cal 폴더를 엽니다.
2. 최상위 경로(package.json이 있는 곳)에 .env 라는 이름의 새 파일을 만듭니다.
3. 아래 내용을 복사해서 붙여넣고 저장합니다.
```
DB_HOST=localhost
DB_USER=cocal_user
DB_PASSWORD=Cocal@2025
DB_NAME=cocal_db
```
### 3. 데이터베이스(MySQL) 세팅
- 로컬 PC에 똑같은 DB와 테이블이 있어야 서버가 돌아갑니다.
1. MySQL Command Line Client를 실행하거나 터미널에서 로그인합니다.
```mysql -u root -p```
(설치할 때 정한 root 비밀번호 입력)
2. 아래 SQL 쿼리문들을 **한 줄씩 복사해서 실행**해주세요.
```
CREATE DATABASE cocal_db;

CREATE USER 'cocal_user'@'localhost' IDENTIFIED BY 'Cocal@2025';

GRANT ALL PRIVILEGES ON cocal_db.* TO 'cocal_user'@'localhost';
FLUSH PRIVILEGES;

USE cocal_db;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```
3. [추가] timetable DB 세팅
```
USE cocal_db;

CREATE TABLE study_timetable (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    day_of_week TINYINT NOT NULL,
    block TINYINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_slot (group_id, user_id, day_of_week, block)
);
```

### 4. 서버 실행 및 테스트
1. VS Code(혹은 다른 IDE)의 터미널에서 'npm start'를 입력하여 실행시킵니다.
2. 🚀 Co-Cal 서버가 실행되었습니다! 메시지와 ✅ MySQL 데이터베이스 연결 성공! 메시지가 뜨면 성공입니다.
3. 인터넷 브라우저에서 http://localhost:3000 으로 접속하여 확인해주세요.

### 확인해 볼 기능
- 회원가입/로그인: 잘 되는지?
- 일정 기록: 캘린더 날짜 클릭 -> 내용 입력 -> 저장 -> 빨간 점 생기는지?
- 리스트 보기: 같은 날짜에 일정을 2개 이상 넣었을 때 리스트로 뜨는지?
- 수정/삭제: 리스트 클릭해서 수정 및 삭제가 잘 되는지?

### 혹시 에러가 난다면
- npm start가 안되는 문제 -> npm install 했는지 확인
- DB 연결 에러(Access denied) -> '.env' 파일에 공백이 없는지, MySQL에 cocal_user 계정이 잘 만들어졌는지 확인