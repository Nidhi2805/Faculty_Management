const { pool } = require('./database');
const bcrypt = require('bcryptjs');

const initializeDatabase = async () => {
  const conn = await pool.getConnection();
  try {
    console.log('🔧 Initializing database schema...');

    await conn.query('SET FOREIGN_KEY_CHECKS = 0');

    await conn.query(`CREATE TABLE IF NOT EXISTS departments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      code VARCHAR(20) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    await conn.query(`CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin','hod','faculty') NOT NULL DEFAULT 'faculty',
      department_id INT,
      phone VARCHAR(15),
      designation VARCHAR(100),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
    )`);

    await conn.query(`CREATE TABLE IF NOT EXISTS subjects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      code VARCHAR(20) NOT NULL UNIQUE,
      department_id INT,
      semester INT,
      credits INT DEFAULT 3,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
    )`);

    await conn.query(`CREATE TABLE IF NOT EXISTS faculty_subjects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      faculty_id INT NOT NULL,
      subject_id INT NOT NULL,
      is_primary BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_faculty_subject (faculty_id, subject_id),
      FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    )`);

    await conn.query(`CREATE TABLE IF NOT EXISTS timetable (
      id INT AUTO_INCREMENT PRIMARY KEY,
      faculty_id INT NOT NULL,
      subject_id INT NOT NULL,
      department_id INT NOT NULL,
      day_of_week ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday') NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      room_number VARCHAR(20),
      semester INT,
      academic_year VARCHAR(10) DEFAULT '2024-25',
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
    )`);

    await conn.query(`CREATE TABLE IF NOT EXISTS leave_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      faculty_id INT NOT NULL,
      leave_type ENUM('sick','casual','earned','maternity','emergency','other') NOT NULL DEFAULT 'casual',
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      total_days INT NOT NULL,
      reason TEXT NOT NULL,
      status ENUM('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
      hod_id INT,
      hod_remarks TEXT,
      reviewed_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (hod_id) REFERENCES users(id) ON DELETE SET NULL
    )`);

    await conn.query(`CREATE TABLE IF NOT EXISTS lecture_reassignments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      leave_request_id INT NOT NULL,
      timetable_id INT NOT NULL,
      original_faculty_id INT NOT NULL,
      substitute_faculty_id INT,
      subject_id INT NOT NULL,
      reassignment_date DATE NOT NULL,
      day_of_week VARCHAR(10) NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      room_number VARCHAR(20),
      status ENUM('pending','assigned','completed','cancelled') DEFAULT 'pending',
      assignment_method ENUM('auto','manual') DEFAULT 'auto',
      hod_override_reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (leave_request_id) REFERENCES leave_requests(id) ON DELETE CASCADE,
      FOREIGN KEY (timetable_id) REFERENCES timetable(id) ON DELETE CASCADE,
      FOREIGN KEY (original_faculty_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (substitute_faculty_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    )`);

    await conn.query(`CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(200) NOT NULL,
      message TEXT NOT NULL,
      type ENUM('leave_applied','leave_approved','leave_rejected','lecture_reassigned','substitution_assigned','general') NOT NULL DEFAULT 'general',
      is_read BOOLEAN DEFAULT FALSE,
      related_id INT NULL,
      related_type VARCHAR(50) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    await conn.query(`CREATE TABLE IF NOT EXISTS workload_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      faculty_id INT NOT NULL,
      month INT NOT NULL,
      year INT NOT NULL,
      substitution_count INT DEFAULT 0,
      regular_lectures INT DEFAULT 0,
      max_allowed_substitutions INT DEFAULT 10,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_faculty_month_year (faculty_id, month, year),
      FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Schema ready');

    // Check if data already seeded
    const [[countRow]] = await conn.query('SELECT COUNT(*) as cnt FROM users');
    if (countRow.cnt > 0) {
      console.log('ℹ️  Seed data already present, skipping.');
      return;
    }

    console.log('🌱 Seeding demo data...');
    const pw = await bcrypt.hash('Password@123', 10);

    // Departments
    const depts = [
      [1, 'Computer Science', 'CS'],
      [2, 'Information Technology', 'IT'],
      [3, 'Electronics & Communication', 'EC'],
      [4, 'Mechanical Engineering', 'ME'],
    ];
    for (const d of depts) {
      await conn.query('INSERT IGNORE INTO departments (id,name,code) VALUES (?,?,?)', d);
    }

    // Users
    const users = [
      [1,'ADM001','Admin User','admin@college.edu',pw,'admin',1,'9000000001','System Administrator'],
      [2,'HOD001','Dr. Rajesh Kumar','hod.cs@college.edu',pw,'hod',1,'9000000002','Head of Department'],
      [3,'HOD002','Dr. Sunita Verma','hod.it@college.edu',pw,'hod',2,'9000000003','Head of Department'],
      [4,'FAC001','Prof. Amit Sharma','amit.sharma@college.edu',pw,'faculty',1,'9000000004','Assistant Professor'],
      [5,'FAC002','Prof. Priya Patel','priya.patel@college.edu',pw,'faculty',1,'9000000005','Associate Professor'],
      [6,'FAC003','Prof. Rahul Gupta','rahul.gupta@college.edu',pw,'faculty',1,'9000000006','Assistant Professor'],
      [7,'FAC004','Prof. Neha Singh','neha.singh@college.edu',pw,'faculty',1,'9000000007','Assistant Professor'],
      [8,'FAC005','Prof. Vikram Joshi','vikram.joshi@college.edu',pw,'faculty',2,'9000000008','Associate Professor'],
      [9,'FAC006','Prof. Anita Desai','anita.desai@college.edu',pw,'faculty',2,'9000000009','Assistant Professor'],
      [10,'FAC007','Prof. Suresh Nair','suresh.nair@college.edu',pw,'faculty',1,'9000000010','Assistant Professor'],
    ];
    for (const u of users) {
      await conn.query(
        'INSERT IGNORE INTO users (id,employee_id,name,email,password,role,department_id,phone,designation) VALUES (?,?,?,?,?,?,?,?,?)', u
      );
    }

    // Subjects
    const subjects = [
      [1,'Data Structures','CS301',1,3,4],
      [2,'Algorithms','CS302',1,3,4],
      [3,'Database Management Systems','CS401',1,4,4],
      [4,'Operating Systems','CS402',1,4,3],
      [5,'Computer Networks','CS501',1,5,3],
      [6,'Software Engineering','CS502',1,5,3],
      [7,'Machine Learning','CS601',1,6,4],
      [8,'Web Technologies','IT301',2,3,3],
      [9,'Cloud Computing','IT401',2,4,3],
      [10,'Cyber Security','IT501',2,5,3],
    ];
    for (const s of subjects) {
      await conn.query('INSERT IGNORE INTO subjects (id,name,code,department_id,semester,credits) VALUES (?,?,?,?,?,?)', s);
    }

    // Faculty-Subject mapping
    const fs = [
      [4,1,1],[4,2,1],[4,6,0],
      [5,3,1],[5,7,1],[5,2,0],
      [6,4,1],[6,5,1],[6,1,0],
      [7,6,1],[7,8,1],[7,3,0],
      [8,8,1],[8,9,1],[8,10,0],
      [9,9,1],[9,10,1],[9,8,0],
      [10,5,1],[10,7,1],[10,4,0],
      [2,1,0],[2,2,0],[2,3,0],
      [3,8,0],[3,9,0],
    ];
    for (const f of fs) {
      await conn.query('INSERT IGNORE INTO faculty_subjects (faculty_id,subject_id,is_primary) VALUES (?,?,?)', f);
    }

    // Timetable
    const tt = [
      [1,4,1,1,'Monday','09:00:00','10:00:00','CS-101',3],
      [2,4,2,1,'Monday','11:00:00','12:00:00','CS-101',3],
      [3,5,3,1,'Monday','10:00:00','11:00:00','CS-102',4],
      [4,6,4,1,'Monday','14:00:00','15:00:00','CS-103',4],
      [5,7,6,1,'Monday','15:00:00','16:00:00','CS-104',5],
      [6,4,1,1,'Tuesday','09:00:00','10:00:00','CS-101',3],
      [7,5,7,1,'Tuesday','10:00:00','11:00:00','CS-102',6],
      [8,6,5,1,'Tuesday','11:00:00','12:00:00','CS-103',5],
      [9,7,8,1,'Tuesday','14:00:00','15:00:00','CS-104',5],
      [10,10,5,1,'Tuesday','15:00:00','16:00:00','CS-105',5],
      [11,4,2,1,'Wednesday','09:00:00','10:00:00','CS-101',3],
      [12,5,3,1,'Wednesday','10:00:00','11:00:00','CS-102',4],
      [13,6,4,1,'Wednesday','11:00:00','12:00:00','CS-103',4],
      [14,10,7,1,'Wednesday','14:00:00','15:00:00','CS-105',6],
      [15,7,6,1,'Thursday','09:00:00','10:00:00','CS-104',5],
      [16,4,1,1,'Thursday','10:00:00','11:00:00','CS-101',3],
      [17,5,7,1,'Thursday','11:00:00','12:00:00','CS-102',6],
      [18,6,5,1,'Friday','09:00:00','10:00:00','CS-103',5],
      [19,4,2,1,'Friday','10:00:00','11:00:00','CS-101',3],
      [20,10,4,1,'Friday','11:00:00','12:00:00','CS-105',4],
      [21,8,8,2,'Monday','09:00:00','10:00:00','IT-101',3],
      [22,9,9,2,'Monday','10:00:00','11:00:00','IT-102',4],
      [23,8,9,2,'Wednesday','09:00:00','10:00:00','IT-101',4],
      [24,9,10,2,'Wednesday','10:00:00','11:00:00','IT-102',5],
    ];
    for (const t of tt) {
      await conn.query(
        'INSERT IGNORE INTO timetable (id,faculty_id,subject_id,department_id,day_of_week,start_time,end_time,room_number,semester) VALUES (?,?,?,?,?,?,?,?,?)', t
      );
    }

    // Historical leave requests
    const leaves = [
      [1,4,'sick','2024-10-05','2024-10-06',2,'Fever and cold','approved',2,'Approved. Get well soon.','2024-10-04 10:00:00','2024-10-03 18:00:00'],
      [2,5,'casual','2024-10-10','2024-10-10',1,'Personal work','approved',2,'Approved.','2024-10-09 11:00:00','2024-10-08 09:00:00'],
      [3,6,'earned','2024-10-15','2024-10-17',3,'Family function','rejected',2,'Insufficient staffing during exam period.','2024-10-14 14:00:00','2024-10-13 10:00:00'],
      [4,7,'sick','2024-11-01','2024-11-02',2,'Medical appointment','approved',2,'Approved.','2024-10-31 09:00:00','2024-10-30 17:00:00'],
      [5,4,'casual','2024-11-08','2024-11-08',1,'Bank work','approved',2,'Approved.','2024-11-07 10:00:00','2024-11-06 12:00:00'],
      [6,10,'emergency','2024-11-12','2024-11-13',2,'Family emergency','approved',2,'Approved.','2024-11-11 08:00:00','2024-11-11 07:30:00'],
      [7,5,'earned','2024-11-20','2024-11-22',3,'Travel plans','approved',2,'Approved.','2024-11-18 10:00:00','2024-11-17 15:00:00'],
      [8,6,'sick','2024-12-02','2024-12-03',2,'Viral infection','approved',2,'Approved.','2024-12-01 09:00:00','2024-11-30 20:00:00'],
      [9,7,'casual','2024-12-09','2024-12-09',1,'Personal work','rejected',2,'Exam period, not approved.','2024-12-08 10:00:00','2024-12-07 14:00:00'],
      [10,4,'sick','2025-01-06','2025-01-07',2,'Flu','approved',2,'Approved.','2025-01-05 09:00:00','2025-01-04 18:00:00'],
      [11,10,'casual','2025-01-15','2025-01-15',1,'Personal work','approved',2,'Approved.','2025-01-14 10:00:00','2025-01-13 11:00:00'],
      [12,5,'sick','2025-02-03','2025-02-04',2,'Migraine','approved',2,'Approved.','2025-02-02 09:00:00','2025-02-01 21:00:00'],
      [13,6,'casual','2025-02-14','2025-02-14',1,'Personal work','pending',null,null,null,'2025-02-13 10:00:00'],
      [14,4,'earned','2025-03-03','2025-03-05',3,'Vacation','pending',null,null,null,'2025-03-01 09:00:00'],
    ];
    for (const l of leaves) {
      await conn.query(
        'INSERT IGNORE INTO leave_requests (id,faculty_id,leave_type,start_date,end_date,total_days,reason,status,hod_id,hod_remarks,reviewed_at,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', l
      );
    }

    // Historical reassignments
    const reas = [
      [1,1,4,6,1,'2024-10-05','Saturday','09:00:00','10:00:00','CS-101','completed','auto'],
      [2,3,5,7,3,'2024-10-10','Thursday','10:00:00','11:00:00','CS-102','completed','auto'],
      [4,5,7,5,6,'2024-11-01','Friday','15:00:00','16:00:00','CS-104','completed','auto'],
      [5,2,4,5,2,'2024-11-08','Friday','11:00:00','12:00:00','CS-101','completed','auto'],
      [6,14,10,5,7,'2024-11-12','Tuesday','14:00:00','15:00:00','CS-105','completed','auto'],
      [7,7,5,10,7,'2024-11-20','Wednesday','10:00:00','11:00:00','CS-102','completed','auto'],
      [8,4,6,10,4,'2024-12-02','Monday','14:00:00','15:00:00','CS-103','completed','auto'],
      [10,1,4,6,1,'2025-01-06','Monday','09:00:00','10:00:00','CS-101','completed','auto'],
      [11,10,10,6,5,'2025-01-15','Wednesday','15:00:00','16:00:00','CS-105','completed','auto'],
      [12,3,5,7,3,'2025-02-03','Monday','10:00:00','11:00:00','CS-102','completed','auto'],
    ];
    for (const r of reas) {
      await conn.query(
        'INSERT IGNORE INTO lecture_reassignments (leave_request_id,timetable_id,original_faculty_id,substitute_faculty_id,subject_id,reassignment_date,day_of_week,start_time,end_time,room_number,status,assignment_method) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', r
      );
    }

    // Workload logs
    const wl = [
      [4,10,2024,2,20,10],[5,10,2024,1,15,10],[7,11,2024,1,16,10],
      [4,11,2024,1,20,10],[10,11,2024,2,12,10],[6,12,2024,0,18,10],
      [10,12,2024,1,12,10],[4,1,2025,2,20,10],[10,1,2025,1,12,10],
      [5,2,2025,1,15,10],[7,2,2025,1,16,10],
    ];
    for (const w of wl) {
      await conn.query(
        'INSERT IGNORE INTO workload_logs (faculty_id,month,year,substitution_count,regular_lectures,max_allowed_substitutions) VALUES (?,?,?,?,?,?)', w
      );
    }

    // Notifications
    const notifs = [
      [4,'Leave Approved','Your leave request for Oct 5-6 has been approved.','leave_approved',true,1,'leave_request'],
      [2,'New Leave Request','Prof. Amit Sharma applied for leave on Oct 5-6.','leave_applied',true,1,'leave_request'],
      [6,'Substitution Assigned','You are covering Data Structures on Oct 5.','substitution_assigned',true,1,'lecture_reassignment'],
      [5,'Leave Approved','Your leave request for Oct 10 has been approved.','leave_approved',true,2,'leave_request'],
      [7,'Substitution Assigned','You are covering DBMS on Oct 10.','substitution_assigned',true,2,'lecture_reassignment'],
      [6,'Leave Rejected','Your leave request for Oct 15-17 has been rejected.','leave_rejected',true,3,'leave_request'],
      [4,'Leave Pending','Your leave request for Mar 3-5 is awaiting HOD approval.','leave_applied',false,14,'leave_request'],
      [2,'Pending Review','Prof. Rahul Gupta has a pending leave request.','leave_applied',false,13,'leave_request'],
    ];
    for (const n of notifs) {
      await conn.query(
        'INSERT INTO notifications (user_id,title,message,type,is_read,related_id,related_type) VALUES (?,?,?,?,?,?,?)', n
      );
    }

    console.log('✅ Seed data inserted');
  } catch (err) {
    console.error('❌ DB init error:', err.message);
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = { initializeDatabase };
