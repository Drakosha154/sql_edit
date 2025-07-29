import React, { useState, useCallback, useMemo } from 'react';
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
  Row,
  Col,
  Card
} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import "bootstrap-icons/font/bootstrap-icons.css";
import './ERDEditor.css';

import Sidebar from '../components/Sidebar';
import EntityNode from '../components/EntityNode';
import CustomEdge from '../components/CustomEdge';

const nodeTypes = { entity: EntityNode };
const edgeTypes = { custom: CustomEdge };

const createEntityNode = (entityName, attributes, position) => ({
  id: `entity-${entityName}-${Date.now()}`, // Уникальный ID
  type: 'entity',
  position,
  data: {
    label: entityName,
    attributes: attributes.map(attr => ({
      id: `attr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Уникальный ID для атрибута
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

  // Обновление атрибутов конкретного узла
  const updateNodeAttributes = useCallback((nodeId, newAttributes) => {
  setNodes(prevNodes => 
    prevNodes.map(node => {
      if (node.id !== nodeId) return node;
      
      const updatedNode = {
        ...node,
        data: {
          ...node.data,
          attributes: newAttributes.map(attr => ({...attr})) // Полное копирование
        }
      };
      
      return updatedNode;
    })
  );
}, []);

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
    console.log(edges);
  }, [nodes]);

  const onConnect = useCallback((params) => {
    setEdges(eds => addEdge({
      ...params,
      type: 'custom',
      animated: true,
      markerEnd: { type: 'arrowclosed' } // Добавьте маркер
    }, eds));
  }, []);

  const onNodesChange = useCallback(
    changes => setNodes(nds => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    changes => setEdges(eds => applyEdgeChanges(changes, eds)),
    []
  );

  return (
    <div className="erd-container d-flex w-100 h-100 position-relative overflow-hidden">
      <div className="sidebar-wrapper">
      <Sidebar 
        nodes={nodes}
        edges={edges}
        activeNodeId={activeNodeId}
        activeEdgeId={activeEdgeId}
        setActiveNodeId={setActiveNodeId}
        setActiveEdgeId={setActiveEdgeId}
        addNewNode={addNewNode}
        updateNodeAttributes={updateNodeAttributes}
      />
      </div>
      <div className="reactflow-wrapper position-relative flex-grow-1 h-100">
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
          <Background 
            variant="dots" 
            color="#4a5568"
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
    </div>
  );
}