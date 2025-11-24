import React, {useState, useCallback, useMemo } from 'react';
import TablesList from './TablesList';
import RelationsList from './RelationsList';
import DatabaseSaveButton from './DatabaseSaveButton'
import { Tab, Nav, Row, Col } from 'react-bootstrap';

const Sidebar = React.memo(({ 
  nodes, 
  setNodes,
  edges,
  setEdges,
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
  tableData,
  setTableData,
  taskDescription,
  result,
  setCsvDecision,
  csvDecision
}) => {

  const deleteNode = useCallback((nodeId) => {
  const nodeToDelete = nodes.find(node => node.id === nodeId);
  if (!nodeToDelete) return;

  setNodes(prevNodes => prevNodes.filter(node => node.id !== nodeId));
  setEdges(prevEdges => prevEdges.filter(edge => 
    edge.source !== nodeId && edge.target !== nodeId
  ));
  setTableData(prev => {
    const newData = {...prev};
    delete newData[nodeToDelete.data.label];
    return newData;
  });
}, [nodes]);

  return (
    <aside className="h-100" style={{ width: '380px'}}>
      <div className="d-flex flex-column border-bottom p-2  flex-sm-row gap-2">
        <button 
          variant="outline-primary" 
          onClick={() => setShowImportModal(true)}
          className="btn border flex-fill"
        >
          <i className="bi bi-file-earmark-arrow-down"></i> Импорт SQL
        </button>
        <button 
          variant="outline-primary" 
          onClick={() => setShowImportModal(true)}
          className="btn border flex-fill"
        >
          <i className="bi bi-file-earmark-arrow-down"></i> Форматировать схему
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
                deleteNode={deleteNode}
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