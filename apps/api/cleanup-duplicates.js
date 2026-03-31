const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
const dotenv = require('dotenv');

dotenv.config();

const libsqlConfig = {
  url: process.env.DATABASE_URL || 'file:./dev.db',
};

const adapter = new PrismaLibSql(libsqlConfig);
const prisma = new PrismaClient({ adapter });

async function checkDuplicates() {
  const queues = await prisma.queue.findMany();
  console.log('Total Queues:', queues.length);
  
  const counts = {};
  queues.forEach(q => {
    const key = `${q.tenantId}-${q.name}`;
    if (!counts[key]) counts[key] = [];
    counts[key].push(q.id);
  });
  
  for (const [key, ids] of Object.entries(counts)) {
    if (ids.length > 1) {
      console.log(`Duplicate found for ${key}:`, ids);
      // Delete duplicates keeping only the first one
      const toDelete = ids.slice(1);
      for (const id of toDelete) {
        // First check if there are tokens associated with this queue
        const tokens = await prisma.token.findMany({ where: { queueId: id } });
        if (tokens.length > 0) {
          console.log(`Queue ${id} has ${tokens.length} tokens. Reassigning them to ${ids[0]}...`);
          await prisma.token.updateMany({
            where: { queueId: id },
            data: { queueId: ids[0] }
          });
        }
        await prisma.queue.delete({ where: { id } });
        console.log(`Deleted duplicate queue ${id}`);
      }
    }
  }
}

checkDuplicates()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
