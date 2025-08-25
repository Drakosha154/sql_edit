package main

import (
	"fmt"
	"log"
	"sql_edit/database"
	"sql_edit/middleware"
	"sql_edit/routes"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {

	dbConfig := database.Config{
		Host:     "localhost",
		Port:     5432,
		User:     "postgres",
		Password: "123",
		DBName:   "sql_learn",
	}

	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}

	// Инициализация БД
	// Инициализация подключения
	if err := database.InitDB(dbConfig); err != nil {
		log.Fatalf("Ошибка подключения к БД: %v", err)
	}
	defer database.CloseDB()

	// Настройка роутера
	r := gin.Default()

	// Настройка CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	r.Use(func(c *gin.Context) {
		fmt.Printf("Received %s request for: %s\n", c.Request.Method, c.Request.URL.Path)
		c.Next()
	})

	// Публичные маршруты (без аутентификации)
	r.POST("/api/register", routes.Register)
	r.POST("/api/login", routes.Login)
	r.GET("/api/users/search", routes.SearchUsers)
	r.GET("/api/users/:id", routes.GetUserProfileMain)

	// Приватные маршруты (требуют JWT)
	authGroup := r.Group("/api")
	authGroup.Use(middleware.AuthMiddleware())
	{
		//создание задания
		authGroup.POST("/databases", routes.SaveDatabase)
		authGroup.GET("/getdatabases", routes.GetUserDatabases)
		authGroup.GET("/databases/:id", routes.GetDatabasesByID)
		authGroup.DELETE("/databases/:id", routes.DelDatabasesByID)
		authGroup.PATCH("/databases/:id", routes.UpdDatabasesByID)

		//решение задания
		authGroup.POST("/check-solution", routes.CheckSolutionWithSchema)
		authGroup.GET("/get-solution", routes.GetSolutionTaskProfile)
		authGroup.GET("/get-solution/:id", routes.GetSolutionTask)

		// Профиль пользователя
		authGroup.GET("/profile/me", routes.GetMyProfile)
		authGroup.GET("/users/:id/databases", routes.GetUserDatabasesProfile)
		authGroup.GET("/users/:id/solutions", routes.GetUserSolutions)
		authGroup.GET("/tasks/:id/solutions", routes.GetTaskSolutions)
	}

	// Выведите все зарегистрированные маршруты
	fmt.Println("Registered routes:")
	for _, route := range r.Routes() {
		fmt.Printf("%-6s %s\n", route.Method, route.Path)
	}

	// Запуск сервера
	r.Run(":8080")
}
