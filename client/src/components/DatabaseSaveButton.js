import React, { useState } from 'react';
import { Button, Modal, Form } from 'react-bootstrap';

export default function SaveDatabaseButton({ sqlCode }) {
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');

  const handleSave = async () => {
    try {
      const response = await fetch('/databases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: name,
          schema: sqlCode
        })
      });

      if (!response.ok) throw new Error('Ошибка сохранения');
      setShow(false);
      alert('База данных успешно создана!');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <>
      <Button variant="success" onClick={() => setShow(true)}>
        Сохранить базу данных
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
            Сохранить
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}