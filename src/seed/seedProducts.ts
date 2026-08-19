import mongoose from "mongoose";
import dotenv from "dotenv";

import { Product } from "../models/Product";
import { ProductVariant } from "../models/ProductVariant";
import { Category } from "../models/Category";
import { generate12DigitBarcode } from "../utils/barcodeGenerator";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined in environment variables");
}

/* =========================================================
   HELPERS
========================================================= */

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const randomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const createProductData = (
  name: string,
  categoryId: mongoose.Types.ObjectId,
  images: string[],
  description: string,
  fullDescription: string,
  highlights: string[],
) => {
  return {
    name,
    slug: slugify(name),
    description,
    fullDescription,
    images,
    thumbnail: images[0],
    highlights,
    category: categoryId,
    isActive: true,
    averageRating: 0,
    reviewCount: 0,
  };
};

/* =========================================================
   PRODUCT DATA
========================================================= */

const tshirtProducts = [
  "Premium Cotton T-Shirt",
  "Classic Round Neck T-Shirt",
  "Essential Everyday T-Shirt",
  "Minimalist Cotton T-Shirt",
  "Premium Casual T-Shirt",
  "Classic Solid T-Shirt",
  "Comfort Fit Cotton T-Shirt",
  "Modern Casual T-Shirt",
  "Basic Everyday Cotton Tee",
  "Soft Breathable T-Shirt",
  "Premium Men's Fashion Tee",
  "Classic Men's Cotton Tee",
  "Urban Casual T-Shirt",
  "Regular Fit Cotton T-Shirt",
  "Modern Solid Cotton T-Shirt",
  "Daily Wear Cotton T-Shirt",
  "Lightweight Summer T-Shirt",
  "Essential Men's Tee",
  "Smart Casual Cotton T-Shirt",
  "Classic Premium Tee",
  "Comfortable Daily T-Shirt",
  "Modern Basic T-Shirt",
  "Soft Cotton Casual Tee",
  "Premium Solid Color T-Shirt",
  "Everyday Fashion Cotton Tee",
  "Classic Comfortable T-Shirt",
  "Urban Style Cotton T-Shirt",
  "Men's Casual Cotton Tee",
  "Simple Premium T-Shirt",
  "Breathable Summer Cotton Tee",
  "Modern Men's Casual Tee",
  "Classic Slim Cotton T-Shirt",
  "Premium Everyday Tee",
];

const jeansProducts = [
  "Slim Fit Denim Jeans For Men",
  "Classic Solid Slim Fit Jeans",
  "Modern Everyday Denim Jeans",
  "Premium Casual Denim Jeans",
  "Classic Blue Slim Fit Jeans",
  "Modern Stretch Denim Jeans",
  "Smart Casual Denim Pants",
  "Regular Fit Men's Jeans",
  "Premium Men's Denim Pants",
  "Classic Five Pocket Jeans",
  "Modern Slim Denim Pants",
  "Everyday Casual Denim Jeans",
  "Comfort Stretch Jeans",
  "Classic Dark Blue Denim",
  "Fashion Slim Fit Denim",
  "Urban Men's Denim Jeans",
  "Premium Stretch Denim Pants",
  "Classic Casual Jeans",
  "Modern Men's Slim Jeans",
  "Daily Wear Denim Pants",
  "Stylish Men's Denim Jeans",
  "Comfortable Slim Fit Jeans",
  "Classic Men's Blue Jeans",
  "Modern Casual Denim Pants",
  "Premium Slim Denim Jeans",
  "Essential Men's Denim",
  "Smart Slim Fit Jeans",
  "Classic Everyday Denim",
  "Fashion Casual Jeans",
  "Durable Men's Denim Pants",
  "Modern Stretch Jeans",
  "Premium Casual Jeans",
];

const shoeProducts = [
  "Men's Casual Lightweight Loafer",
  "Trendy Lace Up Sneakers",
  "Classic Leather Casual Sneakers",
  "Premium Running Shoes",
  "Modern Sports Sneakers",
  "Comfortable Walking Shoes",
  "Classic Men's Casual Shoes",
  "Lightweight Summer Loafers",
  "Premium Athletic Sneakers",
  "Urban Casual Sneakers",
  "Modern Lace Up Shoes",
  "Classic Sports Running Shoes",
  "Everyday Men's Sneakers",
  "Comfort Running Shoes",
  "Premium Casual Sneakers",
  "Smart Casual Men's Shoes",
  "Classic Leather Sneakers",
  "Modern Outdoor Sneakers",
  "Lightweight Training Shoes",
  "Fashion Men's Casual Shoes",
  "Daily Wear Sneakers",
  "Premium Sports Shoes",
  "Classic Running Sneakers",
  "Urban Men's Sneakers",
  "Comfortable Casual Shoes",
  "Modern Athletic Shoes",
  "Stylish Men's Sneakers",
  "Durable Outdoor Shoes",
  "Essential Casual Sneakers",
  "Premium Lightweight Shoes",
  "Classic Lace Up Sneakers",
  "Modern Casual Loafers",
];

/* =========================================================
   IMAGES
========================================================= */

const tshirtImages = [
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&q=80",
  "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=1200&q=80",
  "https://images.unsplash.com/photo-1622445275463-ada2ab674c19?w=1200&q=80",
];

const jeansImages = [
  "https://images.unsplash.com/photo-1542272604-787c3835535d?w=1200&q=80",
  "https://images.unsplash.com/photo-1604176354204-d112352824ac?w=1200&q=80",
  "https://images.unsplash.com/photo-1475178626620-a4d074967452?w=1200&q=80",
];

const shoeImages = [
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80",
  "https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?w=1200&q=80",
  "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=1200&q=80",
];

/* =========================================================
   CATEGORY FINDER
   Uses your EXISTING categories only.
========================================================= */

const findCategory = async (slug: string, label: string) => {
  const category = await Category.findOne({ slug });

  if (!category) {
    throw new Error(
      `${label} category not found. Expected existing slug: "${slug}"`,
    );
  }

  return category;
};

/* =========================================================
   VARIANT GENERATOR
========================================================= */

interface VariantSeed {
  size: string;
  sizeCode: string;
  color: string;
  stock: number;
  price: number;
}

const tshirtVariants: VariantSeed[] = [
  {
    size: "S",
    sizeCode: "0001",
    color: "Black",
    stock: 20,
    price: 850,
  },
  {
    size: "M",
    sizeCode: "0002",
    color: "Black",
    stock: 25,
    price: 850,
  },
  {
    size: "L",
    sizeCode: "0003",
    color: "White",
    stock: 30,
    price: 900,
  },
  {
    size: "XL",
    sizeCode: "0004",
    color: "Navy",
    stock: 18,
    price: 950,
  },
];

const jeansVariants: VariantSeed[] = [
  {
    size: "28",
    sizeCode: "0028",
    color: "Blue",
    stock: 15,
    price: 1850,
  },
  {
    size: "30",
    sizeCode: "0030",
    color: "Blue",
    stock: 20,
    price: 1850,
  },
  {
    size: "32",
    sizeCode: "0032",
    color: "Black",
    stock: 25,
    price: 1950,
  },
  {
    size: "34",
    sizeCode: "0034",
    color: "Blue",
    stock: 15,
    price: 1950,
  },
  {
    size: "36",
    sizeCode: "0036",
    color: "Dark Blue",
    stock: 10,
    price: 2050,
  },
];

const shoeVariants: VariantSeed[] = [
  {
    size: "40",
    sizeCode: "0040",
    color: "Black",
    stock: 12,
    price: 2200,
  },
  {
    size: "41",
    sizeCode: "0041",
    color: "Black",
    stock: 18,
    price: 2250,
  },
  {
    size: "42",
    sizeCode: "0042",
    color: "White",
    stock: 20,
    price: 2300,
  },
  {
    size: "43",
    sizeCode: "0043",
    color: "Black",
    stock: 14,
    price: 2350,
  },
  {
    size: "44",
    sizeCode: "0044",
    color: "White",
    stock: 10,
    price: 2400,
  },
];

/* =========================================================
   SEED PRODUCTS
========================================================= */

const seedCategoryProducts = async (
  category: mongoose.Document & {
    _id: mongoose.Types.ObjectId;
    name: string;
    prefix: string;
  },
  productNames: string[],
  images: string[],
  variants: VariantSeed[],
  type: "tshirt" | "jeans" | "shoes",
) => {
  let createdProducts = 0;
  let createdVariants = 0;

  for (const productName of productNames) {
    const productSlug = slugify(productName);

    const existing = await Product.findOne({
      slug: productSlug,
    });

    if (existing) {
      console.log(`⏭️  Skipping existing product: ${productName}`);
      continue;
    }

    let description = "";
    let fullDescription = "";
    let highlights: string[] = [];

    /* =====================================================
       T-SHIRT
    ===================================================== */

    if (type === "tshirt") {
      description = `${productName} made from soft and breathable cotton fabric for comfortable everyday wear.`;

      fullDescription = `
<h2>${productName}</h2>

<p>
Enjoy everyday comfort with this premium men's cotton t-shirt.
Designed with a clean modern appearance and breathable fabric,
it is suitable for casual outings, weekends and daily wear.
</p>

<ul>
<li>Soft breathable cotton fabric</li>
<li>Comfortable everyday fit</li>
<li>Modern casual appearance</li>
<li>Easy to style with jeans and trousers</li>
<li>Suitable for everyday wear</li>
</ul>

<p>
A versatile wardrobe essential for modern men's casual fashion.
</p>
`;

      highlights = [
        "Soft Cotton Fabric",
        "Breathable",
        "Comfortable Fit",
        "Everyday Wear",
        "Modern Casual Style",
      ];
    }

    /* =====================================================
       JEANS / PANTS
       NOTE: These products belong to your "Pants" category.
    ===================================================== */

    if (type === "jeans") {
      description = `${productName} designed with durable denim fabric, modern styling and comfortable everyday fit.`;

      fullDescription = `
<h2>${productName}</h2>

<p>
Upgrade your everyday wardrobe with these stylish men's denim jeans.
Designed for comfort and durability, these jeans feature a modern
silhouette that works perfectly for casual and everyday outfits.
</p>

<ul>
<li>Durable denim construction</li>
<li>Modern slim fit design</li>
<li>Comfortable everyday styling</li>
<li>Classic solid color appearance</li>
<li>Multiple waist sizes available</li>
</ul>

<p>
Pair these jeans with a t-shirt, polo shirt or casual sneakers
for a clean everyday look.
</p>
`;

      highlights = [
        "Premium Denim",
        "Slim Fit",
        "Durable Fabric",
        "Modern Style",
        "Multiple Sizes",
      ];
    }

    /* =====================================================
       SHOES
    ===================================================== */

    if (type === "shoes") {
      description = `${productName} designed for comfortable everyday movement with a stylish modern appearance.`;

      fullDescription = `
<h2>${productName}</h2>

<p>
Step into everyday comfort with these stylish men's shoes.
Designed for casual activities, outdoor use and daily wear,
they combine practical construction with a modern appearance.
</p>

<ul>
<li>Comfortable everyday construction</li>
<li>Durable sole</li>
<li>Modern stylish appearance</li>
<li>Lightweight feel</li>
<li>Suitable for casual and outdoor use</li>
</ul>

<p>
A versatile footwear option for modern everyday outfits.
</p>
`;

      highlights = [
        "Comfortable Design",
        "Durable Sole",
        "Modern Style",
        "Lightweight",
        "Everyday Wear",
      ];
    }

    /* =====================================================
       CREATE PRODUCT
    ===================================================== */

    const product = await Product.create(
      createProductData(
        productName,
        category._id,
        images,
        description,
        fullDescription,
        highlights,
      ),
    );

    createdProducts++;

    console.log(`✅ Product created: ${product.name}`);

    /* =====================================================
       CREATE VARIANTS
    ===================================================== */

    for (const variantSeed of variants) {
      const barcode = await generate12DigitBarcode(
        category.prefix,
        variantSeed.sizeCode,
      );

      const variant = await ProductVariant.create({
        product: product._id,
        category: category._id,

        size: variantSeed.size,
        color: variantSeed.color,

        design:
          type === "tshirt"
            ? "Classic"
            : type === "jeans"
              ? "Slim Fit"
              : "Casual",

        attributes: new Map([
          ["size", variantSeed.size],
          ["color", variantSeed.color],
        ]),

        stock: Math.max(0, variantSeed.stock + randomNumber(-3, 8)),

        price: Math.max(0, variantSeed.price + randomNumber(-50, 100)),

        sizeCode: variantSeed.sizeCode,
        barcode,

        isActive: true,
      });

      createdVariants++;

      console.log(
        `   └─ Variant: ${variant.size} / ${variant.color} / ${variant.barcode}`,
      );
    }
  }

  return {
    createdProducts,
    createdVariants,
  };
};

/* =========================================================
   MAIN
========================================================= */

const seedProducts = async () => {
  try {
    console.log("\n🚀 Connecting to MongoDB...\n");

    await mongoose.connect(MONGODB_URI);

    console.log("✅ MongoDB connected\n");

    /* =====================================================
       YOUR EXISTING CATEGORIES

       T-Shirts → t-shirts → 12
       Pants    → pants    → 34
       Shoes    → shoes    → 23

       NO CATEGORY WILL BE CREATED / UPDATED / DELETED.
    ===================================================== */

    const tshirtCategory = await findCategory("t-shirts", "T-Shirt");

    const pantsCategory = await findCategory("pants", "Pants");

    const shoesCategory = await findCategory("shoes", "Shoes");

    console.log("📂 Existing categories found:");
    console.log(
      `   T-Shirts → ${tshirtCategory.name} | prefix: ${tshirtCategory.prefix}`,
    );
    console.log(
      `   Pants    → ${pantsCategory.name} | prefix: ${pantsCategory.prefix}`,
    );
    console.log(
      `   Shoes    → ${shoesCategory.name} | prefix: ${shoesCategory.prefix}`,
    );
    console.log("");

    /* =====================================================
       SEED T-SHIRTS
    ===================================================== */

    const tshirtResult = await seedCategoryProducts(
      tshirtCategory,
      tshirtProducts,
      tshirtImages,
      tshirtVariants,
      "tshirt",
    );

    /* =====================================================
       SEED JEANS INTO PANTS CATEGORY
    ===================================================== */

    const jeansResult = await seedCategoryProducts(
      pantsCategory,
      jeansProducts,
      jeansImages,
      jeansVariants,
      "jeans",
    );

    /* =====================================================
       SEED SHOES
    ===================================================== */

    const shoesResult = await seedCategoryProducts(
      shoesCategory,
      shoeProducts,
      shoeImages,
      shoeVariants,
      "shoes",
    );

    /* =====================================================
       TOTALS
    ===================================================== */

    const totalProducts =
      tshirtResult.createdProducts +
      jeansResult.createdProducts +
      shoesResult.createdProducts;

    const totalVariants =
      tshirtResult.createdVariants +
      jeansResult.createdVariants +
      shoesResult.createdVariants;

    console.log("\n====================================");
    console.log("🎉 PRODUCT SEED COMPLETED");
    console.log("====================================");
    console.log(`Products created : ${totalProducts}`);
    console.log(`Variants created : ${totalVariants}`);
    console.log("====================================\n");

    await mongoose.disconnect();

    process.exit(0);
  } catch (error) {
    console.error("\n❌ PRODUCT SEED FAILED\n");
    console.error(error);

    await mongoose.disconnect();

    process.exit(1);
  }
};

seedProducts();
