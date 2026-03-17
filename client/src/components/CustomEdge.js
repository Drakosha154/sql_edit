import { getBezierPath } from 'reactflow';
import { useMemo } from 'react';
import { BaseEdge, EdgeLabelRenderer } from 'reactflow';

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
  const { markerStart, markerEnd } = useMemo(() => {
    switch(data?.relationType) {
      case 'one-to-one':
        return {
          markerStart: 'url(#one-marker)',
          markerEnd: 'url(#one-marker)',
        };
      case 'one-to-many':
        return {
          markerStart: 'url(#one-marker)',
          markerEnd: 'url(#many-marker)',
        };
      case 'many-to-one':
        return {
          markerStart: 'url(#many-marker)',
          markerEnd: 'url(#one-marker)',
        };
      case 'many-to-many':
        return {
          markerStart: 'url(#many-marker)',
          markerEnd: 'url(#many-marker)',
        };
      default:
        return {
          markerStart: undefined,
          markerEnd: undefined,
        };
    }
  }, [data?.relationType]);

  const edgeColor = '#6c757d';

  return (
    <>
      {/* Определение маркеров для стрелок */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <marker
            id="one-marker"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="5"
            orient="auto"
          >
            <line x1="2" y1="5" x2="8" y2="5" stroke={edgeColor} strokeWidth="2" />
            <circle cx="2" cy="5" r="2" fill={edgeColor} />
          </marker>
          <marker
            id="many-marker"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="5"
            orient="auto"
          >
            <line x1="2" y1="2" x2="8" y2="5" stroke={edgeColor} strokeWidth="2" />
            <line x1="2" y1="8" x2="8" y2="5" stroke={edgeColor} strokeWidth="2" />
          </marker>
        </defs>
      </svg>

      <BaseEdge
        id={id}
        className="react-flow__edge-path"
        path={edgePath}
        markerStart={markerStart}
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
            pointerEvents: 'none',
            zIndex: 1000,
          }}
        >
          {data.label}
        </div>
      </EdgeLabelRenderer>

      {/* Подсказка при наведении на связь */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY - 20}px)`,
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            opacity: 0,
            transition: 'opacity 0.2s',
            zIndex: 1000,
          }}
          className="edge-tooltip"
        >
          {data.sourceAttr} → {data.targetAttr}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}