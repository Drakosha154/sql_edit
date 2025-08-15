import React, { useState } from 'react';
import { Button, Modal, Form } from 'react-bootstrap';
import { useNavigate } from "react-router-dom";

export default function SaveDatabaseButton({ nodes, tableData, generateSQL, generateDataInsertSQL }) {
  const [show, setShow] = useState(false);
  const [sqlCode, setSqlCode] = useState('');
  const [sqlCodeInsert, setsqlCodeInsert] = useState('');
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleSave = async () => {
    try {
      const currentSqlCode = generateSQL();
      const currentSqlInsert = generateDataInsertSQL(nodes, tableData);

      const response = await fetch('http://localhost:8080/api/databases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          Name: name,
          Schema: currentSqlCode ,
          SchemaInsert: currentSqlInsert 
        })
      });

      if (!response.ok) throw new Error('Ошибка сохранения');
      setSqlCode(currentSqlCode);
      setsqlCodeInsert(currentSqlInsert);
      setShow(false);
      alert('База данных успешно создана!');
    } catch (error) {
      alert(error.message);
    }
  };
  

  return (
    <>
      <Button variant="success" onClick={() => setShow(true)}>
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
          <Button variant="primary" onClick={handleSave}>
            Далее
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}