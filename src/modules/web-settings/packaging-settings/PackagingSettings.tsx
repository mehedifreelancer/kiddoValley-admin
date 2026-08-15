import { Package, RotateCcw, Save } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import Button from "../../../components/ui/Button";
import InputField from "../../../components/ui/InputField";
import Modal from "../../../components/ui/Modal";
import Toolbar from "../../../components/ui/Toolbar";
import {
  getPackagingSettings,
  updatePackagingSettings,
} from "./packagingSettings.service";
import { PackagingSettings as PackagingSettingsType } from "./packagingSettings.types";

const DEFAULT_SETTINGS: PackagingSettingsType = {
  averagePackagingCost: 0,
};

const PackagingSettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [averageCost, setAverageCost] = useState<number>(0);
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await getPackagingSettings();
      setAverageCost(data.averagePackagingCost ?? 0);
    } catch (error) {
      toast.error("Failed to load packaging settings");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const payload: PackagingSettingsType = {
      averagePackagingCost: averageCost,
    };

    setSaving(true);
    try {
      await updatePackagingSettings(payload);
      toast.success("Packaging settings updated successfully!");
      await fetchSettings();
    } catch (error) {
      toast.error("Failed to update settings");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      await updatePackagingSettings(DEFAULT_SETTINGS);
      toast.success("Settings reset to default!");
      await fetchSettings();
      setShowResetModal(false);
    } catch (error) {
      toast.error("Failed to reset settings");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-500 dark:text-gray-400">
            Loading packaging settings...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toolbar title="Packaging Settings">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowResetModal(true)}
            disabled={saving}
            className="flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            loading={saving}
            disabled={saving}
            className="flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </Toolbar>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all hover:shadow-md">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Packaging Cost
            </h2>
          </div>
        </div>

        <div className="p-4 md:p-6">
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Average Packaging Cost (per order)
            </label>
            <div className="flex items-center gap-2">
              <InputField
                type="number"
                value={averageCost}
                onChange={(e) =>
                  setAverageCost(parseFloat(e.target.value) || 0)
                }
                step="0.5"
                min="0"
                className="w-40"
                placeholder="Enter cost"
              />
              <span className="text-gray-500 dark:text-gray-400">BDT</span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              This cost will be added to each order's total as packaging charge.
            </p>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset to Default"
        size="md"
      >
        <div className="p-4">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to reset packaging cost to default (0)?
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowResetModal(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReset}
              loading={saving}
              disabled={saving}
            >
              Yes, Reset
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PackagingSettingsPage;
