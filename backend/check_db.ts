
import prisma from './src/prisma';

async function checkData() {
    try {
        console.log('--- Database Check ---');
        console.log('Connecting to DB...');

        // Count Users
        const userCount = await prisma.user.count();
        console.log(`Users found: ${userCount}`);

        if (userCount > 0) {
            const users = await prisma.user.findMany({ select: { name: true, email: true, role: true } });
            console.table(users);
        }

        // Count Deliveries
        const deliveryCount = await prisma.delivery.count();
        console.log(`Deliveries found: ${deliveryCount}`);

        // Count System Settings
        const settingsCount = await prisma.systemSettings.count();
        console.log(`Settings found: ${settingsCount}`);

    } catch (error) {
        console.error('Error connecting to database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkData();
