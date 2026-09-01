import { prisma } from "../config/database.js";
import { ProductQueryFilters } from "../types/product.types.js";

export class ProductService {
  static async getProducts(filters: ProductQueryFilters) {
    const where: any = {
      active: true,
    };

    if (filters.category) {
      where.category = {
        equals: filters.category,
        mode: "insensitive", // case-insensitive category match
      };
    }

    if (filters.brand) {
      where.brand = {
        equals: filters.brand,
        mode: "insensitive", // case-insensitive brand match
      };
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) {
        where.price.gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        where.price.lte = filters.maxPrice;
      }
    }

    if (filters.minRating !== undefined) {
      where.rating = {
        gte: filters.minRating,
      };
    }

    if (filters.inStock) {
      where.stock = {
        gt: 0,
      };
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { brand: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          merchantId: true,
          name: true,
          slug: true,
          description: true,
          brand: true,
          category: true,
          price: true,
          currency: true,
          stock: true,
          rating: true,
          features: true,
          imageUrl: true,
          active: true,
          createdAt: true,
          updatedAt: true,
          variants: {
            where: { active: true },
            select: { id: true }
          }
        },
        skip: filters.offset,
        take: filters.limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({ where }),
    ]);

    const productsWithSignal = products.map((p) => {
      const { variants, ...prod } = p;
      return {
        ...prod,
        hasVariants: variants.length > 0,
      };
    });

    return { products: productsWithSignal, total };
  }

  static async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        merchant: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            active: true,
          },
        },
        variants: {
          where: { active: true },
        },
      },
    });

    // Verify product exists and is active, and the merchant is active
    if (!product || !product.active || !product.merchant.active) {
      return null;
    }

    return product;
  }
}
