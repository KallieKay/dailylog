import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 8 },    // ramp to 8 VUs (below the 10-exec Lambda cap)
        { duration: '2m',  target: 8 },    // hold
        { duration: '30s', target: 0 },    // ramp down
    ],
    thresholds: {
        http_req_failed:   ['rate<0.01'],    // <1% errors
        http_req_duration: ['p(95)<3000'],   // p95 under 3s (accounts for cold starts)
    },
};

const API = __ENV.API_URL;
if (!API) throw new Error('API_URL env var is required');

const TODAY = new Date().toISOString().slice(0, 10);

export default function () {
    // 1. Health check
    const health = http.get(`${API}/health`);
    check(health, { 'health 200': (r) => r.status === 200 });

    // 2. List subjects
    const subjects = http.get(`${API}/subjects`);
    check(subjects, { 'subjects 200': (r) => r.status === 200 });

    // 3. Create a session (only if at least one subject exists)
    const list = subjects.json();
    if (Array.isArray(list) && list.length > 0) {
        const body = JSON.stringify({
            subject_id: list[0].id,
            duration_min: 30,
            notes: 'load test',
        });
        const create = http.post(`${API}/sessions`, body, {
            headers: { 'content-type': 'application/json' },
        });
        check(create, { 'session 201': (r) => r.status === 201 });
    }

    // 4. List today's sessions
    const sessions = http.get(`${API}/sessions?from=${TODAY}&to=${TODAY}`);
    check(sessions, { 'sessions 200': (r) => r.status === 200 });

    sleep(0.5);
}