import { Types } from "mongoose";
import { AppError } from "./AppError";

export type CourierShipmentStatus = "READY_FOR_PICKUP";

export interface CourierShipment {
  orderId: string;
  provider: "STEADFAST" | "PATHAO";
  consignmentId: string;
  status: CourierShipmentStatus;
  createdAt: string;
}

const randomConsignmentNumber = (): string =>
  String(Math.floor(10000 + Math.random() * 90000));

/**
 * Mock courier adapter for Steadfast / Pathao integrations.
 * Returns a simulated consignment ID and pickup-ready status.
 */
export const createCourierShipment = async (
  orderId: string | Types.ObjectId,
  provider: "STEADFAST" | "PATHAO" = "STEADFAST"
): Promise<CourierShipment> => {
  if (!orderId) {
    throw new AppError("Order ID is required to create a courier shipment", 400);
  }

  const normalizedOrderId = orderId.toString();
  const consignmentId = `${provider}-${randomConsignmentNumber()}`;

  return {
    orderId: normalizedOrderId,
    provider,
    consignmentId,
    status: "READY_FOR_PICKUP",
    createdAt: new Date().toISOString(),
  };
};
