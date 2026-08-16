"use client";

import { ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import LiveCampaignChart from "../../components/shared/charts/LiveCampaignChart";
import Button from "../../components/ui/Button";
import Toolbar from "../../components/ui/Toolbar";
import { getCampaignHistory, getCampaigns } from "./live-campaign.service";
import { CampaignHistory } from "./live-campaign.types";

const POLL_INTERVAL_MS = 5000;

export const AllLiveCampaigns = () => {
  const [campaigns, setCampaigns] = useState<CampaignHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAll = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      // shudhu active campaign gula-i dorkar — sob page-er list na, ekbare beshi rows niye anlam
      const list = await getCampaigns(1, 100, "");
      const activeCampaigns = list.data.filter(
        (c: any) => c.status === "active",
      );

      const histories = await Promise.all(
        activeCampaigns.map((c: any) => getCampaignHistory(c.id)),
      );

      setCampaigns(histories);
    } catch (error) {
      if (!silent) toast.error("Failed to load all campaigns");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    intervalRef.current = setInterval(() => fetchAll(true), POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div>
      <Toolbar title="All Campaigns Live View">
        <Button
          variant="outline"
          size="sm"
          onClick={() => (window.location.href = "/account/live-campaign")}
          className="flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Back to List
        </Button>
      </Toolbar>

      {campaigns.length === 0 ? (
        <div className="flex justify-center items-center h-64 text-gray-400 text-sm">
          No active campaigns
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          {campaigns.map((camp) => (
            <LiveCampaignChart key={camp.id} data={camp} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AllLiveCampaigns;
