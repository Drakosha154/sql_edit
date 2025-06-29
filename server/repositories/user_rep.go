package repositories

import (
	"database/sql"
	"sql_edit/models"
)

type UserRepository struct {
	DB *sql.DB
}

func (r *UserRepository) GetAllUsers() ([]models.User, error) {
	query := `SELECT id, login, role FROM Users`
	rows, err := r.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.Login, &u.Role); err != nil {
			return nil, err
		}
		users = append(users, u)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return users, nil
}
