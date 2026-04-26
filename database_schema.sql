-- ====================================
-- СОЗДАНИЕ БАЗЫ ДАННЫХ "УНИВЕРСИТЕТ"
-- ====================================

-- Удаление таблиц если они существуют
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS grades;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS teachers;
DROP TABLE IF EXISTS departments;

-- Таблица: Факультеты
CREATE TABLE departments (
    department_id INT PRIMARY KEY AUTO_INCREMENT,
    department_name VARCHAR(100) NOT NULL,
    building VARCHAR(50),
    budget DECIMAL(12, 2)
);

-- Таблица: Преподаватели
CREATE TABLE teachers (
    teacher_id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    department_id INT,
    hire_date DATE,
    salary DECIMAL(10, 2),
    email VARCHAR(100),
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
);

-- Таблица: Студенты
CREATE TABLE students (
    student_id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE,
    department_id INT,
    enrollment_year INT,
    email VARCHAR(100),
    phone VARCHAR(20),
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
);

-- Таблица: Курсы
CREATE TABLE courses (
    course_id INT PRIMARY KEY AUTO_INCREMENT,
    course_name VARCHAR(100) NOT NULL,
    teacher_id INT,
    department_id INT,
    credits INT,
    semester INT,
    max_students INT,
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id),
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
);

-- Таблица: Записи на курсы
CREATE TABLE enrollments (
    enrollment_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT,
    course_id INT,
    enrollment_date DATE,
    status VARCHAR(20), -- 'active', 'completed', 'dropped'
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
);

-- Таблица: Оценки
CREATE TABLE grades (
    grade_id INT PRIMARY KEY AUTO_INCREMENT,
    enrollment_id INT,
    grade_value DECIMAL(4, 2), -- оценка от 0 до 100
    grade_date DATE,
    exam_type VARCHAR(50), -- 'midterm', 'final', 'assignment'
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(enrollment_id)
);
