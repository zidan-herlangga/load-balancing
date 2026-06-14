const express = require('express');
const { spawn } = require('child_process');
const whois = require('whois-json');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(express.json());

// Helper untuk menjalankan Tool berbasis CLI (Terminal)
const runCLI = (res, cmd, args) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');

  const process = spawn(cmd, args, { shell: true });

  process.stdout.on('data', (data) => res.write(data.toString()));
  process.stderr.on('data', (data) =>
    res.write(`[STDERR]: ${data.toString()}`),
  );

  process.on('error', (err) => {
    res.write(
      `[SYSTEM ERROR]: Gagal menjalankan ${cmd}. Pastikan tool sudah terinstal di PATH Windows.\n`,
    );
    res.end();
  });

  process.on('close', (code) => {
    res.write(`\n\n--- EKSEKUSI SELESAI (Exit Code: ${code}) ---`);
    res.end();
  });
};

// --- API ROUTES ---

// 1. k6 Load Test
app.post('/api/run-k6', (req, res) => {
  const { url, vus, duration } = req.body;
  runCLI(res, 'k6', [
    'run',
    '--vus',
    vus,
    '--duration',
    `${duration}s`,
    '--env',
    `TARGET_URL=${url}`,
    'scripts/performance-test.js',
  ]);
});

// 2. Nmap Port Scanner
app.post('/api/run-nmap', (req, res) => {
  runCLI(res, 'nmap', ['-F', req.body.target]);
});

// 3. Security Header Audit (Curl)
app.post('/api/run-headers', (req, res) => {
  runCLI(res, 'curl', ['-I', '-L', '-s', req.body.target]);
});

// 4. Whois Lookup (Menggunakan Library NPM agar tidak error di Windows)
app.post('/api/run-whois', async (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.write(`[SYSTEM] Mencari data WHOIS untuk: ${req.body.target}...\n\n`);
  try {
    const results = await whois(req.body.target);
    res.write(JSON.stringify(results, null, 2));
  } catch (err) {
    res.write(`[ERROR]: ${err.message}`);
  }
  res.end();
});

// 5. SSL Checker (Menggunakan OpenSSL - Pastikan OpenSSL terinstal)
app.post('/api/run-ssl', (req, res) => {
  const domain = req.body.target.replace(/https?:\/\//, '').split('/')[0];
  runCLI(res, 'openssl', [
    's_client',
    '-connect',
    `${domain}:443`,
    '-servername',
    domain,
    '-showcerts',
    '< /dev/null',
  ]);
});

app.listen(port, () => {
  console.log(
    `\x1b[35m%s\x1b[0m`,
    `🚀 DevSec Hub aktif di http://localhost:${port}`,
  );
  console.log(`Pastikan k6, nmap, dan openssl terinstal di sistem Anda.`);
});
