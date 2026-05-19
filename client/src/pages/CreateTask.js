import React, { useState, useEffect, useCallback} from 'react';
import {
  applyEdgeChanges,
  applyNodeChanges,
} from 'reactflow';

import 'reactflow/dist/style.css';

import { 
  Modal, 
  Button, 
  Form, 
  InputGroup,  
} from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { Tab, Nav } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import "bootstrap-icons/font/bootstrap-icons.css";
import './ERDEditor.css';

import TaskPreview from './TaskPreview';
import SolutionView from './SolutionView';
import TaskSaveButton from '../components/TaskSaveButton';
import TutorialButton from '../components/TutorialButton';
import { useTutorialAutoStart, startTutorialManually } from '../hooks/useTutorialAutoStart';
import { createTaskSteps } from '../config/tutorialSteps';
import { useTutorial } from '../components/TutorialContext';

import { parseSQL } from '../utils/sqlParser';
import { csvToJson } from '../utils/csvToJson';

const API_BASE_URL = process.env.REACT_APP_API_URL

export default function CreateTask() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [showDatabaseModal, setShowDatabaseModal] = useState(false);
  const [activeTab, setActiveTab] = useState('solution');
  const [tableData, setTableData] = useState([]);
  const [sqlCode, setSqlCode] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [result, setResult] = useState([]);
  const [selectedDatabase, setSelectedDatabase] = useState(null);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userDatabases, setUserDatabases] = useState([]);
  const [databaseId, setDatabaseId] = useState(0);
  const [sqlQuery, setSqlQuery] = useState('');
  const [generatedResults, setGeneratedResults] = useState(null);
  const { registerTabSwitcher, unregisterTabSwitcher } = useTutorial();


  const { id } = useParams();
  const tutorialContext = useTutorial();
  useTutorialAutoStart('createTask', createTaskSteps);

  useEffect(() => {
    const fetchUserTasks = async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
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
            console.log(data)


              setDatabaseId(data.id_database)
              handleImportSQL(data.create);
              handleImportSQLInsert(data.insert);
              setSelectedDatabase(data.nameDatabase);
              setTaskDescription(data.description);
              setSqlQuery(data.sqlQuery);

              const resultData = csvToJson(data.result);
              setResult(resultData)

              if (resultData && resultData.length > 0) {
                const columns = Object.keys(resultData[0]);
                setSelectedColumns(columns);
              }

        } catch (error) {
              console.error("Ошибка загрузки:", error);
              alert("Ошибка загрузки: " + error.message);
            }
    };
    fetchUserTasks();  
}, []);

  useEffect(() => {
      registerTabSwitcher('main', setActiveTab);
      return () => {
          unregisterTabSwitcher('main');
      };
  }, [registerTabSwitcher, unregisterTabSwitcher]);

const fetchSelectedDatabase = async (database) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/databases/${database.id}`, {
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

        } catch (error) {
              console.error("Ошибка загрузки:", error);
              alert("Ошибка загрузки: " + error.message);
            }
  }

useEffect(() => {
  if (id === undefined) {
    fetchUserDatabases();
    setShowDatabaseModal(true)
  }
}, [id]);

const fetchUserDatabases = async () => {
  setLoading(true);
  try {
    // Пример запроса - замени на свой endpoint
    const response = await fetch(`${API_BASE_URL}/api/getdatabases`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error('Ошибка загрузки баз данных');
    }
    const data = await response.json();

    const databases = data.databases || [];

    const validatedDatabases = databases.map(db => ({
      id: db.ID,
      name: db.Name || 'Без названия',
      //type: db.type || 'PostgreSQL',
      //tableCount: db.tableCount || 0,
      //sql: db.sql || '',
      createdAt: db.createdAt || new Date().toISOString()
    }));

    setUserDatabases(validatedDatabases);
  } catch (error) {
    console.error('Ошибка загрузки баз данных:', error);
  } finally {
    setLoading(false);
  }
};

const handleDatabaseSelect = (database) => {
  console.log(database)
  setDatabaseId(database.id);
  setSelectedDatabase(database.name);
  fetchSelectedDatabase(database);
  // Здесь можно добавить загрузку схемы выбранной базы данных
  //loadDatabaseSchema(database.id);
  
  setShowDatabaseModal(false);
};

const handleResultsGenerated = (generatedData) => {
  setGeneratedResults(generatedData);
  console.log('Ожидаемые результаты сформированы:', generatedData);
};

  const onNodesChange = useCallback(
    changes => setNodes(nds => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    changes => setEdges(eds => applyEdgeChanges(changes, eds)),
    []
  );

// Модальное окно выбора базы данных
const DatabaseModal = ({ show, onHide, databases, onSelect, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Фильтрация баз данных по поисковому запросу (с защитой от undefined)
  const filteredDatabases = databases.filter(db => {
    const dbName = db.name || '';
    const dbDescription = db.description || '';
    
    return (
      dbName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dbDescription.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="lg"
      centered
    >
      <Modal.Header closeButton className="">
        <Modal.Title>
          <i className="bi bi-database me-2"></i>
          Выберите базу данных
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="p-0">
        {/* Поиск */}
        <div className="p-3 border-bottom">
          <InputGroup>
            <InputGroup.Text>
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Поиск по названию или описанию..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </div>

        {/* Список баз данных */}
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {loading ? (
            <div className="text-center p-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Загрузка...</span>
              </div>
              <p className="mt-2 text-muted">Загрузка баз данных...</p>
            </div>
          ) : filteredDatabases.length === 0 ? (
            <div className="text-center p-4">
              <i className="bi bi-inbox display-4 text-muted"></i>
              <p className="mt-2 text-muted">
                {searchTerm ? 'Базы данных не найдены' : 'У вас пока нет созданных баз данных'}
              </p>
            </div>
          ) : (
            <div className="list-group list-group-flush">
              {filteredDatabases.map((database) => (
                <button
                  key={database.id}
                  type="button"
                  className="list-group-item list-group-item-action d-flex justify-content-between align-items-start"
                  onClick={() => onSelect(database)}
                >
                  <div className="ms-2 me-auto">
                    <div className="fw-bold">
                      <i className="bi bi-database-fill text-primary me-2"></i>
                      {database.name || 'Без названия'}
                    </div>
                    {database.description && (
                      <small className="text-muted">{database.description}</small>
                    )}
                    <div className="mt-1">
                      <small className="text-muted">
                        Создана: {database.createdAt ? new Date(database.createdAt).toLocaleDateString() : 'Неизвестно'}
                      </small>
                    </div>
                  </div>
                  <div className="text-end">
                    
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal.Body>
      
      <Modal.Footer className="   ">
        <Button variant="secondary" onClick={onHide}>
          Отмена
        </Button>
        <Button 
          variant="primary" 
          onClick={() => setShowDatabaseModal(false)}
        >
          <i className="bi bi-plus-circle me-1"></i>
          Создать новую базу
        </Button>
      </Modal.Footer>
    </Modal>
  );
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
            isForeignKey: col.isForeignKey,
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
      setSqlCode('');
    } catch (error) {

  }
};

// Функция для парсинга SQL вставки данных
const parseInsertSQL = (sql) => {
  try {

    if (!sql) {
        console.log('SQL для вставки данных пуст');
        return;
      }

    const result = {};
    
    if (!sql || typeof sql !== 'string') {
      return result;
    }

    // Нормализуем SQL - убираем лишние пробелы и переносы
    const normalizedSQL = sql.replace(/\s+/g, ' ').trim();
    
    // Улучшенное регулярное выражение для поиска INSERT запросов
    const insertRegex = /INSERT\s+INTO\s+([^\s(]+)\s*\(([^)]+)\)\s*VALUES\s*(.*?)(?=INSERT|$)/gi;
    
    let match;

    
    while ((match = insertRegex.exec(normalizedSQL)) !== null) {
      
      // Защита от undefined для каждого захваченного значения
      if (!match[1] || !match[2]) {
        console.warn('Пропущен некорректный INSERT запрос:', match[0]);
        continue;
      }
      
      const tableName = match[1].trim().replace(/["`]/g, '');
      
      // Защита при разбиении колонок
      const columnsStr = match[2] || '';
      const columns = columnsStr.split(',').map(c => {
        return c ? c.trim().replace(/["`]/g, '') : '';
      }).filter(c => c !== ''); // Убираем пустые колонки
      
      const valuesPart = match[3] ? match[3].trim() : '';
      
      if (!result[tableName]) {
        result[tableName] = [];
      }
      
      // Парсим значения - ищем все группы в скобках
      const valueGroups = valuesPart.match(/\(([^)]+)\)/g) || [];
      
      valueGroups.forEach((valuesStr) => {
        // Убираем скобки и разбиваем по запятым
        const values = valuesStr
          .replace(/[()]/g, '')
          .split(',')
          .map(v => {
            const val = v ? v.trim() : '';
            
            // Убираем кавычки вокруг строк
            if ((val.startsWith("'") && val.endsWith("'")) || 
                (val.startsWith('"') && val.endsWith('"'))) {
              return val.slice(1, -1);
            }
            
            // Обработка NULL и чисел
            if (val.toUpperCase() === 'NULL') return null;
            if (val !== '' && !isNaN(val)) return Number(val);
            
            return val;
          });
          
        // Проверяем соответствие количества колонок и значений
        if (columns.length === values.length) {
          const row = {};
          columns.forEach((col, i) => {
if (col) {
              row[col] = values[i];
            }
          });
          // Добавляем строку только если есть хотя бы одна колонка
          if (Object.keys(row).length > 0) {
            result[tableName].push(row);
          }
        } else {
          console.warn(`Несоответствие колонок и значений в таблице ${tableName}: ${columns.length} колонок vs ${values.length} значений`);
        }
      });
    }
    
    return result;
  } catch (error) {
    console.error("Ошибка парсинга SQL:", error);
    throw new Error(`Ошибка парсинга SQL: ${error.message}`);
  }
};

  const handleImportSQLInsert = (sql) => {
    try {

      if (!sql) {
        return;
      }
      
      const parsedData = parseInsertSQL(sql);

      const newTableData = {};
      

      for (const tableName in parsedData) {
      if (parsedData.hasOwnProperty(tableName)) {
        // ЗАМЕНЯЕМ данные, а не добавляем
        newTableData[tableName] = [...parsedData[tableName]];
      }
    }

      setTableData(newTableData);
      setSqlCode('');
    } catch (error) {
    }
  };

  return (

    <div class='erd-container d-flex flex-column vh-100'>
    <div class='p-2 border-bottom d-flex'>
      <div data-tour="save-task-button">
        <TaskSaveButton
          databaseId={databaseId}
          taskDescription={taskDescription}
          result={result}
          sqlQuery={sqlQuery}
          generatedResults={generatedResults}
        />
      </div>
    <div class="ms-3 p-2 border rounded" data-tour="database-selector">
      Выбрана база данных: {selectedDatabase ? selectedDatabase : 'не выбрана'}
    </div>
    </div>
    <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
      
      {/* Кнопки переключения вкладок */}
      <Nav variant="tabs" className="position-relative nav-justified">
        <Nav.Item>
          <Nav.Link eventKey="solution" data-tour="solution-tab">
            Итоговое решение
          </Nav.Link>
        </Nav.Item>

        <Nav.Item className="">
          <Nav.Link eventKey="task" data-tour="task-tab">
            Формулировка задачи
          </Nav.Link>
        </Nav.Item>
      </Nav>

      <Tab.Content className="d-flex w-100 h-100 overflow-auto">
        <Tab.Pane className="d-flex w-100 h-100" eventKey="solution">
<SolutionView
  nodes={nodes}
  edges={edges}
  tableData={tableData}
  setResult={setResult}
  result={result}
  selectedColumns={selectedColumns}
  setSelectedColumns={setSelectedColumns}
  sqlQuery={sqlQuery}
  setSqlQuery={setSqlQuery}
  databaseId={databaseId}
  onResultsGenerated={handleResultsGenerated} // 🆕 ДОБАВИТЬ
/>
        </Tab.Pane>

        <Tab.Pane className="d-flex w-100 h-100" eventKey="task" forceMount={activeTab !== "task"}>
          <TaskPreview 
            nodes={nodes} 
            edges={edges}
            setNodes={setNodes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            setTaskDescription={setTaskDescription}
            taskDescription={taskDescription}
          />
        </Tab.Pane>
      </Tab.Content> 
    </Tab.Container>

    <DatabaseModal
      show={showDatabaseModal}
      onHide={() => setShowDatabaseModal(false)}
      databases={userDatabases}
      onSelect={handleDatabaseSelect}
      loading={loading}
    />
    <TutorialButton onClick={() => startTutorialManually(createTaskSteps, tutorialContext)} />
    </div>
  );
}