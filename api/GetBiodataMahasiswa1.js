const fs = require('fs');
const axios = require('axios');

const maxContentLength = 800 * 1024 * 1024; // 800 MB
const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF9wZW5nZ3VuYSI6IjA0YmM3MzVhLWNhNjktNDBiYS05ZmYzLWIyNmViYzdkOGQ2NyIsInVzZXJuYW1lIjoiMDcxMDAxIiwibm1fcGVuZ2d1bmEiOiIgVU5JVkVSU0lUQVMgMTcgQUdVU1RVUyAxOTQ1IFNVUkFCQVlBICAgIiwidGVtcGF0X2xhaGlyIjoiIiwidGdsX2xhaGlyIjoiMTk0NS0wOC0xNlQxNzowMDowMC4wMDBaIiwiamVuaXNfa2VsYW1pbiI6IkwiLCJhbGFtYXQiOiIiLCJ5bSI6InJlenRvZWFkamVua0BnbWFpbC5jb20iLCJza3lwZSI6IiIsIm5vX3RlbCI6IiIsImFwcHJvdmFsX3BlbmdndW5hIjoiMSIsImFfYWt0aWYiOiIxIiwidGdsX2dhbnRpX3B3ZCI6IjIwMjMtMTAtMDJUMTc6MDA6MDAuMDAwWiIsImlkX3NkbV9wZW5nZ3VuYSI6bnVsbCwiaWRfcGRfcGVuZ2d1bmEiOm51bGwsImlkX3dpbCI6Ijk5OTk5OSAgIiwibGFzdF91cGRhdGUiOiIyMDIzLTEwLTAzVDA0OjI5OjE0LjE2MFoiLCJzb2Z0X2RlbGV0ZSI6IjAiLCJsYXN0X3N5bmMiOiIyMDIzLTEwLTA1VDAyOjI3OjQ0LjMyMFoiLCJpZF91cGRhdGVyIjoiMDRiYzczNWEtY2E2OS00MGJhLTlmZjMtYjI2ZWJjN2Q4ZDY3IiwiY3NmIjoiMjE3OTAzMDY4IiwidG9rZW5fcmVnIjpudWxsLCJqYWJhdGFuIjpudWxsLCJ0Z2xfY3JlYXRlIjoiMTk2OS0xMi0zMVQxNzowMDowMC4wMDBaIiwiaWRfcGVyYW4iOjMsIm5tX3BlcmFuIjoiQWRtaW4gUFQiLCJpZF9zcCI6IjI2NTA1NTRhLWU5ZWMtNGI1Yi04YmNmLWZhZGI3ZTI4ZTc1ZSIsImlkX3NtdCI6IjIwMjMxIiwiaWF0IjoxNjk2NTc4MTE2LCJleHAiOjE2OTY1Nzk5MTZ9.L1qTZi8QvEcI3iM-hGvCPcC3hDNxH4awfFfxA7Vf6PE'; // Ganti dengan token Anda
const baseUrl = 'http://172.26.80.39:3003/ws/live2.php'; // URL endpoint

async function fetchDataWithFilter(filter) {
  try {
    let offset = 0;
    const chunkSize = 5000; // Jumlah data yang diambil per iterasi

    while (true) {
      const response = await axios.post(baseUrl, {
        act: 'GetListMahasiswa',
        token: authToken,
        filter,
        offset,
        limit: chunkSize,
      }, {
        maxContentLength,
      });

      const chunkData = response.data.data;

      if (chunkData.length === 0) {
        // Tidak ada data lagi
        console.log('Pengambilan data selesai.');
        break;
      }

      // Display data in the console
      chunkData.forEach((item) => {
        console.log(item); // Display the student data
      });

      offset += chunkSize;
    }
  } catch (error) {
    console.error('Terjadi kesalahan:', error);
  }
}

// Panggil fungsi untuk menjalankan skrip dengan filter yang diberikan
const filter = "nik = '3578221305050001'";
fetchDataWithFilter(filter);
