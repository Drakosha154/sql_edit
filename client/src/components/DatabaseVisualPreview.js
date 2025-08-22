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
      'one-to-one': '#0d6efd',
      'one-to-many': '#198754',
      'many-to-many': '#dc3545'
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
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: edgeColor,
              color: 'white',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 'bold',
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
        className=""
      >
        <i className="bi bi-diagram-3 me-2"></i>
        Просмотр схемы базы данных
      </Button>

      <Modal
        show={showPreview}
        onHide={() => setShowPreview(false)}
        size="xl"
        fullscreen="lg-down"
      >
        <Modal.Header closeButton className="bg-dark text-white">
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
            <Background variant="dots" color="#4a5568" gap={16} size={1} />
            <Controls position="top-right" style={{ 
                backgroundColor: '#2d3748', 
                borderRadius: '4px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.5)' 
            }}>
            </Controls>
            <MiniMap position="bottom-right" style={{ backgroundColor: '#2d3748' }} />
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

      <style jsx>{`
        .erd-preview-node {
          border: 2px solid #4a5568;
          border-radius: 4px;
          background: rgb(51, 65, 85);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          width: 250px;
        }
        
        .erd-preview-node-header {
          background: rgb(15, 23, 43);
          color: white;
          padding: 8px 12px;
          font-weight: bold;
          border-top-left-radius: 4px;
          border-top-right-radius: 4px;
        }

        .erd-edge-label {
            background: white;
            border: 1px solid #ddd;
            border-radius: 15px;
            padding: 2px 8px;
            text-align: center;
            font-size: 12px;
            font-weight: bold;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .react-flow__edge-path {
            stroke-width: 2;
        }
        
        .erd-preview-node-body {
          padding: 8px;
        }
        
        .erd-preview-attribute {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          border-bottom: 1px solid #4a5568;
          font-size: 12px;
        }
        
        .erd-preview-attribute:last-child {
          border-bottom: none;
        }
        
        .attribute-name {
          font-weight: 500;
        }
        
        .attribute-type {
          color: #666;
        }
        
        .attribute-pk {
          background: #0d6efd;
          color: white;
          padding: 0 4px;
          border-radius: 3px;
          font-size: 10px;
        }
        
        .attribute-null {
          background: #fd7e14;
          color: white;
          padding: 0 4px;
          border-radius: 3px;
          font-size: 10px;
        }
        
        .erd-preview-edge-label {
          background: white;
          padding: 2px 8px;
          border-radius: 10px;
          border: 1px solid #999;
          font-size: 12px;
          font-weight: bold;
        }
        
        .erd-legend {
          background: rgb(51, 65, 85);
          padding: 8px 12px;
          border-radius: 4px;
          display: flex;
          gap: 15px;
          font-size: 14px;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .legend-pk {
          background: #0d6efd;
          color: white;
          padding: 0 4px;
          border-radius: 3px;
        }
        
        .legend-null {
          background: #fd7e14;
          color: white;
          padding: 0 4px;
          border-radius: 3px;
        }
        
        .legend-1n {
          background: #198754;
          color: white;
          padding: 0 4px;
          border-radius: 3px;
        }
        
        .legend-11 {
          background: #0dcaf0;
          color: white;
          padding: 0 4px;
          border-radius: 3px;
        }
        
        .legend-nn {
          background: #dc3545;
          color: white;
          padding: 0 4px;
          border-radius: 3px;
        }
      `}</style>
    </>
  );
};

export default DatabaseVisualPreview;