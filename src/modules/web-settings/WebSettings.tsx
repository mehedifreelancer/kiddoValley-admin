"use client";

import { Clock, Mail, MapPin, Phone, Upload, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import Button from "../../components/ui/Button";
import InputField from "../../components/ui/InputField";
import Panel from "../../components/ui/Panel";
import Toolbar from "../../components/ui/Toolbar";
import { webSettingsSchema } from "./webSettings.schema";
import { getWebSettings, updateWebSettings } from "./webSettings.service";
import {
  ContactInfo,
  SocialLinks,
  WebSettings as WebSettingsType,
} from "./webSettings.types";

export const WebSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<WebSettingsType>({
    logoUrl: null,
    socialLinks: { facebook: "", instagram: "", youtube: "", website: "" },
    footerText: "",
    contactInfo: {
      phone: "",
      email: "",
      facebookPage: "",
      whatsapp: "",
      address: "",
      workingHours: "",
      workingHoursWeekend: "",
    },
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load settings
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const data = await getWebSettings();
        setSettings(data);
        if (data.logoUrl) setLogoPreview(data.logoUrl);
        else setLogoPreview(null);
      } catch (error) {
        toast.error("সেটিংস লোড করতে ব্যর্থ হয়েছে");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Handlers
  const handleSocialChange = (field: keyof SocialLinks, value: string) => {
    setSettings((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [field]: value },
    }));
  };

  const handleFooterChange = (value: string) => {
    setSettings((prev) => ({ ...prev, footerText: value }));
  };

  // 🆕 Contact Info handlers
  const handleContactChange = (field: keyof ContactInfo, value: string) => {
    setSettings((prev) => ({
      ...prev,
      contactInfo: { ...prev.contactInfo, [field]: value },
    }));
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

  // ✅ Zod দিয়ে ভ্যালিডেট করুন
  const validateAndSave = async () => {
    const formDataToValidate = {
      logoUrl: settings.logoUrl,
      socialLinks: settings.socialLinks,
      footerText: settings.footerText,
      contactInfo: settings.contactInfo,
    };

    try {
      webSettingsSchema.parse(formDataToValidate);
    } catch (error: any) {
      // ✅ Zod error-এ `issues` ব্যবহার করুন
      const issues = error.issues || error.errors || [];
      const errorMessages = issues.map((e: any) => e.message).join(", ");
      toast.error(`ভ্যালিডেশন ব্যর্থ: ${errorMessages}`);
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();

      if (logoFile) {
        formData.append("logo", logoFile);
      } else if (!settings.logoUrl) {
        formData.append("logoUrl", "");
      }

      formData.append("socialLinks", JSON.stringify(settings.socialLinks));
      formData.append("footerText", settings.footerText);
      formData.append("contactInfo", JSON.stringify(settings.contactInfo)); // 🆕

      const updated = await updateWebSettings(formData);
      setSettings(updated);
      if (updated.logoUrl) setLogoPreview(updated.logoUrl);
      else setLogoPreview(null);
      toast.success("সব সেটিংস সফলভাবে সংরক্ষণ করা হয়েছে!");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "সেটিংস সংরক্ষণ ব্যর্থ হয়েছে",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">সেটিংস লোড করা হচ্ছে...</div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Toolbar title="ওয়েব সেটিংস">
        <Button
          variant="success"
          onClick={validateAndSave}
          loading={submitting}
        >
          সব সেভ করুন
        </Button>
      </Toolbar>

      {/* Logo Panel */}
      <Panel
        title="লোগো"
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
                  <span className="font-semibold">ক্লিক করুন</span> বা ড্র্যাগ
                  করুন
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

      {/* Social Links Panel */}
      <Panel
        title="সোশ্যাল মিডিয়া লিংক"
        className="mb-4 border-l-4 border-green-500"
        titleClassName="text-green-700 dark:text-green-300 font-semibold"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="ফেসবুক URL"
            value={settings.socialLinks.facebook}
            onChange={(e) => handleSocialChange("facebook", e.target.value)}
            placeholder="https://facebook.com/yourpage"
          />
          <InputField
            label="ইনস্টাগ্রাম URL"
            value={settings.socialLinks.instagram}
            onChange={(e) => handleSocialChange("instagram", e.target.value)}
            placeholder="https://instagram.com/yourprofile"
          />
          <InputField
            label="ইউটিউব URL"
            value={settings.socialLinks.youtube}
            onChange={(e) => handleSocialChange("youtube", e.target.value)}
            placeholder="https://youtube.com/c/yourchannel"
          />
          <InputField
            label="ওয়েবসাইট URL"
            value={settings.socialLinks.website}
            onChange={(e) => handleSocialChange("website", e.target.value)}
            placeholder="https://yourwebsite.com"
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          ⚠️ প্রতিটি লিংক সম্পূর্ণ URL হতে হবে (http:// বা https:// সহ)
        </p>
      </Panel>

      {/* 🆕 Contact Info Panel */}
      <Panel
        title="যোগাযোগ তথ্য"
        className="mb-4 border-l-4 border-orange-500"
        titleClassName="text-orange-700 dark:text-orange-300 font-semibold"
      >
        <div className="space-y-4">
          {/* Contact Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Phone className="w-4 h-4 inline mr-2" />
                ফোন নম্বর *
              </label>
              <input
                type="text"
                value={settings.contactInfo?.phone || ""}
                onChange={(e) => handleContactChange("phone", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm"
                placeholder="০১৭৮১-৮৭৩০৬৪"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Mail className="w-4 h-4 inline mr-2" />
                ইমেইল *
              </label>
              <input
                type="email"
                value={settings.contactInfo?.email || ""}
                onChange={(e) => handleContactChange("email", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm"
                placeholder="contact@example.com"
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Phone className="w-4 h-4 inline mr-2" />
                হোয়াটসঅ্যাপ নম্বর *
              </label>
              <input
                type="text"
                value={settings.contactInfo?.whatsapp || ""}
                onChange={(e) =>
                  handleContactChange("whatsapp", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm"
                placeholder="০১৭৮১-৮৭৩০৬৪"
              />
            </div>

            {/* Facebook Page */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                ফেসবুক পেজ
              </label>
              <input
                type="text"
                value={settings.contactInfo?.facebookPage || ""}
                onChange={(e) =>
                  handleContactChange("facebookPage", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm"
                placeholder="Kiddo Valley"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <MapPin className="w-4 h-4 inline mr-2" />
                ঠিকানা *
              </label>
              <input
                type="text"
                value={settings.contactInfo?.address || ""}
                onChange={(e) => handleContactChange("address", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm"
                placeholder="ঢাকা, বাংলাদেশ"
              />
            </div>

            {/* Working Hours */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Clock className="w-4 h-4 inline mr-2" />
                কর্মঘণ্টা *
              </label>
              <input
                type="text"
                value={settings.contactInfo?.workingHours || ""}
                onChange={(e) =>
                  handleContactChange("workingHours", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm"
                placeholder="সকাল ৯টা – রাত ৯টা"
              />
            </div>

            {/* Weekend Hours */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Clock className="w-4 h-4 inline mr-2" />
                সপ্তাহান্তের কর্মঘণ্টা
              </label>
              <input
                type="text"
                value={settings.contactInfo?.workingHoursWeekend || ""}
                onChange={(e) =>
                  handleContactChange("workingHoursWeekend", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm"
                placeholder="সকাল ১০টা – রাত ৮টা (শুক্রবার ও শনিবার)"
              />
            </div>
          </div>
        </div>
      </Panel>

      {/* Footer Text Panel */}
      <Panel
        title="ফুটার টেক্সট"
        className="border-l-4 border-purple-500"
        titleClassName="text-purple-700 dark:text-purple-300 font-semibold"
      >
        <div className="space-y-4">
          <textarea
            value={settings.footerText}
            onChange={(e) => handleFooterChange(e.target.value)}
            rows={4}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm"
            placeholder="উদাহরণ: © ২০২৫ Kiddo Valley। সর্বাধিকার সংরক্ষিত।"
            maxLength={500}
          />
          <p className="text-xs text-gray-400 mt-1">
            {settings.footerText.length}/500 অক্ষর
          </p>
        </div>
      </Panel>
    </div>
  );
};

export default WebSettings;
