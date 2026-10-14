import React, { useState, useEffect } from 'react';
import { EditorState } from '../types/editor';
import { translations, Language } from '../utils/i18n';
import { exportCanvasToDataURL, downloadImage } from '../utils/exporter';
import {
  X,
  Download,
  Share2,
  Check,
  Sparkles,
  Loader2,
  FileImage,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  state: EditorState;
  lang: Language;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  state,
  lang,
  onClose,
}) => {
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [isTransparent, setIsTransparent] = useState<boolean>(
    state.background.type === 'transparent'
  );
  const [scale, setScale] = useState<number>(1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const t = translations[lang];

  // Generate real preview on settings change
  useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;

    const generate = async () => {
      setIsGenerating(true);
      try {
        const url = await exportCanvasToDataURL(state, {
          format,
          transparent: isTransparent && format === 'png',
          scale: 0.5, // fast thumbnail preview
        });
        if (!isCancelled) {
          setPreviewUrl(url);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!isCancelled) setIsGenerating(false);
      }
    };

    generate();
    return () => {
      isCancelled = true;
    };
  }, [isOpen, state, format, isTransparent]);

  if (!isOpen) return null;

  const targetWidth = state.width * scale;
  const targetHeight = state.height * scale;

  const handleDownload = async () => {
    setIsExporting(true);
    setErrorMessage(null);
    try {
      const dataUrl = await exportCanvasToDataURL(state, {
        format,
        transparent: isTransparent && format === 'png',
        scale,
      });

      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `KS_SOWNA_${dateStr}_${state.width * scale}x${state.height * scale}.${
        format === 'jpeg' ? 'jpg' : 'png'
      }`;

      downloadImage(dataUrl, filename);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e?.message || 'Download failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    try {
      const dataUrl = await exportCanvasToDataURL(state, {
        format,
        transparent: isTransparent && format === 'png',
        scale,
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `ks_sowna_design.${format === 'jpeg' ? 'jpg' : 'png'}`, {
        type: blob.type,
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'KS SOWNA Design',
          text: 'Created with KS SOWNA – Photo & Logo Editor',
        });
      } else {
        handleDownload();
      }
    } catch (e) {
      // Ignore user aborting share dialog
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/50 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-700 shadow-xs">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                {t.exportHD}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {targetWidth} × {targetHeight} px • {scale}x Resolution
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Live Export Preview Box */}
          <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 checkerboard-pattern flex items-center justify-center p-2 shadow-inner">
            {isGenerating ? (
              <div className="flex items-center gap-2 text-purple-600 text-xs font-bold">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating Preview...</span>
              </div>
            ) : previewUrl ? (
              <img
                src={previewUrl}
                alt="Export preview"
                className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
              />
            ) : null}

            <span className="absolute bottom-2 right-2 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs">
              {targetWidth} × {targetHeight}
            </span>
          </div>

          {/* Format selector: PNG vs JPG */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-900 uppercase tracking-wider block">
              Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFormat('png')}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition ${
                  format === 'png'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <FileImage className="w-4 h-4" />
                PNG (High Quality)
              </button>

              <button
                onClick={() => {
                  setFormat('jpeg');
                  setIsTransparent(false);
                }}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition ${
                  format === 'jpeg'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <FileImage className="w-4 h-4" />
                JPG (Smaller File)
              </button>
            </div>
          </div>

          {/* Transparent Background option (only for PNG) */}
          {format === 'png' && (
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-purple-50/50 border border-purple-200">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  {t.transparentBg}
                </span>
                <span className="text-[11px] text-slate-500 font-medium block">
                  {t.saveTransparentTip}
                </span>
              </div>
              <input
                type="checkbox"
                checked={isTransparent}
                onChange={(e) => setIsTransparent(e.target.checked)}
                className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
              />
            </div>
          )}

          {/* Scale Resolution (1x standard, 2x HD, 4x Ultra-HD) */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-900 uppercase tracking-wider block">
              Resolution Scale
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setScale(1)}
                className={`p-2.5 rounded-2xl border text-xs font-bold transition ${
                  scale === 1
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                }`}
              >
                1x Standard
              </button>

              <button
                onClick={() => setScale(2)}
                className={`p-2.5 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-1 ${
                  scale === 2
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                2x HD
              </button>

              <button
                onClick={() => setScale(4)}
                className={`p-2.5 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-1 ${
                  scale === 4
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                4x Ultra HD
              </button>
            </div>
          </div>
        </div>

        {/* Status Alerts */}
        {downloadSuccess && (
          <div className="mx-4 mb-2 p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2 shadow-sm animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-bold">Photo saved successfully! Check your phone downloads.</span>
          </div>
        )}

        {errorMessage && (
          <div className="mx-4 mb-2 p-3 rounded-2xl bg-red-50 border border-red-300 text-red-800 text-xs flex items-center gap-2 shadow-sm animate-fadeIn">
            <X className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span className="font-bold">{errorMessage}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-2.5">
          {/* Share Button (Mobile/Android) */}
          <button
            onClick={handleShare}
            disabled={isExporting}
            className="flex-1 py-3 rounded-2xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-xs"
          >
            <Share2 className="w-4 h-4" />
            <span>{t.share}</span>
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="flex-[2] py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-95 text-white font-extrabold text-xs sm:text-sm transition shadow-md flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {isExporting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : downloadSuccess ? (
              <>
                <Check className="w-5 h-5 stroke-[3]" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>{format === 'png' ? t.downloadPng : t.downloadJpg}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
