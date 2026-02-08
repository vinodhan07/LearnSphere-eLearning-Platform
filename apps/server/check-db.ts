import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const courses = await prisma.course.findMany();
    console.log(`Checking DB directly... Found ${courses.length} courses`);
    if (courses.length > 0) {
        console.log('First course:', courses[0]);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
