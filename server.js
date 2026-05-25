const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// --- Инициализация базы данных SQLite ---
const db = new Database('kv-store.db');

// Создаём таблицу, если её нет
db.exec(`
  CREATE TABLE IF NOT EXISTS kv_store (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// --- Подготовленные SQL-запросы (для производительности) ---
const setValue = db.prepare(`
  INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)
`);

const getValue = db.prepare(`
  SELECT value FROM kv_store WHERE key = ?
`);

const deleteValue = db.prepare(`
  DELETE FROM kv_store WHERE key = ?
`);

// ========== API ENDPOINTS ==========

// GET /get/:key — получить значение по ключу
app.get('/get/:key', (req, res) => {
  const result = getValue.get(req.params.key);
  const value = result ? JSON.parse(result.value) : null;
  res.json({ value });
});

// POST /set — установить значение по ключу
app.post('/set', (req, res) => {
  const { key, value } = req.body;
  
  if (!key) {
    return res.status(400).json({ error: 'Key is required' });
  }
  
  const valueString = JSON.stringify(value ?? null);
  setValue.run(key, valueString);
  res.json({ success: true });
});

// POST /mset — установить несколько ключей
app.post('/mset', (req, res) => {
  const { keys, values } = req.body;
  
  if (!keys || !values || keys.length !== values.length) {
    return res.status(400).json({ 
      error: 'Keys and values arrays are required and must have same length' 
    });
  }
  
  const setMany = db.transaction((keys, values) => {
    for (let i = 0; i < keys.length; i++) {
      const valueString = JSON.stringify(values[i] ?? null);
      setValue.run(keys[i], valueString);
    }
  });
  
  setMany(keys, values);
  res.json({ success: true });
});

// GET /mget?keys=key1&keys=key2 — получить несколько ключей
app.get('/mget', (req, res) => {
  const keys = req.query.keys;
  
  if (!keys) {
    return res.status(400).json({ error: 'Keys query parameter is required' });
  }
  
  const keyArray = Array.isArray(keys) ? keys : [keys];
  const values = [];
  
  for (const key of keyArray) {
    const result = getValue.get(key);
    values.push(result ? JSON.parse(result.value) : null);
  }
  
  res.json({ values });
});

// DELETE /del/:key — удалить ключ
app.delete('/del/:key', (req, res) => {
  deleteValue.run(req.params.key);
  res.json({ success: true });
});

// POST /mdel — удалить несколько ключей
app.post('/mdel', (req, res) => {
  const { keys } = req.body;
  
  if (!keys || !Array.isArray(keys)) {
    return res.status(400).json({ error: 'Keys array is required' });
  }
  
  const deleteMany = db.transaction((keys) => {
    for (const key of keys) {
      deleteValue.run(key);
    }
  });
  
  deleteMany(keys);
  res.json({ success: true });
});

// GET /prefix/:prefix — поиск всех ключей с префиксом
app.get('/prefix/:prefix', (req, res) => {
  const prefix = req.params.prefix;
  const stmt = db.prepare(`SELECT value FROM kv_store WHERE key LIKE ?`);
  const results = stmt.all(`${prefix}%`);
  const values = results.map(row => JSON.parse(row.value));
  res.json({ values });
});

// GET /health — проверка работоспособности
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Запуск сервера
app.listen(port, () => {
  console.log(`✅ KV сервер запущен на порту ${port}`);
});
