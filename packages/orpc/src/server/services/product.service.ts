import { DatabaseOrTransaction } from '@repo/db/client';
import { productRepository, categoryRepository } from '@repo/db/repositories';
import { categoryProduct } from '@repo/db/schema';

import type { InsertProductInputType } from '@repo/db/schema';

export function productService(db: DatabaseOrTransaction, organizationId: string) {
  return {
    async createWithCategories(data: InsertProductInputType, categoryIds: string[]) {
      //Dedupe category ids
      const uniqCategoryIds = [...new Set(categoryIds)];

      return db.transaction(async tx => {
        const productRepo = productRepository({ db: tx, organizationId });

        const categoryRepo = categoryRepository({ db: tx, organizationId });

        //TODO: Should i validate categories belong to this org ??

        const product = await productRepo.create(data);
        if (!product) throw new Error('Failed to create product');

        if (uniqCategoryIds.length > 0) {
          //TODO: Create a multy insert function in category repo and use it here
          await tx
            .insert(categoryProduct)
            .values(
              uniqCategoryIds.map((categoryId, index) => ({
                organizationId,
                categoryId,
                productId: product.id,
                displayOrder: index,
              }))
            )
            .onConflictDoNothing({
              target: [
                //categoryProduct.organizationId,
                categoryProduct.categoryId,
                categoryProduct.productId,
              ],
            });
        }

        return product;
      });
    },
  };
}
