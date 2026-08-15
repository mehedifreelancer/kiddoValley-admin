// pages/deliverySettings.tsx

import {
  MapPin,
  Percent,
  Plus,
  RotateCcw,
  Save,
  Tag,
  Trash2,
  TrendingUp,
  Truck,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import Button from "../../../components/ui/Button";
import InputField from "../../../components/ui/InputField";
import Modal from "../../../components/ui/Modal";
import Toolbar from "../../../components/ui/Toolbar";
import {
  getDeliverySettings,
  updateDeliverySettings,
} from "./deliverySettings.service";
import { DeliverySettings, WeightTier } from "./deliverySettings.types";

// ---------- Default settings (Pathao initial rates) ----------
const DEFAULT_SETTINGS: DeliverySettings = {
  weightTiers: [
    { maxKg: 0.5, insideDhaka: 60, suburbs: 80, outsideDhaka: 110 },
    { maxKg: 1, insideDhaka: 70, suburbs: 100, outsideDhaka: 130 },
    { maxKg: 2, insideDhaka: 90, suburbs: 130, outsideDhaka: 170 },
  ],
  overweightPerKg: {
    insideDhaka: 15,
    suburbs: 20,
    outsideDhaka: 25,
  },
  codPercentage: 1,
  deliveryDiscountPercent: 0,
};

const DeliverySettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tiers, setTiers] = useState<WeightTier[]>([]);
  const [overweightInside, setOverweightInside] = useState<number>(0);
  const [overweightSuburbs, setOverweightSuburbs] = useState<number>(0);
  const [overweightOutside, setOverweightOutside] = useState<number>(0);
  const [codPercent, setCodPercent] = useState<number>(1);
  const [deliveryDiscountPercent, setDeliveryDiscountPercent] =
    useState<number>(0);
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await getDeliverySettings();
      setTiers(data.weightTiers || []);
      setOverweightInside(data.overweightPerKg?.insideDhaka ?? 0);
      setOverweightSuburbs(data.overweightPerKg?.suburbs ?? 0);
      setOverweightOutside(data.overweightPerKg?.outsideDhaka ?? 0);
      setCodPercent(data.codPercentage ?? 1);
      setDeliveryDiscountPercent(data.deliveryDiscountPercent ?? 0);
    } catch (error) {
      toast.error("Failed to load delivery settings");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTierChange = (
    index: number,
    field: keyof WeightTier,
    value: number,
  ) => {
    const updated = [...tiers];
    updated[index] = { ...updated[index], [field]: value };
    setTiers(updated);
  };

  const addTier = () => {
    const lastMax = tiers.length > 0 ? tiers[tiers.length - 1].maxKg : 0;
    setTiers([
      ...tiers,
      { maxKg: lastMax + 1, insideDhaka: 0, suburbs: 0, outsideDhaka: 0 },
    ]);
  };

  const removeTier = (index: number) => {
    if (tiers.length <= 1) {
      toast.error("At least one tier is required");
      return;
    }
    const updated = tiers.filter((_, i) => i !== index);
    setTiers(updated);
  };

  const validateTiers = (): boolean => {
    const sorted = [...tiers].sort((a, b) => a.maxKg - b.maxKg);
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].maxKg <= 0) {
        toast.error("Max weight must be greater than 0");
        return false;
      }
      if (i > 0 && sorted[i].maxKg <= sorted[i - 1].maxKg) {
        toast.error(
          `Tier ${i + 1} max weight must be greater than previous tier`,
        );
        return false;
      }
      if (
        sorted[i].insideDhaka < 0 ||
        sorted[i].suburbs < 0 ||
        sorted[i].outsideDhaka < 0
      ) {
        toast.error("Rates cannot be negative");
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateTiers()) return;

    const payload: DeliverySettings = {
      weightTiers: tiers,
      overweightPerKg: {
        insideDhaka: overweightInside,
        suburbs: overweightSuburbs,
        outsideDhaka: overweightOutside,
      },
      codPercentage: codPercent,
      deliveryDiscountPercent: deliveryDiscountPercent,
    };

    setSaving(true);
    try {
      await updateDeliverySettings(payload);
      toast.success("Delivery settings updated successfully!");
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
      await updateDeliverySettings(DEFAULT_SETTINGS);
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
            Loading delivery settings...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <Toolbar title="Delivery Charge Settings">
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

      {/* Card 1: Weight Tiers */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all hover:shadow-md">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900/30">
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Weight Tiers
            </h2>
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-full font-medium">
              {tiers.length} tier{tiers.length !== 1 ? "s" : ""}
            </span>
          </div>
          <Button
            onClick={addTier}
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Tier
          </Button>
        </div>

        <div className="p-4 md:p-6 space-y-4">
          {tiers.map((tier, index) => (
            <div
              key={index}
              className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-4 border border-gray-200 dark:border-gray-700 transition-all hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-sm"
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                {/* Tier Badge */}
                <div className="flex items-center gap-3 min-w-[120px] lg:pt-1">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Tier #{index + 1}
                  </span>
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-full font-medium">
                    ≤ {tier.maxKg} kg
                  </span>
                </div>

                {/* Inputs */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Max Weight (kg)
                    </label>
                    <InputField
                      type="number"
                      value={tier.maxKg}
                      onChange={(e) =>
                        handleTierChange(
                          index,
                          "maxKg",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      step="0.1"
                      min="0.1"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-green-600 dark:text-green-400 mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Inside Dhaka
                    </label>
                    <InputField
                      type="number"
                      value={tier.insideDhaka}
                      onChange={(e) =>
                        handleTierChange(
                          index,
                          "insideDhaka",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      step="1"
                      min="0"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-purple-600 dark:text-purple-400 mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Sub Urbans
                    </label>
                    <InputField
                      type="number"
                      value={tier.suburbs}
                      onChange={(e) =>
                        handleTierChange(
                          index,
                          "suburbs",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      step="1"
                      min="0"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Outside Dhaka
                    </label>
                    <InputField
                      type="number"
                      value={tier.outsideDhaka}
                      onChange={(e) =>
                        handleTierChange(
                          index,
                          "outsideDhaka",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      step="1"
                      min="0"
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Remove Button */}
                <Button
                  variant="danger"
                  size="xs"
                  onClick={() => removeTier(index)}
                  disabled={tiers.length <= 1}
                  className="flex items-center gap-1 self-start lg:self-center"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5 mt-2">
            <span className="inline-block w-1 h-1 rounded-full bg-gray-400" />
            Tiers must be in ascending order of max weight. Each tier defines
            the delivery rate for that weight bracket.
          </p>
        </div>
      </div>

      {/* Card 2: Overweight & COD */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all hover:shadow-md">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
          <div className="flex items-center gap-3">
            <Tag className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Additional Charges
            </h2>
          </div>
        </div>

        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overweight */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                Overweight Charge (per kg)
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Inside Dhaka
                  </label>
                  <InputField
                    type="number"
                    value={overweightInside}
                    onChange={(e) =>
                      setOverweightInside(parseFloat(e.target.value) || 0)
                    }
                    step="1"
                    min="0"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Sub Urbans
                  </label>
                  <InputField
                    type="number"
                    value={overweightSuburbs}
                    onChange={(e) =>
                      setOverweightSuburbs(parseFloat(e.target.value) || 0)
                    }
                    step="1"
                    min="0"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Outside Dhaka
                  </label>
                  <InputField
                    type="number"
                    value={overweightOutside}
                    onChange={(e) =>
                      setOverweightOutside(parseFloat(e.target.value) || 0)
                    }
                    step="1"
                    min="0"
                    className="w-full"
                  />
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Applied when weight exceeds the highest tier.
                </p>
              </div>
            </div>

            {/* COD */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Percent className="w-4 h-4 text-purple-500" />
                COD Charge
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Percentage (% of order total)
                  </label>
                  <div className="flex items-center gap-2">
                    <InputField
                      type="number"
                      value={codPercent}
                      onChange={(e) =>
                        setCodPercent(parseFloat(e.target.value) || 0)
                      }
                      step="0.1"
                      min="0"
                      className="w-32"
                    />
                    <span className="text-gray-500 dark:text-gray-400">%</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Set to 0 to disable COD charge. Applied on (product price +
                  delivery base + weight charge).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Delivery Charge Discount */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all hover:shadow-md">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
          <div className="flex items-center gap-3">
            <Percent className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Delivery Charge Discount
            </h2>
          </div>
        </div>

        <div className="p-4 md:p-6">
          <div className="max-w-sm">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Discount Percentage (%)
            </label>
            <div className="flex items-center gap-2">
              <InputField
                type="number"
                value={deliveryDiscountPercent}
                onChange={(e) =>
                  setDeliveryDiscountPercent(parseFloat(e.target.value) || 0)
                }
                step="0.5"
                min="0"
                max="100"
                className="w-32"
              />
              <span className="text-gray-500 dark:text-gray-400">%</span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              This discount will be applied to the final delivery charge (after
              adding COD and overweight charges). Set to 0 for no discount.
            </p>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset to Default"
        size="md"
      >
        <div className="p-4">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to reset all delivery settings to the default
            values? This action cannot be undone.
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

export default DeliverySettingsPage;
