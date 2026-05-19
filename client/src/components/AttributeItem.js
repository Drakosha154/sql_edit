import React, { useCallback, useState, useMemo } from 'react';

const AttributeItem = React.memo(({ attribute, onUpdate, onRemove, nodeId, updateEdgeAttributes }) => {

  const [prevName, setPrevName] = useState(attribute.name);

  const handleChange = useCallback((field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    if (field === 'name' && !value.trim()) {
      alert('Имя атрибута не может быть пустым');
      return;
    }
    if (field === 'name') {
      updateEdgeAttributes(nodeId, prevName, value);
      setPrevName(value);
    }
    onUpdate(attribute.id, field, value);
  }, [onUpdate, attribute.id, nodeId, prevName, updateEdgeAttributes]);

  const isForeignKey = useMemo(() => {
    return attribute.isForeignKey;
  }, [attribute]);

  const handleTypeChange = useCallback((e) => {
    const newType = e.target.value;
    const typesWithParams = ['VARCHAR', 'CHAR', 'DECIMAL', 'NUMERIC', 'FLOAT', 'DOUBLE'];
    const selectedBaseType = newType.split('(')[0];
    
    if (typesWithParams.includes(selectedBaseType)) {
      const match = newType.match(/\(([^)]+)\)/);
      if (match) {
        

        onUpdate(attribute.id, 'type', newType);
      } else {
        onUpdate(attribute.id, 'type', selectedBaseType);
      }
    } else {

      onUpdate(attribute.id, 'type', newType);
    }
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
        value={attribute.type.split('(')[0]}
        onChange={handleTypeChange}
      >
        <optgroup label="Числовые типы">
          <option value="INTEGER">INTEGER</option>
          <option value="BIGINT">BIGINT</option>
          <option value="DECIMAL">DECIMAL</option>
          <option value="NUMERIC">NUMERIC</option>
          <option value="FLOAT">FLOAT</option>
        </optgroup>
        
        <optgroup label="Символьные типы">
          <option value="TEXT">TEXT</option>
        </optgroup>

        <optgroup label="Логические типы">
          <option value="BOOLEAN">BOOLEAN</option>
        </optgroup>
        
        <optgroup label="Дата и время">
          <option value="DATE">DATE</option>
        </optgroup>
        
      </select>
      
      {isForeignKey && (
        <i className="bi bi-link-45deg text-primary ms-1" title="Foreign Key"></i>
      )}

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