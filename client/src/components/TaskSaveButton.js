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

export default function SaveDatabaseButton({ taskDescription, result, setCsvDecision }) {
  const [show, setShow] = useState(false);
  const [sqlCode, setSqlCode] = useState('');
  const [sqlCodeInsert, setsqlCodeInsert] = useState('');
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const { id } = useParams();

  const handleSaveNew = async () => {
    try {
  
      //const currentSqlCode = generateSQL();
      //const currentSqlInsert = generateDataInsertSQL(nodes, tableData);
      const currentScv = jsonToCsv(result);

      const response = await fetch(`${API_BASE_URL}/api/databases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          Name: name,
          //Schema: currentSqlCode,
          //SchemaInsert: currentSqlInsert,
          Task: taskDescription,
          Decision: currentScv
        })
      });

      if (!response.ok) throw new Error('Ошибка сохранения');
      //setSqlCode(currentSqlCode);
      //setsqlCodeInsert(currentSqlInsert);
      setCsvDecision(currentScv);
      setShow(false);
      alert('База данных успешно создана!');
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

        const response = await fetch(`${API_BASE_URL}/api/databases/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          Id: id,
          //Schema: currentSqlCode ,
          //SchemaInsert: currentSqlInsert,
          Task: taskDescription,
          Decision: currentScv,
        })
      });

      if (!response.ok) throw new Error('Ошибка сохранения');
      //setSqlCode(currentSqlCode);
      //setsqlCodeInsert(currentSqlInsert);
      setCsvDecision(currentScv);
      setShow(false);
      alert('База данных успешно сохранена!');
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
          <Modal.Title>Создать новую базу данных</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Название базы данных</Form.Label>
            <Form.Control
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Моя новая база"
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