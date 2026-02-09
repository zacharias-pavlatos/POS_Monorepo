import { db } from './connection';
import { catalog, organization } from '../schemas';
import catalogs from './data/catalog.json';

export default async function seedCatalog() {
  const org = await db.query.organization.findFirst();

  if (!org) {
    console.warn('⚠ No organization found. Skipping catalog seed.');
    return;
  }
  const data = catalogs.map(catalog => ({
    ...catalog,
    organizationId: org.id,
  }));

  await db
    .insert(catalog)
    .values(data)
    .onConflictDoNothing({
      target: [catalog.organizationId, catalog.name],
    });

  console.log(`✓ seeded ${data.length} catalogs`);
}
