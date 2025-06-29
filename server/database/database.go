package database

import (
	"database/sql"
	"fmt"

	_ "github.com/lib/pq"
)

func connect_db() (*sql.DB, error) {
	connStr := "user=postgres password=123 dbname=SQL_learning sslmode=disable"
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, err
	}

	if err = db.Ping(); err != nil {
		return nil, err
	}

	fmt.Println("Успешное подключение к базе данных!")

	return db, nil
}
