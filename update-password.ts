import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("Admin@123456", 10);
  await prisma.account.updateMany({
    data: {
      password: hash
    }
  });
  console.log("Password successfully updated to bcrypt hash!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
