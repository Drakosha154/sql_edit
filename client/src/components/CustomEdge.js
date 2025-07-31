import { getBezierPath } from 'reactflow';

import { useCallback, useState, useMemo} from 'react';

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
  const [edgePath] = getBezierPath({
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

  return (
    <>
      <path
        id={id}
        style={edgeStyle}
        className="react-flow__edge-path"
        d={edgePath}
        markerStart={markerStart}
        markerEnd={markerEnd}
      />
      <text>
        <textPath
          href={`#${id}`}
          style={{ fontSize: 12, fill: '#f8f9fa' }}
          startOffset="50%"
          textAnchor="middle"
        >
          {data.label}
        </textPath>
      </text>
    </>
  );
}