const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../orders.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_phone TEXT NOT NULL,
    items JSON NOT NULL,
    total_price TEXT,
    status TEXT DEFAULT 'pending',
    location_lat REAL,
    location_long REAL,
    google_maps_link TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
        if (err) {
            console.error('Error creating orders table:', err.message);
        }
    });
}

function createOrder(userPhone, items, totalPrice) {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO orders (user_phone, items, total_price) VALUES (?, ?, ?)`;
        db.run(sql, [userPhone, JSON.stringify(items), totalPrice], function (err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
    });
}

function updateOrderLocation(orderId, lat, long, mapsLink) {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE orders SET location_lat = ?, location_long = ?, google_maps_link = ? WHERE id = ?`;
        db.run(sql, [lat, long, mapsLink, orderId], function (err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes);
            }
        });
    });
}

function getLatestPendingOrder(userPhone) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM orders WHERE user_phone = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 1`;
        db.get(sql, [userPhone], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

function getOrders(limit = 10) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM orders ORDER BY created_at DESC LIMIT ?`;
        db.all(sql, [limit], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}
module.exports = {
    db,
    createOrder,
    getOrders,
    updateOrderLocation,
    getLatestPendingOrder
};
