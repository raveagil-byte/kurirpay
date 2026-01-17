
import axios from 'axios';
import prisma from './src/prisma';

// Use local backend URL
const API_URL = 'http://localhost:3000/api';

async function runTests() {
    console.log('--- STARTING INTEGRATION TESTS ---');

    // 1. Setup Test Data
    const testEmail = `test_courier_${Date.now()}@example.com`;
    const testPassword = 'password123';
    let courierToken = '';
    let courierId = '';

    console.log('\n[1] Registering Test Courier...');
    try {
        const res = await axios.post(`${API_URL}/auth/register`, {
            name: 'Test Courier',
            email: testEmail,
            password: testPassword,
            role: 'COURIER'
        });
        courierToken = res.data.token;
        courierId = res.data.user.id;
        console.log('✅ Registered:', testEmail);
    } catch (e: any) {
        console.error('❌ Registration Failed:', e.response?.data || e.message);
        process.exit(1);
    }

    // 2. Duplicate Delivery Test
    console.log('\n[2] Testing Duplicate Delivery Prevention...');
    const today = new Date().toISOString();
    try {
        // First delivery
        await axios.post(`${API_URL}/deliveries`, {
            itemCount: 10,
            date: today,
            notes: 'First delivery'
        }, { headers: { Authorization: `Bearer ${courierToken}` } });
        console.log('✅ First Delivery Created');

        // Second delivery (Same Date) - Should ideally fail or allow?
        // Current logic allows it. We want to demonstrate this "bug" if it's considered one, 
        // or just show it works if it's allowed. 
        // User requested "find bugs". A strict system shouldn't allow 2 reports for same day without warning.
        await axios.post(`${API_URL}/deliveries`, {
            itemCount: 5,
            date: today,
            notes: 'Second delivery (Duplicate!)'
        }, { headers: { Authorization: `Bearer ${courierToken}` } });
        console.log('⚠️  Second Delivery Created (Potential Duplicate Logic Missing)');
    } catch (e: any) {
        console.log('✅ Second Delivery Blocked:', e.response?.data?.message);
    }

    // 3. Payout Data Integrity Test
    console.log('\n[3] Testing Payout Data Integrity (Bonus/Deduction)...');
    // We need an admin token. Let's hijack one or create one.
    // For simplicity, let's just inspect the schema via Prism directly since we know the controller code.
    // But let's try to hit the endpoint to see if it accepts the fields.

    // Create an Admin user
    const adminEmail = `admin_${Date.now()}@example.com`;
    let adminToken = '';
    try {
        const res = await axios.post(`${API_URL}/auth/register`, {
            name: 'Admin Tester',
            email: adminEmail,
            password: testPassword,
            role: 'ADMIN' // Assuming register allows creating admin for now (it does)
        });
        adminToken = res.data.token;
        console.log('✅ Admin Created');
    } catch (e: any) {
        console.error('❌ Admin Creation Failed', e.response?.data);
    }

    if (adminToken) {
        try {
            // Find a delivery to pay (use the one we created)
            const uDeliveries = await prisma.delivery.findMany({ where: { courierId } });
            const deliveryIds = uDeliveries.map(d => d.id);

            // Attempt Payout with Bonus/Deduction
            const payoutRes = await axios.post(`${API_URL}/payments/payout`, {
                courierId,
                deliveryIds,
                amount: 50000, // Arbitrary total to satisfy 'amount'
                bonus: 10000, // NEW FIELD
                deduction: 5000, // NEW FIELD
                method: 'CASH',
                notes: 'Test Payout'
            }, { headers: { Authorization: `Bearer ${adminToken}` } });

            console.log('✅ Payout Request Sent. Response:', payoutRes.data);

            // VERIFY: Check if Bonus/Deduction were saved in DB
            const savedPayment = await prisma.payment.findUnique({
                where: { id: payoutRes.data.id }
            });

            console.log('--- DB Verification ---');
            // Check if schema even has these fields (TS will complain if I try to access non-existent fields, so I cast to any)
            const record = savedPayment as any;
            if (record.bonus !== undefined || record.deduction !== undefined) {
                console.log('✅ Bonus/Deduction Saved in DB!');
            } else {
                console.log('❌ BUG FOUND: Bonus/Deduction fields MISSING in Database Record!');
                console.log('   Stored Record Keys:', Object.keys(record));
            }

        } catch (e: any) {
            console.error('❌ Payout Failed:', e.response?.data || e.message);
        }
    }

    console.log('\n--- TEST COMPLETE ---');
}

runTests();
