
import prisma from './src/prisma';

async function checkData() {
    console.log('Checking Deliveries...');
    const deliveries = await prisma.delivery.findMany({
        include: {
            courier: true
        }
    });

    deliveries.forEach(d => {
        console.log(`[${d.courier.name}] ID:${d.id} Date:${d.date.toISOString().split('T')[0]} Status:${d.status} PayStatus:${d.paymentStatus}`);
    });
}

checkData();
