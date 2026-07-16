import { Upload, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import Button from "../../components/ui/Button";
import InputField from "../../components/ui/InputField";
import Panel from "../../components/ui/Panel";
import Toolbar from "../../components/ui/Toolbar";
import { getWebSettings, updateWebSettings } from "./webSettings.service";
import {
  SocialLinks,
  WebSettings as WebSettingsType,
} from "./webSettings.types";

export const WebSettings: React.FC = () => {
  const [loading, setLoading] = useState(false);

  // Shared state
  const [settings, setSettings] = useState<WebSettingsType>({
    logoUrl: null,
    socialLinks: { facebook: "", instagram: "", youtube: "", website: "" },
    footerText: "",
  });

  // Logo specific
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [submittingLogo, setSubmittingLogo] = useState(false);

  // Social specific
  const [submittingSocial, setSubmittingSocial] = useState(false);

  // Footer specific
  const [submittingFooter, setSubmittingFooter] = useState(false);

  // Load settings
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const data = await getWebSettings();
        setSettings(data);
        if (data.logoUrl) setLogoPreview(data.logoUrl);
      } catch (error) {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // ---- Handlers ----
  const handleSocialChange = (field: keyof SocialLinks, value: string) => {
    setSettings((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [field]: value },
    }));
  };

  const handleFooterChange = (value: string) => {
    setSettings((prev) => ({ ...prev, footerText: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const preview = URL.createObjectURL(file);
    setLogoPreview(preview);
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setSettings((prev) => ({ ...prev, logoUrl: null }));
  };

  // ---- Save functions ----
  const saveLogo = async () => {
    if (!logoFile && !settings.logoUrl) {
      toast.info("No logo to save");
      return;
    }
    setSubmittingLogo(true);
    try {
      const formData = new FormData();
      if (logoFile) formData.append("logo", logoFile);
      const updated = await updateWebSettings(formData);
      setSettings(updated);
      if (updated.logoUrl) setLogoPreview(updated.logoUrl);
      toast.success("Logo updated successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update logo");
    } finally {
      setSubmittingLogo(false);
    }
  };

  const saveSocial = async () => {
    setSubmittingSocial(true);
    try {
      const formData = new FormData();
      formData.append("socialLinks", JSON.stringify(settings.socialLinks));
      const updated = await updateWebSettings(formData);
      setSettings(updated);
      toast.success("Social links updated successfully!");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to update social links",
      );
    } finally {
      setSubmittingSocial(false);
    }
  };

  const saveFooter = async () => {
    setSubmittingFooter(true);
    try {
      const formData = new FormData();
      formData.append("footerText", settings.footerText);
      const updated = await updateWebSettings(formData);
      setSettings(updated);
      toast.success("Footer text updated successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update footer");
    } finally {
      setSubmittingFooter(false);
    }
  };

  const saveAll = async () => {
    setSubmittingLogo(true);
    setSubmittingSocial(true);
    setSubmittingFooter(true);
    try {
      const formData = new FormData();
      if (logoFile) formData.append("logo", logoFile);
      formData.append("socialLinks", JSON.stringify(settings.socialLinks));
      formData.append("footerText", settings.footerText);
      const updated = await updateWebSettings(formData);
      setSettings(updated);
      if (updated.logoUrl) setLogoPreview(updated.logoUrl);
      toast.success("All settings saved successfully!");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to save all settings",
      );
    } finally {
      setSubmittingLogo(false);
      setSubmittingSocial(false);
      setSubmittingFooter(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12">Loading settings...</div>;
  }

  return (
    <div className="max-w-4xl  mx-auto ">
      <Toolbar title="Web Settings">
        <Button
          variant="success"
          onClick={saveAll}
          loading={submittingLogo || submittingSocial || submittingFooter}
        >
          Save
        </Button>
      </Toolbar>

      {/* Panel 1: Logo */}
      <Panel
        title="Logo"
        className="mb-4 border-l-4 border-blue-500"
        titleClassName="text-blue-700 dark:text-blue-300 font-semibold"
      >
        <div className="space-y-4">
          <div className="relative w-full h-48 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors overflow-hidden">
            {logoPreview ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="max-w-full max-h-full object-contain cursor-pointer"
                  onClick={() => window.open(logoPreview, "_blank")}
                />
                <button
                  type="button"
                  onClick={removeLogo}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 z-10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
                onClick={() => document.getElementById("logo-upload")?.click()}
              >
                <Upload className="w-10 h-10 mb-2 text-gray-500 dark:text-gray-400" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
                </p>
                <p className="text-xs text-gray-400">PNG, JPG, SVG (max 5MB)</p>
              </div>
            )}
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </div>
        </div>
      </Panel>

      {/* Panel 2: Social Links */}
      <Panel
        title="Social Links"
        className="mb-4 border-l-4 border-green-500"
        titleClassName="text-green-700 dark:text-green-300 font-semibold"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Facebook URL"
              value={settings.socialLinks.facebook}
              onChange={(e) => handleSocialChange("facebook", e.target.value)}
              placeholder="https://facebook.com/yourpage"
            />
            <InputField
              label="Instagram URL"
              value={settings.socialLinks.instagram}
              onChange={(e) => handleSocialChange("instagram", e.target.value)}
              placeholder="https://instagram.com/yourprofile"
            />
            <InputField
              label="YouTube URL"
              value={settings.socialLinks.youtube}
              onChange={(e) => handleSocialChange("youtube", e.target.value)}
              placeholder="https://youtube.com/c/yourchannel"
            />
            <InputField
              label="Website URL"
              value={settings.socialLinks.website}
              onChange={(e) => handleSocialChange("website", e.target.value)}
              placeholder="https://yourwebsite.com"
            />
          </div>
        </div>
      </Panel>

      {/* Panel 3: Footer Text */}
      <Panel
        title="Tiny Footer Text"
        className="border-l-4 border-purple-500"
        titleClassName="text-purple-700 dark:text-purple-300 font-semibold"
      >
        <div className="space-y-4">
          <div>
            <textarea
              value={settings.footerText}
              onChange={(e) => handleFooterChange(e.target.value)}
              rows={4}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm"
              placeholder="e.g., © 2025 Kiddo Valley. All rights reserved."
              maxLength={500}
            />
            <p className="text-xs text-gray-400 mt-1">
              {settings.footerText.length}/500 characters
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
};

export default WebSettings;
