const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Railway volumes mount at /data when configured, fallback to local
const DATA_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'respondents.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '[]');
}

function readData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return []; }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.use(express.json({ limit: '15mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/respondents', (req, res) => {
  res.json(readData());
});

app.post('/api/respondents', (req, res) => {
  try {
    const data = readData();
    const record = {
      ...req.body,
      id: Date.now(),
      ts: new Date().toLocaleString('pt-BR', { timeZone: 'America/Fortaleza' })
    };
    data.push(record);
    writeData(data);
    res.json({ ok: true, id: record.id });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/health', (req, res) => res.json({ ok: true, count: readData().length }));

app.listen(PORT, () => console.log(`Marvão server on port ${PORT} | data: ${DATA_FILE}`));
