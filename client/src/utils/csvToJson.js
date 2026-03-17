function parseCsvLine(line, delimiter) {
  const result = [];
  let current = '';
  let inQuotes = false;
  let escapeNext = false;

  if (!line) {
        console.log('line для вставки данных пуст');
        return;
      }
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (escapeNext) {
      current += char;
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    
    if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
      continue;
    }
    
    current += char;
  }
  
  result.push(current.trim());
  return result;
}

function parseCsvValue(value) {
  if (value === '') return null;
  
  // Пробуем преобразовать в число
  if (!isNaN(value) && value !== '') {
    const num = Number(value);
    if (!isNaN(num)) return num;
  }
  
  // Пробуем преобразовать в boolean
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  
  // Убираем экранированные кавычки
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1).replace(/""/g, '"');
  }
  
  return value;
}

// Дополнительная функция для обработки сложных случаев
function advancedCsvToJson(csvText, options = {}) {
  const {
    delimiter = ',',
    hasHeaders = true,
    skipEmptyLines = true,
    autoParse = true
  } = options;
  
  const lines = csvText
    .split('\n')
    .map(line => line.trim())
    .filter(line => !skipEmptyLines || line !== '');
  
  if (lines.length === 0) return [];
  
  let headers = [];
  let dataLines = [];
  
  if (hasHeaders) {
    headers = parseCsvLine(lines[0], delimiter);
    dataLines = lines.slice(1);
  } else {
    const firstLine = parseCsvLine(lines[0], delimiter);
    headers = firstLine.map((_, i) => `column_${i + 1}`);
    dataLines = lines;
  }
  
  return dataLines
    .filter(line => line.trim() !== '')
    .map(line => {
      const values = parseCsvLine(line, delimiter);
      const obj = {};
      
      headers.forEach((header, index) => {
        let value = index < values.length ? values[index] : '';
        
        if (autoParse) {
          value = parseCsvValue(value);
        }
        
        obj[header] = value;
      });
      
      return obj;
    });
}

export function csvToJson(csvText, options = {}) {
  if (!csvText || typeof csvText !== 'string') return [];
  
  const {
    delimiter = ',',
    hasHeaders = true,
    skipEmptyLines = true
  } = options;
  
  const lines = csvText.split('\n').filter(line => {
    if (skipEmptyLines) {
      return line.trim() !== '';
    }
    return true;
  });
  
  if (lines.length === 0) return [];
  
  let headers = [];
  let data = [];
  
  if (hasHeaders) {
    // Извлекаем заголовки из первой строки
    headers = parseCsvLine(lines[0], delimiter);
    data = lines.slice(1);
  } else {
    // Генерируем заголовки автоматически (field_0, field_1, ...)
    const firstLine = parseCsvLine(lines[0], delimiter);
    headers = firstLine.map((_, index) => `field_${index}`);
    data = lines;
  }
  
  const result = [];
  
  for (let i = 0; i < data.length; i++) {
    if (data[i].trim() === '') continue;
    
    const values = parseCsvLine(data[i], delimiter);
    const obj = {};
    
    headers.forEach((header, index) => {
      if (index < values.length) {
        obj[header] = parseCsvValue(values[index]);
      } else {
        obj[header] = null;
      }
    });
    
    result.push(obj);
  }
  
  return result;
}