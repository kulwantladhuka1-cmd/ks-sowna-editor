
import React, { useState } from 'react';

type FontPickerProps = {
  value: string;
  onChange: (font: string) => void;
};

const fontOptions = [
  { label: 'ਪੰਜਾਬੀ — Gurmukhi', value: 'Noto Sans Gurmukhi' },
  { label: 'ਪੰਜਾਬੀ — Gurmukhi Serif', value: 'Noto Serif Gurmukhi' },
  { label: 'English — Arial', value: 'Arial' },
  { label: 'English — Georgia', value: 'Georgia' },
  { label: 'English — Times New Roman', value: 'Times New Roman' },
  { label: 'English — Cursive', value: 'cursive' },
  { label: 'English — Sans Serif', value: 'sans-serif' },
];

export default function FontPicker({
  value,
  onChange,
}: FontPickerProps) {
  const [fontSize, setFontSize] = useState(32);

  return (
    <div className="space-y-3 rounded-xl border border-purple-200 bg-white p-4">
      <label className="block text-sm font-semibold text-slate-800">
        ਪੰਜਾਬੀ ਅਤੇ English ਫੌਂਟ ਚੁਣੋ
      </label>

      <select
        value={value || 'Noto Sans Gurmukhi'}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-300 p-3 text-base"
      >
        {fontOptions.map((font) => (
          <option key={font.value} value={font.value}>
            {font.label}
          </option>
        ))}
      </select>

      <label className="block text-sm font-semibold text-slate-800">
        ਫੌਂਟ ਸਾਈਜ਼: {fontSize}px
      </label>

      <input
        type="range"
        min="12"
        max="120"
        value={fontSize}
        onChange={(event) => setFontSize(Number(event.target.value))}
        className="w-full"
      />

      <div
        className="rounded-lg bg-slate-50 p-4 text-center break-words"
        style={{ fontFamily: value || 'Noto Sans Gurmukhi', fontSize }}
      >
        ਸਾਡਾ ਪੰਜਾਬ — KS SOWNA
      </div>
    </div>
  );
}
