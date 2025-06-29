package handlers

import (
	"fmt"
	"net/http"
	"sql_edit/repositories"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	Repo *repositories.UserRepository
}

func (h *UserHandler) GetUsers(c *gin.Context) {
	users, err := h.Repo.GetAllUsers()
	fmt.Print(err)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, users)
}
