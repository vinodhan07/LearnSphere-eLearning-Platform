import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Cleanup
    await prisma.enrollment.deleteMany();
    await prisma.lessonProgress.deleteMany();
    await prisma.quizAttempt.deleteMany();
    await prisma.quizQuestion.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.course.deleteMany();
    // We don't delete users to preserve auth accounts, or we could if we want a fresh start.
    // For now, let's just seed courses.

    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

    if (!adminUser) {
        console.log('No admin user found. Please sign up as admin first or manually create one.');
        return;
    }

    // Create a sample course
    const course = await prisma.course.create({
        data: {
            title: 'Advanced React Patterns',
            description: 'Master advanced React concepts including HOCs, Render Props, and Custom Hooks.',
            image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=800',
            tags: ['React', 'Frontend', 'Web Development'],
            published: true,
            website: 'https://react.dev',
            visibility: 'EVERYONE',
            accessRule: 'OPEN',
            price: 0,
            currency: 'USD',
            responsibleAdminId: adminUser.id,
            lessons: {
                create: [
                    {
                        title: 'Introduction to Patterns',
                        description: 'Overview of common React patterns.',
                        content: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        duration: 10.5,
                        type: 'video',
                        order: 1,
                        allowDownload: true,
                        attachments: [],
                    },
                    {
                        title: 'Render Props vs Hooks',
                        description: 'Comparing different component composition techniques.',
                        content: '# Render Props\n\nRender props are a technique...',
                        duration: 15,
                        type: 'document',
                        order: 2,
                        allowDownload: false,
                    }
                ]
            }
        }
    });

    console.log(`Seeded course: ${course.title}`);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
