window.TOOLS = {
  k6:        { title: 'Load Test',         desc: 'HTTP load testing with metrics',            icon: '<i class="fa-solid fa-rocket"></i>',          endpoint: '/api/run-k6' },
  nmap:      { title: 'Port Scanner',      desc: 'Scan 25 common TCP ports',                  icon: '<i class="fa-solid fa-search"></i>',          endpoint: '/api/run-nmap' },
  headers:   { title: 'Header Audit',      desc: 'Security headers & scoring',                icon: '<i class="fa-solid fa-shield-halved"></i>',   endpoint: '/api/run-headers' },
  ssl:       { title: 'SSL Checker',       desc: 'Certificate validity & expiry',             icon: '<i class="fa-solid fa-lock"></i>',            endpoint: '/api/run-ssl' },
  whois:     { title: 'Whois',             desc: 'Domain registration data',                  icon: '<i class="fa-solid fa-circle-info"></i>',     endpoint: '/api/run-whois' },
  dns:       { title: 'DNS Lookup',        desc: 'A, AAAA, MX, NS, TXT, CNAME',              icon: '<i class="fa-solid fa-server"></i>',          endpoint: '/api/run-dns' },
  subdomain: { title: 'Subdomain Scanner', desc: 'Find subdomains via crt.sh',                icon: '<i class="fa-solid fa-sitemap"></i>',         endpoint: '/api/run-subdomain' },
  geoip:     { title: 'GeoIP',             desc: 'IP geolocation & ISP info',                 icon: '<i class="fa-solid fa-globe-americas"></i>',  endpoint: '/api/run-geoip' },
  hash:      { title: 'Hash Generator',    desc: 'MD5, SHA1, SHA256, SHA512',                 icon: '<i class="fa-solid fa-hashtag"></i>',         endpoint: '/api/run-hash' },
  base64:    { title: 'Base64',            desc: 'Encode / decode instantly',                 icon: '<i class="fa-solid fa-clipboard-list"></i>',  endpoint: '/api/run-base64' },
  cors:      { title: 'CORS Checker',      desc: 'Test misconfiguration',                     icon: '<i class="fa-solid fa-up-down-left-right"></i>', endpoint: '/api/run-cors' },
  httpmethods: { title: 'HTTP Methods',    desc: 'Enumerate allowed methods',                 icon: '<i class="fa-solid fa-list"></i>',            endpoint: '/api/run-httpmethods' },
  jwt:       { title: 'JWT Decoder',       desc: 'Decode & validate tokens',                  icon: '<i class="fa-solid fa-key"></i>',             endpoint: '/api/run-jwt' },
  password:  { title: 'Password Generator', desc: 'Strong random passwords',                  icon: '<i class="fa-solid fa-lock"></i>',            endpoint: '/api/run-password' },
};

const SIDEBAR_ORDER = [
  'k6', 'nmap', 'headers', 'ssl', 'whois', 'dns', 'subdomain', 'geoip',
  'hash', 'base64', 'cors', 'httpmethods', 'jwt', 'password',
];

let abortCtrl = null;
let isRunning = false;

function setRunning(running) {
  isRunning = running;
  document.getElementById('runBtn').disabled = running;
  document.getElementById('stopBtn').disabled = !running;
  document.getElementById('runBtn').classList.toggle('opacity-50', running);
}

function setStatus(state) {
  const dot = document.getElementById('stat-dot');
  const txt = document.getElementById('stat-text');
  const sdot = document.getElementById('sbar-dot');
  const stxt = document.getElementById('sbar-status');
  if (dot) dot.className = 'sdot ' + state;
  if (sdot) sdot.className = 'sdot ' + state;
  const labels = { idle: 'Idle', busy: 'Running\u2026', done: 'Done', err: 'Error' };
  const label = labels[state] || state;
  if (txt) txt.textContent = label;
  if (stxt) stxt.textContent = label;
}

function stopScan() {
  if (abortCtrl) {
    abortCtrl.abort();
    abortCtrl = null;
  }
  const consoleBox = document.getElementById('console');
  if (!consoleBox) return;
  const ts = new Date().toLocaleTimeString('id-ID', { hour12: false });
  consoleBox.innerHTML += '\n<span class="text-gray-500">[' + ts + ']</span> <span class="line-warn">\u25A0 Stopped by user</span>\n';
  consoleBox.scrollTop = consoleBox.scrollHeight;
  setRunning(false);
  setStatus('idle');
  const btnText = document.getElementById('runBtnText');
  if (btnText) btnText.innerHTML = '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Run';
}

function copyOutput() {
  const consoleBox = document.getElementById('console');
  if (!consoleBox) return;
  const text = consoleBox.innerText;
  if (!text) return;
  navigator.clipboard.writeText(text).then(function () {
    const badge = document.getElementById('status-badge');
    if (badge) badge.innerHTML = '<span class="text-green-500 text-[10px]">\u2713 Copied!</span>';
    setTimeout(function () {
      var state = 'idle';
      var dot = document.getElementById('stat-dot');
      if (dot && dot.className.includes('done')) state = 'done';
      setStatus(state);
    }, 1200);
  });
}

function clearOutput() {
  if (isRunning) stopScan();
  const consoleBox = document.getElementById('console');
  if (consoleBox) consoleBox.innerHTML = '<span class="text-gray-600">/* Console cleared */</span>';
}

function initTool(toolId) {
  var meta = window.TOOLS[toolId];
  if (!meta) return;

  document.querySelectorAll('[data-tool]').forEach(function (b) {
    b.classList.remove('active');
  });
  var btn = document.querySelector('[data-tool="' + toolId + '"]');
  if (btn) btn.classList.add('active');

  var iconEl = document.getElementById('tool-icon');
  var nameEl = document.getElementById('tool-name');
  var descEl = document.getElementById('tool-desc');
  var epEl = document.getElementById('tool-endpoint');
  var consoleEl = document.getElementById('console');

  if (iconEl) iconEl.innerHTML = meta.icon;
  if (nameEl) nameEl.textContent = meta.title;
  if (descEl) descEl.textContent = meta.desc;
  if (epEl) epEl.textContent = meta.endpoint;
  if (consoleEl) consoleEl.innerHTML = '<span class="text-gray-600">/* ' + meta.title + ' ready */</span>\n<span class="text-gray-600">/* Configure and press Run */</span>';

  setStatus('idle');

  abortCtrl = null;
  isRunning = false;
  document.getElementById('runBtn').disabled = false;
  document.getElementById('stopBtn').disabled = true;
  document.getElementById('runBtn').classList.remove('opacity-50');
  var btnText = document.getElementById('runBtnText');
  if (btnText) btnText.innerHTML = '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Run';
}

document.addEventListener('DOMContentLoaded', function () {
  var stopBtn = document.getElementById('stopBtn');
  var runBtn = document.getElementById('runBtn');
  if (!runBtn || !stopBtn) return;

  stopBtn.addEventListener('click', stopScan);

  runBtn.addEventListener('click', async function () {
    if (isRunning) return;
    var toolId = document.body.getAttribute('data-tool-id');
    var meta = window.TOOLS[toolId];
    if (!meta) return;

    var consoleBox = document.getElementById('console');
    var btnText = document.getElementById('runBtnText');

    abortCtrl = new AbortController();
    setRunning(true);

    var now = new Date();
    var ts = now.toLocaleTimeString('id-ID', { hour12: false });
    consoleBox.innerHTML = '<span class="text-gray-500">[' + ts + ']</span> <span class="text-[#7d63ff]">\u25B6</span> Running <span class="text-[#7d63ff] font-semibold">' + meta.title + '</span>\u2026\n';
    setStatus('busy');
    if (btnText) btnText.innerHTML = '<span class="dot-pulse flex gap-1"><span></span><span></span><span></span></span>';

    var data = { target: '', vus: 5, duration: 10 };
    var targetEl = document.getElementById('target');
    if (targetEl) data.target = targetEl.value;
    var vusEl = document.getElementById('vus');
    if (vusEl) data.vus = vusEl.value;
    var durEl = document.getElementById('dur');
    if (durEl) data.duration = durEl.value;
    var modeEl = document.getElementById('mode');
    if (modeEl) data.mode = modeEl.value;

    try {
      var res = await fetch(meta.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: abortCtrl.signal,
      });

      var reader = res.body.getReader();
      var decoder = new TextDecoder();

      while (true) {
        var result = await reader.read();
        if (result.done) break;
        var chunk = decoder.decode(result.value);
        chunk = chunk.replace(/\x1b\[[0-9;]*m/g, '');
        var lines = chunk.split('\n');
        for (var i = 0; i < lines.length; i++) {
          var line = lines[i];
          if (!line) continue;
          var cls = '';
          var lw = line.toLowerCase();
          var isSep = (line.startsWith('  =') && line.length > 10) || (line.startsWith('=') && line.trim().length > 10);
          if (isSep) {
            consoleBox.innerHTML += '<span class="text-gray-700">' + escapeHtml(line) + '</span>\n';
            continue;
          }
          if (lw.includes('[error]') || lw.includes('[fail]') || lw.includes('[high]') || lw.includes('\u2716') || lw.includes('vulnerable'))
            cls = 'line-error';
          else if (lw.includes('[pass]') || lw.includes('[open]') || lw.includes('[valid]') || lw.includes('[ok]') || lw.includes('[grade a]') || lw.includes('[grade b]') || lw.includes('present') || lw.includes('berhasil'))
            cls = 'line-success';
          else if (lw.includes('[warn]') || lw.includes('[risk]') || lw.includes('[grade') || lw.includes('expir') || lw.includes('missing') || lw.includes('expired'))
            cls = 'line-warn';
          else if (lw.includes('[info]') || lw.includes('[results]') || lw.includes('[summary]') || lw.includes('[note]') || lw.includes('scan') || lw.includes('found'))
            cls = 'line-info';
          consoleBox.innerHTML += '<span class="' + cls + '">' + escapeHtml(line) + '</span>\n';
        }
        consoleBox.scrollTop = consoleBox.scrollHeight;
      }

      var output = consoleBox.innerText;
      var hasError = /\[ERROR\]/.test(output);
      var endTs = new Date().toLocaleTimeString('id-ID', { hour12: false });
      if (hasError) {
        consoleBox.innerHTML += '\n<span class="text-gray-500">[' + endTs + ']</span> <span class="line-error">\u2718 Failed</span>\n';
        setStatus('err');
      } else {
        consoleBox.innerHTML += '\n<span class="text-gray-500">[' + endTs + ']</span> <span class="line-success">\u2714 Done</span>\n';
        setStatus('done');
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      consoleBox.innerHTML += '\n<span class="text-gray-500">[' + new Date().toLocaleTimeString('id-ID', { hour12: false }) + ']</span> <span class="line-error">\u2718 ' + escapeHtml(err.message) + '</span>\n';
      setStatus('err');
    }

    if (btnText) btnText.innerHTML = '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Run';
    setRunning(false);
  });
});

function escapeHtml(str) {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}
