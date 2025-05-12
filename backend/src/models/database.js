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
      phone TEXT NOT NULL,
      password TEXT NOT NULL
    )
  `);
  
  // Check if timestamp columns exist and remove them
  try {
    // Check if timestamp columns exist in the users table
    const tableInfo = await getAll('PRAGMA table_info(users)');
    const columns = tableInfo.map(col => col.name);
    
    // If we have timestamps, we need to remove them
    if (columns.includes('created_at') || columns.includes('updated_at')) {
      console.log('Removing timestamp columns from users table...');
      
      // Create a temporary table without timestamp columns
      await runQuery(`
        CREATE TABLE users_temp (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          phone TEXT NOT NULL,
          password TEXT NOT NULL
        )
      `);
      
      // Copy data excluding timestamps
      await runQuery(`
        INSERT INTO users_temp (id, username, email, name, phone, password)
        SELECT id, username, email, name, phone, password FROM users
      `);
      
      // Drop original table
      await runQuery('DROP TABLE users');
      
      // Rename temp table to original name
      await runQuery('ALTER TABLE users_temp RENAME TO users');
      
      console.log('Timestamp columns successfully removed');
      
      // Verify the new structure
      const newStructure = await getAll('PRAGMA table_info(users)');
      console.log('Updated users table structure:', newStructure.map(col => col.name).join(', '));
    }
  } catch (error) {
    console.error('Error checking/updating users table:', error);
  }
  
  // Add phone column if it doesn't exist (SQLite migration) - keeping this for backward compatibility
  try {
    // Check if phone column exists
    const tableInfo = await getAll('PRAGMA table_info(users)');
    const phoneColumnExists = tableInfo.some(column => column.name === 'phone');
    
    if (!phoneColumnExists) {
      console.log('Adding phone column to users table');
      await runQuery('ALTER TABLE users ADD COLUMN phone TEXT NOT NULL DEFAULT ""');
    } else {
      // Check if phone column is nullable and update it if needed
      const phoneColumn = tableInfo.find(column => column.name === 'phone');
      if (phoneColumn && phoneColumn.notnull === 0) {
        console.log('Updating phone column to be required');
        // In SQLite, we need to recreate the table to change column constraints
        // This is a simplified approach - in production, this would need careful migration
        try {
          await runQuery('UPDATE users SET phone = "" WHERE phone IS NULL');
          console.log('Set empty strings for null phone values');
        } catch (error) {
          console.error('Error updating null phone values:', error);
        }
      }
    }
    
    // Check column order and reorder if needed (phone should be before password)
    const columnOrder = tableInfo.map(col => col.name);
    const phoneIndex = columnOrder.indexOf('phone');
    const passwordIndex = columnOrder.indexOf('password');
    
    // If phone exists and comes after password, we need to reorder
    if (phoneIndex > passwordIndex && phoneIndex !== -1 && passwordIndex !== -1) {
      console.log('Reordering columns: moving phone before password');
      
      // Step 1: Create a temporary table with the correct column order
      await runQuery(`
        CREATE TABLE users_temp (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          phone TEXT NOT NULL,
          password TEXT NOT NULL
        )
      `);
      
      // Step 2: Copy data from the old table to the new one
      await runQuery(`
        INSERT INTO users_temp (id, username, email, name, phone, password)
        SELECT id, username, email, name, phone, password FROM users
      `);
      
      // Step 3: Drop the old table
      await runQuery('DROP TABLE users');
      
      // Step 4: Rename the new table to the original name
      await runQuery('ALTER TABLE users_temp RENAME TO users');
      
      console.log('Column reordering complete');
    }
  } catch (error) {
    console.error('Error checking/updating users table:', error);
  }
  
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