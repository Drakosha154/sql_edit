import React from 'react';
import { Handle, Position} from 'reactflow';
import { useState } from 'react';
import './EntityNode.css';


const DEFAULT_HANDLE_STYLE = {
  width: 10,
  height: 10,
};

const EntityNode = ({ id, data }) => {
  const [hoveredAttr, setHoveredAttr] = useState(null);

  return (
    <div className="entity-node border border-2 overflow-visible" >
      {/* Заголовок сущности */}
      <div className="border-bottom entity-header" >
        <i className="bi bi-table pe-2"></i>
        {data.label}
      </div>
      
      {/* Список атрибутов */}
      <div className="position-relative">
        <div className="entity-attributes-container">
          {data.attributes.map((attr) => (
          <div 
            key={attr.id}
            className="attribute-row position-relative d-flex border-bottom border-1 mb"
            onMouseEnter={() => setHoveredAttr(attr.id)}
            onMouseLeave={() => setHoveredAttr(null)}
          >
            {/* Target Handle (слева) */}
            <div className="handle-container left">
              <Handle
                type="target"
                position={Position.Left}
                id={`${attr.id}`}
                isConnectable={true}
              />
            </div>

            {/* Содержимое атрибута */}
            <div className="attribute-content">
              <span>{attr.name}</span>
            </div>
            <div className="d-flex justify-content-end px-2">
              <div className="attribute-type">
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
                id={`${attr.id}`}
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