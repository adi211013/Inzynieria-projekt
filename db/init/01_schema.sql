
CREATE TYPE goal_status AS ENUM ('in_progress', 'completed', 'failed');

CREATE TABLE users (
                       user_id               SERIAL PRIMARY KEY,
                       username              VARCHAR(100) NOT NULL UNIQUE,
                       email                 VARCHAR(255) NOT NULL UNIQUE,
                       password              VARCHAR(255) NOT NULL,
                       display_name          VARCHAR(100),
                       theme                 VARCHAR(20)  NOT NULL DEFAULT 'light',
                       timezone              VARCHAR(64)  NOT NULL DEFAULT 'Europe/Warsaw',
                       language              VARCHAR(8)   NOT NULL DEFAULT 'pl',
                       notifications_enabled BOOLEAN      NOT NULL DEFAULT FALSE,
                       reminder_time         VARCHAR(5),
                       created_at            TIMESTAMP    DEFAULT NOW()
);

CREATE TABLE habits (
                        habit_id              SERIAL PRIMARY KEY,
                        user_id               INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                        name                  VARCHAR(255) NOT NULL,
                        description           TEXT,
                        category              VARCHAR(50),
                        icon                  VARCHAR(50),
                        color                 VARCHAR(20),
                        frequency             JSONB        NOT NULL,
                        target_count          NUMERIC(10,2),
                        unit                  VARCHAR(30),
                        notifications_enabled BOOLEAN      NOT NULL DEFAULT FALSE,
                        reminder_time         VARCHAR(5),
                        created_at            TIMESTAMP    DEFAULT NOW(),
                        is_active             BOOLEAN      DEFAULT TRUE
);

CREATE TABLE habit_logs (
                            habit_log_id  SERIAL PRIMARY KEY,
                            user_id       INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                            habit_id      INT NOT NULL REFERENCES habits(habit_id) ON DELETE CASCADE,
                            value         NUMERIC(10,2),
                            date          DATE NOT NULL,
                            note          TEXT,
                            created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
                            UNIQUE (habit_id, date)
);

CREATE TABLE goals (
                       goal_id               SERIAL PRIMARY KEY,
                       user_id               INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                       habit_id              INT NOT NULL REFERENCES habits(habit_id) ON DELETE CASCADE,
                       name                  VARCHAR(255) NOT NULL,
                       description           TEXT,
                       category              VARCHAR(50),
                       icon                  VARCHAR(50),
                       color                 VARCHAR(20),
                       frequency             JSONB        NOT NULL,
                       target_days           INT          NOT NULL,
                       status                goal_status  NOT NULL DEFAULT 'in_progress',
                       notifications_enabled BOOLEAN      NOT NULL DEFAULT FALSE,
                       reminder_time         VARCHAR(5),
                       deadline              DATE,
                       created_at            TIMESTAMP    DEFAULT NOW(),
                       is_active             BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE goal_logs (
                           goal_log_id   SERIAL PRIMARY KEY,
                           user_id       INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                           goal_id       INT NOT NULL REFERENCES goals(goal_id) ON DELETE CASCADE,
                           completed     BOOLEAN NOT NULL DEFAULT TRUE,
                           date          DATE NOT NULL,
                           note          TEXT,
                           created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
                           UNIQUE (goal_id, date)
);

CREATE INDEX idx_habits_user_active    ON habits(user_id, is_active);
CREATE INDEX idx_habit_logs_user_date  ON habit_logs(user_id, date DESC);
CREATE INDEX idx_goals_user_active     ON goals(user_id, is_active);
CREATE INDEX idx_goal_logs_user_date   ON goal_logs(user_id, date DESC);