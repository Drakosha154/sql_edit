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
    var solutionsList []models.Solutions_list
    if err := database.DB.
        Where("task_id = ?", id).
        Order("updated_at DESC").
        Find(&solutionsList).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get solutions"})
        return
    }

    // Получаем ВСЕ подозрительные активности для этой задачи
    var suspiciousActivities []models.SuspiciousActivity
    if err := database.DB.
        Where("task_id = ?", id).
        Order("detected_at DESC").
        Find(&suspiciousActivities).Error; err != nil {
        // Если не получилось, продолжаем без информации о списывании
    }

    // Создаем map для группировки активностей по user_id
    suspiciousMap := make(map[uint][]models.SuspiciousActivity)
    for _, activity := range suspiciousActivities {
        suspiciousMap[activity.UserID] = append(suspiciousMap[activity.UserID], activity)
    }

    // Структура для ответа
    type SuspiciousLogInfo struct {
        Reasons    string    `json:"reasons"`
        DetectedAt time.Time `json:"detected_at"`
        SolutionSQL string   `json:"solution_sql"`
    }

    type SolutionResponse struct {
        ID              uint                  `json:"id"`
        UserID          uint                  `json:"user_id"`
        Username        string                `json:"username"`
        DecisionSQL     string                `json:"decision_sql"`
        IsCorrect       bool                  `json:"is_correct"`
        CreatedAt       time.Time             `json:"created_at"`
        HasSuspicious   bool                  `json:"has_suspicious"`
        SuspiciousLogs  []SuspiciousLogInfo   `json:"suspicious_logs,omitempty"`
    }

    var solutions []SolutionResponse

    // Обрабатываем каждое решение
    for _, solution := range solutionsList {
        var user models.User
        if err := database.DB.Select("username").First(&user, solution.UserID).Error; err != nil {
            user.Username = "Unknown"
        }

        response := SolutionResponse{
            ID:            solution.ID,
            UserID:        solution.UserID,
            Username:      user.Username,
            DecisionSQL:   solution.DecisionSQL,
            IsCorrect:     solution.IsCorrect,
            CreatedAt:     solution.UpdatedAt,
            HasSuspicious: false,
            SuspiciousLogs: []SuspiciousLogInfo{},
        }

        // Если у пользователя есть записи в suspicious_activities для этой задачи
        if activities, exists := suspiciousMap[solution.UserID]; exists && len(activities) > 0 {
            response.HasSuspicious = true
            
            // Добавляем все логи списывания для этого пользователя
            for _, activity := range activities {
                logInfo := SuspiciousLogInfo{
                    Reasons:    activity.Reasons,
                    DetectedAt: activity.DetectedAt,
                    SolutionSQL: activity.SolutionSQL,
                }
                response.SuspiciousLogs = append(response.SuspiciousLogs, logInfo)
            }
        }

        solutions = append(solutions, response)
    }

    // Статистика
    total := len(solutions)
    correct := 0
    suspicious := 0
    totalSuspiciousLogs := 0
    for _, s := range solutions {
        if s.IsCorrect {
            correct++
        }
        if s.HasSuspicious {
            suspicious++
            totalSuspiciousLogs += len(s.SuspiciousLogs)
        }
    }

    c.JSON(http.StatusOK, gin.H{
        "task": gin.H{
            "id":   task.ID,
            "name": task.Task_name,
        },
        "solutions": solutions,
        "stats": gin.H{
            "total":               total,
            "correct":             correct,
            "suspicious_users":    suspicious,
            "total_suspicious_logs": totalSuspiciousLogs,
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

func GetUserStats(c *gin.Context) {

	var UserStats []models.UserStats

	query := `
    SELECT 
    u.id,
    u.username,
    u.email,
    COALESCE(s.solved_count, 0) as solved_tasks,
    COALESCE(t.created_count, 0) as created_tasks,
    (COALESCE(s.solved_count, 0) * 5 + 
     COALESCE(t.created_count, 0) * 10) as rating,
    ROW_NUMBER() OVER (
        ORDER BY 
            (COALESCE(s.solved_count, 0) * 5 + 
             COALESCE(t.created_count, 0) * 10) DESC,
            u.username ASC
    ) as rank_position
FROM users u
LEFT JOIN (
    SELECT user_id, COUNT(DISTINCT task_id) as solved_count
    FROM solutions_lists
    WHERE is_correct = true
    GROUP BY user_id
) s ON s.user_id = u.id
LEFT JOIN (
    SELECT id_creator as user_id, COUNT(*) as created_count
    FROM tasks_lists 
    GROUP BY id_creator
) t ON t.user_id = u.id
-- Фильтруем: должен быть хотя бы один результат в s или t
WHERE (s.solved_count IS NOT NULL OR t.created_count IS NOT NULL)
ORDER BY 
    rating DESC,
    solved_tasks DESC,
    created_tasks DESC,
    u.username ASC
LIMIT 5;
`
	err := database.DB.Raw(query).Scan(&UserStats).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user stats"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user_stats": UserStats})

}
