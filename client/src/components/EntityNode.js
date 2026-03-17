import React from 'react';
import { Handle, Position, useUpdateNodeInternals } from 'reactflow';
import { useState, useEffect, useCallback} from 'react';
import './EntityNode.css';

const EntityNode = ({ id, data }) => {
  const [hoveredAttr, setHoveredAttr] = useState(null);
  const [hoverHeader, setHoverHeader] = useState(false);
  const updateNodeInternals = useUpdateNodeInternals();

  // Обновляем внутреннее состояние при изменении атрибутов
  useEffect(() => {
    // Это заставит React Flow пересчитать все handle'ы узла
    updateNodeInternals(id);
  }, [data.attributes, id, updateNodeInternals]);

  // Проверяем, является ли атрибут ключевым (Primary Key или Unique) для source
  const isKeyAttribute = (attr) => {
    return attr.isPrimary || attr.isUnique;
  };


  // Проверяем, является ли атрибут внешним ключом для target
  const isForeignKey = (attr) => {
    // Атрибут считается внешним ключом, если его имя заканчивается на _id
    // или если есть специальный флаг
    return attr.isForeignKey;
  };

  return (
    <div className="entity-node border border-2 overflow-visible" >
      {/* Заголовок сущности - с хендлами для создания новых FK */}
      <div 
        className="border-bottom entity-header position-relative"
        onMouseEnter={() => setHoverHeader(true)}
        onMouseLeave={() => setHoverHeader(false)}
      >
        <i className="bi bi-table pe-2"></i>
        {data.label}
        
        {/* Target Handle на заголовке (для создания новых FOREIGN KEY) */}
        <Handle
          type="target"
          position={Position.Left}
          id={`table-target-${id}`}
          style={{
            opacity: hoverHeader ? 1 : 0.3,
            background: '#28a745', // Зеленый для таблицы
            width: 12,
            height: 12,
            left: -6,
            transition: 'opacity 0.2s',
            zIndex: 15
          }}
          isConnectable={true}
        />
      
      </div>
      
      {/* Список атрибутов */}
      <div className="position-relative">
        <div className="entity-attributes-container">
          {data.attributes.map((attr) => (
          <div 
            key={attr.id}
            className="attribute-row position-relative d-flex border-bottom border-1"
            onMouseEnter={() => setHoveredAttr(attr.id)}
            onMouseLeave={() => setHoveredAttr(null)}
            data-tooltip={
              attr.isPrimary ? 'Primary Key' : 
              attr.isUnique ? 'Unique Key' : 
              isForeignKey(attr) ? 'Foreign Key' : 'Attribute'
            }
          >
            {/* Target Handle (слева) - для внешних ключей */}
            {isForeignKey(attr) && (
              <div className="handle-container left">
                <Handle
                  type="target"
                  position={Position.Left}
                  id={attr.id}
                  style={{
                    opacity: hoveredAttr === attr.id ? 1 : 0.5,
                    background: '#dc3545', // Красный для target (внешние ключи)
                    width: 10,
                    height: 10,
                    left: -5,
                    transition: 'opacity 0.2s',
                    zIndex: 10
                  }}
                  isConnectable={true}
                />
              </div>
            )}

            {/* Содержимое атрибута */}
            <div className="attribute-content" style={{ 
              paddingLeft: '15px',
              paddingRight: '15px'
            }}>
              <span>{attr.name}</span>
            </div>
            
            <div className="d-flex justify-content-end px-2">
              <div className="attribute-type">
                {attr.isPrimary && <i className="bi bi-key-fill text-warning" title="Primary Key"> </i>}
                {attr.isUnique && !attr.isPrimary && <i className="bi bi-star-fill text-info" title="Unique"> </i>}
                {isForeignKey(attr) && !attr.isPrimary && (
                  <i className="bi bi-link-45deg text-danger" title="Foreign Key"> </i>
                )}
                <span className="ms-1">{attr.type}</span>
              </div>
            </div>
            

            {/* Source Handle (справа) - для ключевых атрибутов */}
            {isKeyAttribute(attr) && (
              <div className="handle-container right">
                <Handle
                  type="source"
                  position={Position.Right}
                  id={attr.id}
                  style={{
                    opacity: hoveredAttr === attr.id ? 1 : 0.5,
                    background: '#0072ff', // Синий для source (первичные/уникальные ключи)
                    width: 10,
                    height: 10,
                    right: -5,
                    transition: 'opacity 0.2s',
                    zIndex: 10
                  }}
                  isConnectable={true}
                />
              </div>
            )}
          </div>
        ))}
        </div>
      </div>
    </div>
  );
};

export default EntityNode;