import React, { useCallback, useMemo, useState} from 'react';

const RelationsList = ({edges, activeEdgeId, setActiveEdgeId, updateEdgeRelation, deleteEdge}) => {

    const activeEdge = useMemo(() => 
        edges.find(edge => edge.id === activeEdgeId), 
        [edges, activeEdgeId]
    );

    const handleRelationChange = useCallback((e) => {
        const newRelation = e.target.value;
        updateEdgeRelation(activeEdgeId, newRelation);
    }, [activeEdgeId, updateEdgeRelation]);

    const handleDelete = useCallback(() => {
    if (window.confirm('Удалить это соединение?')) {
      deleteEdge(activeEdgeId);
      setActiveEdgeId(null);
    }
  }, [activeEdgeId, deleteEdge, setActiveEdgeId]);


    return (
        <div className="border-top accordion">
          {edges.map((edge) => (
            <div className="accordion-item" key={edge.id}>
              <h2 className="accordion-header">
                <button 
                  className={`accordion-button ${activeEdgeId === edge.id ? '' : 'collapsed'}`}
                  onClick={() => setActiveEdgeId(activeEdgeId === edge.id ? null : edge.id)}
                >
                  {edge.data?.sourceLabel || edge.source} → {edge.data?.targetLabel || edge.target}
                  <span className="ms-2 badge bg-primary">
                    {edge.data?.label || '1:N'}
                  </span>
                </button>
              </h2>
              <div className={`accordion-collapse collapse ${activeEdgeId === edge.id ? 'show' : ''}`}>
                <div className="accordion-body">
                  {activeEdgeId === edge.id && activeEdge && (
                    <div class='d-flex flex-column row-gap-2'>
                        <div class="d-flex flex-column row-gap-2">
                            <div class="d-flex justify-content-between">
                                <div class="d-flex flex-column">
                                    Основная таблица
                                    <div class="d-flex">
                                        {console.log(edges)}
                                        {edge.data?.sourceLabel || edge.source}
                                    </div>
                                </div>
                                <div class="d-flex flex-column">
                                    Справочная таблица
                                <div class="d-flex">
                                        {console.log(edges)}
                                        {edge.data?.targetLabel || edge.target}
                                    </div>
                                </div>
                            </div>
                            <div class='d-flex justify-content-center p-1'>
                              <select 
                                value={edge.data.relationType}
                                onChange={handleRelationChange}
                                class="form-select border"
                              >
                                <option value="one-to-many">Один ко многим (1:N)</option>
                                <option value="many-to-one">Многие к одному (N:1)</option>
                                <option value="one-to-one">Один к одному (1:1)</option>
                                <option value="many-to-many">Многие ко многим (N:N)</option>
                              </select>
                            </div>
                        </div>
                        <div class="d-flex justify-content-center p-1">
                            <button 
                              className='btn btn-danger'
                              onClick={handleDelete}
                            >
                              <i className="bi bi-trash"></i> Удалить
                            </button>
                        </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
    );
};

export default RelationsList;