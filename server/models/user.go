package models

import (
	"time"

	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID        uint   `gorm:"primaryKey"`
	Username  string `gorm:"unique;not null"`
	Email     string `gorm:"unique;not null"`
	Password  string `gorm:"not null"`
	CreatedAt time.Time
	Role      string `gorm:"not null;default:'user'"`

	// Relations
    Databases []Database_lists `gorm:"foreignKey:ID_creator"`
    Solutions []Task_list      `gorm:"foreignKey:UserID"`
}

type Database_lists struct {
	ID                   uint `gorm:"primaryKey"`
	ID_creator           uint `gorm:"not null"`
	Database_name        string
	Database_create_text string
	Database_insert_text string
	Database_decision    string
	Database_task        string
	CreatedAt            time.Time
}

type Task_list struct {
	ID          uint      `gorm:"primaryKey"`
	UserID      uint      `gorm:"not null"`
	TaskID      int       `gorm:"not null"`
	DecisionSQL string    
	IsCorrect   bool
    UpdatedAt   time.Time
}

func (u *User) HashPassword(password string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Password = string(hashedPassword)
	return nil
}

// Проверка пароля
func (u *User) CheckPassword(password string) error {
	return bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
}
