# E-Commerce Vendor — Backend

A production-ready REST API backend for a modern e-commerce and vendor management platform.

This backend provides authentication, product management, inventory management, orders, payments, reviews, wishlist, cart functionality, image uploads, admin analytics, activity logging, and other core e-commerce operations.

Built with **Node.js, Express, TypeScript, MongoDB, Mongoose, JWT, and Cloudinary**.

---

## 🚀 Features

### 🔐 Authentication & Authorization

* User registration and login
* JWT-based authentication
* Role-based authorization
* Customer and admin access control
* Google authentication support
* Protected API routes
* Authenticated user profile endpoint
* Password hashing and secure authentication flow

### 🛍️ Product Management

* Create products
* Update products
* Delete products
* Get product details
* Product listing
* Product variants
* SKU management
* Product pricing
* Product stock management
* Product images
* Product search and filtering
* Product activation/deactivation

### 📦 Inventory Management

* Variant-level inventory tracking
* Stock quantity management
* Low-stock detection
* Inventory overview
* Stock updates
* SKU-based inventory handling

### 🛒 Cart & Wishlist

* Add products to cart
* Update cart quantities
* Remove cart items
* Wishlist support
* Add/remove wishlist products
* Authenticated wishlist synchronization

### 📋 Order Management

* Customer order creation
* Order listing
* Order details
* Admin order management
* Order status management
* Order status summaries
* Order tracking
* Payment-related order information

### 💳 Payments

* Payment handling
* Payment status tracking
* Outstanding payment/due tracking
* Payment-related utilities

### ⭐ Reviews

* Product reviews
* Review management
* Admin review management
* Review-related product data

### 🖼️ Image Uploads

* Image upload API
* Cloudinary integration
* Product image storage
* Secure Cloudinary URLs
* Public ID tracking
* Image metadata support

### 📊 Admin Dashboard & Analytics

* Total sales revenue
* Total order count
* Outstanding payment total
* Low-stock variant count
* Low-stock threshold
* Recent activity logs
* Order status overview
* Store management statistics

### 📝 Activity Logging

The backend records important store activities such as:

* User registration
* Google registration
* Store operations
* Administrative actions
* Other important system events

---

## 🏗️ Project Structure

```text
backend/
├── src/
│   ├── config/
│   │   ├── cloudinary.ts
│   │   ├── db.ts
│   │   └── env.ts
│   │
│   ├── controllers/
│   │   ├── admin.controller.ts
│   │   ├── auth.controller.ts
│   │   ├── barcode.controller.ts
│   │   ├── category.controller.ts
│   │   ├── customer.controller.ts
│   │   ├── inventory.controller.ts
│   │   ├── order.controller.ts
│   │   ├── payment.controller.ts
│   │   ├── product.controller.ts
│   │   ├── review.controller.ts
│   │   ├── upload.controller.ts
│   │   └── wishlist.controller.ts
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   └── ...
│   │
│   ├── models/
│   │   ├── ActivityLog.ts
│   │   ├── Barcode.ts
│   │   ├── Cart.ts
│   │   ├── Category.ts
│   │   ├── Order.ts
│   │   ├── Payment.ts
│   │   ├── Product.ts
│   │   ├── ProductVariant.ts
│   │   ├── Review.ts
│   │   ├── User.ts
│   │   └── Wishlist.ts
│   │
│   ├── routes/
│   │   ├── admin.routes.ts
│   │   ├── auth.routes.ts
│   │   ├── barcode.routes.ts
│   │   ├── category.routes.ts
│   │   ├── health.routes.ts
│   │   ├── inventory.routes.ts
│   │   ├── order.routes.ts
│   │   ├── payment.routes.ts
│   │   ├── product.routes.ts
│   │   ├── review.routes.ts
│   │   ├── upload.routes.ts
│   │   └── wishlist.routes.ts
│   │
│   ├── scripts/
│   │   └── seed.ts
│   │
│   ├── utils/
│   │   ├── activityLogger.ts
│   │   ├── AppError.ts
│   │   ├── asyncHandler.ts
│   │   ├── barcode.ts
│   │   ├── courier.ts
│   │   ├── digitalPayment.ts
│   │   ├── errorHandler.ts
│   │   ├── jwt.ts
│   │   ├── payment.ts
│   │   ├── productHelpers.ts
│   │   └── upload.ts
│   │
│   ├── app.ts
│   └── server.ts
│
├── .env
├── .env.example
├── .gitignore
├── nodemon.json
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

> `node_modules` এবং generated build output source repository structure-এর অংশ নয় এবং Git-এ commit করা উচিত নয়।

---

## 🛠️ Tech Stack

| Technology | Purpose                       |
| ---------- | ----------------------------- |
| Node.js    | JavaScript runtime            |
| Express.js | REST API framework            |
| TypeScript | Type-safe backend development |
| MongoDB    | Database                      |
| Mongoose   | MongoDB ODM                   |
| JWT        | Authentication                |
| Cloudinary | Image storage                 |
| bcrypt     | Password hashing              |
| Nodemon    | Development server            |
| ESLint     | Code quality                  |

---

## 📦 Installation

Clone the repository:

```bash
git clone <your-repository-url>
cd backend
```

Install dependencies:

```bash
npm install
```

---

## ⚙️ Environment Variables

Create a `.env` file in the backend root:

```env
PORT=5000

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Use `.env.example` as a reference.

**Never commit your real `.env` file to GitHub.**

---

## ▶️ Development

Start the development server:

```bash
npm run dev
```

The API will normally be available at:

```text
http://localhost:5000
```

---

## 🏭 Production Build

Compile the TypeScript project:

```bash
npm run build
```

Start the compiled production server:

```bash
npm start
```

---

## 📜 Available Scripts

```text
npm run dev      Start development server
npm run build    Compile TypeScript
npm start        Start production server
```

---

## 🔌 API Architecture

The backend follows a modular REST API architecture:

```text
Request
   ↓
Route
   ↓
Middleware
   ↓
Controller
   ↓
Model / Database
   ↓
Response
```

This separation keeps authentication, business logic, database operations, and routing easier to maintain and extend.

---

## 🔐 Authentication Flow

Authentication uses JWT tokens.

Typical flow:

```text
Register / Login
      ↓
Backend validates credentials
      ↓
JWT token generated
      ↓
Frontend stores token
      ↓
Token sent with protected requests
      ↓
Auth middleware validates token
      ↓
Protected controller executes
```

Protected requests use:

```http
Authorization: Bearer <token>
```

---

## 👤 User Roles

The application supports role-based access control.

Example:

```text
CUSTOMER
ADMIN
```

Customers can access customer-facing functionality, while administrators have access to management features such as:

* Products
* Categories
* Orders
* Customers
* Inventory
* Reviews
* Analytics
* Store management

---

## 🗄️ Database

MongoDB is used as the primary database.

Mongoose models handle the application's core entities:

```text
User
Product
ProductVariant
Category
Cart
Wishlist
Order
Payment
Review
ActivityLog
Barcode
```

---

## ☁️ Cloudinary

Product and other image uploads are handled through Cloudinary.

Upload flow:

```text
Frontend
   ↓
Multipart/Form Data
   ↓
Upload Route
   ↓
Upload Controller
   ↓
Cloudinary
   ↓
Secure Image URL
   ↓
Database / Frontend
```

---

## 📊 Admin Features

The admin API provides store-level management and analytics.

Dashboard data includes:

```text
Total Revenue
Total Orders
Outstanding Due
Low Stock Variants
Recent Activity
Order Status Summary
```

This allows the frontend admin dashboard to display real-time store information.

---

## 🧪 Build Verification

Before deployment, verify that the backend compiles successfully:

```bash
npm run build
```

A successful build should finish without TypeScript errors.

Example:

```text
> e-commers-vendor-backend@1.0.0 build
> tsc
```

---

## 🚀 Deployment

For production deployment:

1. Install dependencies.
2. Configure production environment variables.
3. Build the TypeScript project.
4. Start the production server.
5. Configure MongoDB.
6. Configure Cloudinary.
7. Connect the frontend to the deployed API.

Production workflow:

```text
npm install
npm run build
npm start
```

---

## 🔗 Frontend

This backend is designed to work with the project's separate Next.js frontend.

The frontend communicates with this API through HTTP requests and uses JWT authentication for protected resources.

---

## 🔒 Security Notes

* Keep `.env` private.
* Never commit API secrets.
* Never expose `JWT_SECRET`.
* Never expose Cloudinary API secrets.
* Use HTTPS in production.
* Validate authenticated requests.
* Keep dependencies updated.
* Use appropriate CORS configuration for production.

---

## 📁 Repository Notes

Generated and dependency directories should remain excluded from Git:

```text
node_modules/
dist/
.env
```

The source repository should primarily contain application source code, configuration, and documentation.

---

## 📌 Project Status

**Backend:** Production build passing ✅

The backend TypeScript project currently compiles successfully with:

```bash
npm run build
```

---

## 👨‍💻 Development

Built as the backend API for a full-stack e-commerce/vendor management application.

The architecture is designed to remain modular so new features, routes, models, and integrations can be added without restructuring the entire application.

---

## 📄 License

This project is intended for the project owner's use and development.

Add your preferred license here if the repository will be distributed publicly.
