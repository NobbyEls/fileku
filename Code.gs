/**
 * ============================================================
 * REBATE VALIDATOR v2.2 — Code.gs  (Google Apps Script)
 * Validasi Serial Number berbasis SKU + Web App Interface
 * Brand: ACER | ASUS | LENOVO | HP
 * ============================================================
 * PERUBAHAN v2.2:
 *  - Multi-SKU rebate: tiap SKU dalam satu program bisa punya
 *    nilai rebate berbeda. Format kolom SKU List:
 *      "SKU-A:75000, SKU-B:100000, SKU-C"
 *    SKU tanpa :angka menggunakan nilai default dari kolom Rebate.
 *  - _getAllActivePrograms(): program kadaluarsa otomatis non-aktif.
 * ============================================================
 * CARA INSTALL:
 *  1. Buka Google Sheet baru
 *  2. Extensions → Apps Script
 *  3. Hapus semua kode default, paste seluruh file ini sebagai Code.gs
 *  4. Buat file baru bernama "index" (tipe HTML), paste isi index.html
 *  5. Save → Deploy → New Deployment → Web App
 *     • Execute as: Me
 *     • Who has access: Anyone (or your org)
 *  6. Salin URL deployment, buka di browser
 * ============================================================
 */

// ============================================================
//  KONFIGURASI KOLOM — sesuaikan jika struktur file berubah
// ============================================================
const CFG = {

  SHEET: {
    SETTING:   '⚙️ SETTING',
    PENJUALAN: '📦 Data Penjualan',
    ACER:      '📋 Acer Data',
    ASUS:      '📋 Asus Data',
    LENOVO:    '📋 Lenovo Data',
    HP:        '📋 HP Data',
    HASIL:     '✅ Hasil Validasi',
    SUMMARY:   '📊 Summary Rebate',
    STOK:      '📦 Stok',
  },

  // Data Penjualan / POS  (1-indexed, kolom A=1)
  // Format: baris 1=judul, baris 2=header, data mulai baris 3
  // Tiap kolom data diselingi 1 kolom kosong
  POS: {
    TANGGAL:   3,   // C
    NO_DOK:    5,   // E
    PELANGGAN: 7,   // G
    CABANG:    9,   // I
    DEPT:      11,  // K  (Departemen)
    KODE_BRNG: 13,  // M  ← kunci pencocokan SKU
    NAMA_BRNG: 15,  // O
    SALES:     17,  // Q
    QTY:       19,  // S
    HARGA:     21,  // U
    SERIAL:    23,  // W  ← serial number (bisa multi-value dipisah koma)
    START_ROW: 3,   // data mulai baris 3 (baris 2 = header)
  },

  // Verifikasi ACER
  ACER: { SERIAL: 13, TGL_INVOICE: 10, NO_INVOICE: 11, MODEL: 15 },

  // Verifikasi ASUS
  ASUS: { SERIAL: 14, STATUS_KOM: 15, TGL_AKTIF: 11, MODEL: 8 },

  // Verifikasi LENOVO
  LENOVO: { SERIAL: 3, STATUS: 5, TGL_DITERIMA: 8, MTM: 9, PRODUK: 10 },

  // Verifikasi HP (kolom A–AZ, total 52 kolom)
  //   AB (28) = Serial Number
  //   AN (40) = SO Validation  → valid jika mengandung "valid"
  //   Y  (25) = Invoice Date   → untuk cek periode program
  //   K  (11) = SKU No
  //   L  (12) = SKU Name
  HP: { SERIAL: 28, STATUS_KOM: 40, TGL_INVOICE: 25, SKU_NO: 11, SKU_NAME: 12 },

  // Sheet Setting — struktur baris program
  SETTING: {
    START_ROW: 3,  // baris data mulai (baris 1=judul, 2=header)
    ID_PROG:   1,
    NAMA_PROG: 2,
    BRAND:     3,
    SKU_LIST:  4,  // Kode Barang dipisah koma
    TGL_MULAI: 5,
    TGL_AKHIR: 6,
    REBATE:    7,
    AKTIF:     8,
    KET:       9,
  },
};

const STATUS = {
  VALID:           '✅ VALID',
  TIDAK_DITEMUKAN: '❌ TIDAK DITEMUKAN',
  DITOLAK:         '❌ DITOLAK BRAND',
  DILUAR_PERIODE:  '⚠️ DILUAR PERIODE',
};


// ============================================================
//  WEB APP ENTRY POINT
// ============================================================

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Rebate Validator')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


// ============================================================
//  SERVER FUNCTIONS — dipanggil oleh Web App (google.script.run)
//  Semua return JSON string agar aman lintas serialisasi
// ============================================================

/** Ringkasan untuk halaman Dashboard */
function getDashboardData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Jumlah baris per sheet brand
    const brandRows = {};
    ['ACER','ASUS','LENOVO','HP'].forEach(b => {
      const s = ss.getSheetByName(CFG.SHEET[b]);
      brandRows[b] = s ? Math.max(0, s.getLastRow() - 1) : 0;
    });

    const posSheet = ss.getSheetByName(CFG.SHEET.PENJUALAN);
    // Sheet POS tersimpan: baris 1=header, data mulai baris 2
    const posRows  = posSheet ? Math.max(0, posSheet.getLastRow() - 1) : 0;

    // Agregasi hasil validasi
    const hs = ss.getSheetByName(CFG.SHEET.HASIL);
    const summary = { total:0, valid:0, diluar:0, ditolak:0, tidakDitemukan:0, totalRebate:0 };
    if (hs && hs.getLastRow() > 1) {
      hs.getRange(2, 1, hs.getLastRow()-1, 15).getValues().forEach(r => {
        if (!r[0]) return;
        summary.total++;
        const st = r[8].toString();
        const rb = Number(r[12]) || 0;
        if (st === STATUS.VALID)             { summary.valid++;          summary.totalRebate += rb; }
        else if (st === STATUS.DILUAR_PERIODE)  summary.diluar++;
        else if (st === STATUS.DITOLAK)         summary.ditolak++;
        else if (st === STATUS.TIDAK_DITEMUKAN) summary.tidakDitemukan++;
      });
    }

    const programs = _getAllActivePrograms().map(p => ({
      id: p.id, nama: p.nama, brand: p.brand,
      skuCount: p.skuList.length,
      periode: `${_fmt(p.mulai)} – ${_fmt(p.akhir)}`,
      rebate: p.rebate,
      skuDetails: p.skuList.map(item => item.sku + ':' + item.rebate),
    }));

    return JSON.stringify({ ok:true, posRows, brandRows, summary, programs });
  } catch(e) { return JSON.stringify({ ok:false, error:e.message }); }
}

/** Info jumlah baris tiap sheet (untuk tab Upload) */
function getBrandDataInfo() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const info = {};
    ['ACER','ASUS','LENOVO','HP'].forEach(b => {
      const s = ss.getSheetByName(CFG.SHEET[b]);
      info[b] = { rows: s ? Math.max(0, s.getLastRow()-1) : 0 };
    });
    const ps = ss.getSheetByName(CFG.SHEET.PENJUALAN);
    // Sheet POS tersimpan: baris 1=header, data mulai baris 2
    info.POS = { rows: ps ? Math.max(0, ps.getLastRow() - 1) : 0 };
    return JSON.stringify({ ok:true, info });
  } catch(e) { return JSON.stringify({ ok:false, error:e.message }); }
}

/** Seluruh baris Hasil Validasi */
function getHasilValidasiData() {
  try {
    const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CFG.SHEET.HASIL);
    if (!s || s.getLastRow() < 2) return JSON.stringify({ ok:true, rows:[] });

    const rows = s.getRange(2, 1, s.getLastRow()-1, 15).getValues()
      .filter(r => r[0])
      .map(r => ({
        no:         r[0],
        tglJual:    r[1] instanceof Date ? _fmt(r[1]) : r[1],
        noDok:      r[2],
        brand:      r[3],
        kodeBarang: r[4],
        namaBarang: r[5],
        snToko:     r[6],
        snBrand:    r[7],
        status:     r[8],
        tglBrand:   r[9] instanceof Date ? _fmt(r[9]) : (r[9] || ''),
        program:    r[10],
        periode:    r[11],
        rebate:     r[12],
        keterangan: r[13],
      }));

    return JSON.stringify({ ok:true, rows });
  } catch(e) { return JSON.stringify({ ok:false, error:e.message }); }
}

/** Semua baris dari sheet Setting */
function getProgramSettings() {
  try {
    const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CFG.SHEET.SETTING);
    const c = CFG.SETTING;
    if (!s || s.getLastRow() < c.START_ROW) return JSON.stringify({ ok:true, rows:[] });

    const numRows = s.getLastRow() - c.START_ROW + 1;
    const rows = s.getRange(c.START_ROW, 1, numRows, 9).getValues()
      .filter(r => r[0])
      .map((r, i) => ({
        rowIndex: i + 1,
        id:        r[c.ID_PROG-1],
        nama:      r[c.NAMA_PROG-1],
        brand:     r[c.BRAND-1],
        skuList:   r[c.SKU_LIST-1],
        tglMulai:  r[c.TGL_MULAI-1] instanceof Date ? _fmt(r[c.TGL_MULAI-1]) : r[c.TGL_MULAI-1],
        tglAkhir:  r[c.TGL_AKHIR-1] instanceof Date ? _fmt(r[c.TGL_AKHIR-1]) : r[c.TGL_AKHIR-1],
        rebate:    r[c.REBATE-1],
        aktif:     r[c.AKTIF-1],
        ket:       r[c.KET-1],
      }));

    return JSON.stringify({ ok:true, rows });
  } catch(e) { return JSON.stringify({ ok:false, error:e.message }); }
}

/** Simpan atau update satu program */
function saveProgram(programJson) {
  try {
    const prog = JSON.parse(programJson);
    const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CFG.SHEET.SETTING);
    const c = CFG.SETTING;

    const row = [
      prog.id || ('PRG-' + prog.brand + '-' + Date.now()),
      prog.nama,
      prog.brand.toUpperCase(),
      prog.skuList,
      _parseDDMMYYYY(prog.tglMulai),
      _parseDDMMYYYY(prog.tglAkhir),
      Number(prog.rebate) || 0,
      prog.aktif,
      prog.ket || '',
    ];

    let targetRow;
    if (prog.rowIndex) {
      targetRow = prog.rowIndex + c.START_ROW - 1;
      s.getRange(targetRow, 1, 1, 9).setValues([row]);
    } else {
      s.appendRow(row);
      targetRow = s.getLastRow();
    }

    s.getRange(targetRow, c.TGL_MULAI, 1, 2).setNumberFormat('DD/MM/YYYY');
    s.getRange(targetRow, c.REBATE,   1, 1).setNumberFormat('Rp #,##0');

    return JSON.stringify({ ok:true });
  } catch(e) { return JSON.stringify({ ok:false, error:e.message }); }
}

/** Hapus program berdasarkan ID */
function deleteProgram(programId) {
  try {
    const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CFG.SHEET.SETTING);
    const c = CFG.SETTING;
    const data = s.getRange(c.START_ROW, 1, Math.max(1, s.getLastRow()-c.START_ROW+1), 1).getValues();
    for (let i = 0; i < data.length; i++) {
      if (data[i][0].toString() === programId.toString()) {
        s.deleteRow(i + c.START_ROW);
        return JSON.stringify({ ok:true });
      }
    }
    return JSON.stringify({ ok:false, error:'Program tidak ditemukan' });
  } catch(e) { return JSON.stringify({ ok:false, error:e.message }); }
}

/**
 * Upload data verifikasi brand — rows adalah array-of-arrays dari CSV/XLSX
 * brand: 'ACER' | 'ASUS' | 'LENOVO' | 'HP'
 *
 * FIX: normalisasi semua baris ke panjang kolom maksimum sebelum setValues.
 * Brand files sering punya baris dengan jumlah kolom berbeda (trailing empty
 * cells tidak di-include SheetJS), sehingga setValues gagal tanpa normalisasi.
 * HP: file sampai kolom AZ (52 kolom) — normalisasi otomatis menanganinya.
 */
function uploadBrandData(brand, rows) {
  try {
    const sheetMap = {
      ACER:   CFG.SHEET.ACER,
      ASUS:   CFG.SHEET.ASUS,
      LENOVO: CFG.SHEET.LENOVO,
      HP:     CFG.SHEET.HP,      // ← tambahan HP
    };
    const sheetName = sheetMap[brand.toUpperCase()];
    if (!sheetName) return JSON.stringify({ ok:false, error:'Brand tidak valid' });
    if (!rows || rows.length === 0) return JSON.stringify({ ok:true, rowsAdded:0 });

    // Cari jumlah kolom terbanyak dari semua baris
    const maxCols = rows.reduce((m, r) => Math.max(m, r.length), 0);
    // Pad tiap baris ke panjang yang sama
    const normalized = rows.map(r => {
      const p = r.slice();
      while (p.length < maxCols) p.push('');
      return p;
    });

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let s = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
    s.clearContents();
    s.getRange(1, 1, normalized.length, maxCols).setValues(normalized);
    s.getRange(1, 1, 1, maxCols).setFontWeight('bold').setBackground('#e8eaed');

    return JSON.stringify({ ok:true, rowsAdded: normalized.length - 1 });
  } catch(e) { return JSON.stringify({ ok:false, error:e.message }); }
}

/** Upload data POS
 * v2.5: Expand multi-SN saat upload — tiap SN jadi 1 baris tersendiri di sheet.
 * Format file asli: baris 1=judul, baris 2=header, data mulai baris 3.
 * SN dipisah koma (+ trim spasi) langsung saat upload.
 * Sheet tersimpan: baris 1=header, data mulai baris 2 (1 baris = 1 SN).
 */
function uploadPosData(rows) {
  try {
    if (!rows || rows.length === 0) return JSON.stringify({ ok:true, rowsAdded:0 });

    const c        = CFG.POS;
    const snCol    = c.SERIAL - 1;      // index 0-based = 22 (kolom W)
    const hdrIdx   = 1;                 // baris 2 di file = index 1 = header kolom
    const dataIdx  = c.START_ROW - 1;  // baris 3 di file = index 2 = data pertama

    const header = rows[hdrIdx] || [];

    // Expand: pisah multi-SN per baris data
    const expanded = [];
    for (let i = dataIdx; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length === 0) continue;

      const snCell = (r[snCol] || '').toString().trim();
      if (!snCell) continue;
      const kode   = (r[c.KODE_BRNG-1] || '').toString().trim();
      if (!kode) continue;

      // Split SN: pisah koma, trim spasi, buang yang kosong
      const snList = snCell.split(',').map(s => s.trim()).filter(Boolean);

      snList.forEach(sn => {
        const newRow    = r.slice();
        newRow[snCol]   = sn;           // ganti cell SN jadi 1 SN saja
        expanded.push(newRow);
      });
    }

    if (!expanded.length) return JSON.stringify({ ok:true, rowsAdded:0 });

    // Normalisasi panjang kolom agar setValues tidak error
    const allRows  = [header, ...expanded];
    const maxCols  = allRows.reduce((m, r) => Math.max(m, r.length), 0);
    const normalized = allRows.map(r => {
      const p = r.slice();
      while (p.length < maxCols) p.push('');
      return p;
    });

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const s  = ss.getSheetByName(CFG.SHEET.PENJUALAN) || ss.insertSheet(CFG.SHEET.PENJUALAN);
    s.clearContents();
    s.getRange(1, 1, normalized.length, maxCols).setValues(normalized);
    s.getRange(1, 1, 1, maxCols).setFontWeight('bold').setBackground('#e8eaed');

    return JSON.stringify({ ok:true, rowsAdded: expanded.length });
  } catch(e) { return JSON.stringify({ ok:false, error:e.message }); }
}

/** Jalankan validasi dari Web App */
function runValidasiServer() {
  try {
    clearHasil();
    const count = _runValidasi();
    buatSummary();
    return JSON.stringify({ ok:true, count });
  } catch(e) { return JSON.stringify({ ok:false, error:e.message }); }
}

/** Hapus hasil validasi dari Web App */
function clearHasilServer() {
  try { clearHasil(); return JSON.stringify({ ok:true }); }
  catch(e) { return JSON.stringify({ ok:false, error:e.message }); }
}

/**
 * Ambil data stok dari sheet 📦 Stok
 * Format sheet: Kolom A = Kode Barang (SKU), B = Belum Claim, C = Sudah Claim, D = Total Stok
 * Return: map { "SKU_UPPER": { belumClaim, sudahClaim, totalStok } }
 */
function getStokData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const s = ss.getSheetByName(CFG.SHEET.STOK);
    if (!s || s.getLastRow() < 2) return JSON.stringify({ ok:true, stok:{} });

    const data = s.getRange(2, 1, s.getLastRow()-1, 4).getValues();
    const stok = {};
    data.forEach(r => {
      const sku = r[0].toString().trim().toUpperCase();
      if (!sku) return;
      stok[sku] = {
        belumClaim: Number(r[1]) || 0,
        sudahClaim: Number(r[2]) || 0,
        totalStok:  Number(r[3]) || 0,
      };
    });
    return JSON.stringify({ ok:true, stok });
  } catch(e) { return JSON.stringify({ ok:false, error:e.message }); }
}


// ============================================================
//  MENU (akses dari Google Sheet)
// ============================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🔧 Rebate Tools')
    .addItem('📋 Setup Sheet', 'setupSheets')
    .addItem('▶️  Validasi Semua', 'runAll')
    .addItem('📊 Refresh Summary', 'buatSummary')
    .addItem('🗑️  Hapus Hasil', 'clearHasil')
    .addToUi();
}

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  for (const name of Object.values(CFG.SHEET)) {
    if (!ss.getSheetByName(name)) ss.insertSheet(name);
  }
  _setupSetting(ss);
  _setupHasil(ss);
  _setupStok(ss);
  SpreadsheetApp.getUi().alert('Setup selesai. Silakan deploy sebagai Web App untuk mengakses antarmuka upload & validasi.');
}

function _setupSetting(ss) {
  const s = ss.getSheetByName(CFG.SHEET.SETTING);
  s.clearContents().clearFormats();
  s.getRange('A1').setValue('KONFIGURASI PROGRAM REBATE — BERBASIS SKU')
    .setFontWeight('bold').setFontSize(14);

  const hdr = [
    'ID Program','Nama Program','Brand','SKU List (pisah koma)',
    'Tgl Mulai','Tgl Akhir','Rebate/Unit (Rp)','Aktif (YES/NO)','Keterangan'
  ];
  s.getRange(2, 1, 1, hdr.length)
    .setValues([hdr]).setFontWeight('bold')
    .setBackground('#1a73e8').setFontColor('#fff');

  const y = new Date().getFullYear();
  const sample = [
    ['PRG-ACER-2026Q2','Acer A715 Promo','ACER',
     'NB-AC-A715-59G-516G:75000, NB-AC-AG14-71M-5471:100000',
     new Date(y,3,1), new Date(y,5,30), 75000,'YES','Format: SKU:Rebate per item'],
    ['PRG-ASUS-2026H1','Asus Vivobook Promo','ASUS',
     'NB-AS-X1504VA-NJ:50000, NB-AS-M1503IA-EJ:65000',
     new Date(y,0,1), new Date(y,5,30), 50000,'YES','SKU tanpa :angka pakai kolom G'],
    ['PRG-LNVO-2026','Lenovo IdeaPad Rebate','LENOVO',
     'NB-LN-IDEAPAD-3-15:60000, NB-LN-LEGION-5-15:80000',
     new Date(y,0,1), new Date(y,11,31), 60000,'YES',''],
    ['PRG-HP-2026H1','HP Laptop Mainstream Promo','HP',
     'BD0X9PA#AR6:55000, 6D0M1PA#AR6:70000',
     new Date(y,0,1), new Date(y,5,30), 55000,'YES',''],
  ];
  s.getRange(3, 1, sample.length, hdr.length).setValues(sample);
  s.getRange(3, 5, sample.length, 2).setNumberFormat('DD/MM/YYYY');
  s.getRange(3, 7, sample.length, 1).setNumberFormat('Rp #,##0');
  s.autoResizeColumns(1, hdr.length);
  s.setFrozenRows(2);
}

function _setupHasil(ss) {
  const s = ss.getSheetByName(CFG.SHEET.HASIL);
  if (s.getLastRow() > 0) return;
  const hdr = [
    'No','Tgl Jual','No. Dok','Brand','Kode Barang','Nama Barang',
    'SN Toko','SN Brand','Status Validasi','Tgl di Brand',
    'Program','Periode','Rebate/Unit','Keterangan','Tgl Proses'
  ];
  s.getRange(1,1,1,hdr.length).setValues([hdr])
    .setFontWeight('bold').setBackground('#34a853').setFontColor('#fff');
  s.setFrozenRows(1);
}

function _setupStok(ss) {
  const s = ss.getSheetByName(CFG.SHEET.STOK);
  if (s.getLastRow() > 0) return;
  const hdr = ['Kode Barang (SKU)', 'Belum Claim', 'Sudah Claim', 'Total Stok'];
  s.getRange(1,1,1,hdr.length).setValues([hdr])
    .setFontWeight('bold').setBackground('#9b7cf8').setFontColor('#fff');
  s.setFrozenRows(1);
  s.autoResizeColumns(1, hdr.length);
}


// ============================================================
//  VALIDATION ENGINE — berbasis SKU (bukan brand)
// ============================================================

function runAll() {
  clearHasil();
  _runValidasi();
  buatSummary();
  SpreadsheetApp.getUi().alert('✅ Validasi selesai!');
}

function clearHasil() {
  const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CFG.SHEET.HASIL);
  if (s && s.getLastRow() > 1)
    s.getRange(2, 1, s.getLastRow()-1, s.getLastColumn())
      .clearContent().setBackground(null);
}

function _runValidasi() {
  const programs = _getAllActivePrograms();
  if (!programs.length) throw new Error('Tidak ada program aktif di sheet ⚙️ SETTING');

  const posData = _getAllPenjualan();
  if (!posData.length) throw new Error('Sheet 📦 Data Penjualan kosong');

  // Bangun peta SKU → [{program, rebate}...] untuk lookup O(1)
  const skuMap = {};
  programs.forEach(p => {
    p.skuList.forEach(item => {
      const k = item.sku.toUpperCase();
      (skuMap[k] = skuMap[k] || []).push({ prog: p, rebateForSku: item.rebate });
    });
  });

  // Bangun peta brand → verifikasi map (hanya brand yg dibutuhkan)
  const brandsNeeded = new Set(programs.map(p => p.brand));
  const brandMaps = {};
  brandsNeeded.forEach(b => { brandMaps[b] = _buildBrandMap(b); });

  const results = [];
  // v2.3: Track SN yang sudah diproses per program → deduplicate
  const processedSN = {};

  posData.forEach(item => {
    const skuKey = item.kodeBarang.toUpperCase().trim();
    const matchEntries = skuMap[skuKey];
    if (!matchEntries) return;

    // v2.3: Cek tgl jual (invoice toko) masuk periode program
    // Hanya proses jika tgl jual POS masuk dalam periode salah satu program
    const tglJual = _toDate(item.tanggal);
    let matchedEntry = null;
    for (const entry of matchEntries) {
      if (_inPeriode(tglJual, entry.prog)) { matchedEntry = entry; break; }
    }
    if (!matchedEntry) return; // tgl jual di luar periode → SKIP total

    // v2.3: Deduplicate SN per program
    const snRaw = item.serial.toUpperCase().trim();
    const dedupeKey = matchedEntry.prog.id + '||' + snRaw;
    if (processedSN[dedupeKey]) return;
    processedSN[dedupeKey] = true;

    const brand    = matchedEntry.prog.brand;
    const brandMap = brandMaps[brand] || {};

    // Kunci SN: Lenovo pakai 8 digit terakhir
    const snKey = brand === 'LENOVO'
      ? (snRaw.length >= 8 ? snRaw.slice(-8) : snRaw)
      : snRaw;

    const bRow = brandMap[snKey];

    if (!bRow) {
      results.push(_baris(results.length+1, item, brand, snRaw,
        STATUS.TIDAK_DITEMUKAN, null, matchedEntry.prog, 0,
        `SN tidak ada di data ${brand} | SKU: ${skuKey}`));
      return;
    }

    // Validasi status khusus per brand
    if (brand === 'ASUS' && !bRow.comment.toLowerCase().includes('point is valid')) {
      results.push(_baris(results.length+1, item, brand, snRaw,
        STATUS.DITOLAK, null, matchedEntry.prog, 0, `Status Asus: "${bRow.comment}"`));
      return;
    }
    if (brand === 'HP' && !bRow.comment.toLowerCase().includes('valid')) {
      results.push(_baris(results.length+1, item, brand, snRaw,
        STATUS.DITOLAK, null, matchedEntry.prog, 0, `SO Validation HP: "${bRow.comment}"`));
      return;
    }
    if (brand === 'LENOVO' && bRow.status.toUpperCase().includes('DITOLAK')) {
      results.push(_baris(results.length+1, item, brand, bRow.snFull || snRaw,
        STATUS.DITOLAK, null, matchedEntry.prog, 0, `Status Lenovo: "${bRow.status}"`));
      return;
    }

    const tglBrand = _getBrandDate(brand, bRow);
    const snDisplay = brand === 'LENOVO' ? (bRow.snFull || snRaw) : snRaw;

    results.push(_baris(results.length+1, item, brand, snDisplay,
      STATUS.VALID, tglBrand, matchedEntry.prog, matchedEntry.rebateForSku,
      `SKU: ${skuKey}`));
  });

  _tulisHasil(results);
  return results.length;
}

// ── Load semua program aktif dari Setting ──────────────────
// v2.2: SKU List format baru mendukung rebate per-SKU:
//   "SKU-A:75000, SKU-B:100000, SKU-C"
//   SKU tanpa :angka → pakai kolom Rebate sebagai default.
// Hasilnya: skuList = [{sku:'SKU-A', rebate:75000}, {sku:'SKU-B', rebate:100000}, ...]
function _getAllActivePrograms() {
  const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CFG.SHEET.SETTING);
  const c = CFG.SETTING;
  if (!s || s.getLastRow() < c.START_ROW) return [];
  const n = s.getLastRow() - c.START_ROW + 1;

  const today = new Date(); today.setHours(0, 0, 0, 0);

  return s.getRange(c.START_ROW, 1, n, 9).getValues()
    .filter(r => r[0] && r[c.AKTIF-1].toString().toUpperCase() === 'YES')
    .map(r => {
      const defaultRebate = Number(r[c.REBATE-1]) || 0;
      const skuRaw = r[c.SKU_LIST-1].toString().split(',').map(s => s.trim()).filter(Boolean);
      const skuList = skuRaw.map(entry => {
        const colonIdx = entry.lastIndexOf(':');
        if (colonIdx > 0) {
          const maybeSku = entry.substring(0, colonIdx).trim();
          const maybeRebate = Number(entry.substring(colonIdx + 1).trim());
          if (!isNaN(maybeRebate) && maybeRebate > 0) {
            return { sku: maybeSku, rebate: maybeRebate };
          }
        }
        // Tidak ada :angka atau angka tidak valid → pakai default
        return { sku: entry, rebate: defaultRebate };
      });
      return {
        id:      r[c.ID_PROG-1],
        nama:    r[c.NAMA_PROG-1],
        brand:   r[c.BRAND-1].toString().toUpperCase(),
        skuList: skuList,
        mulai:   _toDate(r[c.TGL_MULAI-1]),
        akhir:   _toDate(r[c.TGL_AKHIR-1]),
        rebate:  defaultRebate,
        ket:     r[c.KET-1],
      };
    })
    // Filter program kadaluarsa: tgl akhir < hari ini → otomatis non-aktif
    .filter(p => {
      const a = p.akhir;
      if (!a) return true;
      a.setHours(23, 59, 59, 999);
      return a >= today;
    });
}

// ── Load semua POS data ────────────────────────────────────
// v2.5: data di sheet sudah 1 baris = 1 SN (di-expand saat upload).
// Sheet format: baris 1=header, data mulai baris 2.
// Kolom sesuai CFG.POS (C=3, E=5, ... W=23).
function _getAllPenjualan() {
  const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CFG.SHEET.PENJUALAN);
  const c = CFG.POS;
  if (!s || s.getLastRow() < 2) return [];

  return s.getRange(2, 1, s.getLastRow() - 1, c.SERIAL).getValues()
    .filter(r => r[c.SERIAL-1].toString().trim() && r[c.KODE_BRNG-1].toString().trim())
    .map(r => ({
      tanggal:    r[c.TANGGAL-1],
      noDok:      r[c.NO_DOK-1],
      kodeBarang: r[c.KODE_BRNG-1].toString().trim(),
      namaBarang: r[c.NAMA_BRNG-1],
      serial:     r[c.SERIAL-1].toString().trim(),
    }));
}

// ── Bangun lookup map verifikasi per brand ─────────────────
// FIX: safe access pakai _col() agar baris Lenovo yang cuma punya
//      5 kolom berisi isinya tidak throw undefined error.
// HP file sampai kolom AZ (52 kolom) sehingga baca semua kolom.
function _buildBrandMap(brand) {
  const sheetMap = {
    ACER:CFG.SHEET.ACER, ASUS:CFG.SHEET.ASUS,
    LENOVO:CFG.SHEET.LENOVO, HP:CFG.SHEET.HP,
  };
  const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetMap[brand]);
  if (!s || s.getLastRow() < 2) return {};

  // Baca semua kolom yang ada di sheet (HP butuh s/d kolom 52)
  const numCols = s.getLastColumn() || 1;
  const data = s.getRange(2, 1, s.getLastRow()-1, numCols).getValues();
  const map  = {};
  const c    = CFG[brand];

  // Helper: ambil nilai kolom ke-idx (1-based) dengan fallback ''
  const _col = (row, idx) => idx >= 1 && row.length >= idx ? row[idx-1] : '';

  data.forEach(row => {
    if (brand === 'ACER') {
      const sn = _col(row, c.SERIAL).toString().trim().toUpperCase();
      if (!sn) return;
      map[sn] = {
        tgl:       _col(row, c.TGL_INVOICE) || null,
        noInvoice: _col(row, c.NO_INVOICE).toString(),
        model:     _col(row, c.MODEL).toString(),
      };

    } else if (brand === 'ASUS') {
      const sn = _col(row, c.SERIAL).toString().trim().toUpperCase();
      if (!sn) return;
      map[sn] = {
        comment:  _col(row, c.STATUS_KOM).toString(),
        tglAktif: _col(row, c.TGL_AKTIF) || null,
        model:    _col(row, c.MODEL).toString(),
      };

    } else if (brand === 'LENOVO') {
      const snFull = _col(row, c.SERIAL).toString().trim().toUpperCase();
      if (!snFull) return;
      const key = snFull.length >= 8 ? snFull.slice(-8) : snFull;
      map[key] = {
        snFull,
        status:      _col(row, c.STATUS).toString(),
        tglDiterima: _col(row, c.TGL_DITERIMA) || null,
        mtm:         _col(row, c.MTM).toString(),
        produk:      _col(row, c.PRODUK).toString(),
      };

    } else if (brand === 'HP') {
      // Serial Number di kolom AB (28), SO Validation di kolom AN (40)
      const sn = _col(row, c.SERIAL).toString().trim().toUpperCase();
      if (!sn) return;
      map[sn] = {
        comment:    _col(row, c.STATUS_KOM).toString(),  // SO Validation
        tglInvoice: _col(row, c.TGL_INVOICE) || null,    // Invoice Date
        skuNo:      _col(row, c.SKU_NO).toString(),
        skuName:    _col(row, c.SKU_NAME).toString(),
      };
    }
  });
  return map;
}

function _getBrandDate(brand, bRow) {
  if (brand === 'ACER')   return _toDate(bRow.tgl);
  if (brand === 'ASUS')   return _toDate(bRow.tglAktif);
  if (brand === 'LENOVO') return _toDate(bRow.tglDiterima);
  if (brand === 'HP')     return _toDate(bRow.tglInvoice);
  return null;
}

function _inPeriode(tgl, prog) {
  const d = _toDate(tgl);
  if (!d) return false;
  d.setHours(12, 0, 0, 0);
  const mulai = new Date(prog.mulai); mulai.setHours(0,  0,  0,   0);
  const akhir  = new Date(prog.akhir);  akhir.setHours(23, 59, 59, 999);
  return d >= mulai && d <= akhir;
}


// ============================================================
//  SUMMARY REBATE
// ============================================================

function buatSummary() {
  const ss   = SpreadsheetApp.getActiveSpreadsheet();
  const hs   = ss.getSheetByName(CFG.SHEET.HASIL);
  const sums = ss.getSheetByName(CFG.SHEET.SUMMARY);
  if (!hs || hs.getLastRow() < 2) return;

  const data = hs.getRange(2, 1, hs.getLastRow()-1, 15).getValues();
  const agg  = {};

  data.forEach(r => {
    const brand = r[3].toString().trim();
    const prog  = r[10].toString().trim();
    if (!brand || !prog) return;
    const key = `${brand}||${prog}`;
    if (!agg[key]) agg[key] = { brand, prog, periode:r[11], valid:0, diluar:0, ditolak:0, tidakDitemukan:0, totalRebate:0 };
    const a = agg[key];
    const st = r[8].toString();
    const rb = Number(r[12]) || 0;
    if (st === STATUS.VALID)             { a.valid++; a.totalRebate += rb; }
    else if (st === STATUS.DILUAR_PERIODE)  a.diluar++;
    else if (st === STATUS.DITOLAK)         a.ditolak++;
    else if (st === STATUS.TIDAK_DITEMUKAN) a.tidakDitemukan++;
  });

  sums.clearContents().clearFormats();
  sums.getRange('A1').setValue('📊 SUMMARY  —  ' + _fmt(new Date())).setFontWeight('bold').setFontSize(14);
  const hdr = ['Brand','Program','Periode','Valid','Di Luar Periode','Ditolak','Tidak Ditemukan','Total Unit Valid','Total Rebate (Rp)'];
  sums.getRange(3,1,1,hdr.length).setValues([hdr]).setFontWeight('bold').setBackground('#1a73e8').setFontColor('#fff');

  const dRows = Object.values(agg).map(a =>
    [a.brand, a.prog, a.periode, a.valid, a.diluar, a.ditolak, a.tidakDitemukan, a.valid, a.totalRebate]);

  if (dRows.length) {
    const SR = 4;
    sums.getRange(SR, 1, dRows.length, hdr.length).setValues(dRows);
    sums.getRange(SR, 9, dRows.length, 1).setNumberFormat('Rp #,##0');
    const bgMap = { ACER:'#e8f0fe', ASUS:'#fce8e6', LENOVO:'#e6f4ea' };
    dRows.forEach((r,i) => sums.getRange(SR+i,1,1,hdr.length).setBackground(bgMap[r[0]]||'#f8f9fa'));
    const TR = SR + dRows.length + 1;
    sums.getRange(TR,1).setValue('GRAND TOTAL').setFontWeight('bold');
    sums.getRange(TR,4).setFormula(`=SUM(D${SR}:D${SR+dRows.length-1})`).setFontWeight('bold');
    sums.getRange(TR,8).setFormula(`=SUM(H${SR}:H${SR+dRows.length-1})`).setFontWeight('bold');
    sums.getRange(TR,9).setFormula(`=SUM(I${SR}:I${SR+dRows.length-1})`).setNumberFormat('Rp #,##0').setFontWeight('bold').setBackground('#fbbc04');
  }
  sums.autoResizeColumns(1, hdr.length);
}


// ============================================================
//  HELPERS
// ============================================================

function _baris(no, item, brand, snBrand, status, tglBrand, prog, rebate, ket) {
  return [
    no, item.tanggal, item.noDok, brand,
    item.kodeBarang, item.namaBarang,
    item.serial, snBrand, status,
    tglBrand || '',
    prog ? prog.nama : '',
    prog ? `${_fmt(prog.mulai)} – ${_fmt(prog.akhir)}` : '',
    rebate || 0, ket || '', new Date(),
  ];
}

function _tulisHasil(rows) {
  if (!rows.length) return;
  const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CFG.SHEET.HASIL);
  const sr = s.getLastRow() + 1;
  s.getRange(sr, 1, rows.length, rows[0].length).setValues(rows);
  s.getRange(sr, 2,  rows.length, 1).setNumberFormat('DD/MM/YYYY');
  s.getRange(sr, 10, rows.length, 1).setNumberFormat('DD/MM/YYYY');
  s.getRange(sr, 13, rows.length, 1).setNumberFormat('Rp #,##0');
  s.getRange(sr, 15, rows.length, 1).setNumberFormat('DD/MM/YYYY HH:mm');
  // v2.5: Batch setBackground — getRangeList bukan per baris
  const validRanges = [], rejectRanges = [], warningRanges = [];
  const numCols = rows[0].length;
  const colEnd = String.fromCharCode(64 + Math.min(numCols, 26)); // 15 → 'O'
  rows.forEach((r, i) => {
    const rng = 'A' + (sr+i) + ':' + colEnd + (sr+i);
    if (r[8] === STATUS.VALID)              validRanges.push(rng);
    else if (r[8] === STATUS.DILUAR_PERIODE) warningRanges.push(rng);
    else                                     rejectRanges.push(rng);
  });
  if (validRanges.length)   s.getRangeList(validRanges).setBackground('#e6f4ea');
  if (warningRanges.length) s.getRangeList(warningRanges).setBackground('#fef9c3');
  if (rejectRanges.length)  s.getRangeList(rejectRanges).setBackground('#fce8e6');
}

function _toDate(val) {
  if (!val) return null;
  if (val instanceof Date) return new Date(val);
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function _fmt(d) {
  const dt = _toDate(d);
  if (!dt) return '-';
  return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
}

function _parseDDMMYYYY(str) {
  if (!str) return null;
  if (str instanceof Date) return str;
  const p = str.includes('/') ? str.split('/') : str.split('-').reverse();
  return p.length === 3 ? new Date(+p[2], +p[1]-1, +p[0]) : new Date(str);
}
