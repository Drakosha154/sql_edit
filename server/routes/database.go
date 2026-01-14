package routes

import (
	"encoding/csv"
	"encoding/json"
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

	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid database ID"})
		return
	}

	var db models.Database_lists
	if err := database.DB.Where("id = ?", id).First(&db).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Database not found"})
		return
	}

	// Формируем ответ
	c.JSON(http.StatusOK, gin.H{
		"id":        db.ID,
		"name":      db.Database_name,
		"schema":    db.Database_create_text,
		"data":      db.Database_insert_text,
		"createdAt": db.CreatedAt,
	})
}

func GetTasksByID(c *gin.Context) {

	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid database ID"})
		return
	}

	var task models.Tasks_list
	if err := database.DB.Where("id = ?", id).First(&task).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Database not found"})
		return
	}

	var db models.Database_lists
	if err := database.DB.Where("id = ?", task.ID_database).First(&db).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Database not found"})
		return
	}

	// Формируем ответ
	c.JSON(http.StatusOK, gin.H{
		"id":           task.ID,
		"name":         task.Task_name,
		"description":  task.Task_formulation,
		"result":       task.Database_decision,
		"nameDatabase": db.Database_name,
		"create":       db.Database_create_text,
		"insert":       db.Database_insert_text,
		"createdAt":    task.CreatedAt,
		"id_database":  task.ID_database,
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

func GetSolutionTask(c *gin.Context) {

	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid database ID"})
		return
	}

	userID := c.MustGet("userID").(uint)

	// Получаем задание из базы
	var task models.Solutions_list
	if err := database.DB.Where("user_id = ? AND task_id = ? AND is_correct = ?", userID, id, true).First(&task).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Задание не найдено"})
		return
	}

	// Сохраняем результат ПЕРЕД отправкой ответа клиенту
	db := models.Solutions_list{
		UserID:      userID,
		TaskID:      id,
		DecisionSQL: task.DecisionSQL,
		IsCorrect:   task.IsCorrect, // Используем реальный результат проверки
	}

	c.JSON(http.StatusOK, db)
}

func GetSolutionTaskProfile(c *gin.Context) {

	userID := c.MustGet("userID").(uint)

	// Получаем задание из базы
	var task []models.Solutions_list
	if err := database.DB.Where("user_id = ?", userID).First(&task).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Задание не найдено"})
		return
	}

	type TaskProfile struct {
		ID        uint
		TaskID    int
		IsCorrect bool
		UpdatedAt time.Time
	}

	var result []TaskProfile
	for _, db := range task {
		result = append(result, TaskProfile{
			ID:        db.ID,
			TaskID:    db.TaskID,
			IsCorrect: db.IsCorrect,
			UpdatedAt: db.UpdatedAt,
		})
	}

	c.JSON(http.StatusOK, result)

}

// SolutionResult представляет результат проверки
type SolutionResult struct {
	Success           bool                     `json:"success"`
	Message           string                   `json:"message"`
	UserResult        []map[string]interface{} `json:"user_result"`
	ExpectedResult    []map[string]interface{} `json:"expected_result"`
	ExecutionTime     time.Duration            `json:"execution_time"`
	IsSuspicious      bool                     `json:"is_suspicious"`       // Добавить это поле
	SuspiciousReasons []string                 `json:"suspicious_reasons"`  // Добавить это поле
	MetadataStats     map[string]interface{}   `json:"metadata_stats"`      // Добавить это поле
}

// CheckSolutionWithSchema обработчик с использованием схем
func CheckSolutionWithSchema(c *gin.Context) {
	startTime := time.Now()

	var request struct {
		SolutionSQL string                 `json:"solution_sql"`
		TaskID      int                    `json:"task_id"`
		Metadata    map[string]interface{} `json:"metadata"`
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
	var task models.Tasks_list
	if err := database.DB.Where("id = ?", request.TaskID).First(&task).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Задание не найдено"})
		return
	}

	var db_task models.Database_lists
	if err := database.DB.Where("id = ?", task.ID_database).First(&db_task).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "База данных для задания не найдена"})
		return
	}

	// Проверяем честность решения на основе метаданных
	isSuspicious := false
	var suspiciousReasons []string
	var metadataStats = make(map[string]interface{})
	
	if request.Metadata != nil {
		// Извлекаем метаданные
		if copyCount, ok := request.Metadata["copyCount"].(float64); ok && copyCount > 0 {
			isSuspicious = true
			suspiciousReasons = append(suspiciousReasons, fmt.Sprintf("Обнаружены попытки копирования: %.0f", copyCount))
		}
		
		if pasteCount, ok := request.Metadata["pasteCount"].(float64); ok && pasteCount > 0 {
			isSuspicious = true
			suspiciousReasons = append(suspiciousReasons, fmt.Sprintf("Обнаружены попытки вставки: %.0f", pasteCount))
		}
		
		if isWindowActive, ok := request.Metadata["isWindowActive"].(bool); ok && !isWindowActive {
			if timeSpent, ok := request.Metadata["timeSpent"].(float64); ok && timeSpent > 30 {
				isSuspicious = true
				suspiciousReasons = append(suspiciousReasons, 
					fmt.Sprintf("Окно было неактивно %.0f секунд", timeSpent))
			}
		}
		
		if tabSwitches, ok := request.Metadata["tabSwitches"].(float64); ok && tabSwitches > 5 {
			isSuspicious = true
			suspiciousReasons = append(suspiciousReasons, 
				fmt.Sprintf("Слишком много переключений вкладок: %.0f", tabSwitches))
		}
		
		// Сохраняем статистику для ответа
		metadataStats = map[string]interface{}{
			"copyCount":   request.Metadata["copyCount"],
			"pasteCount":  request.Metadata["pasteCount"],
			"timeSpent":   request.Metadata["timeSpent"],
			"tabSwitches": request.Metadata["tabSwitches"],
			"isWindowActive": request.Metadata["isWindowActive"],
		}
	}

	// Создаем уникальное имя схемы
	schemaName := generateSchemaName(userID, request.TaskID)

	// Выполняем проверку в изолированной схеме
	result, err := executeInSchema(schemaName, db_task.Database_create_text, db_task.Database_insert_text, request.SolutionSQL, task.Database_decision)
	if err != nil {
		// Логируем ошибку для отладки
		log.Printf("Ошибка выполнения решения: %v", err)
		log.Printf("Пользователь: %d, Задание: %d", userID, request.TaskID)
		
		// Сохраняем неудачную попытку в лог подозрительной активности
		if len(suspiciousReasons) > 0 {
			saveSuspiciousActivity(userID, request.TaskID, request.SolutionSQL, suspiciousReasons)
		}

		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Ошибка выполнения решения",
			"details": err.Error(),
			"is_suspicious": isSuspicious,
			"suspicious_reasons": suspiciousReasons,
		})
		return
	}

	result.ExecutionTime = time.Since(startTime)
	
	// Добавляем метаданные к результату
	result.IsSuspicious = isSuspicious
	result.SuspiciousReasons = suspiciousReasons
	result.MetadataStats = metadataStats
	
	// Формируем сообщение с учетом честности решения
	result.Message = getSolutionMessage(result.Success, isSuspicious)

	// Сохраняем результат ПЕРЕД отправкой ответа клиенту
	db := models.Solutions_list{
		UserID:      userID,
		TaskID:      request.TaskID,
		DecisionSQL: request.SolutionSQL,
		IsCorrect:   result.Success,
		// Сохраняем метаданные как JSON
		Metadata:    convertMetadataToJSON(request.Metadata),
		// Сохраняем IP адрес пользователя
		IPAddress:   c.ClientIP(),
		// Сохраняем User-Agent
		UserAgent:   c.Request.UserAgent(),
	}

	var existingTask models.Solutions_list
	erro := database.DB.Where("user_id = ? AND task_id = ?", userID, request.TaskID).First(&existingTask).Error

	if erro != nil {
		// Запись не существует - создаем новую
		if err := database.DB.Create(&db).Error; err != nil {
			log.Printf("Ошибка создания записи решения: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save solution"})
			return
		}
	} else {
		// Запись существует - проверяем условия обновления
		shouldUpdate := false

		if existingTask.IsCorrect {
			// Если уже есть успешное решение - обновляем только если новое тоже успешное
			if result.Success {
				shouldUpdate = true
			}
		} else {
			// Если предыдущее решение было неуспешным - обновляем всегда
			shouldUpdate = true
		}

		if shouldUpdate {
			if err := database.DB.Model(&existingTask).Updates(db).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update database"})
				return
			}
		}
	}

	// Сохраняем в лог активности, если решение подозрительное
	if isSuspicious {
		saveSuspiciousActivity(userID, request.TaskID, request.SolutionSQL, suspiciousReasons)
	}

	// Логируем проверку решения
	logSolutionCheck(userID, request.TaskID, result.Success, isSuspicious, result.ExecutionTime)

	c.JSON(http.StatusOK, result)
}

// getSolutionMessage формирует сообщение с учетом честности решения
func getSolutionMessage(isCorrect, isSuspicious bool) string {
	if !isCorrect {
		return "Решение содержит ошибки. Проверьте синтаксис SQL и логику запроса."
	}
	
	if isSuspicious {
		return "Решение верное, но обнаружена подозрительная активность. Решение отправлено на дополнительную проверку."
	}
	
	return "Решение верное! Отличная работа!"
}

// convertMetadataToJSON конвертирует метаданные в JSON для хранения в БД
func convertMetadataToJSON(metadata map[string]interface{}) string {
	if metadata == nil {
		return "{}"
	}
	
	jsonData, err := json.Marshal(metadata)
	if err != nil {
		log.Printf("Ошибка конвертации метаданных: %v", err)
		return "{}"
	}
	
	return string(jsonData)
}

// saveSuspiciousActivity сохраняет подозрительную активность в лог
func saveSuspiciousActivity(userID uint, taskID int, solutionSQL string, reasons []string) {
	suspiciousLog := models.SuspiciousActivity{
		UserID:      userID,
		TaskID:      taskID,
		SolutionSQL: solutionSQL,
		Reasons:     strings.Join(reasons, "; "),
		DetectedAt:  time.Now(),
	}
	
	if err := database.DB.Create(&suspiciousLog).Error; err != nil {
		log.Printf("Ошибка сохранения лога подозрительной активности: %v", err)
	}
}

// logSolutionCheck логирует проверку решения
func logSolutionCheck(userID uint, taskID int, isCorrect, isSuspicious bool, execTime time.Duration) {
	logMsg := fmt.Sprintf("Проверка решения: UserID=%d, TaskID=%d, Correct=%v, Suspicious=%v, Time=%v",
		userID, taskID, isCorrect, isSuspicious, execTime)
	log.Println(logMsg)
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
		";", "--", "/*", "*/",
		"DROP", "CREATE", "ALTER", "TRUNCATE",
		"DELETE", "INSERT", "UPDATE",
		"EXEC", "EXECUTE", "xp_", "sp_",
		"UNION", "SELECT.*FROM", "INFORMATION_SCHEMA",
		"pg_", "\\c", "\\dt", "\\dn",
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
