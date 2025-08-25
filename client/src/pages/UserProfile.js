import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, NavLink } from 'react-router-dom';
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
  Button 
} from 'react-bootstrap';

export default function UserProfile() {
    const { id } = useParams();
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);
    const [databases, setDatabases] = useState([]);
    const [solutions, setSolutions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        fetchUserProfile();
        fetchUserDatabases();
        fetchUserSolutions();
    }, [id]);

    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            const response = await fetch(`http://localhost:8080/api/users/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    // Если не авторизован, запрашиваем без токена
                    const publicResponse = await fetch(`http://localhost:8080/api/users/${id}`);
                    if (!publicResponse.ok) throw new Error('User not found');
                    
                    const publicData = await publicResponse.json();
                    setUser(publicData.user);
                    setStats(publicData.stats);
                    return;
                }
                throw new Error('User not found');
            }
            
            const data = await response.json();
            setUser(data.user);
            setStats(data.stats);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserDatabases = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/users/${id}/databases`, {
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

    const fetchUserSolutions = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/users/${id}/solutions`, {
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

    const handleResolve = async (dbId) => {
        navigate(`/Resolve/${dbId}`);
    };

    const handleCreateTask = () => {
        navigate('/create');
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
                            <Row>
                                <Col md={8}>
                                    <div className="d-flex align-items-center">
                                        <h2 className="mb-2 me-3">{user.username}</h2>
                                    </div>
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
                </Col>
            </Row>
        </Container>
    );
}