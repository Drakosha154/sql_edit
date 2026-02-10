package models

import (
	"time"

	"sql_edit/database"

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
	ID_database       uint
	SqlQuery		  string

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

type UserStats struct {
	UserID       uint   `json:"user_id"`
	Username     string `json:"username"`
	SolvedTasks  int    `json:"solved_tasks"`
	CreatedTasks int    `json:"created_tasks"`
	Rating       int    `json:"rating"`
	Rank         int    `json:"rank"`
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

// GetTopUsers - получает топ пользователей по рейтингу
func GetTopUsers(limit int) ([]UserStats, error) {
	var stats []UserStats

	// Используем RAW SQL запрос для получения статистики пользователей
	query := `
		SELECT 
			u.id as user_id,
			u.username,
			u.email,
			COALESCE(solved_count, 0) as solved_tasks,
			COALESCE(created_count, 0) as created_tasks,
			(COALESCE(solved_count, 0) * 10 + COALESCE(created_count, 0) * 5) as rating
		FROM users u
		LEFT JOIN (
			SELECT 
				user_id,
				COUNT(DISTINCT task_id) as solved_count
			FROM solutions_list 
			WHERE is_correct = true
			GROUP BY user_id
		) s ON s.user_id = u.id
		LEFT JOIN (
			SELECT 
				id_creator as user_id,
				COUNT(*) as created_count
			FROM tasks_list 
			GROUP BY id_creator
		) t ON t.user_id = u.id
		ORDER BY rating DESC, solved_tasks DESC, created_tasks DESC
		LIMIT ?
	`

	// Выполняем запрос через GORM
	err := database.DB.Raw(query, limit).Scan(&stats).Error
	if err != nil {
		return nil, err
	}

	// Добавляем ранги
	for i := range stats {
		stats[i].Rank = i + 1
	}

	return stats, nil
}

// UpdateUserStats - обновляет статистику пользователя (можно вызвать после решения задачи)
func UpdateUserStats(userID uint) error {
	// Здесь можно добавить кэширование или другие оптимизации
	// Пока просто возвращаем nil, так как статистика рассчитывается динамически
	return nil
}

// GetUserStats - получает статистику конкретного пользователя
func GetUserStats(userID uint) (UserStats, error) {
	var stats UserStats

	query := `
		SELECT 
			u.id as user_id,
			u.username,
			u.email,
			COALESCE(solved_count, 0) as solved_tasks,
			COALESCE(created_count, 0) as created_tasks,
			(COALESCE(solved_count, 0) * 10 + COALESCE(created_count, 0) * 5) as rating
		FROM users u
		LEFT JOIN (
			SELECT 
				user_id,
				COUNT(DISTINCT task_id) as solved_count
			FROM solutions_list 
			WHERE user_id = ? AND is_correct = true
			GROUP BY user_id
		) s ON s.user_id = u.id
		LEFT JOIN (
			SELECT 
				id_creator as user_id,
				COUNT(*) as created_count
			FROM tasks_list 
			WHERE id_creator = ?
			GROUP BY id_creator
		) t ON t.user_id = u.id
		WHERE u.id = ?
	`

	err := database.DB.Raw(query, userID, userID, userID).Scan(&stats).Error
	if err != nil {
		return UserStats{}, err
	}

	return stats, nil
}

// RecalculateAllStats - пересчитывает статистику для всех пользователей
func RecalculateAllStats() error {
	// В данном случае ничего не делаем, так как статистика рассчитывается динамически
	// В будущем можно добавить кэширование в отдельную таблицу
	return nil
}
