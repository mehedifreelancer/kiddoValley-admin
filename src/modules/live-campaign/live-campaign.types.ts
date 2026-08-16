export interface Campaign {
  id: number;
  title: string;
  perDayBudget: number;
  estimatedEndDate: string; // ISO date string
  status: "active" | "stopped";
  stoppedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignPayload {
  title: string;
  perDayBudget: number;
  estimatedEndDate: string; // ISO date string, e.g. "2026-08-30"
}

export interface UpdateCampaignPayload {
  title: string;
  perDayBudget: number;
  estimatedEndDate: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CampaignHistory {
  id: number;
  title: string;
  status: "active" | "stopped";
  perDayBudget: number;
  estimatedEndDate: string;
  maxPick: number;
  totalProfit: number;
  todayProfit: number;
  // profit: null mane oi shomoy/date-e campaign chalu chilo na (age hoyni, ba future)
  dailySeries: { date: string; profit: number | null }[];
  hourlySeries: { hour: number; profit: number | null }[];
}
