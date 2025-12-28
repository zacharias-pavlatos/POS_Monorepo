/* eslint-disable no-console */
import seedCategory from "./category";

const seeders = {
  category: seedCategory,
};

const tableToSeed = process.argv[2];
// TODO: USE DRIZZLE SEED NOT THIS SHIT !!!!

async function main() {
  if (!tableToSeed) {
    console.log("🌱 Seeding all tables...");
    for (const [name, seeder] of Object.entries(seeders)) {
      await seeder();
      console.log(`✓ ${name}`);
    }
    return;
  }

  const seeder = seeders[tableToSeed as keyof typeof seeders];
  if (!seeder) {
    console.error(`✗ Unknown table: ${tableToSeed}`);
    console.warn(`Available: ${Object.keys(seeders).join(", ")}`);
    process.exit(1);
  }

  await seeder();
}

main().catch(console.error);
