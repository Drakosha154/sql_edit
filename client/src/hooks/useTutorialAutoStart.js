import { useEffect } from 'react';
import { useTutorial } from '../components/TutorialContext';

/**
 * Хук для автоматического запуска туториала при первом посещении страницы
 * @param {string} pageKey - уникальный ключ страницы (например, 'main', 'profile')
 * @param {Array} steps - массив шагов туториала
 */
export const useTutorialAutoStart = (pageKey, steps) => {
  const { startTutorial } = useTutorial();

  useEffect(() => {
    // Проверяем, показывался ли уже туториал для этой страницы
    const tutorialKey = `tutorial_completed_${pageKey}`;
    const hasSeenTutorial = localStorage.getItem(tutorialKey);

    if (!hasSeenTutorial && steps && steps.length > 0) {
        // Увеличенная задержка для загрузки DOM элементов и данных
        const timer = setTimeout(() => {
            startTutorial(steps);
            // Сохраняем флаг, что туториал был показан
            localStorage.setItem(tutorialKey, 'true');
        }, 1500);

        return () => clearTimeout(timer);
        }
  }, [pageKey, steps, startTutorial]);
};

/**
 * Функция для ручного запуска туториала (через кнопку помощи)
 * @param {Array} steps - массив шагов туториала
 * @param {Function} startTutorial - функция из TutorialContext
 */
export const startTutorialManually = (steps, tutorialContext) => {
  if (steps && steps.length > 0) {
    // Используем restartTutorial вместо startTutorial для повторного запуска
    if (tutorialContext.restartTutorial) {
      tutorialContext.restartTutorial(steps);
    } else {
      // Fallback на обычный startTutorial
      tutorialContext.startTutorial(steps);
    }
  }
};

/**
 * Функция для сброса всех туториалов (для тестирования)
 */
export const resetAllTutorials = () => {
  const keys = ['main', 'profile', 'createDatabase', 'resolve'];
  keys.forEach(key => {
    localStorage.removeItem(`tutorial_completed_${key}`);
  });
  console.log('Все туториалы сброшены');
};