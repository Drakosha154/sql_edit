import React, { useCallback, useMemo, useState } from 'react';
import AttributeItem from './AttributeItem';

const TablesList = ({
    nodes,
    addNewNode,
    activeNodeId,
    setActiveNodeId,
    updateNodeAttributes,
    updateEdgeAttributes,
  }) => {

  const [editingNodeId, setEditingNodeId] = useState(null);
  const [newNodeName, setNewNodeName] = useState('');

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
      type: 'bigint',
      isPrimary: false,
      isUnique: false,
      isNullable: true
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
    
    return (
      <section className="d-flex flex-column">
        <div className="d-flex justify-content-center p-2">
          <button 
            type="button" 
            className="btn btn-outline-secondary" 
            onClick={() => addNewNode('Table_', [])}
          >
            <i className="bi bi-table pe-2"></i>
            Создать таблицу
          </button>
        </div>
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
                      <button 
                        onClick={addAttribute} 
                        className="btn border"
                      >
                        Добавить поле
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
};

export default TablesList;
