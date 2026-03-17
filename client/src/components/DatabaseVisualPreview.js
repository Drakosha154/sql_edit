import React, { useState, useMemo, useCallback } from 'react';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  getBezierPath,
  BaseEdge,
  Panel,
  EdgeLabelRenderer,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button, Modal } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import "bootstrap-icons/font/bootstrap-icons.css";
import EntityNode from '../components/EntityNode';
import { useDagreLayout } from '../utils/useDagreLayout';
import './DatabaseVisualPreview.css'; // Импортируем CSS файл

const nodeTypes = { entity: EntityNode };

const DatabaseVisualPreview = ({ nodes, edges, setNodes, onNodesChange, onEdgesChange }) => {
  const [showPreview, setShowPreview] = useState(false);
  const applyLayout = useDagreLayout();


  //компановка
  const handleAutoLayout = useCallback(() => {
    setShowPreview(true)
    const layoutedNodes = applyLayout(nodes, edges, 'LR');
    setNodes(layoutedNodes);
  }, [nodes, edges, applyLayout]);


  // Кастомный рендер для связей
  const CustomEdge = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    markerEnd,
    data
  }) => {
    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });

    const relationColors = {
      'one-to-one': 'var(--relation-one-to-one, #0d6efd)',
      'one-to-many': 'var(--relation-one-to-many, #198754)',
      'many-to-many': 'var(--relation-many-to-many, #dc3545)'
    };

    const edgeColor = relationColors[data?.relationType] || '#6c757d';

    return (
      <>
        <BaseEdge
          path={edgePath}
          markerEnd={markerEnd}
          style={{ stroke: edgeColor, strokeWidth: 2 }}
        />
        <EdgeLabelRenderer>
          <div
            className="custom-edge-label"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: edgeColor,
            }}
          >
            {data?.label || '1:N'}
          </div>
        </EdgeLabelRenderer>
      </>
    );
  };

  const edgeTypes = {
    custom: CustomEdge
  };

  // Форматируем edges для корректного отображения
  const formattedEdges = useMemo(() => {
    return edges.map(edge => ({
      ...edge,
      type: 'custom',
      markerEnd: undefined
    }));
  }, [edges]);

  return (
    <>
      <Button 
        variant="outline-primary" 
        onClick={handleAutoLayout}
        className="database-preview-btn"
      >
        <i className="bi bi-diagram-3 me-2"></i>
        Просмотр схемы базы данных
      </Button>

      <Modal
        show={showPreview}
        onHide={() => setShowPreview(false)}
        size="xl"
        fullscreen="lg-down"
        className="preview-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Визуальная схема базы данных</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0" style={{ height: '70vh' }}>
          <ReactFlow
            nodes={nodes}
            edges={formattedEdges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            edgeTypes={edgeTypes}
            nodesConnectable={false}
            fitView
          >
            <Background variant="dots" gap={16} size={1} />
            <Controls position="top-right" />
            <MiniMap position="bottom-right" />
            <Background />
            
            <Panel>
              <div className="erd-legend">
                <div className="legend-item">
                  <span className="legend-1n">1:N</span> - Один ко многим
                </div>
                <div className="legend-item">
                  <span className="legend-11">1:1</span> - Один к одному
                </div>
                <div className="legend-item">
                  <span className="legend-nn">N:N</span> - Многие ко многим
                </div>
              </div>
            </Panel>
          </ReactFlow>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreview(false)}>
            Закрыть
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default DatabaseVisualPreview;