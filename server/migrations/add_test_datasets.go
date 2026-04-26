package migrations

import (
	"gorm.io/gorm"
	"log"
)

// AddTestDataSetsFields добавляет поля для множественных тестов
func AddTestDataSetsFields(db *gorm.DB) error {
	log.Println("🔄 Начало миграции: добавление полей для множественных тестов...")
	
	// Добавляем поле TestDataSets в database_lists
	if err := db.Exec(`
		ALTER TABLE database_lists 
		ADD COLUMN IF NOT EXISTS test_data_sets JSONB DEFAULT '[]'::jsonb
	`).Error; err != nil {
		log.Printf("⚠️ Ошибка добавления test_data_sets: %v", err)
		return err
	}
	log.Println("✅ Поле test_data_sets добавлено в database_lists")
	
	// Добавляем поле ExpectedResults в tasks_lists
	if err := db.Exec(`
		ALTER TABLE tasks_lists 
		ADD COLUMN IF NOT EXISTS expected_results JSONB DEFAULT '[]'::jsonb
	`).Error; err != nil {
		log.Printf("⚠️ Ошибка добавления expected_results: %v", err)
		return err
	}
	log.Println("✅ Поле expected_results добавлено в tasks_lists")
	
	log.Println("✅ Миграция успешно завершена!")
	return nil
}