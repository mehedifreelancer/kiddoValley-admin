// packagingSettings.service.ts

import api from "../../../apiConfig";
import { PackagingSettings } from "./packagingSettings.types";

/**
 * GET – প্যাকেজিং সেটিংস পড়ুন
 */
export const getPackagingSettings = async (): Promise<PackagingSettings> => {
  const response = await api.get<{ success: boolean; data: PackagingSettings }>(
    "/web-settings/packaging-cost", // ✅ '/admin' বাদ
  );
  return response.data.data;
};

/**
 * POST – প্যাকেজিং সেটিংস আপডেট করুন
 */
export const updatePackagingSettings = async (
  payload: PackagingSettings,
): Promise<PackagingSettings> => {
  const response = await api.post<{
    success: boolean;
    data: PackagingSettings;
  }>(
    "/web-settings/packaging-cost", // ✅ '/admin' বাদ
    payload,
  );
  return response.data.data;
};
