package main

import (
	"fmt"
	"log"
	"sql_edit/database"
	"sql_edit/handlers"
	"sql_edit/repositories"

	"github.com/gin-gonic/gin"

	_ "github.com/lib/pq"
)

func main() {

	db, err := database.ConnectDB()
	if err != nil {
		log.Fatal("Ошибка подключения к базе данных:", err)
	}
	defer db.Close()

	// Инициализация репозитория
	userRepo := &repositories.UserRepository{DB: db}

	// Инициализация обработчика
	userHandler := &handlers.UserHandler{Repo: userRepo}

	// Создаем новый экземпляр роутера
	r := gin.Default()

	r.Use(LoggerMiddleware())

	api := r.Group("/api")
	{
		api.GET("/api/users", userHandler.GetUsers)
		//api.POST("/users", createUser)
		//api.GET("/users/:id", getUserByID)
	}

	// Запускаем сервер на порту 8080
	r.Run(":8080")
}

func LoggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		fmt.Println("Новый запрос:", c.Request.Method, c.Request.URL.Path)
		c.Next() // Передаем управление следующему обработчику
	}
}
