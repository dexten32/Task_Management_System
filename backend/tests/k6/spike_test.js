import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
    stages: [
        { duration: '10s', target: 200 }, // Sudden spike to 200 users
        { duration: '1m', target: 200 },  // Stay at 200
        { duration: '10s', target: 0 },   // Sudden scale down
    ],
};

export default function () {
    let res = http.get('http://localhost:5000/api/tasks');
    check(res, {
        'status is 200': (r) => r.status === 200,
    });
    sleep(1);
}
