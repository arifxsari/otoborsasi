const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = 3000;

const uploadDir = './public/uploads';
if (!fs.existsSync(uploadDir)){ fs.mkdirSync(uploadDir, { recursive: true }); }

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'arac_projesi_gizli_anahtar',
    resave: false, saveUninitialized: false
}));

const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, './public/uploads') },
    filename: function (req, file, cb) { cb(null, Date.now() + '-' + file.originalname) }
});
const upload = multer({ storage: storage });

app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

const db = new sqlite3.Database('./arac_veritabani.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT UNIQUE, password TEXT, role TEXT DEFAULT 'user')`);
    db.run(`INSERT OR IGNORE INTO users (id, name, email, password, role) VALUES (1, 'Sistem Yöneticisi', 'admin@admin.com', '123456', 'admin')`);
    db.run(`CREATE TABLE IF NOT EXISTS listings (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, category TEXT, brand TEXT, model TEXT, year INTEGER, mileage INTEGER, color TEXT, engine_power INTEGER, price INTEGER, city TEXT, district TEXT, description TEXT, images TEXT, FOREIGN KEY(user_id) REFERENCES users(id))`);
    db.run(`CREATE TABLE IF NOT EXISTS favorites (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, listing_id INTEGER, FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(listing_id) REFERENCES listings(id))`);
    
    db.run("ALTER TABLE listings ADD COLUMN views INTEGER DEFAULT 0", (err) => {});
    db.run("ALTER TABLE listings ADD COLUMN phone TEXT", (err) => {});
    db.run("ALTER TABLE listings ADD COLUMN damage_info TEXT DEFAULT '{}'", (err) => {});
});

// =======================================================
// YENİ: SİHİRLİ İLAN EKLEME (HACKER) LİNKİ
// =======================================================
app.get('/otomatik-ilan-ekle', (req, res) => {
    const ilanlar = [
        { category: 'Otomobil', brand: 'Fiat', model: 'Punto 1.4 Fire', year: 2015, mileage: 85000, color: 'Kırmızı', power: 77, price: 450000, city: 'İzmir', district: 'Bornova', phone: '0532 111 22 33', views: 145, images: 'https://images.unsplash.com/photo-1612825173281-9a193378527e?w=800&q=80', desc: 'Sahibinden temiz garaj arabası. Sadece sol ön çamurluk boyalı, harici hatasız.', damage: '{"sol_on_camurluk":"boyali"}' },
        { category: 'Otomobil', brand: 'Renault', model: 'Megane 1.5 dCi', year: 2020, mileage: 42000, color: 'Beyaz', power: 115, price: 950000, city: 'İstanbul', district: 'Kadıköy', phone: '0555 444 33 22', views: 89, images: 'https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=800&q=80', desc: 'Yetkili servis bakımlı, masrafsız aile aracı. Değişen kaput.', damage: '{"kaput":"degisen"}' },
        { category: 'Arazi, SUV & Pick-up', brand: 'Nissan', model: 'Qashqai 1.2 DIG-T', year: 2018, mileage: 60000, color: 'Siyah', power: 115, price: 1150000, city: 'Ankara', district: 'Çankaya', phone: '0533 222 11 00', views: 250, images: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80', desc: 'Cam tavanlı, full paket SUV. Tamamen orijinal.', damage: '{}' },
        { category: 'Motosiklet', brand: 'Yamaha', model: 'MT-07', year: 2022, mileage: 12000, color: 'Mavi', power: 74, price: 320000, city: 'Antalya', district: 'Muratpaşa', phone: '0544 333 22 11', views: 300, images: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=80', desc: 'Kazası trameri yoktur, kapalı garajda muhafaza edilmiştir.', damage: '{}' },
        { category: 'Otomobil', brand: 'Volkswagen', model: 'Golf 1.4 TSI', year: 2017, mileage: 95000, color: 'Gümüş', power: 125, price: 880000, city: 'Bursa', district: 'Nilüfer', phone: '0532 999 88 77', views: 65, images: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=800&q=80', desc: 'Highline donanım. Sağ iki kapı boyalı.', damage: '{"sag_on_kapi":"boyali","sag_arka_kapi":"boyali"}' },
        { category: 'Ticari Araçlar', brand: 'Ford', model: 'Transit Kamyonet', year: 2019, mileage: 140000, color: 'Beyaz', power: 130, price: 650000, city: 'İzmir', district: 'Buca', phone: '0530 123 45 67', views: 42, images: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800&q=80', desc: 'İşe hazır, ağır yük görmemiş transit.', damage: '{}' },
        { category: 'Otomobil', brand: 'Honda', model: 'Civic 1.6 i-VTEC', year: 2021, mileage: 35000, color: 'Mavi', power: 125, price: 1050000, city: 'İstanbul', district: 'Beşiktaş', phone: '0555 111 22 33', views: 180, images: 'https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?w=800&q=80', desc: 'Elegance paket, ilk sahibinden.', damage: '{}' },
        { category: 'Arazi, SUV & Pick-up', brand: 'Peugeot', model: '3008 1.5 BlueHDi', year: 2020, mileage: 55000, color: 'Beyaz', power: 130, price: 1450000, city: 'İzmir', district: 'Karşıyaka', phone: '0533 444 55 66', views: 210, images: 'https://images.unsplash.com/photo-1563720225384-9d0b4ba98de0?w=800&q=80', desc: 'GT-Line en dolu paket. Bagaj kapağı değişen.', damage: '{"bagaj":"degisen"}' },
        { category: 'Otomobil', brand: 'BMW', model: '320i ED Sport Line', year: 2016, mileage: 110000, color: 'Siyah', power: 170, price: 1350000, city: 'Ankara', district: 'Yenimahalle', phone: '0532 555 66 77', views: 400, images: 'https://images.unsplash.com/photo-1555353540-64fd1ebed847?w=800&q=80', desc: 'Borusan çıkışlı, ağır bakımları yapılmış. Ön tampon boyalı.', damage: '{"on_tampon":"boyali"}' },
        { category: 'Motosiklet', brand: 'Honda', model: 'PCX 125', year: 2023, mileage: 4500, color: 'Gri', power: 12, price: 145000, city: 'İzmir', district: 'Çiğli', phone: '0555 888 99 00', views: 95, images: 'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=800&q=80', desc: 'Şehir içi kullanım için ideal. Hatasız.', damage: '{}' },
        { category: 'Otomobil', brand: 'Mercedes-Benz', model: 'C 200 d AMG', year: 2018, mileage: 85000, color: 'Beyaz', power: 160, price: 1850000, city: 'İstanbul', district: 'Şişli', phone: '0530 777 88 99', views: 320, images: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80', desc: 'İmzalı seri, kusursuz temizlikte.', damage: '{}' },
        { category: 'Ticari Araçlar', brand: 'Fiat', model: 'Fiorino 1.3 Multijet', year: 2015, mileage: 180000, color: 'Beyaz', power: 75, price: 380000, city: 'Bursa', district: 'Osmangazi', phone: '0532 222 33 44', views: 30, images: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80', desc: 'Ekonomik ticari araç. Tavan hariç bel altı boyalı.', damage: '{"sol_on_camurluk":"boyali","sag_on_camurluk":"boyali","sol_on_kapi":"boyali","sag_on_kapi":"boyali"}' },
        { category: 'Otomobil', brand: 'Hyundai', model: 'i20 1.4 MPI', year: 2021, mileage: 25000, color: 'Kırmızı', power: 100, price: 820000, city: 'İzmir', district: 'Gaziemir', phone: '0544 555 66 77', views: 110, images: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fd?w=800&q=80', desc: 'Otomatik vites, bayan kullanıcıdan.', damage: '{}' },
        { category: 'Arazi, SUV & Pick-up', brand: 'Dacia', model: 'Duster 1.5 dCi', year: 2019, mileage: 90000, color: 'Turuncu', power: 110, price: 850000, city: 'Antalya', district: 'Kepez', phone: '0533 111 22 33', views: 160, images: 'https://images.unsplash.com/photo-1625049591416-0925e01bd20c?w=800&q=80', desc: '4x4 arazi aracı. Kaput ve sol çamurluk değişen.', damage: '{"kaput":"degisen","sol_on_camurluk":"degisen"}' },
        { category: 'Otomobil', brand: 'Audi', model: 'A3 Sportback', year: 2017, mileage: 75000, color: 'Siyah', power: 116, price: 1150000, city: 'İstanbul', district: 'Sarıyer', phone: '0532 888 77 66', views: 220, images: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80', desc: 'Design paket, cam tavan.', damage: '{}' },
        { category: 'Motosiklet', brand: 'Kawasaki', model: 'Ninja 400', year: 2021, mileage: 8000, color: 'Yeşil', power: 45, price: 280000, city: 'Ankara', district: 'Mamak', phone: '0555 333 44 55', views: 280, images: 'https://images.unsplash.com/photo-1568772585407-9361f9bfcec7?w=800&q=80', desc: 'Hatasız, bol ekstralı.', damage: '{}' },
        { category: 'Otomobil', brand: 'Toyota', model: 'Corolla 1.8 Hybrid', year: 2022, mileage: 15000, color: 'Beyaz', power: 122, price: 1250000, city: 'İzmir', district: 'Balçova', phone: '0530 444 55 66', views: 175, images: 'https://images.unsplash.com/photo-1623810435985-1d4e68e4af41?w=800&q=80', desc: 'Garantisi devam ediyor. Çok düşük yakıt tüketimi.', damage: '{}' },
        { category: 'Arazi, SUV & Pick-up', brand: 'Ford', model: 'Ranger 2.0 EcoBlue', year: 2021, mileage: 45000, color: 'Mavi', power: 213, price: 1750000, city: 'Bursa', district: 'Mudanya', phone: '0532 666 77 88', views: 310, images: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=800&q=80', desc: 'Wildtrak 4x4. Arka bagaj kapağı boyalı.', damage: '{"bagaj":"boyali"}' },
        { category: 'Otomobil', brand: 'Opel', model: 'Corsa 1.2', year: 2020, mileage: 50000, color: 'Kırmızı', power: 75, price: 720000, city: 'İstanbul', district: 'Maltepe', phone: '0544 111 22 33', views: 85, images: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80', desc: 'Temiz kullanılmış şehir arabası.', damage: '{}' },
        { category: 'Otomobil', brand: 'Skoda', model: 'Superb 1.5 TSI', year: 2019, mileage: 80000, color: 'Gri', power: 150, price: 1350000, city: 'Ankara', district: 'Etimesgut', phone: '0533 555 44 33', views: 190, images: 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&q=80', desc: 'Prestige paket, makam aracı kıvamında geniş iç hacim.', damage: '{}' }
    ];

    const stmt = db.prepare(`INSERT INTO listings (user_id, category, brand, model, year, mileage, color, engine_power, price, city, district, phone, views, damage_info, description, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    
    ilanlar.forEach(ilan => {
        stmt.run([1, ilan.category, ilan.brand, ilan.model, ilan.year, ilan.mileage, ilan.color, ilan.power, ilan.price, ilan.city, ilan.district, ilan.phone, ilan.views, ilan.damage, ilan.desc, ilan.images]);
    });
    
    stmt.finalize(() => {
        res.send(`
            <div style="background-color: #0f172a; color: white; text-align: center; font-family: sans-serif; padding: 50px;">
                <h1 style="color: #22c55e; font-size: 50px;">✅ BAŞARILI!</h1>
                <h2>20 adet harika ilan veritabanına başarıyla aktarıldı.</h2>
                <a href="/" style="display: inline-block; margin-top: 20px; padding: 15px 30px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 20px;">Vitrine Git ve Gör</a>
            </div>
        `);
    });
});
// =======================================================

// --- ROTALAR ---
app.get('/', (req, res) => {
    const { category, q, city, minPrice, maxPrice, minYear, maxYear, sort } = req.query;
    let page = parseInt(req.query.page) || 1;
    let limit = 9; 
    let offset = (page - 1) * limit; 
    let whereClause = "WHERE 1=1";
    let params = [];

    if (category) { whereClause += " AND category = ?"; params.push(category); }
    if (q) { whereClause += " AND (brand LIKE ? OR model LIKE ?)"; params.push(`%${q}%`, `%${q}%`); }
    if (city) { whereClause += " AND city LIKE ?"; params.push(`%${city}%`); }
    if (minPrice) { whereClause += " AND price >= ?"; params.push(minPrice); }
    if (maxPrice) { whereClause += " AND price <= ?"; params.push(maxPrice); }
    if (minYear) { whereClause += " AND year >= ?"; params.push(minYear); }
    if (maxYear) { whereClause += " AND year <= ?"; params.push(maxYear); }

    db.get(`SELECT COUNT(*) as count FROM listings ${whereClause}`, params, (err, countRow) => {
        let totalItems = countRow ? countRow.count : 0;
        let totalPages = Math.ceil(totalItems / limit);
        let query = `SELECT * FROM listings ${whereClause}`;
        
        if (sort === 'price_asc') { query += " ORDER BY price ASC"; } 
        else if (sort === 'price_desc') { query += " ORDER BY price DESC"; } 
        else if (sort === 'year_desc') { query += " ORDER BY year DESC"; } 
        else { query += " ORDER BY id DESC"; }

        query += " LIMIT ? OFFSET ?";
        let queryParams = [...params, limit, offset];

        db.all(query, queryParams, (err, rows) => {
            const listings = rows || [];
            db.all("SELECT * FROM listings ORDER BY views DESC LIMIT 3", [], (err, popRows) => {
                const popularListings = popRows || [];
                if (req.session.user) {
                    db.all("SELECT listing_id FROM favorites WHERE user_id = ?", [req.session.user.id], (err, favRows) => {
                        const userFavorites = (favRows || []).map(f => f.listing_id);
                        res.render('index', { listings, popularListings, filters: { category, q, city, minPrice, maxPrice, minYear, maxYear, sort }, userFavorites, currentPage: page, totalPages, totalItems });
                    });
                } else {
                    res.render('index', { listings, popularListings, filters: { category, q, city, minPrice, maxPrice, minYear, maxYear, sort }, userFavorites: [], currentPage: page, totalPages, totalItems });
                }
            });
        });
    });
});

app.get('/listing/:id', (req, res) => {
    db.run("UPDATE listings SET views = views + 1 WHERE id = ?", [req.params.id], () => {
        db.get(`SELECT listings.*, users.name as seller_name, users.email as seller_email FROM listings JOIN users ON listings.user_id = users.id WHERE listings.id = ?`, [req.params.id], (err, row) => {
            if (err || !row) return res.send("<h2>İlan bulunamadı.</h2>");
            if (req.session.user) {
                db.get("SELECT * FROM favorites WHERE user_id = ? AND listing_id = ?", [req.session.user.id, row.id], (err, fav) => {
                    res.render('listing-detail', { listing: row, isFavorite: !!fav });
                });
            } else {
                res.render('listing-detail', { listing: row, isFavorite: false });
            }
        });
    });
});

app.get('/toggle-favorite/:id', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    db.get("SELECT * FROM favorites WHERE user_id = ? AND listing_id = ?", [req.session.user.id, req.params.id], (err, row) => {
        if (row) { db.run("DELETE FROM favorites WHERE user_id = ? AND listing_id = ?", [req.session.user.id, req.params.id], () => res.redirect(req.get('referer') || '/')); } 
        else { db.run("INSERT INTO favorites (user_id, listing_id) VALUES (?, ?)", [req.session.user.id, req.params.id], () => res.redirect(req.get('referer') || '/')); }
    });
});
app.get('/favorites', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    db.all(`SELECT listings.* FROM listings JOIN favorites ON listings.id = favorites.listing_id WHERE favorites.user_id = ? ORDER BY favorites.id DESC`, [req.session.user.id], (err, rows) => {
        res.render('favorites', { listings: rows || [], userFavorites: (rows || []).map(r => r.id) });
    });
});

app.get('/register', (req, res) => res.render('register'));
app.post('/register', (req, res) => { db.run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'user')", [req.body.name, req.body.email, req.body.password], () => res.redirect('/login')); });
app.get('/login', (req, res) => res.render('login'));
app.post('/login', (req, res) => { db.get("SELECT * FROM users WHERE email = ? AND password = ?", [req.body.email, req.body.password], (err, user) => { if (user) { req.session.user = user; res.redirect('/'); } else { res.send("Hatalı giriş!"); } }); });
app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });

app.get('/add-listing', (req, res) => { if (!req.session.user) return res.redirect('/login'); res.render('add-listing'); });

app.post('/add-listing', upload.array('images', 15), (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    let imagePaths = req.files && req.files.length > 0 ? req.files.map(file => '/uploads/' + file.filename) : ['https://via.placeholder.com/600x400?text=Fotograf+Yok'];
    let damageData = req.body.damage_info || '{}';
    db.run(`INSERT INTO listings (user_id, category, brand, model, year, mileage, color, engine_power, price, city, district, phone, damage_info, description, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [req.session.user.id, req.body.category, req.body.brand, req.body.model, req.body.year, req.body.mileage, req.body.color, req.body.engine_power, req.body.price, req.body.city, req.body.district, req.body.phone, damageData, req.body.description, imagePaths.join(',')], () => res.redirect('/'));
});

app.get('/my-listings', (req, res) => { if (!req.session.user) return res.redirect('/login'); db.all("SELECT * FROM listings WHERE user_id = ? ORDER BY id DESC", [req.session.user.id], (err, rows) => { res.render('my-listings', { listings: rows || [] }); }); });
app.get('/delete-my-listing/:id', (req, res) => { if (!req.session.user) return res.redirect('/login'); db.run("DELETE FROM listings WHERE id = ? AND user_id = ?", [req.params.id, req.session.user.id], () => res.redirect('/my-listings')); });
app.get('/admin', (req, res) => { if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/'); db.all("SELECT * FROM listings ORDER BY id DESC", [], (err, rows) => res.render('admin', { listings: rows || [] })); });
app.get('/admin/delete/:id', (req, res) => { db.run("DELETE FROM listings WHERE id = ?", [req.params.id], () => res.redirect('/admin')); });
// =======================================================
// YENİ: İLAN DÜZENLEME (UPDATE) ROTALARI
// =======================================================
// 1. Düzenleme formunu ekrana getirme
app.get('/edit-listing/:id', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    // Sadece ilanın sahibi veya admin açabilir
    db.get("SELECT * FROM listings WHERE id = ? AND user_id = ?", [req.params.id, req.session.user.id], (err, row) => {
        if (err || !row) return res.send("<h2>Bu ilanı düzenleme yetkiniz yok veya ilan bulunamadı.</h2>");
        res.render('edit-listing', { listing: row });
    });
});

// 2. Düzenlenen verileri veritabanına kaydetme
app.post('/edit-listing/:id', upload.array('images', 15), (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    
    let updateQuery = `UPDATE listings SET category=?, brand=?, model=?, year=?, mileage=?, color=?, engine_power=?, price=?, city=?, district=?, phone=?, damage_info=?, description=?`;
    let params = [req.body.category, req.body.brand, req.body.model, req.body.year, req.body.mileage, req.body.color, req.body.engine_power, req.body.price, req.body.city, req.body.district, req.body.phone, req.body.damage_info || '{}', req.body.description];

    // Eğer kullanıcı yeni fotoğraf yüklediyse fotoğrafları da güncelle
    if (req.files && req.files.length > 0) {
        let imagePaths = req.files.map(file => '/uploads/' + file.filename);
        updateQuery += `, images=? WHERE id=? AND user_id=?`;
        params.push(imagePaths.join(','), req.params.id, req.session.user.id);
    } else {
        // Yeni fotoğraf yüklenmediyse eski fotoğraflar kalsın
        updateQuery += ` WHERE id=? AND user_id=?`;
        params.push(req.params.id, req.session.user.id);
    }

    db.run(updateQuery, params, () => res.redirect('/my-listings'));
});
// =======================================================
const port_numarasi = process.env.PORT || 3000;
app.listen(port_numarasi, () => {
    console.log(`Sistem ${port_numarasi} portunda başarıyla ayağa kalktı!`);
});