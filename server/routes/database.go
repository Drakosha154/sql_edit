package routes

import (
	"encoding/csv"
	"fmt"
	"io"
	"log"
	"net/http"
	"sql_edit/database"
	"sql_edit/models"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SaveDatabase(c *gin.Context) {

	userID := c.MustGet("userID").(uint)

	var dbInput struct {
		Name         string `json:"Name"`
		Schema       string `json:"Schema"`
		SchemaInsert string `json:"SchemaInsert"`
		Task         string `json:"Task"`
		Decision     string `json:"Decision"`
	}

	if err := c.ShouldBindJSON(&dbInput); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := models.Database_lists{
		ID_creator:           userID,
		Database_name:        dbInput.Name,
		Database_create_text: dbInput.Schema,
		Database_insert_text: dbInput.SchemaInsert,
		Database_task:        dbInput.Task,
		Database_decision:    dbInput.Decision,
	}

	if err := database.DB.Create(&db).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save database"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Database saved"})
}

func GetUserDatabases(c *gin.Context) {

	userID := c.MustGet("userID").(uint) // Получаем ID пользователя из middleware

	var databases []models.Database_lists
	if err := database.DB.Where("id_creator = ?", userID).Find(&databases).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch databases"})
		return
	}

	// Формируем ответ с дополнительной информацией о пользователе
	type DatabaseWithCreator struct {
		ID        uint
		Name      string
		CreatedAt time.Time
	}

	var result []DatabaseWithCreator
	for _, db := range databases {
		var creator models.User
		database.DB.First(&creator, db.ID_creator)

		result = append(result, DatabaseWithCreator{
			ID:        db.ID,
			Name:      db.Database_name,
			CreatedAt: db.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{"databases": result})

}

func GetDatabasesByID(c *gin.Context) {

	userID := c.MustGet("userID").(uint) // Получаем ID пользователя из middleware

	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid database ID"})
		return
	}

	var db models.Database_lists
	if err := database.DB.Where("id = ? AND id_creator = ?", id, userID).First(&db).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Database not found"})
		return
	}

	// Формируем ответ
	c.JSON(http.StatusOK, gin.H{
		"id":        db.ID,
		"name":      db.Database_name,
		"schema":    db.Database_create_text,
		"data":      db.Database_insert_text,
		"task":      db.Database_task,
		"decision":  db.Database_decision,
		"createdAt": db.CreatedAt,
	})
}

func DelDatabasesByID(c *gin.Context) {

	userID := c.MustGet("userID").(uint) // Получаем ID пользователя из middleware

	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid database ID"})
		return
	}

	var db models.Database_lists
	if err := database.DB.Where("id = ? AND id_creator = ?", id, userID).First(&db).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Database not found"})
		return
	}

	if err := database.DB.Delete(&db).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete database record"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Database record deleted successfully",
		"id":      id,
	})
}

func UpdDatabasesByID(c *gin.Context) {

	userID := c.MustGet("userID").(uint) // Получаем ID пользователя из middleware

	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid database ID"})
		return
	}

	var updateData struct {
		Schema       string `json:"Schema"`
		SchemaInsert string `json:"SchemaInsert"`
		Task         string `json:"Task"`
		Decision     string `json:"Decision"`
	}

	fmt.Println(updateData.Decision)

	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	var db models.Database_lists
	if err := database.DB.Where("id = ? AND id_creator = ?", id, userID).First(&db).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Database not found or access denied"})
		return
	}

	updates := models.Database_lists{
		Database_create_text: updateData.Schema,
		Database_insert_text: updateData.SchemaInsert,
		Database_task:        updateData.Task,
		Database_decision:    updateData.Decision,
	}

	if err := database.DB.Model(&db).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update database"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Database updated successfully",
		"id":      id,
		"data":    updates,
	})
}

// SolutionResult представляет результат проверки
type SolutionResult struct {
	Success        bool                     `json:"success"`
	Message        string                   `json:"message"`
	UserResult     []map[string]interface{} `json:"user_result"`
	ExpectedResult []map[string]interface{} `json:"expected_result"`
	ExecutionTime  time.Duration            `json:"execution_time"`
}

// CheckSolutionWithSchema обработчик с использованием схем
func CheckSolutionWithSchema(c *gin.Context) {
	startTime := time.Now()

	var request struct {
		SolutionSQL string `json:"solution_sql" binding:"required"`
		TaskID      int    `json:"task_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный запрос: " + err.Error()})
		return
	}

	// Валидация SQL
	if err := validateSQL(request.SolutionSQL); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Недопустимый SQL: " + err.Error()})
		return
	}

	userID := c.MustGet("userID").(uint)

	// Получаем задание из базы
	var task models.Database_lists
	if err := database.DB.Where("id = ?", request.TaskID).First(&task).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Задание не найдено"})
		return
	}

	// Создаем уникальное имя схемы
	schemaName := generateSchemaName(userID, request.TaskID)

	// Выполняем проверку в изолированной схеме
	result, err := executeInSchema(schemaName, task.Database_create_text, task.Database_insert_text, request.SolutionSQL, task.Database_decision)
	if err != nil {
		// Логируем ошибку для отладки
		log.Printf("Ошибка выполнения решения: %v", err)

		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Ошибка выполнения решения",
			"details": err.Error(),
		})
		return
	}

	result.ExecutionTime = time.Since(startTime)

	c.JSON(http.StatusOK, result)
}

// generateSchemaName создает уникальное имя схемы
func generateSchemaName(userID uint, taskID int) string {
	timestamp := time.Now().UnixNano()
	return fmt.Sprintf("user_%d_task_%d_%d", userID, taskID, timestamp)
}

// executeInSchema выполняет решение в изолированной схеме с использованием GORM
func executeInSchema(schemaName, schemaSQL, dataSQL, userSQL, expectedCSV string) (*SolutionResult, error) {
	// Создаем отдельное соединение для схемы
	schemaDB, err := createSchemaConnection()
	if err != nil {
		return nil, fmt.Errorf("ошибка создания соединения: %v", err)
	}
	defer closeSchemaConnection(schemaDB)

	// 1. Сначала создаем схему
	if err := schemaDB.Exec(fmt.Sprintf("CREATE SCHEMA IF NOT EXISTS %s", schemaName)).Error; err != nil {
		return nil, fmt.Errorf("ошибка создания схемы: %v", err)
	}

	// 2. Устанавливаем схему по умолчанию
	if err := schemaDB.Exec(fmt.Sprintf("SET search_path TO %s", schemaName)).Error; err != nil {
		return nil, fmt.Errorf("ошибка установки схемы: %v", err)
	}

	// 3. Выполняем схему БД (создание таблиц)
	if err := executeSchemaSQL(schemaDB, schemaSQL); err != nil {
		return nil, fmt.Errorf("ошибка выполнения схемы: %v", err)
	}

	// 4. Заполняем данными (INSERT)
	if err := executeSchemaSQL(schemaDB, dataSQL); err != nil {
		return nil, fmt.Errorf("ошибка заполнения данных: %v", err)
	}

	// 5. Выполняем решение пользователя
	userResult, err := executeUserQuery(schemaDB, userSQL)
	if err != nil {
		return nil, fmt.Errorf("ошибка решения пользователя: %v", err)
	}

	// 6. Парсим ожидаемый результат
	expectedResult, err := csvToJson(expectedCSV)
	if err != nil {
		return nil, fmt.Errorf("ошибка парсинга ожидаемого результата: %v", err)
	}

	// 7. Удаляем схему (очистка) - в отдельной операции чтобы не прерывать текущее соединение
	go func() {
		cleanupDB, err := createSchemaConnection()
		if err == nil {
			defer closeSchemaConnection(cleanupDB)
			cleanupDB.Exec(fmt.Sprintf("DROP SCHEMA IF EXISTS %s CASCADE", schemaName))
		}
	}()

	// 8. Сравниваем результаты
	isCorrect, message := compareResults(userResult, expectedResult)

	return &SolutionResult{
		Success:        isCorrect,
		Message:        message,
		UserResult:     userResult,
		ExpectedResult: expectedResult,
	}, nil
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

// createSchemaConnection создает новое соединение для работы со схемой
func createSchemaConnection() (*gorm.DB, error) {
	return database.GetConnectionForSchema()
}

func closeSchemaConnection(db *gorm.DB) {
	if db != nil {
		sqlDB, _ := db.DB()
		sqlDB.Close()
	}
}

func executeSchemaSQL(db *gorm.DB, sql string) error {
	// Разбиваем SQL на отдельные запросы, если нужно
	queries := strings.Split(sql, ";")
	for _, query := range queries {
		query = strings.TrimSpace(query)
		if query == "" {
			continue
		}
		if err := db.Exec(query).Error; err != nil {
			return fmt.Errorf("ошибка выполнения запроса '%s': %v", query, err)
		}
	}
	return nil
}

func executeUserQuery(db *gorm.DB, query string) ([]map[string]interface{}, error) {
	var results []map[string]interface{}

	rows, err := db.Raw(query).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	columns, err := rows.Columns()
	if err != nil {
		return nil, err
	}

	for rows.Next() {
		values := make([]interface{}, len(columns))
		valuePtrs := make([]interface{}, len(columns))
		for i := range values {
			valuePtrs[i] = &values[i]
		}

		if err := rows.Scan(valuePtrs...); err != nil {
			return nil, err
		}

		row := make(map[string]interface{})
		for i, col := range columns {
			val := values[i]
			if b, ok := val.([]byte); ok {
				row[col] = string(b)
			} else if val == nil {
				row[col] = nil
			} else {
				row[col] = val
			}
		}
		results = append(results, row)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return results, nil
}

// csvToJson преобразует CSV строку в JSON
func csvToJson(csvText string) ([]map[string]interface{}, error) {
	if strings.TrimSpace(csvText) == "" {
		return []map[string]interface{}{}, nil
	}

	reader := csv.NewReader(strings.NewReader(csvText))
	reader.TrimLeadingSpace = true
	reader.FieldsPerRecord = -1 // Разрешаем переменное количество полей

	// Читаем заголовки
	headers, err := reader.Read()
	if err != nil {
		return nil, fmt.Errorf("ошибка чтения заголовков CSV: %v", err)
	}

	var results []map[string]interface{}

	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("ошибка чтения CSV данных: %v", err)
		}

		row := make(map[string]interface{})
		for i, header := range headers {
			if i < len(record) {
				value := strings.TrimSpace(record[i])
				row[header] = parseCSVValue(value)
			} else {
				row[header] = nil
			}
		}
		results = append(results, row)
	}

	return results, nil
}

// parseCSVValue парсит значение из CSV
func parseCSVValue(value string) interface{} {
	if value == "" || strings.ToUpper(value) == "NULL" {
		return nil
	}

	// Попытка парсинга целого числа
	if intValue, err := parseInt(value); err == nil {
		return intValue
	}

	// Попытка парсинга числа с плавающей точкой
	if floatValue, err := parseFloat(value); err == nil {
		return floatValue
	}

	// Булевы значения
	if strings.ToUpper(value) == "TRUE" {
		return true
	}
	if strings.ToUpper(value) == "FALSE" {
		return false
	}

	// Убираем кавычки если они есть
	if len(value) >= 2 &&
		((value[0] == '"' && value[len(value)-1] == '"') ||
			(value[0] == '\'' && value[len(value)-1] == '\'')) {
		return value[1 : len(value)-1]
	}

	// Возвращаем как строку
	return value
}

// parseInt пытается распарсить целое число
func parseInt(s string) (int, error) {
	var value int
	_, err := fmt.Sscanf(s, "%d", &value)
	return value, err
}

// parseFloat пытается распарсить число с плавающей точкой
func parseFloat(s string) (float64, error) {
	var value float64
	_, err := fmt.Sscanf(s, "%f", &value)
	return value, err
}

// compareResults сравнивает два набора данных
func compareResults(userResult, expectedResult []map[string]interface{}) (bool, string) {
	if len(userResult) != len(expectedResult) {
		return false, fmt.Sprintf("Разное количество строк: получено %d, ожидается %d",
			len(userResult), len(expectedResult))
	}

	for i, userRow := range userResult {
		expectedRow := expectedResult[i]

		if len(userRow) != len(expectedRow) {
			return false, fmt.Sprintf("Разное количество столбцов в строке %d: получено %d, ожидается %d",
				i+1, len(userRow), len(expectedRow))
		}

		for key, userValue := range userRow {
			expectedValue, exists := expectedRow[key]
			if !exists {
				return false, fmt.Sprintf("Столбец '%s' отсутствует в ожидаемом результате", key)
			}

			if !valuesEqual(userValue, expectedValue) {
				return false, fmt.Sprintf("Несовпадение в строке %d, столбец '%s': получено '%v', ожидается '%v'",
					i+1, key, userValue, expectedValue)
			}
		}
	}

	return true, "Результаты совпадают"
}

// valuesEqual сравнивает два значения
func valuesEqual(a, b interface{}) bool {
	if a == nil && b == nil {
		return true
	}
	if a == nil || b == nil {
		return false
	}

	// Преобразуем к строке для сравнения (можно улучшить типобезопасным сравнением)
	return fmt.Sprintf("%v", a) == fmt.Sprintf("%v", b)
}

// validateSQL улучшенная проверка SQL
func validateSQL(sql string) error {
	blacklist := []string{
		"DROP DATABASE",
		"CREATE DATABASE",
		"ALTER DATABASE",
		"\\c ",
		"pg_",
		"\\dt",
		"\\dn",
		"\\ds",
		"--",
		"/*",
		"*/",
	}

	// Проверяем на наличие опасных операций со схемами
	schemaBlacklist := []string{
		"DROP SCHEMA",
		"CREATE SCHEMA",
		"ALTER SCHEMA",
	}

	upperSQL := strings.ToUpper(sql)

	for _, forbidden := range blacklist {
		if strings.Contains(upperSQL, forbidden) {
			return fmt.Errorf("запрещенная операция: %s", forbidden)
		}
	}

	// Разрешаем операции со схемами только если они относятся к временной схеме
	for _, forbidden := range schemaBlacklist {
		if strings.Contains(upperSQL, forbidden) && !strings.Contains(upperSQL, "IF EXISTS") {
			return fmt.Errorf("операции со схемами запрещены: %s", forbidden)
		}
	}

	return nil
}
