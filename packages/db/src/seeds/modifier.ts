import { db } from './connection';
import { product, modifierGroup, modifier } from '../schemas';
import modifiers from './data/modifiers.json';
import { eq, and } from 'drizzle-orm';

export default async function seedModifiers() {
  const org = await db.query.organization.findFirst();

  if (!org) {
    console.warn('⚠ No organization found. Skipping modifier seed.');
    return;
  }

  for (const modGroupData of modifiers) {
    // Find the product this modifier group belongs to
    // Note: The updated json uses 'productName' (singular string)
    const productRecord = await db.query.product.findFirst({
      where: and(
        eq(product.organizationId, org.id),
        eq(product.name, modGroupData.productName)
      ),
    });

    if (!productRecord) {
      console.warn(
        `⚠ Product "${modGroupData.productName}" not found for modifier group "${modGroupData.name}". Skipping.`
      );
      continue;
    }

    // Insert Modifier Group
    const [insertedGroup] = await db
      .insert(modifierGroup)
      .values({
        organizationId: org.id,
        productId: productRecord.id, // Link to specific product
        name: modGroupData.name,
        minSelections: modGroupData.minSelections,
        maxSelections: modGroupData.maxSelections,
        isRequired: modGroupData.isRequired,
      })
      // No unique constraint on (productId, name) in schema currently, but good to handle
      .returning();

    // If we didn't insert (e.g. if we had onConflict), we'd need to fetch.
    // For now assuming safe to insert or we skip if we had unique constraints properly set.
    // Since schema has only index, we rely on logic or add constraint.
    // Let's assume for seeding we might run multiple times, so ideally we check existence first or use onConflict if constraint exists.
    // The current schema doesn't seem to have a unique constraint on (productId, name).
    // So to avoid duplicates on re-seed, let's check first.

    let groupId = insertedGroup?.id;

    if (!groupId) {
      const existingGroup = await db.query.modifierGroup.findFirst({
        where: and(
          eq(modifierGroup.organizationId, org.id),
          eq(modifierGroup.productId, productRecord.id),
          eq(modifierGroup.name, modGroupData.name)
        ),
      });
      if (existingGroup) groupId = existingGroup.id;
    }

    if (groupId && modGroupData.modifiers) {
      for (const modOption of modGroupData.modifiers) {
        let referencedProductId = null;
        if ((modOption as any).referencedProductName) {
          const refProduct = await db.query.product.findFirst({
            where: and(
              eq(product.organizationId, org.id),
              eq(product.name, (modOption as any).referencedProductName)
            ),
          });

          if (refProduct) {
            referencedProductId = refProduct.id;
          } else {
            console.warn(
              `⚠ Referenced product "${(modOption as any).referencedProductName}" not found for modifier "${modOption.name}". Skipping reference.`
            );
          }
        }

        await db
          .insert(modifier)
          .values({
            organizationId: org.id,
            modifierGroupId: groupId,
            name: modOption.name,
            basePrice: modOption.basePrice,
            isDefault: (modOption as any).isDefault || false,
            referencedProductId,
          })
          .onConflictDoNothing();
      }
    }
  }

  console.log(`✓ seeded ${modifiers.length} modifier groups`);
}
