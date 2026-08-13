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
  await connectDB();

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

  const [admin, customer, googleCustomer] = await User.create([
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
  ]);

  const [tShirts, pants] = await Category.create([
    { name: "T-Shirts", slug: "t-shirts", prefix: "12" },
    { name: "Pants", slug: "pants", prefix: "34" },
  ]);

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

  const [classicTee, denimPants] = await Product.create([
    {
      name: "Classic Cotton Shirt",
      slug: "classic-cotton-shirt",
      description: "Comfortable everyday cotton shirt",
      fullDescription: `<h2>Premium Everyday Cotton Tee</h2>
<p>Crafted from <strong>100% organic cotton</strong>, this classic shirt delivers breathable comfort for daily wear. The relaxed fit and reinforced stitching make it ideal for both casual outings and layered winter looks.</p>
<ul>
  <li>Pre-shrunk fabric for lasting fit</li>
  <li>Tagless neckline for irritation-free wear</li>
  <li>Available in multiple colors and sizes</li>
</ul>
<p>Pair it with denim or chinos for a timeless smart-casual ensemble.</p>`,
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
      fullDescription: `<h2>Slim Fit Premium Denim</h2>
<p>These <strong>slim-fit denim pants</strong> combine modern tailoring with durable stretch fabric. Designed for all-day comfort, they hold shape wash after wash while offering a clean, tapered silhouette.</p>
<ul>
  <li>Stretch-blend denim for flexibility</li>
  <li>Deep indigo wash with fade-resistant dye</li>
  <li>Classic five-pocket styling</li>
</ul>
<p>Perfect for office-casual or weekend wear with sneakers or boots.</p>`,
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
      barcode: buildBarcode(item.prefix, item.sizeCode, item.serial),
    }))
  );

  await BarcodeCounter.insertMany([
    { categoryPrefix: "12", sizeCode: "0038", lastSerial: 1 },
    { categoryPrefix: "12", sizeCode: "0040", lastSerial: 1 },
    { categoryPrefix: "34", sizeCode: "0032", lastSerial: 1 },
  ]);

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

  await Wishlist.create({
    user: customer._id,
    products: [classicTee._id, denimPants._id],
  });

  const [paidOrder, dueOrder] = await Order.create([
    {
      customer: {
        name: "Jane Customer",
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
      totalAmount: variants[1].price,
      paidAmount: variants[1].price,
      dueAmount: 0,
      paymentStatus: "PAID",
      orderStatus: "DELIVERED",
      paymentMethod: "ONLINE",
    },
    {
      customer: {
        name: "Walk-in Customer",
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
      totalAmount: variants[2].price * 2,
      paidAmount: 1000,
      dueAmount: variants[2].price * 2 - 1000,
      paymentStatus: "PARTIAL",
      orderStatus: "PROCESSING",
      paymentMethod: "COD",
    },
  ]);

  await ActivityLog.insertMany([
    {
      type: "USER",
      message: `New user registered: ${customer.email}`,
      metadata: { userId: customer._id },
    },
    {
      type: "PRODUCT",
      message: `Product created: ${classicTee.name}`,
      metadata: { productId: classicTee._id },
    },
    {
      type: "ORDER",
      message: `Order placed: ${paidOrder._id}`,
      metadata: { orderId: paidOrder._id, totalAmount: paidOrder.totalAmount },
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
      metadata: { productId: classicTee._id, rating: 5 },
    },
    {
      type: "WISHLIST",
      message: `Product added to wishlist: ${denimPants.name}`,
      metadata: { userId: customer._id, productId: denimPants._id },
    },
  ]);

  console.log("Database seeded successfully");
  console.log(`Admin ID: ${admin._id}`);
  console.log("Admin login: admin@example.com / admin123");
  console.log("Customer login: customer@example.com / customer123");
  console.log(`Paid order ID: ${paidOrder._id}`);
  console.log(`Sample barcodes: ${variants.map((v) => v.barcode).join(", ")}`);
  console.log(`Due order ID: ${dueOrder._id}`);

  await disconnectDB();
};

seed().catch(async (error) => {
  console.error("Seed failed:", error);
  await mongoose.disconnect();
  process.exit(1);
});
