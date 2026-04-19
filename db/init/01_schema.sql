
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
    habit_log_id  SERIAL PRIMARY KEY,
    user_id       INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    habit_id      INT NOT NULL REFERENCES habits(habit_id) ON DELETE CASCADE,
    completed     BOOLEAN DEFAULT FALSE,
    date          DATE NOT NULL,
    note          TEXT,
    UNIQUE (habit_id, date)
);

CREATE TABLE goals (
    goal_id       SERIAL PRIMARY KEY,
    user_id       INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name          VARCHAR(255) NOT NULL,
    description   TEXT,
    target_value  NUMERIC(10,2),
    deadline      DATE
);

CREATE TABLE goal_logs (
    goal_log_id   SERIAL PRIMARY KEY,
    user_id       INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    goal_id       INT NOT NULL REFERENCES goals(goal_id) ON DELETE CASCADE,
    current_value NUMERIC(10,2),
    date          DATE NOT NULL,
    note          TEXT,
    UNIQUE (goal_id, date)
);
