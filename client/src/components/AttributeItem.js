import React, { useCallback, useState, useEffect } from 'react';

const AttributeItem = React.memo(({ attribute, onUpdate, onRemove, nodeId, updateEdgeAttributes}) => {

  const [prevName, setPrevName] = useState(attribute.name);
  const [showParams, setShowParams] = useState(false);
  const [param1, setParam1] = useState('');
  const [param2, setParam2] = useState('');
  
  // Инициализация параметров при монтировании и изменении типа
  useEffect(() => {
    // Если тип уже содержит параметры (например, "VARCHAR(255)" или "DECIMAL(10,2)")
    const match = attribute.type.match(/^(\w+)\(([^)]+)\)$/);
    if (match) {
      const [, baseType, params] = match;
      const paramsArray = params.split(',').map(p => p.trim());
      setParam1(paramsArray[0] || '');
      setParam2(paramsArray[1] || '');
      setShowParams(true);
    } else {
      setShowParams(false);
      setParam1('');
      setParam2('');
    }
  }, [attribute.type]);

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

  const handleTypeChange = useCallback((e) => {
    const newType = e.target.value;
    
    // Если тип требует параметров
    const typesWithParams = ['VARCHAR', 'CHAR', 'DECIMAL', 'NUMERIC', 'FLOAT', 'DOUBLE'];
    const selectedBaseType = newType.split('(')[0];
    
    if (typesWithParams.includes(selectedBaseType)) {
      setShowParams(true);
      // Если параметры уже есть в типе (например, при выборе из списка)
      const match = newType.match(/\(([^)]+)\)/);
      if (match) {
        const params = match[1].split(',').map(p => p.trim());
        setParam1(params[0] || '');
        setParam2(params[1] || '');
        onUpdate(attribute.id, 'type', newType);
      } else {
        // Без параметров по умолчанию
        onUpdate(attribute.id, 'type', selectedBaseType);
      }
    } else {
      setShowParams(false);
      setParam1('');
      setParam2('');
      onUpdate(attribute.id, 'type', newType);
    }
  }, [onUpdate, attribute.id]);

  const handleApplyParams = useCallback(() => {
    let newType = attribute.type.split('(')[0]; // Берем базовый тип без параметров
    
    if (param1.trim()) {
      if (param2.trim()) {
        newType = `${newType}(${param1},${param2})`;
      } else {
        newType = `${newType}(${param1})`;
      }
    }
    
    onUpdate(attribute.id, 'type', newType);
  }, [attribute.type, param1, param2, onUpdate, attribute.id]);

  // Функция для получения отображаемого имени типа
  const getDisplayType = (type) => {
    const baseType = type.split('(')[0];
    const typeNames = {
      'STRING': 'TEXT',
      'INTEGER': 'INTEGER',
      'BIGINT': 'BIGINT',
      'SMALLINT': 'SMALLINT',
      'DECIMAL': 'DECIMAL',
      'NUMERIC': 'NUMERIC',
      'REAL': 'REAL',
      'DOUBLE': 'DOUBLE PRECISION',
      'FLOAT': 'FLOAT',
      'BOOLEAN': 'BOOLEAN',
      'DATE': 'DATE',
      'TIME': 'TIME',
      'TIMESTAMP': 'TIMESTAMP',
      'TIMESTAMPTZ': 'TIMESTAMP WITH TIME ZONE',
      'INTERVAL': 'INTERVAL',
      'VARCHAR': 'VARCHAR',
      'CHAR': 'CHAR',
      'TEXT': 'TEXT',
      'BYTEA': 'BYTEA',
      'JSON': 'JSON',
      'JSONB': 'JSONB',
      'UUID': 'UUID',
      'SERIAL': 'SERIAL',
      'BIGSERIAL': 'BIGSERIAL'
    };
    
    return typeNames[baseType] || type;
  };

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
            <option value="SMALLINT">SMALLINT</option>
            <option value="BIGINT">BIGINT</option>
            <option value="DECIMAL">DECIMAL</option>
            <option value="NUMERIC">NUMERIC</option>
            <option value="REAL">REAL</option>
            <option value="DOUBLE">DOUBLE PRECISION</option>
            <option value="FLOAT">FLOAT</option>
            <option value="SERIAL">SERIAL</option>
            <option value="BIGSERIAL">BIGSERIAL</option>
          </optgroup>
          
          <optgroup label="Символьные типы">
            <option value="VARCHAR">VARCHAR</option>
            <option value="CHAR">CHAR</option>
            <option value="TEXT">TEXT</option>
            <option value="STRING">TEXT (алиас)</option>
          </optgroup>
          
          <optgroup label="Бинарные типы">
            <option value="BYTEA">BYTEA (binary)</option>
          </optgroup>
          
          <optgroup label="Логические типы">
            <option value="BOOLEAN">BOOLEAN</option>
          </optgroup>
          
          <optgroup label="Дата и время">
            <option value="DATE">DATE</option>
            <option value="TIME">TIME</option>
            <option value="TIMESTAMP">TIMESTAMP</option>
            <option value="TIMESTAMPTZ">TIMESTAMP WITH TIME ZONE</option>
            <option value="INTERVAL">INTERVAL</option>
          </optgroup>
          
          <optgroup label="Специальные типы">
            <option value="UUID">UUID</option>
            <option value="JSON">JSON</option>
            <option value="JSONB">JSONB</option>
          </optgroup>
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