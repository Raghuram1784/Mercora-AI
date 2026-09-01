-- AlterEnum
ALTER TYPE "CartStatus" ADD VALUE 'CHECKOUT_PENDING';

-- CreateEnum
CREATE TYPE "ProductRelationType" AS ENUM ('UPSELL', 'CROSS_SELL', 'ACCESSORY');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'PAYMENT_FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CartItemSource" AS ENUM ('DIRECT', 'AI_RECOMMENDATION', 'AI_UPSELL', 'AI_CROSS_SELL', 'AI_ACCESSORY');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'PENDING', 'VERIFIED', 'FAILED');

-- CreateEnum
CREATE TYPE "CommerceEventType" AS ENUM ('AI_RECOMMENDATION_REQUESTED', 'AI_RECOMMENDATION_RETURNED', 'PRODUCT_RECOMMENDED', 'PRODUCT_RECOMMENDATION_CLICKED', 'PRODUCT_RECOMMENDED_CART_ADDED', 'UPSELL_OFFERED', 'UPSELL_ACCEPTED', 'UPSELL_REJECTED', 'CROSS_SELL_OFFERED', 'CROSS_SELL_ACCEPTED', 'CROSS_SELL_REJECTED', 'ACCESSORY_OFFERED', 'ACCESSORY_ACCEPTED', 'ACCESSORY_REJECTED', 'PAYMENT_SESSION_CREATED', 'PAYMENT_VERIFICATION_ATTEMPTED', 'PAYMENT_VERIFIED', 'PAYMENT_FAILED');

-- CreateEnum
CREATE TYPE "CommerceEventSource" AS ENUM ('SYSTEM', 'AGENT', 'CLIENT', 'MERCHANT');

-- AlterTable: Add AI attribution columns to existing CartItem table
ALTER TABLE "CartItem" ADD COLUMN "source" "CartItemSource" NOT NULL DEFAULT 'DIRECT',
ADD COLUMN "sourceEventId" TEXT;

-- CreateTable: ProductRelation
CREATE TABLE "ProductRelation" (
    "id" TEXT NOT NULL,
    "sourceProductId" TEXT NOT NULL,
    "targetProductId" TEXT NOT NULL,
    "type" "ProductRelationType" NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "reason" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Order
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "customerId" TEXT NOT NULL,
    "cartId" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "subtotal" DECIMAL(12,2) NOT NULL,
    "shippingCharge" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable: OrderItem
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "sku" TEXT,
    "variantId" TEXT,
    "variantName" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "totalPrice" DECIMAL(12,2) NOT NULL,
    "source" "CartItemSource" NOT NULL DEFAULT 'DIRECT',
    "sourceEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Payment
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'RAZORPAY',
    "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CommerceEvent
CREATE TABLE "CommerceEvent" (
    "id" TEXT NOT NULL,
    "eventKey" TEXT,
    "type" "CommerceEventType" NOT NULL,
    "source" "CommerceEventSource" NOT NULL,
    "merchantId" TEXT,
    "customerId" TEXT,
    "cartId" TEXT,
    "orderId" TEXT,
    "paymentId" TEXT,
    "productId" TEXT,
    "sourceProductId" TEXT,
    "targetProductId" TEXT,
    "suggestionType" "ProductRelationType",
    "potentialUplift" DECIMAL(12,2),
    "acceptedUplift" DECIMAL(12,2),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommerceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductRelation_sourceProductId_type_active_idx" ON "ProductRelation"("sourceProductId", "type", "active");

-- CreateIndex
CREATE UNIQUE INDEX "ProductRelation_sourceProductId_targetProductId_type_key" ON "ProductRelation"("sourceProductId", "targetProductId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Order_cartId_idx" ON "Order"("cartId");

-- CreateIndex
CREATE INDEX "Order_customerId_status_createdAt_idx" ON "Order"("customerId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_razorpayOrderId_key" ON "Payment"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_razorpayPaymentId_key" ON "Payment"("razorpayPaymentId");

-- CreateIndex
CREATE INDEX "Payment_orderId_status_idx" ON "Payment"("orderId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CommerceEvent_eventKey_key" ON "CommerceEvent"("eventKey");

-- CreateIndex
CREATE INDEX "CommerceEvent_type_createdAt_idx" ON "CommerceEvent"("type", "createdAt");

-- CreateIndex
CREATE INDEX "CommerceEvent_merchantId_createdAt_idx" ON "CommerceEvent"("merchantId", "createdAt");

-- CreateIndex
CREATE INDEX "CommerceEvent_orderId_idx" ON "CommerceEvent"("orderId");

-- CreateIndex
CREATE INDEX "CommerceEvent_cartId_idx" ON "CommerceEvent"("cartId");

-- CreateIndex
CREATE INDEX "CommerceEvent_customerId_idx" ON "CommerceEvent"("customerId");

-- AddForeignKey
ALTER TABLE "ProductRelation" ADD CONSTRAINT "ProductRelation_sourceProductId_fkey" FOREIGN KEY ("sourceProductId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductRelation" ADD CONSTRAINT "ProductRelation_targetProductId_fkey" FOREIGN KEY ("targetProductId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
