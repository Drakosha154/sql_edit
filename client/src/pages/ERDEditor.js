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

import 'reactflow/dist/style.css';
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
import EntityNode from '../components/EntityNode';

const nodeTypes = { entity: EntityNode };

const createEntityNode = (entityName, attributes, position) => ({
  id: `entity-${Date.now()}`,
  type: 'entity',
  position,
  data: {
    label: entityName,
    attributes: attributes.map(attr => ({
      name: attr.name,
      type: attr.type,
      isPrimary: attr.isPrimary
    }))
  }
});

export default function ERDEditor() {
  const [nodes, setNodes] = useState([
    createEntityNode('customers', [
      { name: 'customer_id', type: 'integer', isPrimary: true },
      { name: 'first_name', type: 'character?' },
      { name: 'last_name', type: 'character?' },
      { name: 'phone', type: 'character?' },
      { name: 'email', type: 'character?' },
      { name: 'street', type: 'character?' },
      { name: 'city', type: 'character?' },
      { name: 'state', type: 'character?' },
      { name: 'zip_code', type: 'character?' }
    ], { x: 100, y: 100 })
  ]);
  
  const [edges, setEdges] = useState([]);

  const onNodesChange = useCallback(
    changes => setNodes(nds => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    changes => setEdges(eds => applyEdgeChanges(changes, eds)),
    []
  );

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        proOptions={{ dark: true }}
        fitView
      >
        <MiniMap style={{ backgroundColor: '#2d3748' }}/>
            <Background 
          variant="dots" 
          color="#4a5568"  // Цвет для тёмной темы
          gap={16} 
          size={1} 
        />
        <Controls 
          style={{ 
            backgroundColor: '#2d3748', 
            borderRadius: '4px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.5)' 
          }} 
        />
      </ReactFlow>
    </div>
  );
}