// Quick test script to verify purchase endpoint
const courseId = '93dc4bf3-b6e5-4476-8b96-8551a6ee5b5b';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3MDg2M2YzMi1hODk2LTQwODctOGUwNC04YTZjYTk3OTc0ZTkiLCJyb2xlIjoiTEVBUk5FUiIsImlhdCI6MTczODk5NzQxMn0.Uc1u6KWh5Sq-NmnE0Ww-X6cce1aa393';

const payload = {
    plan: 'monthly',
    billingDetails: { country: 'in', state: 'dl' },
    coupon: ''
};

fetch(`http://localhost:3000/api/courses/${courseId}/purchase`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
})
    .then(async res => {
        console.log('Status:', res.status);
        console.log('Status Text:', res.statusText);
        const data = await res.json();
        console.log('Response:', JSON.stringify(data, null, 2));
    })
    .catch(err => console.error('Error:', err));
