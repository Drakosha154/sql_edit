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
  Modal
} from 'react-bootstrap';

const API_BASE_URL = process.env.REACT_APP_API_URL

export default function Profile() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);
    const [databases, setDatabases] = useState([]);
    const [solutions, setSolutions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [taskSolutions, setTaskSolutions] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);

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
            setStats(data.stats);
            
            // Сохраняем пользователя в localStorage для навбара
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
            // Подтверждение перед удалением
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

            // Обновляем список баз данных после удаления
            setDatabases(databases.filter(db => db.ID !== dbId));
            alert('База данных успешно удалена');
        } catch (error) {
            console.error("Ошибка удаления:", error);
            alert("Ошибка удаления: " + error.message);
        }
    };

    const handleTaskEdit = (dbId) => {
        navigate(`/create/${dbId}`);
    };

    const handleResolve = async (dbId) => {
        navigate(`/Resolve/${dbId}`);
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

                    {/* Остальной код такой же как в UserProfile.jsx */}
                    <Tabs defaultActiveKey="databases" className="mb-3">
                        <Tab eventKey="databases" title="Базы данных">
                            <Card>
                                <Card.Body>
                                    <div className="btn border ms-3">
                                        <NavLink to="/create" className="nav-link">Создать задание</NavLink>
                                    </div>
                                    {databases.length > 0 ? (
                                        <div className="list-group m-2">
                                            {databases.map(db => (
                                            <div key={db.ID} className="list-group-item border m-2">
                                                <h5>Номер задания {db.ID}</h5>
                                                <small>{new Date(db.CreatedAt).toLocaleDateString()}</small>
                                                <div className="mt-2">
                                                    <button className="btn btn-sm btn-outline-success me-2" onClick={() => handleResolve(db.ID)}>
                                                        Решить
                                                    </button>
                                                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleTaskEdit(db.ID)}>
                                                        Редактировать
                                                    </button>
                                                    <button className="btn btn-sm btn-outline-info me-2" onClick={() => fetchTaskSolutions(db.ID)}>
                                                        Статистика решений
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
                    <Modal show={showStatsModal} onHide={() => setShowStatsModal(false)} size="lg">
                        <Modal.Header closeButton>
                            <Modal.Title>Статистика решений задания #{selectedTask}</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            {taskSolutions.length > 0 ? (
                                <Table striped bordered>
                                    <thead>
                                        <tr>
                                            <th>Пользователь</th>
                                            <th>Статус</th>
                                            <th>Дата решения</th>
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
                                                </td>
                                                <td>{new Date(solution.created_at).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
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

                </Col>
            </Row>
        </Container>
    );
}