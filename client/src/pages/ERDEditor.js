import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, {
  Controls,
  Background,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  MiniMap,
  Position,
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
import TaskPreview from './TaskPreview';
import SolutionView from './SolutionView';

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
      isNullable: attr.isNullable || false
    }))
  }
});

export default function ERDEditor() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [activeNodeId, setActiveNodeId] = useState(null);
  const [activeEdgeId, setActiveEdgeId] = useState(null);
  const [activeTab, setActiveTab] = useState('ERD');
  const [sidebarActiveTab, setSidebarActiveTab] = useState('tables');
  const [tableData, setTableData] = useState([]);
  const [sqlCodeInsert, setSqlCodeInsert] = useState('');
  const [sqlCode, setSqlCode] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importError, setImportError] = useState(null);
  const [taskDescription, setTaskDescription] = useState('');
  const [result, setResult] = useState([]);
  const [csvDecision, setCsvDecision] = useState('');
  const [selectedColumns, setSelectedColumns] = useState([]);

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

              if (resultData && resultData.length > 0) {
                const columns = Object.keys(resultData[0]);
                setSelectedColumns(columns);
              }

        } catch (error) {
              console.error("Ошибка загрузки:", error);
              alert("Ошибка загрузки: " + error.message);
            }
    };
    fetchUserDatabases();  
}, []);

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
      return `ALTER TABLE ${sourceNode.data.label}\n` +
             `ADD CONSTRAINT fk_${sourceNode.data.label}_${sourceAttr}\n` +
             `FOREIGN KEY (${sourceAttr}) REFERENCES ${targetNode.data.label}(${targetAttr})` +
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
      const result = {};
    
    // Регулярное выражение для поиска всех INSERT запросов
    const insertRegex = /INSERT\s+INTO\s+([^\s(]+)\s*\(([^)]+)\)\s*VALUES\s*([^;]+);/gi;
    
    let match;
    
    while ((match = insertRegex.exec(sql)) !== null) {
      const tableName = match[1].trim().replace(/"/g, '');
      const columns = match[2].split(',').map(c => c.trim().replace(/"/g, ''));
      const valuesMatch = match[3].match(/\(([^)]+)\)/g);
      
      if (!result[tableName]) {
        result[tableName] = [];
      }
      
      valuesMatch.forEach(valuesStr => {
        const values = valuesStr
          .replace(/[()]/g, '')
          .split(',')
          .map(v => v.trim().replace(/^'(.*)'$/, '$1')); // Удаляем кавычки вокруг значений
          
        if (columns.length === values.length) {
          const row = {};
          columns.forEach((col, i) => {
            // Преобразуем 'NULL' в null и числа в числа
            row[col] = values[i] === 'NULL' ? null : 
                       !isNaN(values[i]) ? Number(values[i]) : 
                       values[i];
          });
          result[tableName].push(row);
        }
      });
    }
    
    return result;
  } catch (error) {
    throw new Error(`Ошибка парсинга SQL: ${error.message}`);
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
          <Nav.Link eventKey="ERD">
            Создание базы данных
          </Nav.Link>
        </Nav.Item>

        <Nav.Item className="">
          <Nav.Link eventKey="manage">
            Заполнение таблиц
          </Nav.Link>
        </Nav.Item>

        <Nav.Item>
          <Nav.Link eventKey="solution">
            Итоговое решение
          </Nav.Link>
        </Nav.Item>

        <Nav.Item className="">
          <Nav.Link eventKey="task">
            Формулировка задачи
          </Nav.Link>
        </Nav.Item>
      </Nav>

      <Tab.Content className="d-flex w-100 h-100 overflow-auto">
        <Tab.Pane className="d-flex w-100 h-100" eventKey="ERD" forceMount={activeTab !== "ERD"}>
          <div className="d-flex w-100 h-100">
            <div className="sidebar-wrapper">
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
                taskDescription={taskDescription}
                result={result}
                setCsvDecision={setCsvDecision}
                csvDecision={csvDecision}
                setSelectedColumns={setSelectedColumns}
                selectedColumns={selectedColumns}
              />
              </div>
              <div className="d-flex reactflow-wrapper position-relative flex-grow-1 h-100">
                {activeTab === "ERD" && flowContent}
            </div>
          </div>
        </Tab.Pane>

        <Tab.Pane className="d-flex w-100 h-100" eventKey="manage" forceMount={activeTab !== "manage"}>
          <Task_manage 
          tableData={tableData}
          setTableData={setTableData}
          nodes={nodes} 
          />
        </Tab.Pane>

        <Tab.Pane className="d-flex w-100 h-100" eventKey="solution">
          <SolutionView 
            nodes={nodes}
            edges={edges}
            tableData={tableData}
            setResult={setResult}
            result={result}
            setSelectedColumns={setSelectedColumns}
            selectedColumns={selectedColumns}
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
  );
}