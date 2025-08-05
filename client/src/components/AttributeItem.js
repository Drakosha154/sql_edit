import React, { useCallback, useState} from 'react';

const AttributeItem = React.memo(({ attribute, onUpdate, onRemove, nodeId, updateEdgeAttributes}) => {

  const [prevName, setPrevName] = useState(attribute.name);
  
  const handleChange = useCallback((field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;

    if (field === 'name' && !value.trim()) {
      alert('Имя атрибута не может быть пустым');
      return;
    }

    // Если изменяется имя атрибута
    if (field === 'name') {
      updateEdgeAttributes(nodeId, prevName, value);
      setPrevName(value);
    }

    onUpdate(attribute.id, field, value);
  }, [onUpdate, attribute.id, nodeId, prevName, updateEdgeAttributes]);

  return (
    <div className="d-flex align-items-center gap-2 mb-2 p-2 border rounded">
      <input
        type="text"
        className="form-control form-control-sm"
        value={attribute.name}
        onChange={handleChange('name')}
        placeholder="Имя атрибута"
      />
      
      <select
        className="form-select form-select-sm"
        value={attribute.type}
        onChange={handleChange('type')}
      >
        <option value="string">TEXT</option>
        <option value="integer">INTEGER</option>
        <option value="boolean">BOOLEAN</option>
        <option value="bigint">BIGINT</option>
        <option value="timestamp">TIMESTAMP</option>
        {/* остальные типы */}
      </select>

      {/* Иконки вместо чекбоксов */}
      <div className="d-flex gap-1">
        {/* Primary Key */}
        <button
          className={`btn btn-sm ${attribute.isPrimary ? 'btn-success' : 'btn-outline-secondary'}`}
          onClick={() => onUpdate(attribute.id, 'isPrimary', !attribute.isPrimary)}
          title="Primary Key"
        >
          <i className="bi bi-key"> </i>
        </button>
        
        {/* Unique */}
        <button
          className={`btn btn-sm ${attribute.isUnique ? 'btn-success' : 'btn-outline-secondary'}`}
          onClick={() => onUpdate(attribute.id, 'isUnique', !attribute.isUnique)}
          title="Unique"
        >
          U
        </button>
        
        {/* Nullable */}
        <button
          className={`btn btn-sm ${attribute.isNullable ? 'btn-outline-secondary' : 'btn-success'}`}
          onClick={() => onUpdate(attribute.id, 'isNullable', !attribute.isNullable)}
          title="Not NULL"
        >
          N
        </button>
      </div>
      <button 
        className="btn btn-sm btn-outline-danger"
        onClick={() => onRemove(attribute.id)}
      >
        X
      </button>
    </div>
  );
});

export default AttributeItem;