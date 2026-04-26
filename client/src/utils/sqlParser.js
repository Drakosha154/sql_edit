export function parseSQL(sql) {
  const tables = [];
  const foreignKeys = [];

    if (!sql) {
        return;
      }
  
  // Удаляем комментарии
  let cleanedSQL = sql
  .replace(/--.*$/gm, '')  // Удаляем однострочные комментарии
  .replace(/\/\*[\s\S]*?\*\//g, '')  // Удаляем многострочные комментарии
  .replace(/,\s*FOREIGN\s+KEY/gi, ',\nFOREIGN KEY')  // ✅ НОВОЕ: Разделяем FOREIGN KEY на новые строки
  .replace(/\)\s*;?\s*CREATE/gi, ');\nCREATE')  // ✅ НОВОЕ: Разделяем CREATE TABLE
  .trim();
  
  // Упрощенные регулярные выражения
  const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\(([\s\S]*?)\);/gi;
  const columnRegex = /(\w+)\s+([\w]+(?:\s*\([^)]*\))?)\s*(.*)?/i;
  // Исправлено: учитываем возможные опции после REFERENCES
  const referenceRegex = /REFERENCES\s+(\w+)\s*\((\w+)\)(?:\s+(?:ON\s+(?:DELETE|UPDATE)\s+(?:CASCADE|SET NULL|SET DEFAULT|RESTRICT|NO ACTION)))*/i;
  const constraintRegex = /CONSTRAINT\s+\w+\s+FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+(\w+)\s*\(([^)]+)\)(?:\s+(?:ON\s+(?:DELETE|UPDATE)\s+(?:CASCADE|SET NULL|SET DEFAULT|RESTRICT|NO ACTION)))*/i;
  
  // Парсим CREATE TABLE
  let tableMatch;
  while ((tableMatch = createTableRegex.exec(cleanedSQL)) !== null) {
    const tableName = tableMatch[1];
    const columnsDef = tableMatch[2];
    const columns = [];
    const lines = columnsDef
  .split(/,(?![^()]*\))/)  // ✅ Разделяем по запятым, НЕ внутри скобок
  .map(line => line.trim())
  .filter(line => line && !line.startsWith('--'));
    
    for (const line of lines) {
      // Пропускаем CONSTRAINT (обрабатываем отдельно)
      if (line.startsWith('CONSTRAINT')) {
        const constraintMatch = constraintRegex.exec(line);
        if (constraintMatch) {
          const fromColumns = constraintMatch[1].split(',').map(c => c.trim());
          const toTable = constraintMatch[2];
          const toColumns = constraintMatch[3].split(',').map(c => c.trim());
          
          fromColumns.forEach((col, i) => {
            foreignKeys.push({
              fromTable: toTable, 
              fromColumn: toColumns[i],
              toTable: tableName,
              toColumn: col 
            });

            // ИЗМЕНЕНИЕ: Помечаем колонку как foreign key в таблице
            const column = columns.find(c => c.name === col);
            if (column) {
              column.isForeignKey = true;
            }
          });
        }
        continue;
      }

      // НОВОЕ: Пропускаем FOREIGN KEY без CONSTRAINT
  if (line.startsWith('FOREIGN KEY') || line.match(/^\s*FOREIGN\s+KEY/i)) {
    const fkRegex = /FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+(\w+)\s*\(([^)]+)\)/i;
    const fkMatch = fkRegex.exec(line);
    if (fkMatch) {
      const fromColumns = fkMatch[1].split(',').map(c => c.trim());
      const toTable = fkMatch[2];
      const toColumns = fkMatch[3].split(',').map(c => c.trim());
      
      fromColumns.forEach((col, i) => {
        foreignKeys.push({
          fromTable: toTable,
          fromColumn: toColumns[i],
          toTable: tableName,
          toColumn: col
        });
        
        const column = columns.find(c => c.name === col);
        if (column) {
          column.isForeignKey = true;
        }
      });
    }
    continue;
  }

      const colMatch = columnRegex.exec(line);
      if (colMatch) {
        const colName = colMatch[1];
        const colType = colMatch[2];
        const constraints = colMatch[3] || '';
        
        const isPrimary = constraints.includes('PRIMARY KEY');
        const isNullable = !constraints.includes('NOT NULL');
        var isForeignKey = false;
        
        // Ищем REFERENCES (исправленный вариант)
        const refMatch = referenceRegex.exec(constraints);
        //console.log(refMatch)
        if (refMatch) {
          foreignKeys.push({
            fromTable: refMatch[1],
            fromColumn: refMatch[2],
            toTable: tableName,
            toColumn: colName
          });
          isForeignKey = true;
        }

const isAutoIncrement = constraints.includes('AUTO_INCREMENT') || 
                        constraints.includes('AUTOINCREMENT') ||
                        constraints.includes('auto_increment')  ||
                        colType.toUpperCase().includes('SERIAL');;
        
        columns.push({
          name: colName,
          type: colType,
          isPrimary,
          isNullable,
          isForeignKey,
          isAutoIncrement
        });
      }
    }
    
    tables.push({
      name: tableName,
      columns
    });
  }
  
    // Парсим ALTER TABLE ADD CONSTRAINT (тоже нужно исправить)
  const alterTableRegex = /ALTER\s+TABLE\s+(\w+)\s+ADD\s+(?:CONSTRAINT\s+\w+\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+(\w+)\s*\(([^)]+)\)(?:\s+(?:ON\s+(?:DELETE|UPDATE)\s+(?:CASCADE|SET NULL|SET DEFAULT|RESTRICT|NO ACTION)))*/gi;
  
  let alterMatch;
  while ((alterMatch = alterTableRegex.exec(cleanedSQL)) !== null) {
    const fromTable = alterMatch[3];
    const fromColumns = alterMatch[4].split(',').map(c => c.trim());
    const toTable = alterMatch[1];
    const toColumns = alterMatch[2].split(',').map(c => c.trim());
    
    fromColumns.forEach((col, i) => {
      foreignKeys.push({
        fromTable,
        fromColumn: col,
        toTable,
        toColumn: toColumns[i]
      });

      const table = tables.find(t => t.name === toTable);
      if (table) {
        const column = table.columns.find(c => c.name === toColumns[i]);
        if (column) {
          column.isForeignKey = true;
        }
      }
    });
  }
  
  return { tables, foreignKeys };
}