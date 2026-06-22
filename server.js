const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');

const app = express();
const db = new Database('tasks.db');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

app.get('/api/tasks', (req, res) => {
  const tasks = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
  res.json(tasks);
});

app.post('/api/tasks', (req, res) => {
  const { title } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title required' });
  const result = db.prepare('INSERT INTO tasks (title) VALUES (?)').run(title.trim());
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(task);
});

app.patch('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { title, done } = req.body;
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!task) return res.status(404).json({ error: 'Not found' });
  const newTitle = title !== undefined ? title.trim() : task.title;
  const newDone = done !== undefined ? (done ? 1 : 0) : task.done;
  db.prepare('UPDATE tasks SET title = ?, done = ? WHERE id = ?').run(newTitle, newDone, id);
  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(id));
});

app.delete('/api/tasks/:id', (req, res) => {
  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
