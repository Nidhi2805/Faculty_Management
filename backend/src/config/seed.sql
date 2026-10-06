-- Seed Data for Faculty Leave Management System
USE faculty_leave_mgmt;

-- Clear existing data
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE workload_logs;
TRUNCATE TABLE notifications;
TRUNCATE TABLE lecture_reassignments;
TRUNCATE TABLE leave_requests;
TRUNCATE TABLE timetable;
TRUNCATE TABLE faculty_subjects;
TRUNCATE TABLE subjects;
TRUNCATE TABLE users;
TRUNCATE TABLE departments;
SET FOREIGN_KEY_CHECKS = 1;

-- Departments
INSERT INTO departments (id, name, code) VALUES
(1, 'Computer Science', 'CS'),
(2, 'Information Technology', 'IT'),
(3, 'Electronics & Communication', 'EC'),
(4, 'Mechanical Engineering', 'ME');

-- Users (password for all: Password@123)
-- bcrypt hash of 'Password@123'
INSERT INTO users (id, employee_id, name, email, password, role, department_id, phone, designation) VALUES
(1, 'ADM001', 'Admin User', 'admin@college.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1, '9000000001', 'System Administrator'),
(2, 'HOD001', 'Dr. Rajesh Kumar', 'hod.cs@college.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'hod', 1, '9000000002', 'Head of Department'),
(3, 'HOD002', 'Dr. Sunita Verma', 'hod.it@college.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'hod', 2, '9000000003', 'Head of Department'),
(4, 'FAC001', 'Prof. Amit Sharma', 'amit.sharma@college.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'faculty', 1, '9000000004', 'Assistant Professor'),
(5, 'FAC002', 'Prof. Priya Patel', 'priya.patel@college.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'faculty', 1, '9000000005', 'Associate Professor'),
(6, 'FAC003', 'Prof. Rahul Gupta', 'rahul.gupta@college.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'faculty', 1, '9000000006', 'Assistant Professor'),
(7, 'FAC004', 'Prof. Neha Singh', 'neha.singh@college.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'faculty', 1, '9000000007', 'Assistant Professor'),
(8, 'FAC005', 'Prof. Vikram Joshi', 'vikram.joshi@college.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'faculty', 2, '9000000008', 'Associate Professor'),
(9, 'FAC006', 'Prof. Anita Desai', 'anita.desai@college.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'faculty', 2, '9000000009', 'Assistant Professor'),
(10, 'FAC007', 'Prof. Suresh Nair', 'suresh.nair@college.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'faculty', 1, '9000000010', 'Assistant Professor');

-- Subjects
INSERT INTO subjects (id, name, code, department_id, semester, credits) VALUES
(1, 'Data Structures', 'CS301', 1, 3, 4),
(2, 'Algorithms', 'CS302', 1, 3, 4),
(3, 'Database Management Systems', 'CS401', 1, 4, 4),
(4, 'Operating Systems', 'CS402', 1, 4, 3),
(5, 'Computer Networks', 'CS501', 1, 5, 3),
(6, 'Software Engineering', 'CS502', 1, 5, 3),
(7, 'Machine Learning', 'CS601', 1, 6, 4),
(8, 'Web Technologies', 'IT301', 2, 3, 3),
(9, 'Cloud Computing', 'IT401', 2, 4, 3),
(10, 'Cyber Security', 'IT501', 2, 5, 3);

-- Faculty-Subject Mapping
INSERT INTO faculty_subjects (faculty_id, subject_id, is_primary) VALUES
(4, 1, TRUE), (4, 2, TRUE), (4, 6, FALSE),
(5, 3, TRUE), (5, 7, TRUE), (5, 2, FALSE),
(6, 4, TRUE), (6, 5, TRUE), (6, 1, FALSE),
(7, 6, TRUE), (7, 8, TRUE), (7, 3, FALSE),
(8, 8, TRUE), (8, 9, TRUE), (8, 10, FALSE),
(9, 9, TRUE), (9, 10, TRUE), (9, 8, FALSE),
(10, 5, TRUE), (10, 7, TRUE), (10, 4, FALSE),
(2, 1, FALSE), (2, 2, FALSE), (2, 3, FALSE),
(3, 8, FALSE), (3, 9, FALSE);

-- Timetable
INSERT INTO timetable (id, faculty_id, subject_id, department_id, day_of_week, start_time, end_time, room_number, semester, academic_year) VALUES
(1, 4, 1, 1, 'Monday', '09:00:00', '10:00:00', 'CS-101', 3, '2024-25'),
(2, 4, 2, 1, 'Monday', '11:00:00', '12:00:00', 'CS-101', 3, '2024-25'),
(3, 5, 3, 1, 'Monday', '10:00:00', '11:00:00', 'CS-102', 4, '2024-25'),
(4, 6, 4, 1, 'Monday', '14:00:00', '15:00:00', 'CS-103', 4, '2024-25'),
(5, 7, 6, 1, 'Monday', '15:00:00', '16:00:00', 'CS-104', 5, '2024-25'),
(6, 4, 1, 1, 'Tuesday', '09:00:00', '10:00:00', 'CS-101', 3, '2024-25'),
(7, 5, 7, 1, 'Tuesday', '10:00:00', '11:00:00', 'CS-102', 6, '2024-25'),
(8, 6, 5, 1, 'Tuesday', '11:00:00', '12:00:00', 'CS-103', 5, '2024-25'),
(9, 7, 8, 1, 'Tuesday', '14:00:00', '15:00:00', 'CS-104', 5, '2024-25'),
(10, 10, 5, 1, 'Tuesday', '15:00:00', '16:00:00', 'CS-105', 5, '2024-25'),
(11, 4, 2, 1, 'Wednesday', '09:00:00', '10:00:00', 'CS-101', 3, '2024-25'),
(12, 5, 3, 1, 'Wednesday', '10:00:00', '11:00:00', 'CS-102', 4, '2024-25'),
(13, 6, 4, 1, 'Wednesday', '11:00:00', '12:00:00', 'CS-103', 4, '2024-25'),
(14, 10, 7, 1, 'Wednesday', '14:00:00', '15:00:00', 'CS-105', 6, '2024-25'),
(15, 7, 6, 1, 'Thursday', '09:00:00', '10:00:00', 'CS-104', 5, '2024-25'),
(16, 4, 1, 1, 'Thursday', '10:00:00', '11:00:00', 'CS-101', 3, '2024-25'),
(17, 5, 7, 1, 'Thursday', '11:00:00', '12:00:00', 'CS-102', 6, '2024-25'),
(18, 6, 5, 1, 'Friday', '09:00:00', '10:00:00', 'CS-103', 5, '2024-25'),
(19, 4, 2, 1, 'Friday', '10:00:00', '11:00:00', 'CS-101', 3, '2024-25'),
(20, 10, 4, 1, 'Friday', '11:00:00', '12:00:00', 'CS-105', 4, '2024-25'),
(21, 8, 8, 2, 'Monday', '09:00:00', '10:00:00', 'IT-101', 3, '2024-25'),
(22, 9, 9, 2, 'Monday', '10:00:00', '11:00:00', 'IT-102', 4, '2024-25'),
(23, 8, 9, 2, 'Wednesday', '09:00:00', '10:00:00', 'IT-101', 4, '2024-25'),
(24, 9, 10, 2, 'Wednesday', '10:00:00', '11:00:00', 'IT-102', 5, '2024-25');

-- Leave Requests (historical data for analytics)
INSERT INTO leave_requests (id, faculty_id, leave_type, start_date, end_date, total_days, reason, status, hod_id, hod_remarks, reviewed_at, created_at) VALUES
(1, 4, 'sick', '2024-10-05', '2024-10-06', 2, 'Fever and cold', 'approved', 2, 'Approved. Get well soon.', '2024-10-04 10:00:00', '2024-10-03 18:00:00'),
(2, 5, 'casual', '2024-10-10', '2024-10-10', 1, 'Personal work', 'approved', 2, 'Approved.', '2024-10-09 11:00:00', '2024-10-08 09:00:00'),
(3, 6, 'earned', '2024-10-15', '2024-10-17', 3, 'Family function', 'rejected', 2, 'Insufficient staffing during exam period.', '2024-10-14 14:00:00', '2024-10-13 10:00:00'),
(4, 7, 'sick', '2024-11-01', '2024-11-02', 2, 'Medical appointment', 'approved', 2, 'Approved.', '2024-10-31 09:00:00', '2024-10-30 17:00:00'),
(5, 4, 'casual', '2024-11-08', '2024-11-08', 1, 'Bank work', 'approved', 2, 'Approved.', '2024-11-07 10:00:00', '2024-11-06 12:00:00'),
(6, 10, 'emergency', '2024-11-12', '2024-11-13', 2, 'Family emergency', 'approved', 2, 'Approved with sympathy.', '2024-11-11 08:00:00', '2024-11-11 07:30:00'),
(7, 5, 'earned', '2024-11-20', '2024-11-22', 3, 'Travel plans', 'approved', 2, 'Approved.', '2024-11-18 10:00:00', '2024-11-17 15:00:00'),
(8, 6, 'sick', '2024-12-02', '2024-12-03', 2, 'Viral infection', 'approved', 2, 'Approved.', '2024-12-01 09:00:00', '2024-11-30 20:00:00'),
(9, 7, 'casual', '2024-12-09', '2024-12-09', 1, 'Personal work', 'rejected', 2, 'Exam period, not approved.', '2024-12-08 10:00:00', '2024-12-07 14:00:00'),
(10, 4, 'sick', '2025-01-06', '2025-01-07', 2, 'Flu', 'approved', 2, 'Approved.', '2025-01-05 09:00:00', '2025-01-04 18:00:00'),
(11, 10, 'casual', '2025-01-15', '2025-01-15', 1, 'Personal work', 'approved', 2, 'Approved.', '2025-01-14 10:00:00', '2025-01-13 11:00:00'),
(12, 5, 'sick', '2025-02-03', '2025-02-04', 2, 'Migraine', 'approved', 2, 'Approved.', '2025-02-02 09:00:00', '2025-02-01 21:00:00'),
(13, 6, 'casual', '2025-02-14', '2025-02-14', 1, 'Personal work', 'pending', NULL, NULL, NULL, '2025-02-13 10:00:00'),
(14, 4, 'earned', '2025-03-03', '2025-03-05', 3, 'Vacation', 'pending', NULL, NULL, NULL, '2025-03-01 09:00:00');

-- Lecture Reassignments (historical)
INSERT INTO lecture_reassignments (leave_request_id, timetable_id, original_faculty_id, substitute_faculty_id, subject_id, reassignment_date, day_of_week, start_time, end_time, room_number, status, assignment_method) VALUES
(1, 1, 4, 6, 1, '2024-10-05', 'Saturday', '09:00:00', '10:00:00', 'CS-101', 'completed', 'auto'),
(1, 6, 4, 10, 1, '2024-10-06', 'Sunday', '09:00:00', '10:00:00', 'CS-101', 'completed', 'auto'),
(2, 3, 5, 7, 3, '2024-10-10', 'Thursday', '10:00:00', '11:00:00', 'CS-102', 'completed', 'auto'),
(4, 5, 7, 5, 6, '2024-11-01', 'Friday', '15:00:00', '16:00:00', 'CS-104', 'completed', 'auto'),
(4, 15, 7, 4, 6, '2024-11-02', 'Saturday', '09:00:00', '10:00:00', 'CS-104', 'completed', 'manual'),
(5, 2, 4, 5, 2, '2024-11-08', 'Friday', '11:00:00', '12:00:00', 'CS-101', 'completed', 'auto'),
(6, 14, 10, 5, 7, '2024-11-12', 'Tuesday', '14:00:00', '15:00:00', 'CS-105', 'completed', 'auto'),
(7, 7, 5, 10, 7, '2024-11-20', 'Wednesday', '10:00:00', '11:00:00', 'CS-102', 'completed', 'auto'),
(8, 4, 6, 10, 4, '2024-12-02', 'Monday', '14:00:00', '15:00:00', 'CS-103', 'completed', 'auto'),
(10, 1, 4, 6, 1, '2025-01-06', 'Monday', '09:00:00', '10:00:00', 'CS-101', 'completed', 'auto'),
(11, 10, 10, 6, 5, '2025-01-15', 'Wednesday', '15:00:00', '16:00:00', 'CS-105', 'completed', 'auto'),
(12, 3, 5, 7, 3, '2025-02-03', 'Monday', '10:00:00', '11:00:00', 'CS-102', 'completed', 'auto');

-- Workload Logs
INSERT INTO workload_logs (faculty_id, month, year, substitution_count, regular_lectures, max_allowed_substitutions) VALUES
(4, 10, 2024, 2, 20, 10), (5, 10, 2024, 1, 15, 10), (6, 10, 2024, 0, 18, 10),
(7, 11, 2024, 1, 16, 10), (4, 11, 2024, 1, 20, 10), (10, 11, 2024, 2, 12, 10),
(5, 11, 2024, 0, 15, 10), (10, 11, 2024, 1, 12, 10),
(6, 12, 2024, 0, 18, 10), (10, 12, 2024, 1, 12, 10),
(4, 1, 2025, 2, 20, 10), (10, 1, 2025, 1, 12, 10),
(5, 2, 2025, 1, 15, 10), (7, 2, 2025, 1, 16, 10);

-- Notifications
INSERT INTO notifications (user_id, title, message, type, is_read, related_id, related_type) VALUES
(4, 'Leave Approved', 'Your leave request for Oct 5-6 has been approved.', 'leave_approved', TRUE, 1, 'leave_request'),
(2, 'Leave Request Received', 'Prof. Amit Sharma has applied for leave on Oct 5-6.', 'leave_applied', TRUE, 1, 'leave_request'),
(6, 'Substitution Assigned', 'You have been assigned to cover Data Structures on Oct 5.', 'substitution_assigned', TRUE, 1, 'lecture_reassignment'),
(5, 'Leave Approved', 'Your leave request for Oct 10 has been approved.', 'leave_approved', TRUE, 2, 'leave_request'),
(7, 'Substitution Assigned', 'You have been assigned to cover DBMS on Oct 10.', 'substitution_assigned', TRUE, 2, 'lecture_reassignment'),
(6, 'Leave Rejected', 'Your leave request for Oct 15-17 has been rejected.', 'leave_rejected', TRUE, 3, 'leave_request'),
(4, 'New Leave Request', 'Prof. Amit Sharma applied for leave - pending approval.', 'leave_applied', FALSE, 14, 'leave_request'),
(2, 'Pending Leave Request', 'Prof. Rahul Gupta has a pending leave request for review.', 'leave_applied', FALSE, 13, 'leave_request');
