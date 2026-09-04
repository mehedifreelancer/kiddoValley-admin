// components/ui/GradientColorPicker.tsx
import { Check, Palette, X } from "lucide-react";
import { useState } from "react";

interface Props {
  value?: string | null; // current gradient css string
  onSelect: (gradient: string) => void;
}

const PRESETS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
];

export default function GradientColorPicker({ value, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [color1, setColor1] = useState("#667eea");
  const [color2, setColor2] = useState("#764ba2");
  const [angle, setAngle] = useState(135);

  const customGradient = `linear-gradient(${angle}deg, ${color1} 0%, ${color2} 100%)`;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform shadow-sm"
        style={{
          background:
            value ||
            "conic-gradient(from 180deg, red, yellow, lime, cyan, blue, magenta, red)",
        }}
        title="Use a gradient/color background instead"
      >
        {!value && <Palette className="w-4 h-4 text-white drop-shadow" />}
      </button>

      {open && (
        <div className="absolute z-50 top-10 left-0 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="font-medium text-sm">Choose background color</h5>
            <button type="button" onClick={() => setOpen(false)}>
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          </div>

          {/* Live preview */}
          <div
            className="w-full h-16 rounded-lg border border-gray-200 dark:border-gray-700"
            style={{ background: customGradient }}
          />

          {/* Two color inputs + angle */}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color1}
              onChange={(e) => setColor1(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer border border-gray-300"
            />
            <input
              type="color"
              value={color2}
              onChange={(e) => setColor2(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer border border-gray-300"
            />
            <div className="flex-1">
              <input
                type="range"
                min={0}
                max={360}
                value={angle}
                onChange={(e) => setAngle(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-400 text-center">{angle}°</p>
            </div>
          </div>

          {/* Presets */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Presets</p>
            <div className="grid grid-cols-6 gap-2">
              {PRESETS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    setColor1(g.match(/#[0-9a-fA-F]{6}/g)?.[0] || "#667eea");
                    setColor2(g.match(/#[0-9a-fA-F]{6}/g)?.[1] || "#764ba2");
                  }}
                  className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 hover:scale-110 transition-transform"
                  style={{ background: g }}
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onSelect(customGradient);
              setOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm py-2 rounded-lg transition-colors"
          >
            <Check className="w-4 h-4" />
            Use this color
          </button>
        </div>
      )}
    </div>
  );
}
