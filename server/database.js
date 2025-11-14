const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    const dbPath = path.join(__dirname, 'dreams.db');
    this.db = new sqlite3.Database(dbPath);
    this.init();
  }
  
  init() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        birthdate TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    this.db.run(`
      CREATE TABLE IF NOT EXISTS dreams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        dream TEXT NOT NULL,
        interpretation TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);
  }
  
  createOrUpdateUser(name, phone, birthdate) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM users WHERE phone = ?',
        [phone],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          
          if (row) {
            this.db.run(
              'UPDATE users SET name = ?, birthdate = ? WHERE id = ?',
              [name, birthdate, row.id],
              (err) => {
                if (err) reject(err);
                else resolve({ id: row.id, name, phone, birthdate });
              }
            );
          } else {
            this.db.run(
              'INSERT INTO users (name, phone, birthdate) VALUES (?, ?, ?)',
              [name, phone, birthdate],
              function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, name, phone, birthdate });
              }
            );
          }
        }
      );
    });
  }
  
  saveDream(userId, dream, interpretation) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO dreams (user_id, dream, interpretation) VALUES (?, ?, ?)',
        [userId, dream, interpretation],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }
  
  getUserHistory(userId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM dreams WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`,
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }
}

module.exports = Database;