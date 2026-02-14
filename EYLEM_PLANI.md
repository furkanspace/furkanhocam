# Halilhoca.com — Dijital Dönüşüm Eylem Planı

> **Kaynak:** `feedback.docx` — Profesyonel Strateji Raporu
> **Vizyon:** "Turnuva Takip" sitesinden tam bir EdTech eğitim ekosistemine dönüşüm

---

## 🎯 Stratejik Yol Haritası (12 Ay)

| Çeyrek | Odak | Kritik Adımlar |
|--------|------|----------------|
| **Q1** | Altyapı | Redis, WebSocket, güvenlik, performans optimizasyonu |
| **Q2** | Oyunlaştırma | Beceri ağaçları, rozet sistemi, XP/seviye mekanikleri |
| **Q3** | Turnuva Ligleri | Günlük/haftalık turnuvalar, lig sistemi, oyun modülleri |
| **Q4** | Yapay Zeka | Akıllı soru önerisi, analitik dashboard, kişiselleştirme |

---

## 📌 Öncelik Sıralaması

### 🔴 Hemen Yapılabilecekler
- [x] ~~Navigasyon genişletme (5 ana sekme)~~ ✅
- [x] ~~Dashboard sayfası (öğrenci kontrol paneli)~~ ✅
- [x] ~~Soru bankası + günlük quiz~~ ✅
- [x] ~~Rozet/Başarı sistemi (20 rozet + birleşik XP)~~ ✅

### 🟡 Kısa Vadeli (Q1-Q2)
- [x] ~~Beceri ağaçları (Skill Trees) — Duolingo tarzı ilerleme haritası (10 ünite × 7 adım/sınıf)~~ ✅
- [ ] Beceri ağacı içerik yönetimi — Her adıma soru, kelime, ses, alıştırma ekleme (Admin paneli + StepContent modeli)
- [ ] XP/seviye sistemi genişletme (quiz dışı XP kaynakları)
- [x] ~~Turnuva sekmesini lig sistemiyle güçlendirme (Bronz/Gümüş/Altın/Platin/Elmas)~~ ✅
- [x] ~~Günlük turnuvalar (10-15 soru, belirli saatte açılan yarışmalar)~~ ✅
- [ ] Redis tabanlı gerçek zamanlı leaderboard

### 🟢 Orta Vadeli (Q2-Q3)
- [ ] WebSocket entegrasyonu (anlık bildirimler, canlı turnuva güncellemeleri)
- [ ] Öğrenci ilerleme grafikleri ve yetenek ağacı görselleştirme
- [x] ~~Haftalık ligler (üst lige çıkma/düşme riski)~~ ✅
- [ ] Büyük deneme sınavı simülasyonu + dijital sertifika
- [ ] Kelime oyunları, gramer bulmacaları, interaktif egzersizler

### 🔵 Uzun Vadeli (Q3-Q4)
- [ ] AI destekli soru önerisi (öğrencinin zayıf konularına göre)
- [ ] Isı haritaları ve hata dökümü analitiği
- [ ] A/B testleri (hız bazlı vs doğruluk bazlı puanlama)
- [ ] Video CDN entegrasyonu (CloudFront/Cloudflare Stream)
- [ ] OpenBadges/Badgr entegrasyonu (paylaşılabilir rozetler)

---

## 🏗️ Teknik Mimari Önerileri

### Mevcut Stack
```
Frontend: React.js + Vite + Framer Motion
Backend:  Node.js + Express + MongoDB
Deploy:   Docker + DigitalOcean
```

### Önerilen Eklemeler
| Teknoloji | Kullanım Alanı |
|-----------|---------------|
| **Redis** | Liderlik tabloları, oturum yönetimi, önbellekleme |
| **Socket.io** | Gerçek zamanlı turnuva güncellemeleri, canlı bildirimler |
| **CDN** | Video dersler için düşük gecikmeli içerik dağıtımı |
| **Phaser.js** | Tarayıcı tabanlı eğitim oyunları |

---

## 🎮 Oyunlaştırma Stratejisi (Octalysis Framework)

### Temel Mekanikler
1. **Beceri Ağaçları** — Lineer ders listesi yerine RPG tarzı ilerleme haritası
2. **Seri (Streak)** — Günlük çalışma alışkanlığı ödüllendirme ✅ (Quiz'de uygulandı)
3. **Rozetler** — 20 rozet (10 ders + 10 quiz), ilerleme çubuğu ✅
4. **Lig Sistemi** — Bronz → Gümüş → Altın → Platin → Elmas sıralama yapısı ✅
5. **Sosyal Kanıt** — Başarı hikayeleri ve ilerleme grafikleri

### XP Kaynakları (Mevcut + Planlanan)
| Kaynak | XP | Durum |
|--------|-----|-------|
| Günlük Quiz doğru cevap | 5 XP/soru | ✅ Aktif |
| Quiz streak bonusu | 2 XP × gün | ✅ Aktif |
| Ders tamamlama | 10 XP/ders, 15 XP/telafi | ✅ Aktif |
| Turnuva katılımı | 20-100 XP | 📋 Planlanan |
| Rozet kazanma | 50 XP | 📋 Planlanan |

---

## 🔐 Güvenlik ve Kalite

- [ ] KVKK / GDPR uyumluluğu
- [ ] Video DRM koruması (izinsiz indirme engeli)
- [ ] Turnuva anti-cheat sistemi (bot algılama, soru karıştırma)
- [ ] Yük testleri (sınav dönemi trafik simülasyonu)
- [ ] WCAG 2.1 erişilebilirlik standartları

---

## 👥 Navigasyon Yapısı

| Sekme | Açıklama | Durum |
|-------|----------|-------|
| **Dashboard** | Aktif kurslar, yaklaşan turnuvalar, günlük hedef | ✅ |
| **Kütüphane** | Video ve PDF arşivi, filtrelenebilir dersler | ✅ |
| **Arena** | Turnuvalar, lig sıralamaları | ✅ |
| **Quiz** | Günlük quiz, soru bankası | ✅ |
| **Beceri Ağacı** | Duolingo tarzı ilerleme yolu, 7 adımlı ünite sistemi | ✅ |
| **Profil** | Rozetler, yetenek ağacı, kişisel istatistikler | ✅ |
| **Eğitim** | Ders takibi, öğretmene soru sorma | ✅ |
| **Atölye** | Kelime oyunları, interaktif egzersizler | 📋 Planlanan |

---

## 📊 Hedef Metrikler

| Metrik | Mevcut (Tahmini) | Hedef (12 ay) |
|--------|------------------|---------------|
| Günlük aktif kullanıcı | ~20 | 200+ |
| Ders tamamlama oranı | ~10% | 40-50% |
| Ort. oturum süresi | ~5 dk | 15+ dk |
| Quiz katılım oranı | Yeni | %60+ |

---

*Bu plan `feedback.docx` strateji raporuna dayanmaktadır. Düzenli olarak güncellenmeli ve sprint planlamasına entegre edilmelidir.*
