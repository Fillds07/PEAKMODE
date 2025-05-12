#!/usr/bin/env node

/**
 * Database print utility script
 * 
 * This script prints all tables and their contents from the SQLite database.
 * Run with: npm run db:print
 */

const { db, getAll } = require('../models/database');
const path = require('path');

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

/**
 * Print a table with formatting
 */
const printTable = (rows, table) => {
  if (!rows || rows.length === 0) {
    console.log(`${colors.yellow}Table ${colors.bright}${table}${colors.reset}${colors.yellow} is empty${colors.reset}\n`);
    return;
  }
  
  // Get column names from first row
  const columns = Object.keys(rows[0]);
  
  // Calculate column widths (minimum 15 characters, maximum 30)
  const columnWidths = {};
  columns.forEach(col => {
    let maxWidth = col.length;
    
    rows.forEach(row => {
      const value = row[col] !== null && row[col] !== undefined ? String(row[col]) : '';
      maxWidth = Math.max(maxWidth, value.length);
    });
    
    columnWidths[col] = Math.min(Math.max(maxWidth, 15), 30);
  });
  
  // Print header row
  let header = '';
  let separator = '';
  
  columns.forEach(col => {
    const width = columnWidths[col];
    header += `${colors.bright}${col.padEnd(width)}${colors.reset} | `;
    separator += '-'.repeat(width) + '-+-';
  });
  
  // Print table name and header
  console.log(`\n${colors.green}${colors.bright}Table: ${table}${colors.reset}`);
  console.log(`${header.slice(0, -2)}`);
  console.log(`${separator.slice(0, -2)}`);
  
  // Print rows
  rows.forEach((row, index) => {
    let rowStr = '';
    
    columns.forEach(col => {
      const value = row[col] !== null && row[col] !== undefined ? String(row[col]) : '';
      rowStr += `${value.padEnd(columnWidths[col])} | `;
    });
    
    console.log(`${rowStr.slice(0, -2)}`);
  });
  
  console.log(`\n${colors.green}${rows.length} rows${colors.reset}\n`);
};

/**
 * Main function to print all tables
 */
const printDatabase = async () => {
  try {
    console.log(`\n${colors.cyan}${colors.bright}PEAKMODE SQLite Database Content${colors.reset}\n`);
    
    // Get list of tables
    const tables = await getAll("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    
    console.log(`${colors.blue}Database location: ${colors.yellow}${path.resolve(__dirname, '../../data/peakmode.db')}${colors.reset}`);
    console.log(`${colors.blue}Total tables: ${colors.yellow}${tables.length}${colors.reset}\n`);
    
    // Skip sqlite internal tables
    const appTables = tables.filter(t => !t.name.startsWith('sqlite_'));
    
    if (appTables.length === 0) {
      console.log(`${colors.red}No application tables found${colors.reset}`);
      return;
    }
    
    // Print each table
    for (const table of appTables) {
      const rows = await getAll(`SELECT * FROM ${table.name}`);
      printTable(rows, table.name);
    }
    
    console.log(`${colors.cyan}${colors.bright}End of database content${colors.reset}\n`);
  } catch (error) {
    console.error(`${colors.red}Error printing database:${colors.reset}`, error);
  } finally {
    // Close database connection
    db.close();
  }
};

// Run the script
printDatabase(); 