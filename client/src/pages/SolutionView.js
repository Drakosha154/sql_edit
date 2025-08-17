import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Table, Container, Row, Col, InputGroup } from 'react-bootstrap';

const SolutionView = ({ nodes, edges, tableData }) => {
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [result, setResult] = useState([]);
  const [joinTables, setJoinTables] = useState([]);

  // Получаем список таблиц
  const tables = nodes.map(node => ({
    name: node.data.label,
    columns: node.data.attributes.map(attr => attr.name)
  }));

  // Генерация SQL запроса
  const generateSolutionSQL = () => {
    if (!selectedTable) return '';
    
    // Базовый SELECT
    let sql = `SELECT ${selectedColumns.join(', ') || '*'} FROM ${selectedTable}`;
    
    // Добавляем JOIN если есть
    joinTables.forEach(join => {
      sql += `\nJOIN ${join.table} ON ${join.condition}`;
    });
    
    // Добавляем WHERE если есть условия
    if (conditions.length > 0) {
      sql += `\nWHERE ${conditions.map(c => `${c.column} ${c.operator} ${c.value}`).join(' AND ')}`;
    }
    
    return sql;
  };

  // Выполнение запроса (заглушка)
  const executeQuery = () => {
    if (!selectedTable) return;
    
    // Фильтрация данных (упрощенная реализация)
    const filteredData = (tableData[selectedTable] || []).filter(row => {
      return conditions.every(cond => {
        const value = row[cond.column];
        switch (cond.operator) {
          case '=': return value == cond.value;
          case '>': return value > cond.value;
          case '<': return value < cond.value;
          case 'LIKE': return value.includes(cond.value);
          default: return true;
        }
      });
    });
    
    // Выбор только нужных столбцов
    const resultData = filteredData.map(row => {
      const resultRow = {};
      selectedColumns.forEach(col => {
        resultRow[col] = row[col];
      });
      return resultRow;
    });
    
    setResult(resultData);
  };

  // Добавление условия
  const addCondition = () => {
    setConditions([...conditions, { column: '', operator: '=', value: '' }]);
  };

  return (
    <Container fluid className="py-4 h-100">
      <Row className="h-100">
        <Col md={4}>
          <Card className="h-100">
            <Card.Header className="bg-dark text-white">
              <h5>Конструктор запроса</h5>
            </Card.Header>
            <Card.Body className="overflow-auto">
              <Form.Group className="mb-3">
                <Form.Label>Выберите таблицу</Form.Label>
                <Form.Select
                  value={selectedTable}
                  onChange={(e) => {
                    setSelectedTable(e.target.value);
                    setSelectedColumns([]);
                    setConditions([]);
                  }}
                >
                  <option value="">-- Выберите таблицу --</option>
                  {tables.map(table => (
                    <option key={table.name} value={table.name}>{table.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              {selectedTable && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Выберите столбцы</Form.Label>
                    {tables.find(t => t.name === selectedTable).columns.map(col => (
                      <Form.Check
                        key={col}
                        type="checkbox"
                        label={col}
                        checked={selectedColumns.includes(col)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedColumns([...selectedColumns, col]);
                          } else {
                            setSelectedColumns(selectedColumns.filter(c => c !== col));
                          }
                        }}
                      />
                    ))}
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Условия выборки</Form.Label>
                    {conditions.map((cond, index) => (
                      <InputGroup key={index} className="mb-2">
                        <Form.Select
                          value={cond.column}
                          onChange={(e) => {
                            const newConditions = [...conditions];
                            newConditions[index].column = e.target.value;
                            setConditions(newConditions);
                          }}
                        >
                          <option value="">Столбец</option>
                          {tables.find(t => t.name === selectedTable).columns.map(col => (
                            <option key={col} value={col}>{col}</option>
                          ))}
                        </Form.Select>
                        <Form.Select
                          value={cond.operator}
                          onChange={(e) => {
                            const newConditions = [...conditions];
                            newConditions[index].operator = e.target.value;
                            setConditions(newConditions);
                          }}
                        >
                          <option value="=">=</option>
                          <option value=">">&gt;</option>
                          <option value="<">&lt;</option>
                          <option value="LIKE">LIKE</option>
                        </Form.Select>
                        <Form.Control
                          type="text"
                          value={cond.value}
                          onChange={(e) => {
                            const newConditions = [...conditions];
                            newConditions[index].value = e.target.value;
                            setConditions(newConditions);
                          }}
                          placeholder="Значение"
                        />
                        <Button
                          variant="outline-danger"
                          onClick={() => {
                            setConditions(conditions.filter((_, i) => i !== index));
                          }}
                        >
                          ×
                        </Button>
                      </InputGroup>
                    ))}
                    <Button variant="outline-secondary" onClick={addCondition}>
                      Добавить условие
                    </Button>
                  </Form.Group>

                  <Button variant="primary" onClick={executeQuery}>
                    Выполнить запрос
                  </Button>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card className="h-100">
            <Card.Header className="bg-dark text-white">
              <h5>Результат</h5>
            </Card.Header>
            <Card.Body className="overflow-auto">
              {result.length > 0 ? (
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      {selectedColumns.map(col => (
                        <th key={col}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.map((row, i) => (
                      <tr key={i}>
                        {selectedColumns.map(col => (
                          <td key={`${i}-${col}`}>{row[col]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center text-muted p-5">
                  <i className="bi bi-table fs-1"></i>
                  <p>Выберите таблицу и настройте запрос</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SolutionView;