import React, { useState } from 'react';
import { Container, Form, Row, Col, Card, ListGroup, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_URL

console.log(API_BASE_URL)

export default function SearchUsers() {
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (query) => {
        if (query.length < 2) {
            setUsers([]);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/users/search?q=${encodeURIComponent(query)}`);
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
                <Col md={8}>
                    <Card>
                        <Card.Header>
                            <h4>Поиск пользователей</h4>
                        </Card.Header>
                        <Card.Body>
                            <Form.Group className="mb-3">
                                <Form.Control
                                    type="text"
                                    placeholder="Введите имя пользователя..."
                                    value={searchQuery}
                                    onChange={handleInputChange}
                                    autoFocus
                                />
                            </Form.Group>

                            {loading && (
                                <div className="text-center">
                                    <Spinner animation="border" />
                                </div>
                            )}

                            {users.length > 0 && (
                                <ListGroup>
                                    {users.map(user => (
                                        <ListGroup.Item key={user.id} className="d-flex justify-content-between align-items-center">
                                            <div>
                                                <strong>{user.username}</strong>
                                                <br />
                                                <small className="text-muted">
                                                    Зарегистрирован: {new Date(user.created_at).toLocaleDateString()}
                                                </small>
                                            </div>
                                            <Link 
                                                to={`/profile/${user.id}`}
                                                className="btn btn-sm btn-primary"
                                            >
                                                Профиль
                                            </Link>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            )}

                            {searchQuery.length >= 2 && users.length === 0 && !loading && (
                                <div className="text-center text-muted py-3">
                                    Пользователи не найдены
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}