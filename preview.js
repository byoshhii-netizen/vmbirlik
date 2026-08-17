// PostgreSQL kurulmadan arayüzü yerelde incelemek için hafif önizleme sunucusu.
const express = require('express');
const path = require('path');
const app = express();
const port = Number(process.env.PORT || 3000);
app.use(express.json());
app.get('/api/site', (_req, res) => res.json({
  settings: {
    brand: { name: 'Vecd ile Müdafaa Birliği', eyebrow: 'VMB / 01', heroTitle: 'Hafıza, irade ve müşterek bir istikamet.', heroText: 'Vecd ile Müdafaa Birliği; düşünceyi, belleği ve üretimi ortak bir zeminde buluşturan bağımsız bir topluluktur.', quote: 'Birlik, aynı sesi yükseltmek değil; aynı sorumluluğu taşımaktır.' },
    about: { title: 'Hakkımızda', body: 'VMB; fikir, emek ve arşiv kültürü etrafında buluşan insanların açık çalışma alanıdır.' },
    contact: { title: 'İletişim', links: [] }
  }, announcements: [], team: []
}));
app.get('/api/archives', (_req, res) => res.json({ archives: [] }));
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(port, () => console.log(`VMB preview running at http://localhost:${port}`));
