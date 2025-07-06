package pkg

import (
	"errors"

	"golang.org/x/crypto/bcrypt"
)

func HashPassword(password string) (string, error) {
	if password == "" {
		return "", errors.New("пароль не может быть пустым")
	}

	// Генерируем хеш с.cost = 12 (рекомендуемое значение)
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}

	return string(hashedPassword), nil
}

// CheckPasswordHash проверяет, соответствует ли введенный пароль его хешу
func CheckPasswordHash(password, hash string) error {
	if password == "" || hash == "" {
		return errors.New("пароль или хеш не могут быть пустыми")
	}

	// Сравниваем введенный пароль с хешем
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
}
