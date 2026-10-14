import React, { useState, useEffect } from 'react';
import { SavedProject, EditorState } from '../types/editor';
import { translations, Language } from '../utils/i18n';
import {
  X,
  FolderOpen,
  Save,
  Trash2,
  Copy,
  Edit2,
  Check,
  PlusCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

const STORAGE_KEY = 'ks_sowna_saved_projects_v1';

export function getLocalProjects(): SavedProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveLocalProjects(projects: SavedProject[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

interface ProjectsModalProps {
  isOpen: boolean;
  currentState: EditorState;
  lang: Language;
  onLoadProject: (project: SavedProject) => void;
  onNewProject: () => void;
  onClose: () => void;
}

export const ProjectsModal: React.FC<ProjectsModalProps> = ({
  isOpen,
  currentState,
  lang,
  onLoadProject,
  onNewProject,
  onClose,
}) => {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [newProjectName, setNewProjectName] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const t = translations[lang];

  useEffect(() => {
    if (isOpen) {
      setProjects(getLocalProjects());
      setNewProjectName(`Design ${new Date().toLocaleDateString()}`);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveCurrent = () => {
    const id = `proj-${Date.now()}`;
    const newProject: SavedProject = {
      id,
      name: newProjectName.trim() || 'Untitled Design',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      state: JSON.parse(JSON.stringify(currentState)),
    };

    const updated = [newProject, ...projects];
    saveLocalProjects(updated);
    setProjects(updated);
    showToast(t.projectControls.savedSuccess);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t.projectControls.confirmDelete)) {
      const updated = projects.filter((p) => p.id !== id);
      saveLocalProjects(updated);
      setProjects(updated);
    }
  };

  const handleDuplicate = (project: SavedProject) => {
    const dup: SavedProject = {
      ...project,
      id: `proj-${Date.now()}`,
      name: `${project.name} (Copy)`,
      updatedAt: new Date().toISOString(),
      state: JSON.parse(JSON.stringify(project.state)),
    };
    const updated = [dup, ...projects];
    saveLocalProjects(updated);
    setProjects(updated);
  };

  const handleStartRename = (project: SavedProject) => {
    setEditingId(project.id);
    setEditingName(project.name);
  };

  const handleSaveRename = (id: string) => {
    const updated = projects.map((p) =>
      p.id === id ? { ...p, name: editingName.trim() || p.name, updatedAt: new Date().toISOString() } : p
    );
    saveLocalProjects(updated);
    setProjects(updated);
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/50 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-700 shadow-xs">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                {t.projects}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Local saved designs ({projects.length})
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

        {/* Save Current Design Banner */}
        <div className="p-4 bg-gradient-to-r from-purple-50 via-pink-50 to-amber-50 border-b border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <Save className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-black text-slate-900">
              {t.projectControls.saveProject}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Design Name..."
              className="flex-1 px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleSaveCurrent}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-md transition active:scale-95"
            >
              Save Now
            </button>
          </div>
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="mx-4 mt-2 p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2 shadow-xs animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-600" />
            <span className="font-bold">{toastMessage}</span>
          </div>
        )}

        {/* List of Saved Projects */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1 pb-6">
          {projects.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FolderOpen className="w-12 h-12 mx-auto mb-2 text-purple-300" />
              <p className="text-sm font-bold text-slate-700">No saved designs yet.</p>
              <p className="text-xs mt-1 text-slate-500 font-medium">
                Click "Save Now" above to save your current work!
              </p>
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-purple-400 hover:shadow-md transition group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 flex-shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    {editingId === project.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="px-2 py-0.5 text-xs bg-white border border-purple-500 rounded-lg text-slate-900 font-bold"
                        />
                        <button
                          onClick={() => handleSaveRename(project.id)}
                          className="p-1 rounded-lg bg-purple-600 text-white"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-slate-900 truncate group-hover:text-purple-700">
                        {project.name}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                      <Clock className="w-3 h-3" />
                      {new Date(project.updatedAt).toLocaleDateString()} • {project.state.width}×{project.state.height} ({project.state.layers.length} layers)
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  <button
                    onClick={() => {
                      onLoadProject(project);
                      onClose();
                    }}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl bg-purple-50 hover:bg-purple-600 hover:text-white text-purple-700 transition"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => handleStartRename(project)}
                    title="Rename"
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(project)}
                    title="Duplicate"
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-purple-600 transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    title="Delete"
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={() => {
              if (window.confirm(t.projectControls.confirmClear)) {
                onNewProject();
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 hover:bg-slate-100 transition"
          >
            <PlusCircle className="w-4 h-4 text-purple-600" />
            <span>{t.projectControls.newProject}</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 text-slate-800 text-xs font-bold hover:bg-slate-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
