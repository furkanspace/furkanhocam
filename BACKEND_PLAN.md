# Backend Server Implementation Plan

## Hedef
Frontend'i Node.js + MongoDB backend'e bağlayarak:
- Birden fazla cihazdan aynı turnuvaya erişim
- Çoklu kullanıcı desteği
- Kalıcı veri saklama

---

## Mimari

```
┌─────────────┐     ┌──────────────┐     ┌───────────┐
│   Frontend  │────▶│  Node.js API │────▶│  MongoDB  │
│   (React)   │     │   (Express)  │     │           │
└─────────────┘     └──────────────┘     └───────────┘
```

---

## API Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/auth/login` | Kullanıcı girişi |
| GET | `/api/tournaments` | Tüm turnuvalar |
| POST | `/api/tournaments` | Yeni turnuva |
| PUT | `/api/tournaments/:id` | Turnuva güncelle |
| DELETE | `/api/tournaments/:id` | Turnuva sil |
| GET | `/api/trophies` | Kupalar |
| POST | `/api/trophies` | Kupa ekle |

---

## Maliyet Tahmini

| Kalem | Aylık |
|-------|-------|
| VPS (Hetzner CX11) | €4.51 |
| Domain (opsiyonel) | ~$1 |
| **Toplam** | **~$6/ay** |

---

## Zaman Tahmini: ~5-7 saat

---

## Kararlar Gerekli
1. VPS sağlayıcı seçimi (Hetzner önerilir)
2. Domain kullanılacak mı?
3. Sadece admin mi, herkes mi giriş yapabilecek?

---

*Bu plan ileride uygulanmak üzere saklanmıştır.*
