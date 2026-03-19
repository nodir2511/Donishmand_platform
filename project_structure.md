# 📁 Структура проекта Donishmand Platform

> **Дата создания:** 19.03.2026  
> **Стек:** React (Vite) + Tailwind CSS + Supabase  
> **Тема:** Dark Gaming UI (образовательная платформа)

---

## 🏗️ Корневая директория

```
Project/
├── .agent/                    # Конфиг агента (workflows)
├── .env                       # Переменные окружения (Supabase URL, ключи)
├── .cursorrules               # Правила AI-помощника
├── .gitignore                 # Git ignore
├── CHANGELOG.md               # Журнал изменений (v0.1.0+)
├── future_ideas.md            # Идеи для будущего развития
├── index.html                 # Точка входа HTML (SEO мета-теги)
├── package.json               # Зависимости, скрипты npm
├── postcss.config.js          # Конфиг PostCSS (autoprefixer)
├── tailwind.config.js         # Конфиг Tailwind (кастомная тема gaming-*)
├── vite.config.js             # Конфиг Vite (алиасы, плагины)
├── start_project.bat          # Скрипт быстрого запуска (Windows)
│
├── backups/                   # Резервные копии данных
├── dist/                      # Production сборка
├── public/                    # Статические файлы
│   ├── 404.html               # Страница 404 (SPA редирект для Vercel/Netlify)
│   ├── vite.svg               # Иконка
│   └── locales/               # Файлы переводов (i18next)
│       ├── ru/translation.json  # Русский язык
│       └── tj/translation.json  # Таджикский язык
│
├── scripts/
│   └── backup_syllabus.js     # Скрипт резервного копирования учебной программы
│
└── src/                       # Исходный код приложения
```

---

## 📂 `src/` — Исходный код

```
src/
├── main.jsx                   # Точка входа React (ReactDOM.createRoot)
├── App.jsx                    # Главный компонент (роутинг, lazy loading)
├── index.css                  # Глобальные стили CSS
├── i18n.js                    # Инициализация i18next (локализация RU/TJ)
├── console-overrides.js       # Подавление console.log в production
│
├── constants/                 # Константы и статические данные
│   ├── data.jsx               # SUBJECT_NAMES, LESSON_TYPES, ALL_SUBJECTS_LIST
│   └── syllabus.js            # SYLLABUS_FALLBACK (резервные данные учебной программы)
│
├── contexts/                  # React Contexts
│   ├── AuthContext.jsx         # Авторизация Supabase (useAuth хук, профили, роли)
│   └── SyllabusContext.jsx     # Контекст учебной программы
│
├── hooks/                     # Кастомные хуки
│   ├── useDebounce.js          # Debounce значений (для авто-сохранения)
│   └── useEngagementTimer.js   # Таймер вовлеченности (трекинг времени на уроке)
│
├── services/                  # Сервисы работы с данными
│   ├── supabase.js             # Инициализация Supabase клиента
│   └── apiService.js           # 🔑 ГЛАВНЫЙ ФАЙЛ — все CRUD операции:
│                                #   - syllabusService (структура курсов, уроки)
│                                #   - statisticsService (аналитика, лидерборды)
│                                #   - classService (классы, ученики)
│                                #   - gradesService (оценки, тройная система)
│                                #   - translationService (авто-перевод RU↔TJ)
│                                #   - storageService (загрузка изображений)
│                                #   - notificationService (уведомления)
│
├── sql/                       # SQL схемы и миграции
│   ├── master_schema.sql       # 🔑 Мастер-схема БД (единственный источник истины)
│   ├── notifications_system.sql # Система уведомлений (SQL функции)
│   └── xp_system.sql           # Система монет и XP (SQL функции)
│
└── utils/                     # Утилиты (пустая, логика перенесена в apiService)
```

---

## 📂 `src/components/` — Компоненты

### 🎯 Глобальные

```
components/
├── GlobalErrorBoundary.jsx    # Глобальный обработчик ошибок React
```

### 🔐 `auth/` — Авторизация

```
auth/
└── ProtectedRoute.jsx         # HOC: защита маршрутов (редирект на /auth)
```

### 🧩 `common/` — Переиспользуемые компоненты

```
common/
├── ComponentErrorBoundary.jsx  # Локальный Error Boundary (для отдельных секций)
├── Skeleton.jsx                # Skeleton-загрузчики (карточки, строки)
├── UserAvatar.jsx              # Аватар пользователя (с fallback-инициалами)
└── WhatsNewModal.jsx           # Модалка "Что нового" (changelog внутри приложения)
```

### 🎨 `layout/` — Глобальный Layout

```
layout/
├── Navbar.jsx                  # Навигация (адаптивная, с нотификациями, уровнем)
├── Footer.jsx                  # Подвал сайта
├── CourseLayout.jsx            # Layout страниц курса (хлебные крошки, сайдбар)
├── CourseSidebar.jsx           # Боковая панель навигации по курсу
└── AnnouncementBanner.jsx      # Баннер объявлений (из Supabase)
```

### 🖊️ `creator/` — Редактор контента (Учитель)

```
creator/
├── LessonContentEditor.jsx    # 🔑 Главное модальное окно редактирования урока
├── VideoEditor.jsx            # Редактор видео (YouTube URL, описание RU/TJ)
├── TextEditor.jsx             # Редактор текстового контента (RU/TJ)
├── TestEditor.jsx             # Редактор теста (список вопросов + DnD)
├── SlidesEditor.jsx           # Редактор презентаций (RU/TJ слайды)
├── RichTextEditor.jsx         # WYSIWYG редактор (TipTap + LaTeX/KaTeX)
├── SortableComponents.jsx     # DnD-компоненты (SortableSection, SortableTopic, SortableLesson)
│
└── test/                      # Подкомпоненты редактора тестов
    ├── QuestionForm.jsx        # Форма редактирования вопроса (modal, все 3 типа)
    └── TestQuestionList.jsx    # Список вопросов (сортировка, превью)
```

### 🧪 `viewer/` — Просмотр контента (Ученик)

```
viewer/
├── VideoPlayer.jsx            # Видеоплеер (YouTube embed)
├── TextContent.jsx            # Отображение текстового урока
├── SlidesViewer.jsx           # Просмотр презентаций (свайп, зум)
├── TestViewer.jsx             # 🔑 Интерфейс прохождения теста (таймер, проверка)
├── TestTeacherView.jsx        # Просмотр теста для учителя (с ответами)
├── ProgressCard.jsx           # Карточка прогресса ученика
│
└── questions/                 # Типы вопросов (рендер для ученика)
    ├── MultipleChoiceQuestion.jsx  # Вопрос с выбором ответа (A/B/C/D)
    ├── MatchingQuestion.jsx        # Вопрос на соответствие (A→1, B→3...)
    ├── NumericQuestion.jsx         # Числовой вопрос (ввод цифр + единица)
    └── TestResultsScreen.jsx       # Экран результатов теста (оценка, разбор)
```

### 🏠 `pages/` — Страницы приложения

```
pages/
├── HomePage.jsx               # Главная страница (герой, каталог курсов)
├── AboutPage.jsx              # Страница "О нас"
├── AuthPage.jsx               # Страница авторизации (вход/регистрация)
├── ProfilePage.jsx            # Профиль пользователя (настройки, статистика)
├── CreatorPage.jsx            # 🔑 Панель создателя контента (разделы→темы→уроки)
├── AdminPage.jsx              # Панель администратора
├── LeaderboardPage.jsx        # Глобальный лидерборд (монеты)
├── NotFoundPage.jsx           # Страница 404
├── StudentDashboardPage.jsx   # Дашборд ученика
│
├── SubjectPage.jsx            # Страница предмета (список разделов)
├── SectionPage.jsx            # Страница раздела (список тем)
├── TopicPage.jsx              # Страница темы (список уроков + прогресс)
├── LessonPage.jsx             # 🔑 Страница урока (видео/текст/тест/слайды)
│
├── classes/                   # Модуль "Мои классы"
│   ├── ClassesPage.jsx        # Список классов (создание, присоединение)
│   ├── ClassDetailsPage.jsx   # Детали класса (табы)
│   └── tabs/                  # Табы внутри класса
│       ├── ClassStudentsTab.jsx    # Список учеников
│       ├── ClassGradesTab.jsx      # Оценки (тройная система)
│       ├── ClassStatisticsTab.jsx  # Аналитика класса (графики, прогресс)
│       ├── ClassLeaderboardTab.jsx # Лидерборд класса (монеты)
│       ├── ClassSettingsTab.jsx    # Настройки класса
│       ├── MassGradingModal.jsx    # Модалка массового выставления оценок
│       └── StudentGradesModal.jsx  # Модалка оценок конкретного ученика
│
└── dashboard/                 # Табы дашборда
    ├── DashboardTab.jsx       # Главный таб (прогресс, рекомендации)
    ├── SettingsTab.jsx        # Настройки профиля
    └── TestHistoryTab.jsx     # История прохождения тестов
```

### 📦 `features/` — Feature-компоненты

```
features/
├── CourseCard.jsx              # Карточка курса (каталог)
├── ClusterSelect.jsx           # Выбор кластера предметов
├── LevelProgressBar.jsx        # Прогресс-бар уровня (XP/монеты)
├── NotificationBell.jsx        # Колокольчик уведомлений (в навбаре)
└── OnboardingSubjectsSection.jsx # Секция выбора предметов при онбординге
```

### 🖼️ `sections/` — Секции страниц

```
sections/
└── HeroSection.jsx            # Hero-секция главной страницы
```

### 🛡️ `admin/` — Административные компоненты

```
admin/
├── AdminUsersTab.jsx           # Управление пользователями (роли, блокировка)
├── AdminBranchesTab.jsx        # Управление филиалами/школами
└── AdminNotificationsTab.jsx   # Управление уведомлениями (рассылка)
```

---

## 🗄️ Ключевые SQL-функции (Supabase RPC)

| Функция | Назначение |
|---------|-----------|
| `evaluate_test` | Проверка теста + начисление монет (≥80%) |
| `get_student_dashboard_stats` | Статистика ученика (прогресс, тесты) |
| `get_class_analytics_stats` | Аналитика класса (сводная) |
| `get_global_leaderboard` | Глобальный лидерборд |
| `get_topic_grades_matrix` | Матрица оценок по темам |
| `award_coins` | Начисление монет (trigger) |

---

## 🔗 Связи между компонентами

```
App.jsx
├── Navbar (layout)
├── Routes:
│   ├── HomePage → CourseCard (features)
│   ├── SubjectPage → SectionPage → TopicPage → LessonPage
│   │                                              ├── VideoPlayer (viewer)
│   │                                              ├── TextContent (viewer)
│   │                                              ├── TestViewer (viewer)
│   │                                              │   └── MultipleChoice / Matching / Numeric
│   │                                              └── SlidesViewer (viewer)
│   ├── CreatorPage → LessonContentEditor (creator)
│   │                  ├── VideoEditor
│   │                  ├── TextEditor → RichTextEditor
│   │                  ├── TestEditor → QuestionForm
│   │                  └── SlidesEditor
│   ├── ClassesPage → ClassDetailsPage
│   │                  ├── ClassStudentsTab
│   │                  ├── ClassGradesTab
│   │                  ├── ClassStatisticsTab
│   │                  ├── ClassLeaderboardTab
│   │                  └── ClassSettingsTab
│   ├── LeaderboardPage
│   ├── ProfilePage → DashboardTab / SettingsTab / TestHistoryTab
│   └── AdminPage → AdminUsersTab / AdminBranchesTab / AdminNotificationsTab
└── Footer (layout)
```

---

## 📊 Размеры ключевых файлов

| Файл | Размер | Описание |
|------|--------|----------|
| `apiService.js` | ~60 KB | Центральный сервис API |
| `master_schema.sql` | ~65 KB | Мастер-схема БД |
| `CreatorPage.jsx` | ~68 KB | Панель создателя |
| `AdminUsersTab.jsx` | ~68 KB | Управление пользователями |
| `ClassStatisticsTab.jsx` | ~47 KB | Аналитика класса |
| `AuthPage.jsx` | ~43 KB | Авторизация |
| `LessonPage.jsx` | ~38 KB | Страница урока |
| `TestViewer.jsx` | ~35 KB | Прохождение теста |
