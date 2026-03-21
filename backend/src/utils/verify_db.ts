import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking production database column type for TaskLog.description...");
  try {
    const result: any[] = await prisma.$queryRaw`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'TaskLog' AND column_name = 'description';
    `;
    console.log("Actual Database Metadata:");
    console.table(result);
    
    if (result.length > 0 && result[0].data_type !== 'text') {
        console.warn("\n!!! WARNING: The database column is NOT yet 'text'. It is still '" + result[0].data_type + "' with a limit of " + result[0].character_maximum_length + ".");
        console.warn("You MUST run 'npx prisma db push' to apply the schema change to the database.");
    } else {
        console.log("\nSuccess: The database column is correctly set to 'text'.");
    }
  } catch (error: any) {
    console.error("Diagnostic failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
