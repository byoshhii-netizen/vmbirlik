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
const files = [];
const folders = [];
const settings = {
  brand: { name: 'Vecd ile Müdafaa Birliği', eyebrow: 'VMB / 01', heroTitle: 'Hafıza, irade ve müşterek bir istikamet.', heroText: 'Vecd ile Müdafaa Birliği; düşünceyi, belleği ve üretimi ortak bir zeminde buluşturan bağımsız bir topluluktur.', quote: 'Birlik, aynı sesi yükseltmek değil; aynı sorumluluğu taşımaktır.' },
  about: { title: 'Hakkımızda', body: 'VMB; fikir, emek ve arşiv kültürü etrafında buluşan insanların açık çalışma alanıdır.' },
  contact: { title: 'İletişim', links: [] },
  security: { redirectMode: 'internal', restrictedRedirect: '/', redirectTarget: '/', redirectRoutes: ['/admin', '/yonetim', '/yonetici', '/yonet'], filesVisible: true, filesPasswordEnabled: false, filesPassword: '' }
};
const id = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const upload = multer({ storage: multer.memoryStorage() });
app.use(express.json());
app.use(session({ secret: 'vmb-local-preview', resave: false, saveUninitialized: false }));
const adminOnly = (req, res, next) => req.session.isAdmin ? next() : res.status(401).json({ error: 'Yetkili oturumu gerekli.' });
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    const routes = Array.isArray(settings.security.redirectRoutes) ? settings.security.redirectRoutes : ['/admin', '/yonetim', '/yonetici', '/yonet'];
    const matched = routes.find(route => req.path === route || req.path.startsWith(`${route.replace(/\/$/, '')}/`));
    if (matched) { security.unshift({ ip_address: req.ip === '::1' ? '127.0.0.1 (localhost)' : (req.ip || '127.0.0.1'), route: req.path, kind: 'admin_route_attempt', user_agent: req.get('user-agent') || 'Yerel önizleme', created_at: new Date().toISOString() }); const target = String(settings.security.redirectTarget || settings.security.restrictedRedirect || '/').trim(); return res.redirect(settings.security.redirectMode === 'external' && target ? (/^https?:\/\//i.test(target) ? target : `https://${target}`) : (target.startsWith('/') ? target : '/')); }
  }
  next();
});
app.get('/api/site', (_req, res) => res.json({
  settings, announcements, team
}));
app.get('/api/files', (req, res) => {
  if (settings.security.filesVisible !== true) return res.status(404).json({ error: 'Dosyalar alanı kapalı.' });
  if (settings.security.filesPasswordEnabled === true && (!settings.security.filesPassword || (!req.session.filesUnlocked && !req.session.isAdmin))) return res.status(401).json({ locked: true });
  const folderId = req.query.folder || null;
  const folder = folders.find(x => x.id === folderId);
  if (folder?.password && !req.session.unlockedFolders?.includes(folder.id) && !req.session.isAdmin) return res.status(401).json({ lockedFolder: true, folder: { id: folder.id, name: folder.name } });
  const search = String(req.query.search || '').toLowerCase();
  res.json({ folders: folders.map(x => ({ id: x.id, name: x.name, locked: Boolean(x.password) })), documents: files.filter(x => (x.folder_id || null) === folderId && (!search || `${x.title} ${x.body}`.toLowerCase().includes(search))), folder: folder ? { id: folder.id, name: folder.name } : null });
});
app.post('/api/files/folders/unlock', (req, res) => { const folder = folders.find(x => x.id === req.body.folderId); if (!folder || folder.password !== req.body.password) return res.status(401).json({ error: 'Klasör şifresi doğrulanamadı.' }); req.session.unlockedFolders = [...new Set([...(req.session.unlockedFolders || []), folder.id])]; res.json({ ok: true }); });
app.post('/api/files/unlock', (req, res) => {
  if (settings.security.filesPasswordEnabled !== true || !settings.security.filesPassword || req.body.password !== settings.security.filesPassword) return res.status(401).json({ error: 'Şifre doğrulanamadı.' });
  req.session.filesUnlocked = true;
  res.json({ ok: true });
});
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
  const data = { archives, announcements, team, files, folders: folders.map(x => ({ id: x.id, name: x.name, locked: Boolean(x.password) })), security, creators: archives.map((a, i) => ({ ip_address: 'Yerel önizleme', archive_count: 1, archive_reads: 0, created_at: a.created_at, last_archive_at: a.updated_at, number: i + 1 })), bans: [], settings: Object.entries(settings).map(([key, value]) => ({ key, value, updated_at: new Date().toISOString() })) };
  if (!(req.params.resource in data)) return res.sendStatus(404);
  res.json(data[req.params.resource]);
});
app.put('/api/admin/settings/:key', adminOnly, (req, res) => { settings[req.params.key] = req.body; res.json({ ok: true }); });
app.put('/api/admin/files/security', adminOnly, (req, res) => { settings.security.filesVisible = req.body.visible === true; settings.security.filesPasswordEnabled = req.body.passwordEnabled === true; if (req.body.password) settings.security.filesPassword = req.body.password; if (settings.security.filesPasswordEnabled && !settings.security.filesPassword) return res.status(400).json({ error: 'Şifre korumasını açmak için şifre girin.' }); res.json({ ok: true }); });
app.post('/api/admin/files', adminOnly, upload.single('file'), (req, res) => { const item = { id: id(), title: String(req.body.title || 'Başlıksız dosya'), body: String(req.body.body || ''), folder_id: req.body.folder_id || null, media_url: null, sort_order: Number(req.body.sort_order || 0), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }; files.push(item); res.status(201).json(item); });
app.get('/api/admin/folders', adminOnly, (_req, res) => res.json(folders.map(x => ({ id: x.id, name: x.name, locked: Boolean(x.password) }))));
app.post('/api/admin/folders', adminOnly, (req, res) => { const item = { id: id(), name: String(req.body.name || 'Yeni klasör'), password: String(req.body.password || ''), sort_order: Number(req.body.sort_order || 0) }; folders.push(item); res.status(201).json({ id: item.id, name: item.name, locked: Boolean(item.password) }); });
app.patch('/api/admin/files/:id', adminOnly, (req, res) => { const item = files.find(x => x.id === req.params.id); if (!item) return res.sendStatus(404); Object.assign(item, { title: req.body.title || item.title, body: req.body.body || '', sort_order: Number(req.body.sort_order || 0), updated_at: new Date().toISOString() }); res.json({ ok: true }); });
app.delete('/api/admin/files/:id', adminOnly, (req, res) => { const index = files.findIndex(x => x.id === req.params.id); if (index < 0) return res.sendStatus(404); files.splice(index, 1); res.json({ ok: true }); });
app.post('/api/admin/announcements', adminOnly, (req, res) => { const item = { id: id(), ...req.body, active: true, created_at: new Date().toISOString() }; announcements.unshift(item); res.status(201).json(item); });
app.post('/api/admin/team', adminOnly, (req, res) => { const item = { id: id(), ...req.body, visible: true }; team.push(item); res.status(201).json(item); });
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(port, () => console.log(`VMB preview running at http://localhost:${port}`));
