const Database = require("better-sqlite3");

const db = new Database("parking.db");

db.pragma("foreign_keys = ON");

db.exec(`
    CREATE TABLE IF NOT EXISTS people (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    institutional_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS parking_registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id INTEGER NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (person_id)
        REFERENCES people(id)
    
    );


    CREATE TABLE IF NOT EXISTS vehicles(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    registration_id INTEGER NOT NULL,
    plate TEXT NOT NULL,
    state TEXT NOT NULL,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year TEXT NOT NULL,
    color TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(registration_id)
        REFERENCES parking_registrations(id)

        UNIQUE(plate, state)
    
    
    );



    `);



const insertPerson = db.prepare(
    `INSERT OR IGNORE INTO people(
    institutional_id,
    name,
    email,
    role
    )
    VALUES(?,?,?,?)
    
    
    `);

insertPerson.run(
    "ESU-10077",
    "Rafay Mudassar",
    "arafaymyedi@gmail.com",
    "Undergrad Student"

)

insertPerson.run(
  "NVU-10482",
  "Maya Chen",
  "maya.chen@northvalley.edu",
  "Graduate Student"
);

insertPerson.run(
  "NVU-20731",
  "Jordan Williams",
  "jordan.williams@northvalley.edu",
  "Staff"
);

insertPerson.run(
  "NVU-31809",
  "Alex Rivera",
  "alex.rivera@northvalley.edu",
  "Undergraduate Student"
);

module.exports = db;