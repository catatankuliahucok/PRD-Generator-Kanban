import React, { useState } from "react";
import { AppState, QuestionnaireAnswers, MindmapData, VibeTask } from "./types";
import Wizard from "./components/Wizard";
import MindmapEditor from "./components/MindmapEditor";
import PrdViewer from "./components/PrdViewer";
import TaskBreakdown from "./components/TaskBreakdown";
import { 
  Sparkles, Layers, FileText, CheckSquare, Compass, AlertCircle, 
  HelpCircle, RefreshCw, Github, Settings
} from "lucide-react";

export default function App() {
  const [state, setState] = useState<AppState>({
    step: "wizard",
    answers: {
      appName: "",
      appConcept: "",
      targetUsers: [],
      platform: "",
      coreModules: [],
      monetization: "",
      visualStyle: "",
      customComments: "",
    },
    mindmap: null,
    prdMarkdown: null,
    tasks: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Wizard complete -> Generate Mindmap
  const handleWizardComplete = async (answers: QuestionnaireAnswers) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/generate-mindmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const data: MindmapData = await response.json();
      
      setState((prev) => ({
        ...prev,
        answers,
        mindmap: data,
        step: "mindmap",
      }));
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Gagal menghubungkan dengan AI untuk membuat rancangan awal. Silakan periksa koneksi internet Anda atau coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Save current mindmap draft local state
  const handleSaveMindmap = (mindmap: MindmapData) => {
    setState((prev) => ({
      ...prev,
      mindmap,
    }));
  };

  // 3. Mindmap complete -> Generate PRD
  const handleGeneratePRD = async (mindmap: MindmapData) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/generate-prd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appName: mindmap.appName,
          nodes: mindmap.nodes,
          comments: state.answers.customComments,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const data = await response.json();
      
      setState((prev) => ({
        ...prev,
        mindmap,
        prdMarkdown: data.prd,
        step: "prd",
      }));
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Gagal menyusun dokumen PRD. Server AI mengalami kendala, silakan klik tombol di bawah untuk mencoba kembali.");
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Update PRD Markdown from edit tab
  const handleUpdatePrdMarkdown = (newMarkdown: string) => {
    setState((prev) => ({
      ...prev,
      prdMarkdown: newMarkdown,
    }));
  };

  // 5. PRD complete -> Generate Task Breakdown
  const handleGenerateTasks = async () => {
    if (!state.prdMarkdown) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/generate-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appName: state.mindmap?.appName || state.answers.appName,
          prd: state.prdMarkdown,
          nodes: state.mindmap?.nodes || [],
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const data = await response.json();
      
      // Initialize completed value as false for client tracking
      const enrichedTasks: VibeTask[] = data.tasks.map((t: VibeTask) => ({
        ...t,
        completed: false,
        status: "todo",
      }));

      setState((prev) => ({
        ...prev,
        tasks: enrichedTasks,
        step: "tasks",
      }));
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Gagal mengurai tugas koding. Silakan periksa dokumen PRD Anda atau coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  // 6. Update task status (for Kanban and checklists)
  const handleUpdateTaskStatus = (taskId: string, status: "todo" | "in_progress" | "done" | string) => {
    if (!state.tasks) return;
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks ? prev.tasks.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            status,
            completed: status === "done",
          };
        }
        return t;
      }) : null,
    }));
  };

  // 7. Toggle client-side checklist state
  const handleToggleTask = (taskId: string) => {
    if (!state.tasks) return;
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks ? prev.tasks.map((t) => {
        if (t.id === taskId) {
          const nextCompleted = !t.completed;
          return {
            ...t,
            completed: nextCompleted,
            status: nextCompleted ? "done" : "todo",
          };
        }
        return t;
      }) : null,
    }));
  };

  const handleRestart = () => {
    if (confirm("Apakah Anda yakin ingin membuat blueprint aplikasi baru? Seluruh rancangan saat ini akan disetel ulang.")) {
      setState({
        step: "wizard",
        answers: {
          appName: "",
          appConcept: "",
          targetUsers: [],
          platform: "",
          coreModules: [],
          monetization: "",
          visualStyle: "",
          customComments: "",
        },
        mindmap: null,
        prdMarkdown: null,
        tasks: null,
      });
      setErrorMessage(null);
    }
  };

  const currentAppName = state.mindmap?.appName || state.answers.appName || "Blueprint Studio";

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-[#F8FAFC] flex flex-col md:flex-row font-sans text-slate-900">
      
      {/* 1. Left Sidebar - Desktop only */}
      <nav className="hidden md:flex w-64 bg-[#0F172A] flex-col border-r border-slate-800 shrink-0 select-none">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-sm shadow-blue-500/25">
            B
          </div>
          <span className="text-white font-semibold tracking-tight text-base font-display">Blueprint.ai</span>
        </div>

        <div className="px-4 flex-1 py-4">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Project Workflow</div>
          <ul className="space-y-1">
            <li 
              onClick={() => setState(prev => ({ ...prev, step: "wizard" }))}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer text-xs font-semibold ${
                state.step === "wizard" 
                  ? "bg-blue-600/15 text-blue-400 border-l-2 border-blue-500" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
              }`}
            >
              <Compass className="w-4 h-4 shrink-0" />
              <span>1. AI Wizard</span>
            </li>
            
            <li 
              onClick={() => {
                if (state.mindmap) {
                  setState(prev => ({ ...prev, step: "mindmap" }));
                }
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-xs font-semibold ${
                !state.mindmap ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              } ${
                state.step === "mindmap"
                  ? "bg-blue-600/15 text-blue-400 border-l-2 border-blue-500" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span>2. Feature Mindmap</span>
            </li>

            <li 
              onClick={() => {
                if (state.prdMarkdown) {
                  setState(prev => ({ ...prev, step: "prd" }));
                }
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-xs font-semibold ${
                !state.prdMarkdown ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              } ${
                state.step === "prd"
                  ? "bg-blue-600/15 text-blue-400 border-l-2 border-blue-500" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>3. AI PRD Document</span>
            </li>

            <li 
              onClick={() => {
                if (state.tasks) {
                  setState(prev => ({ ...prev, step: "tasks" }));
                }
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-xs font-semibold ${
                !state.tasks ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              } ${
                state.step === "tasks"
                  ? "bg-blue-600/15 text-blue-400 border-l-2 border-blue-500" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
              }`}
            >
              <CheckSquare className="w-4 h-4 shrink-0" />
              <span>4. Vibe Coding Tasks</span>
            </li>
          </ul>
        </div>

        {/* Sidebar Footer Details */}
        <div className="p-4 border-t border-slate-800/60">
          <div className="bg-slate-800/40 rounded-xl p-3.5 border border-slate-800/40 text-[11px] text-slate-400 space-y-1">
            <p className="font-semibold text-slate-200">Model: Gemini 3.5 Flash</p>
            <p>Session: <span className="text-blue-400">Blueprint v1.2</span></p>
          </div>
        </div>
      </nav>

      {/* 2. Responsive Top Bar for Mobile */}
      <header className="md:hidden bg-[#0F172A] border-b border-slate-800 shrink-0 px-4 py-3 text-white flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">B</div>
          <span className="font-semibold tracking-tight text-sm font-display">Blueprint.ai</span>
        </div>
        
        {/* Horizontal flow indicators for mobile */}
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
          <span className={state.step === "wizard" ? "text-blue-400" : ""}>Wizard</span>
          <span>•</span>
          <span className={state.step === "mindmap" ? "text-blue-400" : ""}>Mindmap</span>
          <span>•</span>
          <span className={state.step === "prd" ? "text-blue-400" : ""}>PRD</span>
          <span>•</span>
          <span className={state.step === "tasks" ? "text-blue-400" : ""}>Tasks</span>
        </div>
      </header>

      {/* 3. Right Main Area */}
      <div className="flex-1 flex flex-col md:overflow-hidden bg-[#F8FAFC]">
        
        {/* Top Header Bar inside Main Area */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-xs z-10">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-sm font-bold text-slate-900 truncate font-display">
              {currentAppName}
            </h2>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold uppercase rounded border border-emerald-100 flex-shrink-0">
              {state.step === "wizard" ? "Fase 0: Draft" : "Fase 1: Core Specs"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleRestart}
              className="px-3.5 py-1.5 border border-slate-200 rounded-xl text-[11px] font-semibold hover:bg-slate-50 transition-colors text-slate-600 flex items-center gap-1.5 shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Wizard</span>
            </button>
          </div>
        </header>

        {/* Scrollable Container with Grid Pattern Background */}
        <div className="flex-1 overflow-y-auto relative">
          
          {/* Error Banner notice */}
          {errorMessage && (
            <div className="max-w-4xl mx-auto px-6 pt-6">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-red-800">Ups, Terjadi Masalah!</h4>
                  <p className="text-xs text-red-600 mt-1">{errorMessage}</p>
                  <button
                    onClick={() => setErrorMessage(null)}
                    className="mt-2 px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-200 text-[10px] font-semibold transition"
                  >
                    Tutup Notifikasi
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Render Step View Content */}
          <div className="p-4 md:p-6">
            
            {state.step === "wizard" && (
              <Wizard 
                onComplete={handleWizardComplete} 
                isLoading={isLoading} 
              />
            )}

            {state.step === "mindmap" && state.mindmap && (
              <div className="space-y-4">
                <div className="max-w-5xl mx-auto space-y-1 mb-2">
                  <h2 className="text-base font-bold text-slate-800 tracking-tight font-display">
                    Langkah 2: Sempurnakan Pohon Fitur Anda
                  </h2>
                  <p className="text-xs text-slate-500">
                    AI telah memecah aplikasi <strong className="text-blue-600">"{state.mindmap.appName}"</strong> menjadi hirarki node di bawah ini. Anda bisa menggeser, memperbesar, mengubah nama, menambah sub-fitur baru, menentukan fase rilis, atau menghapus modul sesuai kebutuhan.
                  </p>
                </div>
                
                <MindmapEditor
                  initialData={state.mindmap}
                  onSave={handleSaveMindmap}
                  onGeneratePRD={handleGeneratePRD}
                  isLoadingPRD={isLoading}
                />
              </div>
            )}

            {state.step === "prd" && state.prdMarkdown && (
              <div className="space-y-4">
                <div className="max-w-4xl mx-auto space-y-1 mb-2">
                  <h2 className="text-base font-bold text-slate-800 tracking-tight font-display">
                    Langkah 3: Tinjau Dokumen Kebutuhan Produk (PRD)
                  </h2>
                  <p className="text-xs text-slate-500">
                    PRD ini merangkum seluruh aturan logika bisnis, kriteria penerimaan teknis, serta stack teknologi yang cocok untuk aplikasi Anda. Gunakan tab kustom untuk merapikan isinya sebelum dipecah menjadi tugas.
                  </p>
                </div>

                <PrdViewer
                  appName={state.mindmap?.appName || "Aplikasi Anda"}
                  markdown={state.prdMarkdown}
                  onUpdateMarkdown={handleUpdatePrdMarkdown}
                  onGenerateTasks={handleGenerateTasks}
                  onBack={() => setState((prev) => ({ ...prev, step: "mindmap" }))}
                  isLoadingTasks={isLoading}
                />
              </div>
            )}

            {state.step === "tasks" && state.tasks && (
              <div className="space-y-4">
                <div className="max-w-4xl mx-auto space-y-1 mb-2">
                  <h2 className="text-base font-bold text-slate-800 tracking-tight font-display">
                    Langkah 4: Vibe Coding Task List
                  </h2>
                  <p className="text-xs text-slate-500">
                    AI telah menyusun rincian langkah pengerjaan modular. Cukup perluas masing-masing baris tugas, salin instruksi kustom di dalamnya, lalu tempelkan langsung ke kolom obrolan AI Code Editor Anda!
                  </p>
                </div>

                <TaskBreakdown
                  appName={state.mindmap?.appName || "Aplikasi Anda"}
                  tasks={state.tasks}
                  onToggleTask={handleToggleTask}
                  onUpdateTaskStatus={handleUpdateTaskStatus}
                  onBackToPRD={() => setState((prev) => ({ ...prev, step: "prd" }))}
                  onRestart={handleRestart}
                />
              </div>
            )}

          </div>

          {/* Footer Branding Credit Lines */}
          <footer className="py-6 text-center text-[11px] text-slate-400 border-t border-slate-100 mt-12">
            <p className="font-semibold text-slate-500">
              AI Software Blueprint Studio • Solusi instan mendesain arsitektur aplikasi untuk Vibe Coding
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Ditenagai oleh model AI Gemini 3.5 Flash server-side. Seluruh data blueprint disimpan secara lokal di browser Anda.
            </p>
          </footer>

        </div>
      </div>

    </div>
  );
}
