# MedClinic

**MedClinic** - full-stack веб-приложение для автоматизации работы медицинской клиники. Система объединяет личный кабинет пациента, рабочее место врача и административную панель для управления записями, расписанием, врачами, услугами и аналитикой.

Проект состоит из клиентской части на **React + TypeScript** и серверной части на **ASP.NET Core Web API**.

## О проекте

MedClinic помогает организовать процесс записи пациентов на медицинские услуги и дальнейшую обработку обращений внутри клиники.

В приложении предусмотрены три основные роли:

- **Пациент** - создает заявки на прием, выбирает услугу, врача и свободное время, отслеживает статус своих записей.
- **Врач** - работает с очередью заявок, принимает обращения в работу, завершает приемы, указывает диагноз и рекомендации по лечению.
- **Администратор** - управляет пользователями, врачами, расписанием, категориями услуг и просматривает аналитические отчеты.

## Основные возможности

- Регистрация и авторизация пользователей.
- JWT-аутентификация.
- Разграничение доступа по ролям: `Patient`, `Doctor`, `Admin`.
- Защищенные маршруты на клиенте.
- Создание заявок на прием к врачу.
- Выбор медицинской услуги, специалиста и доступного временного слота.
- Отображение статусов заявок.
- Очереди заявок для врача:
  - новые заявки;
  - заявки в работе;
  - завершенные заявки.
- Назначение диагноза и рекомендаций по лечению.
- Управление врачами и их специализациями.
- Управление расписанием врачей.
- Управление категориями медицинских услуг.
- Управление пользователями и ролями.
- Административная аналитика по работе клиники.
- Обновление доступных слотов врачей в реальном времени через SignalR.
- Централизованная обработка ошибок на сервере.
- Swagger UI для просмотра и тестирования API.
- Интеграционные тесты backend-части.
- Тесты frontend-части для авторизации, маршрутизации и отображения страниц.

## Технологический стек

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- TanStack React Query
- Ant Design
- SignalR client
- Vitest
- Testing Library
- ESLint
- Prettier

### Backend

- ASP.NET Core 8
- Entity Framework Core
- ASP.NET Core Identity
- JWT Bearer Authentication
- SignalR
- SQL Server
- Swagger / OpenAPI
- xUnit
- FluentAssertions
- SQLite для интеграционных тестов

## Структура проекта

```text
MedClinic/
├── client/
│   └── client/
│       ├── src/
│       │   ├── api/              # API-клиенты
│       │   ├── app/              # Роутинг и корневая настройка приложения
│       │   ├── components/       # Общие UI-компоненты
│       │   ├── contexts/         # Контексты приложения
│       │   ├── entities/         # Типы и модели предметной области
│       │   ├── features/         # Функциональные модули
│       │   ├── hooks/            # Пользовательские React-хуки
│       │   ├── pages/            # Страницы пациента, врача и администратора
│       │   ├── shared/           # Общая инфраструктура клиента
│       │   └── test/             # Тестовые утилиты
│       ├── package.json
│       └── vite.config.ts
│
└── server/
    └── server/
        ├── ServiceDesk.API/
        │   ├── Application/      # Бизнес-логика, сервисы, контракты, маппинг
        │   ├── Controllers/      # HTTP-контроллеры
        │   ├── Data/             # DbContext и начальное заполнение БД
        │   ├── DTOs/             # DTO для запросов и ответов
        │   ├── Hubs/             # SignalR-хабы
        │   ├── Infrastructure/   # DI, JWT, CORS, Swagger и технические сервисы
        │   ├── Middleware/       # Middleware для обработки ошибок
        │   ├── Migrations/       # EF Core миграции
        │   ├── Models/           # Доменные модели и сущности БД
        │   └── Program.cs
        │
        ├── ServiceDesk.API.Tests/
        │   ├── Auth/
        │   ├── Categories/
        │   ├── Infrastructure/
        │   ├── Platform/
        │   ├── Tickets/
        │   └── Users/
        │
        └── ServiceDesk.sln
```

## Архитектура backend

Серверная часть построена по слоистой архитектуре:

- `Controllers` - тонкий слой HTTP-входа в приложение.
- `Application/Abstractions` - контракты сервисов и доступа к данным.
- `Application/Services` - бизнес-логика и сценарии использования.
- `Application/Mapping` - преобразование сущностей в DTO.
- `Data` - EF Core контекст и начальное заполнение базы данных.
- `Infrastructure` - JWT, DI, Swagger, CORS и техническая инфраструктура.
- `Models` - основные сущности предметной области.
- `DTOs` - контракты запросов и ответов API.

Основное направление зависимостей:

```text
Controllers -> Application/Abstractions
Application/Services -> Application/Abstractions + Models
Infrastructure/Data -> Application/Abstractions
Infrastructure/Auth -> Models
```

## Установка и запуск

### Предварительные требования

Перед запуском необходимо установить:

- Node.js
- npm
- .NET 8 SDK
- SQL Server или SQL Server Express

## Запуск backend

Перейдите в папку серверной части:

```bash
cd server/server
```

Восстановите зависимости:

```bash
dotnet restore
```

Примените миграции базы данных:

```bash
dotnet ef database update --project ServiceDesk.API/ServiceDesk.API.csproj
```

Запустите API:

```bash
dotnet run --project ServiceDesk.API/ServiceDesk.API.csproj
```

По умолчанию backend запускается по адресу:

```text
http://localhost:5057
```

Swagger UI доступен по адресу:

```text
http://localhost:5057/swagger
```

Также доступен health-check:

```text
http://localhost:5057/health
```

## Запуск frontend

Перейдите в папку клиентской части:

```bash
cd client/client
```

Установите зависимости:

```bash
npm install
```

Запустите приложение в режиме разработки:

```bash
npm run dev
```

По умолчанию frontend запускается по адресу:

```text
http://localhost:5173
```

## Настройка API URL

В режиме разработки клиент использует API по адресу:

```text
http://localhost:5057
```

При необходимости адрес можно переопределить через переменную окружения:

```env
VITE_API_URL=http://localhost:5057
```

## Настройка базы данных

В режиме разработки используется строка подключения из `appsettings.Development.json`:

```json
"DefaultConnection": "Server=.\\SQLEXPRESS;Database=servicedesk;Integrated Security=True;TrustServerCertificate=True;MultipleActiveResultSets=True;"
```

Если у вас используется другой SQL Server, измените строку подключения в файле:

```text
server/server/ServiceDesk.API/appsettings.Development.json
```

При запуске в режиме `Development` приложение автоматически создает базовые роли и демонстрационные данные.

## Демонстрационные аккаунты

### Администратор

```text
admin@demo.com
Admin123!
```

### Врачи

```text
petrov@medclinic.ru
Doctor123!

sokolova@medclinic.ru
Doctor123!

morozov@medclinic.ru
Doctor123!

kozlova@medclinic.ru
Doctor123!

novikov@medclinic.ru
Doctor123!
```

### Пациенты

```text
patient1@demo.com
Patient123!

patient2@demo.com
Patient123!

patient3@demo.com
Patient123!
```

## Скрипты frontend

Все команды выполняются из папки:

```bash
cd client/client
```

Запуск dev-сервера:

```bash
npm run dev
```

Сборка проекта:

```bash
npm run build
```

Запуск тестов:

```bash
npm run test:run
```

Запуск тестов в watch-режиме:

```bash
npm run test
```

Проверка ESLint:

```bash
npm run lint
```

Предпросмотр production-сборки:

```bash
npm run preview
```

## Команды backend

Все команды выполняются из папки:

```bash
cd server/server
```

Сборка решения:

```bash
dotnet build
```

Запуск API:

```bash
dotnet run --project ServiceDesk.API/ServiceDesk.API.csproj
```

Запуск тестов:

```bash
dotnet test
```

Применение миграций:

```bash
dotnet ef database update --project ServiceDesk.API/ServiceDesk.API.csproj
```

## API

Основные группы эндпоинтов:

- `Auth` - регистрация, вход, получение информации о текущем пользователе.
- `Users` - управление пользователями и ролями.
- `Doctors` - управление врачами и расписанием.
- `Categories` - управление категориями медицинских услуг.
- `Tickets` - создание и обработка заявок на прием.
- `Diagnoses` - получение доступных диагнозов.
- `Admin` - административная статистика и аналитика.

Документация API доступна через Swagger после запуска backend:

```text
http://localhost:5057/swagger
```

## Real-time обновления

Для обновления информации о слотах врачей используется SignalR-хаб:

```text
/hubs/doctor-slots
```

Клиент подключается к нему через `@microsoft/signalr`.

## Тестирование

### Frontend-тесты

Frontend покрыт тестами для:

- авторизации;
- регистрации;
- выхода из аккаунта;
- инициализации auth-состояния;
- защиты маршрутов;
- ролевой навигации;
- состояний страниц с заявками.

Запуск:

```bash
cd client/client
npm run test:run
```

### Backend-тесты

Backend содержит интеграционные тесты для:

- авторизации;
- категорий;
- платформенных проверок;
- заявок;
- изменения статусов заявок;
- отказа в заявках;
- пользователей и ролей.

Запуск:

```bash
cd server/server
dotnet test
```

## Важные замечания

- Клиентский `package.json` находится в папке `client/client`, поэтому команды `npm install` и `npm run dev` нужно выполнять именно там.
- Backend-проект находится в папке `server/server/ServiceDesk.API`.
- Для работы backend требуется корректная строка подключения к SQL Server.
- JWT-ключ в `appsettings.Development.json` предназначен только для локальной разработки.
- Перед публикацией проекта на GitHub рекомендуется исключить из репозитория `node_modules`, `bin`, `obj`, `dist`, `.vs` и другие генерируемые файлы.

## Возможные темы для GitHub

```text
react
typescript
vite
aspnet-core
dotnet
entity-framework-core
jwt-authentication
signalr
sql-server
medical-clinic
appointment-system
healthcare
```

## Краткое описание репозитория

Full-stack веб-приложение для управления медицинской клиникой: запись пациентов на прием, расписание врачей, обработка заявок, медицинские записи, роли пользователей и административная аналитика.
