import React, { useState } from 'react';
import { 
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Table,
  Modal,
  Alert
} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import "bootstrap-icons/font/bootstrap-icons.css";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';


export default function Task_manage({
  nodes,
  tableData,
  setTableData,
  activeDataSet = 'main'  // 🆕 ДОБАВИТЬ
}) {

  // Состояния
  const [selectedTable, setSelectedTable] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [sqlCode, setSqlCode] = useState('');
  const [importError, setImportError] = useState(null);
  const [newRow, setNewRow] = useState({});
  const [showGenerator, setShowGenerator] = useState(false);
  const [generatorConfig, setGeneratorConfig] = useState({
    count: 10,
    fields: {}
  });

  // Получаем список таблиц из nodes
  const tables = nodes.map(node => ({
    name: node.data.label,
    columns: node.data.attributes.map(attr => ({
      name: attr.name,
      type: attr.type,
      isAutoIncrement: attr.isAutoIncrement || false,
      isNullable: attr.isNullable !== undefined ? attr.isNullable : true,
      isPrimary: attr.isPrimary || false
    }))
  }));

  // Обработчик выбора таблицы
  const handleTableSelect = (e) => {
  const tableName = e.target.value;
  setSelectedTable(tableName);
  
  // Инициализируем newRow со всеми полями таблицы
  const initialRow = {};
  if (tableName) {
    tables.find(t => t.name === tableName).columns.forEach(col => {
      initialRow[col.name] = '';
    });
  }
  setNewRow(initialRow);
};

  // Добавление новой строки
  const handleAddRow = () => {
  if (!selectedTable) return;
  
  // Проверяем, что хотя бы одно поле заполнено
  const hasValues = Object.values(newRow).some(val => val !== '');
  if (!hasValues) return;
  
  setTableData({
  ...tableData,
  [activeDataSet]: {
    ...tableData[activeDataSet],
    [selectedTable]: [...(tableData[activeDataSet]?.[selectedTable] || []), newRow]
  }
});
  
  // Сбрасываем значения, но сохраняем структуру
  const resetRow = {};
  Object.keys(newRow).forEach(key => {
    resetRow[key] = '';
  });
  setNewRow(resetRow);
};

  // Удаление строки
  const handleDeleteRow = (index) => {
    if (!selectedTable || !tableData[activeDataSet]?.[selectedTable]) return;

const updatedData = tableData[activeDataSet][selectedTable].filter((_, i) => i !== index);

setTableData({
  ...tableData,
  [activeDataSet]: {
    ...tableData[activeDataSet],
    [selectedTable]: updatedData
  }
});}

  // Очистка всей таблицы
  const handleClearTable = () => {
    if (!selectedTable) return;
    
    if (window.confirm(`Вы уверены, что хотите удалить все данные из таблицы "${selectedTable}"?`)) {
      setTableData({
  ...tableData,
  [activeDataSet]: {
    ...tableData[activeDataSet],
    [selectedTable]: []
  }
});
    }
  };

  // Функции определения типов данных
const isIntegerType = (type) => {
  if (!type) return false;
  const intTypes = ['integer', 'int', 'bigint', 'smallint'];
  return intTypes.includes(type.toLowerCase());
};

const isFloatType = (type) => {
  if (!type) return false;
  const floatTypes = ['float', 'real', 'double', 'decimal', 'numeric'];
  return floatTypes.includes(type.toLowerCase());
};

const isTextType = (type) => {
  if (!type) return false;
  const textTypes = ['varchar', 'text', 'char', 'string', 'character', 'character varying'];
  return textTypes.includes(type.toLowerCase());
};

const isBooleanType = (type) => {
  if (!type) return false;
  const booleanTypes = ['boolean', 'bool', 'bit'];
  return booleanTypes.includes(type.toLowerCase());
};

const isDateType = (type) => {
  if (!type) return false;
  const dateTypes = ['date', 'datetime', 'timestamp'];
  return dateTypes.includes(type.toLowerCase());
};

// Генераторы текстовых данных по шаблонам
const textGenerators = {
  name: () => {
    const names = ['Иван', 'Мария', 'Петр', 'Анна', 'Сергей', 'Елена', 'Дмитрий', 'Ольга', 'Александр', 'Наталья'];
    const surnames = ['Иванов', 'Петров', 'Сидоров', 'Смирнов', 'Кузнецов', 'Попов', 'Васильев', 'Соколов'];
    return `${names[Math.floor(Math.random() * names.length)]} ${surnames[Math.floor(Math.random() * surnames.length)]}`;
  },
  
  email: () => {
    const domains = ['example.com', 'test.ru', 'mail.com', 'demo.org'];
    const name = `user${Math.floor(Math.random() * 10000)}`;
    return `${name}@${domains[Math.floor(Math.random() * domains.length)]}`;
  },
  
  phone: () => {
    return `+7${Math.floor(Math.random() * 9000000000 + 1000000000)}`;
  },
  
  address: () => {
    const streets = ['Ленина', 'Пушкина', 'Гагарина', 'Мира', 'Советская', 'Центральная', 'Садовая'];
    const street = streets[Math.floor(Math.random() * streets.length)];
    const building = Math.floor(Math.random() * 100 + 1);
    return `ул. ${street}, д. ${building}`;
  },
  
  company: () => {
    const prefixes = ['ООО', 'ЗАО', 'ИП', 'АО'];
    const names = ['Рога и Копыта', 'Ромашка', 'Технологии', 'Инновации', 'Прогресс', 'Альфа', 'Омега'];
    return `${prefixes[Math.floor(Math.random() * prefixes.length)]} "${names[Math.floor(Math.random() * names.length)]}"`;
  },
  
  custom: (pattern) => {
    if (!pattern) return `Значение ${Math.floor(Math.random() * 1000)}`;
    
    return pattern
      .replace(/{name}/g, textGenerators.name())
      .replace(/{email}/g, textGenerators.email())
      .replace(/{phone}/g, textGenerators.phone())
      .replace(/{number}/g, Math.floor(Math.random() * 1000))
      .replace(/{word}/g, `слово${Math.floor(Math.random() * 100)}`);
  }
};

// Функция обновления конфигурации поля
const updateFieldConfig = (columnName, key, value) => {
  setGeneratorConfig({
    ...generatorConfig,
    fields: {
      ...generatorConfig.fields,
      [columnName]: {
        ...generatorConfig.fields[columnName],
        [key]: value
      }
    }
  });
};

  // Генерация случайных данных
const generateRandomData = () => {
  if (!selectedTable) return;
  
  const { count, fields } = generatorConfig;
  const selectedTableObj = tables.find(t => t.name === selectedTable);
  
  const newData = Array(count).fill().map(() => {
    const row = {};
    
    selectedTableObj.columns.forEach(col => {
      // Пропускаем AUTO_INCREMENT поля
      if (col.isAutoIncrement) return;
      
      const fieldConfig = fields[col.name] || {};
      
      // Целочисленные типы
      if (isIntegerType(col.type)) {
        const min = fieldConfig.min ?? 0;
        const max = fieldConfig.max ?? 100;
        row[col.name] = Math.floor(Math.random() * (max - min + 1)) + min;
      }
      
      // Дробные числа
      else if (isFloatType(col.type)) {
        const min = fieldConfig.min ?? 0;
        const max = fieldConfig.max ?? 100;
        const precision = fieldConfig.precision ?? 2;
        const value = Math.random() * (max - min) + min;
        row[col.name] = parseFloat(value.toFixed(precision));
      }
      
      // Логические
      else if (isBooleanType(col.type)) {
        row[col.name] = String(Math.random() > 0.5);
      }
      
      // Даты
      else if (isDateType(col.type)) {
        const dateFrom = fieldConfig.dateFrom ? new Date(fieldConfig.dateFrom) : new Date('2020-01-01');
        const dateTo = fieldConfig.dateTo ? new Date(fieldConfig.dateTo) : new Date();
        const randomTime = dateFrom.getTime() + Math.random() * (dateTo.getTime() - dateFrom.getTime());
        const randomDate = new Date(randomTime);
        
        if (col.type.toLowerCase() === 'date') {
          row[col.name] = randomDate.toISOString().split('T')[0];
        } else {
          row[col.name] = randomDate.toISOString();
        }
      }
      
      // Текстовые
      else if (isTextType(col.type)) {
        const templateType = fieldConfig.templateType || 'custom';
        if (templateType === 'custom') {
          const pattern = fieldConfig.customPattern || `Значение ${Math.floor(Math.random() * 1000)}`;
          row[col.name] = textGenerators.custom(pattern);
        } else {
          row[col.name] = textGenerators[templateType]();
        }
      }
      
      // Неизвестный тип - пустая строка
      else {
        row[col.name] = '';
      }
    });
    
    return row;
  });

  setTableData({
  ...tableData,
  [activeDataSet]: {
    ...tableData[activeDataSet],
    [selectedTable]: [...(tableData[activeDataSet]?.[selectedTable] || []), ...newData]
  }
});
  setShowGenerator(false);
};

  const currentTableData = selectedTable ? tableData[activeDataSet]?.[selectedTable] || [] : [];

  // Функция для парсинга SQL вставки данных
  const parseInsertSQL = (sql) => {
  try {
    const result = {};
    const insertRegex = /INSERT\s+INTO\s+([^\s(]+)\s*\(([^)]+)\)\s*VALUES\s*([^;]+);/gi;
    
    let match;
    while ((match = insertRegex.exec(sql)) !== null) {
      const tableName = match[1].trim().replace(/"/g, '');
      const columns = match[2].split(',').map(c => c.trim().replace(/"/g, ''));
      
      // ========================================
      // ИСПРАВЛЕНИЕ: Временно заменяем строки в кавычках на плейсхолдеры
      // ========================================
      const valuesText = match[3];
      const strings = [];
      let stringIndex = 0;
      
      // Заменяем строки в кавычках на плейсхолдеры
      const valuesWithPlaceholders = valuesText
        .replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, (match) => {
          strings.push(match);
          return `__STRING_${stringIndex++}__`;
        })
        .replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match) => {
          strings.push(match);
          return `__STRING_${stringIndex++}__`;
        });
      
      // Теперь можем безопасно использовать простую регулярку
      const valuesMatch = valuesWithPlaceholders.match(/\(([^)]+)\)/g);
      // ========================================
      
      if (!result[tableName]) {
        result[tableName] = [];
      }
      
      // Найти AUTO_INCREMENT колонки для этой таблицы
      const tableNode = nodes.find(n => n.data.label === tableName);
      const autoIncrementCols = tableNode?.data.attributes
        .filter(attr => attr.isAutoIncrement)
        .map(attr => attr.name) || [];

      valuesMatch.forEach(valuesStr => {
        // ========================================
        // ИСПРАВЛЕНИЕ: Возвращаем строки обратно из плейсхолдеров
        // ========================================
        let restoredValuesStr = valuesStr.replace(/__STRING_(\d+)__/g, (match, index) => {
          return strings[parseInt(index)];
        });
        // ========================================
        
        const values = restoredValuesStr
          .replace(/[()]/g, '')
          .split(',')
          .map(v => v.trim().replace(/^'(.*)'$/, '$1'));
          
        if (columns.length === values.length) {
          const row = {};
          columns.forEach((col, i) => {
            // Пропускаем AUTO_INCREMENT колонки
            if (!autoIncrementCols.includes(col)) {
              row[col] = values[i] === 'NULL' ? null : 
                         !isNaN(values[i]) ? Number(values[i]) : 
                         values[i];
            }
          });
          result[tableName].push(row);
        }
      });
    }
    
    return result;
  } catch (error) {
    throw new Error(`Ошибка парсинга SQL: ${error.message}`);
  }
};

  const handleImportSQL = (sql = sqlCode) => {
    try {
      
      const parsedData = parseInsertSQL(sqlCode);


      const updatedTableData = { 
  [activeDataSet]: {
    ...tableData[activeDataSet],
    ...parsedData
  }
};

      

    for (const tableName in parsedData) {
      if (parsedData.hasOwnProperty(tableName)) {
        if (tableName === activeDataSet) {
        // Объединяем существующие данные с новыми для каждой таблицы
        updatedTableData[tableName] = [
          ...(updatedTableData[tableName] || []),
          ...parsedData[tableName]
        ];
        }
      }
    }

      
      setTableData(updatedTableData);
      setSqlCode('');
      setShowImportModal(false);
      setImportError(null);
    } catch (error) {
      setImportError(error.message);
    }
  };

  return (
    <Container fluid className="py-4 h-100">
      <Row className="h-100">
        <Col md={3} className="mb-3">
          <Card className="h-100">
            <Card.Header className="">
              <h5>Управление данными</h5>
            </Card.Header>
            <Card.Body className="overflow-auto">
              <Form.Group className="mb-3">
                <Form.Label>Выберите таблицу</Form.Label>
                <Form.Select 
                  value={selectedTable}
                  onChange={handleTableSelect}
                >
                  <option value="">-- Выберите таблицу --</option>
                  {tables.map(table => (
                    <option key={table.name} value={table.name}>
                      {table.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              {selectedTable && (
                <>
                  <hr />
                  <h6>Добавить запись</h6>
                  {tables.find(t => t.name === selectedTable).columns
  .filter(col => !col.isAutoIncrement)  // НОВОЕ: исключаем AUTO_INCREMENT
  .map(col => (
    <Form.Group key={col.name} className="mb-2">
      <Form.Label>
        {col.name} ({col.type})
        {!col.isNullable && <span className="text-danger">*</span>}
      </Form.Label>
      <Form.Control
        type={col.type === 'integer' ? 'number' : 'text'}
        value={newRow[col.name] || ''}
        onChange={(e) => setNewRow({...newRow, [col.name]: e.target.value})}
        required={!col.isNullable}
      />
    </Form.Group>
  ))
}
                  <Button 
                    variant="primary" 
                    className="w-100 mb-3"
                    onClick={handleAddRow}
                    disabled={!Object.keys(newRow).length}
                  >
                    <i className="bi bi-plus-circle"></i> Добавить
                  </Button>

                  <Button 
                    variant="outline-secondary" 
                    className="w-100"
                    onClick={() => setShowGenerator(true)}
                  >
                    <i className="bi bi-magic"></i> Сгенерировать данные
                  </Button>
                  <Button 
                    variant="outline-primary" 
                    onClick={() => setShowImportModal(true)}
                    className="w-100 mt-3"
                  >
                    <i className="bi bi-file-earmark-arrow-down"></i> Импорт данных SQL
                  </Button>
                  
                  {/* Кнопка очистки таблицы */}
                  <Button 
                    variant="outline-danger" 
                    onClick={handleClearTable}
                    className="w-100 mt-3"
                    disabled={!currentTableData.length}
                  >
                    <i className="bi bi-trash"></i> Очистить таблицу
                  </Button>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={9}>
          <Card className="h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5>Данные таблицы: {selectedTable || 'не выбрана'}</h5>
              {selectedTable && (
                <div>
                  <span className="me-3">Записей: {currentTableData.length}</span>
                  {currentTableData.length > 0 && (
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={handleClearTable}
                    >
                      <i className="bi bi-trash"></i> Очистить все
                    </Button>
                  )}
                </div>
              )}
            </Card.Header>
            <Card.Body className="overflow-auto p-0">
              {selectedTable ? (
                <Table striped bordered hover className="mb-0">
                  <thead>
                    <tr>
                      {tables.find(t => t.name === selectedTable).columns
                      .filter(col => !col.isAutoIncrement)
                      .map(col => (
                        <th key={col.name}>{col.name}</th>
                      ))}
                      <th width="100">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentTableData.map((row, i) => (
                      <tr key={i}>
                        {tables.find(t => t.name === selectedTable).columns
      .filter(col => !col.isAutoIncrement)  // ✅ Фильтруем AUTO_INCREMENT
      .map(col => (
        <td key={col.name}>{row[col.name]}</td>  // ✅ Выводим только нужные поля
      ))
    }
                        <td className="text-center">
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteRow(i)}
                            title="Удалить запись"
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {currentTableData.length === 0 && (
                      <tr>
                        <td 
                          colSpan={tables.find(t => t.name === selectedTable).columns.filter(col => !col.isAutoIncrement).length + 1}
                          className="text-center py-4"
                        >
                          <i className="bi bi-inbox fs-1"></i>
                          <p className="mt-2">Нет данных</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center p-5">
                  <i className="bi bi-table fs-1"></i>
                  <p>Выберите таблицу для просмотра и редактирования данных</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Модальное окно импорта SQL */}
      <Modal show={showImportModal} onHide={() => setShowImportModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Импорт данных SQL</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Выберите таблицу для импорта:</Form.Label>
            <Form.Select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
            >
              <option value="">-- Выберите таблицу --</option>
              {nodes.map(node => (
                <option key={node.data.label} value={node.data.label}>
                  {node.data.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          
          <Form.Group>
            <Form.Label>Введите SQL-запросы INSERT для заполнения таблицы:</Form.Label>
            <Form.Control
              as="textarea"
              rows={10}
              value={sqlCode}
              onChange={(e) => setSqlCode(e.target.value)}
              placeholder={`Пример:\nINSERT INTO products (id, name, price) VALUES \n(1, 'Ноутбук', 999.99),\n(2, 'Мышь', 19.99);`}
            />
          </Form.Group>
          
          {importError && (
            <Alert variant="danger" className="mt-3">
              {importError}
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowImportModal(false)}>
            Отмена
          </Button>
          <Button variant="primary" onClick={handleImportSQL}>
            Импортировать
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Модальное окно генератора данных */}
      <Modal show={showGenerator} onHide={() => setShowGenerator(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Генератор случайных данных</Modal.Title>
        </Modal.Header>
        <Modal.Body>
  <Form.Group className="mb-3">
    <Form.Label>Количество записей</Form.Label>
    <Form.Control
      type="number"
      min="1"
      max="1000"
      value={generatorConfig.count}
      onChange={(e) => setGeneratorConfig({
        ...generatorConfig,
        count: parseInt(e.target.value)
      })}
    />
  </Form.Group>

  <h6>Настройки полей:</h6>
  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
    {selectedTable && tables.find(t => t.name === selectedTable).columns
      .filter(col => !col.isAutoIncrement)
      .map(col => {
        const fieldConfig = generatorConfig.fields[col.name] || {};
        
        return (
          <Card key={col.name} className="mb-3">
            <Card.Body>
              <h6 className="mb-3">
                {col.name} <small className="text-muted">({col.type})</small>
              </h6>
              
              {/* Целочисленные типы */}
              {isIntegerType(col.type) && (
                <Row>
                  <Col>
                    <Form.Group>
                      <Form.Label>Минимум</Form.Label>
                      <Form.Control
                        type="number"
                        value={fieldConfig.min ?? 0}
                        onChange={(e) => updateFieldConfig(col.name, 'min', parseInt(e.target.value))}
                      />
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group>
                      <Form.Label>Максимум</Form.Label>
                      <Form.Control
                        type="number"
                        value={fieldConfig.max ?? 100}
                        onChange={(e) => updateFieldConfig(col.name, 'max', parseInt(e.target.value))}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              )}
              
              {/* Дробные числа */}
              {isFloatType(col.type) && (
                <>
                  <Row className="mb-2">
                    <Col>
                      <Form.Group>
                        <Form.Label>Минимум</Form.Label>
                        <Form.Control
                          type="number"
                          step="0.01"
                          value={fieldConfig.min ?? 0}
                          onChange={(e) => updateFieldConfig(col.name, 'min', parseFloat(e.target.value))}
                        />
                      </Form.Group>
                    </Col>
                    <Col>
                      <Form.Group>
                        <Form.Label>Максимум</Form.Label>
                        <Form.Control
                          type="number"
                          step="0.01"
                          value={fieldConfig.max ?? 100}
                          onChange={(e) => updateFieldConfig(col.name, 'max', parseFloat(e.target.value))}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group>
                    <Form.Label>Знаков после запятой</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      max="10"
                      value={fieldConfig.precision ?? 2}
                      onChange={(e) => updateFieldConfig(col.name, 'precision', parseInt(e.target.value))}
                    />
                  </Form.Group>
                </>
              )}
              
              {/* Логические */}
              {isBooleanType(col.type) && (
                <Alert variant="info" className="mb-0">
                  <i className="bi bi-info-circle"></i> Будут случайно генерироваться значения true/false
                </Alert>
              )}
              
              {/* Текстовые */}
              {isTextType(col.type) && (
                <>
                  <Form.Group className="mb-2">
                    <Form.Label>Тип шаблона</Form.Label>
                    <Form.Select
                      value={fieldConfig.templateType || 'custom'}
                      onChange={(e) => updateFieldConfig(col.name, 'templateType', e.target.value)}
                    >
                      <option value="name">Имя и фамилия</option>
                      <option value="email">Email</option>
                      <option value="phone">Телефон</option>
                      <option value="address">Адрес</option>
                      <option value="company">Название компании</option>
                      <option value="custom">Свой шаблон</option>
                    </Form.Select>
                  </Form.Group>
                  
                  {(fieldConfig.templateType === 'custom' || !fieldConfig.templateType) && (
                    <Form.Group>
                      <Form.Label>Шаблон</Form.Label>
                      <Form.Control
                        type="text"
                        value={fieldConfig.customPattern || ''}
                        onChange={(e) => updateFieldConfig(col.name, 'customPattern', e.target.value)}
                        placeholder="Например: {name} - {email}"
                      />
                      <Form.Text className="text-muted">
                        Доступные плейсхолдеры: {'{name}'}, {'{email}'}, {'{phone}'}, {'{number}'}, {'{word}'}
                      </Form.Text>
                    </Form.Group>
                  )}
                </>
              )}
              
              {/* Даты */}
              {isDateType(col.type) && (
                <Row>
                  <Col>
                    <Form.Group>
                      <Form.Label>Дата от</Form.Label>
                      <DatePicker
                        selected={fieldConfig.dateFrom ? new Date(fieldConfig.dateFrom) : new Date('2020-01-01')}
                        onChange={(date) => updateFieldConfig(col.name, 'dateFrom', date.toISOString().split('T')[0])}
                        dateFormat="yyyy-MM-dd"
                        className="form-control"
                        locale="ru"
                      />
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group>
                      <Form.Label>Дата до</Form.Label>
                      <DatePicker
                        selected={fieldConfig.dateTo ? new Date(fieldConfig.dateTo) : new Date()}
                        onChange={(date) => updateFieldConfig(col.name, 'dateTo', date.toISOString().split('T')[0])}
                        dateFormat="yyyy-MM-dd"
                        className="form-control"
                        locale="ru"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              )}
            </Card.Body>
          </Card>
        );
      })
    }
  </div>
</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowGenerator(false)}>
            Отмена
          </Button>
          <Button variant="primary" onClick={generateRandomData}>
            Сгенерировать
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}