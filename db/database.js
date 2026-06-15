const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const path   = require('path');
const fs     = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'mendez.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

let db;
function getDb() {
  if (!db) {
    db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA foreign_keys = ON');
  }
  return db;
}

function initDb() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      email         TEXT    UNIQUE NOT NULL,
      password_hash TEXT    NOT NULL,
      created_at    TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS trips (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_number     TEXT    UNIQUE NOT NULL,
      ssn4            TEXT    NOT NULL,
      patient_name    TEXT    NOT NULL,
      pickup_address  TEXT    NOT NULL,
      destination     TEXT    NOT NULL,
      scheduled_at    TEXT    NOT NULL,
      driver_name     TEXT,
      driver_vehicle  TEXT,
      driver_plate    TEXT,
      driver_rating   REAL    DEFAULT 4.9,
      status          TEXT    DEFAULT 'en_route',
      user_id         INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS twofa_codes (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL,
      code       TEXT    NOT NULL,
      expires_at TEXT    NOT NULL,
      used       INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER,
      event      TEXT    NOT NULL,
      ip         TEXT,
      created_at TEXT    DEFAULT (datetime('now'))
    );
  `);

  /* Seed demo data once per fresh DB */
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get('demo@mendeztransport.com');
  if (!exists) {
    const hash = bcrypt.hashSync('Mendez2026!', 10);
    const { lastInsertRowid: uid } = db.prepare(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)'
    ).run('demo@mendeztransport.com', hash);

    /* Pickup scheduled for 8:30 AM today */
    const pickup = new Date();
    pickup.setHours(8, 30, 0, 0);

    db.prepare(`
      INSERT INTO trips
        (trip_number, ssn4, patient_name, pickup_address, destination,
         scheduled_at, driver_name, driver_vehicle, driver_plate, driver_rating, status, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'MT-2026-4891', '4891', 'Maria Garcia',
      '601 E Rollins St, Orlando FL 32803',
      'Osceola Regional Medical Center, Kissimmee FL 34741',
      pickup.toISOString(),
      'Carlos Rivera', '2023 Toyota Sienna', 'FLA-4892', 4.9, 'en_route', uid
    );

    console.log('[DB] Demo data seeded');
  }
}

module.exports = { getDb, initDb };
