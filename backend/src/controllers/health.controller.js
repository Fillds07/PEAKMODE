const { getAll, getOne } = require('../models/database');

/**
 * Get system health status
 */
exports.getHealthStatus = async (req, res) => {
  try {
    // Perform a simple database check
    const dbCheck = await getOne('SELECT 1 as db_check');
    
    res.status(200).json({
      status: 'ok',
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      dbStatus: dbCheck ? 'connected' : 'disconnected'
    });
  } catch (error) {
    console.error('Health check error:', error);
    
    res.status(500).json({
      status: 'error',
      message: 'Server is running but database connection failed',
      timestamp: new Date().toISOString(),
      dbStatus: 'disconnected',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get database status with table information
 */
exports.getDatabaseStatus = async (req, res) => {
  try {
    // Get list of tables
    const tables = await getAll("SELECT name FROM sqlite_master WHERE type='table'");
    
    // Get count of rows in each table
    const tableInfo = [];
    
    for (const table of tables) {
      // Skip sqlite internal tables
      if (table.name.startsWith('sqlite_')) {
        continue;
      }
      
      const count = await getOne(`SELECT COUNT(*) as count FROM ${table.name}`);
      tableInfo.push({
        name: table.name,
        count: count.count
      });
    }
    
    res.status(200).json({
      status: 'ok',
      message: 'Database connection successful',
      timestamp: new Date().toISOString(),
      dbType: 'SQLite',
      tables: tableInfo
    });
  } catch (error) {
    console.error('Database status check error:', error);
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve database information',
      timestamp: new Date().toISOString(),
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}; 