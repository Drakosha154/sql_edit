import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Alert, Spinner, Tab, Tabs, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export default function AdminPanel() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showUserModal, setShowUserModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [activeTab, setActiveTab] = useState('stats');

    useEffect(() => {
        checkAdminAccess();
    }, []);

    const checkAdminAccess = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const response = await fetch('http://localhost:8080/api/admin/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 403) {
                setError('Доступ только для администраторов');
                setLoading(false);
                return;
            }

            if (!response.ok) throw new Error('Admin access denied');
            
            loadData();
        } catch (err) {
            setError('Ошибка доступа: ' + err.message);
            setLoading(false);
        }
    };

    const loadData = async () => {
        try {
            const token = localStorage.getItem('token');
            const [statsRes, usersRes, tasksRes] = await Promise.all([
                fetch('http://localhost:8080/api/admin/stats', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('http://localhost:8080/api/admin/users', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('http://localhost:8080/api/admin/tasks', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (!statsRes.ok || !usersRes.ok || !tasksRes.ok) {
                throw new Error('Failed to load admin data');
            }

            const [statsData, usersData, tasksData] = await Promise.all([
                statsRes.json(),
                usersRes.json(),
                tasksRes.json()
            ]);

            setStats(statsData.stats);
            setUsers(usersData.users);
            setTasks(tasksData.tasks);
        } catch (err) {
            setError('Ошибка загрузки данных: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEditUser = (user) => {
        setSelectedUser(user);
        setShowUserModal(true);
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const updates = {
            username: formData.get('username'),
            email: formData.get('email'),
            is_admin: formData.get('is_admin') === 'on'
        };

        console.log(updates)

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/admin/users/${selectedUser.ID}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });

            if (!response.ok) throw new Error('Failed to update user');

            setShowUserModal(false);
            setSelectedUser(null);
            loadData(); // Reload data
            alert('Пользователь успешно обновлен');
        } catch (err) {
            alert('Ошибка обновления: ' + err.message);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Вы уверены, что хотите удалить этого пользователя?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to delete user');

            loadData();
            alert('Пользователь успешно удален');
        } catch (err) {
            alert('Ошибка удаления: ' + err.message);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Вы уверены, что хотите удалить это задание?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/admin/tasks/${taskId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to delete task');

            loadData();
            alert('Задание успешно удалено');
        } catch (err) {
            alert('Ошибка удаления: ' + err.message);
        }
    };

    if (loading) {
        return (
            <Container className="py-4 text-center">
                <Spinner animation="border" />
                <p className="mt-2">Загрузка админ-панели...</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="py-4">
                <Alert variant="danger">
                    <Alert.Heading>Ошибка доступа</Alert.Heading>
                    <p>{error}</p>
                    <Button onClick={() => navigate('/')}>На главную</Button>
                </Alert>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <Row>
                <Col>
                    <h1 className="mb-4">👑 Админ-панель</h1>
                    
                    <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-3">
                        {/* Вкладка Статистика */}
                        <Tab eventKey="stats" title="📊 Статистика">
                            <Row>
                                <Col md={3}>
                                    <Card className="text-center mb-3">
                                        <Card.Body>
                                            <Card.Title>{stats?.total_users || 0}</Card.Title>
                                            <Card.Text>Пользователей</Card.Text>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={3}>
                                    <Card className="text-center mb-3">
                                        <Card.Body>
                                            <Card.Title>{stats?.total_tasks || 0}</Card.Title>
                                            <Card.Text>Заданий</Card.Text>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={3}>
                                    <Card className="text-center mb-3">
                                        <Card.Body>
                                            <Card.Title>{stats?.total_solutions || 0}</Card.Title>
                                            <Card.Text>Решений</Card.Text>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={3}>
                                    <Card className="text-center mb-3">
                                        <Card.Body>
                                            <Card.Title>{stats?.correct_solutions || 0}</Card.Title>
                                            <Card.Text>Верных решений</Card.Text>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </Tab>

                        {/* Вкладка Пользователи */}
                        <Tab eventKey="users" title="👥 Пользователи">
                            <Card>
                                <Card.Body>
                                    <Table striped hover>
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Имя</th>
                                                <th>Email</th>
                                                <th>Админ</th>
                                                <th>Дата регистрации</th>
                                                <th>Действия</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map(user => (
                                                <tr key={user.ID}>
                                                    <td>{user.ID}</td>
                                                    <td>{user.Username}</td>
                                                    <td>{user.Email}</td>
                                                    <td>
                                                        {user.IsAdmin ? 
                                                            <Badge bg="success">Да</Badge> : 
                                                            <Badge bg="secondary">Нет</Badge>
                                                        }
                                                    </td>
                                                    <td>{new Date(user.CreatedAt).toLocaleDateString()}</td>
                                                    <td>
                                                        <Button size="sm" variant="outline-primary" 
                                                            onClick={() => handleEditUser(user)}>
                                                            ✏️
                                                        </Button>
                                                        <Button size="sm" variant="outline-danger" 
                                                            onClick={() => handleDeleteUser(user.ID)}
                                                            className="ms-1">
                                                            🗑️
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>
                        </Tab>

                        {/* Вкладка Задания */}
                        <Tab eventKey="tasks" title="📝 Задания">
                            <Card>
                                <Card.Body>
                                    <Table striped hover>
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Название</th>
                                                <th>Автор</th>
                                                <th>Решений</th>
                                                <th>Дата создания</th>
                                                <th>Действия</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tasks.map(task => (
                                                <tr key={task.id}>
                                                    <td>{task.id}</td>
                                                    <td>{task.name}</td>
                                                    <td>{task.creator_name}</td>
                                                    <td>
                                                        <Badge bg="info">{task.solutions_count}</Badge>
                                                    </td>
                                                    <td>{task.created_at}</td>
                                                    <td>
                                                        <Button size="sm" variant="outline-danger" 
                                                            onClick={() => handleDeleteTask(task.id)}>
                                                            🗑️ Удалить
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>
                        </Tab>
                    </Tabs>

                    {/* Модальное окно редактирования пользователя */}
                    <Modal show={showUserModal} onHide={() => setShowUserModal(false)}>
                        <Modal.Header closeButton>
                            <Modal.Title>Редактирование пользователя</Modal.Title>
                        </Modal.Header>
                        <Form onSubmit={handleSaveUser}>
                            <Modal.Body>
                                {console.log(selectedUser)}
                                {selectedUser && (
                                    <>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Имя пользователя</Form.Label>
                                            <Form.Control
                                                name="username"
                                                defaultValue={selectedUser.Username}
                                            />
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Email</Form.Label>
                                            <Form.Control
                                                name="email"
                                                type="email"
                                                defaultValue={selectedUser.Email}
                                            />
                                        </Form.Group>
                                        <Form.Check
                                            name="is_admin"
                                            type="checkbox"
                                            label="Администратор"
                                            defaultChecked={selectedUser.IsAdmin}
                                        />
                                    </>
                                )}
                            </Modal.Body>
                            <Modal.Footer>
                                <Button variant="secondary" onClick={() => setShowUserModal(false)}>
                                    Отмена
                                </Button>
                                <Button variant="primary" type="submit">
                                    Сохранить
                                </Button>
                            </Modal.Footer>
                        </Form>
                    </Modal>
                </Col>
            </Row>
        </Container>
    );
}