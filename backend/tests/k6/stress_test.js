import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
    stages: [
        { duration: '30s', target: 100 }, // Ramp up
        { duration: '1m', target: 100 },  // Stay at 100
        { duration: '30s', target: 200 }, // Push to 200
        { duration: '1m', target: 200 },  // Stay at 200
        { duration: '30s', target: 0 },   // Ramp down
    ],
};

export default function () {
    let res = http.get('http://localhost:5000/api/tasks');
    check(res, {
        'status is 200': (r) => r.status === 200,
    });
    sleep(1);
}
