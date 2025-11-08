import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Table, Container, Row, Col, InputGroup } from 'react-bootstrap';

const SolutionView = ({ nodes, edges, tableData, setResult, result, selectedColumns, setSelectedColumns }) => {
  const [selectedTable, setSelectedTable] = useState('');
  const [conditions, setConditions] = useState([]);
  const [joinTables, setJoinTables] = useState([]);
  const [executionCount, setExecutionCount] = useState(0);

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

  // Выполнение запроса
  const executeQuery = () => {
    if (!selectedTable) return;
    
    console.log("Выполнение запроса, счетчик:", executionCount);

    
    // Фильтрация данных (упрощенная реализация)
    const filteredData = (tableData[selectedTable] || []).filter(row => {
      return conditions.every(cond => {
        if (!cond.column || !cond.value) return true; // Пропускаем пустые условия
        
        const value = row[cond.column];
        switch (cond.operator) {
          case '=': return value == cond.value;
          case '>': return value > cond.value;
          case '<': return value < cond.value;
          case 'LIKE': return value && value.toString().includes(cond.value);
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
    
    console.log("Результат запроса:", resultData.length, "строк");
    setResult(resultData);
    setExecutionCount(prev => prev + 1);
  };

  // Добавление условия
  const addCondition = () => {
    setConditions([...conditions, { column: '', operator: '=', value: '' }]);
  };

  // Обработчик изменения выбранной таблицы
  const handleTableChange = (tableName) => {
    setSelectedTable(tableName);
    setConditions([]);
    // Автоматически выбираем все столбцы при смене таблицы
    if (tableName) {
      const table = tables.find(t => t.name === tableName);
      if (table) {
        setSelectedColumns([...table.columns]);
      }
    } else {
      setSelectedColumns([]);
    }
  };

  // Обработчик изменения выбранных столбцов
  const handleColumnToggle = (column, isChecked) => {
    if (isChecked) {
      setSelectedColumns([...selectedColumns, column]);
    } else {
      setSelectedColumns(selectedColumns.filter(c => c !== column));
    }
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
                  onChange={(e) => handleTableChange(e.target.value)}
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
                    {tables.find(t => t.name === selectedTable)?.columns.map(col => (
                      <Form.Check
                        key={col}
                        type="checkbox"
                        label={col}
                        checked={selectedColumns.includes(col)}
                        onChange={(e) => handleColumnToggle(col, e.target.checked)}
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
                          {tables.find(t => t.name === selectedTable)?.columns.map(col => (
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

                  <div className="d-grid gap-2">
                    <Button 
                      variant="primary" 
                      onClick={executeQuery}
                      disabled={selectedColumns.length === 0}
                    >
                      Выполнить запрос (вызовов: {executionCount})
                    </Button>
                    
                    {/* Отладочная информация */}
                    <div className="small text-muted mt-2">
                      <div>Таблица: {selectedTable}</div>
                      <div>Столбцов выбрано: {selectedColumns.length}</div>
                      <div>Условий: {conditions.length}</div>
                    </div>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card className="h-100">
            <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center">
              <h5>Результат</h5>
              <small>Строк: {result.length}</small>
            </Card.Header>
            <Card.Body className="overflow-auto">
              {result.length > 0 ? (
                <>
                  <div className="mb-3">
                    <small className="text-muted">
                      SQL: <code>{generateSolutionSQL()}</code>
                    </small>
                  </div>
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
                </>
              ) : (
                <div className="text-center text-muted p-5">
                  <i className="bi bi-table fs-1"></i>
                  <p>Выберите таблицу и настройте запрос</p>
                  {selectedTable && selectedColumns.length === 0 && (
                    <p className="text-warning">Выберите хотя бы один столбец</p>
                  )}
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