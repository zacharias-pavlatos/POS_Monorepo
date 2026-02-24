/**
 * /offers
 *
 * Promotions and discounts system. Offers can target specific products,
 * categories, or entire orders. Supports time-based scheduling,
 * priority ordering, and stackable discounts.
 */

import { oc } from '@orpc/contract';
import { z } from 'zod';

import {
  InsertOfferSchema,
  PatchOfferSchema,
  SelectOfferSchema,
  InsertOfferCategorySchema,
  SelectOfferCategorySchema,
  InsertOfferProductSchema,
  SelectOfferProductSchema,
} from '@repo/db/schema';

import { missingIdError } from '../utils/commonErrors';

const offerContract = oc
  .prefix('/offers')
  .tag('offer')
  .router({
    all: oc
      .route({
        method: 'GET',
        path: '/',
        summary: 'List all offers',
        description: 'Retrieve all offers for the organization.',
      })
      .output(z.array(SelectOfferSchema)),

    active: oc
      .route({
        method: 'GET',
        path: '/active',
        summary: 'List currently active offers',
        description:
          'Retrieve offers that are currently active based on dates, time, and day-of-week rules. Includes linked categories and products.',
      })
      .output(
        z.array(
          SelectOfferSchema.extend({
            categories: z.array(
              SelectOfferCategorySchema.extend({
                category: z.any(), // Category schema
              })
            ),
            products: z.array(
              SelectOfferProductSchema.extend({
                product: z.any(), // Product schema
              })
            ),
          })
        )
      ),

    one: oc
      .route({
        method: 'GET',
        path: '/{id}',
        summary: 'Retrieve an offer',
        description: 'Returns a single offer by its unique identifier.',
      })
      .errors(missingIdError)
      .input(z.object({ id: z.uuid() }))
      .output(SelectOfferSchema),

    oneDetailed: oc
      .route({
        method: 'GET',
        path: '/{id}',
        summary: 'Retrieve an offer',
        description: 'Returns a single offer with linked categories and products.',
      })
      .errors(missingIdError)
      .input(z.object({ id: z.uuid() }))
      .output(
        SelectOfferSchema.extend({
          categories: z
            .array(
              SelectOfferCategorySchema.extend({
                category: z.any(),
              })
            )
            .optional(),
          products: z
            .array(
              SelectOfferProductSchema.extend({
                product: z.any(),
              })
            )
            .optional(),
        })
      ),

    create: oc
      .route({
        method: 'POST',
        path: '/',
        summary: 'Create a new offer',
        description:
          'Creates a new promotion or discount. Offer names must be unique within the organization.',
      })
      .input(InsertOfferSchema)
      .output(SelectOfferSchema),

    update: oc
      .route({
        method: 'PATCH',
        path: '/{id}',
        summary: 'Update an offer',
        description:
          'Partially updates an existing offer. Only provided fields will be modified.',
      })
      .errors(missingIdError)
      .input(z.object({ id: z.uuid() }).and(PatchOfferSchema))
      .output(SelectOfferSchema),

    delete: oc
      .route({
        method: 'DELETE',
        path: '/{id}',
        summary: 'Delete an offer',
        description: 'Soft deletes an offer (marks as deleted but keeps in database).',
      })
      .errors(missingIdError)
      .input(z.object({ id: z.uuid() }))
      .output(SelectOfferSchema),

    // ── Category targeting ────────────────────────────────────────────

    listCategories: oc
      .route({
        method: 'GET',
        path: '/{offerId}/categories',
        summary: 'List categories assigned to an offer',
        description: 'Retrieve all categories targeted by a specific offer.',
      })
      .input(z.object({ offerId: z.uuid() }))
      .output(z.array(SelectOfferCategorySchema)),

    addCategory: oc
      .route({
        method: 'POST',
        path: '/{offerId}/categories',
        summary: 'Assign a category to an offer',
        description:
          'Links a category to an offer so all products in that category receive the discount.',
      })
      .input(z.object({ offerId: z.uuid() }).and(InsertOfferCategorySchema))
      .output(SelectOfferCategorySchema),

    removeCategory: oc
      .route({
        method: 'DELETE',
        path: '/{offerId}/categories/{categoryId}',
        summary: 'Remove a category from an offer',
        description: 'Unlinks a category from an offer.',
      })
      .input(z.object({ offerId: z.uuid(), categoryId: z.uuid() }))
      .output(SelectOfferCategorySchema),

    // ── Product targeting ─────────────────────────────────────────────

    listProducts: oc
      .route({
        method: 'GET',
        path: '/{offerId}/products',
        summary: 'List products assigned to an offer',
        description: 'Retrieve all products targeted by a specific offer.',
      })
      .input(z.object({ offerId: z.uuid() }))
      .output(z.array(SelectOfferProductSchema)),

    addProduct: oc
      .route({
        method: 'POST',
        path: '/{offerId}/products',
        summary: 'Assign a product to an offer',
        description: 'Links a specific product to an offer for targeted discounts.',
      })
      .input(z.object({ offerId: z.uuid() }).and(InsertOfferProductSchema))
      .output(SelectOfferProductSchema),

    removeProduct: oc
      .route({
        method: 'DELETE',
        path: '/{offerId}/products/{productId}',
        summary: 'Remove a product from an offer',
        description: 'Unlinks a product from an offer.',
      })
      .input(z.object({ offerId: z.uuid(), productId: z.uuid() }))
      .output(SelectOfferProductSchema),
  });

export default offerContract;
