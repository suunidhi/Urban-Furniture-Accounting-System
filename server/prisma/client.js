import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

// Parse DATABASE_URL: mysql://user:pass@host:port/dbname
function parseDbUrl(url) {
  try {
    const u = new URL(url);
    return {
      host: u.hostname,
      port: parseInt(u.port || '3306', 10),
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: u.pathname.replace(/^\//, ''),
    };
  } catch {
    throw new Error(`Invalid DATABASE_URL: ${url}`);
  }
}

const dbConfig = parseDbUrl(process.env.DATABASE_URL);

const adapter = new PrismaMariaDb(dbConfig);
const prisma = new PrismaClient({ adapter });

export default prisma;
