export function parseSQL(sql) {
  const tables = [];
  const foreignKeys = [];
  
  // Удаляем комментарии
  const cleanedSQL = sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
  
  // Упрощенные регулярные выражения
  const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\(([\s\S]+?)\)\s*;?/gi;
  const columnRegex = /(\w+)\s+([\w\(\)]+)(?:\s+(.*))?/i;
  const referenceRegex = /REFERENCES\s+(\w+)\s*\((\w+)\)/i;
  const constraintRegex = /CONSTRAINT\s+\w+\s+FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+(\w+)\s*\(([^)]+)\)/i;
  
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
        
        // Ищем REFERENCES
        const refMatch = referenceRegex.exec(constraints);
        if (refMatch) {
          foreignKeys.push({
            fromTable: tableName,
            fromColumn: colName,
            toTable: refMatch[1],
            toColumn: refMatch[2]
          });
        }
        
        columns.push({
          name: colName,
          type: colType,
          isPrimary,
          isNullable
        });
      }
    }
    
    tables.push({
      name: tableName,
      columns
    });
  }
  
  // Парсим ALTER TABLE ADD CONSTRAINT
  const alterTableRegex = /ALTER\s+TABLE\s+(\w+)\s+ADD\s+(?:CONSTRAINT\s+\w+\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+(\w+)\s*\(([^)]+)\)/gi;
  let alterMatch;
  while ((alterMatch = alterTableRegex.exec(cleanedSQL)) !== null) {
    const fromTable = alterMatch[1];
    const fromColumns = alterMatch[2].split(',').map(c => c.trim());
    const toTable = alterMatch[3];
    const toColumns = alterMatch[4].split(',').map(c => c.trim());
    
    fromColumns.forEach((col, i) => {
      foreignKeys.push({
        fromTable,
        fromColumn: col,
        toTable,
        toColumn: toColumns[i]
      });
    });
  }
  
  return { tables, foreignKeys };
}