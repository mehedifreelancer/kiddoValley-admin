// modules/web-settings/layout-settings/gridMangement.service.ts

import api from "../../../apiConfig";
import { GridSettings } from "./gridMangement.types";

export const getGridSettings = async (): Promise<GridSettings> => {
  const res = await api.get("/web-settings/layout-settings");
  return res.data.data;
};

export const updateGridSettings = async (data: {
  gridClasses: string;
}): Promise<GridSettings> => {
  const res = await api.put("/web-settings/layout-settings", data);
  return res.data.data;
};
