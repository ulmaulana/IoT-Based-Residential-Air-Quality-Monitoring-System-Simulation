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

## Alur Dataset AirQualityUCI ke data.h

Dataset `AirQualityUCI.csv` dipakai dalam dua tahap yang berbeda:

1. `air_quality_training_colab.ipynb` menjalankan eksperimen machine learning.
2. `convert_dataset.py` atau bagian ekspor pada notebook menghasilkan `data.h` untuk simulasi Wokwi dan web.

Catatan penting: `data.h` bukan hasil prediksi dari model yang sudah dilatih. File tersebut adalah hasil preprocessing dataset asli menjadi array C/C++ agar bisa dibaca oleh program Arduino/ESP32. Model regresi di notebook hanya digunakan untuk eksperimen pemodelan kualitas udara.

### Proses training di notebook

Notebook `air_quality_training_colab.ipynb` membaca `AirQualityUCI.csv` dengan format asli dataset, yaitu pemisah `;` dan desimal `,`. Nilai `-200` dianggap sebagai data hilang, lalu diperlakukan sebagai `NaN`.

Konfigurasi default notebook:

- Target prediksi: `CO(GT)`.
- Fitur: kolom numerik yang aman digunakan, dengan fitur yang terlalu banyak nilai hilangnya dibuang.
- Pembagian data: 80% data awal untuk training dan 20% data akhir untuk testing agar urutan waktu tetap terjaga.
- Model pembanding: Ridge Regression, Random Forest Regressor, dan Histogram Gradient Boosting Regressor.
- Evaluasi: MAE, RMSE, dan R2. Model terbaik dipilih berdasarkan RMSE terkecil.

### Proses pembuatan data.h

Untuk kebutuhan simulasi IoT, dataset diekspor menjadi `data.h` dengan langkah berikut:

1. Membaca `AirQualityUCI.csv`.
2. Menghapus kolom dan baris kosong.
3. Mengambil kolom `Date`, `Time`, `T`, `RH`, dan `PT08.S1(CO)`.
4. Mengubah nilai `-200` menjadi data kosong.
5. Mengisi data kosong pada `T`, `RH`, dan `PT08.S1(CO)` dengan forward fill lalu backward fill.
6. Mengubah `PT08.S1(CO)` menjadi `gasPPM` dengan normalisasi min-max ke rentang 0 sampai 1000.
7. Membuat `lightLux` sintetis dari jam pengamatan:
   - 06.00-17.00: `650 lux`
   - 18.00-21.00: `300 lux`
   - Jam lainnya: `80 lux`
8. Menulis setiap baris menjadi struct `AirQualityData`:

```cpp
struct AirQualityData {
  float temperature;
  float humidity;
  float gasPPM;
  float lightLux;
};
```

Hasil akhirnya adalah array `dataset[] PROGMEM` di dalam `data.h`. Pada dataset saat ini, jumlah data yang diekspor adalah 9357 baris.

Jika ingin membuat ulang `data.h` dari CSV:

```bash
python convert_dataset.py
```

Setelah `data.h` dibuat, aplikasi web mengubahnya lagi menjadi JSON dengan:

```bash
npm run generate:data
```

Script `scripts/build-dataset.mjs` membaca `../data.h`, mengambil nilai `temperature`, `humidity`, `gasPPM`, dan `lightLux`, lalu menyimpannya ke `public/data/air-quality.json` agar bisa diputar sebagai telemetry simulasi di browser.

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
