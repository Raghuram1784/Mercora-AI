-- Create new canonical enum types
CREATE TYPE "CommerceEventType_new" AS ENUM (
  'AI_RECOMMENDATION_REQUESTED',
  'AI_RECOMMENDATION_RETURNED',
  'UPSELL_SHOWN',
  'CROSS_SELL_SHOWN',
  'ACCESSORY_SHOWN',
  'AI_ITEM_ADDED_TO_CART',
  'UPSELL_ACCEPTED',
  'CROSS_SELL_ACCEPTED',
  'ACCESSORY_ACCEPTED',
  'ORDER_CREATED',
  'PAYMENT_STARTED',
  'PAYMENT_VERIFIED',
  'PAYMENT_FAILED',
  'CART_CONVERTED'
);

CREATE TYPE "CommerceEventSource_new" AS ENUM (
  'CUSTOMER',
  'AI',
  'SYSTEM',
  'PAYMENT'
);

-- Alter CommerceEvent table columns to use the new enum types
ALTER TABLE "CommerceEvent" ALTER COLUMN "type" TYPE "CommerceEventType_new" USING "type"::text::"CommerceEventType_new";
ALTER TABLE "CommerceEvent" ALTER COLUMN "source" TYPE "CommerceEventSource_new" USING "source"::text::"CommerceEventSource_new";

-- Drop old draft enum types
DROP TYPE "CommerceEventType";
DROP TYPE "CommerceEventSource";

-- Rename new enum types to canonical names
ALTER TYPE "CommerceEventType_new" RENAME TO "CommerceEventType";
ALTER TYPE "CommerceEventSource_new" RENAME TO "CommerceEventSource";
