# 📖 PANDUAN PENGGUNAAN — Rebate Validator

## Daftar Isi
1. [Instalasi & Deploy](#1-instalasi--deploy)
2. [Setup Awal](#2-setup-awal)
3. [Upload Data](#3-upload-data)
4. [Menjalankan Validasi](#4-menjalankan-validasi)
5. [Membaca Hasil](#5-membaca-hasil)
6. [Mengelola Program Sell Out](#6-mengelola-program-sell-out)
7. [Mengelola Program Display](#7-mengelola-program-display)
8. [Dashboard & Filter](#8-dashboard--filter)
9. [Closing Sell Out](#9-closing-sell-out)
10. [Tips & Troubleshooting](#10-tips--troubleshooting)

---

## 1. Instalasi & Deploy

### Persiapan
- Akun Google dengan akses Google Sheets
- Browser modern (Chrome/Edge/Firefox)

### Langkah Install
1. Buka **Google Sheets** baru (blank)
2. Klik **Extensions → Apps Script**
3. Hapus semua kode default di `Code.gs`
4. Buka https://github.com/NobbyEls/fileku/blob/main/Code.gs
5. Klik tombol **Raw** → **Ctrl+A** → **Ctrl+C** → paste ke Apps Script
6. Buat file baru: klik **+** → pilih **HTML** → beri nama **`index`** (tanpa .html)
7. Buka https://github.com/NobbyEls/fileku/blob/main/index.html
8. Klik **Raw** → **Ctrl+A** → **Ctrl+C** → paste ke file `index`
9. **Ctrl+S** (Save)

### Deploy sebagai Web App
1. Klik **Deploy → New deployment**
2. Klik ikon gear → pilih **Web app**
3. Isi:
   - Description: `Rebate Validator`
   - Execute as: **Me**
   - Who has access: **Anyone** (atau Anyone within your organization)
4. Klik **Deploy**
5. Klik **Authorize access** → pilih akun → Allow
6. **Salin URL** yang muncul → buka di browser

> **Penting:** Setiap kali update kode, lakukan: Deploy → Manage deployments → Edit (pensil) → Version: **New version** → Deploy

---

## 2. Setup Awal

Setelah pertama kali deploy:

1. Buka Google Sheet yang tadi
2. Klik menu **🔧 Rebate Tools → 📋 Setup Sheet**
3. Sistem akan membuat semua sheet yang diperlukan:
   - ⚙️ SETTING
   - 📦 Data Penjualan
   - 📋 Acer/Asus/Lenovo/HP Data
   - ✅ Hasil Validasi
   - 📊 Summary Rebate
   - 📦 Stok
   - 📺 Display

4. Isi **sheet 📦 Stok** dengan data stok Anda:

| A (Kode Barang) | B (Belum Claim) | C (Sudah Claim) | D (Total Stok) |
|---|---|---|---|
| NB-AS-A1407QA-VIPSP151M | 4 | 2 | 6 |

---

## 3. Upload Data

### A. Upload Data POS (Penjualan Toko)

Buka tab **Upload Data** → bagian **POS / Kasir**

**Format file POS yang didukung:** CSV atau XLSX dengan struktur:
- Baris 1: Judul (diabaikan)
- Baris 2: Header kolom
- Baris 3+: Data

| Kolom | Isi |
|---|---|
| C | Tanggal |
| E | No. Dokumen |
| G | Nama Pelanggan |
| I | Cabang |
| K | Departemen |
| M | Kode Barang (SKU) |
| O | Nama Barang |
| Q | Sales |
| S | Qty |
| U | @Harga |
| W | **Nomor Seri** |

> **Multi-SN:** Jika kolom W berisi beberapa SN dipisah koma (contoh: `SN001, SN002, SN003`), sistem otomatis memecahnya jadi baris terpisah saat upload.

**Cara upload:**
1. Klik area drop atau drag file ke area
2. Tunggu preview muncul ("file.xlsx - 500 baris siap upload")
3. Klik **Upload**
4. Tunggu notifikasi "Upload berhasil"

### B. Upload Data Verifikasi Brand

Untuk setiap brand (Acer/Asus/Lenovo/HP):
1. Klik area drop di bagian brand yang sesuai
2. Pilih file verifikasi dari brand
3. Klik **Upload**

**Kolom penting per brand:**

| Brand | SN ada di kolom | Tanggal di kolom | Status di kolom |
|---|---|---|---|
| Acer | M (13) | J (10) | - |
| Asus | N (14) | K (11) | O (15) → harus "point is valid" |
| Lenovo | C (3) | H (8) | E (5) → bukan "DITOLAK" |
| HP | AB (28) | Y (25) | AN (40) → harus "valid" |

---

## 4. Menjalankan Validasi

1. Buka tab **Hasil Validasi**
2. Klik tombol **▶ Jalankan Validasi**
3. Tunggu proses selesai (notifikasi: "Validasi selesai: X SN diproses")

### Apa yang terjadi saat validasi:
```
Setiap SN di data POS dicek:
  ✓ SKU terdaftar di program aktif?
  ✓ Tanggal jual masuk periode program?
  ✓ SN tidak duplikat dalam program?
  ✓ SN ditemukan di data brand?
  ✓ Status brand: diterima?
  → Semua lolos = VALID (rebate dihitung)
```

### Status hasil:
| Status | Arti |
|---|---|
| ✅ VALID | Lolos semua — rebate dihitung |
| ❌ TIDAK DITEMUKAN | SN tidak ada di data brand |
| ❌ DITOLAK BRAND | SN ada tapi ditolak brand |

> SN yang tanggal jualnya di luar periode atau duplikat **tidak muncul** di hasil (di-skip).

---

## 5. Membaca Hasil

### Tab Hasil Validasi
- Tabel lengkap semua SN + status + program + rebate
- **Filter:** Brand, Status, atau cari SN/No.Dok/SKU
- **Summary bar:** jumlah Valid/Ditolak/Tidak Ditemukan + Total Rebate

### Tab Laporan SN
- Sama seperti Hasil tapi fokus pada kolom **Alasan/Keterangan**
- Berguna untuk mengetahui kenapa SN ditolak

### Tab Detail Program
- Kartu per program dengan statistik
- Klik **📦 Daftar SKU** → lihat SKU + Rebate + Stok
- Klik **📊 Detail SN** → lihat semua SN program tersebut

---

## 6. Mengelola Program Sell Out

Buka tab **Promo Sell Out**

### Tambah Program Baru
1. Klik **+ Tambah Program**
2. Isi form:
   - **Nama Program** (contoh: "Q2'26 Vivobook Promo")
   - **Brand** (ACER/ASUS/LENOVO/HP)
   - **Tanggal Mulai** dan **Tanggal Akhir**
   - **Status Aktif** (YES/NO)
3. Tambah SKU:
   - **Manual:** Klik "+ Tambah SKU Manual" → isi Kode SKU + Rebate
   - **Import Excel:** Klik "Import dari Excel" → format file:

| Kolom A (Kode SKU) | Kolom B (Rebate) |
|---|---|
| NB-AS-A1407QA-VIPSP151M | 1500000 |
| NB-AS-FA506NCG-R735BIT-HM | 1000000 |

4. Klik **Simpan Program**

### Edit Program
- Klik tombol **Edit** di baris program → form terbuka dengan data terisi

### Hapus Program
- Klik tombol **Hapus** → konfirmasi

### Aturan Otomatis
- Program yang **tanggal akhirnya sudah lewat** otomatis jadi **⏰ Kadaluarsa**
- Program kadaluarsa **tidak ikut** proses validasi

---

## 7. Mengelola Program Display

Buka tab **Promo Display**

Program Display terpisah dari Sell Out — untuk memantau produk display yang ditempatkan di toko.

### Tambah Program Display
1. Klik **+ Tambah Program Display**
2. Isi:
   - **Nama Program**
   - **Brand**
   - **Tanggal Mulai** dan **Tanggal Berakhir**
3. Tambah item (SKU + Serial Number + Nilai):
   - **Manual:** Klik "+ Tambah Manual" → isi SKU, SN, Nilai
   - **Import Excel:** Format file:

| Kolom A (SKU) | Kolom B (Serial Number) | Kolom C (Nilai Rp) |
|---|---|---|
| NB-AC-A715-59G | NHQX0SN002549004720X15 | 500000 |
| NB-AC-AG14-71M | NXJFWSN001519016919601 | 750000 |

4. Klik **Simpan**

### Informasi yang ditampilkan per program:
- Total SN terdaftar
- Total Nilai (sum semua item)
- Sisa hari sebelum berakhir
- Tabel detail: SKU + SN + Nilai per item

### Filter
- **Semua** — tampilkan semua
- **Aktif** — yang belum berakhir
- **Berakhir** — yang sudah lewat

---

## 8. Dashboard & Filter

### Kartu Summary (Baris 1 — Sell Out)
| Kartu | Arti |
|---|---|
| Total SN Diproses | Semua SN yang masuk validasi |
| Valid | SN yang lolos = rebate didapat |
| Di Luar Periode | SN tanggal jualnya tidak masuk program |
| Ditolak / Tidak Ditemukan | SN gagal validasi |
| Total Rebate | Total rupiah dari SN valid |

### Kartu Summary (Baris 2 — Display)
| Kartu | Arti |
|---|---|
| Jumlah Produk Display | Total unit yang sedang dipajang |
| Total Rebate Display | Total nilai dari semua display aktif |

### Tooltip (Hover)
Arahkan kursor ke kartu → muncul popup detail:
- Per program (Total SN, Valid, Ditolak)
- Per brand + program (Total Rebate)

### Filter Dashboard
```
[Dari: tanggal]  [Sampai: tanggal]  [Brand: ▼]  [Terapkan]  [Reset]
```
- Semua kartu (Sell Out + Display) ter-update sesuai filter
- Bisa filter tanggal saja, brand saja, atau kombinasi

### Tabel Program Aktif
Gabungan Sell Out + Display dalam 1 tabel:
- Filter Tipe: Semua / Sell Out / Display
- Filter Brand: Semua / ACER / ASUS / LENOVO / HP
- Kolom: Nama, Tipe, Brand, SKU, Periode, **Sisa Hari**, Perolehan

**Warna Sisa Hari:**
- 🟢 Hijau: lebih dari 7 hari
- 🟡 Amber: 1-7 hari / hari ini
- 🔴 Merah: sudah berakhir

---

## 9. Closing Sell Out

Buka tab **Closing Sell Out** — untuk rekap closing program per bulan.

### Cara Pakai
1. Pilih **Brand** (opsional)
2. Pilih **Bulan** (contoh: Juni)
3. Pilih **Tahun** (contoh: 2026)
4. Klik **📊 Tampilkan**

Sistem menampilkan program Sell Out yang **tanggal akhirnya** masuk bulan+tahun yang dipilih.

### Drill-down 3 Level

**Level 1 — Tabel Rekap Program:**

| Nama Program | Brand | Periode | Jumlah SN | Valid | Ditolak | Total Rebate |
|---|---|---|---|---|---|---|

**Level 2 — Klik nama program → Detail per SKU:**

| SKU | Nilai/SKU | Total SN | Valid | Ditolak | Total Rebate |
|---|---|---|---|---|---|

**Level 3 — Klik SKU → Detail per Serial Number:**

| # | No. Dok | SN Toko | SN Brand | Status | Alasan |
|---|---|---|---|---|---|

---

## 10. Tips & Troubleshooting

### Tips Umum
- **Selalu upload POS terlebih dahulu**, baru upload data brand, baru jalankan validasi
- **Re-upload POS** jika ada data penjualan baru (data lama akan ditimpa)
- **Jalankan validasi ulang** setelah upload data baru atau ubah program
- Gunakan **Import Excel** untuk menambah banyak SKU sekaligus (lebih cepat dari manual)

### Kalau Dashboard menampilkan 0
- Pastikan sudah menjalankan **Validasi** setidaknya sekali
- Klik **Refresh** di tab tersebut

### Kalau validasi menghasilkan "TIDAK DITEMUKAN" padahal SN ada
- Pastikan **format SN persis sama** antara POS dan data brand (huruf besar/kecil)
- Untuk Lenovo: sistem otomatis cocokkan **8 digit terakhir**
- Pastikan data brand sudah di-upload (cek jumlah baris di tab Upload)

### Kalau Web App tidak bisa diakses
- Pastikan sudah deploy sebagai Web App (bukan hanya Save)
- Cek permission: Deploy → Manage deployments → Who has access

### Kalau muncul error setelah update kode
- Pastikan deploy **New version** (bukan pakai versi lama)
- Hard refresh browser: **Ctrl+Shift+R**
- Cek Console (F12) untuk detail error

### Batasan
- Google Apps Script: max 6 menit eksekusi per panggilan
- Spreadsheet: max ~10 juta sel per file
- Web App: hanya bisa diakses online (butuh koneksi internet)
- Untuk data > 5000 SN, proses validasi mungkin butuh ~15-30 detik

---

## Alur Kerja Harian (Rekomendasi)

```
HARIAN:
  1. Upload data POS terbaru
  2. Upload data verifikasi brand terbaru
  3. Jalankan Validasi
  4. Cek Dashboard → kartu summary
  5. Cek Laporan SN → lihat SN yang ditolak + alasannya

BULANAN:
  1. Buka Closing Sell Out
  2. Filter bulan + tahun + brand
  3. Klik program → drill-down ke SKU → ke SN
  4. Gunakan data ini untuk klaim ke brand

SAAT ADA PROGRAM BARU:
  1. Buka Promo Sell Out → Tambah Program
  2. Import SKU dari Excel
  3. Set periode mulai-akhir
  4. Simpan → langsung aktif di validasi berikutnya
```

---

## Kontak & Support

Repository: https://github.com/NobbyEls/fileku

Untuk update terbaru, selalu ambil file dari repository di atas.
