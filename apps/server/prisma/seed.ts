import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin.learnsphere@gmail.com' },
        update: {},
        create: {
            email: 'admin.learnsphere@gmail.com',
            password: adminPassword,
            name: 'Admin User',
            role: 'ADMIN',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
        },
    });
    console.log('✅ Created admin:', admin.email);

    // Create instructor user
    const instructorPassword = await bcrypt.hash('instructor123', 10);
    const instructor = await prisma.user.upsert({
        where: { email: 'instructor.learnsphere@gmail.com' },
        update: {},
        create: {
            email: 'instructor.learnsphere@gmail.com',
            password: instructorPassword,
            name: 'Sarah Johnson',
            role: 'INSTRUCTOR',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
        },
    });
    console.log('✅ Created instructor:', instructor.email);

    // Create learner user
    const learnerPassword = await bcrypt.hash('learner123', 10);
    const learner = await prisma.user.upsert({
        where: { email: 'learner.learnsphere@gmail.com' },
        update: {},
        create: {
            email: 'learner.learnsphere@gmail.com',
            password: learnerPassword,
            name: 'Alex Student',
            role: 'LEARNER',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
            totalPoints: 65,
        },
    });
    console.log('✅ Created learner:', learner.email);

    console.log('🎉 Seeding complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
