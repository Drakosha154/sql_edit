-- ====================================
-- ЗАДАНИЯ СРЕДНЕГО УРОВНЯ
-- ====================================

-- ЗАДАНИЕ 1: Простое соединение таблиц (INNER JOIN)
-- Условие: Получите список всех студентов с названиями их факультетов.
-- Сложность: ★★☆☆☆

-- Решение:
SELECT s.first_name, s.last_name, d.department_name
FROM students s
INNER JOIN departments d ON s.department_id = d.department_id 


-- ЗАДАНИЕ 2: JOIN с фильтрацией
-- Условие: Найдите всех преподавателей факультета "Информатика" с их зарплатами.
-- Сложность: ★★☆☆☆

-- Решение:
SELECT t.first_name, t.last_name, t.salary, d.department_name
FROM teachers t
INNER JOIN departments d ON t.department_id = d.department_id
WHERE d.department_name = 'Информатика' 


-- ЗАДАНИЕ 3: Агрегация с HAVING
-- Условие: Найдите факультеты, на которых учится более 2 студентов.
-- Сложность: ★★☆☆☆

-- Решение:
SELECT d.department_name, COUNT(s.student_id) AS student_count
FROM departments d
INNER JOIN students s ON d.department_id = s.department_id
GROUP BY d.department_name
HAVING COUNT(s.student_id) > 2 


-- ЗАДАНИЕ 4: Вычисление средних значений
-- Условие: Найдите среднюю зарплату преподавателей на каждом факультете.
-- Сложность: ★★☆☆☆

-- Решение:
SELECT d.department_name, AVG(t.salary) AS avg_salary
FROM departments d
INNER JOIN teachers t ON d.department_id = t.department_id
GROUP BY d.department_name
ORDER BY avg_salary DESC 


-- ЗАДАНИЕ 5: Множественные JOIN
-- Условие: Получите список всех записей на курсы с именами студентов и названиями курсов.
-- Сложность: ★★★☆☆

-- Решение:
SELECT s.first_name, s.last_name, c.course_name, e.status
FROM enrollments e
INNER JOIN students s ON e.student_id = s.student_id
INNER JOIN courses c ON e.course_id = c.course_id 


-- ЗАДАНИЕ 6: Подзапрос в WHERE
-- Условие: Найдите всех студентов, которые учатся на факультете с самым большим бюджетом.
-- Сложность: ★★★☆☆

-- Решение:
SELECT first_name, last_name
FROM students
WHERE department_id = (
    SELECT department_id
    FROM departments
    ORDER BY budget DESC
    LIMIT 1
) 


-- ЗАДАНИЕ 7: Агрегация с несколькими таблицами
-- Условие: Подсчитайте количество курсов, которые ведет каждый преподаватель.
-- Сложность: ★★☆☆☆

-- Решение:
SELECT t.first_name, t.last_name, COUNT(c.course_id) AS course_count
FROM teachers t
LEFT JOIN courses c ON t.teacher_id = c.teacher_id
GROUP BY t.teacher_id, t.first_name, t.last_name
ORDER BY course_count DESC 


-- ЗАДАНИЕ 8: Работа с датами и вычисления
-- Условие: Найдите возраст каждого студента (в годах) на текущую дату.
-- Сложность: ★★☆☆☆

-- Решение:
SELECT first_name, last_name, date_of_birth,
       TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) AS age
FROM students
ORDER BY age DESC 


-- ЗАДАНИЕ 9: Сложная фильтрация с несколькими условиями
-- Условие: Найдите все активные записи на курсы для студентов, поступивших в 2021 году или позже.
-- Сложность: ★★★☆☆

-- Решение:
SELECT s.first_name, s.last_name, s.enrollment_year, c.course_name
FROM enrollments e
INNER JOIN students s ON e.student_id = s.student_id
INNER JOIN courses c ON e.course_id = c.course_id
WHERE e.status = 'active' AND s.enrollment_year >= 2021 


-- ЗАДАНИЕ 10: Использование CASE для категоризации
-- Условие: Классифицируйте курсы по сложности: "Легкий" (2 кредита), "Средний" (3 кредита), "Сложный" (4+ кредита).
-- Сложность: ★★★☆☆

-- Решение:
SELECT course_name, credits,
       CASE
           WHEN credits = 2 THEN 'Легкий'
           WHEN credits = 3 THEN 'Средний'
           WHEN credits >= 4 THEN 'Сложный'
       END AS difficulty
FROM courses
ORDER BY credits 


-- ЗАДАНИЕ 11: Поиск максимальных значений с JOIN
-- Условие: Найдите преподавателя с самой высокой зарплатой на каждом факультете.
-- Сложность: ★★★☆☆

-- Решение:
SELECT d.department_name, t.first_name, t.last_name, t.salary
FROM teachers t
INNER JOIN departments d ON t.department_id = d.department_id
WHERE t.salary = (
    SELECT MAX(t2.salary)
    FROM teachers t2
    WHERE t2.department_id = t.department_id
) 


-- ЗАДАНИЕ 12: Агрегация оценок
-- Условие: Найдите среднюю оценку каждого студента по всем его экзаменам.
-- Сложность: ★★★☆☆

-- Решение:
SELECT s.first_name, s.last_name, AVG(g.grade_value) AS avg_grade
FROM students s
INNER JOIN enrollments e ON s.student_id = e.student_id
INNER JOIN grades g ON e.enrollment_id = g.enrollment_id
GROUP BY s.student_id, s.first_name, s.last_name
ORDER BY avg_grade DESC 


-- ЗАДАНИЕ 13: LEFT JOIN для поиска отсутствующих связей
-- Условие: Найдите всех студентов, которые не записаны ни на один курс.
-- Сложность: ★★★☆☆

-- Решение:
SELECT s.first_name, s.last_name, s.email
FROM students s
LEFT JOIN enrollments e ON s.student_id = e.student_id
WHERE e.enrollment_id IS NULL 


-- ЗАДАНИЕ 14: Фильтрация по типу экзамена
-- Условие: Найдите средний балл по финальным экзаменам (exam_type = 'final') для каждого курса.
-- Сложность: ★★★☆☆

-- Решение:
SELECT c.course_name, AVG(g.grade_value) AS avg_final_grade
FROM courses c
INNER JOIN enrollments e ON c.course_id = e.course_id
INNER JOIN grades g ON e.enrollment_id = g.enrollment_id
WHERE g.exam_type = 'final'
GROUP BY c.course_id, c.course_name
ORDER BY avg_final_grade DESC 


-- ЗАДАНИЕ 15: Подсчет с множественными условиями
-- Условие: Подсчитайте количество завершенных, активных и отмененных записей на курсы.
-- Сложность: ★★☆☆☆

-- Решение:
SELECT status, COUNT(*) AS count
FROM enrollments
GROUP BY status 
