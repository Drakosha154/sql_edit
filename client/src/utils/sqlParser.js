export function parseSQL(sql) {
  const tables = [];
  const foreignKeys = [];

    if (!sql) {
        return;
      }
  
  // Удаляем комментарии
  const cleanedSQL = sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
  
  // Упрощенные регулярные выражения
  const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\(((?:[^()]|\([^()]*\))*)\)\s*;?/gi;
  const columnRegex = /(\w+)\s+([\w\(\)]+)(?:\s+(.*))?/i;
  // Исправлено: учитываем возможные опции после REFERENCES
  const referenceRegex = /REFERENCES\s+(\w+)\s*\((\w+)\)(?:\s+(?:ON\s+(?:DELETE|UPDATE)\s+(?:CASCADE|SET NULL|SET DEFAULT|RESTRICT|NO ACTION)))*/i;
  const constraintRegex = /CONSTRAINT\s+\w+\s+FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+(\w+)\s*\(([^)]+)\)(?:\s+(?:ON\s+(?:DELETE|UPDATE)\s+(?:CASCADE|SET NULL|SET DEFAULT|RESTRICT|NO ACTION)))*/i;
  
  // Парсим CREATE TABLE
  let tableMatch;
  while ((tableMatch = createTableRegex.exec(cleanedSQL)) !== null) {
    const tableName = tableMatch[1];
    const columnsDef = tableMatch[2];
    const columns = [];
    const lines = columnsDef.split('\n')
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
              fromTable: tableName,
              fromColumn: col,
              toTable,
              toColumn: toColumns[i]
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
        
        columns.push({
          name: colName,
          type: colType,
          isPrimary,
          isNullable,
          isForeignKey
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