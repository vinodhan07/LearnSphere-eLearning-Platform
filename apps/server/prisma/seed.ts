import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string) {
    return bcrypt.hash(password, 10);
}

async function main() {
    console.log('🌱 Seeding database...');

    const adminPassword = await hashPassword('admin123');
    const instructorPassword = await hashPassword('instructor123');
    const learnerPassword = await hashPassword('learner123');

    // Admin
    const admin = await prisma.user.upsert({
        where: { email: 'admin.learnsphere@gmail.com' },
        update: {},
        create: {
            email: 'admin.learnsphere@gmail.com',
            name: 'Admin User',
            password: adminPassword,
            role: 'ADMIN',
            totalPoints: 1000,
        },
    });
    console.log(`Created Admin: ${admin.email}`);

    // Instructor
    const instructor = await prisma.user.upsert({
        where: { email: 'instructor.learnsphere@gmail.com' },
        update: {},
        create: {
            email: 'instructor.learnsphere@gmail.com',
            name: 'Instructor User',
            password: instructorPassword,
            role: 'INSTRUCTOR',
            totalPoints: 500,
        },
    });
    console.log(`Created Instructor: ${instructor.email}`);

    // Learner
    const learner = await prisma.user.upsert({
        where: { email: 'learner.learnsphere@gmail.com' },
        update: {},
        create: {
            email: 'learner.learnsphere@gmail.com',
            name: 'Learner User',
            password: learnerPassword,
            role: 'LEARNER',
            totalPoints: 0,
        },
    });
    console.log(`Created Learner: ${learner.email}`);

    console.log('✅ Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
