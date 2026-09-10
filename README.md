# SPPG PLOSOREJO — Arsip MBG Online

Project ini dibuat untuk di-upload ke GitHub lalu dideploy ke Netlify. Data operasional dan file arsip disimpan online menggunakan **Netlify Blobs** melalui **Netlify Functions**, jadi tidak perlu membuat Supabase/Firebase/database terpisah.

## Fitur

- Data SPPG & Yayasan (editable dan tersimpan online)
- Kegiatan Harian MBG + foto menu
- Dashboard rekap operasional online
- Arsip khusus **Ahli Gizi**
- Arsip khusus **Akuntansi**
- Upload file hingga 30 MB/file dengan mekanisme chunk 3 MB
- Tidak ada login username/password
- Tidak ada export PDF/Excel/Word
- Draft Kegiatan Harian tetap auto-save di browser perangkat; laporan final tersimpan online
- Akses data memakai tautan khusus dengan kode rahasia

## Deploy GitHub → Netlify

1. Upload seluruh folder ini ke repository GitHub.
2. Di Netlify pilih **Add new project / Import from Git**, lalu pilih repository tersebut.
3. Build settings sudah ada di `netlify.toml`. Tidak perlu build command khusus.
4. Buka **Project configuration → Environment variables** dan buat:

   `SITE_ACCESS_KEY = BUAT_KODE_RAHASIA_PANJANG_SENDIRI`

   Contoh pola: kombinasi huruf/angka minimal 32 karakter. Jangan menaruh nilai asli `SITE_ACCESS_KEY` di GitHub.
5. Trigger deploy ulang setelah environment variable disimpan.
6. Buka website menggunakan tautan:

   `https://NAMA-SITE.netlify.app/?access=KODE_RAHASIA_ANDA`

   Tautan lengkap itu yang dibagikan ke staf. Website tidak menampilkan form login.

## Debug di VS Code

Karena website memakai Netlify Functions, jangan buka `index.html` memakai `file:///`.

```bash
npm install
npm run dev
```

Lalu buka URL yang diberikan Netlify Dev, misalnya:

`http://localhost:8888/?access=KODE_RAHASIA_ANDA`

Untuk local dev, set `SITE_ACCESS_KEY` melalui Netlify CLI/environment lokal sesuai kebutuhan.

## Tentang penyimpanan

Netlify Blobs menggunakan site-wide store. Data tetap tersedia lintas deploy dan dapat dibaca dari perangkat berbeda selama membuka site Netlify yang sama. File arsip dipecah menjadi potongan kecil saat upload agar aman terhadap batas payload Netlify Functions.

Tidak ada sistem yang dapat menjamin file “selamanya” tanpa backup. Untuk dokumen yang benar-benar kritis, tetap disarankan memiliki backup kedua di penyimpanan organisasi. Jangan menghapus project Netlify/site karena arsip terkait dengan project tersebut.

## Keamanan

Model ini sengaja **tanpa login**. API hanya merespons apabila request membawa kode `SITE_ACCESS_KEY` yang berasal dari tautan khusus. Karena tautan tersebut berfungsi seperti kunci, siapa pun yang memperoleh tautan lengkap dapat mengakses/mengubah data. Jangan gunakan repository publik untuk menyimpan kode akses dan jangan menyebarkan URL lengkap ke pihak luar.

Data awal pada halaman **Data SPPG** diisi berdasarkan lampiran yang diberikan, termasuk data internal seperti kontak, rekening, NPWP, dan NIK. Pastikan tautan akses hanya beredar di internal SPPG.

## Struktur Utama

```text
public/
  index.html
  profil.html
  kegiatan.html
  dashboard.html
  arsip-gizi.html
  arsip-akuntansi.html
  css/
  js/
netlify/functions/
netlify/lib/
netlify.toml
package.json
```


## Revisi v7 - Kegiatan Harian & Rekap

Perbaikan utama:

- Pengecekan tanggal baru tidak lagi menganggap HTTP 404 sebagai error. Tanggal yang belum mempunyai laporan dikembalikan sebagai `null`.
- API Netlify Blobs memakai bentuk `getStore("nama-store")` sesuai API Netlify saat ini.
- Jam mulai/jam selesai bebas diisi dan tidak lagi divalidasi harus berurutan; kegiatan yang melewati tengah malam diperbolehkan.
- Tombol Tambah Kelompok membuat kartu baru, memberi nomor urut, memperbarui jumlah kelompok, dan otomatis scroll/fokus ke kelompok yang baru dibuat.
- Semua baris kelompok dikumpulkan dan disimpan bersama dalam `kelompok_penerima`.
- Pesan error API sekarang menampilkan penyebab server agar debugging lebih mudah.

Setelah mengganti file di repository, lakukan commit/push. Netlify akan deploy ulang otomatis.
