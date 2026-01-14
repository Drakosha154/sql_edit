import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Modal
} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import "bootstrap-icons/font/bootstrap-icons.css";
import DatabaseVisualPreview from '../components/DatabaseVisualPreview';
import { csvToJson } from '../utils/csvToJson';

const API_BASE_URL = process.env.REACT_APP_API_URL;

// Хук для отслеживания активности окна
const useWindowActivity = () => {
  const [isWindowActive, setIsWindowActive] = useState(true);
  const [inactiveTime, setInactiveTime] = useState(0);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [tabSwitches, setTabSwitches] = useState(0);

  const handleActivity = useCallback(() => {
    setIsWindowActive(true);
    setLastActivity(Date.now());
    setInactiveTime(0);
  }, []);

  useEffect(() => {
    const events = [
      'mousedown', 'mousemove', 'keydown', 'scroll', 
      'touchstart', 'click', 'input', 'focus'
    ];

    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsWindowActive(false);
        setTabSwitches(prev => prev + 1);
      } else {
        handleActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const interval = setInterval(() => {
      if (isWindowActive) {
        const currentTime = Date.now();
        const diff = Math.floor((currentTime - lastActivity) / 1000);
        
        if (diff > 5) {
          setIsWindowActive(false);
        }
        setInactiveTime(diff);
      }
    }, 1000);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [handleActivity, isWindowActive, lastActivity]);

  return { isWindowActive, inactiveTime, tabSwitches };
};

export default function Resolve() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [tableData, setTableData] = useState({});
  const [importError, setImportError] = useState(null);
  const [taskDescription, setTaskDescription] = useState('');
  const [solutionCode, setSolutionCode] = useState(''); // Будет установлено при загрузке
  const [hasExistingSolution, setHasExistingSolution] = useState(false);
  const [result, setResult] = useState([]);
  const [resultSolution, setResultSolution] = useState(null);
  const [columnsResult, setColumnsResult] = useState([]);
  const [userColumnsResult, setUserColumnsResult] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [idDatabase, setIdDatabase] = useState('');
  const [taskName, setTaskName] = useState('');
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Новые состояния для системы контроля
  const [copyCount, setCopyCount] = useState(0);
  const [pasteCount, setPasteCount] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const textareaRef = useRef(null);
  
  // Используем хук активности
  const { isWindowActive, inactiveTime, tabSwitches } = useWindowActivity();

  const { id } = useParams();

  // Отслеживание копирования/вставки
  useEffect(() => {
    const handleCopy = (e) => {
      if (textareaRef.current && textareaRef.current.contains(e.target)) {
        setCopyCount(prev => prev + 1);
        setWarningMessage('Копирование SQL кода запрещено!');
        setShowWarningModal(true);
        e.preventDefault();
      }
    };

    const handlePaste = (e) => {
      if (textareaRef.current && textareaRef.current.contains(e.target)) {
        setPasteCount(prev => prev + 1);
        setWarningMessage('Вставка SQL кода запрещена!');
        setShowWarningModal(true);
        e.preventDefault();
      }
    };

    const handleCut = (e) => {
      if (textareaRef.current && textareaRef.current.contains(e.target)) {
        setWarningMessage('Вырезание текста запрещено!');
        setShowWarningModal(true);
        e.preventDefault();
      }
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
    };
  }, []);

  // Запрет контекстного меню
  useEffect(() => {
    const handleContextMenu = (e) => {
      if (textareaRef.current && textareaRef.current.contains(e.target)) {
        e.preventDefault();
        setWarningMessage('Контекстное меню отключено в редакторе SQL');
        setShowWarningModal(true);
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // Сброс времени при изменении задачи
  useEffect(() => {
    setStartTime(Date.now());
  }, [id]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        
        console.log(`Загрузка данных для задачи ID: ${id}`);
        
        // 1. Получаем задание
        const taskResponse = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!taskResponse.ok) {
          throw new Error(`Ошибка загрузки задачи: ${taskResponse.status}`);
        }
        
        const taskData = await taskResponse.json();
        console.log("Данные задачи:", taskData);
        
        setIdDatabase(taskData.id_database);
        setTaskName(taskData.name || 'Без названия');
        setTaskDescription(taskData.description || '');

        // 2. Загружаем базу данных если есть
        if (taskData.id_database) {
          const dbResponse = await fetch(`${API_BASE_URL}/api/databases/${taskData.id_database}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (dbResponse.ok) {
            const dbData = await dbResponse.json();
            console.log("Данные БД:", dbData);
            
            // Загружаем схему и данные
            if (dbData.schema) {
              handleImportSQL(dbData.schema);
            }
            if (dbData.data) {
              handleImportSQLInsert(dbData.data);
            }
            if (dbData.decision) {
              try {
                const resultData = csvToJson(dbData.decision);
                setResult(resultData);
              } catch (error) {
                console.error("Ошибка преобразования CSV:", error);
              }
            }
          }
        }

        // 3. Пытаемся получить сохраненное решение пользователя
        try {
          console.log("Пытаемся получить сохраненное решение...");
          const solutionResponse = await fetch(`${API_BASE_URL}/api/get-solution/${id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (solutionResponse.ok) {
            const solutionData = await solutionResponse.json();
            console.log("Данные решения:", solutionData);
            
            if (solutionData && solutionData.decision_sql !== undefined) {
              // Устанавливаем сохраненное решение
              setSolutionCode(solutionData.decision_sql || '');
              setHasExistingSolution(true);
              
              // Если решение уже было верным, сразу показываем результат
              if (solutionData.IsCorrect) {
                // Загружаем результат проверки для показа
                await loadExistingSolutionResult(id, solutionData.decision_sql);
              }
            } else {
              // Нет сохраненного решения
              setSolutionCode('');
              setHasExistingSolution(false);
            }
          } else {
            // Решение не найдено - нормальная ситуация
            setSolutionCode('');
            setHasExistingSolution(false);
          }
        } catch (solutionError) {
          console.warn("Ошибка при получении решения:", solutionError);
          setSolutionCode('');
          setHasExistingSolution(false);
        }

      } catch (error) {
        console.error("Критическая ошибка загрузки:", error);
        setImportError(`Ошибка загрузки данных: ${error.message}`);
        setSolutionCode('');
      } finally {
        setIsLoading(false);
        setInitialLoadComplete(true);
      }
    };
    
    fetchAllData(); 
  }, [id]);

  // Функция для загрузки результата существующего решения
  const loadExistingSolutionResult = async (taskId, solutionSQL) => {
    try {
      setIsChecking(true);
      
      const response = await fetch(`${API_BASE_URL}/api/check-solution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          solution_sql: solutionSQL,
          task_id: parseInt(taskId),
          metadata: {
            isWindowActive: true,
            copyCount: 0,
            pasteCount: 0,
            timeSpent: 0,
            tabSwitches: 0
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResultSolution(data);

        if (data.user_result && data.user_result.length > 0) {
          const userColumns = Object.keys(data.user_result[0]);
          setUserColumnsResult(userColumns);
        }
        
        if (data.expected_result && data.expected_result.length > 0) {
          const columns = Object.keys(data.expected_result[0]);
          setColumnsResult(columns);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки существующего решения:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const checkSolution = async () => {
    // Проверяем, что solutionCode существует и не пустая
    const trimmedSolution = solutionCode ? solutionCode.trim() : '';
    if (!trimmedSolution) {
      setWarningMessage('Решение не может быть пустым!');
      setShowWarningModal(true);
      return;
    }
    
    // Проверяем активность окна перед отправкой
    if (!isWindowActive) {
      setWarningMessage('Нельзя отправить решение из неактивного окна. Вернитесь на вкладку и подождите 5 секунд.');
      setShowWarningModal(true);
      return;
    }

    // Проверяем, не слишком ли быстро отправлено решение
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    if (timeSpent < 10 && copyCount === 0 && pasteCount === 0) {
      setWarningMessage('Решение отправлено слишком быстро. Убедитесь, что вы решали задачу самостоятельно.');
      setShowWarningModal(true);
    }

    setIsChecking(true);
    setResultSolution(null);

    try {
      // Собираем метаданные для проверки честности
      const metadata = {
        isWindowActive,
        copyCount,
        pasteCount,
        timeSpent,
        tabSwitches
      };

      const response = await fetch(`${API_BASE_URL}/api/check-solution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          solution_sql: solutionCode,
          task_id: parseInt(id),
          metadata: metadata
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Ошибка проверки');
      }

      setResultSolution(data);
      setHasExistingSolution(true); // Теперь у пользователя есть сохраненное решение

      if (data.user_result && data.user_result.length > 0) {
        const userColumns = Object.keys(data.user_result[0]);
        setUserColumnsResult(userColumns);
      }
      
      if (data.expected_result && data.expected_result.length > 0) {
        const columns = Object.keys(data.expected_result[0]);
        setColumnsResult(columns);
      }

      setImportError('');

    } catch (error) {
      console.error('Ошибка проверки:', error);
      setImportError(error.message);
    } finally {
      setIsChecking(false);
    }
  };

  const handleImportSQL = (sql) => {
    try {
      if (!sql) return;
      
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
    } catch (error) {
      console.error("Ошибка парсинга SQL:", error);
      setImportError(error.message);
    }
  };

  const handleImportSQLInsert = (sql) => {
    try {
      if (!sql) return;
      
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
      setImportError(null);
    } catch (error) {
      console.error("Ошибка парсинга INSERT SQL:", error);
      setImportError(error.message);
    }
  };

  const formatTaskDescription = (text) => {
    if (!text) return null;
    
    return text.split('\n').map((line, index) => {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) return null;
      
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

  // Функция очистки решения
  const clearSolution = () => {
    setSolutionCode('');
    setResultSolution(null);
    setHasExistingSolution(false);
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

  // Безопасное получение значения solutionCode
  const safeSolutionCode = solutionCode || '';

  return (
    <div className="overflow-x-hidden">
      <Container className="py-4 overflow-auto">
        {/* Статус активности */}
        <Alert 
          variant={isWindowActive ? "success" : "warning"} 
          className="mb-3 d-flex align-items-center"
        >
          <i className={`bi ${isWindowActive ? "bi-check-circle" : "bi-exclamation-triangle"} me-2`}></i>
          <div>
            <strong>Статус:</strong> {isWindowActive ? '✅ Активен' : '⚠️ Неактивен'}
            {!isWindowActive && ` (${inactiveTime} сек без активности)`}
          </div>
          <div className="ms-auto">
            <small className="text-muted">
              <i className="bi bi-clipboard me-1"></i>Копирования: {copyCount} |
              <i className="bi bi-clipboard-plus ms-2 me-1"></i>Вставки: {pasteCount} |
              <i className="bi bi-window-dock ms-2 me-1"></i>Смен вкладок: {tabSwitches}
            </small>
          </div>
        </Alert>

        <Row>
          <Col>
            <Card>
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0 d-flex align-items-center">
                  <i className="bi bi-database me-2"></i>
                  <span>Решение задания "{taskName}"</span>
                  {hasExistingSolution && (
                    <Badge bg="info" className="ms-2">
                      <i className="bi bi-save me-1"></i> Есть сохраненное решение
                    </Badge>
                  )}
                  {(!isWindowActive || copyCount > 0 || pasteCount > 0) && (
                    <Badge bg="warning" className="ms-2">
                      <i className="bi bi-shield-exclamation"></i> Контроль активирован
                    </Badge>
                  )}
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
                {nodes.length > 0 && (
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
                )}

                {/* Редактор решения с защитой */}
                <div className="solution-section mb-4">
                  <div className="d-flex align-items-center mb-3">
                    <Badge bg="success" className="me-2">
                      <i className="bi bi-code-slash"></i>
                    </Badge>
                    <h4 className="mb-0">Ваше решение</h4>
                    <div className="ms-auto">
                      <small className="text-muted">
                        <i className="bi bi-clock me-1"></i>
                        Время решения: {Math.floor((Date.now() - startTime) / 1000)} сек
                        {hasExistingSolution && (
                          <span className="ms-2">
                            <i className="bi bi-save me-1"></i> Решение сохранено
                          </span>
                        )}
                      </small>
                    </div>
                  </div>
                  
                  {hasExistingSolution && (
                    <Alert variant="info" className="mb-3">
                      <i className="bi bi-info-circle me-2"></i>
                      У вас есть сохраненное решение этой задачи. Вы можете отредактировать его или отправить на проверку заново.
                    </Alert>
                  )}
                  
                  <Alert variant="info" className="mb-3">
                    <i className="bi bi-info-circle me-2"></i>
                    <strong>Система контроля активирована:</strong> копирование и вставка SQL кода запрещены.
                    {!isWindowActive && " Окно должно быть активным для отправки решения."}
                  </Alert>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <strong>SQL запрос:</strong>
                      {copyCount > 0 && (
                        <Badge bg="danger" className="ms-2">
                          Попыток копирования: {copyCount}
                        </Badge>
                      )}
                      {pasteCount > 0 && (
                        <Badge bg="danger" className="ms-2">
                          Попыток вставки: {pasteCount}
                        </Badge>
                      )}
                      {hasExistingSolution && (
                        <Badge bg="info" className="ms-2">
                          <i className="bi bi-save me-1"></i> Сохранено
                        </Badge>
                      )}
                    </Form.Label>
                    <Form.Control
                      ref={textareaRef}
                      as="textarea"
                      rows={6}
                      value={safeSolutionCode}
                      onChange={(e) => setSolutionCode(e.target.value)}
                      placeholder="-- Введите ваше SQL решение здесь...
-- Например: SELECT * FROM table_name WHERE condition;
-- Копирование и вставка отслеживаются!"
                      style={{ fontFamily: 'monospace' }}
                      disabled={!isWindowActive}
                    />
                    <Form.Text className="text-muted">
                      {!isWindowActive ? (
                        <span className="text-danger">
                          <i className="bi bi-exclamation-triangle me-1"></i>
                          Окно неактивно. Вернитесь на вкладку для продолжения.
                        </span>
                      ) : (
                        'Решайте задачу самостоятельно. Все действия отслеживаются.'
                      )}
                    </Form.Text>
                  </Form.Group>

                  <div className="d-flex gap-2">
                    <Button 
                      variant="success" 
                      onClick={checkSolution}
                      disabled={isChecking || !safeSolutionCode.trim() || !isWindowActive}
                      className="flex-grow-1"
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
                          {!isWindowActive ? 'Ожидание активности...' : 'Проверить решение'}
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      variant="outline-secondary"
                      onClick={clearSolution}
                      disabled={!safeSolutionCode.trim() || !isWindowActive}
                    >
                      <i className="bi bi-x-circle me-2"></i>
                      {hasExistingSolution ? 'Удалить сохраненное' : 'Очистить'}
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
                        {resultSolution.is_suspicious && (
                          <Badge bg="warning" className="ms-2">
                            <i className="bi bi-shield-exclamation me-1"></i> Подозрительная активность
                          </Badge>
                        )}
                      </h4>
                    </div>

                    {resultSolution.message && (
                      <Alert variant={resultSolution.success ? "success" : "warning"}>
                        <i className="bi bi-info-circle me-2"></i>
                        {resultSolution.message}
                      </Alert>
                    )}

                    {/* Статистика решения из метаданных */}
                    {resultSolution.metadata_stats && (
                      <Alert variant="secondary" className="mb-3">
                        <h6 className="mb-2">
                          <i className="bi bi-graph-up me-2"></i>
                          Статистика решения:
                        </h6>
                        <div className="row small">
                          <div className="col-md-3">
                            <i className="bi bi-clock me-1"></i> Время: {resultSolution.metadata_stats.timeSpent} сек
                          </div>
                          <div className="col-md-3">
                            <i className="bi bi-clipboard me-1"></i> Копирования: {resultSolution.metadata_stats.copyCount}
                          </div>
                          <div className="col-md-3">
                            <i className="bi bi-clipboard-plus me-1"></i> Вставки: {resultSolution.metadata_stats.pasteCount}
                          </div>
                          <div className="col-md-3">
                            <i className="bi bi-window-dock me-1"></i> Смен вкладок: {resultSolution.metadata_stats.tabSwitches}
                          </div>
                        </div>
                      </Alert>
                    )}

                    {resultSolution.success && resultSolution.user_result && resultSolution.user_result.length > 0 && (
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

                    {!resultSolution.success && resultSolution.user_result && (
                      <div className="mt-4 d-flex flex-column flex-md-row">
                        <div className="mt-4 border w-100 me-md-2 mb-3 mb-md-0">
                          <h5 className="m-2">
                            <i className="bi bi-lightbulb me-2"></i>
                            Ваш результат:
                          </h5>
                          <div className="p-2">
                          {resultSolution.user_result.length > 0 ? (
                          <div className="table-responsive">
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
                          </div>
                          ) : (
                            <div className="text-center py-3 text-muted">
                              <i className="bi bi-inbox me-2"></i>
                              Нет данных для отображения
                            </div>
                          )}
                          </div>
                        </div>
                        {resultSolution.expected_result && resultSolution.expected_result.length > 0 && (
                          <div className="mt-4 border w-100 ms-md-2">
                            <h5 className="m-2">
                              <i className="bi bi-lightbulb-fill me-2"></i>
                              Ожидаемый результат:
                            </h5>
                            <div className="p-2">
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
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Модальное окно для предупреждений */}
      <Modal show={showWarningModal} onHide={() => setShowWarningModal(false)}>
        <Modal.Header closeButton className="bg-warning text-dark">
          <Modal.Title>
            <i className="bi bi-exclamation-triangle me-2"></i>
            Предупреждение системы контроля
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{warningMessage}</p>
          <div className="alert alert-info mb-0">
            <i className="bi bi-info-circle me-2"></i>
            Все ваши действия отслеживаются для обеспечения честности выполнения заданий.
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="warning" onClick={() => setShowWarningModal(false)}>
            Понятно
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}