export function parseInsertSQL(sql) {
    try {
        const result = {};
        
        // Удаляем комментарии и лишние пробелы
        const cleanSQL = sql
            .replace(/--.*$/gm, '') // Удаляем однострочные комментарии
            .replace(/\/\*[\s\S]*?\*\//g, '') // Удаляем многострочные комментарии
            .trim();
        
        // Регулярное выражение для поиска INSERT запросов с учетом кавычек
        const insertRegex = /INSERT\s+INTO\s+([^\s(]+)\s*\(([^)]+)\)\s*VALUES\s*([^;]+);/gi;
        
        let match;
        
        while ((match = insertRegex.exec(cleanSQL)) !== null) {
            const tableName = match[1].trim().replace(/["`]/g, '');
            const columns = match[2].split(',')
                .map(c => c.trim().replace(/["`]/g, ''));
            
            // Парсим значения с учетом кавычек и разных форматов
            const valuesText = match[3];
            const valueGroups = parseValueGroups(valuesText);
            
            if (!result[tableName]) {
                result[tableName] = [];
            }
            
            valueGroups.forEach(values => {
                if (columns.length === values.length) {
                    const row = {};
                    columns.forEach((col, i) => {
                        row[col] = parseSQLValue(values[i]);
                    });
                    result[tableName].push(row);
                }
            });
        }
        
        return result;
    } catch (error) {
        throw new Error(`Ошибка парсинга SQL: ${error.message}`);
    }
}

// Функция для парсинга групп значений с учетом кавычек
function parseValueGroups(valuesText) {
    const groups = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = null;
    let inParentheses = false;
    let parenDepth = 0;
    
    for (let i = 0; i < valuesText.length; i++) {
        const char = valuesText[i];
        
        if (char === "'" || char === '"') {
            if (!inQuotes) {
                inQuotes = true;
                quoteChar = char;
                current += char;
            } else if (char === quoteChar) {
                // Проверяем, не экранирована ли кавычка
                if (i > 0 && valuesText[i - 1] === '\\') {
                    current += char;
                } else {
                    inQuotes = false;
                    quoteChar = null;
                    current += char;
                }
            } else {
                current += char;
            }
        } else if (char === '(' && !inQuotes) {
            if (parenDepth === 0) {
                inParentheses = true;
                current = '';
            }
            parenDepth++;
        } else if (char === ')' && !inQuotes) {
            parenDepth--;
            if (parenDepth === 0) {
                inParentheses = false;
                groups.push(current.trim());
                current = '';
            }
        } else if (char === ',' && !inQuotes && !inParentheses) {
            // Игнорируем запятые вне скобок
            continue;
        } else {
            current += char;
        }
    }
    
    // Если остались необработанные значения
    if (current.trim() && !inParentheses) {
        const lastGroups = current.split('),(')
            .map(group => group.replace(/^\(|\)$/g, '').trim());
        groups.push(...lastGroups);
    }
    
    return groups.map(group => {
        return parseValuesFromGroup(group);
    });
}

// Функция для парсинга значений из одной группы
function parseValuesFromGroup(group) {
    const values = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = null;
    
    for (let i = 0; i < group.length; i++) {
        const char = group[i];
        
        if (char === "'" || char === '"') {
            if (!inQuotes) {
                inQuotes = true;
                quoteChar = char;
                current += char;
            } else if (char === quoteChar) {
                // Проверяем экранирование
                if (i > 0 && group[i - 1] === '\\') {
                    current += char;
                } else {
                    inQuotes = false;
                    quoteChar = null;
                    current += char;
                }
            } else {
                current += char;
            }
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    if (current.trim()) {
        values.push(current.trim());
    }
    
    return values;
}

// Функция для парсинка отдельного значения SQL
function parseSQLValue(value) {
    if (!value) return null;
    
    const trimmedValue = value.trim();
    
    // NULL значения
    if (trimmedValue.toUpperCase() === 'NULL') {
        return null;
    }
    
    // Строки в кавычках
    if ((trimmedValue.startsWith("'") && trimmedValue.endsWith("'")) ||
        (trimmedValue.startsWith('"') && trimmedValue.endsWith('"'))) {
        // Убираем внешние кавычки и экранирование
        const innerValue = trimmedValue.slice(1, -1);
        return innerValue.replace(/''/g, "'").replace(/\\'/g, "'");
    }
    
    // Числовые значения
    if (!isNaN(trimmedValue) && trimmedValue !== '') {
        // Проверяем, целое это число или с плавающей точкой
        return trimmedValue.includes('.') ? parseFloat(trimmedValue) : parseInt(trimmedValue);
    }
    
    // Булевы значения
    if (trimmedValue.toUpperCase() === 'TRUE') return true;
    if (trimmedValue.toUpperCase() === 'FALSE') return false;
    
    // Если ничего не подошло, возвращаем как строку
    return trimmedValue;
}

// Альтернативная упрощенная версия для хорошо форматированного SQL
export function parseInsertSQLSimple(sql) {
    try {
        const result = {};
        
        // Удаляем комментарии
        const cleanSQL = sql.replace(/--.*$/gm, '').trim();
        
        // Ищем INSERT INTO statements
        const insertStatements = cleanSQL.split(';')
            .filter(stmt => stmt.trim().toUpperCase().startsWith('INSERT INTO'));
        
        insertStatements.forEach(statement => {
            const tableMatch = statement.match(/INSERT\s+INTO\s+([^\s(]+)/i);
            if (!tableMatch) return;
            
            const tableName = tableMatch[1].trim().replace(/["`]/g, '');
            
            // Извлекаем колонки
            const columnsMatch = statement.match(/\(([^)]+)\)/);
            if (!columnsMatch) return;
            
            const columns = columnsMatch[1].split(',')
                .map(c => c.trim().replace(/["`]/g, ''));
            
            // Извлекаем значения
            const valuesMatch = statement.match(/VALUES\s*(.+)$/i);
            if (!valuesMatch) return;
            
            const valuesText = valuesMatch[1];
            // Парсим значения с помощью улучшенного парсера
            const valueRows = parseValueRows(valuesText);
            
            if (!result[tableName]) {
                result[tableName] = [];
            }
            
            valueRows.forEach(values => {
                if (values.length === columns.length) {
                    const row = {};
                    columns.forEach((col, i) => {
                        row[col] = parseSQLValue(values[i]);
                    });
                    result[tableName].push(row);
                }
            });
        });
        
        return result;
    } catch (error) {
        throw new Error(`Ошибка парсинга SQL: ${error.message}`);
    }
}

// Упрощенный парсер строк значений
function parseValueRows(valuesText) {
    const rows = [];
    const rowRegex = /\(([^)]+)\)/g;
    let match;
    
    while ((match = rowRegex.exec(valuesText)) !== null) {
        const rowValues = match[1].split(',')
            .map(v => v.trim());
        rows.push(rowValues);
    }
    
    return rows;
}