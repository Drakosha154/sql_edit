import React from 'react';
import { Handle, Position} from 'reactflow';
import { useState } from 'react';


const DEFAULT_HANDLE_STYLE = {
  width: 10,
  height: 10,
};

const EntityNode = ({ id, data }) => {
  const [hoveredAttr, setHoveredAttr] = useState(null);

  return (
    <div className="entity-node border border-2 overflow-visible" style={{
      borderRadius: '4px',
      backgroundColor: 'rgb(1 191 255)',
      paddingTop: "7px",
      overflow: 'hidden',
      minWidth: '200px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      position: 'relative' // Необходимо для позиционирования хендлов
      }}>
      {/* Заголовок сущности */}
      <div className="border-bottom" style={{
        backgroundColor: 'rgb(15 23 43)',
        padding: '8px 12px',
        fontWeight: 'bold',

      }}>
        <i className="bi bi-table pe-2"></i>
        {data.label}
      </div>
      
      {/* Список атрибутов */}
      <div className="position-relative">
        <div style={{ maxHeight: '20rem'}}>


          {data.attributes.map((attr) => (
          <div 
            key={attr.id}
            className="attribute-row position-relative d-flex border-bottom border-1 mb"
            onMouseEnter={() => setHoveredAttr(attr.id)}
            onMouseLeave={() => setHoveredAttr(null)}
            style={{
            backgroundColor: 'rgb(51 65 85)'}}
          >
            {/* Target Handle (слева) */}
            <div className="handle-container left">
              <Handle
                type="target"
                position={Position.Left}
                id={`${id}-${attr.id}-target`}
                style={{ 
                  opacity: hoveredAttr === attr.id ? 1 : 0.3,
                  background: '#ff0072',
                  width: 8,
                  height: 8,
                  transition: 'opacity 0.2s'
                }}
                isConnectable={true}
              />
            </div>

            {/* Содержимое атрибута */}
            <div className="d-flex item-cente justify-content-start me-auto px-2">
              <span>{attr.name}</span>
            </div>
            <div className="d-flex justify-content-end px-2">
              <div className="center text-muted">
                {attr.isPrimary &&
                  <i className="bi bi-key"> </i>
                }
                {attr.type}
              </div>
            </div>

            {/* Source Handle (справа) */}
            <div className="handle-container right">
              <Handle
                type="source"
                position={Position.Right}
                id={`${id}-${attr.id}-source`}
                style={{
                  opacity: hoveredAttr === attr.id ? 1 : 0.3,
                  background: '#0072ff',
                  width: 8,
                  height: 8,
                  transition: 'opacity 0.2s'
                }}
                isConnectable={true}
              />
            </div>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
};

export default EntityNode;