// PostgreSQL kurulmadan arayüzü yerelde incelemek için hafif önizleme sunucusu.
const express = require('express');
const multer = require('multer');
const session = require('express-session');
const path = require('path');
const app = express();
const port = Number(process.env.PORT || 3000);
const archives = [];
const announcements = [];
const team = [];
const security = [];
const settings = {
  brand: { name: 'Vecd ile Müdafaa Birliği', eyebrow: 'VMB / 01', heroTitle: 'Hafıza, irade ve müşterek bir istikamet.', heroText: 'Vecd ile Müdafaa Birliği; düşünceyi, belleği ve üretimi ortak bir zeminde buluşturan bağımsız bir topluluktur.', quote: 'Birlik, aynı sesi yükseltmek değil; aynı sorumluluğu taşımaktır.' },
  about: { title: 'Hakkımızda', body: 'VMB; fikir, emek ve arşiv kültürü etrafında buluşan insanların açık çalışma alanıdır.' },
  contact: { title: 'İletişim', links: [] }
};
const id = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const upload = multer({ storage: multer.memoryStorage() });
app.use(express.json());
app.use(session({ secret: 'vmb-local-preview', resave: false, saveUninitialized: false }));
const adminOnly = (req, res, next) => req.session.isAdmin ? next() : res.status(401).json({ error: 'Yetkili oturumu gerekli.' });
app.get('/api/site', (_req, res) => res.json({
  settings, announcements, team
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
app.post('/api/auth/login', (req, res) => {
  if ((req.body.username === 'yonetici' || !req.body.username) && req.body.password === '123123') { req.session.isAdmin = true; return res.json({ ok: true }); }
  res.status(401).json({ error: 'Bilgiler doğrulanamadı.' });
});
app.post('/api/auth/logout', (req, res) => req.session.destroy(() => res.json({ ok: true })));
app.get('/api/admin/dashboard', adminOnly, (_req, res) => res.json({ archives: archives.length, pending: archives.filter(x => x.status === 'pending').length, creators: archives.length, security: security.length }));
app.get('/api/admin/:resource', adminOnly, (req, res) => {
  const data = { archives, announcements, team, security, creators: archives.map((a, i) => ({ ip_address: 'Yerel önizleme', archive_count: 1, archive_reads: 0, created_at: a.created_at, last_archive_at: a.updated_at, number: i + 1 })), bans: [], settings: Object.entries(settings).map(([key, value]) => ({ key, value, updated_at: new Date().toISOString() })) };
  if (!(req.params.resource in data)) return res.sendStatus(404);
  res.json(data[req.params.resource]);
});
app.put('/api/admin/settings/:key', adminOnly, (req, res) => { settings[req.params.key] = req.body; res.json({ ok: true }); });
app.post('/api/admin/announcements', adminOnly, (req, res) => { const item = { id: id(), ...req.body, active: true, created_at: new Date().toISOString() }; announcements.unshift(item); res.status(201).json(item); });
app.post('/api/admin/team', adminOnly, (req, res) => { const item = { id: id(), ...req.body, visible: true }; team.push(item); res.status(201).json(item); });
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(port, () => console.log(`VMB preview running at http://localhost:${port}`));
