import React, { useState, useEffect } from 'react';
import { 
    Container, Form, Row, Col, Card, ListGroup, Spinner,
    Alert, Button, Badge
} from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const API_BASE_URL = process.env.REACT_APP_API_URL;

export default function Main() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [userStats, setUserStats] = useState({
        solvedTasks: 0,
        createdTasks: 0,
        totalTasks: 0
    });
    const [activeUsers, setActiveUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        
        if (isTokenExpired(token)) {
            localStorage.removeItem('token');
            navigate('/login');
            return;
        }
        
        fetchActiveUsers();
    }, [navigate]);

    const isTokenExpired = (token) => {
        if (!token) return true;
        try {
            const decodedToken = jwtDecode(token);
            const currentTime = Date.now() / 1000;
            return decodedToken.exp < currentTime;
        } catch (error) {
            console.error('Error decoding token:', error);
            return true;
        }
    };

    const fetchActiveUsers = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/users/active`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setActiveUsers(data.user_stats || []);
            } else {
                // Заглушка для демонстрации
                setActiveUsers([
                    { id: 1, username: 'ivanov', solved_tasks: 42, created_tasks: 15, rating: 95 },
                    { id: 2, username: 'petrova', solved_tasks: 38, created_tasks: 12, rating: 88 },
                    { id: 3, username: 'sidorov', solved_tasks: 35, created_tasks: 18, rating: 92 },
                    { id: 4, username: 'smirnov', solved_tasks: 28, created_tasks: 10, rating: 85 },
                    { id: 5, username: 'kuznetsov', solved_tasks: 25, created_tasks: 8, rating: 80 },
                ]);
            }
        } catch (error) {
            console.error('Error fetching active users:', error);
        }
    };

    const handleSearch = async (query) => {
        if (query.length < 2) {
            setUsers([]);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/users/search?q=${encodeURIComponent(query)}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            const data = await response.json();
            setUsers(data.users || []);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        handleSearch(query);
    };

    return (
        <Container className="py-4">
            <Row className="justify-content-center">
                {/* Основной контент - поиск пользователей */}
                <Col lg={8} className="mb-4">
                    <Card className="shadow-sm">
                        <Card.Body className="p-4">
                            <div className="text-center mb-4">
                                <h1 className="h3 mb-2">
                                    Добро пожаловать в SQL Editor
                                </h1>
                                <p className="text-muted mb-0">
                                    Создавайте SQL задачи, решайте задачи других пользователей и совершенствуйте свои навыки
                                </p>
                            </div>

                            {/* Поиск пользователей */}
                            <div className="mb-4">
                                <h5 className="mb-3">
                                    <span className="me-2">🔎</span>
                                    Поиск пользователей
                                </h5>
                                <p className="text-muted small mb-3">
                                    Найдите пользователя, чтобы посмотреть его профиль и решить созданные им SQL задачи
                                </p>
                                <Form.Group>
                                    <Form.Control
                                        type="text"
                                        placeholder="Введите имя пользователя, email или ID..."
                                        value={searchQuery}
                                        onChange={handleInputChange}
                                        autoFocus
                                        className="py-2"
                                    />
                                    <Form.Text className="text-muted">
                                        Минимум 2 символа для начала поиска
                                    </Form.Text>
                                </Form.Group>
                            </div>

                            {/* Результаты поиска */}
                            {loading && (
                                <div className="text-center py-4">
                                    <Spinner animation="border" />
                                    <p className="mt-2 mb-0">Ищем пользователей...</p>
                                </div>
                            )}

                            {users.length > 0 && (
                                <div className="search-results">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h6 className="mb-0">Найдено пользователей: {users.length}</h6>
                                        <Badge bg="light" text="dark">
                                            🔍 Поиск
                                        </Badge>
                                    </div>
                                    <ListGroup>
                                        {users.map(user => (
                                            <ListGroup.Item 
                                                key={user.id}
                                                className="mb-2 rounded border"
                                            >
                                                <Row className="align-items-center">
                                                    <Col xs="auto">
                                                        <div 
                                                            className="user-avatar"
                                                            style={{
                                                                background: '#3498db',
                                                                color: 'white',
                                                                width: '45px',
                                                                height: '45px',
                                                                borderRadius: '50%',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontWeight: 'bold',
                                                                fontSize: '1.2rem'
                                                            }}
                                                        >
                                                            {user.username.charAt(0).toUpperCase()}
                                                        </div>
                                                    </Col>
                                                    <Col>
                                                        <div>
                                                            <strong>{user.username}</strong>
                                                            {user.email && (
                                                                <small className="d-block text-muted">
                                                                    {user.email}
                                                                </small>
                                                            )}
                                                        </div>
                                                    </Col>
                                                    <Col xs="auto">
                                                        <div className="d-flex flex-column align-items-end">
                                                            {user.solved_tasks !== undefined && (
                                                                <small className="mb-1">
                                                                    <Badge 
                                                                        bg="success" 
                                                                        className="me-1"
                                                                    >
                                                                        ✓ {user.solved_tasks}
                                                                    </Badge>
                                                                    решено
                                                                </small>
                                                            )}
                                                            <Link 
                                                                to={`/profile/${user.id}`}
                                                                className="btn btn-sm btn-primary mt-1"
                                                            >
                                                                Перейти в профиль
                                                            </Link>
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                </div>
                            )}

                            {searchQuery.length >= 2 && !loading && users.length === 0 && (
                                <Alert variant="light" className="text-center py-4">
                                    <div className="mb-2" style={{ fontSize: '2rem' }}>
                                        🔍
                                    </div>
                                    <h5>Пользователи не найдены</h5>
                                    <p className="text-muted mb-0">
                                        Попробуйте изменить запрос или проверьте правильность ввода
                                    </p>
                                </Alert>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                {/* Боковая панель - активные пользователи */}
                <Col lg={4}>
                    <Card className="shadow-sm mb-4">
                        <Card.Body className="p-4">
                            <h5 className="mb-3">
                                <span className="me-2">🏆</span>
                                Самые активные пользователи
                            </h5>
                            <p className="text-muted small mb-3">
                                Топ пользователей по количеству решенных SQL задач
                            </p>
                            
                            <ListGroup variant="flush">
                                {activeUsers.map((user, index) => (
                                    <ListGroup.Item 
                                        key={user.id}
                                        className="py-3 border-bottom"
                                    >
                                        <div className="d-flex align-items-center">
                                            <div 
                                                className="position-relative me-3"
                                                style={{ minWidth: '40px' }}
                                            >
                                                <div 
                                                    className="user-rank"
                                                    style={{
                                                        background: index < 3 
                                                            ? ['#ffd700', '#c0c0c0', '#cd7f32'][index]
                                                            : '#6c757d',
                                                        color: index < 3 ? 'black' : 'white',
                                                        width: '28px',
                                                        height: '28px',
                                                        borderRadius: '50%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    {index + 1}
                                                </div>
                                            </div>
                                            <div className="flex-grow-1">
                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                    <strong>{user.username}</strong>
                                                    <Badge 
                                                        bg="warning" 
                                                        text="dark"
                                                        className="px-2"
                                                    >
                                                        ★ {user.rating || 0}
                                                    </Badge>
                                                </div>
                                                <div className="d-flex justify-content-between">
                                                    <small className="text-muted">
                                                        <Badge 
                                                            bg="success" 
                                                            className="me-1"
                                                        >
                                                            ✓ {user.solved_tasks}
                                                        </Badge>
                                                        решено
                                                    </small>
                                                    <small className="text-muted">
                                                        <Badge 
                                                            bg="primary" 
                                                            className="me-1"
                                                        >
                                                            ＋ {user.created_tasks}
                                                        </Badge>
                                                        создано
                                                    </small>
                                                </div>
                                            </div>
                                        </div>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}