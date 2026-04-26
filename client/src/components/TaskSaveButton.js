import React, { useState } from 'react';
import { Button, Modal, Form } from 'react-bootstrap';
import { useNavigate } from "react-router-dom";
import { useParams } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_URL

function jsonToCsv(data) {
  if (!data || data.length === 0) return '';
  
  // Получаем все уникальные ключи из объектов
  const headers = [...new Set(data.flatMap(obj => Object.keys(obj)))];
  
  // Создаем заголовок CSV
  let csv = headers.join(',') + '\n';
  
  // Добавляем данные
  data.forEach(item => {
    const row = headers.map(header => {
      const value = item[header];
      // Экранируем значения, которые содержат запятые или кавычки
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csv += row.join(',') + '\n';
  });

  
  return csv;
}

export default function TaskSaveButton({ taskDescription, result, setCsvDecision, databaseId, sqlQuery, generatedResults }) {
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const { id } = useParams();

  const handleSaveNew = async () => {
    try {
  
      //const currentSqlCode = generateSQL();
      //const currentSqlInsert = generateDataInsertSQL(nodes, tableData);
      const currentScv = jsonToCsv(result);

      const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
  Name: name,
  Task: taskDescription,
  Decision: generatedResults ? generatedResults.main_csv : currentScv,
  Id_database: databaseId,
  SqlQuery: sqlQuery,
  expected_results: generatedResults && generatedResults.expected_results 
    ? JSON.stringify(generatedResults.expected_results)
    : '[]'
})
      });

      if (!response.ok) throw new Error('Ошибка сохранения');
      setCsvDecision(currentScv);
      setShow(false);
      alert('Зданание успешно создано!');
      navigate('/profile')
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSave = async () => {
    try { 
      if (id) {
        //const currentSqlCode = generateSQL();
        //const currentSqlInsert = generateDataInsertSQL(nodes, tableData);
        const currentScv = jsonToCsv(result);

        const response = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
  Id: id,
  Task: taskDescription,
  Decision: generatedResults ? generatedResults.main_csv : currentScv,
  SqlQuery: sqlQuery,
  expected_results: generatedResults && generatedResults.expected_results 
    ? JSON.stringify(generatedResults.expected_results)
    : '[]'
})
      });

      if (!response.ok) throw new Error('Ошибка сохранения');
      setCsvDecision(currentScv);
      setShow(false);
      alert('Задание успешно сохранено!');
      console.log('1111')
      navigate('/profile')

      } else {
        setShow(true);
      }
    } catch (error) {
      alert(error.message);
    }
  }
  

  return (
    <>
      <Button variant="success" onClick={handleSave}>
        Сохранить
      </Button>

      <Modal show={show} onHide={() => setShow(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Создать новую задачу</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Название задания</Form.Label>
            <Form.Control
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Моё новое задание"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>
            Отмена
          </Button>
          <Button variant="primary" onClick={handleSaveNew}>
            Далее
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}