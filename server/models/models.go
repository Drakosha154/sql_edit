package models

import (
	"time"
)

type User struct {
	ID            int       `json:"id"`
	Login         string    `json:"login"`
	Hash_password string    `json:"password"`
	CreatedAt     time.Time `json:"created_at"`
	Role          string    `json:"role"`
}
