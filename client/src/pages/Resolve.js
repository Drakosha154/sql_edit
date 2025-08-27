import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { parseSQL } from '../utils/sqlParser';
import { parseInsertSQL } from '../utils/sqlInsertParser';
import { 
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Table,
  Alert,
  Badge,
  Spinner,
  Tabs,
  Tab
} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import "bootstrap-icons/font/bootstrap-icons.css";
import DatabaseVisualPreview from '../components/DatabaseVisualPreview';
import { csvToJson } from '../utils/csvToJson';

const API_BASE_URL = process.env.REACT_APP_API_URL

export default function Resolve() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [activeTab, setActiveTab] = useState('result');
  const [sqlCode, setSqlCode] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importError, setImportError] = useState(null);
  const [taskDescription, setTaskDescription] = useState('');
  const [solutionCode, setSolutionCode] = useState('');
  const [result, setResult] = useState([]);
  const [resultSolution, setResultSolution] = useState(null);
  const [columnsResult, setColumnsResult] = useState([]);
  const [userColumnsResult, setUserColumnsResult] = useState([]);
  const [checkResult, setCheckResult] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { id } = useParams();
  
  useEffect(() => {
    const fetchUserDatabases = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/databases/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          throw new Error(`Ожидался JSON, но получен: ${text.substring(0, 100)}...`);
        }

        const data = await response.json();
        handleImportSQL(data.schema);
        handleImportSQLInsert(data.data);
        setTaskDescription(data.task);

        if (data.decision) {
          const resultData = csvToJson(data.decision);
          setResult(resultData);
        }

      } catch (error) {
        console.error("Ошибка загрузки:", error);
        setImportError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserDatabases();  
  }, [id]);

  useEffect(() => {
    const fetchUserDatabases = async () => {
      try {
      const response = await fetch(`${API_BASE_URL}/api/get-solution/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        setSolutionCode(data.DecisionSQL)

      } catch (error) {
        console.error("Ошибка загрузки:", error);
      } finally {
      }
    };
    
    fetchUserDatabases();  
  }, [id]);

  const checkSolution = async () => {
    setIsChecking(true);
    setCheckResult(null);
    setResultSolution(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/check-solution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          solution_sql: solutionCode,
          task_id: parseInt(id)
        })
      });

      const data = await response.json();

      console.log(data)
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Ошибка проверки');
      }

      setResultSolution(data);

      const userColumns = Object.keys(data.user_result[0]);
      setUserColumnsResult(userColumns);
      
      const columns = Object.keys(data.expected_result[0]);
      setColumnsResult(columns);

      setCheckResult(data);
      setImportError('');

    } catch (error) {
      console.error('Ошибка проверки:', error);
      setImportError(error.message);
    } finally {
      setIsChecking(false);
    }
  };

  const handleImportSQL = (sql = sqlCode) => {
    try {
      const parsedData = parseSQL(sql);
      
      const newNodes = parsedData.tables.map(table => ({
        id: table.name,
        type: 'entity',
        position: { x: Math.random() * 500, y: Math.random() * 500 },
        data: {
          label: table.name,
          attributes: table.columns.map(col => ({
            id: `${table.name}-${col.name}`,
            name: col.name,
            type: col.type,
            isPrimary: col.isPrimary,
            isNullable: col.isNullable
          }))
        }
      }));

      const newEdges = parsedData.foreignKeys.map(fk => ({
        id: `edge-${fk.fromTable}-${fk.fromColumn}-${fk.toTable}-${fk.toColumn}`,
        source: fk.fromTable,
        target: fk.toTable,
        sourceHandle: `${fk.fromTable}-${fk.fromColumn}`,
        targetHandle: `${fk.toTable}-${fk.toColumn}`,
        type: 'custom',
        data: {
          relationType: 'one-to-many',
          label: '1:N',
          sourceLabel: fk.fromTable,
          targetLabel: fk.toTable,
          sourceAttr: fk.fromColumn,
          targetAttr: fk.toColumn
        }
      }));

      setNodes(newNodes);
      setEdges(newEdges);
      setShowImportModal(false);
      setSqlCode('');
    } catch (error) {
      setImportError(error.message);
    }
  };

  const handleImportSQLInsert = (sql) => {
    try {
      const parsedData = parseInsertSQL(sql);
      const updatedTableData = { ...tableData };
      
      for (const tableName in parsedData) {
        if (parsedData.hasOwnProperty(tableName)) {
          updatedTableData[tableName] = [
            ...(updatedTableData[tableName] || []),
            ...parsedData[tableName]
          ];
        }
      }
      
      setTableData(updatedTableData);
      setSqlCode('');
      setShowImportModal(false);
      setImportError(null);
    } catch (error) {
      setImportError(error.message);
    }
  };

  // Функция для форматирования текста условия задачи
  const formatTaskDescription = (text) => {
    if (!text) return null;
    
    // Разделяем текст на строки и обрабатываем каждую
    return text.split('\n').map((line, index) => {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) return null;
      
      // Определяем тип строки по начальным символам
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ')) {
        return (
          <li key={index} className="mb-1">
            {trimmedLine.substring(2)}
          </li>
        );
      } else if (trimmedLine.match(/^\d+[\.\)]/)) {
        return (
          <li key={index} className="mb-1">
            {trimmedLine}
          </li>
        );
      } else if (trimmedLine.startsWith('===') || trimmedLine.startsWith('---')) {
        return <hr key={index} className="my-3" />;
      } else if (trimmedLine.endsWith(':')) {
        return (
          <strong key={index} className="d-block mb-2 mt-3">
            {trimmedLine}
          </strong>
        );
      } else {
        return (
          <p key={index} className="mb-2">
            {trimmedLine}
          </p>
        );
      }
    });
  };

  if (isLoading) {
    return (
      <Container className="py-4 d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <div class="overflow-x-hidden">
    <Container className="py-4 overflow-auto">
      <Row>
        <Col>
          <Card>
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">
                <i className="bi bi-database me-2"></i>
                Решение задания #{id}
              </h5>
            </Card.Header>
            
            <Card.Body>
              {/* Условие задачи */}
              <div className="task-section mb-4">
                <div className="d-flex align-items-center mb-3">
                  <Badge bg="info" className="me-2">
                    <i className="bi bi-question-circle"></i>
                  </Badge>
                  <h4 className="mb-0">Условие задачи</h4>
                </div>
                
                <Alert variant="light" className="border">
                  {taskDescription ? (
                    <div className="task-description">
                      {formatTaskDescription(taskDescription)}
                    </div>
                  ) : (
                    <div className="text-muted text-center py-3">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      Условие задачи не заполнено
                    </div>
                  )}
                </Alert>
              </div>

              {/* Схема базы данных */}
              <div className="schema-section mb-4">
                <div className="d-flex align-items-center mb-3">
                  <Badge bg="secondary" className="me-2">
                    <i className="bi bi-diagram-3"></i>
                  </Badge>
                  <h4 className="mb-0">Схема базы данных</h4>
                </div>
                
                <Card className="border">
                  <Card.Body className="p-3">
                    <DatabaseVisualPreview 
                      nodes={nodes} 
                      edges={edges} 
                      setNodes={setNodes}
                    />
                  </Card.Body>
                </Card>
              </div>

              {/* Редактор решения */}
              <div className="solution-section mb-4">
                <div className="d-flex align-items-center mb-3">
                  <Badge bg="success" className="me-2">
                    <i className="bi bi-code-slash"></i>
                  </Badge>
                  <h4 className="mb-0">Ваше решение</h4>
                </div>
                
                <Form.Group className="mb-3">
                  <Form.Label>
                    <strong>SQL запрос:</strong>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={6}
                    value={solutionCode}
                    onChange={(e) => setSolutionCode(e.target.value)}
                    placeholder="-- Введите ваше SQL решение здесь...
-- Например: SELECT * FROM table_name WHERE condition;"
                    style={{ fontFamily: 'monospace' }}
                  />
                </Form.Group>

                <div className="d-flex gap-2">
                  <Button 
                    variant="success" 
                    onClick={checkSolution}
                    disabled={isChecking || !solutionCode.trim()}
                  >
                    {isChecking ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Проверка...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        Проверить решение
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline-secondary"
                    onClick={() => setSolutionCode('')}
                    disabled={!solutionCode.trim()}
                  >
                    <i className="bi bi-x-circle me-2"></i>
                    Очистить
                  </Button>
                </div>
              </div>

              {/* Результаты проверки */}
              {importError && (
                <Alert variant="danger" className="mb-3">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {importError}
                </Alert>
              )}

              {resultSolution && (
                <div className="result-section mt-4">
                  <div className="d-flex align-items-center mb-3">
                    <Badge 
                      bg={resultSolution.success ? "success" : "danger"} 
                      className="me-2"
                    >
                      <i className={`bi ${resultSolution.success ? "bi-check-circle" : "bi-x-circle"}`}></i>
                    </Badge>
                    <h4 className="mb-0">
                      {resultSolution.success ? "Решение верное!" : "Решение требует доработки"}
                    </h4>
                  </div>

                  {resultSolution.message && (
                    <Alert variant={resultSolution.success ? "success" : "warning"}>
                      <i className="bi bi-info-circle me-2"></i>
                      {resultSolution.message}
                    </Alert>
                  )}

                  {resultSolution.success && resultSolution.user_result && (
                    <>
                      <h5 className="mt-4 mb-3">
                        <i className="bi bi-table me-2"></i>
                        Результат выполнения запроса:
                      </h5>
                      
                      <div className="table-responsive">
                        <Table striped bordered hover className="mb-0">
                          <thead className="table-dark">
                            <tr>
                              {columnsResult.map((column, index) => (
                                <th key={index}>
                                  {column.toUpperCase()}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {resultSolution.user_result.map((row, rowIndex) => (
                              <tr key={rowIndex}>
                                {columnsResult.map((column, colIndex) => (
                                  <td key={colIndex}>
                                    {row[column] !== null && row[column] !== undefined 
                                      ? row[column].toString() 
                                      : <span className="text-muted">NULL</span>}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                      
                      <div className="mt-2 text-muted small">
                        Показано {resultSolution.user_result.length} строк
                      </div>
                    </>
                  )}

                  {!resultSolution.success && (
                    <div className="mt-4 d-flex">
                      <div className="mt-4 border w-50 me-2">
                        <h5 className="m-2">
                          <i className="bi bi-lightbulb me-2"></i>
                          Ваш результат:
                        </h5>
                        <div className="p-2">
                        {resultSolution.user_result && resultSolution.user_result.length > 0 ?(
                        <Table striped bordered hover className="mb-0">
                          <thead className="table-dark">
                            <tr>
                              {userColumnsResult.map((column, index) => (
                                <th key={index}>
                                  {column.toUpperCase()}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {resultSolution.user_result.map((row, rowIndex) => (
                              <tr key={rowIndex}>
                                {userColumnsResult.map((column, colIndex) => (
                                  <td key={colIndex}>
                                    {row[column] !== null && row[column] !== undefined 
                                      ? row[column].toString() 
                                      : <span className="text-muted">NULL</span>}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                        ) : (
                          <div className="text-center py-3 text-muted">
                            <i className="bi bi-inbox me-2"></i>
                            Нет данных для отображения
                          </div>
                        )}
                        </div>
                      </div>
                      <div className="mt-4 border w-50 ms-2">
                        <h5 className="m-2">
                          <i className="bi bi-lightbulb-fill me-2"></i>
                          Ожидаемый результат:
                        </h5>
                        <div className="p-2">
                        <Table striped bordered hover className="mb-0">
                          <thead className="table-dark">
                            <tr>
                          {columnsResult.map((column, index) => (
                                <th key={index}>
                                  {column.toUpperCase()}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {resultSolution.expected_result.map((row, rowIndex) => (
                              <tr key={rowIndex}>
                                {columnsResult.map((column, colIndex) => (
                                  <td key={colIndex}>
                                    {row[column] !== null && row[column] !== undefined 
                                      ? row[column].toString() 
                                      : <span className="text-muted">NULL</span>}
                                  </td>
                                ))}
                              </tr>
                            ))}
                            </tbody>
                          </Table>
                          </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
    </div>
  );
}