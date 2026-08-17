# Vecd ile Müdafaa Birliği (VMB)

Bağımsız Express + PostgreSQL uygulaması. Genel site, arşiv akışı, duyurular ve parolalı yönetim alanı içerir.

## Yerelde çalıştırma

1. `.env.example` dosyasını `.env` olarak kopyalayın ve PostgreSQL bağlantı adresini ekleyin.
2. `npm install`
3. `npm start`
4. `http://localhost:3000` adresini açın.

İlk yönetici hesabı `yonetici` kullanıcı adıdır. Yerel geliştirmede başlangıç parolası `123123` olabilir; canlı ortamda Railway `ADMIN_PASSWORD` değişkenini güçlü bir değerle ayarlayın ve ilk girişin ardından parolayı değiştirin.

## Railway değişkenleri

- `DATABASE_URL`: Railway PostgreSQL eklentisinin sağladığı bağlantı adresi
- `SESSION_SECRET`: uzun, rastgele gizli değer
- `ADMIN_PASSWORD`: yalnızca ilk kurulum için güçlü parola
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: medya yükleme için Cloudinary değerleri
- `NODE_ENV=production`

Cloudinary anahtarları veritabanına ya da tarayıcıya aktarılmaz; yalnızca Railway ortam değişkenlerinde tutulur. Silme akışı eklenmeden önce Cloudinary medya imhası için ayrıca yetki denetimi yapılmalıdır.

## Rotalar

- `/` ana sayfa
- `/arsiv` arşiv listesi ve arşiv talebi
- `/arsiv/:id` arşiv içeriği
- `/ekip`, `/hakkimizda`, `/duyurular`, `/iletisim`
- `/ahbiratasver` parolalı yönetim girişi

Yanlış yönetim yolları (`/admin`, `/yonet`, `/yonetim`) başka bir kuruma yönlendirilmez. Nötr bir erişim reddi ekranına gider ve yönetim güvenlik kayıtlarında tarih, yol ve IP bilgisi görünür. Bu veriler için yayımlanmış bir gizlilik bildirimi ve saklama süresi belirlemeniz gerekir.
