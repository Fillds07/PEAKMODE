CREATE TABLE users_new (id INTEGER PRIMARY KEY, username TEXT NOT NULL, email TEXT NOT NULL, name TEXT NOT NULL, password TEXT NOT NULL);
INSERT INTO users_new (id, username, email, name, password) SELECT id, username, email, name, password FROM users;
DROP TABLE users;
ALTER TABLE users_new RENAME TO users;
-- Add validation to verify
PRAGMA table_info(users);
