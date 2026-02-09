/* eslint-disable no-console */
import seedCatalog from './catalog';
import seedRestaurants from './restaurant';
import seedWorkstations from './workstation';
import seedCategories from './category';
import seedProducts from './product';
import seedModifiers from './modifier';
import seedOffers from './offer';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Note: Organization is expected to exist (created by auth/init)
    // If you need to seed a fresh organization, creating a separate seed file is recommended.

    await seedRestaurants();
    await seedWorkstations();
    await seedCatalog();
    await seedCategories();
    await seedProducts();
    await seedModifiers();
    await seedOffers();

    console.log('✓ Seeding complete!');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();
