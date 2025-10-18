// prisma/seed.ts
import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 1️⃣ Create Tags
  const tagNames = [
    'JavaScript',
    'Python',
    'C++',
    'Java',
    'HTML',
    'CSS',
    'SQL',
    'Go',
    'Rust',
  ];
  const tags = await Promise.all(
    tagNames.map((name) =>
      prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );
  console.log(`✅ Created ${tags.length} tags`);

  // 2️⃣ Create Users
  const users = await Promise.all(
    Array.from({ length: 10 }).map(() =>
      prisma.user.create({
        data: {
          email: faker.internet.email(),
          name: faker.person.fullName(),
          password: faker.internet.password(),
          role: faker.helpers.arrayElement(['USER', 'ADMIN']),
        },
      }),
    ),
  );
  console.log(`✅ Created ${users.length} users`);

  // 3️⃣ Create Articles
  const articles = await Promise.all(
    Array.from({ length: 30 }).map(() => {
      const author = faker.helpers.arrayElement(users);
      return prisma.artical.create({
        data: {
          title: faker.lorem.sentence(),
          description: faker.lorem.paragraph(),
          content: faker.lorem.paragraphs({ min: 2, max: 5 }),
          author: { connect: { id: author.id } },
        },
      });
    }),
  );
  console.log(`✅ Created ${articles.length} articles`);

  // 4️⃣ Create Projects
  const projects = await Promise.all(
    Array.from({ length: 20 }).map(() => {
      const owner = faker.helpers.arrayElement(users);
      return prisma.project.create({
        data: {
          title: faker.commerce.productName(),
          description: faker.commerce.productDescription(),
          owner: { connect: { id: owner.id } },
        },
      });
    }),
  );
  console.log(`✅ Created ${projects.length} projects`);

  // 5️⃣ Create Snippets with Tags
  const snippets = await Promise.all(
    Array.from({ length: 40 }).map(async () => {
      const creator = faker.helpers.arrayElement(users);
      const randomTags = faker.helpers.arrayElements(
        tags,
        faker.number.int({ min: 1, max: 3 }),
      );
      return prisma.snippet.create({
        data: {
          name: faker.hacker.verb() + ' ' + faker.hacker.noun(),
          description: faker.lorem.sentence(),
          code: faker.helpers.arrayElement([
            'console.log("Hello World");',
            'def greet(): print("Hello")',
            'function add(a,b){return a+b}',
          ]),
          creator: { connect: { id: creator.id } },
          tags: {
            connect: randomTags.map((tag) => ({ id: tag.id })),
          },
        },
      });
    }),
  );
  console.log(`✅ Created ${snippets.length} snippets`);

  // 6️⃣ Create Chats and Messages
  for (let i = 0; i < 10; i++) {
    const chatUsers = faker.helpers.arrayElements(
      users,
      faker.number.int({ min: 2, max: 5 }),
    );
    const chat = await prisma.chat.create({
      data: {
        name: faker.company.name(),
        users: {
          connect: chatUsers.map((u) => ({ id: u.id })),
        },
      },
    });

    // Messages for this chat
    const messagesCount = faker.number.int({ min: 5, max: 15 });
    for (let j = 0; j < messagesCount; j++) {
      const author = faker.helpers.arrayElement(chatUsers);
      await prisma.message.create({
        data: {
          content: faker.lorem.sentence(),
          author: { connect: { id: author.id } },
          chat: { connect: { id: chat.id } },
        },
      });
    }
  }
  console.log('✅ Created 10 chats with messages');

  console.log('🌿 Seeding finished successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
