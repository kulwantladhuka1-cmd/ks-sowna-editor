import React, { useState, useEffect } from 'react';
import { CrownLogo } from './CrownLogo';
import { TEMPLATES, CANVAS_PRESETS } from '../data/templates';
import { Template, SavedProject } from '../types/editor';
import { Language, translations } from '../utils/i18n';
import {
  Sparkles,
  LayoutTemplate,
  PlusCircle,
  FolderOpen,
  ArrowRight,
  Palette,
  Image as ImageIcon,
  Flame,
  Layers,
  Crown,
  Type,
  Youtube,
  Instagram,
  Smartphone,
  Sliders,
  Trash2,
  Clock,
  Check,
} from 'lucide-react';

interface HomeDashboardProps {
  lang: Language;
  onToggleLang: () => void;
  onOpenEditor: () => void;
  onCreateNewDesign: (width: number, height: number, presetId: string) => void;
  onSelectTemplate: (template: Template) => void;
  onLoadProject: (project: SavedProject) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  lang,
  onToggleLang,
  onOpenEditor,
  onCreateNewDesign,
  onSelectTemplate,
  onLoadProject,
}) => {
  const t = translations[lang];
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [customWidth, setCustomWidth] = useState<number>(1080);
  const [customHeight, setCustomHeight] = useState<number>(1080);
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);

  // Load saved projects from localStorage
  const loadProjects = () => {
    try {
      const data = localStorage.getItem('ks_sowna_saved_projects_v1');
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          setSavedProjects(parsed);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(lang === 'pa' ? 'ਕੀ ਤੁਸੀਂ ਇਹ ਡਿਜ਼ਾਈਨ ਹਟਾਉਣਾ ਚਾਹੁੰਦੇ ਹੋ?' : 'Delete this saved design?')) {
      const updated = savedProjects.filter((p) => p.id !== id);
      setSavedProjects(updated);
      localStorage.setItem('kssowna_saved_projects_v1', JSON.stringify(updated));
    }
  };

  const categories = [
    { id: 'all', label: lang === 'pa' ? 'ਸਾਰੇ' : 'All Templates', icon: LayoutTemplate },
    { id: 'royal', label: lang === 'pa' ? 'ਰਾਹੀ ਲੋਗੋ' : 'Royal & Logos', icon: Crown },
    { id: 'punjabi', label: lang === 'pa' ? 'ਪੰਜਾਬੀ ਨੇਮ ਆਰਟ' : 'Punjabi Name Art', icon: Type },
    { id: 'social', label: lang === 'pa' ? 'ਸੋਸ਼ਲ ਮੀਡੀਆ' : 'Social & Posters', icon: Sparkles },
    { id: 'youtube', label: 'YouTube Thumbnails', icon: Youtube },
  ];

  const filteredTemplates =
    selectedCategory === 'all'
      ? TEMPLATES
      : TEMPLATES.filter((tpl) => {
          if (selectedCategory === 'royal') return tpl.category === 'logo';
          if (selectedCategory === 'punjabi') return tpl.category === 'punjabi' || tpl.title.includes('ਪੰਜਾਬੀ') || tpl.titlePa?.includes('ਪੰਜਾਬੀ');
          if (selectedCategory === 'social') return tpl.category === 'instagram' || tpl.category === 'reels';
          if (selectedCategory === 'youtube') return tpl.category === 'youtube' || tpl.preset.id === 'youtube-thumbnail';
          return true;
        });

  return (
    <div className="flex-1 w-full bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/20 text-slate-900 overflow-y-auto font-sans">
      {/* 1. TOP HEADER */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-sm">
        <CrownLogo size="md" variant="light" />

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Toggle */}
          <button
            onClick={onToggleLang}
            className="flex items-center px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300/80 text-xs font-bold text-slate-800 transition"
          >
            <span className={lang === 'en' ? 'text-purple-700 font-extrabold' : 'text-slate-500'}>
              EN
            </span>
            <span className="mx-1 text-slate-300">|</span>
            <span className={lang === 'pa' ? 'text-purple-700 font-extrabold' : 'text-slate-500'}>
              ਪੰਜਾਬੀ
            </span>
          </button>

          {/* Primary Action: Open Editor */}
          <button
            onClick={onOpenEditor}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white font-extrabold text-xs sm:text-sm shadow-md hover:shadow-lg active:scale-95 transition"
          >
            <span>{lang === 'pa' ? 'ਐਡੀਟਰ ਖੋਲ੍ਹੋ' : 'Open Editor'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-10 space-y-8 sm:space-y-12">
        {/* 2. HERO BANNER */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-700 via-indigo-600 to-pink-600 text-white p-6 sm:p-10 shadow-xl">
          {/* Background Decorative Rings */}
          <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute right-1/4 -bottom-12 w-80 h-80 rounded-full bg-pink-400/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-amber-200">
              <Crown className="w-4 h-4 text-amber-300" />
              <span>{lang === 'pa' ? 'ਪ੍ਰੋਫੈਸ਼ਨਲ ਫੋਟੋ ਤੇ ਲੋਗੋ ਮੇਕਰ' : 'Professional Photo & Logo Editor'}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight font-['Cinzel',serif]">
              KS SOWNA Editor
            </h1>

            <p className="text-sm sm:text-base text-purple-100 font-medium">
              {lang === 'pa'
                ? 'ਪੰਜਾਬੀ ਗੁਰਮੁਖੀ ਅੱਖਰਕਾਰੀ, 3D ਟੈਕਸਟ, ਰਾਇਲ ਲੋਗੋ, ਫੋਟੋ ਐਡੀਟਿੰਗ ਅਤੇ HD ਐਕਸਪੋਰਟ।'
                : 'Create stunning Punjabi name art, royal crown logos, YouTube thumbnails, Instagram reels, and custom graphics in minutes.'}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={onOpenEditor}
                className="px-5 py-2.5 rounded-xl bg-white text-slate-900 font-extrabold text-sm shadow-md hover:bg-slate-50 active:scale-95 transition flex items-center gap-2"
              >
                <Palette className="w-4 h-4 text-purple-600" />
                <span>{lang === 'pa' ? 'ਡਿਜ਼ਾਈਨਿੰਗ ਸ਼ੁਰੂ ਕਰੋ' : 'Start Designing'}</span>
              </button>

              <button
                onClick={() => setShowCustomModal(true)}
                className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-sm backdrop-blur-md transition flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{lang === 'pa' ? 'ਕਸਟਮ ਸਾਈਜ਼' : 'Custom Size'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. CREATE NEW DESIGN (PRESET CARDS) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {lang === 'pa' ? 'ਨਵਾਂ ਡਿਜ਼ਾਈਨ ਬਣਾਓ' : 'Create New Design'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                {lang === 'pa' ? 'ਆਪਣੇ ਮਨਪਸੰਦ ਸਾਈਜ਼ ਦੀ ਚੋਣ ਕਰੋ' : 'Choose a canvas preset or create a custom canvas'}
              </p>
            </div>
            <button
              onClick={() => setShowCustomModal(true)}
              className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{lang === 'pa' ? 'ਕਸਟਮ ਮਾਪ' : 'Custom Dimensions'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* YouTube Thumbnail */}
            <button
              onClick={() => onCreateNewDesign(1280, 720, 'youtube-thumbnail')}
              className="group p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-purple-400 hover:shadow-md transition text-left flex flex-col justify-between"
            >
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <Youtube className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">YouTube</h3>
                <p className="text-xs text-slate-500 font-medium">1280 × 720 (16:9)</p>
              </div>
            </button>

            {/* Instagram Post */}
            <button
              onClick={() => onCreateNewDesign(1080, 1080, 'instagram-square')}
              className="group p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-purple-400 hover:shadow-md transition text-left flex flex-col justify-between"
            >
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-600 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <Instagram className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Insta Post</h3>
                <p className="text-xs text-slate-500 font-medium">1080 × 1080 (1:1)</p>
              </div>
            </button>

            {/* Reel / Story */}
            <button
              onClick={() => onCreateNewDesign(1080, 1920, 'reels-story')}
              className="group p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-purple-400 hover:shadow-md transition text-left flex flex-col justify-between"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Reels / Story</h3>
                <p className="text-xs text-slate-500 font-medium">1080 × 1920 (9:16)</p>
              </div>
            </button>

            {/* Punjabi Poster */}
            <button
              onClick={() => onCreateNewDesign(1200, 900, 'punjabi-poster')}
              className="group p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-purple-400 hover:shadow-md transition text-left flex flex-col justify-between"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {lang === 'pa' ? 'ਪੰਜਾਬੀ ਪੋਸਟਰ' : 'Punjabi Poster'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">1200 × 900 (4:3)</p>
              </div>
            </button>

            {/* Instagram Portrait */}
            <button
              onClick={() => onCreateNewDesign(1080, 1350, 'instagram-portrait')}
              className="group p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-purple-400 hover:shadow-md transition text-left flex flex-col justify-between"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Portrait Post</h3>
                <p className="text-xs text-slate-500 font-medium">1080 × 1350 (4:5)</p>
              </div>
            </button>

            {/* Blank Canvas */}
            <button
              onClick={() => onCreateNewDesign(1080, 1080, 'blank-square')}
              className="group p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200/80 hover:border-purple-400 hover:shadow-md transition text-left flex flex-col justify-between"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition shadow-sm">
                <PlusCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-purple-900 text-sm">
                  {lang === 'pa' ? 'ਖਾਲੀ ਕੈਨਵਸ' : 'Blank Canvas'}
                </h3>
                <p className="text-xs text-purple-600 font-medium">
                  {lang === 'pa' ? 'ਨਵਾਂ ਬਣਾਓ' : 'Start Fresh'}
                </p>
              </div>
            </button>
          </div>
        </section>

        {/* 4. RECENT PROJECTS / MY DESIGNS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-purple-600" />
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {lang === 'pa' ? 'ਮੇਰੇ ਡਿਜ਼ਾਈਨ (Recent Projects)' : 'My Designs (Recent Projects)'}
              </h2>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {savedProjects.length} {lang === 'pa' ? 'ਡਿਜ਼ਾਈਨ ਸੇਵ' : 'saved designs'}
            </span>
          </div>

          {savedProjects.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white border border-dashed border-slate-300 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 mx-auto flex items-center justify-center">
                <FolderOpen className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">
                {lang === 'pa' ? 'ਕੋਈ ਸੇਵ ਕੀਤਾ ਡਿਜ਼ਾਈਨ ਨਹੀਂ ਮਿਲਿਆ' : 'No saved designs yet'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                {lang === 'pa'
                  ? 'ਐਡੀਟਰ ਵਿੱਚ ਡਿਜ਼ਾਈਨ ਬਣਾਓ ਅਤੇ ਉੱਪਰ ਦਿੱਤੇ "Projects" ਬਟਨ ਨਾਲ ਸੇਵ ਕਰੋ।'
                  : 'Start creating in the editor and click "Projects & Save" to save your work anytime!'}
              </p>
              <button
                onClick={onOpenEditor}
                className="mt-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition"
              >
                <span>{lang === 'pa' ? 'ਐਡੀਟਰ ਖੋਲ੍ਹੋ' : 'Open Editor Now'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {savedProjects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onLoadProject(p)}
                  className="group cursor-pointer rounded-2xl bg-white border border-slate-200 hover:border-purple-400 hover:shadow-lg transition overflow-hidden flex flex-col"
                >
                  {/* Thumbnail */}
                  <div className="h-36 bg-slate-100 relative flex items-center justify-center overflow-hidden border-b border-slate-100">
                    {p.thumbnail ? (
                      <img
                        src={p.thumbnail}
                        alt={p.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-slate-400">
                        <ImageIcon className="w-8 h-8" />
                        <span className="text-[11px] font-medium">
                          {(p.state?.width ?? 1080)} × {(p.state?.height ?? 1080)}
                        </span>
                      </div>
                    )}
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-bold text-white">
                      {(p.state?.layers?.length ?? 0)} layers
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-3.5 flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{p.name}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {(p.state?.width ?? 1080)} × {(p.state?.height ?? 1080)} • {new Date(p.updatedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <button
                      onClick={(e) => handleDeleteProject(p.id, e)}
                      title="Delete design"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 5. READY-MADE TEMPLATES */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {lang === 'pa' ? 'ਰੈਡੀ-ਮੇਡ ਟੈਂਪਲੇਟਸ (Templates)' : 'Ready-Made Templates'}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                {lang === 'pa'
                  ? 'ਰਾਹੀ ਲੋਗੋ, ਪੰਜਾਬੀ ਨੇਮ ਆਰਟ, ਯੂਟਿਊਬ ਥੰਬਨੇਲ ਅਤੇ ਪੋਸਟਰ'
                  : 'Professional Punjabi name art, royal logos, badges and thumbnails'}
              </p>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => {
                const Icon = c.icon;
                const active = selectedCategory === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      active
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredTemplates.map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => onSelectTemplate(tpl)}
                className="group cursor-pointer rounded-2xl bg-white border border-slate-200 hover:border-purple-400 hover:shadow-xl transition overflow-hidden flex flex-col"
              >
                {/* Template Mock Preview Box */}
                <div
                  className="h-44 relative flex items-center justify-center p-3 overflow-hidden"
                  style={{
                    background:
                      tpl.background.type === 'solid'
                        ? tpl.background.color
                        : tpl.background.type === 'gradient' && tpl.background.gradient
                        ? `linear-gradient(${tpl.background.gradient.angle}deg, ${tpl.background.gradient.colors[0]}, ${tpl.background.gradient.colors[1]})`
                        : '#0f0f15',
                  }}
                >
                  {/* Subtle Canvas Border */}
                  <div className="absolute inset-2 border border-white/10 rounded-xl pointer-events-none" />

                  {/* Preview Text Snippet */}
                  <div className="text-center z-10 px-2 space-y-1">
                    {tpl.layers
                      .filter((l) => l.type === 'text')
                      .slice(0, 2)
                      .map((l: any, i) => (
                        <p
                          key={i}
                          className="font-bold tracking-tight truncate max-w-[200px]"
                          style={{
                            color: l.color || '#fff',
                            fontSize: i === 0 ? '16px' : '11px',
                            fontFamily: l.fontFamily || 'sans-serif',
                            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                          }}
                        >
                          {l.text}
                        </p>
                      ))}
                    {tpl.layers.some((l) => l.type === 'sticker' && l.name.includes('Crown')) && (
                      <div className="text-center">
                        <Crown className="w-7 h-7 text-amber-300 mx-auto drop-shadow-[0_2px_6px_rgba(212,175,55,0.8)]" />
                      </div>
                    )}
                  </div>

                  {/* Badge pill */}
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[10px] font-bold text-amber-300">
                    {tpl.preset.name}
                  </div>
                </div>

                {/* Template Footer */}
                <div className="p-3.5 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <h4 className="font-bold text-slate-900 text-sm truncate">
                      {lang === 'pa' ? tpl.titlePa : tpl.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {tpl.preset.width} × {tpl.preset.height} ({tpl.preset.aspectRatio})
                    </p>
                  </div>

                  <button className="px-3 py-1.5 rounded-xl bg-purple-50 group-hover:bg-purple-600 text-purple-700 group-hover:text-white font-bold text-xs transition">
                    {lang === 'pa' ? 'ਵਰਤੋਂ' : 'Use'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* CUSTOM SIZE MODAL */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              {lang === 'pa' ? 'ਕਸਟਮ ਕੈਨਵਸ ਸਾਈਜ਼' : 'Custom Canvas Dimensions'}
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'pa' ? 'ਚੌੜਾਈ ਅਤੇ ਲੰਬਾਈ (pixels) ਦਰਜ ਕਰੋ:' : 'Enter custom width and height in pixels:'}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  {lang === 'pa' ? 'ਚੌੜਾਈ (Width)' : 'Width (px)'}
                </label>
                <input
                  type="number"
                  min="200"
                  max="4000"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(parseInt(e.target.value) || 1080)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  {lang === 'pa' ? 'ਲੰਬਾਈ (Height)' : 'Height (px)'}
                </label>
                <input
                  type="number"
                  min="200"
                  max="4000"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(parseInt(e.target.value) || 1080)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowCustomModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
              >
                {lang === 'pa' ? 'ਰੱਦ ਕਰੋ' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  onCreateNewDesign(customWidth, customHeight, 'custom');
                  setShowCustomModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition"
              >
                {lang === 'pa' ? 'ਕੈਨਵਸ ਬਣਾਓ' : 'Create Canvas'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
