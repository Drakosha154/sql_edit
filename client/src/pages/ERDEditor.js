import React, { useState, useCallback, useMemo} from 'react';
import ReactFlow, {
  Controls,
  Background,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  MiniMap,
  Position,
} from 'reactflow';
import '@xyflow/react/dist/style.css';
import { css } from "@emotion/react";

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
    <div style={{width : '100%', height : '80vh'}}>
      <Row className="bg-light py-2 border-bottom">
              <Col>
                <InputGroup className="w-50">
                  <Form.Control
                    type="text"
                    value={entityName}
                    onChange={(e) => setEntityName(e.target.value)}
                    placeholder="Название новой сущности"
                  />
                  <Button variant="primary" onClick={''}>
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
          onNodesChange={onNodesChange}
          edges={edges}
          onEdgesChange={onEdgesChange}
          colorMode="dark"
          fitView>
            <MiniMap />
            <Background />
            <Controls />
          </ReactFlow>
      <footer className="py-3 text-center bottom">
          <p className="mb-0 text-muted">ERD Editor © {new Date().getFullYear()}</p>
      </footer>
    </div>

  );
}