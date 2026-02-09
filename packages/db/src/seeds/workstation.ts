import { db } from './connection';
import { workStation } from '../schemas';
import workstations from './data/workstations.json';

export default async function seedWorkstations() {
  const org = await db.query.organization.findFirst();

  if (!org) {
    console.warn('⚠ No organization found. Skipping workstation seed.');
    return;
  }

  const data = workstations.map(ws => ({
    ...ws,
    organizationId: org.id,
  }));

  await db
    .insert(workStation)
    .values(data)
    .onConflictDoNothing({
      target: [workStation.organizationId, workStation.name],
    });

  console.log(`✓ seeded ${data.length} workstations`);
}
