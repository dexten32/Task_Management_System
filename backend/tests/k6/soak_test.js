import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
    stages: [
        { duration: '30s', target: 50 },  // Ramp up
        { duration: '10m', target: 50 },   // Sustained load for 10 mins
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
