/**
 * /modifier-dependencies
 *
 * Dependency rules between modifiers — controls price overrides
 * and conditional availability.
 *
 * Each rule says: "When [trigger] is selected, [target] costs [price]
 * and isAvailable = [isAvailable]."
 *
 * Only exceptions to defaults are stored:
 * - Default price = modifier.basePrice
 * - Default isAvailable = true
 */

import { oc } from '@orpc/contract';
import { z } from 'zod';

import {
  InsertModifierOptionDependencySchema,
  PatchModifierOptionDependencySchema,
  SelectModifierOptionDependencySchema,
} from '@repo/db/schema';

import { missingIdError } from '../utils/commonErrors';

const modifierDependencyContract = oc
  .prefix('/modifier-dependencies')
  .tag('modifier-dependency')
  .router({
    byModifier: oc
      .route({
        method: 'GET',
        path: '/by-modifier/{modifierId}',
        summary: 'List dependencies affecting a modifier',
        description:
          'Retrieve all dependency rules that affect a specific modifier (price/availability overrides).',
      })
      .input(z.object({ modifierId: z.uuid() }))
      .output(z.array(SelectModifierOptionDependencySchema)),

    byTrigger: oc
      .route({
        method: 'GET',
        path: '/by-trigger/{modifierId}',
        summary: 'List dependencies triggered by a modifier',
        description:
          'Retrieve all dependency rules that are activated when a specific modifier is selected.',
      })
      .input(z.object({ modifierId: z.uuid() }))
      .output(z.array(SelectModifierOptionDependencySchema)),

    one: oc
      .route({
        method: 'GET',
        path: '/{id}',
        summary: 'Retrieve a dependency',
        description: 'Returns a single dependency rule by its unique identifier.',
      })
      .errors(missingIdError)
      .input(z.object({ id: z.uuid() }))
      .output(SelectModifierOptionDependencySchema),

    create: oc
      .route({
        method: 'POST',
        path: '/',
        summary: 'Create a dependency rule',
        description:
          'Creates a new price/availability override between two modifiers. Only create rows where behavior differs from defaults (basePrice, isAvailable=true).',
      })
      .input(InsertModifierOptionDependencySchema)
      .output(SelectModifierOptionDependencySchema),

    update: oc
      .route({
        method: 'PATCH',
        path: '/{id}',
        summary: 'Update a dependency rule',
        description:
          'Partially updates an existing dependency rule. Only provided fields will be modified.',
      })
      .errors(missingIdError)
      .input(z.object({ id: z.uuid() }).and(PatchModifierOptionDependencySchema))
      .output(SelectModifierOptionDependencySchema),

    delete: oc
      .route({
        method: 'DELETE',
        path: '/{id}',
        summary: 'Delete a dependency rule',
        description: 'Permanently removes a dependency rule.',
      })
      .errors(missingIdError)
      .input(z.object({ id: z.uuid() }))
      .output(SelectModifierOptionDependencySchema),
  });

export default modifierDependencyContract;
