import React, { useCallback, useMemo, useState } from 'react';
import AttributeItem from './AttributeItem';

const TablesList = ({
    nodes,
    addNewNode,
    activeNodeId,
    setActiveNodeId,
    updateNodeAttributes,
    updateEdgeAttributes,
    deleteNode
  }) => {

  const [editingNodeId, setEditingNodeId] = useState(null);
  const [newNodeName, setNewNodeName] = useState('');

  // Состояния для встроенной панели настройки атрибутов
  const [settingMode, setSettingMode] = useState(null); // 'PK' | 'U' | 'N' | null
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [checkedAttrs, setCheckedAttrs] = useState({});

  const handleNodeNameChange = useCallback((nodeId, currentName) => {
    setEditingNodeId(nodeId);
    setNewNodeName(currentName);
  }, []);

  const saveNodeName = useCallback(() => {
    if (editingNodeId && newNodeName.trim()) {
      updateNodeAttributes(editingNodeId, nodes.find(n => n.id === editingNodeId).data.attributes, newNodeName);
    }
    setEditingNodeId(null);
  }, [editingNodeId, newNodeName, nodes, updateNodeAttributes]);

  const activeNode = useMemo(() => 
    nodes.find(node => node.id === activeNodeId), 
    [nodes, activeNodeId]
  );

  const addAttribute = useCallback(() => {
    if (!activeNode) return;
    
    const newAttribute = {
      id: `attr-${Date.now()}`,
      name: `field_${activeNode.data.attributes.length + 1}`,
      type: 'INTEGER',
      isPrimary: false,
      isUnique: false,
      isNullable: false
    };
    
    updateNodeAttributes(activeNode.id, [...activeNode.data.attributes, newAttribute]);
  }, [activeNode, updateNodeAttributes]);

  const updateAttribute = useCallback((attributeId, field, value) => {
    if (!activeNode) return;
    
    const updatedAttributes = activeNode.data.attributes.map(attr => 
      attr.id === attributeId ? { ...attr, [field]: value } : attr
    );
    
    updateNodeAttributes(activeNode.id, updatedAttributes);
  }, [activeNode, updateNodeAttributes]);

  const removeAttribute = useCallback((attributeId) => {
    if (!activeNode) return;
    
    const updatedAttributes = activeNode.data.attributes.filter(
      attr => attr.id !== attributeId
    );
    
    updateNodeAttributes(activeNode.id, updatedAttributes);
  }, [activeNode, updateNodeAttributes]);

  const deleteTable = useCallback(() => {
    if (!activeNodeId) return;
    
    if (window.confirm(`Вы уверены, что хотите удалить таблицу "${activeNode?.data.label}"?`)) {
      deleteNode(activeNodeId);
      setActiveNodeId(null);
    }
  }, [activeNodeId, activeNode, deleteNode, setActiveNodeId]);

  // --- Встроенная панель настройки атрибутов ---
const handleStartSettingMode = (mode) => {
  if (settingMode === mode) {
    // Повторное нажатие — выходим из режима
    handleCancelSettingMode();
  } else {
    // Новое нажатие — активируем режим
    setSettingMode(mode);
    setSelectedTableId(null);
    setCheckedAttrs({});
  }
};

  const handleCancelSettingMode = () => {
    setSettingMode(null);
    setSelectedTableId(null);
    setCheckedAttrs({});
  };

  const handleTableSelect = (tableId) => {
    setSelectedTableId(tableId);
    const table = nodes.find(n => n.id === tableId);
    if (!table) return;

    const attrs = table.data.attributes;
    const checked = {};
    attrs.forEach(attr => {
      if (settingMode === 'PK') {
        checked[attr.id] = attr.isPrimary;
      } else if (settingMode === 'U') {
        checked[attr.id] = attr.isUnique;
      } else if (settingMode === 'N') {
        checked[attr.id] = !attr.isNullable; // NOT NULL = checked
      }
    });
    setCheckedAttrs(checked);
  };

  const toggleAttrCheck = (attrId) => {
    setCheckedAttrs(prev => ({
      ...prev,
      [attrId]: !prev[attrId]
    }));
  };

  const handleSaveSetting = () => {
    if (!selectedTableId || !settingMode) return;

    const table = nodes.find(n => n.id === selectedTableId);
    if (!table) return;

    let updatedAttrs = table.data.attributes.map(attr => {
      let newAttr = { ...attr };
      if (settingMode === 'PK') {
        newAttr.isPrimary = !!checkedAttrs[attr.id];
      } else if (settingMode === 'U') {
        newAttr.isUnique = !!checkedAttrs[attr.id];
      } else if (settingMode === 'N') {
        newAttr.isNullable = !checkedAttrs[attr.id];
      }
      return newAttr;
    });

    // Для PK оставляем только первый отмеченный, остальные сбрасываем
    if (settingMode === 'PK') {
      const primaryAttrs = updatedAttrs.filter(a => a.isPrimary);
      if (primaryAttrs.length > 1) {
        updatedAttrs = updatedAttrs.map(attr => {
          if (attr.isPrimary && attr.id !== primaryAttrs[0].id) {
            return { ...attr, isPrimary: false };
          }
          return attr;
        });
      }
    }

    updateNodeAttributes(selectedTableId, updatedAttrs);
    handleCancelSettingMode(); // закрываем панель после сохранения
  };

  // -------------------------------------------------

  const tableOptions = nodes.map(node => (
    <option key={node.id} value={node.id}>{node.data.label}</option>
  ));

  const selectedTable = nodes.find(n => n.id === selectedTableId);
  const selectedTableAttrs = selectedTable ? selectedTable.data.attributes : [];

  return (
    <section className="d-flex flex-column">
      <div className="d-flex flex-column p-2 gap-2">
        <div className="d-flex gap-2">
          <button 
            type="button" 
            className="btn btn-outline-secondary col-6" 
            onClick={() => addNewNode('Table_', [])}
          >
            Создать таблицу
          </button>
          <button 
            className={`btn col-6 ${settingMode === 'PK' ? 'btn-primary' : 'btn-outline-secondary'}`} 
            onClick={() => handleStartSettingMode('PK')}
            title="Настроить Primary Key"
          >
Primary Key
          </button>
        </div>
        <div className="d-flex gap-2">
          <button 
            className={`btn col-6 ${settingMode === 'U' ? 'btn-primary' : 'btn-outline-secondary'}`} 
            onClick={() => handleStartSettingMode('U')}
            title="Настроить Unique"
          >
            Unique
          </button>
          <button 
            className={`btn col-6 ${settingMode === 'N' ? 'btn-primary' : 'btn-outline-secondary'}`} 
            onClick={() => handleStartSettingMode('N')}
            title="Настроить Not Null"
          >
            Not Null
          </button>
        </div>
      </div>

      {/* Встроенная панель настройки атрибутов */}
      {settingMode && (
        <div className="border rounded p-3 mb-3">
          <h6 className="mb-3">
            {settingMode === 'PK' ? 'Настройка Primary Key' : 
             settingMode === 'U' ? 'Настройка Unique' : 
             'Настройка Not Null'}
          </h6>
          <div className="mb-3">
            <label className="form-label">Таблица:</label>
            <select 
              className="form-select" 
              value={selectedTableId || ''} 
              onChange={(e) => handleTableSelect(e.target.value)}
            >
              <option value="">-- Выберите таблицу --</option>
              {tableOptions}
            </select>
          </div>

          {selectedTableId && (
            <div>
              <div className="fw-bold mb-2">Атрибуты таблицы "{selectedTable?.data.label}"</div>
              <div className="list-group mb-3">
                {selectedTableAttrs.map(attr => (
                  <div key={attr.id} className="list-group-item d-flex align-items-center">
                    <input
                      type="checkbox"
                      className="form-check-input me-2"
                      checked={!!checkedAttrs[attr.id]}
                      onChange={() => toggleAttrCheck(attr.id)}
                    />
                    <span className="me-2">{attr.name}</span>
                    <small className="text-muted">({attr.type})</small>
                    {attr.isForeignKey && <i className="bi bi-link-45deg text-primary ms-2" title="Foreign Key"></i>}
                  </div>
                ))}
              </div>
              <div className="d-flex gap-2 justify-content-end">
                <button className="btn btn-secondary" onClick={handleCancelSettingMode}>Отмена</button>
                <button className="btn btn-primary" onClick={handleSaveSetting} disabled={!selectedTableId}>Сохранить</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Список таблиц (аккордеон) - скрываем, когда активен режим настройки */}
      {!settingMode && (
        <div className="border-top accordion">
          {nodes.map((node) => (
            <div className="accordion-item" key={node.id}>
              <h2 className="accordion-header">
                <button 
                  className={`accordion-button ${activeNodeId === node.id ? '' : 'collapsed'}`}
                  onClick={() => setActiveNodeId(activeNodeId === node.id ? null : node.id)}
                >
                  {editingNodeId === node.id ? (
                    <div className="d-flex gap-2 mb-2">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={newNodeName}
                        onChange={(e) => setNewNodeName(e.target.value)}
                      />
                      <button 
                        className="btn btn-sm btn-success"
                        onClick={saveNodeName}
                      >
                        <i className="bi bi-check"></i>
                      </button>
                    </div>
                  ) : (
                    <div 
                      className="d-flex justify-content-between align-items-center"
                      onClick={() => handleNodeNameChange(node.id, node.data.label)}
                    >
                      <span>{node.data.label}</span>
                      <i className="bi bi-pencil ps-2"></i>
                    </div>
                  )}
                </button>
              </h2>
              <div className={`accordion-collapse collapse ${activeNodeId === node.id ? 'show' : ''}`}>
                <div className="accordion-body">
                  {activeNodeId === node.id && activeNode && (
                    <>
                      {activeNode.data.attributes.map(attribute => (
                        <AttributeItem
                          key={attribute.id}
                          attribute={attribute}
                          onUpdate={updateAttribute}
                          onRemove={removeAttribute}
                          nodeId={activeNode.id}
                          updateEdgeAttributes={updateEdgeAttributes}
                        />
                      ))}
                      <div className="d-flex justify-content-between">
                        <button 
                          onClick={addAttribute} 
                          className="btn border" 
                        >
                          Добавить поле
                        </button>
                        <button 
                          onClick={deleteTable} 
                          className="btn btn-outline-danger" 
                        >
                          Удалить таблицу
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default TablesList;