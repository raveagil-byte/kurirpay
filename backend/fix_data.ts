
import prisma from './src/prisma';
import { DeliveryStatus, PaymentStatus } from '@prisma/client';

async function fixData() {
    console.log('--- STARTING DATA FIX ---');

    // Find inconsistent records
    const inconsistent = await prisma.delivery.findMany({
        where: {
            status: { not: DeliveryStatus.APPROVED },
            paymentStatus: PaymentStatus.PAID
        }
    });

    console.log(`Found ${inconsistent.length} inconsistent records.`);

    if (inconsistent.length > 0) {
        // Fix them
        const result = await prisma.delivery.updateMany({
            where: {
                status: { not: DeliveryStatus.APPROVED },
                paymentStatus: PaymentStatus.PAID
            },
            data: {
                paymentStatus: PaymentStatus.UNPAID,
                paymentId: null
            }
        });
        console.log(`✅ Fixed ${result.count} records. Status reset to UNPAID.`);
    } else {
        console.log('No fixes needed.');
    }
}

fixData()
    .catch((e) => console.error(e))
    .finally(() => prisma.$disconnect());
