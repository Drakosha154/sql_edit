import React from 'react';
import { Handle, Position } from 'reactflow';

const EntityNode = ({ data }) => {
  return (
    <div className="entity-node" style={{ 
      border: '1px solid rgb(51 65 85)',
      borderRadius: '4px',
      backgroundColor: 'rgb(0 191 255)',
      paddingTop: "7px",
      overflow: 'hidden',
      minWidth: '250px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      {/* Заголовок сущности */}
      <div style={{
        backgroundColor: 'rgb(15 23 43)',
        padding: '8px 12px',
        borderBottom: '1px solid rgb(51 65 85)',
        fontWeight: 'bold',
        textAlign: 'center'
      }}>
        {data.label}
      </div>
      
      {/* Список атрибутов */}
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        <table className="table table-sm mb-0">
          <tbody>
            {data.attributes.map((attr, index) => (
              <tr key={index}>
                <td className="text-center">
                  {attr.isPrimary && (
                    <i className="bi bi-key-fill text-warning"></i>
                  )}
                </td>
                <td>{attr.name}</td>
                <td className="text-muted">{attr.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Хендлы для соединений */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ top: '50%', background: '#555' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        style={{ top: '50%', background: '#555' }}
      />
    </div>
  );
};

export default EntityNode;