import { db } from './connection';
import { product, category, categoryProduct } from '../schemas';
import products from './data/products.json';
import { eq, and, inArray } from 'drizzle-orm';

export default async function seedProducts() {
  const org = await db.query.organization.findFirst();

  if (!org) {
    console.warn('⚠ No organization found. Skipping product seed.');
    return;
  }

  for (const prod of products) {
    // 1. Insert Product
    const [insertedProduct] = await db
      .insert(product)
      .values({
        organizationId: org.id,
        name: prod.name,
        description: prod.description,
        basePrice: prod.basePrice,
        isActive: prod.isActive,
      })
      .onConflictDoNothing({
        target: [product.organizationId, product.name],
      })
      .returning();

    // If product already exists, fetch it
    const productRecord =
      insertedProduct ||
      (await db.query.product.findFirst({
        where: and(eq(product.organizationId, org.id), eq(product.name, prod.name)),
      }));

    if (!productRecord) continue;

    // 2. Link to Categories
    if (prod.categoryNames && prod.categoryNames.length > 0) {
      const categories = await db.query.category.findMany({
        where: and(
          eq(category.organizationId, org.id),
          inArray(category.name, prod.categoryNames)
        ),
      });

      for (const cat of categories) {
        await db
          .insert(categoryProduct)
          .values({
            organizationId: org.id,
            productId: productRecord.id,
            categoryId: cat.id,
          })
          .onConflictDoNothing();
      }
    }
  }

  console.log(`✓ seeded ${products.length} products`);
}
