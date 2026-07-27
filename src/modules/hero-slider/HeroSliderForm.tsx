import React, { useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import ImageUploadField from "../../components/ui/ImageUploadField";
import InputField from "../../components/ui/InputField";
import { uploadHeroImage } from "./heroSlider.service";
import { HeroSlider, HeroSliderFormData } from "./heroSlider.types";

interface Props {
  slide?: HeroSlider | null;
  onSave: (data: HeroSliderFormData) => void;
  onCancel: () => void;
}

const defaultFormData: HeroSliderFormData = {
  badgeText: "",
  firstTitle: "",
  secondTitle: "",
  firstTitleColor: "text-purple-600",
  secondTitleColor: "text-pink-500",
  description: "",
  bookTitle: "",
  bookSubtitle: "",
  sliderDetailsUrl: "",
  bgImage: "",
  innerBigImage: "",
  innerTopImage: "",
  innerBottomImage: "",
  isActive: true,
};

export const HeroSliderForm: React.FC<Props> = ({
  slide,
  onSave,
  onCancel,
}) => {
  const [form, setForm] = useState<HeroSliderFormData>(defaultFormData);

  useEffect(() => {
    if (slide) {
      const { id, createdAt, updatedAt, order, ...rest } = slide;
      setForm(rest);
    } else {
      setForm({ ...defaultFormData });
    }
  }, [slide]);

  const handleChange = (field: keyof HeroSliderFormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 max-h-[70vh] overflow-y-auto p-1"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Badge Text *"
          value={form.badgeText}
          onChange={(e) => handleChange("badgeText", e.target.value)}
          required
        />
        <InputField
          label="First Title *"
          value={form.firstTitle}
          onChange={(e) => handleChange("firstTitle", e.target.value)}
          required
        />
        <InputField
          label="Second Title *"
          value={form.secondTitle}
          onChange={(e) => handleChange("secondTitle", e.target.value)}
          required
        />
        <InputField
          label="First Title Color (Tailwind class)"
          value={form.firstTitleColor}
          onChange={(e) => handleChange("firstTitleColor", e.target.value)}
          placeholder="text-purple-600"
        />
        <InputField
          label="Second Title Color (Tailwind class)"
          value={form.secondTitleColor}
          onChange={(e) => handleChange("secondTitleColor", e.target.value)}
          placeholder="text-pink-500"
        />
        <InputField
          label="Book Title *"
          value={form.bookTitle}
          onChange={(e) => handleChange("bookTitle", e.target.value)}
          required
        />
        <InputField
          label="Book Subtitle *"
          value={form.bookSubtitle}
          onChange={(e) => handleChange("bookSubtitle", e.target.value)}
          required
        />
        <InputField
          label="Slider Details URL"
          value={form.sliderDetailsUrl || ""}
          onChange={(e) => handleChange("sliderDetailsUrl", e.target.value)}
          placeholder="/category/space"
        />
      </div>

      <InputField
        label="Description *"
        value={form.description}
        onChange={(e) => handleChange("description", e.target.value)}
        required
        multiline
        rows={3}
      />

      <div className="space-y-2">
        <h4 className="font-medium">Images</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ImageUploadField
            label="Background Image *"
            value={form.bgImage}
            onChange={(url) => handleChange("bgImage", url)}
            onUpload={uploadHeroImage}
          />
          <ImageUploadField
            label="Big Book Image *"
            value={form.innerBigImage}
            onChange={(url) => handleChange("innerBigImage", url)}
            onUpload={uploadHeroImage}
          />
          <ImageUploadField
            label="Top Small Book *"
            value={form.innerTopImage}
            onChange={(url) => handleChange("innerTopImage", url)}
            onUpload={uploadHeroImage}
          />
          <ImageUploadField
            label="Bottom Small Book *"
            value={form.innerBottomImage}
            onChange={(url) => handleChange("innerBottomImage", url)}
            onUpload={uploadHeroImage}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => handleChange("isActive", e.target.checked)}
          />
          Active
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
        <Button variant="outline" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button variant="primary" type="submit">
          {slide ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
};

export default HeroSliderForm;
