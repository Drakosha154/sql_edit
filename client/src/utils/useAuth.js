import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsAuthenticated(!!token);
        
        if (!token) {
            navigate('/login');
        }
    }, [navigate]);

    return isAuthenticated;
};