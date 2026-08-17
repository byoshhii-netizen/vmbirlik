// PostgreSQL kurulmadan arayüzü yerelde incelemek için hafif önizleme sunucusu.
const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();
const port = Number(process.env.PORT || 3000);
const archives = [];
const id = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const upload = multer({ storage: multer.memoryStorage() });
app.use(express.json());
app.get('/api/site', (_req, res) => res.json({
  settings: {
    brand: { name: 'Vecd ile Müdafaa Birliği', eyebrow: 'VMB / 01', heroTitle: 'Hafıza, irade ve müşterek bir istikamet.', heroText: 'Vecd ile Müdafaa Birliği; düşünceyi, belleği ve üretimi ortak bir zeminde buluşturan bağımsız bir topluluktur.', quote: 'Birlik, aynı sesi yükseltmek değil; aynı sorumluluğu taşımaktır.' },
    about: { title: 'Hakkımızda', body: 'VMB; fikir, emek ve arşiv kültürü etrafında buluşan insanların açık çalışma alanıdır.' },
    contact: { title: 'İletişim', links: [] }
  }, announcements: [], team: []
}));
app.get('/api/archives', (_req, res) => res.json({ archives }));
app.post('/api/archives', (req, res) => {
  const title = String(req.body?.title || '').trim();
  if (!title) return res.status(400).json({ error: 'Başlık gerekli.' });
  const archive = { id: id(), title, description: String(req.body.description || ''), visibility: 'private', status: 'pending', owner: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), items: [] };
  archives.unshift(archive);
  res.status(201).json({ archive });
});
app.get('/api/archives/:id', (req, res) => {
  const archive = archives.find(x => x.id === req.params.id);
  if (!archive) return res.status(404).json({ error: 'Arşiv bulunamadı.' });
  res.json({ archive, items: archive.items });
});
app.patch('/api/archives/:id/visibility', (req, res) => {
  const archive = archives.find(x => x.id === req.params.id);
  if (!archive) return res.status(404).json({ error: 'Arşiv bulunamadı.' });
  archive.visibility = req.body.visibility === 'public' ? 'public' : 'private';
  archive.status = archive.visibility === 'public' ? 'pending' : 'hidden';
  res.json({ ok: true });
});
app.post('/api/archives/:id/items', upload.single('file'), (req, res) => {
  const archive = archives.find(x => x.id === req.params.id);
  if (!archive) return res.status(404).json({ error: 'Arşiv bulunamadı.' });
  const item = { id: id(), kind: req.body.kind || 'text', title: req.body.title || 'Yeni kayıt', body: req.body.body || '', media_url: null };
  archive.items.push(item);
  res.status(201).json(item);
});
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(port, () => console.log(`VMB preview running at http://localhost:${port}`));
