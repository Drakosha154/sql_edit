import React, { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  Controls,
  Background,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  MiniMap
} from 'reactflow';
import '@xyflow/react/dist/style.css';

import { 
  Modal, 
  Button, 
  Form, 
  Table, 
  InputGroup, 
  Container,
  Row,
  Col,
  Card
} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

// Кастомный узел для сущности (вынесен за пределы компонента)
const EntityNode = ({ data, selected }) => {
  return (
    <Card className={`erd-entity ${selected ? 'border-primary border-2' : ''} shadow-sm`}>
      <Card.Header className="bg-primary text-white py-2">
        <strong>{data.label}</strong>
      </Card.Header>
      <Card.Body className="p-0">
        <Table size="sm" className="mb-0">
          <tbody>
            {data.attributes.map((attr, idx) => (
              <tr key={idx} className={attr.isPrimary ? 'table-warning' : ''}>
                <td className="ps-2">
                  {attr.name}
                  {attr.isPrimary && (
                    <span className="badge bg-warning text-dark ms-2">PK</span>
                  )}
                </td>
                <td className="text-muted pe-2">{attr.type}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
};

// Фиксируем nodeTypes вне компонента
const nodeTypes = {
  entity: EntityNode,
};

const initialNodes = [
  {
    id: 'user',
    type: 'entity',
    position: { x: 100, y: 100 },
    data: {
      label: 'Пользователь',
      attributes: [
        { name: 'id', type: 'INT', isPrimary: true },
        { name: 'name', type: 'VARCHAR(100)' },
        { name: 'email', type: 'VARCHAR(255)' },
      ]
    }
  }
];

const initialEdges = [
  {
    id: 'user-order',
    source: 'user',
    target: 'order',
    label: '1:N',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#0d6efd', strokeWidth: 2 },
  }
];

export default function ERDEditor() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [entityName, setEntityName] = useState('');
  const [showEntityModal, setShowEntityModal] = useState(false);
  const [currentEntity, setCurrentEntity] = useState(null);

  // Мемоизируем nodeTypes
  const memoizedNodeTypes = useMemo(() => nodeTypes, []);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const addEntity = () => {
    if (!entityName) return;
    
    const newEntity = {
      id: `entity-${Date.now()}`,
      type: 'entity',
      position: { 
        x: Math.random() * 500, 
        y: Math.random() * 500 
      },
      data: {
        label: entityName,
        attributes: [
          { name: 'id', type: 'INT', isPrimary: true }
        ]
      }
    };
    
    setNodes([...nodes, newEntity]);
    setEntityName('');
  };

  const onNodeDoubleClick = (event, node) => {
    setCurrentEntity(node);
    setShowEntityModal(true);
  };

  const updateEntity = (updatedEntity) => {
    setNodes(nodes.map(n => 
      n.id === updatedEntity.id ? updatedEntity : n
    ));
    setShowEntityModal(false);
  };

  return (
    <Container fluid className="erd-editor p-0" style={{ height: '100vh' }}>
      <Row className="bg-light py-2 border-bottom">
        <Col>
          <InputGroup className="w-50">
            <Form.Control
              type="text"
              value={entityName}
              onChange={(e) => setEntityName(e.target.value)}
              placeholder="Название новой сущности"
            />
            <Button variant="primary" onClick={addEntity}>
              <i className="bi bi-plus-lg me-1"></i> Добавить сущность
            </Button>
          </InputGroup>
        </Col>
        <Col className="text-end">
          <Button variant="outline-secondary" className="me-2">
            <i className="bi bi-save me-1"></i> Сохранить
          </Button>
          <Button variant="outline-secondary">
            <i className="bi bi-file-earmark-code me-1"></i> Генерировать SQL
          </Button>
        </Col>
      </Row>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDoubleClick={onNodeDoubleClick}
        nodeTypes={memoizedNodeTypes}  // Используем мемоизированные типы
        fitView
      >
        <Controls />
        <MiniMap />
        <Background gap={12} size={1} />
      </ReactFlow>

      <EntityEditorModal 
        show={showEntityModal}
        entity={currentEntity}
        onSave={updateEntity}
        onHide={() => setShowEntityModal(false)}
      />
    </Container>
  );
}

const EntityEditorModal = ({ show, entity, onSave, onHide }) => {
  // Исправленная инициализация состояния
  const [name, setName] = useState(entity?.data?.label || '');
  const [attributes, setAttributes] = useState(
    entity?.data?.attributes ? [...entity.data.attributes] : []
  );

  const handleSave = () => {
    if (!entity) return;
    
    const updatedEntity = {
      ...entity,
      data: {
        ...entity.data,
        label: name,
        attributes
      }
    };
    
    onSave(updatedEntity);
  };

  const addAttribute = () => {
    setAttributes([...attributes, { name: '', type: 'VARCHAR(255)', isPrimary: false }]);
  };

  const updateAttribute = (index, field, value) => {
    const updated = [...attributes];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'isPrimary' && value) {
      updated.forEach((attr, i) => {
        if (i !== index) attr.isPrimary = false;
      });
    }
    
    setAttributes(updated);
  };

  const removeAttribute = (index) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-table me-2"></i>
          Редактирование сущности
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-4">
          <Form.Label>Название сущности</Form.Label>
          <Form.Control
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Введите название сущности"
          />
        </Form.Group>
        
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5>Атрибуты</h5>
          <Button variant="outline-primary" size="sm" onClick={addAttribute}>
            <i className="bi bi-plus me-1"></i> Добавить атрибут
          </Button>
        </div>
        
        <Table striped bordered hover>
          <thead>
            <tr>
              <th width="30%">Имя атрибута</th>
              <th width="30%">Тип данных</th>
              <th width="10%" className="text-center">PK</th>
              <th width="30%">Действия</th>
            </tr>
          </thead>
          <tbody>
            {attributes.map((attr, index) => (
              <tr key={index}>
                <td>
                  <Form.Control
                    type="text"
                    value={attr.name}
                    onChange={(e) => updateAttribute(index, 'name', e.target.value)}
                    placeholder="Имя атрибута"
                  />
                </td>
                <td>
                  <Form.Select
                    value={attr.type}
                    onChange={(e) => updateAttribute(index, 'type', e.target.value)}
                  >
                    <option value="INT">INT</option>
                    <option value="VARCHAR(255)">VARCHAR(255)</option>
                    <option value="TEXT">TEXT</option>
                    <option value="DECIMAL(10,2)">DECIMAL(10,2)</option>
                    <option value="BOOLEAN">BOOLEAN</option>
                    <option value="DATE">DATE</option>
                    <option value="TIMESTAMP">TIMESTAMP</option>
                    <option value="JSON">JSON</option>
                    <option value="BLOB">BLOB</option>
                  </Form.Select>
                </td>
                <td className="text-center">
                  <Form.Check 
                    type="checkbox"
                    checked={attr.isPrimary}
                    onChange={(e) => updateAttribute(index, 'isPrimary', e.target.checked)}
                    aria-label="Первичный ключ"
                  />
                </td>
                <td>
                  <Button 
                    variant="outline-danger" 
                    size="sm"
                    onClick={() => removeAttribute(index)}
                  >
                    <i className="bi bi-trash"></i> Удалить
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Отмена
        </Button>
        <Button variant="primary" onClick={handleSave}>
          Сохранить изменения
        </Button>
      </Modal.Footer>
    </Modal>
  );
};