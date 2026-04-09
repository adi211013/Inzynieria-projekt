-- =============================================
--  Habit Tracker — schemat bazy danych
-- =============================================

CREATE TABLE users (
    user_id     SERIAL PRIMARY KEY,
    username    VARCHAR(100) NOT NULL UNIQUE,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE habits (
    habit_id    SERIAL PRIMARY KEY,
    user_id     INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    frequency   VARCHAR(50),
    created_at  TIMESTAMP DEFAULT NOW(),
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE habit_logs (
    log_id      SERIAL PRIMARY KEY,
    habit_id    INT NOT NULL REFERENCES habits(habit_id) ON DELETE CASCADE,
    completed   BOOLEAN DEFAULT FALSE,
    date        DATE NOT NULL,
    note        TEXT
);

CREATE TABLE goals (
    goal_id         SERIAL PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    target_value    NUMERIC(10,2),
    current_value   NUMERIC(10,2) DEFAULT 0,
    deadline        DATE
);
