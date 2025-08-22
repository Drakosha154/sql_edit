import React, { useState, useEffect } from 'react';
import { 
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Tabs,
  Tab,
  Modal
} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import "bootstrap-icons/font/bootstrap-icons.css";
import DatabaseVisualPreview from '../components/DatabaseVisualPreview'

const TaskPreview = ({ nodes, edges, setNodes, onNodesChange, onEdgesChange, taskDescription, setTaskDescription }) => {
  // Состояния
  const [solutionCode, setSolutionCode] = useState('');
  const [showSchema, setShowSchema] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');

  // Пример данных для предпросмотра
  const sampleTask = `Напишите SQL-запросы для следующих задач:
  
1. Выведите всех пользователей старше 25 лет
2. Найдите заказы за последний месяц
3. Подсчитайте общую сумму продаж по каждому товару`;

  return (
    <Container fluid className="py-4 h-100">
      <Row className="h-100">
        <Col md={6} className="h-100">
          <Card className="h-100">
            <Card.Header className="bg-dark text-white">
              <h5>Редактирование задания</h5>
            </Card.Header>
            <Card.Body className="overflow-auto">
                <Form.Group>
                  <Form.Label>Условие задачи</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={12}
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Введите условие задачи..."
                  />
                  
                  <div className="mt-3 d-flex justify-content-between">
                    <Button 
                      variant="outline-primary"
                      onClick={() => setTaskDescription(sampleTask)}
                    >
                      <i className="bi bi-lightbulb"></i> Пример задачи
                    </Button>
                
                  </div>
                </Form.Group>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} className="h-100">
          <Card className="h-100">
            <Card.Header className="bg-dark text-white">
              <h5>Предпросмотр задания</h5>
            </Card.Header>
            <Card.Body className="overflow-auto">
              <div className="task-preview">
                <h3>SQL Задание</h3>
                <div className="task-description mb-4">
                  {taskDescription || (
                    <div className="text-muted">
                      <i className="bi bi-info-circle"></i> Условие задачи не заполнено
                    </div>
                  )}
                </div>
                
                <h4>Схема базы данных</h4>
                <div className="schema-preview mb-4 p-3 border rounded">
                  <DatabaseVisualPreview nodes={nodes} edges={edges} setNodes={setNodes}/>
                </div>
                
                <h4>Редактор запросов</h4>
                <div className="mt-3">
                    <Form.Label>Решение (SQL)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={6}
                      value={solutionCode}
                      onChange={(e) => setSolutionCode(e.target.value)}
                      placeholder="-- Введите решение..."
                    />
                  </div>
                
                <div className="mt-3 d-flex justify-content-between">
                  <Button variant="success">
                    <i className="bi bi-check-circle"></i> Проверить решение
                  </Button>
                  {/*<Button variant="outline-secondary">
                    <i className="bi bi-question-circle"></i> Подсказка
                  </Button>*/}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default TaskPreview;