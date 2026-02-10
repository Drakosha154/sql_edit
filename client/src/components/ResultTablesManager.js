// components/ResultTablesManager.js
import React, { useState } from 'react';
import { 
  Button, 
  Modal, 
  Form, 
  Table, 
  Badge,
  Tabs, 
  Tab,
  Row,
  Col
} from 'react-bootstrap';
import ResultTableTab from './ResultTableTab';
import SQLEditorTab from './SQLEditorTab';

const ResultTablesManager = ({ 
  nodes, 
  tables, 
  setTables,
  currentTableIndex,
  setCurrentTableIndex 
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableMethod, setNewTableMethod] = useState('manual'); // 'manual' или 'sql'

  // Добавление новой проверочной таблицы
  const addNewTable = () => {
    if (!newTableName.trim()) {
      alert('Введите название таблицы');
      return;
    }

    const newTable = {
      id: Date.now(),
      name: newTableName,
      method: newTableMethod,
      result: [],
      selectedColumns: [],
      sqlQuery: '',
      createdAt: new Date().toISOString()
    };

    setTables([...tables, newTable]);
    setCurrentTableIndex(tables.length);
    setNewTableName('');
    setShowAddModal(false);
  };

  // Удаление таблицы
  const removeTable = (index) => {
    if (tables.length <= 1) {
      alert('Должна остаться хотя бы одна таблица');
      return;
    }

    const newTables = tables.filter((_, i) => i !== index);
    setTables(newTables);
    
    if (currentTableIndex >= newTables.length) {
      setCurrentTableIndex(newTables.length - 1);
    }
  };

  // Обновление данных таблицы
  const updateTable = (index, updates) => {
    const newTables = [...tables];
    newTables[index] = { ...newTables[index], ...updates };
    setTables(newTables);
  };

  return (
    <div className="d-flex flex-column h-100">
      {/* Заголовок с управлением таблицами */}
      <div className="border-bottom p-3 bg-light">
        <Row className="align-items-center">
          <Col>
            <h5 className="mb-0">
              Проверочные таблицы
              <Badge bg="secondary" className="ms-2">
                {tables.length}
              </Badge>
            </h5>
          </Col>
          <Col xs="auto">
            <Button 
              size="sm" 
              variant="success"
              onClick={() => setShowAddModal(true)}
            >
              <i className="bi bi-plus-lg me-1"></i>
              Добавить таблицу
            </Button>
          </Col>
        </Row>
      </div>

      {/* Список таблиц */}
      {tables.length > 1 && (
        <div className="border-bottom p-2">
          <div className="d-flex flex-wrap gap-2">
            {tables.map((table, index) => (
              <Button
                key={table.id}
                variant={currentTableIndex === index ? "primary" : "outline-primary"}
                size="sm"
                onClick={() => setCurrentTableIndex(index)}
                className="d-flex align-items-center"
              >
                <span>{table.name}</span>
                {tables.length > 1 && (
                  <button
                    type="button"
                    className="btn-close btn-close-white ms-2"
                    style={{ fontSize: '0.5rem' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTable(index);
                    }}
                    aria-label="Удалить"
                  />
                )}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Контент активной таблицы */}
      <div className="flex-grow-1 overflow-auto">
        {tables.length > 0 && currentTableIndex < tables.length && (
          <Tabs
            activeKey={tables[currentTableIndex].method}
            onSelect={(k) => updateTable(currentTableIndex, { method: k })}
            className="px-3 pt-2"
          >
            <Tab 
              eventKey="manual" 
              title={
                <>
                  <i className="bi bi-table me-1"></i>
                  Ручное заполнение
                </>
              }
            >
              <ResultTableTab
                result={tables[currentTableIndex].result}
                setResult={(newResult) => updateTable(currentTableIndex, { result: newResult })}
                setSelectedColumns={(columns) => updateTable(currentTableIndex, { selectedColumns: columns })}
                selectedColumns={tables[currentTableIndex].selectedColumns}
              />
            </Tab>
            <Tab 
              eventKey="sql" 
              title={
                <>
                  <i className="bi bi-code-slash me-1"></i>
                  SQL запрос
                </>
              }
            >
              <SQLEditorTab
                nodes={nodes}
                setResult={(newResult) => updateTable(currentTableIndex, { result: newResult })}
                setSelectedColumns={(columns) => updateTable(currentTableIndex, { selectedColumns: columns })}
                selectedColumns={tables[currentTableIndex].selectedColumns}
                initialSQL={tables[currentTableIndex].sqlQuery}
                onSQLChange={(sql) => updateTable(currentTableIndex, { sqlQuery: sql })}
              />
            </Tab>
          </Tabs>
        )}
      </div>

      {/* Модальное окно добавления таблицы */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Добавить проверочную таблицу</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Название таблицы</Form.Label>
              <Form.Control
                type="text"
                placeholder="Например: Ожидаемый результат"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Способ создания</Form.Label>
              <div>
                <Form.Check
                  type="radio"
                  name="method"
                  id="method-manual"
                  label="Ручное заполнение"
                  value="manual"
                  checked={newTableMethod === 'manual'}
                  onChange={(e) => setNewTableMethod(e.target.value)}
                  className="mb-2"
                />
                <Form.Check
                  type="radio"
                  name="method"
                  id="method-sql"
                  label="SQL запрос"
                  value="sql"
                  checked={newTableMethod === 'sql'}
                  onChange={(e) => setNewTableMethod(e.target.value)}
                />
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Отмена
          </Button>
          <Button variant="primary" onClick={addNewTable}>
            Добавить
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ResultTablesManager;