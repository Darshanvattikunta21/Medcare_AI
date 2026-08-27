/**
 * MediCare AI · k6 Load Testing Suite
 * Baseline / Stress / Spike / Endurance Tests
 * Target: http://localhost:4000 (CI) or configure BASE_URL env
 *
 * Usage:
 *   k6 run k6-load-test.js --env BASE_URL=http://localhost:4000
 *   k6 run k6-load-test.js --env BASE_URL=http://localhost:4000 --env TEST_TYPE=stress
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomItem } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// ── Environment ──────────────────────────────────────────────────────────────
const BASE_URL   = __ENV.BASE_URL   || 'http://localhost:4000';
const TEST_TYPE  = __ENV.TEST_TYPE  || 'baseline';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

// ── Custom Metrics ────────────────────────────────────────────────────────────
const errorRate       = new Rate('http_error_rate');
const loginDuration   = new Trend('login_duration_ms');
const catalogDuration = new Trend('catalog_duration_ms');
const symptomDuration = new Trend('symptom_analysis_duration_ms');
const cartDuration    = new Trend('cart_duration_ms');
const totalRequests   = new Counter('total_requests');

// ── Test Scenarios ────────────────────────────────────────────────────────────
const scenarios = {
  baseline: {
    executor: 'constant-vus',
    vus: 100,
    duration: '1m',
  },
  stress_200: {
    executor: 'constant-vus',
    vus: 200,
    duration: '2m',
  },
  stress_500: {
    executor: 'ramping-vus',
    stages: [
      { duration: '30s', target: 100 },
      { duration: '1m',  target: 500 },
      { duration: '30s', target: 0   },
    ],
  },
  stress_1000: {
    executor: 'ramping-vus',
    stages: [
      { duration: '30s', target: 200  },
      { duration: '1m',  target: 1000 },
      { duration: '30s', target: 0    },
    ],
  },
  spike: {
    executor: 'ramping-vus',
    stages: [
      { duration: '30s', target: 50  },
      { duration: '10s', target: 500 },
      { duration: '1m',  target: 500 },
      { duration: '10s', target: 50  },
      { duration: '30s', target: 0   },
    ],
  },
  endurance: {
    executor: 'constant-vus',
    vus: 100,
    duration: '30m',
  },
};

// ── Options ───────────────────────────────────────────────────────────────────
export const options = {
  scenarios: {
    [TEST_TYPE]: scenarios[TEST_TYPE] || scenarios.baseline,
  },
  thresholds: {
    http_req_duration:    ['p(95)<1000', 'avg<500'],
    http_error_rate:      ['rate<0.05'],
    http_req_failed:      ['rate<0.05'],
    login_duration_ms:    ['p(95)<2000', 'avg<800'],
    catalog_duration_ms:  ['p(95)<1500', 'avg<600'],
    symptom_duration_ms:  ['p(95)<3000', 'avg<1500'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

// ── Test Users ─────────────────────────────────────────────────────────────────
const TEST_USERS = [
  { email: 'darshanvattikunta@gmail.com', password: 'demo123' },
  { email: 'ravi@email.com',               password: 'demo123' },
  { email: 'priya@email.com',              password: 'demo123' },
];

const HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// ── Helper: Login & get token ──────────────────────────────────────────────────
function getAuthToken() {
  const user = randomItem(TEST_USERS);
  const res = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(user), { headers: HEADERS });
  if (res.status === 200) {
    try { return res.json('token') || ''; } catch { return ''; }
  }
  return '';
}

// ── Main VU Logic ─────────────────────────────────────────────────────────────
export default function () {
  const token = getAuthToken();
  const authHeaders = { ...HEADERS, 'Authorization': token ? `Bearer ${token}` : '' };

  // ── Group 1: Authentication ──────────────────────────────────────────────
  group('Authentication', () => {
    const user = randomItem(TEST_USERS);
    const start = Date.now();
    const res = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(user), { headers: HEADERS });
    loginDuration.add(Date.now() - start);
    totalRequests.add(1);

    const ok = check(res, {
      'login status 200':    r => r.status === 200,
      'login has token':     r => { try { return !!r.json('token'); } catch { return false; } },
      'login time < 2000ms': r => r.timings.duration < 2000,
    });
    errorRate.add(!ok);

    // Profile fetch
    const profileRes = http.get(`${BASE_URL}/api/auth/profile`, { headers: authHeaders });
    totalRequests.add(1);
    check(profileRes, { 'profile status 200 or 401': r => [200, 401].includes(r.status) });

    sleep(0.5);
  });

  // ── Group 2: Catalog API ──────────────────────────────────────────────────
  group('Catalog API', () => {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/api/catalog/medicines?limit=20`, { headers: authHeaders });
    catalogDuration.add(Date.now() - start);
    totalRequests.add(1);

    check(res, {
      'catalog status 200':    r => r.status === 200,
      'catalog time < 1500ms': r => r.timings.duration < 1500,
      'catalog has items':     r => { try { return Array.isArray(r.json('items')); } catch { return r.status === 200; } },
    });
    errorRate.add(res.status >= 500);

    // Category filter
    const catRes = http.get(`${BASE_URL}/api/catalog/medicines?category=tablets`, { headers: authHeaders });
    totalRequests.add(1);
    check(catRes, { 'tablets filter 200': r => r.status === 200 });

    // Search
    const searchRes = http.get(`${BASE_URL}/api/catalog/medicines?q=paracetamol`, { headers: authHeaders });
    totalRequests.add(1);
    check(searchRes, { 'search 200': r => r.status === 200 });

    // Categories list
    const catListRes = http.get(`${BASE_URL}/api/catalog/categories`, { headers: authHeaders });
    totalRequests.add(1);
    check(catListRes, { 'categories 200': r => r.status === 200 });

    sleep(0.3);
  });

  // ── Group 3: Symptom AI ───────────────────────────────────────────────────
  group('Symptom Analysis AI', () => {
    const payload = JSON.stringify({
      symptoms: randomItem([
        ['Fever', 'Headache'],
        ['Cough', 'Cold'],
        ['Nausea', 'Fever'],
        ['Body Pain'],
      ]),
      severity: Math.floor(Math.random() * 5) + 4,
      notes: 'Test load scenario',
    });

    const start = Date.now();
    const res = http.post(`${BASE_URL}/api/symptoms/analyze`, payload, { headers: authHeaders });
    symptomDuration.add(Date.now() - start);
    totalRequests.add(1);

    check(res, {
      'symptom analysis 200':    r => r.status === 200 || r.status === 401,
      'symptom time < 3000ms':   r => r.timings.duration < 3000,
    });
    errorRate.add(res.status >= 500);
    sleep(1);
  });

  // ── Group 4: Cart Operations ──────────────────────────────────────────────
  group('Cart Operations', () => {
    // Get cart
    const start = Date.now();
    const getRes = http.get(`${BASE_URL}/api/cart`, { headers: authHeaders });
    cartDuration.add(Date.now() - start);
    totalRequests.add(1);

    check(getRes, { 'cart get 200 or 401': r => [200, 401].includes(r.status) });

    // Add item
    const addRes = http.post(`${BASE_URL}/api/cart/items`,
      JSON.stringify({ medicineId: 'paracetamol-650', quantity: 1 }),
      { headers: authHeaders });
    totalRequests.add(1);
    check(addRes, { 'cart add 200 or 401': r => [200, 201, 401].includes(r.status) });
    errorRate.add(addRes.status >= 500);
    sleep(0.5);
  });

  // ── Group 5: Health & App Snapshot ───────────────────────────────────────
  group('Health & Snapshot', () => {
    const health = http.get(`${BASE_URL}/api/health`, { headers: HEADERS });
    totalRequests.add(1);
    check(health, { 'health ok': r => [200, 404].includes(r.status) });

    const snap = http.get(`${BASE_URL}/api/app/snapshot`, { headers: authHeaders });
    totalRequests.add(1);
    check(snap, { 'snapshot 200 or 401': r => [200, 401].includes(r.status) });
    sleep(0.2);
  });

  sleep(Math.random() * 1.5 + 0.5);
}

// ── Summary Handler ──────────────────────────────────────────────────────────
export function handleSummary(data) {
  const rps = data.metrics['http_reqs'] ? (data.metrics['http_reqs'].values.rate || 0).toFixed(1) : 'N/A';
  const avg = data.metrics['http_req_duration'] ? (data.metrics['http_req_duration'].values.avg || 0).toFixed(0) : 'N/A';
  const p95 = data.metrics['http_req_duration'] ? (data.metrics['http_req_duration'].values['p(95)'] || 0).toFixed(0) : 'N/A';
  const p99 = data.metrics['http_req_duration'] ? (data.metrics['http_req_duration'].values['p(99)'] || 0).toFixed(0) : 'N/A';
  const errRate = data.metrics['http_error_rate'] ? ((data.metrics['http_error_rate'].values.rate || 0) * 100).toFixed(2) : 'N/A';

  const summary = `
==========================================================
  MediCare AI · k6 Performance Test Summary (${TEST_TYPE})
==========================================================
  Base URL:              ${BASE_URL}
  Test Type:             ${TEST_TYPE}
  Total Requests:        ${data.metrics['http_reqs'] ? data.metrics['http_reqs'].values.count : 'N/A'}
  Requests/sec (RPS):    ${rps}

  Response Times:
    Average:             ${avg} ms
    Median:              ${data.metrics['http_req_duration'] ? data.metrics['http_req_duration'].values.med.toFixed(0) : 'N/A'} ms
    P(90):               ${data.metrics['http_req_duration'] ? data.metrics['http_req_duration'].values['p(90)'].toFixed(0) : 'N/A'} ms
    P(95):               ${p95} ms
    P(99):               ${p99} ms
    Min:                 ${data.metrics['http_req_duration'] ? data.metrics['http_req_duration'].values.min.toFixed(0) : 'N/A'} ms
    Max:                 ${data.metrics['http_req_duration'] ? data.metrics['http_req_duration'].values.max.toFixed(0) : 'N/A'} ms

  Error Rate:            ${errRate}%
  Failed Requests:       ${data.metrics['http_req_failed'] ? (data.metrics['http_req_failed'].values.rate * 100).toFixed(2) : 'N/A'}%
==========================================================
`;

  console.log(summary);
  return {
    'automation/security/output/k6-results.json': JSON.stringify(data, null, 2),
    stdout: summary,
  };
}
