import http from 'k6/http';
import { sleep, check } from 'k6';

export default function () {
  const url = __ENV.TARGET_URL || 'https://test.k6.io';
  const res = http.get(url);
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
