package main

import (
	"database/sql"
	"fmt"
    "time"
    "models/models.go"



	"github.com/gin-gonic/gin"

	_ "github.com/lib/pq"
)

func main() {
	// Создаем новый экземпляр роутера
	r := gin.Default()

	r.Use(LoggerMiddleware())

	api := r.Group("/api")
	{
		api.GET("/users", getUsers)
		api.POST("/users", createUser)
		api.GET("/users/:id", getUserByID)
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

func getUsers(c *gin.Context) {
    rows, err := db.Query("select * from Products")
    if err != nil {
        panic(err)
    }
    defer rows.Close()
    products := []product{}
}

func createUser(c *gin.Context) {

}

func getUserByID(c *gin.Context) {

}
