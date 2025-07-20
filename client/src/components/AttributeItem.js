import React, { useCallback } from 'react';

const AttributeItem = React.memo(({ attribute, onUpdate, onRemove }) => {
  const handleChange = useCallback((field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    onUpdate(attribute.id, field, value);
  }, [onUpdate, attribute.id]);

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
        <option value="bigint">bigint</option>
        <option value="integer">integer</option>
        {/* остальные типы */}
      </select>
      
      <div className="d-flex gap-2">
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            checked={attribute.isPrimary}
            onChange={handleChange('isPrimary')}
          />
          <label className="form-check-label small">PK</label>
        </div>
        
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            checked={attribute.isNullable}
            onChange={handleChange('isNullable')}
          />
          <label className="form-check-label small">NULL</label>
        </div>
      </div>
      
      <button 
        className="btn btn-sm btn-outline-danger"
        onClick={() => onRemove(attribute.id)}
      >
        &times;
      </button>
    </div>
  );
});

export default AttributeItem;