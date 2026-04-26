-- ====================================
-- ЗАДАНИЯ ПРОДВИНУТОГО УРОВНЯ
-- ====================================

-- ЗАДАНИЕ 1: Сложный подзапрос с агрегацией
-- Условие: Найдите студентов, чья средняя оценка выше средней оценки по всему университету.
-- Сложность: ★★★★☆

-- Решение:
SELECT s.first_name, s.last_name, AVG(g.grade_value) AS avg_grade
FROM students s
INNER JOIN enrollments e ON s.student_id = e.student_id
INNER JOIN grades g ON e.enrollment_id = g.enrollment_id
GROUP BY s.student_id, s.first_name, s.last_name
HAVING AVG(g.grade_value) > (
    SELECT AVG(grade_value)
    FROM grades
)
ORDER BY avg_grade DESC 


-- ЗАДАНИЕ 2: Ранжирование с использованием оконных функций
-- Условие: Присвойте ранг каждому студенту на основе их средней оценки (лучший студент = ранг 1).
-- Сложность: ★★★★☆

-- Решение:
SELECT s.first_name, s.last_name, AVG(g.grade_value) AS avg_grade,
       RANK() OVER (ORDER BY AVG(g.grade_value) DESC) AS student_rank
FROM students s
INNER JOIN enrollments e ON s.student_id = e.student_id
INNER JOIN grades g ON e.enrollment_id = g.enrollment_id
GROUP BY s.student_id, s.first_name, s.last_name
ORDER BY student_rank 


-- ЗАДАНИЕ 3: Коррелированный подзапрос
-- Условие: Для каждого факультета найдите студента с самой высокой средней оценкой.
-- Сложность: ★★★★☆

-- Решение:
SELECT d.department_name, s.first_name, s.last_name, 
       (SELECT AVG(g.grade_value)
        FROM enrollments e
        INNER JOIN grades g ON e.enrollment_id = g.enrollment_id
        WHERE e.student_id = s.student_id) AS avg_grade
FROM students s
INNER JOIN departments d ON s.department_id = d.department_id
WHERE (SELECT AVG(g.grade_value)
       FROM enrollments e
       INNER JOIN grades g ON e.enrollment_id = g.enrollment_id
       WHERE e.student_id = s.student_id) = (
    SELECT MAX(avg_grades.avg_grade)
    FROM (
        SELECT s2.student_id, AVG(g2.grade_value) AS avg_grade
        FROM students s2
        INNER JOIN enrollments e2 ON s2.student_id = e2.student_id
        INNER JOIN grades g2 ON e2.enrollment_id = g2.enrollment_id
        WHERE s2.department_id = s.department_id
        GROUP BY s2.student_id
    ) AS avg_grades
) 


-- ЗАДАНИЕ 4: Рекурсивный запрос (CTE)
-- Условие: Создайте иерархию курсов по семестрам (от 1 до максимального).
-- Сложность: ★★★★☆

-- Решение:
WITH RECURSIVE semester_hierarchy AS (
    SELECT 1 AS semester_num
    UNION ALL
    SELECT semester_num + 1
    FROM semester_hierarchy
    WHERE semester_num < (SELECT MAX(semester) FROM courses)
)
SELECT sh.semester_num, COUNT(c.course_id) AS course_count
FROM semester_hierarchy sh
LEFT JOIN courses c ON sh.semester_num = c.semester
GROUP BY sh.semester_num
ORDER BY sh.semester_num 


-- ЗАДАНИЕ 5: Сложная аналитика с несколькими CTE
-- Условие: Найдите топ-3 курса с наибольшим количеством записей и их среднюю оценку.
-- Сложность: ★★★★☆

-- Решение:
WITH course_enrollments AS (
    SELECT c.course_id, c.course_name, COUNT(e.enrollment_id) AS enrollment_count
    FROM courses c
    LEFT JOIN enrollments e ON c.course_id = e.course_id
    GROUP BY c.course_id, c.course_name
),
course_grades AS (
    SELECT c.course_id, AVG(g.grade_value) AS avg_grade
    FROM courses c
    INNER JOIN enrollments e ON c.course_id = e.course_id
    INNER JOIN grades g ON e.enrollment_id = g.enrollment_id
    GROUP BY c.course_id
)
SELECT ce.course_name, ce.enrollment_count, COALESCE(cg.avg_grade, 0) AS avg_grade
FROM course_enrollments ce
LEFT JOIN course_grades cg ON ce.course_id = cg.course_id
ORDER BY ce.enrollment_count DESC
LIMIT 3 


-- ЗАДАНИЕ 6: Pivot-таблица (динамическая сводка)
-- Условие: Создайте сводную таблицу, показывающую количество студентов по факультетам и годам поступления.
-- Сложность: ★★★★☆

-- Решение:
SELECT d.department_name,
       SUM(CASE WHEN s.enrollment_year = 2020 THEN 1 ELSE 0 END) AS year_2020,
       SUM(CASE WHEN s.enrollment_year = 2021 THEN 1 ELSE 0 END) AS year_2021,
       SUM(CASE WHEN s.enrollment_year = 2022 THEN 1 ELSE 0 END) AS year_2022,
       COUNT(s.student_id) AS total
FROM departments d
LEFT JOIN students s ON d.department_id = s.department_id
GROUP BY d.department_name
ORDER BY total DESC 


-- ЗАДАНИЕ 7: Анализ динамики оценок
-- Условие: Для каждого студента найдите разницу между его первой и последней оценкой (прогресс).
-- Сложность: ★★★★★

-- Решение:
WITH student_grades AS (
    SELECT s.student_id, s.first_name, s.last_name,
           g.grade_value, g.grade_date,
           ROW_NUMBER() OVER (PARTITION BY s.student_id ORDER BY g.grade_date ASC) AS first_grade_rank,
           ROW_NUMBER() OVER (PARTITION BY s.student_id ORDER BY g.grade_date DESC) AS last_grade_rank
    FROM students s
    INNER JOIN enrollments e ON s.student_id = e.student_id
    INNER JOIN grades g ON e.enrollment_id = g.enrollment_id
),
first_grades AS (
    SELECT student_id, grade_value AS first_grade
    FROM student_grades
    WHERE first_grade_rank = 1
),
last_grades AS (
    SELECT student_id, grade_value AS last_grade
    FROM student_grades
    WHERE last_grade_rank = 1
)
SELECT s.first_name, s.last_name, 
       fg.first_grade, lg.last_grade,
       (lg.last_grade - fg.first_grade) AS progress
FROM students s
INNER JOIN first_grades fg ON s.student_id = fg.student_id
INNER JOIN last_grades lg ON s.student_id = lg.student_id
ORDER BY progress DESC 


-- ЗАДАНИЕ 8: Сложная фильтрация с EXISTS
-- Условие: Найдите преподавателей, которые ведут курсы, на которые записаны студенты со средней оценкой выше 85.
-- Сложность: ★★★★☆

-- Решение:
SELECT DISTINCT t.first_name, t.last_name, t.email
FROM teachers t
WHERE EXISTS (
    SELECT 1
    FROM courses c
    INNER JOIN enrollments e ON c.course_id = e.course_id
    INNER JOIN (
        SELECT e2.student_id, AVG(g.grade_value) AS avg_grade
        FROM enrollments e2
        INNER JOIN grades g ON e2.enrollment_id = g.enrollment_id
        GROUP BY e2.student_id
        HAVING AVG(g.grade_value) > 85
    ) AS top_students ON e.student_id = top_students.student_id
    WHERE c.teacher_id = t.teacher_id
) 


-- ЗАДАНИЕ 9: Анализ загруженности курсов
-- Условие: Найдите курсы, которые заполнены более чем на 80% от максимального количества студентов.
-- Сложность: ★★★★☆

-- Решение:
SELECT c.course_name, c.max_students, 
       COUNT(e.enrollment_id) AS current_students,
       ROUND((COUNT(e.enrollment_id) * 100.0 / c.max_students), 2) AS fill_percentage
FROM courses c
LEFT JOIN enrollments e ON c.course_id = e.course_id AND e.status = 'active'
GROUP BY c.course_id, c.course_name, c.max_students
HAVING (COUNT(e.enrollment_id) * 100.0 / c.max_students) > 80
ORDER BY fill_percentage DESC 


-- ЗАДАНИЕ 10: Сложная статистика по факультетам
-- Условие: Для каждого факультета рассчитайте: количество студентов, количество преподавателей, 
--          среднюю зарплату преподавателей, среднюю оценку студентов и соотношение студентов к преподавателям.
-- Сложность: ★★★★★

-- Решение:
WITH dept_students AS (
    SELECT d.department_id, d.department_name, COUNT(s.student_id) AS student_count
    FROM departments d
    LEFT JOIN students s ON d.department_id = s.department_id
    GROUP BY d.department_id, d.department_name
),
dept_teachers AS (
    SELECT d.department_id, COUNT(t.teacher_id) AS teacher_count, AVG(t.salary) AS avg_salary
    FROM departments d
    LEFT JOIN teachers t ON d.department_id = t.department_id
    GROUP BY d.department_id
),
dept_grades AS (
    SELECT s.department_id, AVG(g.grade_value) AS avg_grade
    FROM students s
    INNER JOIN enrollments e ON s.student_id = e.student_id
    INNER JOIN grades g ON e.enrollment_id = g.enrollment_id
    GROUP BY s.department_id
)
SELECT ds.department_name,
       ds.student_count,
       dt.teacher_count,
       ROUND(dt.avg_salary, 2) AS avg_teacher_salary,
       ROUND(dg.avg_grade, 2) AS avg_student_grade,
       ROUND(ds.student_count * 1.0 / NULLIF(dt.teacher_count, 0), 2) AS student_teacher_ratio
FROM dept_students ds
LEFT JOIN dept_teachers dt ON ds.department_id = dt.department_id
LEFT JOIN dept_grades dg ON ds.department_id = dg.department_id
ORDER BY student_teacher_ratio DESC 


-- ЗАДАНИЕ 11: Поиск аномалий в данных
-- Условие: Найдите студентов, у которых есть оценки по курсам, на которые они не записаны (проверка целостности данных).
-- Сложность: ★★★★☆

-- Решение:
SELECT DISTINCT s.first_name, s.last_name, c.course_name
FROM students s
CROSS JOIN courses c
WHERE EXISTS (
    SELECT 1
    FROM grades g
    INNER JOIN enrollments e ON g.enrollment_id = e.enrollment_id
    WHERE e.student_id = s.student_id AND e.course_id = c.course_id
)
AND NOT EXISTS (
    SELECT 1
    FROM enrollments e2
    WHERE e2.student_id = s.student_id AND e2.course_id = c.course_id
) 


-- ЗАДАНИЕ 12: Временной анализ с LAG/LEAD
-- Условие: Для каждой оценки студента покажите предыдущую и следующую оценку с датами.
-- Сложность: ★★★★★

-- Решение:
SELECT s.first_name, s.last_name, c.course_name,
       g.grade_value AS current_grade,
       g.grade_date AS current_date,
       LAG(g.grade_value) OVER (PARTITION BY s.student_id ORDER BY g.grade_date) AS previous_grade,
       LAG(g.grade_date) OVER (PARTITION BY s.student_id ORDER BY g.grade_date) AS previous_date,
       LEAD(g.grade_value) OVER (PARTITION BY s.student_id ORDER BY g.grade_date) AS next_grade,
       LEAD(g.grade_date) OVER (PARTITION BY s.student_id ORDER BY g.grade_date) AS next_date
FROM students s
INNER JOIN enrollments e ON s.student_id = e.student_id
INNER JOIN courses c ON e.course_id = c.course_id
INNER JOIN grades g ON e.enrollment_id = g.enrollment_id
ORDER BY s.student_id, g.grade_date 


-- ЗАДАНИЕ 13: Сложный анализ успеваемости
-- Условие: Найдите студентов, которые показали улучшение оценок (каждая следующая оценка выше предыдущей).
-- Сложность: ★★★★★

-- Решение:
WITH grade_comparison AS (
    SELECT s.student_id, s.first_name, s.last_name,
           g.grade_value,
           LAG(g.grade_value) OVER (PARTITION BY s.student_id ORDER BY g.grade_date) AS prev_grade
    FROM students s
    INNER JOIN enrollments e ON s.student_id = e.student_id
    INNER JOIN grades g ON e.enrollment_id = g.enrollment_id
),
improvement_check AS (
    SELECT student_id, first_name, last_name,
           COUNT(*) AS total_grades,
           SUM(CASE WHEN prev_grade IS NOT NULL AND grade_value > prev_grade THEN 1 ELSE 0 END) AS improvements,
           SUM(CASE WHEN prev_grade IS NOT NULL THEN 1 ELSE 0 END) AS comparable_grades
    FROM grade_comparison
    GROUP BY student_id, first_name, last_name
)
SELECT first_name, last_name, total_grades, improvements, comparable_grades
FROM improvement_check
WHERE improvements = comparable_grades AND comparable_grades > 0
ORDER BY total_grades DESC 


-- ЗАДАНИЕ 14: Комплексный отчет по эффективности преподавателей
-- Условие: Создайте отчет, показывающий для каждого преподавателя: количество курсов, 
--          количество студентов, среднюю оценку студентов и процент успешно завершенных курсов.
-- Сложность: ★★★★★

-- Решение:
WITH teacher_courses AS (
    SELECT t.teacher_id, t.first_name, t.last_name, COUNT(c.course_id) AS course_count
    FROM teachers t
    LEFT JOIN courses c ON t.teacher_id = c.teacher_id
    GROUP BY t.teacher_id, t.first_name, t.last_name
),
teacher_students AS (
    SELECT t.teacher_id, COUNT(DISTINCT e.student_id) AS student_count
    FROM teachers t
    LEFT JOIN courses c ON t.teacher_id = c.teacher_id
    LEFT JOIN enrollments e ON c.course_id = e.course_id
    GROUP BY t.teacher_id
),
teacher_grades AS (
    SELECT t.teacher_id, AVG(g.grade_value) AS avg_grade
    FROM teachers t
    INNER JOIN courses c ON t.teacher_id = c.teacher_id
    INNER JOIN enrollments e ON c.course_id = e.course_id
    INNER JOIN grades g ON e.enrollment_id = g.enrollment_id
    GROUP BY t.teacher_id
),
teacher_completion AS (
    SELECT t.teacher_id,
           SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) AS completed_enrollments,
           COUNT(e.enrollment_id) AS total_enrollments
    FROM teachers t
    LEFT JOIN courses c ON t.teacher_id = c.teacher_id
    LEFT JOIN enrollments e ON c.course_id = e.course_id
    GROUP BY t.teacher_id
)
SELECT tc.first_name, tc.last_name,
       tc.course_count,
       ts.student_count,
       ROUND(COALESCE(tg.avg_grade, 0), 2) AS avg_student_grade,
       ROUND((tcomp.completed_enrollments * 100.0 / NULLIF(tcomp.total_enrollments, 0)), 2) AS completion_rate
FROM teacher_courses tc
LEFT JOIN teacher_students ts ON tc.teacher_id = ts.teacher_id
LEFT JOIN teacher_grades tg ON tc.teacher_id = tg.teacher_id
LEFT JOIN teacher_completion tcomp ON tc.teacher_id = tcomp.teacher_id
ORDER BY avg_student_grade DESC 


-- ЗАДАНИЕ 15: Прогнозирование и анализ трендов
-- Условие: Определите тренд изменения среднего балла по семестрам для каждого факультета.
-- Сложность: ★★★★★

-- Решение:
WITH semester_grades AS (
    SELECT d.department_id, d.department_name, c.semester,
           AVG(g.grade_value) AS avg_grade
    FROM departments d
    INNER JOIN courses c ON d.department_id = c.department_id
    INNER JOIN enrollments e ON c.course_id = e.course_id
    INNER JOIN grades g ON e.enrollment_id = g.enrollment_id
    GROUP BY d.department_id, d.department_name, c.semester
),
semester_trends AS (
    SELECT department_name, semester, avg_grade,
           LAG(avg_grade) OVER (PARTITION BY department_id ORDER BY semester) AS prev_semester_grade,
           LEAD(avg_grade) OVER (PARTITION BY department_id ORDER BY semester) AS next_semester_grade
    FROM semester_grades
)
SELECT department_name, semester, 
       ROUND(avg_grade, 2) AS current_avg,
       ROUND(prev_semester_grade, 2) AS previous_avg,
       ROUND((avg_grade - prev_semester_grade), 2) AS grade_change,
       CASE
           WHEN avg_grade > prev_semester_grade THEN 'Улучшение'
           WHEN avg_grade < prev_semester_grade THEN 'Ухудшение'
           ELSE 'Стабильно'
       END AS trend
FROM semester_trends
WHERE prev_semester_grade IS NOT NULL
ORDER BY department_name, semester 
