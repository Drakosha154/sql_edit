import React, { useCallback, useMemo } from 'react';
import AttributeItem from './AttributeItem';

const TablesList = ({
    nodes,
    addNewNode,
    activeNodeId,
    setActiveNodeId,
    updateNodeAttributes}) => {

  const activeNode = useMemo(() => 
    nodes.find(node => node.id === activeNodeId), 
    [nodes, activeNodeId]
  );

  const addAttribute = useCallback(() => {
    if (!activeNode) return;
    
    const newAttribute = {
      id: `attr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: `field_${activeNode.data.attributes.length + 1}`,
      type: 'bigint',
      isPrimary: false,
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
                  {node.data.label}
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
