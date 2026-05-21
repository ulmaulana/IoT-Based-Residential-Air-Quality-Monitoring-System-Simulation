# Web Simulasi Kualitas Udara Perumahan

Aplikasi Next.js untuk menjalankan simulasi monitoring kualitas udara berbasis dataset lokal. Aplikasi ini tidak memakai Wokwi dan tidak membutuhkan ThingsBoard; telemetry disimulasikan langsung di browser dari data yang dikonversi dari `data.h`.

## Struktur Folder

```text
public/data/air-quality.json    Dataset hasil konversi dari data.h
scripts/build-dataset.mjs       Script konversi data.h ke JSON
src/app                         App Router Next.js
src/components                  Komponen dashboard
src/lib                         Fungsi status dan format data
src/types                       Tipe data telemetry
```

## Menjalankan Aplikasi

```bash
npm install
npm run generate:data
npm run dev
```

Buka `http://localhost:3000`.

## Perilaku Simulasi

- Data berjalan otomatis ketika halaman dibuka.
- Dataset akan berulang dari awal setelah mencapai baris terakhir.
- Kontrol tersedia untuk jeda, mulai ulang, dan mengubah kecepatan simulasi.
- Status udara dihitung dari ambang gas, suhu, dan kelembapan yang sama dengan logika pada project Wokwi.
