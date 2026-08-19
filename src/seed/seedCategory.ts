import mongoose from "mongoose";
import dotenv from "dotenv";

import { Category } from "../models/Category";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined");
}

interface CategorySeed {
  name: string;
  slug: string;
  prefix: string;
}

const categories: CategorySeed[] = [
  {
    name: "T-Shart",
    slug: "t-shart",
    prefix: "10",
  },
  {
    name: "Shoe",
    slug: "shoce",
    prefix: "20",
  },
  {
    name: "Pant",
    slug: "pant",
    prefix: "30",
  },
];

const seedCategories = async () => {
  try {
    console.log("\n🚀 Connecting to MongoDB...\n");

    await mongoose.connect(MONGODB_URI);

    console.log("✅ MongoDB connected\n");

    for (const categoryData of categories) {
      const existingCategory = await Category.findOne({
        $or: [{ slug: categoryData.slug }, { prefix: categoryData.prefix }],
      });

      if (existingCategory) {
        console.log(
          `⏭️ Category already exists: ${existingCategory.name} (${existingCategory.slug})`,
        );
        continue;
      }

      const category = await Category.create(categoryData);

      console.log(
        `✅ Category created: ${category.name} | slug=${category.slug} | prefix=${category.prefix}`,
      );
    }

    console.log("\n================================");
    console.log("🎉 CATEGORY SEED COMPLETED");
    console.log("================================\n");

    const allCategories = await Category.find({})
      .select("name slug prefix")
      .sort({ prefix: 1 })
      .lean();

    console.table(allCategories);

    await mongoose.disconnect();

    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ CATEGORY SEED FAILED\n");
    console.error(error);

    await mongoose.disconnect();

    process.exit(1);
  }
};

seedCategories();
