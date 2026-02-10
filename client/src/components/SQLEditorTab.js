// components/SQLEditorTab.js
import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Card, Alert } from 'react-bootstrap';
import MonacoEditor from '@monaco-editor/react';

const SQLEditorTab = ({ 
  nodes, 
  setResult, 
  setSelectedColumns,
  selectedColumns,
  onSQLExecute 
}) => {
  const [sqlQuery, setSqlQuery] = useState('');
  const [queryResult, setQueryResult] = useState([]);
  const [error, setError] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  
  // Пример данных для имитации базы данных
  const [mockData] = useState(() => {
    const data = {};
    nodes.forEach(node => {
      data[node.data.label] = [
        // Добавьте здесь тестовые данные или оставьте пустой массив
      ];
    });
    return data;
  });

  // Функция выполнения SQL запроса
  const executeSQL = async () => {
    if (!sqlQuery.trim()) {
      setError('Введите SQL запрос');
      return;
    }

    setIsExecuting(true);
    setError(null);

    try {
      // Здесь должна быть реальная логика выполнения SQL
      // Для демо используем имитацию
      
      // Если есть переданная функция для выполнения
      if (onSQLExecute) {
        const result = await onSQLExecute(sqlQuery);
        setQueryResult(result);
        
        if (result && result.length > 0) {
          const columns = Object.keys(result[0]);
          setSelectedColumns(columns);
          setResult(result);
        }
      } else {
        // Имитация выполнения
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Создаем тестовые результаты на основе структуры таблиц
        const mockResult = nodes.slice(0, 2).map((node, index) => {
          const row = {};
          node.data.attributes.forEach((attr, attrIndex) => {
            // Генерируем тестовые данные в зависимости от типа
            switch(attr.type?.toLowerCase()) {
              case 'integer':
                row[attr.name] = index + attrIndex + 1;
                break;
              case 'string':
              case 'text':
              case 'varchar':
                row[attr.name] = `Тест ${index + 1} - ${attr.name}`;
                break;
              case 'boolean':
                row[attr.name] = index % 2 === 0;
                break;
              case 'timestamp':
                row[attr.name] = new Date().toISOString();
                break;
              default:
                row[attr.name] = `Значение ${attrIndex + 1}`;
            }
          });
          return row;
        });
        
        setQueryResult(mockResult);
        
        if (mockResult.length > 0) {
          const columns = Object.keys(mockResult[0]);
          setSelectedColumns(columns);
          setResult(mockResult);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsExecuting(false);
    }
  };

  // Функция для очистки результатов
  const clearResults = () => {
    setQueryResult([]);
    setResult([]);
    setSelectedColumns([]);
    setError(null);
  };

  return (
    <div className="h-100 d-flex flex-column">
      <Card className="flex-grow-1 d-flex flex-column">
        <Card.Header>
          <h5 className="mb-0">
            <i className="bi bi-code-slash me-2"></i>
            SQL Редактор
          </h5>
        </Card.Header>
        
        <Card.Body className="d-flex flex-column flex-grow-1 p-0">
          {/* Редактор SQL */}
          <div className="flex-grow-1 border-bottom">
            <div className="p-3 bg-light border-bottom">
              <Row className="align-items-center">
                <Col>
                  <h6 className="mb-0">Введите SQL запрос для проверки решения:</h6>
                </Col>
                <Col xs="auto">
                  <Button 
                    size="sm" 
                    variant="outline-secondary"
                    onClick={() => setSqlQuery('SELECT * FROM таблица LIMIT 10;')}
                    className="me-2"
                  >
                    Пример
                  </Button>
                </Col>
              </Row>
            </div>
            
            <div style={{ height: '300px' }}>
              <MonacoEditor
                language="sql"
                value={sqlQuery}
                onChange={setSqlQuery}
                theme="vs-light"
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  wordWrap: 'on',
                  automaticLayout: true,
                }}
              />
            </div>
          </div>
          
          {/* Кнопки действий */}
          <div className="p-3 border-bottom bg-light">
            <Row className="g-2">
              <Col>
                <Button 
                  variant="primary" 
                  onClick={executeSQL}
                  disabled={isExecuting || !sqlQuery.trim()}
                >
                  {isExecuting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Выполнение...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-play-fill me-2"></i>
                      Выполнить запрос
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline-secondary" 
                  onClick={clearResults}
                  className="ms-2"
                  disabled={queryResult.length === 0}
                >
                  <i className="bi bi-trash me-2"></i>
                  Очистить результаты
                </Button>
              </Col>
            </Row>
            
            {error && (
              <Alert variant="danger" className="mt-2 mb-0">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
              </Alert>
            )}
          </div>
          
          {/* Результаты выполнения */}
          <div className="flex-grow-1 p-3">
            <h6>
              Результаты выполнения:
              {queryResult.length > 0 && (
                <Badge bg="info" className="ms-2">
                  {queryResult.length} строк
                </Badge>
              )}
            </h6>
            
            {queryResult.length > 0 ? (
              <div className="table-responsive mt-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <table className="table table-sm table-striped">
                  <thead>
                    <tr className="bg-light">
                      {selectedColumns.map((col, index) => (
                        <th key={index}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResult.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {selectedColumns.map((col, colIndex) => (
                          <td key={colIndex}>
                            {row[col] !== null && row[col] !== undefined 
                              ? String(row[col]) 
                              : <span className="text-muted">NULL</span>
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-muted py-4">
                <i className="bi bi-table display-4"></i>
                <p className="mt-2">Результаты запроса появятся здесь</p>
              </div>
            )}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default SQLEditorTab;