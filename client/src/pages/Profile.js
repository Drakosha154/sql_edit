import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from "react-router-dom";

export default function Profile() {
    const [databases, setDatabases] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
    const fetchUserDatabases = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/getdatabases', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            // Проверяем, что ответ JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error(`Ожидался JSON, но получен: ${text.substring(0, 100)}...`);
            }
            
            const data = await response.json();
            setDatabases(data.databases);
        } catch (error) {
            console.error("Ошибка загрузки:", error);
            alert("Ошибка загрузки: " + error.message);
        }
    };
    fetchUserDatabases();
}, []);

    const handleEdit = (dbId) => {
        navigate(`/create/${dbId}`); // Переход с ID базы данных
    };

    const handleDelete = async (dbId) => {
        try {
            // Подтверждение перед удалением
            if (!window.confirm('Вы уверены, что хотите удалить эту базу данных?')) {
                return;
            }

            const response = await fetch(`http://localhost:8080/api/databases/${dbId}`, {
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

    const handleResolve = async (dbId) => {
        navigate(`/Resolve/${dbId}`);
    };

    return (
        <div className="container ">
            <h2 className="d-flex justify-content-center m-3" >Мои базы данных</h2>
            <div className="d-flex h-100 border" >
                <div className=" w-50 border m-2" >
                    <div className="d-flex justify-content-center m-2">
                        <h4>Решённые</h4>
                    </div>

                </div>
                <div className="w-50 border m-2" >
                    <div className="d-flex justify-content-center m-2">
                        <h4>Созданные</h4>
                    </div>
                    <div className="btn border ms-3">
                        <NavLink to="/create" className="nav-link">Создать задание</NavLink>
                    </div>
                    <div className="list-group m-2">
                        {databases.map(db => (
                        <div key={db.ID} className="list-group-item border m-2">
                            <h5>{db.Name}</h5>
                            <small>{db.CreatedAt}</small>
                            <div className="mt-2">
                                <button className="btn btn-sm btn-outline-success me-2" onClick={() => handleResolve(db.ID)}>
                                    Решить
                                </button>
                                <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(db.ID)}>
                                    Редактировать
                                </button>
                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(db.ID)}>
                                    Удалить
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                </div>
            </div>
        </div>
    );
}