import { db } from './connection';
import { category, catalog, workStation } from '../schemas';
import categories from './data/categories.json';
import { eq, and } from 'drizzle-orm';

export default async function seedCategories() {
  const org = await db.query.organization.findFirst();

  if (!org) {
    console.warn('⚠ No organization found. Skipping category seed.');
    return;
  }

  const data = await Promise.all(
    categories.map(async (cat: any) => {
      // Find catalog
      const catalogRecord = await db.query.catalog.findFirst({
        where: and(eq(catalog.organizationId, org.id), eq(catalog.name, cat.catalogName)),
      });

      // Find workstation
      const workstationRecord = await db.query.workStation.findFirst({
        where: and(
          eq(workStation.organizationId, org.id),
          eq(workStation.name, cat.workstationName)
        ),
      });

      if (!catalogRecord || !workstationRecord) {
        console.warn(
          `⚠ Skipping category "${cat.name}": Catalog "${cat.catalogName}" or Workstation "${cat.workstationName}" not found.`
        );
        return null;
      }

      const { catalogName, workstationName, activeFrom, ...categoryData } = cat;

      return {
        ...categoryData,
        organizationId: org.id,
        catalogId: catalogRecord.id,
        workstationId: workstationRecord.id,
        activeFrom: new Date(activeFrom),
      };
    })
  );

  const validData = data.filter(item => item !== null);

  if (validData.length > 0) {
    await db
      .insert(category)
      .values(validData as any)
      .onConflictDoNothing({
        target: [category.organizationId, category.name],
      });
  }

  console.log(`✓ seeded ${validData.length} categories`);
}
