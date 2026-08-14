import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../config/db";

import { User } from "../models/User";
import { Category } from "../models/Category";
import { Product } from "../models/Product";
import { ProductVariant } from "../models/ProductVariant";
import { Review } from "../models/Review";
import { Wishlist } from "../models/Wishlist";
import { Order } from "../models/Order";
import { Cart } from "../models/Cart";
import { BarcodeCounter } from "../models/BarcodeCounter";
import { ActivityLog } from "../models/ActivityLog";
import { Payment } from "../models/Payment";

import { buildBarcode } from "../utils/barcodeGenerator";

dotenv.config();

const seed = async (): Promise<void> => {
  try {
    console.log("Connecting to MongoDB...");
    await connectDB();

    console.log("Cleaning existing database...");

    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      ProductVariant.deleteMany({}),
      Review.deleteMany({}),
      Wishlist.deleteMany({}),
      Order.deleteMany({}),
      Cart.deleteMany({}),
      BarcodeCounter.deleteMany({}),
      ActivityLog.deleteMany({}),
      Payment.deleteMany({}),
    ]);

    console.log("Existing data cleared.");

    /* =========================================================
       USERS
    ========================================================= */

    const [
      admin,
      customer,
      googleCustomer,
      walkInCustomer,
    ] = await User.create([
      {
        name: "Admin User",
        email: "admin@example.com",
        password: "admin123",
        role: "ADMIN",
        authProvider: "LOCAL",
      },
      {
        name: "Jane Customer",
        email: "customer@example.com",
        password: "customer123",
        role: "CUSTOMER",
        authProvider: "LOCAL",
      },
      {
        name: "Google Customer",
        email: "google.customer@example.com",
        googleId: "google-oauth-token-12345",
        authProvider: "GOOGLE",
        password: "unused-google-password-123456",
        role: "CUSTOMER",
      },
      {
        name: "Walk-in Customer",
        email: "walkin@example.com",
        password: "walkin123",
        role: "CUSTOMER",
        authProvider: "LOCAL",
      },
    ]);

    console.log("Users seeded.");

    /* =========================================================
       CATEGORIES
    ========================================================= */

    const [tShirts, pants] = await Category.create([
      {
        name: "T-Shirts",
        slug: "t-shirts",
        prefix: "12",
      },
      {
        name: "Pants",
        slug: "pants",
        prefix: "34",
      },
    ]);

    console.log("Categories seeded.");

    /* =========================================================
       PRODUCT IMAGES
    ========================================================= */

    const shirtImages = [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&q=80",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=1200&q=80",
      "https://images.unsplash.com/photo-1622445275463-ada2ab674c19?w=1200&q=80",
    ];

    const denimImages = [
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=1200&q=80",
      "https://images.unsplash.com/photo-1604176354204-d112352824ac?w=1200&q=80",
      "https://images.unsplash.com/photo-1475178626620-a4d074967452?w=1200&q=80",
    ];

    /* =========================================================
       PRODUCTS
    ========================================================= */

    const [classicTee, denimPants] = await Product.create([
      {
        name: "Classic Cotton Shirt",
        slug: "classic-cotton-shirt",
        description: "Comfortable everyday cotton shirt",

        fullDescription: `
          <h2>Premium Everyday Cotton Tee</h2>

          <p>
            Crafted from <strong>100% organic cotton</strong>,
            this classic shirt delivers breathable comfort for
            daily wear. The relaxed fit and reinforced stitching
            make it ideal for both casual outings and layered
            winter looks.
          </p>

          <ul>
            <li>Pre-shrunk fabric for lasting fit</li>
            <li>Tagless neckline for irritation-free wear</li>
            <li>Available in multiple colors and sizes</li>
          </ul>

          <p>
            Pair it with denim or chinos for a timeless
            smart-casual ensemble.
          </p>
        `,

        images: shirtImages,
        thumbnail: shirtImages[0],

        highlights: [
          "100% Organic Cotton",
          "Machine Washable",
          "Breathable Fabric",
          "Reinforced Stitching",
        ],

        category: tShirts._id,
      },

      {
        name: "Slim Fit Denim",
        slug: "slim-fit-denim",
        description: "Premium slim fit denim pants",

        fullDescription: `
          <h2>Slim Fit Premium Denim</h2>

          <p>
            These <strong>slim-fit denim pants</strong> combine
            modern tailoring with durable stretch fabric.
            Designed for all-day comfort, they hold shape
            wash after wash while offering a clean,
            tapered silhouette.
          </p>

          <ul>
            <li>Stretch-blend denim for flexibility</li>
            <li>Deep indigo wash with fade-resistant dye</li>
            <li>Classic five-pocket styling</li>
          </ul>

          <p>
            Perfect for office-casual or weekend wear with
            sneakers or boots.
          </p>
        `,

        images: denimImages,
        thumbnail: denimImages[0],

        highlights: [
          "Stretch Denim Blend",
          "Fade Resistant Dye",
          "Slim Tapered Fit",
          "Five-Pocket Design",
        ],

        category: pants._id,
      },
    ]);

    console.log("Products seeded.");

    /* =========================================================
       PRODUCT VARIANTS
    ========================================================= */

    const variantSeedData = [
      {
        product: classicTee._id,
        category: tShirts._id,
        size: "M",
        color: "Red",
        design: "Solid",
        stock: 3,
        price: 1200,
        sizeCode: "0038",
        prefix: "12",
        serial: 1,
      },

      {
        product: classicTee._id,
        category: tShirts._id,
        size: "L",
        color: "Blue",
        design: "Solid",
        stock: 25,
        price: 1300,
        sizeCode: "0040",
        prefix: "12",
        serial: 1,
      },

      {
        product: denimPants._id,
        category: pants._id,
        size: "32",
        color: "Black",
        design: "Plain",
        stock: 8,
        price: 2500,
        sizeCode: "0032",
        prefix: "34",
        serial: 1,
      },
    ];

    const variants = await ProductVariant.insertMany(
      variantSeedData.map((item) => ({
        product: item.product,
        category: item.category,
        size: item.size,
        color: item.color,
        design: item.design,
        stock: item.stock,
        price: item.price,

        sizeCode: item.sizeCode,

        barcode: buildBarcode(
          item.prefix,
          item.sizeCode,
          item.serial,
        ),
      })),
    );

    console.log("Product variants seeded.");

    /* =========================================================
       BARCODE COUNTERS
    ========================================================= */

    await BarcodeCounter.insertMany([
      {
        categoryPrefix: "12",
        sizeCode: "0038",
        lastSerial: 1,
      },
      {
        categoryPrefix: "12",
        sizeCode: "0040",
        lastSerial: 1,
      },
      {
        categoryPrefix: "34",
        sizeCode: "0032",
        lastSerial: 1,
      },
    ]);

    console.log("Barcode counters seeded.");

    /* =========================================================
       REVIEWS
    ========================================================= */

    await Review.create([
      {
        user: customer._id,
        product: classicTee._id,
        rating: 5,
        comment: "Excellent quality and fit!",
      },

      {
        user: googleCustomer._id,
        product: denimPants._id,
        rating: 4,
        comment: "Very comfortable denim pants.",
      },
    ]);

    await Product.findByIdAndUpdate(classicTee._id, {
      averageRating: 5,
      reviewCount: 1,
    });

    await Product.findByIdAndUpdate(denimPants._id, {
      averageRating: 4,
      reviewCount: 1,
    });

    console.log("Reviews seeded.");

    /* =========================================================
       WISHLIST
    ========================================================= */

    await Wishlist.create({
      user: customer._id,
      products: [
        classicTee._id,
        denimPants._id,
      ],
    });

    console.log("Wishlist seeded.");

    /* =========================================================
       ORDERS
    ========================================================= */

    /*
     * IMPORTANT:
     * Order.customer.user is required by the Order schema.
     * Therefore every order below contains a valid User _id.
     */

    const paidOrderTotal = variants[1].price;

    const dueOrderTotal = variants[2].price * 2;

    const dueOrderPaid = 1000;

    const dueOrderAmount =
      dueOrderTotal - dueOrderPaid;

    const [paidOrder, dueOrder] = await Order.create([
      {
        customer: {
          user: customer._id,
          name: customer.name,
          phone: "01700000001",
          address: "Dhaka, Bangladesh",
        },

        items: [
          {
            variant: variants[1]._id,
            product: classicTee._id,
            productName: classicTee.name,
            barcode: variants[1].barcode,
            size: variants[1].size,
            color: variants[1].color,
            design: variants[1].design,
            quantity: 1,
            unitPrice: variants[1].price,
            subtotal: variants[1].price,
          },
        ],

        totalAmount: paidOrderTotal,
        paidAmount: paidOrderTotal,
        dueAmount: 0,

        paymentStatus: "PAID",
        orderStatus: "DELIVERED",
        paymentMethod: "ONLINE",
      },

      {
        customer: {
          user: walkInCustomer._id,
          name: walkInCustomer.name,
          phone: "01700000002",
          address: "Chittagong, Bangladesh",
        },

        items: [
          {
            variant: variants[2]._id,
            product: denimPants._id,
            productName: denimPants.name,
            barcode: variants[2].barcode,
            size: variants[2].size,
            color: variants[2].color,
            design: variants[2].design,
            quantity: 2,
            unitPrice: variants[2].price,
            subtotal: variants[2].price * 2,
          },
        ],

        totalAmount: dueOrderTotal,
        paidAmount: dueOrderPaid,
        dueAmount: dueOrderAmount,

        paymentStatus: "PARTIAL",
        orderStatus: "PROCESSING",
        paymentMethod: "COD",
      },
    ]);

    console.log("Orders seeded.");

    /* =========================================================
       PAYMENTS
    ========================================================= */

    /*
     * Payment model may have required fields depending on
     * your current schema. The seed intentionally creates
     * payment records only if your Payment schema accepts
     * these fields.
     *
     * If Payment has additional required fields, they should
     * be added here according to that schema.
     */

    try {
      await Payment.create([
        {
          order: paidOrder._id,
          amount: paidOrder.paidAmount,
          method: paidOrder.paymentMethod,
          status: "COMPLETED",
        },

        {
          order: dueOrder._id,
          amount: dueOrder.paidAmount,
          method: dueOrder.paymentMethod,
          status: "COMPLETED",
        },
      ]);

      console.log("Payments seeded.");
    } catch (paymentError) {
      console.warn(
        "Payment seed skipped because the Payment schema requires different fields.",
      );

      console.warn(paymentError);
    }

    /* =========================================================
       CART
    ========================================================= */

    await Cart.create({
      user: customer._id,
      items: [
        {
          product: classicTee._id,
          variant: variants[0]._id,
          quantity: 1,
        },
      ],
    });

    console.log("Cart seeded.");

    /* =========================================================
       ACTIVITY LOGS
    ========================================================= */

    await ActivityLog.insertMany([
      {
        type: "USER",
        message: `New user registered: ${customer.email}`,
        metadata: {
          userId: customer._id,
        },
      },

      {
        type: "USER",
        message: `Google customer registered: ${googleCustomer.email}`,
        metadata: {
          userId: googleCustomer._id,
        },
      },

      {
        type: "PRODUCT",
        message: `Product created: ${classicTee.name}`,
        metadata: {
          productId: classicTee._id,
        },
      },

      {
        type: "PRODUCT",
        message: `Product created: ${denimPants.name}`,
        metadata: {
          productId: denimPants._id,
        },
      },

      {
        type: "ORDER",
        message: `Order placed: ${paidOrder._id}`,
        metadata: {
          orderId: paidOrder._id,
          totalAmount: paidOrder.totalAmount,
        },
      },

      {
        type: "PAYMENT",
        message: `Payment received for order ${paidOrder._id}`,
        metadata: {
          orderId: paidOrder._id,
          paidAmount: paidOrder.paidAmount,
          dueAmount: paidOrder.dueAmount,
        },
      },

      {
        type: "PAYMENT",
        message: `Partial payment received for order ${dueOrder._id}`,
        metadata: {
          orderId: dueOrder._id,
          paidAmount: dueOrder.paidAmount,
          dueAmount: dueOrder.dueAmount,
        },
      },

      {
        type: "REVIEW",
        message: `Review added for product: ${classicTee.name}`,
        metadata: {
          productId: classicTee._id,
          userId: customer._id,
          rating: 5,
        },
      },

      {
        type: "REVIEW",
        message: `Review added for product: ${denimPants.name}`,
        metadata: {
          productId: denimPants._id,
          userId: googleCustomer._id,
          rating: 4,
        },
      },

      {
        type: "WISHLIST",
        message: `Products added to wishlist for ${customer.name}`,
        metadata: {
          userId: customer._id,
          productIds: [
            classicTee._id,
            denimPants._id,
          ],
        },
      },
    ]);

    console.log("Activity logs seeded.");

    /* =========================================================
       FINAL OUTPUT
    ========================================================= */

    console.log("");
    console.log("==============================================");
    console.log("       DATABASE SEEDED SUCCESSFULLY 🚀");
    console.log("==============================================");
    console.log("");

    console.log("ADMIN");
    console.log("----------------------------------------------");
    console.log("Email    : admin@example.com");
    console.log("Password : admin123");
    console.log(`ID       : ${admin._id}`);
    console.log("");

    console.log("CUSTOMER");
    console.log("----------------------------------------------");
    console.log("Email    : customer@example.com");
    console.log("Password : customer123");
    console.log(`ID       : ${customer._id}`);
    console.log("");

    console.log("GOOGLE CUSTOMER");
    console.log("----------------------------------------------");
    console.log("Email    : google.customer@example.com");
    console.log(`ID       : ${googleCustomer._id}`);
    console.log("");

    console.log("WALK-IN CUSTOMER");
    console.log("----------------------------------------------");
    console.log("Email    : walkin@example.com");
    console.log("Password : walkin123");
    console.log(`ID       : ${walkInCustomer._id}`);
    console.log("");

    console.log("PRODUCTS");
    console.log("----------------------------------------------");
    console.log(`Classic Tee : ${classicTee._id}`);
    console.log(`Denim Pants : ${denimPants._id}`);
    console.log("");

    console.log("ORDERS");
    console.log("----------------------------------------------");
    console.log(`Paid Order : ${paidOrder._id}`);
    console.log(`Due Order  : ${dueOrder._id}`);
    console.log("");

    console.log("BARCODES");
    console.log("----------------------------------------------");
    console.log(
      variants
        .map((variant) => variant.barcode)
        .join(", "),
    );

    console.log("");
    console.log("==============================================");
    console.log("Seed complete. Ready for development. 😎");
    console.log("==============================================");
    console.log("");

    await disconnectDB();
  } catch (error) {
    console.error("");
    console.error("==============================================");
    console.error("             SEED FAILED ❌");
    console.error("==============================================");
    console.error(error);
    console.error("");

    await mongoose.disconnect();

    process.exit(1);
  }
};

void seed();