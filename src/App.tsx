import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Layer,
  TextLayer,
  ImageLayer,
  ShapeLayer,
  StickerLayer,
  ShapeType,
  CanvasBackground,
  Template,
  SavedProject,
} from './types/editor';
import { TEMPLATES, CANVAS_PRESETS } from './data/templates';
import { StickerItem } from './data/stickers';
import { translations, Language } from './utils/i18n';
import { CrownLogo } from './components/CrownLogo';
import { CanvasRenderer } from './components/CanvasRenderer';
import { StylePanel } from './components/StylePanel';
import { LayersPanel } from './components/LayersPanel';
import { AddPanel } from './components/AddPanel';
import { TemplatesModal } from './components/TemplatesModal';
import { CanvasSettingsModal } from './components/CanvasSettingsModal';
import { ExportModal } from './components/ExportModal';
import { CropModal } from './components/CropModal';
import { EraserModal } from './components/EraserModal';
import { ProjectsModal } from './components/ProjectsModal';
import { HomeDashboard } from './components/HomeDashboard';
import {
  Undo2,
  Redo2,
  Download,
  LayoutTemplate,
  PlusCircle,
  Layers,
  Sliders,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  FolderOpen,
  X,
  Home,
  Type,
  Palette,
} from 'lucide-react';

type Tab = 'style' | 'layers' | 'add' | null;

interface HistorySnapshot {
  layers: Layer[];
  background: CanvasBackground;
  width: number;
  height: number;
  preset: string;
}

export default function App() {
  // Localization: English default with Punjabi toggle
  const [lang, setLang] = useState<Language>('en');
  const t = translations[lang];

  // View Mode: 'editor' vs 'home'
  const [viewMode, setViewMode] = useState<'editor' | 'home'>('editor');

  // Editor State
  const initialTemplate = TEMPLATES[0]; // Royal Crown Logo default
  const [layers, setLayers] = useState<Layer[]>(initialTemplate.layers);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>('layer-logo-initials');
  const [background, setBackground] = useState<CanvasBackground>(initialTemplate.background);
  const [width, setWidth] = useState<number>(initialTemplate.preset.width);
  const [height, setHeight] = useState<number>(initialTemplate.preset.height);
  const [preset, setPreset] = useState<string>(initialTemplate.preset.id);

  // Viewport Zoom & Pan
  const [zoom, setZoom] = useState<number>(0.42);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Mobile Bottom Drawer / Active Tab
  const [activeTab, setActiveTab] = useState<Tab>(null);

  // Modals
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isCanvasSettingsOpen, setIsCanvasSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [cropTargetLayer, setCropTargetLayer] = useState<ImageLayer | null>(null);
  const [eraserTargetLayer, setEraserTargetLayer] = useState<ImageLayer | null>(null);

  // History for Undo / Redo
  const historyRef = useRef<HistorySnapshot[]>([
    {
      layers: initialTemplate.layers,
      background: initialTemplate.background,
      width: initialTemplate.preset.width,
      height: initialTemplate.preset.height,
      preset: initialTemplate.preset.id,
    },
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const isHistoryActionRef = useRef<boolean>(false);

  // Record history snapshot helper
  const pushHistorySnapshot = useCallback(
    (newLayers: Layer[], newBg: CanvasBackground, newW: number, newH: number, newPreset: string) => {
      if (isHistoryActionRef.current) return;

      const newSnapshot: HistorySnapshot = {
        layers: JSON.parse(JSON.stringify(newLayers)),
        background: JSON.parse(JSON.stringify(newBg)),
        width: newW,
        height: newH,
        preset: newPreset,
      };

      const updatedHistory = historyRef.current.slice(0, historyIndex + 1);
      updatedHistory.push(newSnapshot);
      // Limit to 30 snapshots to keep memory fast
      if (updatedHistory.length > 30) {
        updatedHistory.shift();
      }
      historyRef.current = updatedHistory;
      setHistoryIndex(updatedHistory.length - 1);
    },
    [historyIndex]
  );

  // Undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      isHistoryActionRef.current = true;
      const prevIndex = historyIndex - 1;
      const snapshot = historyRef.current[prevIndex];
      setLayers(JSON.parse(JSON.stringify(snapshot.layers)));
      setBackground(JSON.parse(JSON.stringify(snapshot.background)));
      setWidth(snapshot.width);
      setHeight(snapshot.height);
      setPreset(snapshot.preset);
      setHistoryIndex(prevIndex);
      setTimeout(() => {
        isHistoryActionRef.current = false;
      }, 50);
    }
  };

  // Redo
  const handleRedo = () => {
    if (historyIndex < historyRef.current.length - 1) {
      isHistoryActionRef.current = true;
      const nextIndex = historyIndex + 1;
      const snapshot = historyRef.current[nextIndex];
      setLayers(JSON.parse(JSON.stringify(snapshot.layers)));
      setBackground(JSON.parse(JSON.stringify(snapshot.background)));
      setWidth(snapshot.width);
      setHeight(snapshot.height);
      setPreset(snapshot.preset);
      setHistoryIndex(nextIndex);
      setTimeout(() => {
        isHistoryActionRef.current = false;
      }, 50);
    }
  };

  // Fit Canvas to Screen
  const fitToScreen = useCallback(() => {
    const isMobile = window.innerWidth < 768;
    const padding = isMobile ? 32 : 80;
    const availableWidth = window.innerWidth - (isMobile ? 0 : 384) - padding;
    const availableHeight = window.innerHeight - 140 - padding;

    if (availableWidth > 0 && availableHeight > 0) {
      const scaleX = availableWidth / width;
      const scaleY = availableHeight / height;
      const optimalZoom = Math.min(scaleX, scaleY, 1.2);
      setZoom(Math.max(0.15, Number(optimalZoom.toFixed(2))));
      setPanOffset({ x: 0, y: 0 });
    }
  }, [width, height]);

  useEffect(() => {
    fitToScreen();
    const handleResize = () => fitToScreen();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fitToScreen]);

  // Layer Management Handlers
  const handleSelectLayer = (id: string | null) => {
    setSelectedLayerId(id);
    if (id && window.innerWidth < 1024 && !activeTab) {
      setActiveTab('style');
    }
  };

  const handleUpdateLayer = (id: string, updates: Partial<Layer>) => {
    setLayers((prev) => {
      const updated = prev.map((l) => (l.id === id ? ({ ...l, ...updates } as Layer) : l));
      pushHistorySnapshot(updated, background, width, height, preset);
      return updated;
    });
  };

  const handleDuplicateLayer = (id: string) => {
    const target = layers.find((l) => l.id === id);
    if (!target) return;

    const duplicate: Layer = {
      ...JSON.parse(JSON.stringify(target)),
      id: `layer-${Date.now()}`,
      name: `${target.name} (Copy)`,
      x: target.x + 30,
      y: target.y + 30,
    };

    const newLayers = [...layers, duplicate];
    setLayers(newLayers);
    setSelectedLayerId(duplicate.id);
    pushHistorySnapshot(newLayers, background, width, height, preset);
  };

  const handleDeleteLayer = (id: string) => {
    const newLayers = layers.filter((l) => l.id !== id);
    setLayers(newLayers);
    if (selectedLayerId === id) {
      setSelectedLayerId(newLayers[newLayers.length - 1]?.id || null);
    }
    pushHistorySnapshot(newLayers, background, width, height, preset);
  };

  const handleBringForward = (id: string) => {
    const index = layers.findIndex((l) => l.id === id);
    if (index < 0 || index >= layers.length - 1) return;
    const newLayers = [...layers];
    const temp = newLayers[index];
    newLayers[index] = newLayers[index + 1];
    newLayers[index + 1] = temp;
    setLayers(newLayers);
    pushHistorySnapshot(newLayers, background, width, height, preset);
  };

  const handleSendBackward = (id: string) => {
    const index = layers.findIndex((l) => l.id === id);
    if (index <= 0) return;
    const newLayers = [...layers];
    const temp = newLayers[index];
    newLayers[index] = newLayers[index - 1];
    newLayers[index - 1] = temp;
    setLayers(newLayers);
    pushHistorySnapshot(newLayers, background, width, height, preset);
  };

  const handleMoveLayer = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || toIndex >= layers.length) return;
    const newLayers = [...layers];
    const [moved] = newLayers.splice(fromIndex, 1);
    newLayers.splice(toIndex, 0, moved);
    setLayers(newLayers);
    pushHistorySnapshot(newLayers, background, width, height, preset);
  };

  // Add Elements
  const handleAddText = (initialText?: string, font?: string) => {
    const isPunjabi = initialText ? /[ਁ-ੵ]/.test(initialText) : false;
    const newText: TextLayer = {
      id: `text-${Date.now()}`,
      type: 'text',
      name: initialText ? initialText.slice(0, 15) : 'Text Layer',
      text: initialText || (isPunjabi ? 'ਪੰਜਾਬੀ ਟੈਕਸਟ' : 'New Text'),
      x: width / 2 - 180,
      y: height / 2 - 40,
      width: 360,
      height: 80,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      fontFamily: font || (isPunjabi ? 'Anek Gurmukhi' : 'Cinzel'),
      fontSize: 56,
      fontWeight: '800',
      fontStyle: 'normal',
      textAlign: 'center',
      letterSpacing: 1,
      lineHeight: 1.2,
      fillType: 'gradient',
      color: '#D4AF37',
      gradientColors: ['#FFF6CA', '#B38728'],
      gradientAngle: 135,
      stroke: {
        enabled: true,
        color: '#000000',
        width: 3,
      },
      shadow: {
        enabled: true,
        color: 'rgba(0,0,0,0.8)',
        blur: 10,
        offsetX: 0,
        offsetY: 4,
      },
    };

    const newLayers = [...layers, newText];
    setLayers(newLayers);
    setSelectedLayerId(newText.id);
    pushHistorySnapshot(newLayers, background, width, height, preset);
    setActiveTab('style');
  };

  const handleAddImage = (dataUrl: string) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = Math.min(width * 0.7, height * 0.7);
      let imgW = img.width;
      let imgH = img.height;

      if (imgW > maxDim || imgH > maxDim) {
        if (imgW > imgH) {
          imgH = (imgH / imgW) * maxDim;
          imgW = maxDim;
        } else {
          imgW = (imgW / imgH) * maxDim;
          imgH = maxDim;
        }
      }

      const newImageLayer: ImageLayer = {
        id: `img-${Date.now()}`,
        type: 'image',
        name: 'Gallery Photo',
        src: dataUrl,
        x: (width - imgW) / 2,
        y: (height - imgH) / 2,
        width: imgW,
        height: imgH,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        filter: {
          brightness: 100,
          contrast: 100,
          saturation: 100,
          blur: 0,
        },
      };

      const newLayers = [...layers, newImageLayer];
      setLayers(newLayers);
      setSelectedLayerId(newImageLayer.id);
      pushHistorySnapshot(newLayers, background, width, height, preset);
      setActiveTab('style');
    };
    img.src = dataUrl;
  };

  const handleAddShape = (shapeType: ShapeType) => {
    const size = Math.min(width, height) * 0.35;
    const newShape: ShapeLayer = {
      id: `shape-${Date.now()}`,
      type: 'shape',
      name: `${shapeType.toUpperCase()} Shape`,
      shapeType,
      x: (width - size) / 2,
      y: (height - size) / 2,
      width: size,
      height: size,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      fillType: 'gradient',
      fillColor: '#D4AF37',
      gradientColors: ['#FFF6CA', '#B38728'],
      gradientAngle: 135,
      stroke: {
        enabled: true,
        color: '#D4AF37',
        width: 3,
      },
    };

    const newLayers = [...layers, newShape];
    setLayers(newLayers);
    setSelectedLayerId(newShape.id);
    pushHistorySnapshot(newLayers, background, width, height, preset);
    setActiveTab('style');
  };

  const handleAddSticker = (sticker: StickerItem) => {
    const size = Math.min(width, height) * 0.28;
    const newSticker: StickerLayer = {
      id: `sticker-${Date.now()}`,
      type: 'sticker',
      name: sticker.name,
      svgPath: sticker.path,
      viewBox: sticker.viewBox,
      x: (width - size) / 2,
      y: (height - size) / 2,
      width: size,
      height: size,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      fillColor: '#D4AF37',
      useGradient: true,
      gradientColors: ['#FFF6CA', '#B38728'],
    };

    const newLayers = [...layers, newSticker];
    setLayers(newLayers);
    setSelectedLayerId(newSticker.id);
    pushHistorySnapshot(newLayers, background, width, height, preset);
    setActiveTab('style');
  };

  // Load Template
  const handleSelectTemplate = (template: Template) => {
    setWidth(template.preset.width);
    setHeight(template.preset.height);
    setPreset(template.preset.id);
    setBackground(template.background);
    setLayers(JSON.parse(JSON.stringify(template.layers)));
    setSelectedLayerId(template.layers[0]?.id || null);
    pushHistorySnapshot(
      template.layers,
      template.background,
      template.preset.width,
      template.preset.height,
      template.preset.id
    );
    setTimeout(() => {
      fitToScreen();
    }, 100);
  };

  // Update Canvas Size / Preset
  const handleUpdateCanvasSize = (newW: number, newH: number, newPreset: string) => {
    setWidth(newW);
    setHeight(newH);
    setPreset(newPreset);
    pushHistorySnapshot(layers, background, newW, newH, newPreset);
    setTimeout(() => {
      fitToScreen();
    }, 100);
  };

  // Update Background
  const handleUpdateBackground = (newBg: CanvasBackground) => {
    setBackground(newBg);
    pushHistorySnapshot(layers, newBg, width, height, preset);
  };

  // Apply Crop
  const handleApplyCrop = (
    layerId: string,
    crop: { x: number; y: number; width: number; height: number }
  ) => {
    handleUpdateLayer(layerId, { crop });
  };

  // Apply Eraser Mask (transparent cutout)
  const handleApplyMask = (layerId: string, newSrc: string) => {
    handleUpdateLayer(layerId, { src: newSrc });
  };

  // Load Saved Project
  const handleLoadProject = (project: SavedProject) => {
    const s = project.state;
    setLayers(s.layers);
    setBackground(s.background);
    setWidth(s.width);
    setHeight(s.height);
    setPreset(s.preset);
    setSelectedLayerId(s.layers[0]?.id || null);
    pushHistorySnapshot(s.layers, s.background, s.width, s.height, s.preset);
    setIsProjectsOpen(false);
    setViewMode('editor');
  };

  // New Blank Project
  const handleNewProject = () => {
    if (window.confirm(t.projectControls.confirmClear)) {
      const blankPreset = CANVAS_PRESETS[0];
      const blankBg: CanvasBackground = {
        type: 'solid',
        color: '#ffffff',
      };
      setLayers([]);
      setBackground(blankBg);
      setWidth(blankPreset.width);
      setHeight(blankPreset.height);
      setPreset(blankPreset.id);
      setSelectedLayerId(null);
      pushHistorySnapshot([], blankBg, blankPreset.width, blankPreset.height, blankPreset.id);
      setIsProjectsOpen(false);
      setViewMode('editor');
    }
  };

  const selectedLayer = layers.find((l) => l.id === selectedLayerId) || null;

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 text-slate-900 overflow-hidden font-sans select-none">
      {/* VIEW MODE: HOME DASHBOARD vs EDITOR */}
      {viewMode === 'home' ? (
        <HomeDashboard
          lang={lang}
          onToggleLang={() => setLang((prev) => (prev === 'en' ? 'pa' : 'en'))}
          onOpenEditor={() => setViewMode('editor')}
          onCreateNewDesign={(w, h, pId) => {
            handleUpdateCanvasSize(w, h, pId);
            setLayers([]);
            setSelectedLayerId(null);
            const blankBg: CanvasBackground = { type: 'solid', color: '#ffffff' };
            setBackground(blankBg);
            pushHistorySnapshot([], blankBg, w, h, pId);
            setViewMode('editor');
          }}
          onSelectTemplate={(tpl) => {
            handleSelectTemplate(tpl);
            setViewMode('editor');
          }}
          onLoadProject={(proj) => {
            handleLoadProject(proj);
            setViewMode('editor');
          }}
        />
      ) : (
        <>
          {/* 1. TOP HEADER (BRAND, CONTROLS, EXPORT) */}
          <header className="h-14 sm:h-16 px-3 sm:px-6 flex items-center justify-between bg-white border-b border-slate-200 z-30 flex-shrink-0 shadow-xs">
            {/* Brand with Crown Logo + Home Link */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div
                onClick={() => setViewMode('home')}
                className="cursor-pointer hover:opacity-90 transition"
                title="Go to Home Dashboard"
              >
                <CrownLogo size="md" variant="light" showSubtitle={false} />
              </div>

              {/* Home Quick Button */}
              <button
                onClick={() => setViewMode('home')}
                title={t.home}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
              >
                <Home className="w-3.5 h-3.5 text-purple-600" />
                <span className="hidden sm:inline">{t.home}</span>
              </button>
            </div>

            {/* Center Canvas Tools: Undo, Redo, Zoom Controls */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Undo */}
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                title={t.undo}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 disabled:opacity-25 disabled:cursor-not-allowed transition"
              >
                <Undo2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>

              {/* Redo */}
              <button
                onClick={handleRedo}
                disabled={historyIndex >= historyRef.current.length - 1}
                title={t.redo}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 disabled:opacity-25 disabled:cursor-not-allowed transition"
              >
                <Redo2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>

              <div className="h-5 w-px bg-slate-200 mx-0.5 sm:mx-1 hidden sm:block" />

              {/* Fit to screen button */}
              <button
                onClick={fitToScreen}
                title={t.fitScreen}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition"
              >
                <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
                <span>{t.fitScreen}</span>
              </button>

              {/* Background Color Button */}
              <button
                onClick={() => setIsCanvasSettingsOpen(true)}
                title={t.bgSettings || 'Background Color'}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition"
              >
                <Palette className="w-3.5 h-3.5 text-purple-600" />
                <span className="hidden md:inline">{t.bgSettings || 'Background'}</span>
              </button>

              {/* Zoom % */}
              <span className="hidden md:inline-block text-[11px] font-mono text-slate-600 px-1.5 font-bold">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Right Action Bar: Projects, Language Toggle & Export HD */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              {/* Saved Projects Button */}
              <button
                onClick={() => setIsProjectsOpen(true)}
                title={t.projects || 'Projects & Save'}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition"
              >
                <FolderOpen className="w-3.5 h-3.5 text-purple-600" />
                <span className="hidden sm:inline">{t.projects || 'Projects'}</span>
              </button>

              {/* Language Toggle (EN | ਪੰਜਾਬੀ) */}
              <button
                onClick={() => setLang((prev) => (prev === 'en' ? 'pa' : 'en'))}
                className="flex items-center px-2.5 sm:px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-[11px] font-bold text-slate-800 hover:border-slate-400 transition"
              >
                <span className={lang === 'en' ? 'text-purple-700 font-black' : 'text-slate-400'}>
                  EN
                </span>
                <span className="mx-1 text-slate-300">|</span>
                <span className={lang === 'pa' ? 'text-purple-700 font-black' : 'text-slate-400'}>
                  ਪੰਜਾਬੀ
                </span>
              </button>

              {/* HD Export Button */}
              <button
                onClick={() => setIsExportOpen(true)}
                className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-95 text-white font-extrabold text-xs sm:text-sm shadow-md active:scale-95 transition"
              >
                <Download className="w-4 h-4 text-white stroke-[2.5]" />
                <span className="tracking-wide">{t.exportHD}</span>
              </button>
            </div>
          </header>

          {/* 2. MAIN WORKSPACE (CANVAS + SIDE DESKTOP PANELS) */}
          <div className="flex-1 relative flex overflow-hidden">
            {/* Canvas Viewport Center */}
            <main className="flex-1 relative h-full flex flex-col overflow-hidden bg-[#eef1f6]">
              {/* Canvas Component */}
              <CanvasRenderer
                width={width}
                height={height}
                background={background}
                layers={layers}
                selectedLayerId={selectedLayerId}
                onSelectLayer={handleSelectLayer}
                onUpdateLayer={handleUpdateLayer}
                zoom={zoom}
                panOffset={panOffset}
                onPanChange={setPanOffset}
              />

              {/* Floating On-Canvas Quick Controls (Fit, Zoom In, Zoom Out, Background) */}
              <div className="absolute bottom-16 sm:bottom-4 left-4 z-20 flex items-center gap-1 p-1 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-md">
                <button
                  onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.1).toFixed(2)))}
                  title="Zoom In"
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-700"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoom((z) => Math.max(0.15, +(z - 0.1).toFixed(2)))}
                  title="Zoom Out"
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-700"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={fitToScreen}
                  title={t.fitScreen}
                  className="px-2.5 py-1 rounded-xl hover:bg-slate-100 text-[11px] font-bold text-slate-800"
                >
                  {t.fitScreen}
                </button>
                <div className="h-4 w-px bg-slate-200 mx-0.5" />
                <button
                  onClick={() => setIsCanvasSettingsOpen(true)}
                  title={t.bgSettings || 'Background'}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-700"
                >
                  <Palette className="w-4 h-4 text-purple-600" />
                </button>
              </div>

              {/* Preset Pill Top Left - Clickable to open Canvas & Background Settings */}
              <button
                onClick={() => setIsCanvasSettingsOpen(true)}
                title="Canvas & Background Settings"
                className="absolute top-3 left-4 z-20 hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 text-xs font-bold text-slate-800 shadow-xs hover:border-purple-300 hover:shadow-sm transition cursor-pointer"
              >
                <Palette className="w-3.5 h-3.5 text-purple-600" />
                <span>
                  {CANVAS_PRESETS.find((p) => p.id === preset)?.name || `${width}×${height}`}
                </span>
                <span className="text-purple-600 font-mono">
                  ({width} × {height})
                </span>
              </button>
            </main>

            {/* Desktop Side Panel (Visible on lg screens: 1024px+) */}
            <aside className="hidden lg:flex flex-col w-96 h-full border-l border-slate-200 bg-white flex-shrink-0">
              {/* Top Panel Tab Switcher */}
              <div className="flex border-b border-slate-200 bg-slate-50">
                {[
                  { id: 'style', label: t.style, icon: Sliders },
                  { id: 'layers', label: t.layers, icon: Layers },
                  { id: 'add', label: t.add, icon: PlusCircle },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isSelected = activeTab === tab.id || (!activeTab && tab.id === 'style');

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as Tab)}
                      className={`flex-1 py-3 flex items-center justify-center gap-1.5 text-xs font-black transition border-b-2 ${
                        isSelected
                          ? 'border-purple-600 text-purple-700 bg-purple-50/50'
                          : 'border-transparent text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-purple-600" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Panel Content Body */}
              <div className="flex-1 overflow-hidden">
                {(!activeTab || activeTab === 'style') && (
                  <StylePanel
                    layer={selectedLayer}
                    lang={lang}
                    onUpdateLayer={handleUpdateLayer}
                    onDuplicateLayer={handleDuplicateLayer}
                    onDeleteLayer={handleDeleteLayer}
                    onBringForward={handleBringForward}
                    onSendBackward={handleSendBackward}
                    onOpenCrop={(l) => setCropTargetLayer(l)}
                    onOpenEraser={(l) => setEraserTargetLayer(l)}
                  />
                )}

                {activeTab === 'layers' && (
                  <LayersPanel
                    layers={layers}
                    selectedLayerId={selectedLayerId}
                    lang={lang}
                    onSelectLayer={handleSelectLayer}
                    onUpdateLayer={handleUpdateLayer}
                    onDuplicateLayer={handleDuplicateLayer}
                    onDeleteLayer={handleDeleteLayer}
                    onMoveLayer={handleMoveLayer}
                  />
                )}

                {activeTab === 'add' && (
                  <AddPanel
                    lang={lang}
                    onAddText={handleAddText}
                    onAddImage={handleAddImage}
                    onAddShape={handleAddShape}
                    onAddSticker={handleAddSticker}
                  />
                )}
              </div>
            </aside>
          </div>

          {/* 3. MOBILE BOTTOM SHEET DRAWER (Sliding up when a tab is tapped on phone) */}
          <div
            className={`lg:hidden fixed inset-x-0 bottom-16 z-40 bg-white border-t border-slate-200 rounded-t-3xl shadow-2xl max-h-[75vh] flex flex-col transition-transform duration-300 ease-out ${
              activeTab ? 'translate-y-0' : 'translate-y-full pointer-events-none'
            }`}
          >
            {/* Drawer Header with Close */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50/90 rounded-t-3xl">
              <div className="flex items-center gap-2">
                <span className="w-8 h-1 rounded-full bg-slate-300 mx-auto" />
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  {activeTab === 'style' && t.style}
                  {activeTab === 'layers' && t.layers}
                  {activeTab === 'add' && t.add}
                </span>
              </div>

              <button
                onClick={() => setActiveTab(null)}
                className="p-1 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Scrollable Body */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'style' && (
                <StylePanel
                  layer={selectedLayer}
                  lang={lang}
                  onUpdateLayer={handleUpdateLayer}
                  onDuplicateLayer={handleDuplicateLayer}
                  onDeleteLayer={handleDeleteLayer}
                  onBringForward={handleBringForward}
                  onSendBackward={handleSendBackward}
                  onOpenCrop={(l) => setCropTargetLayer(l)}
                  onOpenEraser={(l) => setEraserTargetLayer(l)}
                  onClose={() => setActiveTab(null)}
                />
              )}

              {activeTab === 'layers' && (
                <LayersPanel
                  layers={layers}
                  selectedLayerId={selectedLayerId}
                  lang={lang}
                  onSelectLayer={(id) => {
                    handleSelectLayer(id);
                    setActiveTab('style');
                  }}
                  onUpdateLayer={handleUpdateLayer}
                  onDuplicateLayer={handleDuplicateLayer}
                  onDeleteLayer={handleDeleteLayer}
                  onMoveLayer={handleMoveLayer}
                />
              )}

              {activeTab === 'add' && (
                <AddPanel
                  lang={lang}
                  onAddText={handleAddText}
                  onAddImage={handleAddImage}
                  onAddShape={handleAddShape}
                  onAddSticker={handleAddSticker}
                  onClose={() => setActiveTab(null)}
                />
              )}
            </div>
          </div>
        </>
      )}

      {/* 4. MOBILE-FRIENDLY BOTTOM NAVIGATION BAR: Home, Templates, Add, Layers, Text */}
      <nav className="h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 flex items-center justify-around px-2 flex-shrink-0 shadow-sm">
        {/* 1. Home */}
        <button
          onClick={() => {
            setViewMode(viewMode === 'home' ? 'editor' : 'home');
            setActiveTab(null);
          }}
          className={`flex flex-col items-center justify-center p-1 transition active:scale-95 ${
            viewMode === 'home' ? 'text-purple-600 font-black' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Home className="w-5 h-5 text-purple-600" />
          <span className="text-[10px] font-bold mt-0.5">{t.home}</span>
        </button>

        {/* 2. Templates */}
        <button
          onClick={() => {
            setIsTemplatesOpen(true);
            setActiveTab(null);
          }}
          className="flex flex-col items-center justify-center p-1 text-slate-600 hover:text-slate-900 active:scale-95 transition"
        >
          <LayoutTemplate className="w-5 h-5 text-purple-600" />
          <span className="text-[10px] font-bold mt-0.5">{t.templates}</span>
        </button>

        {/* 3. Add */}
        <button
          onClick={() => {
            setViewMode('editor');
            setActiveTab(activeTab === 'add' ? null : 'add');
          }}
          className={`flex flex-col items-center justify-center p-1 transition active:scale-95 ${
            viewMode === 'editor' && activeTab === 'add'
              ? 'text-purple-600 font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <PlusCircle className="w-5 h-5 text-purple-600" />
          <span className="text-[10px] font-bold mt-0.5">{t.add}</span>
        </button>

        {/* 4. Layers */}
        <button
          onClick={() => {
            setViewMode('editor');
            setActiveTab(activeTab === 'layers' ? null : 'layers');
          }}
          className={`relative flex flex-col items-center justify-center p-1 transition active:scale-95 ${
            viewMode === 'editor' && activeTab === 'layers'
              ? 'text-purple-600 font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-5 h-5 text-purple-600" />
          <span className="text-[10px] font-bold mt-0.5">{t.layers}</span>
          {layers.length > 0 && (
            <span className="absolute top-0 right-1 w-4 h-4 rounded-full bg-purple-600 text-white text-[9px] font-black flex items-center justify-center shadow-xs">
              {layers.length}
            </span>
          )}
        </button>

        {/* 5. Text */}
        <button
          onClick={() => {
            setViewMode('editor');
            const textL = layers.find((l) => l.type === 'text');
            if (textL) {
              setSelectedLayerId(textL.id);
            } else {
              handleAddText('ਪੰਜਾਬੀ ਟੈਕਸਟ', 'Anek Gurmukhi');
            }
            setActiveTab('style');
          }}
          className={`flex flex-col items-center justify-center p-1 transition active:scale-95 ${
            viewMode === 'editor' && activeTab === 'style' && selectedLayer?.type === 'text'
              ? 'text-purple-600 font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Type className="w-5 h-5 text-purple-600" />
          <span className="text-[10px] font-bold mt-0.5">{t.text || 'Text'}</span>
        </button>
      </nav>

      {/* 5. MODALS */}
      {/* Templates Modal */}
      <TemplatesModal
        isOpen={isTemplatesOpen}
        lang={lang}
        onSelectTemplate={(tpl) => {
          handleSelectTemplate(tpl);
          setViewMode('editor');
        }}
        onClose={() => setIsTemplatesOpen(false)}
      />

      {/* Canvas / Background Settings Modal */}
      <CanvasSettingsModal
        isOpen={isCanvasSettingsOpen}
        lang={lang}
        currentWidth={width}
        currentHeight={height}
        background={background}
        onUpdateCanvasSize={handleUpdateCanvasSize}
        onUpdateBackground={handleUpdateBackground}
        onClose={() => setIsCanvasSettingsOpen(false)}
      />

      {/* HD Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        state={{
          layers,
          selectedLayerId,
          background,
          width,
          height,
          preset,
        }}
        lang={lang}
        onClose={() => setIsExportOpen(false)}
      />

      {/* Image Crop Modal */}
      <CropModal
        layer={cropTargetLayer}
        lang={lang}
        onApplyCrop={handleApplyCrop}
        onClose={() => setCropTargetLayer(null)}
      />

      {/* Manual Background Cutout / Eraser Modal */}
      <EraserModal
        layer={eraserTargetLayer}
        lang={lang}
        onApplyMask={handleApplyMask}
        onClose={() => setEraserTargetLayer(null)}
      />

      {/* Projects (Save / Load / Manage Local Designs) */}
      <ProjectsModal
        isOpen={isProjectsOpen}
        currentState={{
          layers,
          selectedLayerId,
          background,
          width,
          height,
          preset,
        }}
        lang={lang}
        onLoadProject={(proj) => {
          handleLoadProject(proj);
          setViewMode('editor');
        }}
        onNewProject={handleNewProject}
        onClose={() => setIsProjectsOpen(false)}
      />
    </div>
  );
}
