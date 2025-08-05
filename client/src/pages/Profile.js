import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from "react-router-dom";

export default function Profile() {
    const [databases, setDatabases] = useState([]);

    useEffect(() => {
        const fetchDatabases = async () => {
            const response = await fetch('/api/databases', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            setDatabases(data.databases);
        };
        fetchDatabases();
    }, []);

    return (
        <div className="container mt-4">
            <h2>Мои базы данных</h2>
            <div>
                <NavLink to="/create" className="nav-link">Создать задание</NavLink>
            </div>
            <div className="list-group">
                {databases.map(db => (
                    <div key={db.id} className="list-group-item">
                        <h5>{db.name}</h5>
                        <small>{db.db_name}</small>
                        <div className="mt-2">
                            <button className="btn btn-sm btn-outline-primary me-2">
                                Открыть
                            </button>
                            <button className="btn btn-sm btn-outline-danger">
                                Удалить
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}