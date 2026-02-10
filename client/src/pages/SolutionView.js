import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Button, 
  Card, 
  Table, 
  Container, 
  Row, 
  Col, 
  InputGroup, 
  Tabs, 
  Tab,
  Badge,
  Alert,
  Modal,
  Dropdown
} from 'react-bootstrap';
import MonacoEditor from '@monaco-editor/react';

const SolutionView = ({ 
  nodes, 
  edges, 
  tableData, 
  setResult, 
  result, 
  selectedColumns, 
  setSelectedColumns,
  sqlQuery,
  setSqlQuery
}) => {
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedJoinTable, setSelectedJoinTable] = useState('');
  const [conditions, setConditions] = useState([]);
  const [joinConditions, setJoinConditions] = useState([]);
  const [executionCount, setExecutionCount] = useState(0);
  const [activeTab, setActiveTab] = useState('sql');
  const [sqlError, setSqlError] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showSQLModal, setShowSQLModal] = useState(false);
  const [orderBy, setOrderBy] = useState({ column: '', direction: 'DESC' });
  const [columnAliases, setColumnAliases] = useState({});
  
  // Собираем ВСЕ данные из всех таблиц
  const allTableData = { ...tableData };
  
  // Получаем список таблиц
  const tables = nodes.map(node => ({
    name: node.data.label,
    columns: node.data.attributes.map(attr => ({
      name: attr.name,
      type: attr.type,
      isPrimary: attr.isPrimary || false
    }))
  }));

  // ДЕБАГ: Выводим данные таблиц
  useEffect(() => {
    Object.keys(allTableData).forEach(tableName => {
      if (allTableData[tableName] && allTableData[tableName].length > 0) {
      }
    });
  }, [tableData]);

  // Функция для выполнения JOIN
  const performJoin = (mainTableData, joinTableData, joinCondition) => {
    if (!mainTableData || !joinTableData || !joinCondition) {
      return mainTableData || [];
    }
    
    const result = [];
    
    mainTableData.forEach(mainRow => {
      joinTableData.forEach(joinRow => {
        // Проверяем условие JOIN
        let shouldJoin = true;
        
        // Парсим условие JOIN (например: "books.author_id = authors.author_id")
        const parts = joinCondition.toLowerCase().split('=');
        if (parts.length === 2) {
          const leftPart = parts[0].trim();
          const rightPart = parts[1].trim();
          
          // Извлекаем имена таблиц и столбцов
          const leftMatch = leftPart.match(/(\w+)\.(\w+)/);
          const rightMatch = rightPart.match(/(\w+)\.(\w+)/);
          
          if (leftMatch && rightMatch) {
            const leftTable = leftMatch[1];
            const leftColumn = leftMatch[2];
            const rightTable = rightMatch[1];
            const rightColumn = rightMatch[2];
            
            // Определяем, какая таблица main, а какая join
            let mainValue, joinValue;
            
            if (leftTable === selectedTable.toLowerCase() && rightTable === selectedJoinTable.toLowerCase()) {
              mainValue = mainRow[leftColumn];
              joinValue = joinRow[rightColumn];
            } else if (rightTable === selectedTable.toLowerCase() && leftTable === selectedJoinTable.toLowerCase()) {
              mainValue = mainRow[rightColumn];
              joinValue = joinRow[leftColumn];
            } else {
              // Если таблицы не совпадают, пробуем найти по именам столбцов
              mainValue = mainRow[leftColumn] || mainRow[rightColumn];
              joinValue = joinRow[rightColumn] || joinRow[leftColumn];
            }
            
            shouldJoin = mainValue == joinValue;
          } else {
            // Если нет префиксов таблиц, ищем столбцы напрямую
            const leftColumn = leftPart;
            const rightColumn = rightPart;
            shouldJoin = mainRow[leftColumn] == joinRow[rightColumn];
          }
        }
        
        if (shouldJoin) {
          // Объединяем строки
          const joinedRow = { ...mainRow, ...joinRow };
          result.push(joinedRow);
        }
      });
    });
    
    return result;
  };

  // Генерация SQL
  const generateSQL = () => {
    if (!selectedTable) return '';
    
    let selectClause;
    if (selectedColumns.length > 0) {
      selectClause = selectedColumns.map(col => {
        const alias = columnAliases[col];
        return alias ? `${col} AS ${alias}` : col;
      }).join(', ');
    } else {
      selectClause = '*';
    }
    
    let sql = `SELECT ${selectClause} FROM ${selectedTable}`;
    
    // Добавляем JOIN если есть
    if (selectedJoinTable && joinConditions.length > 0) {
      joinConditions.forEach(join => {
        if (join.leftColumn && join.rightColumn) {
          sql += ` JOIN ${selectedJoinTable} ON ${selectedTable}.${join.leftColumn} = ${selectedJoinTable}.${join.rightColumn}`;
        }
      });
    }
    
    // Добавляем условия WHERE
    const validConditions = conditions.filter(c => c.column && c.value);
    if (validConditions.length > 0) {
      sql += ` WHERE ${validConditions.map(c => {
        if (c.operator === 'LIKE') {
          return `${c.column} LIKE '%${c.value}%'`;
        }
        const isNumber = !isNaN(c.value) && c.value.trim() !== '';
        const value = isNumber ? c.value : `'${c.value}'`;
        return `${c.column} ${c.operator} ${value}`;
      }).join(' AND ')}`;
    }
    
    // Добавляем ORDER BY
    if (orderBy.column) {
      sql += ` ORDER BY ${orderBy.column} ${orderBy.direction}`;
    }
    
    return sql;
  };

  // Выполнение запроса
const executeQuery = async (customSQL = null) => {
    let sqlToExecute = customSQL || generateSQL();
    if (!sqlToExecute) return;
    
    setIsExecuting(true);
    setSqlError(null);
    
    try {
        // Парсим SQL
        const sqlUpper = sqlToExecute.toUpperCase();
        const fromMatch = sqlToExecute.match(/FROM\s+(\w+)/i);
        
        if (!fromMatch) {
            throw new Error('Неверный SQL: отсутствует FROM');
        }
        
        const mainTable = fromMatch[1];
        
        // Получаем данные основной таблицы
        let mainData = allTableData[mainTable] || [];
        
        // Проверяем JOIN
        const joinMatch = sqlToExecute.match(/JOIN\s+(\w+)\s+ON\s+([^;]+)/i);
        
        if (joinMatch) {
            const joinTable = joinMatch[1];
            const joinCondition = joinMatch[2];
            
            // Получаем данные таблицы для JOIN
            const joinData = allTableData[joinTable] || [];
            
            // Выполняем JOIN
            mainData = performJoin(mainData, joinData, joinCondition);
        }
        
        // Определяем столбцы для выборки
        const selectMatch = sqlToExecute.match(/SELECT\s+(.+?)\s+FROM/i);
        let columnsToSelect = [];
        const aliases = {};
        
        if (selectMatch) {
            const columnsPart = selectMatch[1].trim();
            
            if (columnsPart === '*') {
                // Если SELECT * и был JOIN
                if (mainData.length > 0) {
                    columnsToSelect = Object.keys(mainData[0]);
                }
            } else {
                // Парсим отдельные колонки
                const columnItems = columnsPart.split(',').map(item => item.trim());
                
                columnItems.forEach(item => {
                    // Проверяем AS
                    const asMatch = item.match(/(.+?)\s+AS\s+(.+)/i);
                    if (asMatch) {
                        const original = asMatch[1].trim();
                        const alias = asMatch[2].trim();
                        
                        // Убираем префикс таблицы если есть
                        const columnName = original.includes('.') 
                            ? original.split('.')[1] 
                            : original;
                        
                        columnsToSelect.push(columnName);
                        aliases[columnName] = alias;
                    } else {
                        // Без AS
                        const columnName = item.includes('.') 
                            ? item.split('.')[1] 
                            : item;
                        
                        columnsToSelect.push(columnName);
                    }
                });
            }
        }
        
        // Применяем WHERE условия
        const whereMatch = sqlToExecute.match(/WHERE\s+(.+?)(?:\s+(ORDER\s+BY|GROUP\s+BY|HAVING|LIMIT)|\s*$)/i);
        if (whereMatch) {
            const whereClause = whereMatch[1].trim();
            mainData = applyWhereClause(mainData, whereClause);
        }
        
        // Применяем ORDER BY (используем отдельную регулярку)
        const orderMatch = sqlToExecute.match(/ORDER\s+BY\s+(.+?)(?:\s+(ASC|DESC))?(?:\s+(?:LIMIT|GROUP\s+BY|HAVING)|\s*$)/i);
        if (orderMatch) {
            const orderClause = orderMatch[1].trim();
            const sortDirection = (orderMatch[2] || 'ASC').toUpperCase();
            
            // Парсим столбец для сортировки (убираем префикс таблицы если есть)
            const sortColumn = orderClause.includes('.') 
                ? orderClause.split('.')[1] 
                : orderClause;
            
            mainData.sort((a, b) => {
                const aVal = a[sortColumn];
                const bVal = b[sortColumn];
                
                // Обработка null/undefined значений
                if (aVal == null && bVal == null) return 0;
                if (aVal == null) return sortDirection === 'ASC' ? -1 : 1;
                if (bVal == null) return sortDirection === 'ASC' ? 1 : -1;
                
                // Сравнение значений
                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    return sortDirection === 'DESC' 
                        ? bVal - aVal 
                        : aVal - bVal;
                }
                
                // Для строк
                const comparison = String(aVal).localeCompare(String(bVal));
                return sortDirection === 'DESC' ? -comparison : comparison;
            });
        }
        
        // Формируем финальный результат
        const resultData = mainData.map(row => {
            const resultRow = {};
            columnsToSelect.forEach(col => {
                const alias = aliases[col] || col;
                resultRow[alias] = row[col];
            });
            return resultRow;
        });
        
        // Обновляем состояние
        const resultColumns = columnsToSelect.map(col => aliases[col] || col);
        setSelectedColumns(resultColumns);
        setResult(resultData);
        setExecutionCount(prev => prev + 1);
        
    } catch (error) {
        console.error("Ошибка выполнения SQL:", error);
        setSqlError(`Ошибка: ${error.message}\n\nПроверьте:\n1. Правильность имен таблиц\n2. Наличие данных в таблицах\n3. Правильность JOIN условий`);
    } finally {
        setIsExecuting(false);
    }
};

// Новая функция для применения WHERE условий
const applyWhereClause = (data, whereClause) => {
    if (!whereClause || !data.length) return data;
    
    // Регулярки для разных операторов сравнения
    const conditions = [];
    
    // Разбиваем на отдельные условия по AND (упрощенно)
    const andConditions = whereClause.split(/\s+AND\s+/i);
    
    andConditions.forEach(condition => {
        // Ищем операторы сравнения: =, !=, <>, >, <, >=, <=
        const operatorMatch = condition.match(/(\w+)\s*(=|!=|<>|>|<|>=|<=)\s*(['"][^'"]*['"]|\d+|\w+)/i);
        
        if (operatorMatch) {
            const column = operatorMatch[1].trim();
            const operator = operatorMatch[2].trim();
            let value = operatorMatch[3].trim();
            
            // Убираем кавычки если это строка
            if ((value.startsWith("'") && value.endsWith("'")) || 
                (value.startsWith('"') && value.endsWith('"'))) {
                value = value.substring(1, value.length - 1);
            }
            
            // Преобразуем в число если возможно
            const numericValue = !isNaN(value) && value !== '' ? Number(value) : null;
            const isNumericComparison = numericValue !== null;
            
            conditions.push({
                column,
                operator: operator.toUpperCase(),
                value: isNumericComparison ? numericValue : value,
                isNumeric: isNumericComparison
            });
        } else {
            // Для простых условий с AND без операторов
            const simpleMatch = condition.match(/(\w+)\s*=\s*(['"][^'"]*['"]|\d+|\w+)/i);
            if (simpleMatch) {
                const column = simpleMatch[1].trim();
                let value = simpleMatch[2].trim();
                
                if ((value.startsWith("'") && value.endsWith("'")) || 
                    (value.startsWith('"') && value.endsWith('"'))) {
                    value = value.substring(1, value.length - 1);
                }
                
                conditions.push({
                    column,
                    operator: '=',
                    value,
                    isNumeric: !isNaN(value) && value !== ''
                });
            }
        }
    });
    
    // Фильтруем данные по всем условиям
    return data.filter(row => {
        return conditions.every(cond => {
            const rowValue = row[cond.column];
            
            // Если значение в строке не определено
            if (rowValue === undefined || rowValue === null) {
                return false;
            }
            
            // Приводим к правильному типу для сравнения
            const compareValue = cond.isNumeric ? 
                (typeof rowValue === 'number' ? rowValue : Number(rowValue)) : 
                String(rowValue);
            const conditionValue = cond.value;
            
            // Выполняем сравнение в зависимости от оператора
            switch (cond.operator) {
                case '=':
                    return compareValue == conditionValue;
                
                case '!=':
                case '<>':
                    return compareValue != conditionValue;
                
                case '>':
                    if (!cond.isNumeric) {
                        console.warn(`Оператор > применен к нечисловым данным: ${cond.column}`);
                        return false;
                    }
                    return compareValue > conditionValue;
                
                case '<':
                    if (!cond.isNumeric) {
                        console.warn(`Оператор < применен к нечисловым данным: ${cond.column}`);
                        return false;
                    }
                    return compareValue < conditionValue;
                
                case '>=':
                    if (!cond.isNumeric) {
                        console.warn(`Оператор >= применен к нечисловым данным: ${cond.column}`);
                        return false;
                    }
                    return compareValue >= conditionValue;
                
                case '<=':
                    if (!cond.isNumeric) {
                        console.warn(`Оператор <= применен к нечисловым данным: ${cond.column}`);
                        return false;
                    }
                    return compareValue <= conditionValue;
                
                default:
                    console.warn(`Неизвестный оператор: ${cond.operator}`);
                    return false;
            }
        });
    });
};

// Вспомогательная функция для разбора сложных WHERE условий
const parseWhereCondition = (conditionStr) => {
    // Удаляем лишние пробелы
    conditionStr = conditionStr.trim();
    
    // Проверяем на наличие скобок для сложных условий
    if (conditionStr.includes('(') || conditionStr.includes('OR')) {
        console.warn('Сложные условия с OR и скобками не поддерживаются в этой версии');
        return [];
    }
    
    // Парсим простые условия
    const conditions = [];
    
    // Регулярка для условий
    const pattern = /(\w+)\s*(=|!=|<>|>|<|>=|<=)\s*(['"][^'"]*['"]|\d+(?:\.\d+)?|\w+)/gi;
    let match;
    
    while ((match = pattern.exec(conditionStr)) !== null) {
        const column = match[1].trim();
        const operator = match[2].trim().toUpperCase();
        let value = match[3].trim();
        
        // Обработка значений в кавычках
        if ((value.startsWith("'") && value.endsWith("'")) || 
            (value.startsWith('"') && value.endsWith('"'))) {
            value = value.substring(1, value.length - 1);
        }
        
        // Определяем тип значения
        const isNumeric = !isNaN(value) && value !== '';
        const parsedValue = isNumeric ? Number(value) : value;
        
        conditions.push({
            column,
            operator,
            value: parsedValue,
            isNumeric,
            original: match[0]
        });
    }
    
    return conditions;
};

  // Вставка примера
  const insertTaskExample = (taskNumber) => {
    const examples = {
      1: `SELECT books.title, authors.full_name AS author_name, books.publication_year
FROM books
JOIN authors ON books.author_id = authors.author_id
ORDER BY books.publication_year DESC`,
      
      2: `SELECT authors.full_name, COUNT(*) AS novels_count
FROM authors
JOIN books ON authors.author_id = books.author_id
JOIN genres ON books.genre_id = genres.genre_id
WHERE genres.name = 'Роман'
GROUP BY authors.author_id, authors.full_name`,
      
      3: `SELECT readers.full_name, books.title, book_loans.loan_date
FROM book_loans
JOIN readers ON book_loans.reader_id = readers.reader_id
JOIN books ON book_loans.book_id = books.book_id
WHERE book_loans.loan_date > '2024-02-01' AND book_loans.return_date IS NULL`
    };
    
    if (examples[taskNumber]) {
      setSqlQuery(examples[taskNumber]);
      setActiveTab('sql');
    }
  };

  // Обработчик изменения таблицы
  const handleTableChange = (tableName) => {
    setSelectedTable(tableName);
    setConditions([]);
    setJoinConditions([]);
    setSelectedJoinTable('');
    setColumnAliases({});
    
    if (tableName) {
      const table = tables.find(t => t.name === tableName);
      if (table) {
        setSelectedColumns(table.columns.map(col => col.name));
      }
    } else {
      setSelectedColumns([]);
    }
  };

  // Обработчик изменения JOIN таблицы
  const handleJoinTableChange = (tableName) => {
    setSelectedJoinTable(tableName);
    setJoinConditions([]);
    
    // Автоматически добавляем JOIN условие по первичным ключам
    if (tableName && selectedTable) {
      const mainTable = tables.find(t => t.name === selectedTable);
      const joinTable = tables.find(t => t.name === tableName);
      
      if (mainTable && joinTable) {
        // Ищем подходящие столбцы для JOIN
        const mainPK = mainTable.columns.find(col => col.isPrimary);
        const joinPK = joinTable.columns.find(col => col.isPrimary);
        
        if (mainPK && joinPK) {
          setJoinConditions([{ leftColumn: mainPK.name, rightColumn: joinPK.name }]);
        }
      }
    }
  };

  // Проверка наличия данных в таблицах
  const checkTableData = (tableName) => {
    const data = allTableData[tableName];
    return data && data.length > 0;
  };

  // Рендеринг конструктора
  const renderQueryBuilder = () => (
    <>
      <Form.Group className="mb-3">
        <Form.Label>Основная таблица {selectedTable && checkTableData(selectedTable) ? '✅' : '❌'}</Form.Label>
        <Form.Select value={selectedTable} onChange={(e) => handleTableChange(e.target.value)}>
          <option value="">-- Выберите таблицу --</option>
          {tables.map(table => (
            <option key={table.name} value={table.name}>
              {table.name} {checkTableData(table.name) ? `(${allTableData[table.name]?.length || 0} строк)` : '(нет данных)'}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      {selectedTable && (
        <>
          <Form.Group className="mb-3">
            <Form.Label>Столбцы для SELECT</Form.Label>
            <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px', borderRadius: '4px' }}>
              {tables.find(t => t.name === selectedTable)?.columns.map(col => (
                <div key={col.name} className="mb-2">
                  <Form.Check
                    type="checkbox"
                    label={`${col.name} ${col.isPrimary ? '🔑' : ''} (${col.type})`}
                    checked={selectedColumns.includes(col.name)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedColumns([...selectedColumns, col.name]);
                      } else {
                        setSelectedColumns(selectedColumns.filter(c => c !== col.name));
                        const newAliases = { ...columnAliases };
                        delete newAliases[col.name];
                        setColumnAliases(newAliases);
                      }
                    }}
                    className="mb-1"
                  />
                  {selectedColumns.includes(col.name) && (
                    <InputGroup size="sm" className="mt-1">
                      <InputGroup.Text>AS</InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Псевдоним"
                        value={columnAliases[col.name] || ''}
                        onChange={(e) => setColumnAliases({...columnAliases, [col.name]: e.target.value})}
                      />
                    </InputGroup>
                  )}
                </div>
              ))}
            </div>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              JOIN с таблицей 
              {selectedJoinTable && checkTableData(selectedJoinTable) ? ' ✅' : ''}
            </Form.Label>
            <Row>
              <Col>
                <Form.Select value={selectedJoinTable} onChange={(e) => handleJoinTableChange(e.target.value)}>
                  <option value="">-- Без JOIN --</option>
                  {tables
                    .filter(t => t.name !== selectedTable)
                    .map(table => (
                      <option key={table.name} value={table.name}>
                        {table.name} {checkTableData(table.name) ? `(${allTableData[table.name]?.length || 0} строк)` : '(нет данных)'}
                      </option>
                    ))
                  }
                </Form.Select>
              </Col>
            </Row>
            
            {selectedJoinTable && joinConditions.map((join, index) => (
              <Row key={index} className="mb-2 align-items-center mt-2">
                <Col xs={5}>
                  <Form.Select value={join.leftColumn} onChange={(e) => {
                    const newJoins = [...joinConditions];
                    newJoins[index].leftColumn = e.target.value;
                    setJoinConditions(newJoins);
                  }}>
                    <option value="">Столбец из {selectedTable}</option>
                    {tables.find(t => t.name === selectedTable)?.columns.map(col => (
                      <option key={col.name} value={col.name}>{col.name}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col xs={2} className="text-center">=</Col>
                <Col xs={5}>
                  <Form.Select value={join.rightColumn} onChange={(e) => {
                    const newJoins = [...joinConditions];
                    newJoins[index].rightColumn = e.target.value;
                    setJoinConditions(newJoins);
                  }}>
                    <option value="">Столбец из {selectedJoinTable}</option>
                    {tables.find(t => t.name === selectedJoinTable)?.columns.map(col => (
                      <option key={col.name} value={col.name}>{col.name}</option>
                    ))}
                  </Form.Select>
                </Col>
              </Row>
            ))}
            
            {selectedJoinTable && (
              <Alert variant="info" className="mt-2 py-2">
                <small>
                  <i className="bi bi-info-circle me-1"></i>
                  Для JOIN нужны данные в обеих таблицах. Проверьте загружены ли данные.
                </small>
              </Alert>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>ORDER BY</Form.Label>
            <Row>
              <Col>
                <Form.Select value={orderBy.column} onChange={(e) => setOrderBy({...orderBy, column: e.target.value})}>
                  <option value="">-- Не сортировать --</option>
                  {tables.find(t => t.name === selectedTable)?.columns.map(col => (
                    <option key={col.name} value={col.name}>{col.name}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col xs={4}>
                <Form.Select value={orderBy.direction} onChange={(e) => setOrderBy({...orderBy, direction: e.target.value})} disabled={!orderBy.column}>
                  <option value="ASC">ASC</option>
                  <option value="DESC">DESC</option>
                </Form.Select>
              </Col>
            </Row>
          </Form.Group>

          <div className="d-grid gap-2">
            <Button 
              variant="primary" 
              onClick={() => executeQuery()}
              disabled={selectedColumns.length === 0}
            >
              Выполнить запрос
            </Button>
            
            <Button 
              variant="outline-info" 
              onClick={() => {
                setSqlQuery(generateSQL());
                setActiveTab('sql');
              }}
              disabled={!selectedTable}
            >
              <i className="bi bi-arrow-right me-1"></i>
              Перейти в SQL редактор
            </Button>
          </div>
        </>
      )}
    </>
  );

  return (
    <Container fluid className="py-4 h-100">
      <Row className="h-100">
        <Col md={4}>
          <Card className="h-100">
            <Card.Header>
              <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-0">
                {/*<Tab eventKey="builder" title={<><i className="bi bi-pencil-square me-1"></i>Конструктор</>} />*/}
                <Tab eventKey="sql" title={<><i className="bi bi-code-slash me-1"></i>SQL</>} />
              </Tabs>
            </Card.Header>
            
            <Card.Body className="overflow-auto">
              {activeTab === 'builder' ? renderQueryBuilder() : (
                <>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <Form.Label>SQL редактор</Form.Label>
                      <Dropdown>
                        <Dropdown.Toggle variant="outline-primary" size="sm">
                          <i className="bi bi-database me-1"></i> Примеры
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          {[1, 2, 3].map(num => (
                            <Dropdown.Item key={num} onClick={() => insertTaskExample(num)}>
                              Задача {num}
                            </Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                    
                    <div style={{ height: '250px', border: '1px solid #ddd', borderRadius: '4px' }}>
                      <MonacoEditor
                        language="sql"
                        value={sqlQuery}
                        onChange={setSqlQuery}
                        theme="vs-light"
                        options={{
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          fontSize: 14,
                          wordWrap: 'on',
                          automaticLayout: true,
                        }}
                      />
                    </div>
                  </div>

                  {sqlError && (
                    <Alert variant="danger" className="py-2">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      {sqlError}
                    </Alert>
                  )}

                  <div className="d-grid gap-2">
                    <Button 
                      variant="primary" 
                      onClick={() => executeQuery(sqlQuery)}
                      disabled={!sqlQuery.trim() || isExecuting}
                    >
                      {isExecuting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Выполнение...
                        </>
                      ) : (
                        'Выполнить SQL'
                      )}
                    </Button>
                    
                    <Button 
                      variant="outline-info" 
                      onClick={() => {
                        setSqlQuery(generateSQL());
                      }}
                      disabled={!selectedTable}
                      size="sm"
                    >
                      Из конструктора
                    </Button>
                  </div>
                </>
              )}
              
              <div className="mt-3 pt-3 border-top">
                <small className="text-muted">
                  <i className="bi bi-arrow-repeat me-1"></i>
                  Выполнено: <Badge bg="secondary">{executionCount}</Badge>
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card className="h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">Результат</h5>
                <small className="text-muted">
                  {selectedTable && (
                    <>
                      Таблица: <Badge bg={checkTableData(selectedTable) ? "success" : "warning"}>
                        {selectedTable} ({allTableData[selectedTable]?.length || 0})
                      </Badge>
                      {selectedJoinTable && (
                        <>
                          <span className="mx-2">+</span>
                          JOIN: <Badge bg={checkTableData(selectedJoinTable) ? "success" : "warning"}>
                            {selectedJoinTable} ({allTableData[selectedJoinTable]?.length || 0})
                          </Badge>
                        </>
                      )}
                    </>
                  )}
                </small>
              </div>
              <div>
                <Badge bg={result.length > 0 ? "success" : "secondary"}>
                  Строк: {result.length}
                </Badge>
              </div>
            </Card.Header>
            
            <Card.Body className="overflow-auto p-0">
              {result.length > 0 ? (
                <>
                  <div className="p-3 border-bottom bg-light">
                    <small className="text-muted d-block mb-1">SQL запрос:</small>
                    <code className="bg-white p-2 rounded d-block" style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                      {activeTab === 'builder' ? generateSQL() : sqlQuery}
                    </code>
                  </div>
                  
                  <div className="p-3">
                    <Table striped bordered hover size="sm">
                      <thead>
                        <tr>
                          {selectedColumns.map(col => (
                            <th key={col}>
                              {columnAliases[col] || col}
                              {columnAliases[col] && (
                                <small className="text-muted d-block">из {col}</small>
                              )}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.map((row, i) => (
                          <tr key={i}>
                            {selectedColumns.map(col => {
                              const displayCol = columnAliases[col] || col;
                              return (
                                <td key={`${i}-${col}`}>
                                  {row[displayCol] !== undefined 
                                    ? String(row[displayCol]) 
                                    : <span className="text-danger fst-italic">undefined</span>
                                  }
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted p-5">
                  {activeTab === 'builder' ? (
                    <>
                      <i className="bi bi-table fs-1"></i>
                      <p>Создайте запрос в конструкторе</p>
                      <Alert variant="warning" className="mt-3">
                        <small>
                          <strong>Важно для JOIN:</strong><br/>
                          1. Выберите основную таблицу<br/>
                          2. Выберите таблицу для JOIN<br/>
                          3. Убедитесь, что в обеих таблицах есть данные<br/>
                          4. Настройте условие JOIN (обычно по первичным ключам)
                        </small>
                      </Alert>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-code-slash fs-1"></i>
                      <p>Напишите SQL запрос или используйте пример</p>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => insertTaskExample(1)}
                        className="mt-2"
                      >
                        Вставить пример задачи 1
                      </Button>
                    </>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Отладочная информация */}
      <Modal show={showSQLModal} onHide={() => setShowSQLModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Отладочная информация</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h6>Данные в таблицах:</h6>
          <ul>
            {tables.map(table => (
              <li key={table.name}>
                <strong>{table.name}:</strong> {allTableData[table.name]?.length || 0} строк
                {allTableData[table.name] && allTableData[table.name].length > 0 && (
                  <small className="ms-2 text-muted">
                    (столбцы: {Object.keys(allTableData[table.name][0]).join(', ')})
                  </small>
                )}
              </li>
            ))}
          </ul>
          
          <h6 className="mt-3">Пример данных для JOIN:</h6>
          <pre className="bg-light p-2 small">
            {JSON.stringify({
              books: allTableData.books?.[0] || 'нет данных',
              authors: allTableData.authors?.[0] || 'нет данных'
            }, null, 2)}
          </pre>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSQLModal(false)}>
            Закрыть
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default SolutionView;