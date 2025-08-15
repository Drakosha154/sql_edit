import { getBezierPath } from 'reactflow';

import { useCallback, useState, useMemo} from 'react';

import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  BaseEdge,
  Panel,
  EdgeLabelRenderer
} from 'reactflow';

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style = {},
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });

  // Определяем маркеры в зависимости от типа связи
  const { markerStart, markerEnd, edgeStyle } = useMemo(() => {
  const baseStyle = { 
    ...style, 
    stroke: '#6c757d', 
    strokeWidth: 2,
    fill: 'none'
  };
  
  switch(data?.relationType) {
    case 'one-to-one':
      return {
        markerStart: 'url(#one-marker)',
        markerEnd: 'url(#one-marker)',
        edgeStyle: baseStyle
      };
    case 'one-to-many':
      return {
        markerStart: 'url(#one-marker)',
        markerEnd: 'url(#many-marker)',
        edgeStyle: baseStyle
      };
    case 'many-to-one':
      return {
        markerStart: 'url(#many-marker)',
        markerEnd: 'url(#one-marker)',
        edgeStyle: baseStyle
      };
    case 'many-to-many':
      return {
        markerStart: 'url(#many-marker)',
        markerEnd: 'url(#many-marker)',
        edgeStyle: baseStyle
      };
    default:
      return {
        markerStart: undefined,
        markerEnd: undefined,
        edgeStyle: style
      };
  }
}, [data?.relationType, style]);

const edgeColor = '#6c757d';

  return (
    <>
      <BaseEdge
        id={id}
        className="react-flow__edge-path"
        path={edgePath}
        markerEnd={markerEnd}
        style={{ stroke: edgeColor, strokeWidth: 2 }}
      />
      <EdgeLabelRenderer>
      <div
          href={`#${id}`}
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
          startOffset="50%"
          textAnchor="middle"
        >
          {data.label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}