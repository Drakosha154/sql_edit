import React, { useCallback, useMemo } from 'react';

const RelationsList = ({edges, activeEdgeId, ActiveEdgeId, setActiveEdgeId}) => {

    const activeEdge = useMemo(() => 
        edges.find(edge => edge.id === activeEdgeId), 
        [edges, activeEdgeId]
    );

    return (
        <div className="border-top accordion">
          {edges.map((edge) => (
            <div className="accordion-item" key={edge.id}>
              <h2 className="accordion-header">
                <button 
                  className={`accordion-button ${activeEdgeId === edge.id ? '' : 'collapsed'}`}
                  onClick={() => setActiveEdgeId(activeEdgeId === edge.id ? null : edge.id)}
                >
                {/* пофиксить длинные названия id */}
                  {edge.id}
                </button>
              </h2>
              <div className={`accordion-collapse collapse ${activeEdgeId === edge.id ? 'show' : ''}`}>
                <div className="accordion-body">
                  {activeEdgeId === edge.id && activeEdge && (
                    <div class='p-1'>
                        <div class="d-flex flex-column">
                            <div class="d-flex justify-content-between">
                                <div class="d-flex flex-column">
                                    Основная таблица
                                    <div class="d-flex">
                                        {console.log(edges)}
                                        {edge.source}
                                    </div>
                                </div>
                                <div class="d-flex flex-column">
                                    Справочная таблица
                                <div class="d-flex">
                                        {console.log(edges)}
                                        {edge.target}
                                    </div>
                                </div>
                            </div>
                            <div>
                            </div>
                        </div>
                        <div class="d-flex justify-content-center">
                            <button class='btn'>
                                ff
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