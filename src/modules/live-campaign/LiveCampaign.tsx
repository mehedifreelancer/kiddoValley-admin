// modules/account/live-campaign/LiveCampaign.tsx

import { Edit, Eye, Play, Plus, RefreshCw, Square, Trash2 } from "lucide-react";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";

import LiveCampaignChart from "../../components/shared/charts/LiveCampaignChart";
import Button from "../../components/ui/Button";
import DataTableSearch from "../../components/ui/DataTableSearch";
import InputField from "../../components/ui/InputField";
import Modal from "../../components/ui/Modal";
import Toolbar from "../../components/ui/Toolbar";
import {
  createCampaign,
  deleteCampaign,
  getCampaignHistory,
  getCampaigns,
  toggleStatus,
  updateCampaign,
} from "./live-campaign.service";
import { CampaignHistory } from "./live-campaign.types";

const POLL_INTERVAL_MS = 2000;

// InputField-e type="date" er jonno YYYY-MM-DD format lagbe
const toDateInputValue = (d: string | Date) => {
  const date = new Date(d);
  return date.toISOString().slice(0, 10);
};

// Default: aajke theke 30 din pore
const defaultEndDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return toDateInputValue(d);
};

export const LiveCampaign = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const view = searchParams.get("view") || "list"; // list, all

  const [campaigns, setCampaigns] = useState<CampaignHistory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedCampaign, setSelectedCampaign] =
    useState<CampaignHistory | null>(null);

  const [modalFor, setModalFor] = useState<
    "create" | "edit" | "delete" | "stop" | null
  >(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [formTitle, setFormTitle] = useState("");
  const [formBudget, setFormBudget] = useState<number>(0);
  const [formEstimatedEndDate, setFormEstimatedEndDate] =
    useState<string>(defaultEndDate());

  // Live view state
  const [liveCampaignId, setLiveCampaignId] = useState<number | null>(null);
  const [liveData, setLiveData] = useState<CampaignHistory | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await getCampaigns(page, rows, searchTerm);
      setCampaigns(res.data);
      setTotalRecords(res.pagination.total);
    } catch (error) {
      toast.error("Failed to fetch campaigns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [page, rows, searchTerm]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const onPageChange = (event: any) => {
    setFirst(event.first);
    setRows(event.rows);
    setPage(event.first / event.rows + 1);
  };

  const resetForm = () => {
    setFormTitle("");
    setFormBudget(0);
    setFormEstimatedEndDate(defaultEndDate());
    setFormError("");
  };

  const openCreateModal = () => {
    resetForm();
    setModalFor("create");
  };

  const openEditModal = (campaign: CampaignHistory) => {
    resetForm();
    setSelectedCampaign(campaign);
    setFormTitle(campaign.title);
    setFormBudget(campaign.perDayBudget);
    setFormEstimatedEndDate(toDateInputValue(campaign.estimatedEndDate));
    setModalFor("edit");
  };

  const openStopModal = (campaign: CampaignHistory) => {
    setSelectedCampaign(campaign);
    setModalFor("stop");
  };

  const openDeleteModal = (campaign: CampaignHistory) => {
    setSelectedCampaign(campaign);
    setModalFor("delete");
  };

  const closeModal = () => {
    setModalFor(null);
    setSelectedCampaign(null);
    resetForm();
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || formBudget <= 0 || !formEstimatedEndDate) {
      setFormError("Title, positive budget, and estimated end date required");
      return;
    }
    setSubmitting(true);
    try {
      await createCampaign({
        title: formTitle.trim(),
        perDayBudget: formBudget,
        estimatedEndDate: formEstimatedEndDate,
      });
      toast.success("Campaign created");
      closeModal();
      fetchCampaigns();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formTitle.trim() ||
      formBudget <= 0 ||
      !formEstimatedEndDate ||
      !selectedCampaign
    ) {
      setFormError("Title, positive budget, and estimated end date required");
      return;
    }
    setSubmitting(true);
    try {
      await updateCampaign(selectedCampaign.id, {
        title: formTitle.trim(),
        perDayBudget: formBudget,
        estimatedEndDate: formEstimatedEndDate,
      });
      toast.success("Campaign updated");
      closeModal();
      fetchCampaigns();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStop = async () => {
    if (!selectedCampaign) return;
    setSubmitting(true);
    try {
      const newStatus =
        selectedCampaign.status === "active" ? "stopped" : "active";
      await toggleStatus(selectedCampaign.id, newStatus);
      toast.success(
        `Campaign ${newStatus === "active" ? "resumed" : "stopped"}`,
      );
      closeModal();
      fetchCampaigns();
      // If we are viewing this campaign's live view, stop polling
      if (liveCampaignId === selectedCampaign.id && newStatus === "stopped") {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setLiveCampaignId(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCampaign) return;
    setSubmitting(true);
    try {
      await deleteCampaign(selectedCampaign.id);
      toast.success("Campaign deleted");
      closeModal();
      fetchCampaigns();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Live view (single endpoint, polled) ----------
  const fetchLiveData = async (id: number, silent = false) => {
    try {
      const data = await getCampaignHistory(id);
      setLiveData(data);
      // stopped campaign hole polling er dorkar nei
      if (data.status === "stopped" && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } catch (error: any) {
      if (!silent) toast.error("Failed to fetch campaign data");
    }
  };

  const viewLive = async (id: number) => {
    setLiveCampaignId(id);
    await fetchLiveData(id);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      fetchLiveData(id, true);
    }, POLL_INTERVAL_MS);
  };

  const stopLiveView = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setLiveCampaignId(null);
    setLiveData(null);
  };

  // If view=all, render the all campaigns page
  if (view === "all") {
    return <AllLiveCampaigns />;
  }

  // If we have a live campaign ID, render live view
  if (liveCampaignId) {
    return (
      <div>
        <Toolbar title={`Live: ${liveData?.title || "Campaign"}`}>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={stopLiveView}>
              <Eye className="w-4 h-4 mr-1" /> Back to List
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLiveData(liveCampaignId)}
            >
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
          </div>
        </Toolbar>
        {liveData ? (
          <LiveCampaignChart data={liveData} />
        ) : (
          <div className="flex justify-center items-center h-64">
            Loading live data...
          </div>
        )}
      </div>
    );
  }

  // List view
  const statusBody = (row: CampaignHistory) => (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        row.status === "active"
          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
          : "bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-300"
      }`}
    >
      {row.status === "active" ? "Active" : "Stopped"}
    </span>
  );

  const estimatedEndDateBody = (row: CampaignHistory) => (
    <span className="text-sm text-gray-600 dark:text-gray-300">
      {row.estimatedEndDate
        ? new Date(row.estimatedEndDate).toLocaleDateString()
        : "-"}
    </span>
  );

  const actionsBody = (row: CampaignHistory) => (
    <div className="flex gap-1">
      <button
        onClick={() => viewLive(row.id)}
        className="p-1 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded transition-colors"
        title="View Live"
      >
        <Eye className="w-4 h-4" />
      </button>
      <button
        onClick={() => openEditModal(row)}
        className="p-1 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20 rounded transition-colors"
        title="Edit"
      >
        <Edit className="w-4 h-4" />
      </button>
      <button
        onClick={() => openStopModal(row)}
        className="p-1 text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700/30 rounded transition-colors"
        title={row.status === "active" ? "Stop" : "Resume"}
      >
        {row.status === "active" ? (
          <Square className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4" />
        )}
      </button>
      <button
        onClick={() => openDeleteModal(row)}
        className="p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded transition-colors"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  if (loading && campaigns.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div>
      <Toolbar title="Live Campaigns">
        <div className="flex gap-2 items-center ">
          <DataTableSearch
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search campaigns..."
            className="w-[220px]"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCampaigns}
            className="flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>

          <Button
            onClick={openCreateModal}
            className="btn-primary flex items-center gap-2 text-xs"
          >
            <Plus className="w-4 h-4" /> Add Campaign
          </Button>
        </div>
      </Toolbar>

      <div className="table-container">
        <DataTable
          value={campaigns}
          paginator
          lazy
          first={first}
          rows={rows}
          totalRecords={totalRecords}
          onPage={onPageChange}
          loading={loading}
          emptyMessage="No campaigns found"
          stripedRows
          rowClassName={() => "table-row"}
        >
          <Column
            field="id"
            header="ID"
            sortable
            headerClassName="column-header"
            bodyClassName="column-body"
            style={{ width: "80px" }}
          />
          <Column
            field="title"
            header="Title"
            sortable
            headerClassName="column-header"
            bodyClassName="column-body"
          />
          <Column
            field="perDayBudget"
            header="Daily Budget"
            body={(row) => `৳${row.perDayBudget}`}
            sortable
            headerClassName="column-header"
            bodyClassName="column-body"
            style={{ textAlign: "right" }}
          />
          <Column
            body={estimatedEndDateBody}
            header="Est. End Date"
            headerClassName="column-header"
            bodyClassName="column-body"
          />
          <Column
            body={statusBody}
            header="Status"
            headerClassName="column-header"
            bodyClassName="column-body"
          />
          <Column
            body={actionsBody}
            header="Actions"
            headerClassName="column-header"
            bodyClassName="column-body"
            style={{ width: "160px" }}
          />
        </DataTable>
      </div>

      {/* Create Modal */}
      {modalFor === "create" && (
        <Modal isOpen onClose={closeModal} title="Create Campaign">
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <InputField
              label="Title"
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              required
              autoFocus
            />
            <InputField
              label="Daily Budget (৳)"
              type="number"
              step="1"
              value={formBudget}
              onChange={(e) => setFormBudget(parseFloat(e.target.value) || 0)}
              required
            />
            <InputField
              label="Estimated End Date"
              type="date"
              value={formEstimatedEndDate}
              onChange={(e) => setFormEstimatedEndDate(e.target.value)}
              min={toDateInputValue(new Date())}
              required
            />
            {formError && <p className="text-red-500 text-sm">{formError}</p>}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                Create
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {modalFor === "edit" && selectedCampaign && (
        <Modal isOpen onClose={closeModal} title="Edit Campaign">
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <InputField
              label="Title"
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              required
            />
            <InputField
              label="Daily Budget (৳)"
              type="number"
              step="1"
              value={formBudget}
              onChange={(e) => setFormBudget(parseFloat(e.target.value) || 0)}
              required
            />
            <InputField
              label="Estimated End Date"
              type="date"
              value={formEstimatedEndDate}
              onChange={(e) => setFormEstimatedEndDate(e.target.value)}
              required
            />
            {formError && <p className="text-red-500 text-sm">{formError}</p>}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                Update
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Stop/Resume Modal */}
      {modalFor === "stop" && selectedCampaign && (
        <Modal
          isOpen
          onClose={closeModal}
          title={
            selectedCampaign.status === "active"
              ? "Stop Campaign"
              : "Resume Campaign"
          }
        >
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to{" "}
            <strong>
              {selectedCampaign.status === "active" ? "stop" : "resume"}
            </strong>{" "}
            the campaign "{selectedCampaign.title}"?
            {selectedCampaign.status === "active" &&
              " Live polling will stop and no further data will be collected."}
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleToggleStop}
              loading={submitting}
            >
              {selectedCampaign.status === "active" ? "Stop" : "Resume"}
            </Button>
          </div>
        </Modal>
      )}

      {/* Delete Modal */}
      {modalFor === "delete" && selectedCampaign && (
        <Modal isOpen onClose={closeModal} title="Delete Campaign">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete "
            <strong>{selectedCampaign.title}</strong>"? This will remove all
            historical data.
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={submitting}
            >
              Delete
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default LiveCampaign;
