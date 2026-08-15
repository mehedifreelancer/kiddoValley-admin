// pages/.../deliverySettings.service.ts
import api from "../../../apiConfig";
import { DeliverySettings } from "./deliverySettings.types";

export const getDeliverySettings = async (): Promise<DeliverySettings> => {
  const response = await api.get<{ success: boolean; data: DeliverySettings }>(
    "/delivery/get-delivery-charge-info",
  );
  return response.data.data;
};

// ⚠️ ASSUMPTION: আপনার GET endpoint "/delivery/get-delivery-charge-info" —
// কিন্তু update/save endpoint টা আপনি দেননি। নিচে naming pattern অনুযায়ী
// "/delivery/update-delivery-charge-info" বসালাম। যদি আপনার backend এ অন্য
// route (যেমন PUT "/delivery" বা POST "/delivery/save") থাকে, শুধু এই একটা
// লাইনের URL string পাল্টে দিলেই হবে — বাকি সব ঠিক থাকবে।
export const updateDeliverySettings = async (
  payload: DeliverySettings,
): Promise<DeliverySettings> => {
  const response = await api.put<{ success: boolean; data: DeliverySettings }>(
    "/delivery/update-delivery-charge-info",
    payload,
  );
  return response.data.data;
};
