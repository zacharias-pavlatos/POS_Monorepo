import { categoryRepository } from '@repo/db/repositories';

import { authProcedure } from '../procedures.js';

const categoryRouter = {
  all: authProcedure.categories.all.handler(({ context }) => {
    return categoryRepository(context.db).findAll();
  }),

  one: authProcedure.categories.one.handler(async ({ context, input, errors }) => {
    const dbCategory = await categoryRepository(context.db).findById(input.id);

    if (!dbCategory) {
      throw errors.NOT_FOUND({
        data: {
          categoryId: input.id,
        },
      });
    }
    return dbCategory;
  }),

  create: authProcedure.categories.create.handler(async ({ context, input, errors }) => {
    const res = await categoryRepository(context.db).create(input);

    if (!res) {
      throw errors.BAD_REQUEST({
        message: 'Failed to create category',
      });
    }
    return res;
  }),

  update: authProcedure.categories.update.handler(async ({ context, input, errors }) => {
    const { id, ...data } = input;
    const updated = await categoryRepository(context.db).update(id, data);

    if (!updated) {
      throw errors.NOT_FOUND({
        data: {
          categoryId: input.id,
        },
      });
    }

    return updated;
  }),

  delete: authProcedure.categories.delete.handler(async ({ context, input, errors }) => {
    const res = await categoryRepository(context.db).delete(input.id);

    if (!res) {
      throw errors.NOT_FOUND({
        data: {
          categoryId: input.id,
        },
      });
    }
    return res;
  }),
};

export default categoryRouter;
