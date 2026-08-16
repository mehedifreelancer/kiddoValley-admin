import api from "../../apiConfig";
import {
  Campaign,
  CampaignHistory,
  CreateCampaignPayload,
  PaginatedResponse,
  UpdateCampaignPayload,
} from "./live-campaign.types";

export const getCampaigns = async (
  page = 1,
  limit = 10,
  search = "",
): Promise<PaginatedResponse<Campaign>> => {
  const res = await api.get("/live-campaign", {
    params: { page, limit, search },
  });
  return res.data;
};

export const createCampaign = async (
  payload: CreateCampaignPayload,
): Promise<Campaign> => {
  const res = await api.post("/live-campaign", payload);
  return res.data.data;
};

export const updateCampaign = async (
  id: number,
  payload: UpdateCampaignPayload,
): Promise<Campaign> => {
  const res = await api.put(`/live-campaign/${id}`, payload);
  return res.data.data;
};

export const deleteCampaign = async (id: number): Promise<void> => {
  await api.delete(`/live-campaign/${id}`);
};

export const toggleStatus = async (
  id: number,
  status: "active" | "stopped",
): Promise<Campaign> => {
  const res = await api.patch(`/live-campaign/${id}/status`, { status });
  return res.data.data;
};

export const getCampaignHistory = async (
  id: number,
): Promise<CampaignHistory> => {
  const res = await api.get(`/live-campaign/${id}/history`);
  return res.data.data;
};
