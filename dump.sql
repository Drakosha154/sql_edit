DROP DATABASE IF EXISTS sql_learn;
CREATE DATABASE sql_learn;

\connect sql_learn

--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

-- Started on 2026-02-10 20:15:10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 858 (class 1247 OID 32770)
-- Name: role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.role AS ENUM (
    'admin',
    'user'
);


ALTER TYPE public.role OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 220 (class 1259 OID 49348)
-- Name: database_lists; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.database_lists (
    id integer NOT NULL,
    id_creator integer,
    database_name text,
    database_create_text text,
    database_insert_text text,
    created_at timestamp without time zone
);


ALTER TABLE public.database_lists OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 49347)
-- Name: database_lists_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.database_lists_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.database_lists_id_seq OWNER TO postgres;

--
-- TOC entry 4860 (class 0 OID 0)
-- Dependencies: 219
-- Name: database_lists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.database_lists_id_seq OWNED BY public.database_lists.id;


--
-- TOC entry 225 (class 1259 OID 61158)
-- Name: database_solution; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.database_solution (
    id_database integer NOT NULL,
    id_solution integer NOT NULL
);


ALTER TABLE public.database_solution OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 49663)
-- Name: solutions_lists; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.solutions_lists (
    id integer NOT NULL,
    user_id integer NOT NULL,
    task_id integer NOT NULL,
    decision_sql text,
    is_correct boolean,
    metadata text,
    ip_address text,
    user_agent text,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.solutions_lists OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 62678)
-- Name: suspicious_activities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.suspicious_activities (
    id integer NOT NULL,
    user_id integer,
    task_id integer,
    solution_sql text,
    reasons text,
    ip_address text,
    user_agent text,
    detected_at timestamp without time zone
);


ALTER TABLE public.suspicious_activities OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 62677)
-- Name: suspicious_activities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.suspicious_activities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.suspicious_activities_id_seq OWNER TO postgres;

--
-- TOC entry 4861 (class 0 OID 0)
-- Dependencies: 226
-- Name: suspicious_activities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.suspicious_activities_id_seq OWNED BY public.suspicious_activities.id;


--
-- TOC entry 221 (class 1259 OID 49662)
-- Name: task_lists_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.task_lists_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_lists_id_seq OWNER TO postgres;

--
-- TOC entry 4862 (class 0 OID 0)
-- Dependencies: 221
-- Name: task_lists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.task_lists_id_seq OWNED BY public.solutions_lists.id;


--
-- TOC entry 223 (class 1259 OID 61150)
-- Name: tasks_lists; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tasks_lists (
    id integer NOT NULL,
    id_creator integer,
    task_name text,
    task_formulation text,
    database_decision text,
    created_at timestamp without time zone,
    id_database integer,
    sql_query text
);


ALTER TABLE public.tasks_lists OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 61157)
-- Name: tasks_list_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.tasks_lists ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.tasks_list_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 229 (class 1259 OID 70085)
-- Name: user_stats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_stats (
    user_id integer NOT NULL,
    username text,
    solved_tasks integer,
    created_tasks integer,
    rating numeric
);


ALTER TABLE public.user_stats OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 70084)
-- Name: user_stats_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_stats_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_stats_user_id_seq OWNER TO postgres;

--
-- TOC entry 4863 (class 0 OID 0)
-- Dependencies: 228
-- Name: user_stats_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_stats_user_id_seq OWNED BY public.user_stats.user_id;


--
-- TOC entry 218 (class 1259 OID 49224)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_admin boolean
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 49223)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 4864 (class 0 OID 0)
-- Dependencies: 217
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4675 (class 2604 OID 49351)
-- Name: database_lists id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.database_lists ALTER COLUMN id SET DEFAULT nextval('public.database_lists_id_seq'::regclass);


--
-- TOC entry 4676 (class 2604 OID 49666)
-- Name: solutions_lists id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solutions_lists ALTER COLUMN id SET DEFAULT nextval('public.task_lists_id_seq'::regclass);


--
-- TOC entry 4677 (class 2604 OID 62681)
-- Name: suspicious_activities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suspicious_activities ALTER COLUMN id SET DEFAULT nextval('public.suspicious_activities_id_seq'::regclass);


--
-- TOC entry 4678 (class 2604 OID 70088)
-- Name: user_stats user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_stats ALTER COLUMN user_id SET DEFAULT nextval('public.user_stats_user_id_seq'::regclass);


--
-- TOC entry 4673 (class 2604 OID 49227)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4845 (class 0 OID 49348)
-- Dependencies: 220
-- Data for Name: database_lists; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.database_lists (id, id_creator, database_name, database_create_text, database_insert_text, created_at) FROM stdin;
4	2	PC	CREATE TABLE Product (\n  maker TEXT NOT NULL,\n  model TEXT PRIMARY KEY,\n  type TEXT\n);\n\nCREATE TABLE PC (\n  code INT PRIMARY KEY,\n  model TEXT NOT NULL,\n  speed INT NOT NULL,\n  ram INT NOT NULL,\n  hd INT NOT NULL,\n  cd TEXT NOT NULL,\n  price NUMERIC NOT NULL\n);\n\nCREATE TABLE Laptop (\n  code INT PRIMARY KEY,\n  model TEXT NOT NULL,\n  speed INT NOT NULL,\n  ram INT NOT NULL,\n  hd INT NOT NULL,\n  price NUMERIC NOT NULL,\n  screen INT NOT NULL\n);\n\nCREATE TABLE Printer (\n  code INT PRIMARY KEY,\n  model TEXT NOT NULL,\n  color TEXT\n);\n\nALTER TABLE PC\nADD CONSTRAINT fk_PC_model\nFOREIGN KEY (model) REFERENCES Product(model);\n\nALTER TABLE Laptop\nADD CONSTRAINT fk_Laptop_model\nFOREIGN KEY (model) REFERENCES Product(model);\n\nALTER TABLE Printer\nADD CONSTRAINT fk_Printer_model\nFOREIGN KEY (model) REFERENCES Product(model);	-- SQL для заполнения таблиц данными\n\nBEGIN TRANSACTION;\n\nTRUNCATE TABLE Product CASCADE;\n\nINSERT INTO Product ("maker", "model", "type")\nVALUES\n  ('A', '1001', 'PC'),\n  ('A', '1002', 'PC'),\n  ('A', '1003', 'Laptop'),\n  ('A', '1004', 'Printer'),\n  ('B', '2001', 'PC'),\n  ('B', '2002', 'Laptop'),\n  ('B', '2003', 'Laptop'),\n  ('B', '2004', 'Printer'),\n  ('C', '3001', 'PC'),\n  ('C', '3002', 'PC'),\n  ('C', '3003', 'Laptop'),\n  ('C', '3004', 'Printer'),\n  ('D', '4001', 'PC'),\n  ('D', '4002', 'Laptop'),\n  ('D', '4003', 'Printer'),\n  ('E', '5001', 'PC'),\n  ('E', '5002', 'Laptop'),\n  ('E', '5003', 'Printer'),\n  ('F', '6001', 'PC'),\n  ('F', '6002', 'Laptop');\n\nTRUNCATE TABLE PC CASCADE;\n\nINSERT INTO PC ("code", "model", "speed", "ram", "hd", "cd", "price")\nVALUES\n  (1, '1001', 2400, 8, 500, '24x', 599.99),\n  (2, '1002', 3200, 16, 1000, '48x', 899.99),\n  (3, '2001', 2800, 8, 500, '24x', 649.99),\n  (4, '3001', 3600, 16, 1000, '48x', 999.99),\n  (5, '3002', 2400, 8, 500, '24x', 599.99),\n  (6, '4001', 3200, 16, 1000, '48x', 899.99),\n  (7, '5001', 2800, 8, 500, '24x', 649.99),\n  (8, '6001', 3600, 32, 2000, '64x', 1299.99),\n  (9, '1001', 2400, 8, 500, '24x', 599.99),\n  (10, '1002', 3200, 16, 1000, '48x', 899.99),\n  (11, '2001', 2800, 8, 500, '24x', 649.99),\n  (12, '3001', 3600, 16, 1000, '48x', 999.99),\n  (13, '3002', 2400, 8, 500, '24x', 599.99),\n  (14, '4001', 3200, 16, 1000, '48x', 899.99),\n  (15, '5001', 2800, 8, 500, '24x', 649.99),\n  (16, '6001', 3600, 32, 2000, '64x', 1299.99),\n  (17, '1001', 2400, 8, 500, '24x', 599.99),\n  (18, '1002', 3200, 16, 1000, '48x', 899.99),\n  (19, '2001', 2800, 8, 500, '24x', 649.99),\n  (20, '3001', 3600, 16, 1000, '48x', 999.99);\n\nTRUNCATE TABLE Laptop CASCADE;\n\nINSERT INTO Laptop ("code", "model", "speed", "ram", "hd", "price", "screen")\nVALUES\n  (21, '1003', 2200, 8, 500, 799.99, 15),\n  (22, '2002', 2400, 8, 500, 849.99, 14),\n  (23, '2003', 2800, 16, 1000, 1199.99, 17),\n  (24, '3003', 3200, 16, 1000, 1299.99, 15),\n  (25, '4002', 2400, 8, 500, 899.99, 14),\n  (26, '5002', 2800, 16, 1000, 1099.99, 15),\n  (27, '6002', 3600, 32, 2000, 1799.99, 17),\n  (28, '1003', 2200, 8, 500, 799.99, 15),\n  (29, '2002', 2400, 8, 500, 849.99, 14),\n  (30, '2003', 2800, 16, 1000, 1199.99, 17),\n  (31, '3003', 3200, 16, 1000, 1299.99, 15),\n  (32, '4002', 2400, 8, 500, 899.99, 14),\n  (33, '5002', 2800, 16, 1000, 1099.99, 15),\n  (34, '6002', 3600, 32, 2000, 1799.99, 17),\n  (35, '1003', 2200, 8, 500, 799.99, 15),\n  (36, '2002', 2400, 8, 500, 849.99, 14),\n  (37, '2003', 2800, 16, 1000, 1199.99, 17),\n  (38, '3003', 3200, 16, 1000, 1299.99, 15),\n  (39, '4002', 2400, 8, 500, 899.99, 14),\n  (40, '5002', 2800, 16, 1000, 1099.99, 15);\n\nTRUNCATE TABLE Printer CASCADE;\n\nINSERT INTO Printer ("code", "model", "color")\nVALUES\n  (41, '1004', 'y'),\n  (42, '2004', 'n'),\n  (43, '3004', 'y'),\n  (44, '4003', 'n'),\n  (45, '5003', 'y'),\n  (46, '1004', 'y'),\n  (47, '2004', 'n'),\n  (48, '3004', 'y'),\n  (49, '4003', 'n'),\n  (50, '5003', 'y'),\n  (51, '1004', 'y'),\n  (52, '2004', 'n'),\n  (53, '3004', 'y'),\n  (54, '4003', 'n'),\n  (55, '5003', 'y'),\n  (56, '1004', 'y'),\n  (57, '2004', 'n'),\n  (58, '3004', 'y'),\n  (59, '4003', 'n'),\n  (60, '5003', 'y');\n\nCOMMIT;\n	2025-08-21 21:55:46.372959
8	2	Библиотека	CREATE TABLE authors (\n  author_id SERIAL PRIMARY KEY,\n  full_name TEXT NOT NULL,\n  birth_year INTEGER,\n  country TEXT\n);\n\nCREATE TABLE genres (\n  genre_id SERIAL PRIMARY KEY,\n  name TEXT NOT NULL\n);\n\nCREATE TABLE books (\n  book_id SERIAL PRIMARY KEY,\n  title TEXT NOT NULL,\n  author_id INTEGER,\n  genre_id INTEGER,\n  publication_year INTEGER,\n  copies_available INTEGER,\n  price DECIMAL\n);\n\nCREATE TABLE readers (\n  reader_id SERIAL PRIMARY KEY,\n  full_name TEXT NOT NULL,\n  email TEXT,\n  registration_date DATE,\n  is_active BOOLEAN\n);\n\nCREATE TABLE book_loans (\n  loan_id SERIAL PRIMARY KEY,\n  book_id INTEGER NOT NULL,\n  reader_id INTEGER NOT NULL,\n  loan_date DATE NOT NULL,\n  due_date DATE NOT NULL,\n  return_date DATE\n);\n\nALTER TABLE books\nADD CONSTRAINT fk_books_author_id\nFOREIGN KEY (author_id) REFERENCES authors(author_id);\n\nALTER TABLE books\nADD CONSTRAINT fk_books_genre_id\nFOREIGN KEY (genre_id) REFERENCES genres(genre_id);\n\nALTER TABLE book_loans\nADD CONSTRAINT fk_book_loans_book_id\nFOREIGN KEY (book_id) REFERENCES books(book_id);\n\nALTER TABLE book_loans\nADD CONSTRAINT fk_book_loans_reader_id\nFOREIGN KEY (reader_id) REFERENCES readers(reader_id);	-- SQL для заполнения таблиц данными\n\nBEGIN TRANSACTION;\n\nTRUNCATE TABLE authors CASCADE;\n\nINSERT INTO authors ("author_id", "full_name", "birth_year", "country")\nVALUES\n  (1, 'Лев Толстой', 1828, 'Россия'),\n  (2, 'Фёдор Достоевский', 1821, 'Россия'),\n  (3, 'Джоан Роулинг', 1965, 'Великобритания'),\n  (4, 'Джордж Оруэлл', 1903, 'Великобритания'),\n  (5, 'Агата Кристи', 1890, 'Великобритания'),\n  (6, 'Антуан де Сент-Экзюпери', 1900, 'Франция'),\n  (7, 'Эрнест Хемингуэй', 1899, 'США');\n\nTRUNCATE TABLE genres CASCADE;\n\nINSERT INTO genres ("genre_id", "name")\nVALUES\n  (1, 'Роман'),\n  (2, 'Фэнтези'),\n  (3, 'Детектив'),\n  (4, 'Антиутопия'),\n  (5, 'Притча'),\n  (6, 'Классика');\n\nTRUNCATE TABLE books CASCADE;\n\nINSERT INTO books ("book_id", "title", "author_id", "genre_id", "publication_year", "copies_available", "price")\nVALUES\n  (1, 'Война и мир', 1, 1, 1869, 3, 750.5),\n  (2, 'Анна Каренина', 1, 1, 1877, 2, 650),\n  (3, 'Преступление и наказание', 2, 1, 1866, 1, 500),\n  (4, 'Гарри Поттер и философский камень', 3, 2, 1997, 5, 1200),\n  (5, '1984', 4, 4, 1949, 4, 450.25),\n  (6, 'Убийство в Восточном экспрессе', 5, 3, 1934, 3, 380.5),\n  (7, 'Маленький принц', 6, 5, 1943, 6, 320),\n  (9, 'Идиот', 2, 1, 1869, 0, 480),\n  (10, 'Гарри Поттер и Тайная комната', 3, 2, 1998, 4, 1250);\n\nTRUNCATE TABLE readers CASCADE;\n\nINSERT INTO readers ("reader_id", "full_name", "email", "registration_date", "is_active")\nVALUES\n  (1, 'Иванов Пётр', 'ivanov@mail.ru', '2022-01-15', 'TRUE'),\n  (2, 'Сидорова Анна', 'sidorova@yandex.ru', '2023-05-20', 'TRUE'),\n  (3, 'Кузнецов Олег', 'kuznetsov@gmail.com', '2021-11-30', 'FALSE'),\n  (4, 'Петрова Мария', 'petrova@mail.ru', '2023-10-10', 'TRUE'),\n  (5, 'Смирнов Алексей', 'smirnov@yandex.ru', '2020-08-05', 'TRUE');\n\nTRUNCATE TABLE book_loans CASCADE;\n\nINSERT INTO book_loans ("loan_id", "book_id", "reader_id", "loan_date", "due_date", "return_date")\nVALUES\n  (1, 1, 1, '2024-01-10', '2024-02-10', '2024-02-05'),\n  (2, 2, 2, '2024-02-15', '2024-03-15', NULL),\n  (3, 4, 3, '2024-01-20', '2024-02-20', '2024-02-18'),\n  (4, 7, 1, '2024-03-01', '2024-04-01', NULL),\n  (5, 5, 4, '2024-02-28', '2024-03-28', NULL),\n  (6, 3, 5, '2024-01-05', '2024-02-05', '2024-01-30'),\n  (7, 4, 2, '2024-03-10', '2024-04-10', NULL);\n\nCOMMIT;\n	2026-01-27 21:11:48.608788
\.


--
-- TOC entry 4850 (class 0 OID 61158)
-- Dependencies: 225
-- Data for Name: database_solution; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.database_solution (id_database, id_solution) FROM stdin;
1	1
\.


--
-- TOC entry 4847 (class 0 OID 49663)
-- Dependencies: 222
-- Data for Name: solutions_lists; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.solutions_lists (id, user_id, task_id, decision_sql, is_correct, metadata, ip_address, user_agent, created_at, updated_at) FROM stdin;
25	2	2	select model, speed, hd\nfrom PC\nwhere price < 700	t	{"copyCount":6,"isWindowActive":true,"pasteCount":0,"tabSwitches":0,"timeSpent":14}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 YaBrowser/25.12.0.0 Safari/537.36	\N	2026-01-25 01:33:27.353381
26	2	9	select books.title, authors.full_name as author_name, books.publication_year\nfrom books \njoin authors on books.author_id = authors.author_id\n\n	t	{"copyCount":0,"isWindowActive":true,"pasteCount":1,"tabSwitches":19,"timeSpent":518}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 YaBrowser/25.12.0.0 Safari/537.36	2026-02-07 22:40:56.757442	2026-02-07 22:43:56.096516
\.


--
-- TOC entry 4852 (class 0 OID 62678)
-- Dependencies: 227
-- Data for Name: suspicious_activities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.suspicious_activities (id, user_id, task_id, solution_sql, reasons, ip_address, user_agent, detected_at) FROM stdin;
4	2	2	select model, speed, hd\nfrom PC\nwhere price < 700	Обнаружены попытки копирования: 6			2026-01-25 01:33:27.353894
5	2	9	select title, full_name, publication_year\nfrom books join books.author_id == authors.author_id\norder by desc\n	Обнаружены попытки вставки: 1			2026-02-07 22:38:37.672925
6	2	9	select title, full_name, publication_year\nfrom books join books.author_id == authors.author_id\norder by desc\n	Обнаружены попытки вставки: 1			2026-02-07 22:38:39.605734
7	2	9	select title, full_name, publication_year\nfrom books \njoin author on books.author_id == authors.author_id\norder by desc\n	Обнаружены попытки вставки: 1; Слишком много переключений вкладок: 6			2026-02-07 22:39:21.590382
8	2	9	select title, author.full_name, publication_year\nfrom books \njoin author on books.author_id == authors.author_id\norder by desc\n	Обнаружены попытки вставки: 1; Слишком много переключений вкладок: 6			2026-02-07 22:39:39.081197
9	2	9	select books.title, author.full_name, books.publication_year\nfrom books \njoin author on books.author_id == authors.author_id\norder by DESC\n	Обнаружены попытки вставки: 1; Слишком много переключений вкладок: 9			2026-02-07 22:40:07.835933
10	2	9	select books.title, author.full_name, books.publication_year\nfrom books \njoin author on books.author_id == authors.author_id\norder by publication_year DESC\n	Обнаружены попытки вставки: 1; Слишком много переключений вкладок: 9			2026-02-07 22:40:20.337243
11	2	9	select books.title, author.full_name, books.publication_year\nfrom books \njoin authors on books.author_id == authors.author_id\norder by publication_year desc\n	Обнаружены попытки вставки: 1; Слишком много переключений вкладок: 10			2026-02-07 22:40:43.982818
12	2	9	select books.title, authors.full_name, books.publication_year\nfrom books \njoin authors on books.author_id == authors.author_id\norder by publication_year desc\n	Обнаружены попытки вставки: 1; Слишком много переключений вкладок: 10			2026-02-07 22:40:46.312116
13	2	9	select books.title, authors.full_name, books.publication_year\nfrom books \njoin authors on books.author_id = authors.author_id\norder by publication_year desc\n	Обнаружены попытки вставки: 1; Слишком много переключений вкладок: 12			2026-02-07 22:40:56.761039
14	2	9	select books.title, authors.full_name, books.publication_year\nfrom books \njoin authors on books.author_id = authors.author_id\norder by publication_year asc\n	Обнаружены попытки вставки: 1; Слишком много переключений вкладок: 14			2026-02-07 22:41:28.243295
15	2	9	select books.title, authors.full_name, books.publication_year\nfrom books \njoin authors on books.author_id = authors.author_id\norder by books.publication_year desc\n	Обнаружены попытки вставки: 1; Слишком много переключений вкладок: 14			2026-02-07 22:41:53.252183
16	2	9	select books.title, authors.full_name, books.publication_year\nfrom books \njoin authors on books.author_id = authors.author_id\norder by books.publication_year DESC\n	Обнаружены попытки вставки: 1; Слишком много переключений вкладок: 16			2026-02-07 22:42:19.018468
17	2	9	select books.title, authors.full_name as author_name, books.publication_year\nfrom books \njoin authors on books.author_id = authors.author_id\norder by books.publication_year DESC\n	Обнаружены попытки вставки: 1; Слишком много переключений вкладок: 19			2026-02-07 22:43:34.72365
18	2	9	select books.title, authors.full_name as author_name, books.publication_year\nfrom books \njoin authors on books.author_id = authors.author_id\norder by books.publication_year\n	Обнаружены попытки вставки: 1; Слишком много переключений вкладок: 19			2026-02-07 22:43:51.753694
19	2	9	select books.title, authors.full_name as author_name, books.publication_year\nfrom books \njoin authors on books.author_id = authors.author_id\n\n	Обнаружены попытки вставки: 1; Слишком много переключений вкладок: 19			2026-02-07 22:43:56.097034
\.


--
-- TOC entry 4848 (class 0 OID 61150)
-- Dependencies: 223
-- Data for Name: tasks_lists; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tasks_lists (id, id_creator, task_name, task_formulation, database_decision, created_at, id_database, sql_query) FROM stdin;
2	2	Мой компьютер!!!	Найдите номер модели, скорость и размер жесткого диска для всех ПК стоимостью менее 700 дол. Вывести: model, speed и hd	model,speed,hd\n1001,2400,500\n2001,2800,500\n3002,2400,500\n5001,2800,500\n1001,2400,500\n2001,2800,500\n3002,2400,500\n5001,2800,500\n1001,2400,500\n2001,2800,500\n	2025-08-21 21:55:46.372959	4	select model, speed, hd\nfrom PC\nwhere price < 700
9	2	Базовый SELECT и JOIN	Выведите список всех книг с их названиями, именами авторов и годом публикации. Отсортируйте результат по году публикации (от новых к старым).	title,full_name,publication_year\nГарри Поттер и Тайная комната,Джоан Роулинг,1998\nГарри Поттер и философский камень,Джоан Роулинг,1997\n1984,Джордж Оруэлл,1949\nМаленький принц,Антуан де Сент-Экзюпери,1943\nУбийство в Восточном экспрессе,Агата Кристи,1934\nАнна Каренина,Лев Толстой,1877\nВойна и мир,Лев Толстой,1869\nИдиот,Фёдор Достоевский,1869\nПреступление и наказание,Фёдор Достоевский,1866\n	2026-02-07 22:34:56.22096	8	SELECT books.title, authors.full_name, books.publication_year\r\nFROM books\r\nJOIN authors ON books.author_id = authors.author_id\r\nORDER BY books.publication_year desc
\.


--
-- TOC entry 4854 (class 0 OID 70085)
-- Dependencies: 229
-- Data for Name: user_stats; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_stats (user_id, username, solved_tasks, created_tasks, rating) FROM stdin;
\.


--
-- TOC entry 4843 (class 0 OID 49224)
-- Dependencies: 218
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, password, created_at, is_admin) FROM stdin;
1	ghgg	gh@hh	$2a$10$zgsmcgLfqbhV/jN6xcVI7utOa9e1WBk9uqwpBL5wog6V4sA97dOT2	2025-08-04 16:39:44.402662	f
2	ghy	ghy@ghy	$2a$10$7dydrQxyEvOMEmzd4VpBi.uQSwqf2vdnTe3723WvbpoyZaFnrRZE.	2025-08-05 19:11:26.349522	t
3	abob	gh@gh	$2a$10$LnyQtr0dGhFwU8sfr/juheNOu3HitgD5F8e9TAtTuq1nBxl0hRI8u	2025-08-26 20:37:08.96249	f
4	aaa	aaa@aaa	$2a$10$4vKIeNama7H2WxbTLbGnZuirU0Ltu2Kq.DR/iMeLKT9OANbCe46Yi	2025-08-27 20:39:02.2911	f
\.


--
-- TOC entry 4865 (class 0 OID 0)
-- Dependencies: 219
-- Name: database_lists_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.database_lists_id_seq', 11, true);


--
-- TOC entry 4866 (class 0 OID 0)
-- Dependencies: 226
-- Name: suspicious_activities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.suspicious_activities_id_seq', 19, true);


--
-- TOC entry 4867 (class 0 OID 0)
-- Dependencies: 221
-- Name: task_lists_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.task_lists_id_seq', 26, true);


--
-- TOC entry 4868 (class 0 OID 0)
-- Dependencies: 224
-- Name: tasks_list_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tasks_list_id_seq', 9, true);


--
-- TOC entry 4869 (class 0 OID 0)
-- Dependencies: 228
-- Name: user_stats_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_stats_user_id_seq', 1, false);


--
-- TOC entry 4870 (class 0 OID 0)
-- Dependencies: 217
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 4, true);


--
-- TOC entry 4686 (class 2606 OID 49355)
-- Name: database_lists database_lists_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.database_lists
    ADD CONSTRAINT database_lists_pkey PRIMARY KEY (id);


--
-- TOC entry 4692 (class 2606 OID 61162)
-- Name: database_solution database_solution_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.database_solution
    ADD CONSTRAINT database_solution_pkey PRIMARY KEY (id_database, id_solution);


--
-- TOC entry 4694 (class 2606 OID 62685)
-- Name: suspicious_activities suspicious_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suspicious_activities
    ADD CONSTRAINT suspicious_activities_pkey PRIMARY KEY (id);


--
-- TOC entry 4688 (class 2606 OID 49670)
-- Name: solutions_lists task_lists_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solutions_lists
    ADD CONSTRAINT task_lists_pkey PRIMARY KEY (id);


--
-- TOC entry 4690 (class 2606 OID 61156)
-- Name: tasks_lists tasks_list_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks_lists
    ADD CONSTRAINT tasks_list_pkey PRIMARY KEY (id);


--
-- TOC entry 4696 (class 2606 OID 70092)
-- Name: user_stats user_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_stats
    ADD CONSTRAINT user_stats_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4680 (class 2606 OID 49234)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4682 (class 2606 OID 49230)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4684 (class 2606 OID 49232)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


-- Completed on 2026-02-10 20:15:10

--
-- PostgreSQL database dump complete
--

