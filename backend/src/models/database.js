const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Path to SQLite database file
const dbPath = path.join(dataDir, 'peakmode.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Promise wrapper for database operations
const runQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
};

const getAll = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

const getOne = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Initialize database schema
const initializeDatabase = async () => {
  // Enable foreign keys
  await runQuery('PRAGMA foreign_keys = ON');
  
  // Create users table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create security questions table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS security_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT UNIQUE NOT NULL
    )
  `);
  
  // Create user security answers table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS user_security_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      answer TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES security_questions (id) ON DELETE CASCADE,
      UNIQUE(user_id, question_id)
    )
  `);
  
  // Populate default security questions
  const defaultQuestions = [
    "What was the name of your first pet?",
    "In what city were you born?",
    "What is your mother's maiden name?",
    "What was your childhood nickname?",
    "What is the name of your favorite childhood friend?",
    "What was the name of your first grade teacher?",
    "What was the make of your first car?",
    "What was your favorite food as a child?",
    "Where did you meet your spouse/significant other?",
    "What is your favorite movie?"
  ];
  
  for (const question of defaultQuestions) {
    try {
      await runQuery(
        'INSERT OR IGNORE INTO security_questions (question) VALUES (?)',
        [question]
      );
    } catch (error) {
      console.error(`Error inserting question "${question}":`, error);
    }
  }
  
  console.log('Database schema initialized');
};

module.exports = {
  db,
  runQuery,
  getAll,
  getOne,
  initializeDatabase
}; 