import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, {
  Controls,
  Background,
  applyEdgeChanges,
  applyNodeChanges,
  MiniMap,
} from 'reactflow';

import 'reactflow/dist/style.css';

import { 
  Modal, 
  Button, 
  Form, 
  Container,
  Alert,
  Badge  // 🆕 ДОБАВИТЬ
} from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { Tab, Nav, Row, Col } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import "bootstrap-icons/font/bootstrap-icons.css";
import './ERDEditor.css';
import Sidebar from '../components/Sidebar';
import EntityNode from '../components/EntityNode';
import CustomEdge from '../components/CustomEdge';
import Task_manage from './Task_manage';
import DatabaseSaveButton from '../components/DatabaseSaveButton'
import { useDagreLayout } from '../utils/useDagreLayout';

import { parseSQL } from '../utils/sqlParser';
import TutorialButton from '../components/TutorialButton';
import { useTutorialAutoStart, startTutorialManually } from '../hooks/useTutorialAutoStart';
import { createDatabaseSteps } from '../config/tutorialSteps';
import { useTutorial } from '../components/TutorialContext';



const nodeTypes = { entity: EntityNode };
const edgeTypes = {
  custom: CustomEdge // без стрелочной функции
};

const createEntityNode = (entityName, attributes, position) => {
  // Убедимся, что у каждого атрибута есть уникальный ID
  const processedAttributes = attributes.map(attr => ({
    id: attr.id || `attr-${Date.now()}`,
    name: attr.name,
    type: attr.type,
    isPrimary: attr.isPrimary || false,
    isUnique: attr.isUnique || false,
    isNullable: attr.isNullable !== undefined ? attr.isNullable : true,
    isForeignKey: attr.isForeignKey || false,
    isAutoIncrement: attr.isAutoIncrement || false
  }));

  return {
    id: entityName,
    type: 'entity',
    position,
    data: {
      label: entityName,
      attributes: processedAttributes
    }
  };
};

const API_BASE_URL = process.env.REACT_APP_API_URL

export default function CreateDatabase() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [activeNodeId, setActiveNodeId] = useState(null);
  const [activeEdgeId, setActiveEdgeId] = useState(null);
  const [activeTab, setActiveTab] = useState('ERD');
  const [sidebarActiveTab, setSidebarActiveTab] = useState('tables');
  const [tableData, setTableData] = useState({
    main: {}  // Основной набор данных
  });
  const [activeDataSet, setActiveDataSet] = useState('main');
  const [dataSets, setDataSets] = useState(['main']);
  const [sqlCode, setSqlCode] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importError, setImportError] = useState(null);
  const [csvDecision, setCsvDecision] = useState('');
  const [selectedColumns, setSelectedColumns] = useState([]);
  const tutorialContext = useTutorial();
  useTutorialAutoStart('createDatabase', createDatabaseSteps);
  const { registerTabSwitcher, unregisterTabSwitcher } = useTutorial();

  const { id } = useParams();

  const applyLayout = useDagreLayout();

  const handleAutoLayout = useCallback(() => {
    const layoutedNodes = applyLayout(nodes, edges, 'LR'); // 'TB' = Top to Bottom, 'LR' = Left to Right
    setNodes(layoutedNodes);
  }, [nodes, edges, applyLayout, setNodes]);

  const addTestDataSet = () => {
  const testNumber = dataSets.filter(ds => ds.startsWith('test')).length + 1;
  const newDataSetName = `test${testNumber}`;
  
  setDataSets([...dataSets, newDataSetName]);

  setTableData({
    ...tableData,
    [newDataSetName]: {}
  });
  setActiveDataSet(newDataSetName);
};

// Удалить проверочный набор
const removeTestDataSet = (dataSetName) => {
  if (dataSetName === 'main') return;
  
  if (window.confirm(`Удалить проверочный набор "${getDataSetLabel(dataSetName)}"?`)) {
    const newDataSets = dataSets.filter(ds => ds !== dataSetName);
    const newTableData = { ...tableData };
    delete newTableData[dataSetName];
    
    setDataSets(newDataSets);
    setTableData(newTableData);
    
    if (activeDataSet === dataSetName) {
      setActiveDataSet('main');
    }
  }
};

// Копировать данные из основного набора
const copyFromMain = (targetDataSet) => {
  if (targetDataSet === 'main') return;
  
  setTableData({
    ...tableData,
    [targetDataSet]: JSON.parse(JSON.stringify(tableData.main))
  });
};

// Получить читаемое название набора
const getDataSetLabel = (dataSetName) => {
  if (dataSetName === 'main') return 'Основной';
  const testNumber = dataSetName.replace('test', '');
  return `Проверка ${testNumber}`;
};

// Подсчет общего количества записей в наборе
const getDataSetRecordCount = (dataSetName) => {
  const dataSet = tableData[dataSetName] || {};
  return Object.keys(dataSet).reduce((sum, table) => 
    sum + (dataSet[table]?.length || 0), 0
  );
};

// Функция для парсинга SQL вставки данных
const parseInsertSQL = (sql) => {
  try {
    const result = {};
    const insertRegex = /INSERT\s+INTO\s+([^\s(]+)\s*\(([^)]+)\)\s*VALUES\s*([^;]+);/gi;
    
    let match;
    while ((match = insertRegex.exec(sql)) !== null) {
      const tableName = match[1].trim();
      console.log(tableName)
      const columns = match[2].split(',').map(col => col.trim().replaceAll('"', ''));
      console.log(columns)
      const valuesStr = match[3].trim();
      console.log(valuesStr)
      
      const valueRegex = /\(([^)]+)\)/g;
      const rows = [];
      let valueMatch;
      
      while ((valueMatch = valueRegex.exec(valuesStr)) !== null) {
        const values = valueMatch[1].split(',').map(val => {
          val = val.trim();
          if ((val.startsWith("'") && val.endsWith("'")) || 
              (val.startsWith('"') && val.endsWith('"'))) {
            return val.substring(1, val.length - 1);
          }
          return val;
        });
        
        const row = {};
        columns.forEach((col, i) => {
          row[col] = values[i] || '';
        });
        rows.push(row);
      }
      
      result[tableName] = rows;
    }
    
    return result;
  } catch (error) {
    console.error('Ошибка парсинга INSERT SQL:', error);
    return {};
  }
};

useEffect(() => {
  const fetchDatabase = async () => {
    if (id) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/databases/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Загружаем схему
          if (data.database_create_text) {
            handleImportSQL(data.database_create_text);
          }
          
          // 🆕 Загружаем основной набор данных
          let newTableData = { main: {} };
          if (data.database_insert_text) {
            const parsedMainData = parseInsertSQL(data.database_insert_text);
            newTableData.main = parsedMainData;
          }
          
          // 🆕 Загружаем проверочные наборы данных
          let newDataSets = ['main'];
          if (data.test_data_sets && data.test_data_sets !== '[]') {
            try {
              const parsedTests = JSON.parse(data.test_data_sets);
              
              parsedTests.forEach((test, index) => {
                const dataSetName = `test${index + 1}`;
                newDataSets.push(dataSetName);
                
                if (test.insert_sql) {
                  newTableData[dataSetName] = parseInsertSQL(test.insert_sql);
                } else {
                  newTableData[dataSetName] = {};
                }
              });
            } catch (e) {
              console.error('Ошибка парсинга test_data_sets:', e);
            }
          }
          
          setTableData(newTableData);
          setDataSets(newDataSets);
        }
      } catch (error) {
        console.error('Ошибка загрузки базы данных:', error);
      }
    }
  };
  
  fetchDatabase();
}, [id]);

  useEffect(() => {
      registerTabSwitcher('main', setActiveTab);
      return () => {
          unregisterTabSwitcher('main');
      };
  }, [registerTabSwitcher, unregisterTabSwitcher]);

  useEffect(() => {
      registerTabSwitcher('sidebar', setSidebarActiveTab);
      return () => {
          unregisterTabSwitcher('sidebar');
      };
  }, [registerTabSwitcher, unregisterTabSwitcher]);
    
  useEffect(() => {
    const fetchUserDatabases = async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/api/databases/${id}`, {
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
    };
    fetchUserDatabases();  
}, []);



// Добавьте эту функцию после useState
const normalizeAttributes = useCallback((nodes) => {
  return nodes.map(node => {
    const updatedAttributes = node.data.attributes.map(attr => {
      // Если атрибут заканчивается на _id и не является PRIMARY KEY, помечаем как FOREIGN KEY
      if (attr.name.endsWith('_id') && !attr.isPrimary) {
        return { ...attr, isForeignKey: true };
      }
      return attr;
    });
    
    return {
      ...node,
      data: {
        ...node.data,
        attributes: updatedAttributes
      }
    };
  });
}, []);

// Вызовите эту функцию при загрузке или изменении nodes
useEffect(() => {
  if (nodes.length > 0) {
    const normalizedNodes = normalizeAttributes(nodes);
    if (JSON.stringify(normalizedNodes) !== JSON.stringify(nodes)) {
      setNodes(normalizedNodes);
    }
  }
}, [nodes, normalizeAttributes]);

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
      alert('Атрибут с таким именем уже существует!');
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

  if (!sourceNode || !targetNode) {
    console.error('Source or target node not found');
    return;
  }

  // Получаем исходный атрибут (из которого тянем связь)
  const sourceAttr = sourceNode?.data.attributes.find(a => a.id === params.sourceHandle);
  
  if (!sourceAttr) {
    alert('Не удалось найти исходный атрибут');
    return;
  }

  // Проверяем, что исходный атрибут является ключевым
  if (!sourceAttr.isPrimary && !sourceAttr.isUnique) {
    alert('Связи можно создавать только от PRIMARY KEY или UNIQUE атрибутов');
    return;
  }

  // Проверяем, не пытаемся ли мы соединить таблицу саму с собой
  if (params.source === params.target) {
    alert('Нельзя создать связь с самой таблицей');
    return;
  }

  // Проверяем, является ли targetHandle табличным хендлом (для создания нового FK)
  const isTableTarget = params.targetHandle && params.targetHandle.startsWith('table-target-');

  // Если это подключение к табличному хендлу - создаем новый атрибут
  if (isTableTarget) {
    // Создаем новый FOREIGN KEY атрибут в целевой таблице
    const newAttrId = `attr-${Date.now()}`;
    const newAttrName = `${sourceNode.data.label.toLowerCase()}_id`;
    
    // Проверяем, нет ли уже такого атрибута
    const existingAttr = targetNode.data.attributes.find(
      attr => attr.name === newAttrName
    );

    if (existingAttr) {
      alert(`Атрибут ${newAttrName} уже существует в таблице ${targetNode.data.label}`);
      return;
    }

    // Создаем новый атрибут (внешний ключ)
    const newAttribute = {
      id: newAttrId,
      name: newAttrName,
      type: sourceAttr.type,
      isPrimary: false,
      isUnique: false,
      isNullable: true,
      isForeignKey: true
    };


    // Создаем новое ребро
    const newEdge = {
      id: `edge-${params.source}-${params.sourceHandle}-${targetNode.id}-${newAttrId}`,
      source: params.source,
      target: targetNode.id,
      sourceHandle: params.sourceHandle,
      targetHandle: newAttrId,
      type: 'custom',
      data: {
        relationType: 'one-to-many',
        label: '1:N',
        sourceLabel: sourceNode.data.label,
        targetLabel: targetNode.data.label,
        sourceAttr: sourceAttr.name,
        targetAttr: newAttrName,
        isAutoCreated: true
      },
      animated: true,
    };

    // Обновляем nodes и edges в одном setState
    setNodes(prevNodes => {
      return prevNodes.map(node => {
        if (node.id === targetNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              attributes: [...node.data.attributes, newAttribute]
            }
          };
        }
        return node;
      });
    });

    // Добавляем ребро
    setEdges(prevEdges => [...prevEdges, newEdge]);
    
    return;
  }

  // Если это подключение к существующему атрибуту
  if (params.targetHandle) {
    const targetAttr = targetNode?.data.attributes.find(a => a.id === params.targetHandle);
    
    if (!targetAttr) {
      alert('Целевой атрибут не найден');
      return;
    }

    // Проверяем, что целевой атрибут - внешний ключ
    if (!targetAttr.isForeignKey) {
      alert('Подключаться можно только к внешним ключам (атрибутам, заканчивающимся на _id)');
      return;
    }

    // Создаем связь с существующим атрибутом
    const newEdge = {
      id: `edge-${params.source}-${params.sourceHandle}-${targetNode.id}-${params.targetHandle}`,
      source: params.source,
      target: targetNode.id,
      sourceHandle: params.sourceHandle,
      targetHandle: params.targetHandle,
      type: 'custom',
      data: {
        relationType: 'one-to-many',
        label: '1:N',
        sourceLabel: sourceNode.data.label,
        targetLabel: targetNode.data.label,
        sourceAttr: sourceAttr.name,
        targetAttr: targetAttr.name
      },
      animated: true,
    };
    
    setEdges(prevEdges => [...prevEdges, newEdge]);
  }
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
      if (attr.isAutoIncrement) {
  // Если тип INT и есть AUTO_INCREMENT, меняем на SERIAL
  if (attr.type.toUpperCase() === 'INTEGER' || attr.type.toUpperCase() === 'INT') {
    columnDef = `  ${attr.name} SERIAL`;
  }
}
if (attr.isPrimary) columnDef += ' PRIMARY KEY';
      if (!attr.isNullable) columnDef += ' NOT NULL';
      return columnDef;
    }).join(',\n');

    const uniques = node.data.attributes
      .filter(attr => attr.isUnique && !attr.isPrimary)
      .map(attr => `  UNIQUE (${attr.name})`)
      .join(',\n');

    // НОВОЕ: Добавляем FOREIGN KEY constraints внутрь CREATE TABLE
    const foreignKeys = edges
      .filter(edge => edge.target === node.id && edge.data.relationType !== 'many-to-many')
      .map(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const sourceAttr = sourceNode?.data.attributes.find(a => a.id === edge.sourceHandle)?.name;
        const targetAttr = node.data.attributes.find(a => a.id === edge.targetHandle)?.name;
        return `  FOREIGN KEY (${targetAttr}) REFERENCES ${sourceNode.data.label}(${sourceAttr})`;
      })
      .join(',\n');

    let tableDef = `CREATE TABLE ${node.data.label} (\n${columns}`;
    if (uniques) tableDef += `,\n${uniques}`;
    if (foreignKeys) tableDef += `,\n${foreignKeys}`;
    tableDef += '\n);';
    
    return tableDef;
  }).join('\n\n');

  // 2. Затем добавляем внешние ключи
  const fksSQL = edges
  .filter(edge => edge.data.relationType === 'many-to-many')  // ✅ ТОЛЬКО many-to-many
  .map(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    const sourceAttr = sourceNode?.data.attributes.find(a => a.id === edge.sourceHandle)?.name;
    const targetAttr = targetNode?.data.attributes.find(a => a.id === edge.targetHandle)?.name;

    const junctionTableName = `${sourceNode.data.label}_${targetNode.data.label}`;
    return `
CREATE TABLE ${junctionTableName} (
  ${sourceNode.data.label}_id ${getSqlType(sourceNode.data.attributes.find(a => a.id === edge.sourceHandle)?.type)},
  ${targetNode.data.label}_id ${getSqlType(targetNode.data.attributes.find(a => a.id === edge.targetHandle)?.type)},
  PRIMARY KEY (${sourceNode.data.label}_id, ${targetNode.data.label}_id),
  FOREIGN KEY (${sourceNode.data.label}_id) REFERENCES ${sourceNode.data.label}(${sourceAttr}),
  FOREIGN KEY (${targetNode.data.label}_id) REFERENCES ${targetNode.data.label}(${targetAttr})
);`;
  })
  .filter(Boolean)
  .join('\n\n');

return fksSQL ? `${tablesSQL}\n\n${fksSQL}` : tablesSQL;
};

// Функция для преобразования типов
const getSqlType = (type) => {
  const typeMap = {
    'string': 'TEXT',
    'INTEGER': 'INTEGER',
    'boolean': 'BOOLEAN',
    'numeric': 'NUMERIC',
    'bigint': 'BIGINT',
    'timestamp': 'TIMESTAMP'
  };
  return typeMap[type.toLowerCase()] || type.toUpperCase();
};

const generateDataInsertSQL = (nodes, tableData, options = {}) => {
  const { dataSet = 'main' } = options;
  const config = {
    truncateFirst: true,
    batchSize: 100
  };

  let sqlCodeInsert = '-- SQL для заполнения таблиц данными\n\n';
  sqlCodeInsert += 'BEGIN TRANSACTION;\n\n';

  // Генерируем SQL для каждой таблицы
  nodes.forEach(node => {
    const tableName = node.data.label;
    const columns = node.data.attributes;
    const dataRows = tableData[dataSet]?.[tableName] || [];

    if (!dataRows.length) return;

    // Добавляем TRUNCATE если нужно
    if (config.truncateFirst) {
      sqlCodeInsert += `TRUNCATE TABLE ${tableName} CASCADE;\n\n`;
    }

    // Разбиваем данные на батчи
    for (let i = 0; i < dataRows.length; i += config.batchSize) {
      const batch = dataRows.slice(i, i + config.batchSize);
      const insertableColumns = columns.filter(col => !col.isAutoIncrement);
      const columnNames = insertableColumns.map(col => `"${col.name}"`).join(', ');

      sqlCodeInsert += `INSERT INTO ${tableName} (${columnNames})\nVALUES\n`;

      // Добавляем строки данных
      sqlCodeInsert += batch.map(row => {
        const values = insertableColumns.map(col => {
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
  const numericTypes = ['INTEGER', 'INT', 'BIGINT', 'SMALLINT', 'NUMERIC', 'DECIMAL', 'REAL', 'DOUBLE', 'FLOAT'];
  return numericTypes.includes(type.toLowerCase());
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
        className='text-bg-light'
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
            isPrimary: col.isPrimary,
            isNullable: col.isNullable,
            isForeignKey: col.isForeignKey || false,
            isAutoIncrement: col.isAutoIncrement || false
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

      

      for (const [tableName, newData] of Object.entries(parsedData)) {
            
            // Действительно объединяем данные
            if (Array.isArray(updatedTableData["main"][tableName])) {
                // Если таблица уже существует, добавляем новые записи
                updatedTableData["main"][tableName] = [
                    ...updatedTableData["main"][tableName],
                    ...newData
                ];
            } else {
                // Если таблицы нет, создаем её с новыми данными
                updatedTableData["main"][tableName] = [...newData];
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


const flowContent = useMemo(() => (
  <ReactFlow
    nodes={nodes}
    edges={edges}
    onNodesChange={onNodesChange}
    onEdgesChange={onEdgesChange}
    onConnect={onConnect}
    nodeTypes={nodeTypes}
    edgeTypes={edgeTypes}
    proOptions={{ dark: true }}
    fitView
  >
    <MiniMap style={{ backgroundColor: '#2d3748' }}/>
    <Background variant="dots" color="#4a5568" gap={16} size={1} /> 
    <Controls style={{ 
      backgroundColor: '#2d3748', 
      borderRadius: '4px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.5)' 
    }} />
  </ReactFlow>
), [nodes, edges, activeTab]);

  //конец sql

  return (
    <div className='erd-container d-flex flex-column vh-100 overflow-hidden'>
    <div className='p-2 border-bottom'>
      <div data-tour="save-button">
        <DatabaseSaveButton 
          nodes={nodes}
          tableData={tableData}
          generateSQL={generateSQL}
          generateDataInsertSQL={generateDataInsertSQL}
          setCsvDecision={setCsvDecision}
          csvDecision={csvDecision}
        />
      </div>
    </div>
    <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>

      <Modal show={showImportModal} onHide={() => setShowImportModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Импорт SQL схемы</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Введите SQL код создания базы данных:</Form.Label>
            <Form.Control
              as="textarea"
              rows={10}
              value={sqlCode}
              onChange={(e) => setSqlCode(e.target.value)}
              placeholder={`Пример:\nCREATE TABLE users (\n  id INTEGER PRIMARY KEY,\n  name TEXT NOT NULL\n);\n\nCREATE TABLE posts (\n  id INTEGER PRIMARY KEY,\n  user_id INTEGER REFERENCES users(id),\n  title TEXT\n);`}
            />
          </Form.Group>
          {importError && (
            <div className="alert alert-danger mt-3">
              {importError}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowImportModal(false)}>
            Отмена
          </Button>
          <Button variant="primary" onClick={() => handleImportSQL()}>
            Импортировать
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Кнопки переключения вкладок */}
      <Nav variant="tabs" className="position-relative nav-justified">
        <Nav.Item className="">
          <Nav.Link eventKey="ERD" data-tour="sql-tab">
            Создание базы данных
          </Nav.Link>
        </Nav.Item>

        <Nav.Item className="">
          <Nav.Link eventKey="manage" data-tour="data-tab">
            Заполнение таблиц
          </Nav.Link>
        </Nav.Item>
      </Nav>

      <Tab.Content className="d-flex w-100 h-100 overflow-auto">
        <Tab.Pane className="d-flex w-100 h-100" eventKey="ERD" forceMount={activeTab !== "ERD"}>
          <div className="d-flex w-100 h-100">
            <div className="sidebar-wrapper" data-tour="sidebar">
              <Sidebar 
                nodes={nodes}
                setNodes={setNodes}
                edges={edges}
                setEdges={setEdges}
                activeNodeId={activeNodeId}
                activeEdgeId={activeEdgeId}
                setActiveNodeId={setActiveNodeId}
                setActiveEdgeId={setActiveEdgeId}
                addNewNode={addNewNode}
                updateNodeAttributes={updateNodeAttributes}
                updateEdgeRelation={updateEdgeRelation}
                updateEdgeAttributes={updateEdgeAttributes}
                deleteEdge={deleteEdge}
                isTableNameUnique={isTableNameUnique}
                onExport={exportSchema}
                setShowImportModal={setShowImportModal}
                generateSQL={generateSQL}
                generateDataInsertSQL={generateDataInsertSQL}
                activeTab={sidebarActiveTab}
                setActiveTab={setSidebarActiveTab}
                tableData={tableData}
                setTableData={setTableData}
                setCsvDecision={setCsvDecision}
                csvDecision={csvDecision}
                setSelectedColumns={setSelectedColumns}
                selectedColumns={selectedColumns}
                handleAutoLayout={handleAutoLayout}
              />
              </div>
              <div className="d-flex reactflow-wrapper position-relative flex-grow-1 h-100">
                {activeTab === "ERD" && flowContent}
            </div>
          </div>
        </Tab.Pane>

        <Tab.Pane className="d-flex w-100 h-100 flex-column" eventKey="manage" forceMount={activeTab !== "manage"}>
  {/* 🆕 Панель управления наборами данных */}
  <Container fluid className="border-bottom py-3">
    <Row className="align-items-center">
      <Col md={8}>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="fw-bold me-2">Набор данных:</span>
          
          {dataSets.map(dataSet => (
            <div key={dataSet} className="d-flex align-items-center">
              <Button
                variant={activeDataSet === dataSet ? "primary" : "outline-secondary"}
                size="sm"
                onClick={() => setActiveDataSet(dataSet)}
                className="me-1"
              >
                {getDataSetLabel(dataSet)}
                {activeDataSet === dataSet && (
                  <Badge bg="light" text="dark" className="ms-2">
                    {getDataSetRecordCount(dataSet)} записей
                  </Badge>
                )}
              </Button>
              
              {dataSet !== 'main' && activeDataSet === dataSet && (
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => removeTestDataSet(dataSet)}
                  title="Удалить набор"
                  className="me-2"
                >
                  <i className="bi bi-trash"></i>
                </Button>
              )}
            </div>
          ))}
          
          <Button
            variant="success"
            size="sm"
            onClick={addTestDataSet}
          >
            <i className="bi bi-plus-circle me-1"></i>
            Добавить проверку
          </Button>
        </div>
      </Col>
      
      <Col md={4} className="text-end">
        {activeDataSet !== 'main' && (
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => copyFromMain(activeDataSet)}
          >
            <i className="bi bi-files me-1"></i>
            Скопировать из основного
          </Button>
        )}
      </Col>
    </Row>
    
    <Row className="mt-2">
      <Col>
        <Alert variant={activeDataSet === 'main' ? 'info' : 'warning'} className="mb-0 py-2">
          <i className="bi bi-info-circle me-2"></i>
          <small>
            {activeDataSet === 'main' 
              ? 'Редактируете основной набор данных. Эти данные будут использоваться для отображения итогового решения.'
              : `Редактируете проверочный набор "${getDataSetLabel(activeDataSet)}". Эти данные будут использоваться для автоматической проверки решений студентов.`
            }
          </small>
        </Alert>
      </Col>
    </Row>
  </Container>

  
  <Task_manage 
    nodes={nodes}
    tableData={tableData}
    setTableData={setTableData}
    activeDataSet={activeDataSet}
  />
</Tab.Pane>
      </Tab.Content> 
    </Tab.Container>
    <TutorialButton onClick={() => startTutorialManually(createDatabaseSteps, tutorialContext)} />
  </div>
  );
}