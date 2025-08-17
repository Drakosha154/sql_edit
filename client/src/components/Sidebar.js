import React, {useState, useCallback, useMemo } from 'react';
import TablesList from './TablesList';
import RelationsList from './RelationsList';
import DatabaseSaveButton from './DatabaseSaveButton'
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
  setShowImportModal,
  generateSQL,
  activeTab,
  setActiveTab,
  generateDataInsertSQL,
  tableData
}) => {

  return (
    <aside className="bg-dark h-100" style={{ width: '380px'}}>
      <div className="p-2 border-bottom">
        <DatabaseSaveButton 
          nodes={nodes}
          tableData={tableData}
          generateSQL={generateSQL}
          generateDataInsertSQL={generateDataInsertSQL}
        />
        <button 
          variant="outline-primary" 
          onClick={() => setShowImportModal(true)}
          className="btn border ms-2"
        >
          <i className="bi bi-file-earmark-arrow-down"></i> Импорт SQL
        </button>
      </div>
      <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
          {/* Кнопки переключения вкладок */}
          <Nav variant="tabs" className="flex-row nav-justified">
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
            <Tab.Pane eventKey="tables" forceMount={activeTab !== "tables"}>
              <TablesList 
                nodes={nodes} 
                addNewNode={addNewNode} 
                activeNodeId={activeNodeId} 
                setActiveNodeId={setActiveNodeId} 
                updateNodeAttributes={updateNodeAttributes}
                updateEdgeAttributes={updateEdgeAttributes}
              />
            </Tab.Pane>
            <Tab.Pane eventKey="relations" forceMount={activeTab !== "relations"}>
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