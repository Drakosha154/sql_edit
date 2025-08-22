import React, { useState, useEffect, } from 'react';
import { useParams } from 'react-router-dom';
import { parseSQL } from '../utils/sqlParser';
import { parseInsertSQL } from '../utils/sqlInsertParser'
import { 
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Table,
  Tabs,
  Tab,
  Modal
} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import "bootstrap-icons/font/bootstrap-icons.css";
import DatabaseVisualPreview from '../components/DatabaseVisualPreview'
import { csvToJson } from '../utils/csvToJson'

export default function Resolve() {
const [nodes, setNodes] = useState([]);
const [edges, setEdges] = useState([]);
const [tableData, setTableData] = useState([]);
const [sqlCode, setSqlCode] = useState('');
const [showImportModal, setShowImportModal] = useState(false);
const [importError, setImportError] = useState(null);
const [taskDescription, setTaskDescription] = useState('');
const [solutionCode, setSolutionCode] = useState('');
const [result, setResult] = useState([]);
const [resultSolution, setresultSolution] = useState([]);
const [columnsResult, setColumnsResult] = useState([]);
const [checkResult, setCheckResult] = useState(null);
const [isChecking, setIsChecking] = useState(false);

    const { id } = useParams();
    
    useEffect(() => {
    const fetchUserDatabases = async () => {
            try {
              const response = await fetch(`http://localhost:8080/api/databases/${id}`, {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              });
            
            // Проверяем, что ответ JSON
              const contentType = response.headers.get('content-type');
              if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error(`Ожидался JSON, но получен: ${text.substring(0, 100)}...`);
              }
            
            const data = await response.json();
              handleImportSQL(data.schema);
              handleImportSQLInsert(data.data);
              setTaskDescription(data.task);

              const resultData = csvToJson(data.decision);
              setResult(resultData)

        } catch (error) {
              console.error("Ошибка загрузки:", error);
              alert("Ошибка загрузки: " + error.message);
            }
    };
    fetchUserDatabases();  
}, []);

const checkSolution = async () => {

  setIsChecking(true);
  setCheckResult(null);

  try {
    const response = await fetch('http://localhost:8080/api/check-solution', {
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

    const columns = Object.keys(data.user_result[0]);

    setresultSolution(data);
    setColumnsResult(columns)

    if (!response.ok) {
      throw new Error(data.error || data.details || 'Ошибка проверки');
    }

    setCheckResult(data);

  } catch (error) {
    console.error('Ошибка проверки:', error);
  } finally {
    setIsChecking(false);
  }
};

const handleImportSQL = (sql = sqlCode) => {
    try {
      const parsedData = parseSQL(sql); // Парсим SQL
      
      // Создаем узлы для таблиц
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

      // Создаем связи между таблицами
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
        // Объединяем существующие данные с новыми для каждой таблицы
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

  return (
    <Container className="py-4 h-100 overflow-hidden">
      <Row className="h-100">
        <Col className="h-100">
          <Card className="h-100">
            <Card.Header className="bg-dark text-white">
              <h5>Предпросмотр задания</h5>
            </Card.Header>
            <Card.Body className="overflow-auto">
              <div className="task-preview">
                <h3>SQL Задание</h3>
                <div className="task-description mb-4">
                  {taskDescription || (
                    <div className="text-muted">
                      <i className="bi bi-info-circle"></i> Условие задачи не заполнено
                    </div>
                  )}
                </div>
                
                <h4>Схема базы данных</h4>
                <div className="schema-preview mb-4 p-3 border rounded">
                  <DatabaseVisualPreview nodes={nodes} edges={edges} setNodes={setNodes}/>
                </div>
                
                <h4>Редактор запросов</h4>
                <div className="mt-3">
                    <Form.Label>Решение (SQL)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={6}
                      value={solutionCode}
                      onChange={(e) => setSolutionCode(e.target.value)}
                      placeholder="-- Введите решение..."
                    />
                </div>
                
                <div className="mt-3 d-flex justify-content-between">
                  <Button variant="success" onClick={checkSolution}>
                    <i className="bi bi-check-circle"></i> Проверить решение
                  </Button>
                  {/*<Button variant="outline-secondary">
                    <i className="bi bi-question-circle"></i> Подсказка
                  </Button>*/}
                </div>
                {resultSolution.success ? (
                <div className="mt-4 p-3 border rounded">
                  <div className="">
                    <div className="d-flex justify-content-center">
                      <h5>Успешно!!!</h5>
                    </div>
                    <div className="d-flex justify-content-center">
                      <h5>Результат выполнения запроса:</h5>
                    </div>
                    <div>
                      <Table striped bordered hover className="mb-0">
                        <thead>
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
                                    : 'N/A'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </div>

                </div>
                ) : (
                  <h5>Пока что не решена(</h5>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}