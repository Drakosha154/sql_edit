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

export default function SaveDatabaseButton({ nodes, tableData, generateSQL, generateDataInsertSQL, result, setCsvDecision, testInserts }) {
  const [show, setShow] = useState(false);
  const [sqlCode, setSqlCode] = useState('');
  const [sqlCodeInsert, setsqlCodeInsert] = useState('');
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const { id } = useParams();

  const handleSaveNew = async () => {
  try {
    const currentSqlCode = generateSQL();
    const currentSqlInsert = generateDataInsertSQL(nodes, tableData, { dataSet: 'main' });
    
    // 🆕 Проверка: основной набор не должен быть пустым
    const mainRecordCount = Object.keys(tableData.main || {}).reduce((sum, table) => 
      sum + (tableData.main[table]?.length || 0), 0
    );
    
    if (mainRecordCount === 0) {
      alert('Ошибка: Основной набор данных не может быть пустым. Добавьте данные в таблицы.');
      return;
    }
    console.log(tableData)
    // 🆕 Формируем проверочные наборы данных
    const testDataSets = Object.keys(tableData)
      .filter(key => key !== 'main')
      .map(key => {
        const testNumber = key.replace('test', '');
        const insertSQL = generateDataInsertSQL(nodes, tableData, { dataSet: key });
        
        const recordCount = Object.keys(tableData[key] || {}).reduce((sum, table) => 
          sum + (tableData[key][table]?.length || 0), 0
        );
        
        if (recordCount === 0) {
          throw new Error(`Проверочный набор "Проверка ${testNumber}" не может быть пустым. Добавьте данные или удалите этот набор.`);
        }
        
        return {
          name: `Проверка ${testNumber}`,
          insert_sql: insertSQL
        };
      });

    const response = await fetch(`${API_BASE_URL}/api/databases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        Name: name,
        Schema: currentSqlCode,
        SchemaInsert: currentSqlInsert,
        test_data_sets: JSON.stringify(testDataSets)
      })
    });

    if (!response.ok) throw new Error('Ошибка сохранения');
    setSqlCode(currentSqlCode);
    setsqlCodeInsert(currentSqlInsert);
    setShow(false);
    alert('База данных успешно создана!');
    navigate('/profile')
  } catch (error) {
    alert(error.message);
  }
};

  const handleSave = async () => {
  try { 
    if (id) {
      const currentSqlCode = generateSQL();
      const currentSqlInsert = generateDataInsertSQL(nodes, tableData, { dataSet: 'main' });
      
      const mainRecordCount = Object.keys(tableData.main || {}).reduce((sum, table) => 
        sum + (tableData.main[table]?.length || 0), 0
      );
      
      if (mainRecordCount === 0) {
        alert('Ошибка: Основной набор данных не может быть пустым. Добавьте данные в таблицы.');
        return;
      }
      
      const testDataSets = Object.keys(tableData)
        .filter(key => key !== 'main')
        .map(key => {
          const testNumber = key.replace('test', '');

          const insertSQL = generateDataInsertSQL(nodes, tableData, { dataSet: key });
          
          const recordCount = Object.keys(tableData[key] || {}).reduce((sum, table) => 
            sum + (tableData[key][table]?.length || 0), 0
          );
          
          if (recordCount === 0) {
            throw new Error(`Проверочный набор "Проверка ${testNumber}" не может быть пустым. Добавьте данные или удалите этот набор.`);
          }
          
          return {
            name: `Проверка ${testNumber}`,
            insert_sql: insertSQL
          };
        });

      const response = await fetch(`${API_BASE_URL}/api/databases/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          Id: id,
          Schema: currentSqlCode,
          SchemaInsert: currentSqlInsert,
          test_data_sets: JSON.stringify(testDataSets)
        })
      });

      if (!response.ok) throw new Error('Ошибка сохранения');
      setSqlCode(currentSqlCode);
      setsqlCodeInsert(currentSqlInsert);
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