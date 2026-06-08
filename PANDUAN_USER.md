# 📖 PANDUAN PENGGUNA — Rebate Validator

Panduan ini menjelaskan cara menggunakan setiap menu/tab di aplikasi dari sudut pandang pengguna.

---

## Navigasi Utama

Aplikasi memiliki **8 tab** di bagian atas:

| Tab | Fungsi |
|---|---|
| Dashboard | Ringkasan keseluruhan + filter |
| Upload Data | Upload file POS dan data brand |
| Hasil Validasi | Lihat semua SN yang sudah divalidasi |
| Laporan SN | Lihat detail alasan per SN |
| Detail Program | Lihat statistik per program + daftar SKU + stok |
| Promo Sell Out | Kelola program Sell Out (tambah/edit/hapus) |
| Promo Display | Kelola program Display (tambah/edit/hapus) |
| Closing Sell Out | Rekap closing per bulan untuk klaim ke brand |

Klik nama tab untuk berpindah halaman.

---

## 1. Dashboard

### Yang terlihat saat dibuka:
- **Baris kartu atas (Sell Out):** Total SN Diproses, Valid, Di Luar Periode, Ditolak, Total Rebate
- **Baris kartu bawah (Display):** Jumlah Produk Display, Total Rebate Display
- **Tabel Program Aktif:** daftar semua program yang sedang berjalan

### Cara melihat detail per kartu:
- **Arahkan kursor (hover)** ke salah satu kartu → muncul popup berisi breakdown per program
- Contoh: hover ke "Total Rebate" → muncul daftar: "ASUS | Program A = Rp 3.000.000"

### Cara filter data:
1. Isi **Dari** (tanggal mulai) dan **Sampai** (tanggal akhir)
2. Pilih **Brand** (opsional)
3. Klik **📊 Terapkan**
4. Semua kartu (Sell Out + Display) langsung ter-update
5. Klik **Reset** untuk kembali menampilkan semua data

### Cara filter tabel Program Aktif:
- Gunakan dropdown **Semua Tipe** → pilih "Sell Out" atau "Display"
- Gunakan dropdown **Semua Brand** → pilih brand tertentu
- Tabel langsung ter-filter

### Arti kolom Sisa Hari:
- Hijau "26 hari lagi" = masih lama
- Kuning "5 hari lagi" = segera berakhir
- Merah "Berakhir" = sudah lewat

---

## 2. Upload Data

### Cara upload data POS:
1. Klik tab **Upload Data**
2. Di bagian **POS / Kasir**, klik area bertuliskan "Klik atau drag file"
3. Pilih file CSV atau XLSX dari komputer
4. Setelah muncul preview ("file.xlsx - 500 baris siap upload"), klik **Upload**
5. Tunggu notifikasi hijau "Upload berhasil: xxx baris"

### Cara upload data brand (Acer/Asus/Lenovo/HP):
1. Scroll ke bawah di tab Upload Data
2. Klik area drop sesuai brand
3. Pilih file → klik **Upload**

### Catatan:
- Upload akan **menimpa data sebelumnya** (bukan menambah)
- Upload POS otomatis memecah SN yang digabung koma

---

## 3. Hasil Validasi

### Cara menjalankan validasi:
1. Klik tab **Hasil Validasi**
2. Klik tombol hijau **▶ Jalankan Validasi**
3. Tunggu proses selesai

### Cara membaca hasil:
- Tabel menampilkan semua SN + status (Valid/Ditolak/Tidak Ditemukan)
- **Summary bar** di atas tabel menunjukkan jumlah per status

### Cara mencari SN tertentu:
- Ketik nomor SN, No.Dok, atau kode SKU di **kotak pencarian** (kanan atas)
- Tabel langsung terfilter

### Cara filter berdasarkan brand atau status:
- Pilih brand di dropdown **Semua Brand**
- Pilih status di dropdown **Semua Status**

---

## 4. Laporan SN

### Cara menggunakan:
1. Klik tab **Laporan SN**
2. Data otomatis termuat

### Perbedaan dengan Hasil Validasi:
- Laporan SN menampilkan kolom **Alasan / Keterangan** yang lebih detail
- Berguna untuk mengetahui **kenapa** SN ditolak (contoh: "Status Asus: point expired")

### Cara filter:
- Sama seperti Hasil Validasi: pilih Brand, Status, atau ketik di kotak pencarian

---

## 5. Detail Program

### Cara menggunakan:
1. Klik tab **Detail Program**
2. Klik **📈 Muat Data Program**
3. Muncul kartu-kartu per program

### Yang ditampilkan per kartu:
- Jumlah Valid, Ditolak, Total SN, Total Rebate
- Progress bar (valid rate %)
- 2 tombol aksi

### Cara lihat daftar SKU + Stok:
1. Klik tombol **📦 Daftar SKU** di kartu program
2. Muncul popup berisi tabel:
   - Kode SKU
   - Rebate per unit
   - Total Stok
   - Belum Claim
   - Sudah Claim
3. Di bawah tabel ada ringkasan total

### Cara lihat detail SN per program:
1. Klik tombol **📊 Detail SN** di kartu program
2. Muncul popup berisi semua SN yang masuk program tersebut
3. Bisa filter per status (Valid/Ditolak) dan cari SN

### Cara mencari program:
- Ketik nama program di kotak pencarian di atas kartu

---

## 6. Promo Sell Out

### Cara menambah program baru:
1. Klik tab **Promo Sell Out**
2. Klik **+ Tambah Program**
3. Isi **Nama Program** dan pilih **Brand**
4. Isi **Tanggal Mulai** dan **Tanggal Akhir**
5. Tambah SKU:
   - **Cara manual:** Klik "+ Tambah SKU Manual" → isi Kode SKU dan Rebate
   - **Cara import:** Klik "📁 Import dari Excel" → pilih file Excel (Kolom A=SKU, Kolom B=Rebate)
6. Klik **Simpan Program**

### Cara edit program:
1. Cari program di tabel
2. Klik **Edit** di kolom Aksi
3. Ubah data yang perlu → klik **Simpan Program**

### Cara hapus program:
1. Klik **Hapus** di kolom Aksi
2. Konfirmasi "OK"

### Arti kolom Sisa Hari:
- Menunjukkan berapa hari lagi program berakhir
- Program yang sudah lewat otomatis tampil "Berakhir" (merah)

---

## 7. Promo Display

### Cara menambah program display:
1. Klik tab **Promo Display**
2. Klik **+ Tambah Program Display**
3. Isi **Nama Program** dan pilih **Brand**
4. Isi **Tanggal Mulai** dan **Tanggal Berakhir**
5. Tambah item:
   - **Manual:** Klik "+ Tambah Manual" → isi SKU, Serial Number, dan Nilai (Rp)
   - **Import:** Klik "📁 Import Excel" → format: Kolom A=SKU, B=Serial Number, C=Nilai
6. Klik **Simpan**

### Cara melihat detail program display:
- Setiap program tampil sebagai kartu berisi:
  - Total SN, Total Nilai
  - Tabel detail: SKU + SN + Nilai per item
  - Sisa hari program

### Cara filter:
- Pilih **Aktif** (belum berakhir) atau **Berakhir** (sudah lewat) di dropdown kanan atas

### Cara edit/hapus:
- Klik **✎ Edit** untuk mengubah
- Klik **🗑 Hapus** untuk menghapus

---

## 8. Closing Sell Out

### Tujuan:
Melihat rekap program Sell Out untuk keperluan **klaim rebate ke brand** per bulan.

### Cara menggunakan:
1. Klik tab **Closing Sell Out**
2. Pilih **Brand** (contoh: ASUS)
3. Pilih **Bulan** (contoh: Juni)
4. Pilih **Tahun** (contoh: 2026)
5. Klik **📊 Tampilkan**

### Yang ditampilkan:
- Program yang **tanggal akhir periodenya** jatuh di bulan+tahun yang dipilih
- Tabel: Nama Program, Brand, Periode, Jumlah SN, Valid, Ditolak, Total Rebate
- Summary bar di atas tabel

### Cara melihat detail per program (Level 2):
1. **Klik nama program** di tabel
2. Muncul popup dengan rekap per SKU:
   - SKU, Nilai/SKU, Total SN, Valid, Ditolak, Total Rebate
3. Di atas tabel ada summary per program

### Cara melihat detail per SN (Level 3):
1. Dari popup SKU, **klik baris SKU** yang ingin dilihat
2. Muncul popup kedua berisi daftar Serial Number:
   - No. Dok, SN Toko, SN Brand, Status, Alasan/Keterangan
3. Di sini terlihat mana yang Valid dan mana yang Ditolak beserta alasannya

### Cara menutup popup:
- Klik tombol **✕ Tutup** di pojok kanan atas popup
- Atau klik area gelap di luar popup

---

## Tips Navigasi Cepat

| Mau lihat... | Buka tab... | Lalu... |
|---|---|---|
| Total rebate bulan ini | Dashboard | Filter tanggal bulan ini → Terapkan |
| SN yang ditolak + alasan | Laporan SN | Filter status "Ditolak" |
| Stok SKU per program | Detail Program | Klik "📦 Daftar SKU" |
| Program mana yang mau habis | Dashboard | Lihat kolom "Sisa Hari" |
| Rekap untuk klaim ke brand | Closing Sell Out | Filter bulan+brand → klik program → klik SKU |
| Tambah program baru | Promo Sell Out | Klik "+ Tambah Program" |
| Cek SN tertentu valid/tidak | Hasil Validasi | Ketik SN di kotak pencarian |
| Produk display yang aktif | Promo Display | Filter "Aktif" |

---

## Alur Kerja Sehari-hari

```
PAGI:
  1. Tab Upload Data → upload POS terbaru
  2. Tab Upload Data → upload data brand terbaru (jika ada update)
  3. Tab Hasil Validasi → klik Jalankan Validasi
  4. Tab Dashboard → cek kartu ringkasan

SAAT PERLU DETAIL:
  5. Tab Laporan SN → lihat SN ditolak + alasan
  6. Tab Detail Program → lihat stok + detail per program

AKHIR BULAN (CLOSING):
  7. Tab Closing Sell Out → pilih bulan+brand
  8. Klik program → klik SKU → lihat detail SN
  9. Gunakan data ini untuk klaim ke brand
```
