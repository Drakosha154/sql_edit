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
	IsAdmin   bool `gorm:"not null;default:false"`

	// Relations
	Databases []Database_lists `gorm:"foreignKey:ID_creator"`
	Tasks     []Tasks_list     `gorm:"foreignKey:ID_creator"`
	Solutions []Solutions_list `gorm:"foreignKey:UserID"`
}

type Database_lists struct {
	ID                   uint `gorm:"primaryKey"`
	ID_creator           uint `gorm:"not null"`
	Database_name        string
	Database_create_text string
	Database_insert_text string
	CreatedAt            time.Time

	// Связь с создателем
	Creator User `gorm:"foreignKey:ID_creator"`
}

type Tasks_list struct {
	ID                uint   `gorm:"primaryKey"`
	ID_creator        uint   `gorm:"not null"`
	Task_name         string `gorm:"not null"`
	Task_formulation  string
	Database_decision string
	CreatedAt         time.Time
	ID_database		  uint

	// Связи
	User User `gorm:"foreignKey:ID_creator"`
}

type Database_solution struct {
	ID_database Database_lists `gorm:"foreignKey:ID_database"`
	ID_task     Tasks_list     `gorm:"foreignKey:ID_task"`
}

type Solutions_list struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	UserID      uint      `json:"user_id"`
	TaskID      int       `json:"task_id"`
	DecisionSQL string    `json:"decision_sql"`
	IsCorrect   bool      `json:"is_correct"`
	Metadata    string    `json:"metadata" gorm:"type:text"` // JSON с метаданными
	IPAddress   string    `json:"ip_address"`
	UserAgent   string    `json:"user_agent"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// Связи
	User User           `gorm:"foreignKey:UserID"`
	Task Database_lists `gorm:"foreignKey:TaskID"`
}

type SuspiciousActivity struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	UserID      uint      `json:"user_id"`
	TaskID      int       `json:"task_id"`
	SolutionSQL string    `json:"solution_sql" gorm:"type:text"`
	Reasons     string    `json:"reasons"` // Причины подозрительности
	IPAddress   string    `json:"ip_address"`
	UserAgent   string    `json:"user_agent"`
	DetectedAt  time.Time `json:"detected_at"`
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
