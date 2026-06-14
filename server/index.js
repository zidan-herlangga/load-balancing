const express = require('express');
const path = require('path');
const https = require('https');
const http = require('http');
const net = require('net');
const dns = require('dns');
const crypto = require('crypto');
const tls = require('tls');

// whois-json may fail in serverless environments
let whois;
try {
  whois = require('whois-json');
} catch (e) {
  whois = null;
}

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.resolve(__dirname, '..', 'dist')));
app.use(express.json({ limit: '1mb' }));

const startStream = (res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');
};

// ──────────────────────────────────────────────
//  1. Load Test
// ──────────────────────────────────────────────
app.post('/api/run-k6', async (req, res) => {
  startStream(res);
  const { target, vus = 5, duration = 10 } = req.body;
  const url = target || 'https://test.k6.io';

  res.write(`[INFO] Load Test: ${url}\n`);
  res.write(`[INFO] Virtual Users: ${vus} | Duration: ${duration}s\n\n`);

  const startTime = Date.now();
  let success = 0, failed = 0;
  const endTime = startTime + Number(duration) * 1000;

  const doRequest = () => new Promise((resolve) => {
    try {
      const u = new URL(url);
      const mod = u.protocol === 'https:' ? https : http;
      const req = mod.get(url, { timeout: 8000 }, (resp) => {
        let data = '';
        resp.on('data', (c) => { data += c; });
        resp.on('end', () => {
          success++;
          resolve({ status: resp.statusCode, size: data.length });
        });
        resp.on('error', () => { failed++; resolve({ error: 'response error' }); });
      });
      req.on('error', (err) => { failed++; resolve({ error: err.message }); });
      req.end();
    } catch (err) {
      failed++;
      resolve({ error: `Invalid URL: ${err.message}` });
    }
  });

  const runUser = async () => {
    while (Date.now() < endTime) {
      const result = await doRequest();
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      if (result.error) {
        res.write(`[${elapsed}s] [FAIL] ${result.error}\n`);
      } else {
        res.write(`[${elapsed}s] [${result.status}] ${result.size}B\n`);
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
  };

  try {
    const workers = Array.from({ length: Math.min(Number(vus) || 1, 20) }, () => runUser());
    await Promise.all(workers);
  } catch (err) {
    res.write(`[ERROR] ${err.message}\n`);
  }

  const elapsed = Math.max(((Date.now() - startTime) / 1000), 0.1).toFixed(1);
  res.write(`\n${'='.repeat(40)}\nRESULTS\n${'='.repeat(40)}\n`);
  res.write(`  Total requests : ${success + failed}\n`);
  res.write(`  Successful     : ${success}\n`);
  res.write(`  Failed         : ${failed}\n`);
  res.write(`  Duration       : ${elapsed}s\n`);
  res.write(`  RPS            : ${((success + failed) / Number(elapsed)).toFixed(1)}\n`);
  res.write(`${'='.repeat(40)}\n`);
  res.end();
});

// ──────────────────────────────────────────────
//  2. Port Scanner
// ──────────────────────────────────────────────
app.post('/api/run-nmap', (req, res) => {
  startStream(res);
  const host = req.body.target || '127.0.0.1';
  const ports = [21,22,23,25,53,80,81,110,143,443,445,993,995,1433,1521,2049,3306,3389,5432,5900,6379,8080,8443,9000,9200,27017];
  const svcMap = {21:'FTP',22:'SSH',23:'Telnet',25:'SMTP',53:'DNS',80:'HTTP',81:'HTTP-Alt',110:'POP3',143:'IMAP',443:'HTTPS',445:'SMB',993:'IMAPS',995:'POP3S',1433:'MSSQL',1521:'Oracle',2049:'NFS',3306:'MySQL',3389:'RDP',5432:'PostgreSQL',5900:'VNC',6379:'Redis',8080:'HTTP-Alt',8443:'HTTPS-Alt',9000:'SonarQube',9200:'Elasticsearch',27017:'MongoDB'};

  res.write(`[INFO] Scanning ${host} (${ports.length} common ports)\n\n`);

  let checked = 0, open = [], responded = false;

  ports.forEach((port) => {
    const s = new net.Socket();
    s.setTimeout(1200);
    s.on('connect', () => {
      open.push(port);
      const svc = svcMap[port] || 'unknown';
      res.write(`  [OPEN] Port ${port} (${svc})\n`);
      s.destroy();
    });
    s.on('timeout', () => s.destroy());
    s.on('error', () => {});
    s.on('close', () => {
      checked++;
      if (checked >= ports.length && !responded) {
        responded = true;
        if (open.length === 0) res.write(`  No open ports found\n`);
        res.end();
      }
    });
    s.connect(port, host);
  });
});

// ──────────────────────────────────────────────
//  3. Header Audit
// ──────────────────────────────────────────────
app.post('/api/run-headers', async (req, res) => {
  startStream(res);
  const url = req.body.target || 'https://google.com';
  res.write(`[INFO] Security Header Audit: ${url}\n\n`);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const resp = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal });
    clearTimeout(timeout);
    const h = {};
    resp.headers.forEach((v, k) => { h[k] = v; });

    const checks = {
      'strict-transport-security':        'HSTS',
      'x-frame-options':                  'Clickjacking Protection',
      'x-content-type-options':           'MIME Sniffing Protection',
      'content-security-policy':          'Content Security Policy',
      'x-xss-protection':                 'XSS Protection',
      'referrer-policy':                  'Referrer Policy',
      'permissions-policy':               'Permissions Policy',
      'access-control-allow-origin':      'CORS',
    };

    res.write(`  ${'='.repeat(50)}\n`);
    res.write(`  HEADERS\n`);
    res.write(`  ${'='.repeat(50)}\n`);
    Object.entries(h).forEach(([k, v]) => {
      res.write(`  ${k}: ${v}\n`);
    });

    res.write(`\n  ${'='.repeat(50)}\n`);
    res.write(`  SECURITY SCORE\n`);
    res.write(`  ${'='.repeat(50)}\n`);

    let score = 0, total = Object.keys(checks).length;
    Object.entries(checks).forEach(([header, desc]) => {
      if (h[header]) {
        res.write(`  [PASS] ${desc.padEnd(32)} PRESENT\n`);
        score++;
      } else {
        res.write(`  [FAIL] ${desc.padEnd(32)} MISSING\n`);
      }
    });
    const pct = Math.round((score / total) * 100);
    const grade = pct >= 80 ? 'A' : pct >= 60 ? 'B' : pct >= 40 ? 'C' : 'D';
    res.write(`\n  [GRADE ${grade}] (${score}/${total} - ${pct}%)\n`);
  } catch (err) {
    res.write(`  [ERROR] ${err.message}\n`);
  }
  res.end();
});

// ──────────────────────────────────────────────
//  4. SSL Checker
// ──────────────────────────────────────────────
app.post('/api/run-ssl', (req, res) => {
  startStream(res);
  const domain = (req.body.target || '').replace(/https?:\/\//, '').split('/')[0].split(':')[0];
  if (!domain) { res.write('[ERROR] No domain provided\n'); res.end(); return; }

  res.write(`[INFO] SSL/TLS Certificate Check: ${domain}\n\n`);

  let responded = false;
  const socket = tls.connect(443, domain, { servername: domain, rejectUnauthorized: false }, () => {
    if (responded) return;
    const cert = socket.getPeerCertificate();
    if (!cert || !cert.valid_from) {
      res.write('  [ERROR] No certificate retrieved\n');
      responded = true;
      res.end();
      socket.end();
      return;
    }
    const validFrom = new Date(cert.valid_from);
    const validTo = new Date(cert.valid_to);
    const daysLeft = Math.floor((validTo - Date.now()) / 86400000);
    const issuer = cert.issuer?.O || cert.issuer?.CN || 'N/A';
    const subject = cert.subject?.CN || 'N/A';

    res.write(`  ${'='.repeat(50)}\n`);
    res.write(`  CERTIFICATE INFO\n`);
    res.write(`  ${'='.repeat(50)}\n`);
    res.write(`  Domain        : ${domain}\n`);
    res.write(`  Subject       : ${subject}\n`);
    res.write(`  Issuer        : ${issuer}\n`);
    res.write(`  Valid From    : ${validFrom.toLocaleDateString('id-ID')}\n`);
    res.write(`  Valid Until   : ${validTo.toLocaleDateString('id-ID')}\n`);
    res.write(`  Days Left     : ${daysLeft}d\n`);
    res.write(`  Cipher        : ${socket.getCipher()?.name || 'N/A'}\n`);
    res.write(`  Protocol      : ${socket.getProtocol() || 'N/A'}\n`);

    if (cert.subjectaltname) {
      res.write(`  SAN           : ${cert.subjectaltname.slice(0, 200)}\n`);
    }

    res.write(`\n  ${'='.repeat(50)}\n`);
    if (daysLeft < 0) {
      res.write(`  STATUS: EXPIRED (expired ${Math.abs(daysLeft)}d ago)\n`);
    } else if (daysLeft < 30) {
      res.write(`  STATUS: EXPIRING SOON (${daysLeft}d remaining)\n`);
    } else {
      res.write(`  STATUS: VALID (${daysLeft}d remaining)\n`);
    }
    responded = true;
    socket.end();
    res.end();
  });

  socket.setTimeout(10000, () => {
    if (!responded) {
      responded = true;
      res.write(`  [ERROR] Connection timeout\n`);
      res.end();
    }
    socket.destroy();
  });
  socket.on('error', (err) => {
    if (!responded) {
      responded = true;
      res.write(`  [ERROR] ${err.message}\n`);
      res.end();
    }
  });
});

// ──────────────────────────────────────────────
//  5. Whois Lookup
// ──────────────────────────────────────────────
app.post('/api/run-whois', async (req, res) => {
  startStream(res);
  const target = req.body.target;
  if (!target) { res.write('[ERROR] No domain provided\n'); res.end(); return; }
  if (!whois) { res.write('[ERROR] Whois module unavailable in this environment\n'); res.end(); return; }
  res.write(`[INFO] Whois Lookup: ${target}\n\n`);
  try {
    const results = await whois(target);
    if (typeof results === 'object') {
      Object.entries(results).forEach(([k, v]) => {
        if (v && v !== 'N/A') res.write(`  ${k}: ${v}\n`);
      });
    } else {
      res.write(`  ${results}\n`);
    }
  } catch (err) {
    res.write(`  [ERROR] ${err.message}\n`);
  }
  res.end();
});

// ──────────────────────────────────────────────
//  6. DNS Lookup
// ──────────────────────────────────────────────
app.post('/api/run-dns', (req, res) => {
  startStream(res);
  const domain = req.body.target || 'google.com';

  res.write(`[INFO] DNS Lookup: ${domain}\n\n`);
  res.write(`  ${'='.repeat(50)}\n`);

  let pending = 5;
  const done = () => { pending--; if (pending <= 0) { res.write(`  ${'='.repeat(50)}\n`); res.end(); } };

  dns.resolve4(domain, (err, a) => {
    if (err) res.write(`  A      : ${err.code}\n`);
    else res.write(`  A      : ${a.join(', ')}\n`);
    done();
  });

  dns.resolve6(domain, (err, aaaa) => {
    if (!err) res.write(`  AAAA   : ${aaaa.join(', ')}\n`);
    done();
  });

  dns.resolveMx(domain, (err, mx) => {
    if (!err && mx && mx.length) res.write(`  MX     : ${mx.sort((a,b)=>a.preference-b.preference).map(m=>`${m.exchange} (priority ${m.preference})`).join(', ')}\n`);
    done();
  });

  dns.resolveNs(domain, (err, ns) => {
    if (!err && ns && ns.length) res.write(`  NS     : ${ns.join(', ')}\n`);
    done();
  });

  dns.resolveTxt(domain, (err, txt) => {
    if (!err && txt && txt.length) res.write(`  TXT    : ${txt.flat().join(', ')}\n`);
    done();
  });
});

// ──────────────────────────────────────────────
//  7. Hash Generator
// ──────────────────────────────────────────────
app.post('/api/run-hash', (req, res) => {
  startStream(res);
  const { target: text, type = 'all' } = req.body;
  if (!text) { res.write('[ERROR] No input text\n'); res.end(); return; }

  const algos = type === 'all'
    ? ['md5', 'sha1', 'sha256', 'sha384', 'sha512']
    : [type];

  res.write(`[INFO] Hash Generator\n\n`);
  res.write(`  Input : ${text}\n`);
  res.write(`  ${'='.repeat(50)}\n`);

  algos.forEach((algo) => {
    const hash = crypto.createHash(algo).update(text).digest('hex');
    res.write(`  ${algo.padEnd(8).toUpperCase()}: ${hash}\n`);
  });

  res.write(`  ${'='.repeat(50)}\n`);
  res.end();
});

// ──────────────────────────────────────────────
//  8. Base64 Tool
// ──────────────────────────────────────────────
app.post('/api/run-base64', (req, res) => {
  startStream(res);
  const { target: text, mode = 'encode' } = req.body;
  if (!text) { res.write('[ERROR] No input text\n'); res.end(); return; }

  res.write(`[INFO] Base64 ${mode === 'encode' ? 'Encode' : 'Decode'}\n\n`);
  res.write(`  ${'='.repeat(50)}\n`);

  try {
    if (mode === 'encode') {
      const result = Buffer.from(text, 'utf-8').toString('base64');
      res.write(`  Input  : ${text}\n`);
      res.write(`  Output : ${result}\n`);
    } else {
      const result = Buffer.from(text, 'base64').toString('utf-8');
      res.write(`  Input  : ${text}\n`);
      res.write(`  Output : ${result}\n`);
    }
  } catch (err) {
    res.write(`  [ERROR] ${err.message}\n`);
  }
  res.write(`  ${'='.repeat(50)}\n`);
  res.end();
});

// ──────────────────────────────────────────────
//  9. Subdomain Scanner (via crt.sh)
// ──────────────────────────────────────────────
app.post('/api/run-subdomain', async (req, res) => {
  startStream(res);
  const domain = req.body.target || 'example.com';

  res.write(`[INFO] Subdomain Scanner: ${domain}\n\n`);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const resp = await fetch(`https://crt.sh/?q=%25.${domain}&output=json`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const data = await resp.json();
    const subs = new Set();
    (data || []).forEach((entry) => {
      const name = entry.name_value;
      if (name && name.includes(domain)) {
        name.split('\n').forEach((n) => {
          const clean = n.trim().toLowerCase();
          if (clean.endsWith(domain) && !clean.startsWith('*') && !clean.startsWith('.')) subs.add(clean);
        });
      }
    });

    const sorted = [...subs].sort();
    res.write(`  Found ${sorted.length} subdomains\n\n`);
    sorted.slice(0, 200).forEach((s) => res.write(`  \u2022 ${s}\n`));
    if (sorted.length > 200) res.write(`  ... and ${sorted.length - 200} more\n`);
    if (!sorted.length) res.write(`  No subdomains found for this domain\n`);
  } catch (err) {
    res.write(`  [ERROR] ${err.message}\n`);
  }
  res.end();
});

// ──────────────────────────────────────────────
//  10. IP Geolocation
// ──────────────────────────────────────────────
app.post('/api/run-geoip', async (req, res) => {
  startStream(res);
  const ip = req.body.target || '';

  res.write(`[INFO] IP Geolocation: ${ip || 'your IP'}\n\n`);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const resp = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,continent,country,regionName,city,zip,isp,org,as,lat,lon,timezone,proxy,hosting,query`, { signal: controller.signal });
    clearTimeout(timeout);
    const data = await resp.json();

    if (data.status === 'fail') {
      res.write(`  [ERROR] ${data.message}\n`);
    } else {
      res.write(`  ${'='.repeat(50)}\n`);
      res.write(`  IP        : ${data.query}\n`);
      res.write(`  Continent : ${data.continent || 'N/A'}\n`);
      res.write(`  Country   : ${data.country || 'N/A'}\n`);
      res.write(`  Region    : ${data.regionName || 'N/A'}\n`);
      res.write(`  City      : ${data.city || 'N/A'}\n`);
      res.write(`  ZIP       : ${data.zip || 'N/A'}\n`);
      res.write(`  ISP       : ${data.isp || 'N/A'}\n`);
      res.write(`  Org       : ${data.org || 'N/A'}\n`);
      res.write(`  AS        : ${data.as || 'N/A'}\n`);
      res.write(`  Lat/Lon   : ${data.lat || 'N/A'}, ${data.lon || 'N/A'}\n`);
      res.write(`  Timezone  : ${data.timezone || 'N/A'}\n`);
      res.write(`  Proxy/VPN : ${data.proxy ? 'Yes' : 'No'}\n`);
      res.write(`  Hosting   : ${data.hosting ? 'Yes' : 'No'}\n`);
      res.write(`  ${'='.repeat(50)}\n`);
    }
  } catch (err) {
    res.write(`  [ERROR] ${err.message}\n`);
  }
  res.end();
});

// ──────────────────────────────────────────────
//  11. CORS Checker
// ──────────────────────────────────────────────
app.post('/api/run-cors', async (req, res) => {
  startStream(res);
  const url = req.body.target || 'https://example.com';
  res.write(`[INFO] CORS Misconfiguration Checker: ${url}\n\n`);

  const origins = [
    'https://evil.com',
    'null',
    'https://attacker.com',
    'https://evil-pwn.com',
  ];

  for (const origin of origins) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const resp = await fetch(url, { method: 'OPTIONS', headers: { Origin: origin }, signal: controller.signal });
      clearTimeout(timeout);
      const acao = resp.headers.get('access-control-allow-origin');
      const acac = resp.headers.get('access-control-allow-credentials');
      const acam = resp.headers.get('access-control-allow-methods');
      const acah = resp.headers.get('access-control-allow-headers');

      if (acao === '*') {
        res.write(`  [RISK] ${origin} \u2192 ACAO: * (wildcard)\n`);
      } else if (acao === origin || acao === origin.replace(/\/$/, '')) {
        res.write(`  [RISK] ${origin} \u2192 ACAO: ${acao} (reflected)\n`);
        if (acac === 'true') res.write(`  [HIGH] Credentials allowed with reflected origin!\n`);
      } else if (acao) {
        res.write(`  [INFO] ${origin} \u2192 ACAO: ${acao}\n`);
      } else {
        res.write(`  [OK]   ${origin} \u2192 No ACAO header\n`);
      }
      if (acam) res.write(`  [INFO]  Allowed Methods: ${acam}\n`);
    } catch (err) {
      res.write(`  [INFO] ${origin} \u2192 ${err.message}\n`);
    }
  }

  res.write(`\n  ${'='.repeat(50)}\n`);
  res.write(`  SUMMARY: Check for wildcard (*) or reflected ACAO headers above.\n`);
  res.end();
});

// ──────────────────────────────────────────────
//  12. HTTP Methods Tester
// ──────────────────────────────────────────────
app.post('/api/run-httpmethods', async (req, res) => {
  startStream(res);
  const url = req.body.target || 'https://example.com';
  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD', 'TRACE'];

  res.write(`[INFO] HTTP Methods Enumeration: ${url}\n\n`);
  res.write(`  ${'='.repeat(50)}\n`);

  for (const method of methods) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const resp = await fetch(url, { method, signal: controller.signal });
      clearTimeout(timeout);
      const risky = ['PUT', 'DELETE', 'PATCH', 'TRACE'].includes(method);
      const code = resp.status;
      const flag = risky ? '[RISK]' : '[INFO]';
      const cls = risky && code < 400 ? 'VULNERABLE' : 'OK';
      res.write(`  ${flag} ${method.padEnd(8)} \u2192 ${code}${risky && code < 400 ? ' \u26A0 ' + cls : ''}\n`);
    } catch (err) {
      res.write(`  [INFO] ${method.padEnd(8)} \u2192 ${err.message}\n`);
    }
  }

  res.write(`\n  ${'='.repeat(50)}\n`);
  res.write(`  NOTE: PUT/DELETE/PATCH/TRACE returning 2xx may be risky.\n`);
  res.end();
});

// ──────────────────────────────────────────────
//  13. JWT Decoder
// ──────────────────────────────────────────────
app.post('/api/run-jwt', (req, res) => {
  startStream(res);
  const token = (req.body.target || '').trim();
  if (!token) { res.write('[ERROR] No JWT token provided\n'); res.end(); return; }

  const parts = token.split('.');
  if (parts.length !== 3) { res.write('[ERROR] Invalid JWT format — expected 3 parts\n'); res.end(); return; }

  res.write(`[INFO] JWT Decoder\n\n`);
  res.write(`  Token: ${token.slice(0, 50)}...\n\n`);

  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    res.write(`  ${'='.repeat(50)}\n`);
    res.write(`  HEADER\n`);
    res.write(`  ${'='.repeat(50)}\n`);
    Object.entries(header).forEach(([k, v]) => res.write(`  ${k}: ${JSON.stringify(v)}\n`));

    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    res.write(`\n  ${'='.repeat(50)}\n`);
    res.write(`  PAYLOAD\n`);
    res.write(`  ${'='.repeat(50)}\n`);
    Object.entries(payload).forEach(([k, v]) => {
      const val = k.toLowerCase().includes('exp') || k.toLowerCase().includes('iat') || k.toLowerCase().includes('nbf')
        ? `${v} (${new Date(v * 1000).toLocaleString('id-ID')})` : JSON.stringify(v);
      res.write(`  ${k}: ${val}\n`);
    });

    const sig = parts[2];
    const alg = header.alg || 'unknown';
    res.write(`\n  ${'='.repeat(50)}\n`);
    res.write(`  SIGNATURE\n`);
    res.write(`  ${'='.repeat(50)}\n`);
    res.write(`  Algorithm : ${alg}\n`);
    res.write(`  Signature : ${sig.slice(0, 32)}...\n`);
    if (alg === 'none') res.write(`  [HIGH] Algorithm is 'none' — token may be forged!\n`);

    if (payload.exp) {
      const exp = new Date(payload.exp * 1000);
      const now = new Date();
      if (exp < now) res.write(`\n  [WARN] Token has EXPIRED (${Math.round((now - exp) / 1000 / 60)}m ago)\n`);
      else res.write(`\n  [OK]   Token is still valid (${Math.round((exp - now) / 1000 / 60)}m remaining)\n`);
    }
  } catch (err) {
    res.write(`\n  [ERROR] Failed to decode: ${err.message}\n`);
  }
  res.end();
});

// ──────────────────────────────────────────────
//  14. Password Generator
// ──────────────────────────────────────────────
app.post('/api/run-password', (req, res) => {
  startStream(res);
  const length = Math.min(Math.max(Number(req.body.target) || 16, 8), 128);

  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const generate = (len, pools) => {
    const all = pools.join('');
    let pwd = pools.map(p => p[crypto.randomInt(p.length)]).join('');
    for (let i = pwd.length; i < len; i++) pwd += all[crypto.randomInt(all.length)];
    return pwd.split('').sort(() => crypto.randomInt(3) - 1).join('');
  };

  res.write(`[INFO] Password Generator (${length} chars)\n\n`);
  res.write(`  ${'='.repeat(50)}\n`);

  const passwords = [];
  for (let i = 0; i < 5; i++) {
    passwords.push(generate(length, [lowercase, uppercase, numbers, symbols]));
  }

  passwords.forEach((pwd, i) => {
    const entropy = Math.log2(94) * length;
    res.write(`  ${i + 1}. ${pwd}\n`);
    res.write(`     Entropy: ~${entropy.toFixed(0)} bits | Length: ${length}\n\n`);
  });

  res.write(`  ${'='.repeat(50)}\n`);
  res.write(`  Tip: Use passwords with > 80 bits of entropy for security.\n`);
  res.end();
});

// ──────────────────────────────────────────────
//  SPA fallback — serve index.html for unknown routes
// ──────────────────────────────────────────────
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).send('API endpoint not found');
    return;
  }
  if (/\.[a-zA-Z0-9]+$/.test(req.path)) {
    return res.status(404).send('Not found');
  }
  res.sendFile(path.resolve(__dirname, '..', 'dist', 'index.html'));
});

// ──────────────────────────────────────────────
//  Start (only when run directly, not via Vercel)
// ──────────────────────────────────────────────
if (require.main === module) {
  app.listen(port, () => {
    console.log(`\x1b[35m%s\x1b[0m`, `\u{1F680} DevSec Hub aktif di http://localhost:${port}`);
    console.log(`${'='.repeat(50)}`);
    console.log(`  14 pentest tools - all pure Node.js`);
    console.log(`  No external CLI tools required`);
    console.log(`${'='.repeat(50)}`);
  });
}

module.exports = app;
