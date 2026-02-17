import { db } from './connection';
import { workstation } from '../schemas';
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
    .insert(workstation)
    .values(data)
    .onConflictDoNothing({
      target: [workstation.organizationId, workstation.name],
    });

  console.log(`✓ seeded ${data.length} workstations`);
}
