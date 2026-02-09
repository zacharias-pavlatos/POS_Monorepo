import { db } from './connection';
import { restaurant } from '../schemas';
import restaurants from './data/restaurants.json';

export default async function seedRestaurants() {
  const org = await db.query.organization.findFirst();

  if (!org) {
    console.warn('⚠ No organization found. Skipping restaurant seed.');
    return;
  }

  const data = restaurants.map(rest => ({
    ...rest,
    organizationId: org.id,
  }));

  await db
    .insert(restaurant)
    .values(data)
    .onConflictDoNothing({
      target: [restaurant.organizationId],
    });

  console.log(`✓ seeded ${data.length} restaurants`);
}
