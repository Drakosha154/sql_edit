package routes

import (
	"net/http"
	"sql_edit/database"
	"sql_edit/models"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// AdminMiddleware проверяет права администратора
func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.MustGet("userID").(uint)
		
		var user models.User
		if err := database.DB.Select("is_admin").First(&user, userID).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			c.Abort()
			return
		}

		if !user.IsAdmin {
			c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// GetAdminStats возвращает статистику для админ-панели
func GetAdminStats(c *gin.Context) {
	var stats struct {
		TotalUsers      int64 `json:"total_users"`
		TotalTasks      int64 `json:"total_tasks"`
		TotalSolutions  int64 `json:"total_solutions"`
		ActiveUsers     int64 `json:"active_users"`
		CorrectSolutions int64 `json:"correct_solutions"`
	}

	// Общее количество пользователей
	database.DB.Model(&models.User{}).Count(&stats.TotalUsers)
	
	// Общее количество заданий
	database.DB.Model(&models.Database_lists{}).Count(&stats.TotalTasks)
	
	// Общее количество решений
	database.DB.Model(&models.Solutions_list{}).Count(&stats.TotalSolutions)
	
	// Количество пользователей с решениями (активных)
	database.DB.Model(&models.Solutions_list{}).Distinct("user_id").Count(&stats.ActiveUsers)
	
	// Количество верных решений
	database.DB.Model(&models.Solutions_list{}).Where("is_correct = true").Count(&stats.CorrectSolutions)

	c.JSON(http.StatusOK, gin.H{"stats": stats})
}

// GetAllUsers возвращает список всех пользователей
func GetAllUsers(c *gin.Context) {
	var users []models.User
	result := database.DB.
		Select("id", "username", "email", "is_admin", "created_at").
		Order("created_at DESC").
		Find(&users)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get users"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"users": users})
}

// UpdateUser обновляет данные пользователя
func UpdateUser(c *gin.Context) {
	userID := c.Param("id")
	
	id, err := strconv.Atoi(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var updateData struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		IsAdmin  *bool  `json:"is_admin"`
	}

	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	var user models.User
	if err := database.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	updates := make(map[string]interface{})
	if updateData.Username != "" {
		updates["username"] = updateData.Username
	}
	if updateData.Email != "" {
		updates["email"] = updateData.Email
	}
	if updateData.IsAdmin != nil {
		updates["is_admin"] = *updateData.IsAdmin
	}

	if err := database.DB.Model(&user).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User updated successfully"})
}

// DeleteUser удаляет пользователя
func DeleteUser(c *gin.Context) {
	userID := c.Param("id")
	
	id, err := strconv.Atoi(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Нельзя удалить самого себя
	currentUserID := c.MustGet("userID").(uint)
	if uint(id) == currentUserID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete yourself"})
		return
	}

	result := database.DB.Delete(&models.User{}, id)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

// GetAllTasks возвращает все задания
func GetAllTasks(c *gin.Context) {
	var tasks []models.Database_lists
	result := database.DB.
		Preload("Creator", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "username")
		}).
		Order("created_at DESC").
		Find(&tasks)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get tasks"})
		return
	}

	type TaskResponse struct {
		ID           uint   `json:"id"`
		Name         string `json:"name"`
		TaskText     string `json:"task_text"`
		CreatorID    uint   `json:"creator_id"`
		CreatorName  string `json:"creator_name"`
		CreatedAt    string `json:"created_at"`
		SolutionsCount int64 `json:"solutions_count"`
	}

	response := make([]TaskResponse, len(tasks))
	for i, task := range tasks {
		var solutionsCount int64
		database.DB.Model(&models.Solutions_list{}).Where("task_id = ?", task.ID).Count(&solutionsCount)

		response[i] = TaskResponse{
			ID:           task.ID,
			Name:         task.Database_name,
			CreatorID:    task.ID_creator,
			CreatorName:  task.Creator.Username,
			CreatedAt:    task.CreatedAt.Format("2006-01-02 15:04"),
			SolutionsCount: solutionsCount,
		}
	}

	c.JSON(http.StatusOK, gin.H{"tasks": response})
}

// DeleteTask удаляет задание
func DeleteTask(c *gin.Context) {
	taskID := c.Param("id")
	
	id, err := strconv.Atoi(taskID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	result := database.DB.Delete(&models.Database_lists{}, id)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete task"})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	// Также удаляем все решения этого задания
	database.DB.Where("task_id = ?", id).Delete(&models.Solutions_list{})

	c.JSON(http.StatusOK, gin.H{"message": "Task deleted successfully"})
}