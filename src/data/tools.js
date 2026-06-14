const tools = [
  {
    id: 'k6', title: 'Load Test', desc: 'HTTP load testing with metrics',
    icon: 'fa-solid fa-rocket', endpoint: '/api/run-k6', category: 'Web',
    fields: [
      { id: 'target', label: 'Target URL', type: 'text', default: 'https://test.k6.io' },
      { id: 'vus', label: 'Virtual Users', type: 'number', default: 5 },
      { id: 'dur', label: 'Duration (s)', type: 'number', default: 10 },
    ],
  },
  {
    id: 'nmap', title: 'Port Scanner', desc: 'Scan 25 common TCP ports',
    icon: 'fa-solid fa-search', endpoint: '/api/run-nmap', category: 'Recon',
    fields: [
      { id: 'target', label: 'Target Host', type: 'text', default: '127.0.0.1' },
    ],
    note: 'Scans 25 most common ports including HTTP, SSH, SQL, and more.',
  },
  {
    id: 'headers', title: 'Header Audit', desc: 'Security headers & scoring',
    icon: 'fa-solid fa-shield-halved', endpoint: '/api/run-headers', category: 'Web',
    fields: [
      { id: 'target', label: 'Target URL', type: 'text', default: 'https://google.com' },
    ],
    note: 'Checks HSTS, CSP, XFO, CORS, and more. Grades A-F.',
  },
  {
    id: 'ssl', title: 'SSL Checker', desc: 'Certificate validity & expiry',
    icon: 'fa-solid fa-lock', endpoint: '/api/run-ssl', category: 'Web',
    fields: [
      { id: 'target', label: 'Domain', type: 'text', default: 'google.com' },
    ],
    note: 'Checks cert chain, expiry, cipher, and protocol.',
  },
  {
    id: 'whois', title: 'Whois', desc: 'Domain registration data',
    icon: 'fa-solid fa-circle-info', endpoint: '/api/run-whois', category: 'Web',
    fields: [
      { id: 'target', label: 'Domain', type: 'text', default: 'google.com' },
    ],
    note: 'Queries registrar, nameservers, expiry, and more.',
  },
  {
    id: 'dns', title: 'DNS Lookup', desc: 'A, AAAA, MX, NS, TXT, CNAME',
    icon: 'fa-solid fa-server', endpoint: '/api/run-dns', category: 'Recon',
    fields: [
      { id: 'target', label: 'Domain', type: 'text', default: 'google.com' },
    ],
    note: 'Resolves A, AAAA, MX, NS, TXT, CNAME records.',
  },
  {
    id: 'subdomain', title: 'Subdomain Scanner', desc: 'Find subdomains via crt.sh',
    icon: 'fa-solid fa-sitemap', endpoint: '/api/run-subdomain', category: 'Recon',
    fields: [
      { id: 'target', label: 'Domain', type: 'text', default: 'example.com' },
    ],
    note: 'Queries certificate transparency logs (crt.sh).',
  },
  {
    id: 'geoip', title: 'GeoIP', desc: 'IP geolocation & ISP info',
    icon: 'fa-solid fa-globe-americas', endpoint: '/api/run-geoip', category: 'Recon',
    fields: [
      { id: 'target', label: 'IP Address', type: 'text', default: '', placeholder: 'Leave empty for your IP' },
    ],
    note: 'Shows country, ISP, org, proxy detection, coordinates.',
  },
  {
    id: 'hash', title: 'Hash Generator', desc: 'MD5, SHA1, SHA256, SHA512',
    icon: 'fa-solid fa-hashtag', endpoint: '/api/run-hash', category: 'Utility',
    fields: [
      { id: 'target', label: 'Input Text', type: 'textarea', default: 'hello world' },
    ],
    note: 'Generates MD5, SHA1, SHA256, SHA384, and SHA512.',
  },
  {
    id: 'base64', title: 'Base64', desc: 'Encode / decode instantly',
    icon: 'fa-solid fa-clipboard-list', endpoint: '/api/run-base64', category: 'Utility',
    fields: [
      { id: 'target', label: 'Input Text', type: 'textarea', default: 'DevSec Hub' },
      { id: 'mode', label: 'Mode', type: 'select', default: 'encode', options: [
        { value: 'encode', label: 'Encode' },
        { value: 'decode', label: 'Decode' },
      ]},
    ],
  },
  {
    id: 'cors', title: 'CORS Checker', desc: 'Test misconfiguration',
    icon: 'fa-solid fa-up-down-left-right', endpoint: '/api/run-cors', category: 'Web',
    fields: [
      { id: 'target', label: 'Target URL', type: 'text', default: 'https://example.com' },
    ],
    note: 'Tests wildcard, reflected origins, and credentials.',
  },
  {
    id: 'httpmethods', title: 'HTTP Methods', desc: 'Enumerate allowed methods',
    icon: 'fa-solid fa-list', endpoint: '/api/run-httpmethods', category: 'Web',
    fields: [
      { id: 'target', label: 'Target URL', type: 'text', default: 'https://example.com' },
    ],
    note: 'Tests GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD, TRACE.',
  },
  {
    id: 'jwt', title: 'JWT Decoder', desc: 'Decode & validate tokens',
    icon: 'fa-solid fa-key', endpoint: '/api/run-jwt', category: 'Utility',
    fields: [
      { id: 'target', label: 'JWT Token', type: 'textarea', default: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c' },
    ],
    note: 'Decodes header, payload, signature, and checks expiry.',
  },
  {
    id: 'password', title: 'Password Generator', desc: 'Strong random passwords',
    icon: 'fa-solid fa-lock', endpoint: '/api/run-password', category: 'Utility',
    fields: [
      { id: 'target', label: 'Length (8-128)', type: 'number', default: 16, min: 8, max: 128 },
    ],
    note: 'Generates 5 passwords with entropy estimation.',
  },
];

export const categories = ['Recon', 'Web', 'Utility'];
export const categoryIcons = {
  Recon: 'fa-solid fa-binoculars',
  Web: 'fa-solid fa-globe',
  Utility: 'fa-solid fa-toolbox',
};

export default tools;
