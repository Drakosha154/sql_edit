import React, { useState, useEffect } from 'react';
import { 
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Table,
  InputGroup,
  Modal
} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import "bootstrap-icons/font/bootstrap-icons.css";


export default function Task_manage({
  nodes,
  tableData,
  setTableData
}) {

  // Состояния
  const [selectedTable, setSelectedTable] = useState('');
  const [newRow, setNewRow] = useState({});
  const [showGenerator, setShowGenerator] = useState(false);
  const [generatorConfig, setGeneratorConfig] = useState({
    count: 10,
    ranges: {}
  });

  // Получаем список таблиц из nodes
  const tables = nodes.map(node => ({
    name: node.data.label,
    columns: node.data.attributes.map(attr => ({
      name: attr.name,
      type: attr.type
    }))
  }));

  // Загрузка данных таблицы
  const loadTableData = (tableName) => {
    // Заглушка:
    const newData = Array(5).fill().map((_, i) => {
      const row = {};
      tables.find(t => t.name === tableName).columns.forEach(col => {
        row[col.name] = `Значение ${i+1}`;
      });
      return row;
    });
    setTableData({
      ...tableData,
      [tableName]: newData
    });
  };

  // Обработчик выбора таблицы
  const handleTableSelect = (e) => {
  const tableName = e.target.value;
  setSelectedTable(tableName);
  
  // Инициализируем newRow со всеми полями таблицы
  const initialRow = {};
  if (tableName) {
    tables.find(t => t.name === tableName).columns.forEach(col => {
      initialRow[col.name] = '';
    });
  }
  setNewRow(initialRow);
};

  // Добавление новой строки
  const handleAddRow = () => {
  if (!selectedTable) return;
  
  // Проверяем, что хотя бы одно поле заполнено
  const hasValues = Object.values(newRow).some(val => val !== '');
  if (!hasValues) return;
  
  setTableData({
    ...tableData,
    [selectedTable]: [...(tableData[selectedTable] || []), newRow]
  });
  
  // Сбрасываем значения, но сохраняем структуру
  const resetRow = {};
  Object.keys(newRow).forEach(key => {
    resetRow[key] = '';
  });
  setNewRow(resetRow);
};

  // Генерация случайных данных
  const generateRandomData = () => {
    if (!selectedTable) return;
    
    const { count, ranges } = generatorConfig;
    const newData = Array(count).fill().map(() => {
      const row = {};
      tables.find(t => t.name === selectedTable).columns.forEach(col => {
        if (ranges[col.name]) {
          if (col.type === 'integer') {
            row[col.name] = Math.floor(
              Math.random() * (ranges[col.name].max - ranges[col.name].min + 1) + ranges[col.name].min
            );
          } else {
            row[col.name] = `Случайное ${Math.floor(Math.random() * 100)}`;
          }
        } else {
          row[col.name] = '';
        }
      });
      return row;
    });

    setTableData({
      ...tableData,
      [selectedTable]: [...(tableData[selectedTable] || []), ...newData]
    });
    setShowGenerator(false);
  };

  const currentTableData = selectedTable ? tableData[selectedTable] || [] : [];

  return (
    <Container fluid className="py-4 h-100">
      <Row className="h-100">
        <Col md={3} className="mb-3">
          <Card className="h-100">
            <Card.Header className="bg-dark text-white">
              <h5>Управление данными</h5>
            </Card.Header>
            <Card.Body className="overflow-auto">
              <Form.Group className="mb-3">
                <Form.Label>Выберите таблицу</Form.Label>
                <Form.Select 
                  value={selectedTable}
                  onChange={handleTableSelect}
                >
                  <option value="">-- Выберите таблицу --</option>
                  {tables.map(table => (
                    <option key={table.name} value={table.name}>
                      {table.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              {selectedTable && (
                <>
                  <hr />
                  <h6>Добавить запись</h6>
                  {tables.find(t => t.name === selectedTable).columns.map(col => (
                    <Form.Group key={col.name} className="mb-2">
                      <Form.Label>{col.name} ({col.type})</Form.Label>
                      <Form.Control
                        type={col.type === 'integer' ? 'number' : 'text'}
                        value={newRow[col.name] || ''} // Убрали пробел, оставили пустую строку
                        onChange={(e) => setNewRow({
                          ...newRow,
                          [col.name]: e.target.value
                        })}
                      />
                    </Form.Group>
                  ))}
                  <Button 
                    variant="primary" 
                    className="w-100 mb-3"
                    onClick={handleAddRow}
                    disabled={!Object.keys(newRow).length}
                  >
                    <i className="bi bi-plus-circle"></i> Добавить
                  </Button>

                  <Button 
                    variant="outline-secondary" 
                    className="w-100"
                    onClick={() => setShowGenerator(true)}
                  >
                    <i className="bi bi-magic"></i> Сгенерировать данные
                  </Button>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={9}>
          <Card className="h-100">
            <Card.Header className="bg-dark text-white d-flex justify-content-between">
              <h5>Данные таблицы: {selectedTable || 'не выбрана'}</h5>
              {selectedTable && (
                <span>
                  Записей: {currentTableData.length}
                </span>
              )}
            </Card.Header>
            <Card.Body className="overflow-auto p-0">
              {selectedTable ? (
                <Table striped bordered hover className="mb-0">
                  <thead>
                    <tr>
                      {tables.find(t => t.name === selectedTable).columns.map(col => (
                        <th key={col.name}>{col.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentTableData.map((row, i) => (
                      <tr key={i}>
                        {Object.values(row).map((val, j) => (
                          <td key={j}>{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center p-5 text-muted">
                  <i className="bi bi-table fs-1"></i>
                  <p>Выберите таблицу для просмотра и редактирования данных</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Модальное окно генератора данных */}
      <Modal show={showGenerator} onHide={() => setShowGenerator(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Генератор случайных данных</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Количество записей</Form.Label>
            <Form.Control
              type="number"
              min="1"
              max="1000"
              value={generatorConfig.count}
              onChange={(e) => setGeneratorConfig({
                ...generatorConfig,
                count: parseInt(e.target.value)
              })}
            />
          </Form.Group>

          <h6>Диапазоны значений:</h6>
          {selectedTable && tables.find(t => t.name === selectedTable).columns.map(col => (
            <Form.Group key={col.name} className="mb-3">
              <Form.Label>{col.name} ({col.type})</Form.Label>
              {col.type === 'integer' ? (
                <Row>
                  <Col>
                    <Form.Label>Минимум</Form.Label>
                    <Form.Control
                      type="number"
                      value={generatorConfig.ranges[col.name]?.min || 0}
                      onChange={(e) => setGeneratorConfig({
                        ...generatorConfig,
                        ranges: {
                          ...generatorConfig.ranges,
                          [col.name]: {
                            ...generatorConfig.ranges[col.name],
                            min: parseInt(e.target.value)
                          }
                        }
                      })}
                    />
                  </Col>
                  <Col>
                    <Form.Label>Максимум</Form.Label>
                    <Form.Control
                      type="number"
                      value={generatorConfig.ranges[col.name]?.max || 100}
                      onChange={(e) => setGeneratorConfig({
                        ...generatorConfig,
                        ranges: {
                          ...generatorConfig.ranges,
                          [col.name]: {
                            ...generatorConfig.ranges[col.name],
                            max: parseInt(e.target.value)
                          }
                        }
                      })}
                    />
                  </Col>
                </Row>
              ) : (
                <Form.Control
                  type="text"
                  value={generatorConfig.ranges[col.name]?.pattern || ''}
                  onChange={(e) => setGeneratorConfig({
                    ...generatorConfig,
                    ranges: {
                      ...generatorConfig.ranges,
                      [col.name]: {
                        ...generatorConfig.ranges[col.name],
                        pattern: e.target.value
                      }
                    }
                  })}
                  placeholder="Шаблон (опционально)"
                />
              )}
            </Form.Group>
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowGenerator(false)}>
            Отмена
          </Button>
          <Button variant="primary" onClick={generateRandomData}>
            Сгенерировать
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};