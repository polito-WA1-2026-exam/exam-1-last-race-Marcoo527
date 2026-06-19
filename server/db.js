'use strict';

import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('last_race.db', (err) => {
  if (err) {
    console.error('Error while opening database:', err.message);
  } else {
    console.log('Connection to SQLite database established');
    
    db.run('PRAGMA foreign_keys = ON;');
  }
});

export default db;