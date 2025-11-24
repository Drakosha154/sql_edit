package routes

import (
	"net/http"
	"sql_edit/database"
	"sql_edit/models"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func GetTaskSolutions(c *gin.Context) {
	taskID := c.Param("id")

	id, err := strconv.Atoi(taskID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	// Проверяем существование задачи
	var task models.Tasks_list
	if err := database.DB.First(&task, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	// Получаем все решения для этой задачи
	var solutions []models.Solutions_list
	result := database.DB.
		Where("task_id = ?", id).
		Order("updated_at DESC").
		Find(&solutions)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get task solutions"})
		return
	}

	// Добавляем информацию о пользователях
	type SolutionWithUser struct {
		ID          uint      `json:"id"`
		UserID      uint      `json:"user_id"`
		Username    string    `json:"username"`
		DecisionSQL string    `json:"decision_sql"`
		IsCorrect   bool      `json:"is_correct"`
		CreatedAt   time.Time `json:"created_at"`
	}

	response := make([]SolutionWithUser, len(solutions))
	for i, solution := range solutions {
		var user models.User
		database.DB.Select("username").First(&user, solution.UserID)

		response[i] = SolutionWithUser{
			ID:          solution.ID,
			UserID:      solution.UserID,
			Username:    user.Username,
			DecisionSQL: solution.DecisionSQL,
			IsCorrect:   solution.IsCorrect,
			CreatedAt:   solution.UpdatedAt,
		}
	}

    c.JSON(http.StatusOK, gin.H{
        "task": gin.H{
            "id":   task.ID,
            "name": task.Task_name,
        },
        "solutions": response,
        "count": gin.H{
            "total":   len(solutions),
            "correct": countCorrectSolutions(solutions),
        },
    })

}

// Вспомогательная функция для подсчета верных решений
func countCorrectSolutions(solutions []models.Solutions_list) int {
	count := 0
	for _, solution := range solutions {
		if solution.IsCorrect {
			count++
		}
	}
	return count
}

func GetMyProfile(c *gin.Context) {
	userID := c.MustGet("userID").(uint)

	var user models.User
	result := database.DB.
		Select("id", "username", "email", "created_at").
		First(&user, userID)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user profile"})
		return
	}

	// Получаем статистику пользователя
	var stats struct {
		DatabaseCount int64 `json:"database_count"`
		SolvedCount   int64 `json:"solved_count"`
		CorrectCount  int64 `json:"correct_count"`
	}

	database.DB.Model(&models.Database_lists{}).
		Where("id_creator = ?", user.ID).
		Count(&stats.DatabaseCount)

	database.DB.Model(&models.Solutions_list{}).
		Where("user_id = ?", user.ID).
		Count(&stats.SolvedCount)

	database.DB.Model(&models.Solutions_list{}).
		Where("user_id = ? AND is_correct = true", user.ID).
		Count(&stats.CorrectCount)

	c.JSON(http.StatusOK, gin.H{
		"user": gin.H{
			"id":         user.ID,
			"username":   user.Username,
			"email":      user.Email,
			"created_at": user.CreatedAt,
		},
		"stats":    stats,
		"is_owner": true, // Всегда true для своего профиля
	})
}

// SearchUsers поиск пользователей по нику
func SearchUsers(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Query parameter 'q' is required"})
		return
	}

	var users []models.User
	result := database.DB.
		Select("id", "username", "created_at").
		Where("username ILIKE ?", "%"+query+"%").
		Limit(20).
		Find(&users)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search users"})
		return
	}

	// Форматируем ответ
	type UserResponse struct {
		ID        uint      `json:"id"`
		Username  string    `json:"username"`
		CreatedAt time.Time `json:"created_at"`
	}

	response := make([]UserResponse, len(users))
	for i, user := range users {
		response[i] = UserResponse{
			ID:        user.ID,
			Username:  user.Username,
			CreatedAt: user.CreatedAt,
		}
	}

	c.JSON(http.StatusOK, gin.H{"users": response})
}

// GetUserProfile получение профиля пользователя
func GetUserProfileMain(c *gin.Context) {
	userID := c.Param("id")

	id, err := strconv.Atoi(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var user models.User
	result := database.DB.
		Select("id", "username", "created_at").
		First(&user, id)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user profile"})
		}
		return
	}

	// Получаем статистику пользователя
	var stats struct {
		DatabaseCount int64 `json:"database_count"`
		SolvedCount   int64 `json:"solved_count"`
		CorrectCount  int64 `json:"correct_count"`
	}

	database.DB.Model(&models.Database_lists{}).
		Where("id_creator = ?", user.ID).
		Count(&stats.DatabaseCount)

	database.DB.Model(&models.Solutions_list{}).
		Where("user_id = ?", user.ID).
		Count(&stats.SolvedCount)

	database.DB.Model(&models.Solutions_list{}).
		Where("user_id = ? AND is_correct = true", user.ID).
		Count(&stats.CorrectCount)

	c.JSON(http.StatusOK, gin.H{
		"user": gin.H{
			"id":         user.ID,
			"username":   user.Username,
			"created_at": user.CreatedAt,
		},
		"stats": stats,
	})
}

// GetUserDatabases получение баз данных пользователя
func GetUserDatabasesProfile(c *gin.Context) {
	userID := c.Param("id")

	id, err := strconv.Atoi(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var databases []models.Database_lists
	result := database.DB.
		Select("id", "database_name", "created_at").
		Where("id_creator = ?", id).
		Find(&databases)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user databases"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"databases": databases})
}

func GetUserTasks(c *gin.Context) {

	userID := c.Param("id")

	id, err := strconv.Atoi(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var tasks []models.Tasks_list
	result := database.DB.
		Select("id", "task_name", "created_at").
		Where("id_creator = ?", id).
		Find(&tasks)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user tasks"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"tasks": tasks})
}

// GetUserSolutions получение решений пользователя
func GetUserSolutions(c *gin.Context) {
	userID := c.Param("id")

	id, err := strconv.Atoi(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var solutions []models.Solutions_list
	result := database.DB.
		Where("user_id = ?", id).
		Order("updated_at DESC").
		Find(&solutions)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user solutions"})
		return
	}

	// Добавляем информацию о задании
	type SolutionWithTask struct {
		ID          uint      `json:"id"`
		TaskID      int       `json:"task_id"`
		DecisionSQL string    `json:"decision_sql"`
		IsCorrect   bool      `json:"is_correct"`
		CreatedAt   time.Time `json:"created_at"`
		TaskName    string    `json:"task_name"`
	}

	response := make([]SolutionWithTask, len(solutions))
	for i, solution := range solutions {
		var task models.Tasks_list
		database.DB.Select("task_name").First(&task, solution.TaskID)

		response[i] = SolutionWithTask{
			ID:          solution.ID,
			TaskID:      solution.TaskID,
			DecisionSQL: solution.DecisionSQL,
			IsCorrect:   solution.IsCorrect,
			CreatedAt:   solution.UpdatedAt,
			TaskName:    task.Task_name,
		}
	}

	c.JSON(http.StatusOK, gin.H{"solutions": response})
}
