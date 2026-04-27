// Конфигурация всех туториалов для разных страниц

export const mainPageSteps = [
  {
    target: 'body',
    content: 'Добро пожаловать в SQL Editor! Давайте познакомимся с платформой.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="search-users"]',
    content: 'Здесь вы можете найти других пользователей и посмотреть их профили.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="active-users"]',
    content: 'Топ самых активных пользователей по количеству решенных задач.',
    placement: 'left',
  },
  {
    target: '[data-tour="navbar-profile"]',
    content: 'Перейдите в свой профиль, чтобы создавать базы данных и задачи.',
    placement: 'bottom',
  },
];

export const profilePageSteps = [
  {
    target: 'body',
    content: 'Это ваш профиль. Здесь вы управляете базами данных и задачами.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="profile-stats"]',
    content: 'Ваша статистика: количество баз данных, решений и верных ответов.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="databases-tab"]',
    content: 'Здесь вы создаете базы данных для своих SQL задач.',
    placement: 'bottom',
    tabKey: 'databases',
  },
  {
    target: '[data-tour="create-database-btn"]',
    content: 'Нажмите сюда, чтобы создать новую базу данных.',
    placement: 'right',
    tabKey: 'databases',
  },
  {
    target: '[data-tour="tasks-tab"]',
    content: 'Во вкладке "Мои задания" вы создаете SQL задачи для других пользователей.',
    placement: 'bottom',
    tabKey: 'tasks',
  },
  {
    target: '[data-tour="solutions-tab"]',
    content: 'Здесь отображаются все ваши решения задач других пользователей.',
    placement: 'bottom',
    tabKey: 'solutions',
  },
];

export const createDatabaseSteps = [
  {
    target: 'body',
    content: 'Визуальный редактор для создания диаграмм баз данных.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="sidebar"]',
    content: 'Боковая панель для управления таблицами, связями и данными.',
    placement: 'left',
  },
  {
    target: '[data-tour="tables-tab"]',
    content: 'Добавляйте таблицы и их атрибуты здесь.',
    placement: 'left',
    tabKey: 'tables',
    tabContext: 'sidebar',
  },
  {
    target: '[data-tour="relations-tab"]',
    content: 'Создавайте связи между таблицами (Foreign Keys).',
    placement: 'left',
    tabKey: 'relations',
    tabContext: 'sidebar',
  },
  {
    target: '[data-tour="data-tab"]',
    content: 'Заполняйте таблицы тестовыми данными.',
    placement: 'left',
    tabKey: 'manage',
    tabContext: 'main',
  },
  {
    target: '[data-tour="sql-tab"]',
    content: 'Просматривайте сгенерированный SQL код.',
    placement: 'top',
    tabKey: 'ERD',
    tabContext: 'main',
  },
  {
    target: '[data-tour="save-button"]',
    content: 'Не забудьте сохранить базу данных!',
    placement: 'bottom',
  },
];

export const resolveTaskSteps = [
  {
    target: 'body',
    content: 'Страница решения SQL задачи. Внимательно читайте условие!',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="task-description"]',
    content: 'Внимательно прочитайте описание задачи.',
    placement: 'top',
  },
  {
    target: '[data-tour="database-preview"]',
    content: 'Визуализация структуры базы данных для задачи.',
    placement: 'top',
  },
  {
    target: '[data-tour="sql-editor"]',
    content: 'Напишите SQL запрос для решения задачи здесь.',
    placement: 'top',
  },
  {
    target: '[data-tour="check-button"]',
    content: 'Проверьте свое решение перед отправкой.',
    placement: 'top',
  }
];

export const createTaskSteps = [
  {
    target: 'body',
    content: 'Здесь вы создаете SQL задачи для других пользователей.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="database-selector"]',
    content: 'Выберите базу данных, на основе которой будет создана задача.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="solution-tab"]',
    content: 'Напишите SQL запрос - правильное решение задачи.',
    placement: 'top',
    tabKey: 'solution',
  },
  {
    target: '[data-tour="task-tab"]',
    content: 'Опишите условие задачи для пользователей.',
    placement: 'top',
    tabKey: 'task',
  },
  {
    target: '[data-tour="save-task-button"]',
    content: 'Сохраните задачу, чтобы другие могли её решать.',
    placement: 'bottom',
  },
];