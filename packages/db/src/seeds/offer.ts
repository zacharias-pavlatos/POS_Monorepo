import { db } from './connection';
import { offer, category, offerCategory } from '../schemas';
import offers from './data/offers.json';
import { eq, and, inArray } from 'drizzle-orm';

export default async function seedOffers() {
  const org = await db.query.organization.findFirst();

  if (!org) {
    console.warn('⚠ No organization found. Skipping offer seed.');
    return;
  }

  for (const offerData of offers) {
    const { targetCategoryNames, ...offerFields } = offerData as any;

    // 1. Insert Offer
    const [insertedOffer] = await db
      .insert(offer)
      .values({
        ...offerFields,
        organizationId: org.id,
        validFrom: new Date(offerData.validFrom),
      })
      .onConflictDoNothing({
        target: [offer.organizationId, offer.name],
      })
      .returning();

    const offerRecord =
      insertedOffer ||
      (await db.query.offer.findFirst({
        where: and(eq(offer.organizationId, org.id), eq(offer.name, offerData.name)),
      }));

    if (!offerRecord) continue;

    // 2. Link to Categories if needed
    if (
      offerData.scope === 'category' &&
      targetCategoryNames &&
      targetCategoryNames.length > 0
    ) {
      const categories = await db.query.category.findMany({
        where: and(
          eq(category.organizationId, org.id),
          inArray(category.name, targetCategoryNames)
        ),
      });

      for (const cat of categories) {
        await db
          .insert(offerCategory)
          .values({
            organizationId: org.id,
            offerId: offerRecord.id,
            categoryId: cat.id,
          })
          .onConflictDoNothing();
      }
    }
  }

  console.log(`✓ seeded ${offers.length} offers`);
}
