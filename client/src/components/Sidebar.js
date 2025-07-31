import React, {useState, useCallback, useMemo } from 'react';
import TablesList from './TablesList';
import RelationsList from './RelationsList';
import { Tab, Nav, Row, Col } from 'react-bootstrap';

const Sidebar = React.memo(({ 
  nodes, 
  edges,
  activeNodeId, 
  activeEdgeId,
  setActiveNodeId, 
  setActiveEdgeId,
  addNewNode, 
  updateNodeAttributes,
  updateEdgeRelation,
  updateEdgeAttributes,
  deleteEdge,
  onExport,
  onImport,
  onGenerateSQL
}) => {
  const [activeTab, setActiveTab] = useState('tables');

  return (
    <aside className="bg-dark border-end h-100 " style={{ width: '380px'}}>
      <div className="p-2 border-bottom">
        <div className="d-flex gap-2 mb-2">
          <button 
            className="btn btn-sm btn-outline-light flex-grow-1"
            onClick={onGenerateSQL}
          >
            <i className="bi bi-filetype-sql me-2"></i> SQL
          </button>
        </div>
        <div className="d-flex gap-2">
          <label className="btn btn-sm btn-outline-light flex-grow-1 mb-0">
            <i className="bi bi-upload me-2"></i> Импорт
            <input 
              type="file" 
              accept=".json" 
              onChange={onImport}
              style={{ display: 'none' }}
            />
          </label>
          <button 
            className="btn btn-sm btn-outline-light flex-grow-1"
            onClick={onExport}
          >
            <i className="bi bi-download me-2"></i> Экспорт
          </button>
        </div>
      </div>
      <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
          {/* Кнопки переключения вкладок */}
          <Nav variant="tabs" className="flex-row">
            <Nav.Item>
              <Nav.Link eventKey="tables">
                <i className="bi bi-table me-2"></i>
                Таблицы
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="relations">
                <i className="bi bi-arrow-left-right me-2"></i>
                Отношения
              </Nav.Link>
            </Nav.Item>
          </Nav>
          <Tab.Content className="p-2 overflow-auto">
            <Tab.Pane eventKey="tables">
              <TablesList 
                nodes={nodes} 
                addNewNode={addNewNode} 
                activeNodeId={activeNodeId} 
                setActiveNodeId={setActiveNodeId} 
                updateNodeAttributes={updateNodeAttributes}
                updateEdgeAttributes={updateEdgeAttributes}
              />
            </Tab.Pane>
            <Tab.Pane eventKey="relations">
              <RelationsList 
                edges={edges}
                activeEdgeId={activeEdgeId}
                setActiveEdgeId={setActiveEdgeId}
                updateEdgeRelation={updateEdgeRelation}
                deleteEdge={deleteEdge}
              />
            </Tab.Pane>
          </Tab.Content>
      </Tab.Container>
    </aside>
  );
});

export default Sidebar;