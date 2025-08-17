package routes

import (
	"net/http"
	"sql_edit/database"
	"sql_edit/models"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
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
