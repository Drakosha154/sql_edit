import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, {
  Controls,
  Background,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  MiniMap,
  Position
} from 'reactflow';

import 'reactflow/dist/style.css';

import { 
  Modal, 
  Button, 
  Form, 
  Table, 
  InputGroup, 
  Container,
  Card,
  Alert, 
  Badge
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { Tab, Nav, Row, Col } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import "bootstrap-icons/font/bootstrap-icons.css";
import './ERDEditor.css';

import Sidebar from '../components/Sidebar';
import EntityNode from '../components/EntityNode';
import CustomEdge from '../components/CustomEdge';
import Task_manage from './Task_manage';
import TaskPreview from './TaskPreview';
import SolutionView from './SolutionView';
import TaskSaveButton from '../components/TaskSaveButton';
import TutorialButton from '../components/TutorialButton';
import { useTutorialAutoStart, startTutorialManually } from '../hooks/useTutorialAutoStart';
import { createTaskSteps } from '../config/tutorialSteps';
import { useTutorial } from '../components/TutorialContext';

import { parseSQL } from '../utils/sqlParser';
import { csvToJson } from '../utils/csvToJson';



const nodeTypes = { entity: EntityNode };
const edgeTypes = {
  custom: CustomEdge // без стрелочной функции
};

const createEntityNode = (entityName, attributes, position) => ({
  id: `${entityName}`, // Уникальный ID
  type: 'entity',
  position,
  data: {
    label: entityName,
    attributes: attributes.map(attr => ({
      id: `${entityName}``attr--${Math.random().toString(36).substr(2, 9)}`, // Уникальный ID для атрибута
      handleId: `handle-${attr.id}`,
      name: attr.name,
      type: attr.type,
      isPrimary: attr.isPrimary || false,
      isNullable: attr.isNullable || false,
      isForeignKey: attr.isForeignKey || false
    }))
  }
});

const API_BASE_URL = process.env.REACT_APP_API_URL

export default function CreateTask() {
  const navigate = useNavigate();
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [showDatabaseModal, setShowDatabaseModal] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState(null);
  const [activeEdgeId, setActiveEdgeId] = useState(null);
  const [activeTab, setActiveTab] = useState('solution');
  const [sidebarActiveTab, setSidebarActiveTab] = useState('tables');
  const [tableData, setTableData] = useState([]);
  const [sqlCodeInsert, setSqlCodeInsert] = useState('');
  const [sqlCode, setSqlCode] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importError, setImportError] = useState(null);
  const [taskDescription, setTaskDescription] = useState('');
  const [result, setResult] = useState([]);
  const [csvDecision, setCsvDecision] = useState('');
  const [selectedDatabase, setSelectedDatabase] = useState(null);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userDatabases, setUserDatabases] = useState([]);
  const [databaseName, setDatabaseName] = useState([]);
  const [databaseId, setDatabaseId] = useState('');
  const [sqlQuery, setSqlQuery] = useState('');
  const [generatedResults, setGeneratedResults] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
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

              setDatabaseName(data.nameDatabase);
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
  if (id == undefined) {
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
  setDatabaseId(database.id);
  setSelectedDatabase(database.name);
  setDatabaseName(database.name);
  fetchSelectedDatabase(database);
  // Здесь можно добавить загрузку схемы выбранной базы данных
  //loadDatabaseSchema(database.id);
  
  setShowDatabaseModal(false);
};

  const updateEdgeRelation = useCallback((edgeId, newRelation) => {
  setEdges(eds => eds.map(edge => {
    if (edge.id === edgeId) {
      const labelMap = {
        'one-to-one': '1:1',
        'one-to-many': '1:N',
        'many-to-one': 'N:1',
        'many-to-many': 'N:N'
      };

      return {
        ...edge,
        data: {
          ...edge.data,
          relationType: newRelation,
          label: labelMap[newRelation] || '1:N'
        },
        markerEnd: newRelation === 'many-to-many' ? { type: 'arrowclosed' } : undefined
      };
    }
    return edge;
  }));
}, []);

  // Функция удаления связи
  const deleteEdge = useCallback((edgeId) => {
    setEdges(eds => eds.filter(e => e.id !== edgeId));
  }, []);

  const updateEdgeAttributes = useCallback((nodeId, oldAttrName, newAttrName) => {
  setEdges(eds => eds.map(edge => {
    // Обновляем sourceHandle если он относится к измененному атрибуту
    if (edge.source === nodeId && edge.sourceHandle.includes(oldAttrName)) {
      return {
        ...edge,
        sourceHandle: edge.sourceHandle.replace(oldAttrName, newAttrName)
      };
    }
    // Обновляем targetHandle если он относится к измененному атрибуту
    if (edge.target === nodeId && edge.targetHandle.includes(oldAttrName)) {
      return {
        ...edge,
        targetHandle: edge.targetHandle.replace(oldAttrName, newAttrName)
      };
    }
    return edge;
  }));
}, []);

const handleResultsGenerated = (generatedData) => {
  setGeneratedResults(generatedData);
  console.log('Ожидаемые результаты сформированы:', generatedData);
};

const updateEdgesOnNodeRename = useCallback((oldNodeId, newNodeId, newLabel) => {
  setEdges(eds => eds.map(edge => {
    const updatedEdge = {...edge};
    
    // Обновляем source если это измененная таблица
    if (edge.source === oldNodeId) {
      updatedEdge.source = newNodeId;
      updatedEdge.data = {
        ...updatedEdge.data,
        sourceLabel: newLabel
      };
    }
    
    // Обновляем target если это измененная таблица
    if (edge.target === oldNodeId) {
      updatedEdge.target = newNodeId;
      updatedEdge.data = {
        ...updatedEdge.data,
        targetLabel: newLabel
      };
    }
    
    return updatedEdge;
  }));
}, []);

const isTableNameUnique = useCallback((name, excludeId = null) => {
    return !nodes.some(node => 
      node.data.label === name && node.id !== excludeId
    );
  }, [nodes]);

  // Обновление атрибутов конкретного узла
const updateNodeAttributes = useCallback((nodeId, newAttributes, newLabel = null) => {
  // Если меняется имя - проверяем уникальность
  if (newLabel) {
    if (!isTableNameUnique(newLabel, nodeId)) {
      alert('Таблица с таким именем уже существует!');
      return false;
    }
  }

  setNodes(prevNodes => 
    prevNodes.map(node => {
      if (node.id !== nodeId) return node;
      
      const updatedNode = {
        ...node,
        data: {
          ...node.data,
          label: newLabel || node.data.label,
          attributes: newAttributes.map(attr => ({...attr}))
        }
      };
      
      if (newLabel && newLabel !== node.data.label) {
        updateEdgesOnNodeRename(nodeId, nodeId, newLabel);
      }
      
      return updatedNode;
    })
  );
  return true;
}, [isTableNameUnique, updateEdgesOnNodeRename]);

  // Добавление новой таблицы
const addNewNode = useCallback((entityName, attributes) => {
    const lastNode = nodes[nodes.length - 1];
    const newPosition = lastNode 
      ? { x: lastNode.position.x, y: lastNode.position.y + 200 } 
      : { x: 100, y: 100 };
    
    const newNode = createEntityNode(
      `${entityName}${nodes.length + 1}`, 
      attributes, 
      newPosition
    );

    setNodes(prevNodes => [...prevNodes, newNode]);
    setActiveNodeId(newNode.id);
  }, [nodes]);

  const onConnect = useCallback((params) => {

  const sourceNode = nodes.find(n => n.id === params.source);
  const targetNode = nodes.find(n => n.id === params.target);

  const targetAttr = targetNode?.data.attributes.find(a => a.id === params.targetHandle);

  // Получаем текущий выбранный тип связи из активного соединения
  const activeRelation = edges.find(e => e.id === activeEdgeId)?.data?.relationType || 'one-to-many';
  
  if (!targetAttr?.isPrimary && !targetAttr?.isUnique && activeRelation !== 'many-to-many') {
    alert('Для связей 1:1 и 1:N целевой атрибут должен быть PRIMARY KEY или UNIQUE');
    return;
  }
  
  setEdges(eds => addEdge({
    ...params,
    type: 'custom',
    data: {
      relationType: activeRelation,
      label: activeRelation === 'one-to-one' ? '1:1' : 
            activeRelation === 'many-to-many' ? 'N:N' : '1:N',
      sourceLabel: sourceNode?.data.label || params.source,
      targetLabel: targetNode?.data.label || params.target,
      sourceAttr: params.sourceHandle,
      targetAttr: params.targetHandle
    },
    animated: true,
  }, eds));
}, [nodes]);

  const onNodesChange = useCallback(
    changes => setNodes(nds => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    changes => setEdges(eds => applyEdgeChanges(changes, eds)),
    []
  );

  //начало чего то большего

  const generateSQL = () => {
  // 1. Сначала создаем все таблицы
  const tablesSQL = nodes.map(node => {
    const columns = node.data.attributes.map(attr => {
      let columnDef = `  ${attr.name} ${getSqlType(attr.type)}`;
      if (attr.isPrimary) columnDef += ' PRIMARY KEY';
      if (!attr.isNullable) columnDef += ' NOT NULL';
      return columnDef;
    }).join(',\n');

    // Добавляем UNIQUE constraints отдельно
    const uniques = node.data.attributes
      .filter(attr => attr.isUnique && !attr.isPrimary)
      .map(attr => `  UNIQUE (${attr.name})`)
      .join(',\n');

    const tableDef = `CREATE TABLE ${node.data.label} (\n${columns}`;
    return uniques ? `${tableDef},\n${uniques}\n);` : `${tableDef}\n);`;
  }).join('\n\n');

  // 2. Затем добавляем внешние ключи
  const fksSQL = edges.map(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    console.log('sourceNode', sourceNode)
    console.log('targetNode', targetNode)
    
    const sourceAttr = sourceNode?.data.attributes.find(a => a.id === edge.sourceHandle)?.name;
    const targetAttr = targetNode?.data.attributes.find(a => a.id === edge.targetHandle)?.name;

    if (edge.data.relationType === 'many-to-many') {
      const junctionTableName = `${sourceNode.data.label}_${targetNode.data.label}`;
      return `
CREATE TABLE ${junctionTableName} (
  ${sourceNode.data.label}_id ${getSqlType(sourceNode.data.attributes.find(a => a.id === edge.sourceHandle)?.type)},
  ${targetNode.data.label}_id ${getSqlType(targetNode.data.attributes.find(a => a.id === edge.targetHandle)?.type)},
  PRIMARY KEY (${sourceNode.data.label}_id, ${targetNode.data.label}_id),
  FOREIGN KEY (${sourceNode.data.label}_id) REFERENCES ${sourceNode.data.label}(${sourceAttr}),
  FOREIGN KEY (${targetNode.data.label}_id) REFERENCES ${targetNode.data.label}(${targetAttr})
);`;
    } else {
      return `ALTER TABLE ${targetNode.data.label}\n` +
             `ADD CONSTRAINT fk_${targetNode.data.label}_${targetAttr}\n` +
             `FOREIGN KEY (${targetAttr}) REFERENCES ${sourceNode.data.label}(${sourceAttr})` +
             (edge.data.relationType === 'one-to-one' ? ' UNIQUE;' : ';');
    }
  }).filter(Boolean).join('\n\n');

  return `${tablesSQL}\n\n${fksSQL}`;
};

// Функция для преобразования типов
const getSqlType = (type) => {
  const typeMap = {
    'string': 'TEXT',
    'integer': 'INTEGER',
    'boolean': 'BOOLEAN',
    'numeric': 'NUMERIC',
    'bigint': 'BIGINT',
    'timestamp': 'TIMESTAMP'
  };
  return typeMap[type.toLowerCase()] || type.toUpperCase();
};

const generateDataInsertSQL = (nodes, tableData, options = {}) => {
  const defaults = {
    batchSize: 100,     // Максимальное количество строк в одном INSERT
    truncateFirst: true // Добавлять TRUNCATE перед вставкой
  };
  const config = { ...defaults, ...options };

  let sqlCodeInsert = '-- SQL для заполнения таблиц данными\n\n';
  sqlCodeInsert += 'BEGIN TRANSACTION;\n\n';

  // Генерируем SQL для каждой таблицы
  nodes.forEach(node => {
    const tableName = node.data.label;
    const columns = node.data.attributes;
    const dataRows = tableData[tableName] || [];

    if (!dataRows.length) return;

    // Добавляем TRUNCATE если нужно
    if (config.truncateFirst) {
      sqlCodeInsert += `TRUNCATE TABLE ${tableName} CASCADE;\n\n`;
    }

    // Разбиваем данные на батчи
    for (let i = 0; i < dataRows.length; i += config.batchSize) {
      const batch = dataRows.slice(i, i + config.batchSize);
      const columnNames = columns.map(col => `"${col.name}"`).join(', ');

      sqlCodeInsert += `INSERT INTO ${tableName} (${columnNames})\nVALUES\n`;

      // Добавляем строки данных
      sqlCodeInsert += batch.map(row => {
        const values = columns.map(col => {
          const value = row[col.name];
          
          // Обработка разных типов данных
          if (value === null || value === undefined) return 'NULL';
          
          // Определяем тип данных атрибута
          const attrType = col.type?.toLowerCase();
          
          // Для текстовых типов добавляем кавычки и экранируем существующие кавычки
          if (isTextType(attrType) || typeof value === 'string') {
            return `'${String(value).replace(/'/g, "''")}'`;
          }
          
          // Для булевых значений преобразуем в TRUE/FALSE
          if (isBooleanType(attrType) || typeof value === 'boolean') {
            return value ? 'TRUE' : 'FALSE';
          }
          
          return `${value}`
        }).join(', ');

        return `  (${values})`;
      }).join(',\n');

      sqlCodeInsert += ';\n\n';
    }
  });

  sqlCodeInsert += 'COMMIT;\n';

  return sqlCodeInsert;
}

// Функция автоматического формирования ожидаемых результатов
const handleGenerateResults = async () => {
  if (!sqlQuery || !databaseId) {
    alert('Пожалуйста, выберите базу данных и напишите SQL запрос');
    return;
  }

  setIsGenerating(true);
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/generate-expected-results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        database_id: parseInt(databaseId),
        sql_query: sqlQuery
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || data.details || 'Ошибка формирования результатов');
    }

    setGeneratedResults(data);
    setResult(data.main_result);
    
    // Устанавливаем колонки из результата
    if (data.main_result && data.main_result.length > 0) {
      const columns = Object.keys(data.main_result[0]);
      setSelectedColumns(columns);
    }
    
    alert(`Результаты успешно сформированы!\nОсновной тест + ${data.test_count} проверочных тестов`);
    
  } catch (error) {
    console.error('Ошибка формирования результатов:', error);
    alert(`Ошибка: ${error.message}`);
  } finally {
    setIsGenerating(false);
  }
};

// Вспомогательные функции для определения типов
const isTextType = (type) => {
  if (!type) return false;
  const textTypes = ['varchar', 'text', 'char', 'string', 'character', 'character varying'];
  return textTypes.includes(type.toLowerCase());
};

const isBooleanType = (type) => {
  if (!type) return false;
  const booleanTypes = ['boolean', 'bool', 'bit'];
  return booleanTypes.includes(type.toLowerCase());
};

const isNumericType = (type) => {
  if (!type) return false;
  const numericTypes = ['integer', 'int', 'bigint', 'smallint', 'numeric', 'decimal', 'real', 'double', 'float'];
  return numericTypes.includes(type.toLowerCase());
};

const showGeneratedSQL = () => {
  setSqlCodeInsert(generateSQL());
};

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

const SQLModal = ({ show, sql, onClose }) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(sql);
  };

  return (
    <Modal show={show} onHide={onClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Сгенерированный SQL</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <pre 
        class='text-bg-light'
        style={{ 
          maxHeight: '60vh',
          overflow: 'auto',
          padding: '15px',
          borderRadius: '4px'
        }}>
          {sql}
        </pre>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Закрыть
        </Button>
        <Button variant="primary" onClick={copyToClipboard}>
          <i className="bi bi-clipboard"></i> Копировать
        </Button>
      </Modal.Footer>
    </Modal>
  );
};


const exportSchema = () => {
  const schema = { 
    nodes, 
    edges,
    meta: {
      version: '1.0',
      createdAt: new Date().toISOString()
    }
  };
  const data = JSON.stringify(schema, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `db-schema-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
      setShowImportModal(false);
      setSqlCode('');
    } catch (error) {
      setImportError(error.message);
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
    let queryCount = 0;
    
    while ((match = insertRegex.exec(normalizedSQL)) !== null) {
      queryCount++;
      
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
      setShowImportModal(false);
      setImportError(null);
    } catch (error) {
      setImportError(error.message);
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
          setCsvDecision={setCsvDecision}
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