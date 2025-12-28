import { db } from './connection';
import { category } from '../schemas';
import categories from './data/categories.json';

export default async function seedCategory() {
  await db.insert(category).values(categories);
  console.log('✓ Categories seeded');
}

seedCategory().catch(console.error);
