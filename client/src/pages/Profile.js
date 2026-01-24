import React, { useState, useEffect } from 'react';
import { useNavigate, Link, NavLink } from 'react-router-dom';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Spinner, 
  Alert, 
  Tab, 
  Tabs, 
  Table, 
  Badge, 
  Button,
  Modal,
  Accordion
} from 'react-bootstrap';

const API_BASE_URL = process.env.REACT_APP_API_URL

export default function Profile() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);
    const [databases, setDatabases] = useState([]);
    const [solutions, setSolutions] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [taskSolutions, setTaskSolutions] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showLogModal, setShowLogModal] = useState(false);
    const [selectedSolution, setSelectedSolution] = useState(null);

    useEffect(() => {
        fetchMyProfile();
    }, []);

    const fetchMyProfile = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            const response = await fetch(`${API_BASE_URL}/api/profile/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to fetch profile');
            
            const data = await response.json();
            setUser(data.user);
            fetchMyDatabases(data.user);
            fetchMySolutions(data.user);
            fetchMyTask(data.user);
            setStats(data.stats);
            
            localStorage.setItem('user', JSON.stringify(data.user));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyDatabases = async (user) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/users/${user.id}/databases`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            setDatabases(data.databases);
        } catch (err) {
            console.error('Failed to fetch databases:', err);
        }
    };

    const fetchMyTask = async (user) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/users/${user.id}/task`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            setTasks(data.tasks);
        } catch (err) {
            console.error('Failed to fetch task', err);
        }
    };

    const fetchMySolutions = async (user) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/users/${user.id}/solutions`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            setSolutions(data.solutions);
        } catch (err) {
            console.error('Failed to fetch solutions:', err);
        }
    };

    const fetchTaskSolutions = async (taskId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/solutions`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();

            console.log('Task solutions data:', data);
            setTaskSolutions(data.solutions || []);
            setSelectedTask(taskId);
            setShowStatsModal(true);
        } catch (err) {
            console.error('Failed to fetch task solutions:', err);
            alert('Не удалось загрузить статистику решений');
        }
    };

    const handleDelete = async (dbId) => {
        try {
            if (!window.confirm('Вы уверены, что хотите удалить эту базу данных?')) {
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/databases/${dbId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка при удалении базы данных');
            }

            setDatabases(databases.filter(db => db.ID !== dbId));
            alert('База данных успешно удалена');
        } catch (error) {
            console.error("Ошибка удаления:", error);
            alert("Ошибка удаления: " + error.message);
        }
    };

    // Функция для открытия модального окна с логами списывания
    const showSuspiciousLogs = (solution) => {
        if (solution && solution.has_suspicious && solution.suspicious_logs && solution.suspicious_logs.length > 0) {
            setSelectedSolution(solution);
            setShowLogModal(true);
        }
    };

    const handleDatabaseEdit = (dbId) => {
        navigate(`/create_database/${dbId}`);
    };

    const handleTaskEdit = (dbId) => {
        navigate(`/create_task/${dbId}`);
    };

    const handleResolve = async (dbId) => {
        navigate(`/Resolve/${dbId}`);
    };

    // Функция для подсчета количества логов списывания в строке
    const getSuspiciousLogsCount = (solution) => {
        if (!solution.has_suspicious || !solution.suspicious_logs) return 0;
        return solution.suspicious_logs.length;
    };

    if (loading) {
        return (
            <Container className="py-4 text-center">
                <Spinner animation="border" />
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="py-4">
                <Alert variant="danger">
                    {error}
                </Alert>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <Row>
                <Col>
                    <Card className="mb-4">
                        <Card.Body>
                            <Row className="align-items-center">
                                <Col md={8}>
                                    <div className="d-flex align-items-center mb-3">
                                        <h2 className="mb-0 me-3">{user.username}</h2>
                                        <Badge bg="primary" className="fs-6">
                                            <i className="bi bi-person-check me-1"></i>
                                            Ваш профиль
                                        </Badge>
                                    </div>
                                    
                                    <p className="text-muted mb-2">
                                        <i className="bi bi-envelope me-1"></i>
                                        Email: {user.email}
                                    </p>
                                    <p className="text-muted">
                                        <i className="bi bi-calendar me-1"></i>
                                        Зарегистрирован: {new Date(user.created_at).toLocaleDateString()}
                                    </p>
                                </Col>
                                <Col md={4}>
                                    <div className="d-flex justify-content-around text-center">
                                        <div>
                                            <h4 className="text-primary">{stats.database_count}</h4>
                                            <small className="text-muted">Баз данных</small>
                                        </div>
                                        <div>
                                            <h4 className="text-info">{stats.solved_count}</h4>
                                            <small className="text-muted">Решений</small>
                                        </div>
                                        <div>
                                            <h4 className="text-success">{stats.correct_count}</h4>
                                            <small className="text-muted">Верных</small>
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    <Tabs defaultActiveKey="databases" className="mb-3">
                        <Tab eventKey="databases" title="Базы данных">
                            <Card>
                                <Card.Body>
                                    <div className="btn border ms-3">
                                        <NavLink to="/create_database" className="nav-link">Создать базу данных</NavLink>
                                    </div>
                                    {databases.length > 0 ? (
                                        <div className="list-group m-2">
                                            {databases.map(db => (
                                            <div key={db.ID} className="list-group-item border m-2">
                                                <h5>{db.Database_name}</h5>
                                                <small>{new Date(db.CreatedAt).toLocaleDateString()}</small>
                                                <div className="mt-2">
                                                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleDatabaseEdit(db.ID)}>
                                                        Редактировать
                                                    </button>
                                                    <button className="btn btn-sm btn-outline-danger me-2" onClick={() => handleDelete(db.ID)}>
                                                        Удалить
                                                    </button>
                                                </div>
                                            </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center text-muted py-3">
                                            Нет созданных баз данных
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Tab>
                        
                        <Tab eventKey="tasks" title="Мои задания">
                            <Card>
                                <Card.Body>
                                    <div className="btn border ms-3">
                                        <NavLink to="/create_task" className="nav-link">Создать задание</NavLink>
                                    </div>
                                    {tasks.length > 0 ? (
                                        <div className="list-group m-2">
                                            {tasks.map(task => (
                                            <div key={task.ID} className="list-group-item border m-2">
                                                <h5>{task.Task_name}</h5>
                                                <small>{new Date(task.CreatedAt).toLocaleDateString()}</small>
                                                <div className="mt-2">
                                                    <button className="btn btn-sm btn-outline-success me-2" onClick={() => handleResolve(task.ID)}>
                                                        Решить
                                                    </button>
                                                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleTaskEdit(task.ID)}>
                                                        Редактировать
                                                    </button>
                                                    <button className="btn btn-sm btn-outline-info me-2" onClick={() => fetchTaskSolutions(task.ID)}>
                                                        Статистика решений
                                                    </button>
                                                    <button className="btn btn-sm btn-outline-danger me-2" onClick={() => handleDelete(task.ID)}>
                                                        Удалить
                                                    </button>
                                                </div>
                                            </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center text-muted py-3">
                                            Нет созданных заданий
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Tab>

                        <Tab eventKey="solutions" title="Решения">
                            <Card>
                                <Card.Body>
                                    {solutions.length > 0 ? (
                                        <Table striped>
                                            <thead>
                                                <tr>
                                                    <th>Задание</th>
                                                    <th>Статус</th>
                                                    <th>Дата</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {solutions.map(solution => (
                                                    <tr key={solution.id}>
                                                        <td>
                                                            <Link to={`/task/${solution.task_id}`}>
                                                                {solution.task_name || `Задание #${solution.task_id}`}
                                                            </Link>
                                                        </td>
                                                        <td>
                                                            <Badge bg={solution.is_correct ? "success" : "danger"}>
                                                                {solution.is_correct ? "Верно" : "Неверно"}
                                                            </Badge>
                                                        </td>
                                                        <td>
                                                            {new Date(solution.created_at).toLocaleDateString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    ) : (
                                        <div className="text-center text-muted py-3">
                                            Нет решений заданий
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Tab>
                    </Tabs>

                    {/* Модальное окно для статистики решений */}
                    <Modal show={showStatsModal} onHide={() => setShowStatsModal(false)} size="xl">
                        <Modal.Header closeButton>
                            <Modal.Title>
                                Статистика решений задания
                                {selectedTask && ` (ID: ${selectedTask})`}
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            {taskSolutions.length > 0 ? (
                                <>
                                    <div className="mb-3">
                                        <Badge bg="primary" className="me-2">
                                            Всего решений: {taskSolutions.length}
                                        </Badge>
                                        <Badge bg="success" className="me-2">
                                            Верных: {taskSolutions.filter(s => s.is_correct).length}
                                        </Badge>
                                        <Badge bg="warning" className="me-2">
                                            Подозрительных пользователей: {taskSolutions.filter(s => s.has_suspicious).length}
                                        </Badge>
                                        <Badge bg="danger" className="me-2">
                                            Всего логов списывания: {taskSolutions.reduce((total, s) => total + getSuspiciousLogsCount(s), 0)}
                                        </Badge>
                                    </div>
                                    
                                    <Table striped bordered hover>
                                        <thead>
                                            <tr>
                                                <th>Пользователь</th>
                                                <th>Статус</th>
                                                <th>Дата решения</th>
                                                <th>Логов списывания</th>
                                                <th>Детали</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {taskSolutions.map((solution, index) => (
                                                <tr key={index}>
                                                    <td>{solution.username}</td>
                                                    <td>
                                                        <Badge bg={solution.is_correct ? "success" : "danger"}>
                                                            {solution.is_correct ? "Верно" : "Неверно"}
                                                        </Badge>
                                                        {solution.has_suspicious && (
                                                            <Badge bg="warning" className="ms-1">
                                                                {getSuspiciousLogsCount(solution)} нарушений
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td>{new Date(solution.created_at).toLocaleString()}</td>
                                                    <td>
                                                        {solution.has_suspicious ? (
                                                            <Badge bg={solution.suspicious_logs.length > 1 ? "danger" : "warning"}>
                                                                {getSuspiciousLogsCount(solution)} логов
                                                            </Badge>
                                                        ) : (
                                                            <small className="text-muted">Нет</small>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {solution.has_suspicious ? (
                                                            <Button 
                                                                variant="outline-warning" 
                                                                size="sm"
                                                                onClick={() => showSuspiciousLogs(solution)}
                                                            >
                                                                Посмотреть все логи ({getSuspiciousLogsCount(solution)})
                                                            </Button>
                                                        ) : (
                                                            <small className="text-muted">Нет подозрительной активности</small>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </>
                            ) : (
                                <p className="text-center">Пока нет решений этой задачи</p>
                            )}
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setShowStatsModal(false)}>
                                Закрыть
                            </Button>
                        </Modal.Footer>
                    </Modal>

                    {/* Модальное окно для деталей списывания */}
                    <Modal show={showLogModal} onHide={() => setShowLogModal(false)} size="xl">
                        <Modal.Header closeButton>
                            <Modal.Title>
                                Логи списывания пользователя
                                {selectedSolution && (
                                    <span className="ms-2">
                                        {selectedSolution.username}
                                        <Badge bg="warning" className="ms-2">
                                            {getSuspiciousLogsCount(selectedSolution)} логов
                                        </Badge>
                                    </span>
                                )}
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            {selectedSolution && selectedSolution.suspicious_logs && selectedSolution.suspicious_logs.length > 0 ? (
                                <>
                                    <div className="mb-4">
                                        <h6>Информация о решении:</h6>
                                        <Row>
                                            <Col md={6}>
                                                <p className="mb-1">
                                                    <strong>Пользователь:</strong> {selectedSolution.username}
                                                </p>
                                                <p className="mb-1">
                                                    <strong>Статус решения:</strong> 
                                                    <Badge bg={selectedSolution.is_correct ? "success" : "danger"} className="ms-2">
                                                        {selectedSolution.is_correct ? "Верно" : "Неверно"}
                                                    </Badge>
                                                </p>
                                            </Col>
                                            <Col md={6}>
                                                <p className="mb-1">
                                                    <strong>Дата решения:</strong> {new Date(selectedSolution.created_at).toLocaleString()}
                                                </p>
                                                <p className="mb-1">
                                                    <strong>SQL запрос пользователя:</strong>
                                                </p>
                                            </Col>
                                        </Row>
                                        <div className="mt-2 bg-dark text-light p-3 rounded">
                                            <pre className="mb-0" style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>
                                                {selectedSolution.decision_sql || "SQL запрос отсутствует"}
                                            </pre>
                                        </div>
                                    </div>

                                    <h6 className="mb-3">Все обнаруженные случаи списывания:</h6>
                                    <Accordion defaultActiveKey="0">
                                        {selectedSolution.suspicious_logs.map((log, index) => (
                                            <Accordion.Item key={index} eventKey={index.toString()}>
                                                <Accordion.Header>
                                                    <div className="d-flex justify-content-between w-100">
                                                        <span>
                                                            Лог #{index + 1} - {new Date(log.detected_at).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </Accordion.Header>
                                                <Accordion.Body>
                                                    <Row>
                                                        <Col md={6}>
                                                            <div className="mb-3">
                                                                <h6>Причины списывания:</h6>
                                                                <div className="alert alert-warning mb-0">
                                                                    {log.reasons}
                                                                </div>
                                                            </div>
                                                        </Col>
                                                        <Col md={6}>
                                                            <div className="mb-3">
                                                                <h6>Техническая информация:</h6>
                                                                <p className="mb-1">
                                                                    <strong>Время обнаружения:</strong> {new Date(log.detected_at).toLocaleString()}
                                                                </p>
                                                            </div>
                                                        </Col>
                                                    </Row>

                                                    {log.solution_sql && (
                                                        <div className="mb-3">
                                                            <h6>SQL запрос из лога:</h6>
                                                            <div className="bg-secondary text-light p-3 rounded">
                                                                <pre className="mb-0" style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>
                                                                    {log.solution_sql}
                                                                </pre>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Accordion.Body>
                                            </Accordion.Item>
                                        ))}
                                    </Accordion>
                                </>
                            ) : (
                                <p className="text-center">Нет данных о списывании</p>
                            )}
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setShowLogModal(false)}>
                                Закрыть
                            </Button>
                        </Modal.Footer>
                    </Modal>

                </Col>
            </Row>
        </Container>
    );
}