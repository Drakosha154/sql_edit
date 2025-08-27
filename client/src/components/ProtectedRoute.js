import { useAuth } from '../utils/useAuth';
import { Spinner, Container, Alert, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const isAuthenticated = useAuth();
    const navigate = useNavigate();

    if (isAuthenticated === null) {
        return (
            <Container className="py-4 text-center">
                <Spinner animation="border" />
            </Container>
        );
    }

    if (!isAuthenticated) {
        return (
            <Container className="py-4">
                <Alert variant="danger" className="text-center">
                    <Alert.Heading>Требуется авторизация</Alert.Heading>
                    <p>Пожалуйста, войдите в систему для доступа к этой странице</p>
                    <Button variant="primary" onClick={() => navigate('/login')}>
                        Войти
                    </Button>
                </Alert>
            </Container>
        );
    }

    return children;
};

export default ProtectedRoute;
