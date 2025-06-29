package models

import (
	"time"
)

type User struct {
	ID            int       `json:"id"`
	login         string    `json:"login"`
	hash_password string    `json:"password"`
	CreatedAt     time.Time `json:"created_at"`
	role          string    `json:"role"`
}
