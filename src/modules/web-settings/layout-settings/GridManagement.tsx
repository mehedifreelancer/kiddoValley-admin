// modules/web-settings/layout-settings/GridManagement.tsx

"use client";

import { RotateCcw, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import Button from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import Toolbar from "../../../components/ui/Toolbar";
import { getGridSettings, updateGridSettings } from "./gridMangement.service";

// Breakpoint definitions
const BREAKPOINTS = [
  { key: "default", label: "Mobile (default)", prefix: "" },
  { key: "sm", label: "Small (sm)", prefix: "sm:" },
  { key: "md", label: "Medium (md)", prefix: "md:" },
  { key: "lg", label: "Large (lg)", prefix: "lg:" },
  { key: "xl", label: "Extra Large (xl)", prefix: "xl:" },
  { key: "2xl", label: "2XL (2xl)", prefix: "2xl:" },
];

const DEFAULT_COLUMNS = {
  default: 1,
  sm: 2,
  md: 3,
  lg: 4,
  xl: 4,
  "2xl": 4,
};

const COLUMN_OPTIONS = [1, 2, 3, 4, 5, 6];

export const GridManagement = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [columns, setColumns] =
    useState<Record<string, number>>(DEFAULT_COLUMNS);
  const [originalColumns, setOriginalColumns] =
    useState<Record<string, number>>(DEFAULT_COLUMNS);

  // Build Tailwind grid class string
  const buildGridClasses = (cols: Record<string, number>) => {
    const parts = ["grid", "gap-4"];
    for (const bp of BREAKPOINTS) {
      const prefix = bp.prefix;
      const col = cols[bp.key] || 1;
      if (prefix === "") {
        parts.push(`grid-cols-${col}`);
      } else {
        parts.push(`${prefix}grid-cols-${col}`);
      }
    }
    return parts.join(" ");
  };

  const currentGridClasses = buildGridClasses(columns);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await getGridSettings();
      // Parse gridClasses to extract column counts
      const parsed = parseGridClasses(data.gridClasses);
      setColumns(parsed);
      setOriginalColumns(parsed);
    } catch (error) {
      toast.error("Failed to load layout settings");
    } finally {
      setLoading(false);
    }
  };

  const parseGridClasses = (classes: string) => {
    const parts = classes.split(" ");
    const result: Record<string, number> = { ...DEFAULT_COLUMNS };
    for (const part of parts) {
      const match = part.match(/^(sm:|md:|lg:|xl:|2xl:)?grid-cols-(\d+)$/);
      if (match) {
        const prefix = match[1] || "default";
        const col = parseInt(match[2]);
        result[prefix === "default" ? "default" : prefix.slice(0, -1)] = col;
      }
    }
    return result;
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleColumnChange = (breakpoint: string, value: number) => {
    setColumns((prev) => ({ ...prev, [breakpoint]: value }));
  };

  const handleSave = async () => {
    const gridClasses = buildGridClasses(columns);
    setSaving(true);
    try {
      await updateGridSettings({ gridClasses });
      toast.success("Layout settings saved");
      setOriginalColumns(columns);
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setColumns(DEFAULT_COLUMNS);
    setOriginalColumns(DEFAULT_COLUMNS);
    const gridClasses = buildGridClasses(DEFAULT_COLUMNS);
    try {
      await updateGridSettings({ gridClasses });
      toast.success("Settings reset to default");
      setShowResetModal(false);
    } catch (error) {
      toast.error("Failed to reset");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toolbar title="Grid Layout Settings">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowResetModal(true)}
            disabled={saving}
          >
            <RotateCcw className="w-4 h-4 mr-1" /> Reset
          </Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>
            <Save className="w-4 h-4 mr-1" /> Save Changes
          </Button>
        </div>
      </Toolbar>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Grid Layout Configuration
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select the number of columns for each screen size. This will control
            the product grid layout across the site.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BREAKPOINTS.map((bp) => (
              <div key={bp.key} className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {bp.label}
                </label>
                <select
                  value={columns[bp.key] || 1}
                  onChange={(e) =>
                    handleColumnChange(bp.key, parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  {COLUMN_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c} columns
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
            <p className="text-sm font-mono text-gray-600 dark:text-gray-300 break-all">
              <span className="font-semibold">Generated Class:</span>{" "}
              {currentGridClasses}
            </p>
          </div>

          {/* Preview Grid */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preview
            </h4>
            <div className={currentGridClasses}>
              {Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-indigo-100 dark:bg-indigo-900/20 h-24 rounded-lg flex items-center justify-center border border-indigo-200 dark:border-indigo-800"
                >
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Item {idx + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reset Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset Layout Settings"
        size="md"
      >
        <div className="p-4">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to reset layout settings to default?
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowResetModal(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleReset} loading={saving}>
              Yes, Reset
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GridManagement;
