# Ops Control — Technical Assignment Fullstack Developer (Sucofindo Theme)

**Proof of Concept | React (Vite) + Golang + SQLite + SSE + Docker**

Aplikasi manajemen operasional terpadu yang mengintegrasikan **Real-Time Order & Job Tracking (Case Study 1)** dan **Manajemen Produksi & Inventori Berbasis BOM (Case Study 2)** untuk studi kasus operasional PT Sucofindo.

---

## 1. Cara Menjalankan Project

### Opsi A: Menggunakan Docker (Direkomendasikan — Satu Perintah)
Pastikan Docker dan Docker Compose sudah terinstal, lalu jalankan perintah berikut pada *root* direktori proyek:
```bash
docker compose up --build
```
- **Frontend (UI):** http://localhost:5173
- **Backend API:** http://localhost:8080
- **Health Check:** http://localhost:8080/health

### Opsi B: Menjalankan Secara Lokal (Manual)
Jika dijalankan tanpa Docker, pastikan **Go (v1.21+)** dan **Node.js (v18+)** sudah terinstal. Jalankan menggunakan **dua terminal terpisah**:

**1. Terminal 1 — Backend (Golang):**
```bash
cd backend
go mod tidy
go run main.go
```
*Server API akan aktif di `http://localhost:8080` (database SQLite `poc.db` beserta dummy/seed data otomatis dibuat saat pertama kali jalan).*

**2. Terminal 2 — Frontend (React + Vite):**
```bash
cd frontend
npm install
npm run dev
```
*Antarmuka web dapat diakses melalui `http://localhost:5173`.*

---

## 2. Daftar Asumsi Desain (Assumptions)
*(Rincian selengkapnya merujuk pada Deliverable A — Technical Design Document)*

1. **Aktor & Hak Akses:** Terdiri dari 4 peran (*Klien, Dispatcher, Teknisi, Staf Gudang*). Pada tingkat PoC, mekanisme login/JWT disederhanakan tanpa RBAC ketat; identitas peran disimulasikan melalui *header* atau skema navigasi interaktif.
2. **Alur Status Order (Case 1):** Transisi status yang sah adalah `TODO` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `DONE`. Pembatalan (`CANCELLED`) hanya diperbolehkan saat status masih `TODO` atau `IN_PROGRESS`. Status `DONE` dan `CANCELLED` bersifat terminal (terkunci mutlak).
3. **Ketentuan Work Order & BOM (Case 2):** Satu Work Order (WO) memproduksi satu Produk Jadi. Struktur BOM pada PoC diasumsikan *single-level* (tanpa *sub-assembly* rekursif), dan kuantitas material tidak boleh bernilai nol atau negatif.
4. **Satuan Material (Unit of Measure):** Seluruh material di database disimpan dalam satuan dasar terkecil (*base unit* seperti `kg`, `pcs`, `liter`). Konversi satuan kompleks diasumsikan terjadi di lapisan antarmuka sebelum payload dikirim.

---

## 3. Status Pengerjaan (Implementation Status)

| Komponen / Fitur | Status | Keterangan |
| :--- | :---: | :--- |
| **Order Tracking (CRUD & Status Transition)** | ✅ Selesai | Endpoint pembuatan order, pembaruan status, dan validasi transisi dasar terimplementasi. |
| **Real-Time Broadcast (SSE)** | ✅ Selesai | Server-Sent Events (SSE) terhubung secara *live* antara Golang Hub dan React `EventSource`. |
| **Inventory & BOM Explosion** | ✅ Selesai | Pemisahan kalkulasi stok `On Hand`, `Reserved`, dan `Available` serta validasi stok saat pembuatan WO. |
| **Atomic Work Order Completion** | ✅ Selesai | Pemotongan stok bahan baku dan penambahan stok barang jadi dibungkus dalam satu transaksi SQLite. |
| **Environment Docker Compose** | ✅ Selesai | Konfigurasi *multi-container* (Frontend Nginx + Backend Go) siap dijalankan dengan satu perintah. |
| **Frontend State & Simulasi Interaktif** | ⚠️ Sebagian Di-mock | UI React dilengkapi dengan *fallback/simulated state* lokal agar alur *event timeline*, *BOM snapshot*, dan *optimistic lock* dapat langsung diuji secara interaktif. |
| **Cancel WO, Replay SSE & Optimistic Lock DB** | 📋 Rancangan Arsitektur | Skema `Last-Event-ID` *replay*, `Idempotency-Key` *unique constraint*, pengecekan `expected_version` di SQL, dan pembatalan WO telah dirancang di dokumen teknis (Deliverable A) untuk skala produksi. |

---

## 4. Known Limitations (Batasan Sistem)

1. **Konkurensi Write pada SQLite:** PoC menggunakan SQLite *single-file* (`poc.db`) demi kemudahan *setup* tanpa instalasi server database eksternal. Untuk beban transaksi tulis konkuren yang tinggi di produksi, diperlukan migrasi ke **PostgreSQL** dengan *row-level locking* (`SELECT FOR UPDATE`).
2. **Single-Instance SSE Hub:** *Broadcast* SSE saat ini disimpan di memori (*in-memory channel*) pada satu *instance* Golang. Jika aplikasi di-*scale* ke banyak pod/container, diperlukan **Redis Pub/Sub** agar *event* tersinkronisasi antar *instance*.
3. **Belum Ada Autentikasi & Otorisasi Ketat:** Belum menerapkan JWT atau pembatasan akses per peran di sisi *middleware* API sesuai ruang lingkup PoC.
4. **Skenario Produksi Lanjutan:** Fitur penyelesaian produksi bertahap (*Partial Completion*), pencatatan barang rusak (*Scrap*), dan penyesuaian fisik (*Stock Opname*) belum diimplementasikan di kode PoC.

---

## 5. Daftar Endpoint API

| Method | Endpoint | Deskripsi | Contoh Payload / Parameter |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Memeriksa status kesehatan server backend | — |
| `GET` | `/api/orders` | Mengambil daftar seluruh order beserta status terkininya | — |
| `POST` | `/api/orders` | Membuat order pengujian/inspeksi baru | `{"client_name": "PT ABC", "technician": "Budi"}` |
| `POST` | `/api/orders/status` | Memperbarui status order (`IN_PROGRESS`, `DONE`, `CANCELLED`) | `{"order_id": "ORD-1001", "status": "IN_PROGRESS"}` |
| `GET` | `/api/orders/stream` | Saluran *Server-Sent Events* (SSE) untuk *update* status *real-time* | Query opsional: `?last_event_id=1` |
| `GET` | `/api/materials` | Mengambil daftar stok bahan baku (`on_hand`, `reserved`, `available`) | — |
| `GET` | `/api/products` | Mengambil daftar master produk jadi beserta resep BOM-nya | — |
| `GET` | `/api/work-orders` | Mengambil daftar seluruh Work Order (WO) produksi | — |
| `POST` | `/api/work-orders` | Membuat WO baru dan melakukan reservasi stok bahan baku secara atomik | `{"product_id": "PRD-MEJA", "quantity": 2}` |
| `POST` | `/api/work-orders/complete` | Menyelesaikan WO (memotong stok bahan baku & menambah produk jadi) | `{"work_order_id": "WO-2024-001"}` |