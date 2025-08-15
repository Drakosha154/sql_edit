package routes

import (
	"fmt"
	"net/http"
	"sql_edit/database"
	"sql_edit/models"

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
