import React, { useState, useEffect } from 'react';

export default function Profile() {

useEffect(() => {
    const fetchUserDatabases = async () => {
        try {
            
        } catch (error) {
            console.error("Ошибка загрузки:", error);
            alert("Ошибка загрузки: " + error.message);
        }
    };
    fetchUserDatabases();
}, []);

return (
    <h1>g</h1>
);

}