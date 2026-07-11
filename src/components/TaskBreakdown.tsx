import React, { useState } from "react";
import { VibeTask } from "../types";
import { 
  CheckSquare, Square, Copy, Check, ChevronDown, ChevronUp, Download, 
  RotateCcw, ArrowLeft, Terminal, Database, Server, Cpu, Layers, HelpCircle,
  Trello, List, X
} from "lucide-react";
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  DragEndEvent,
  useDroppable,
  useDraggable
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

interface TaskBreakdownProps {
  appName: string;
  tasks: VibeTask[];
  onToggleTask: (taskId: string) => void;
  onUpdateTaskStatus?: (taskId: string, status: "todo" | "in_progress" | "done" | string) => void;
  onBackToPRD: () => void;
  onRestart: () => void;
}

// -------------------------------------------------------------
// Component: KanbanCard (Draggable)
// -------------------------------------------------------------
interface KanbanCardProps {
  key?: string | number;
  task: VibeTask;
  onClick: () => void;
  onToggleTask: (taskId: string) => void;
  getLayerIcon: (layer: string) => React.ReactNode;
  getLayerColorBadge: (layer: string) => string;
}

function KanbanCard({
  task,
  onClick,
  onToggleTask,
  getLayerIcon,
  getLayerColorBadge
}: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 50 : undefined,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-150 flex flex-col justify-between ${
        isDragging ? "opacity-40 border-blue-400 border-dashed scale-[1.02]" : ""
      }`}
    >
      <div className="flex items-start gap-2.5 justify-between">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          {/* Checkbox button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleTask(task.id);
            }}
            className="mt-0.5 text-slate-400 hover:text-blue-650 focus:outline-none flex-shrink-0"
          >
            {task.completed ? (
              <CheckSquare className="w-4 h-4 text-blue-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-300" />
            )}
          </button>

          {/* Text block */}
          <div className="min-w-0 flex-1 cursor-pointer" onClick={onClick}>
            <h5 className={`text-[11px] font-bold leading-snug break-words ${task.completed ? "line-through text-slate-400" : "text-slate-800 hover:text-blue-650 transition"}`}>
              {task.title}
            </h5>
            <p className="text-[10px] text-slate-400 line-clamp-2 mt-1">
              {task.description}
            </p>
          </div>
        </div>
      </div>

      {/* Layer Badge & Drag Handle */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5 overflow-hidden">
          {getLayerIcon(task.layer)}
          <span className={`text-[8px] font-bold border px-1.5 py-0.5 rounded-full truncate ${getLayerColorBadge(task.layer)}`}>
            {task.layer}
          </span>
        </div>

        {/* Drag handle dots icon */}
        <div 
          {...listeners} 
          {...attributes}
          className="flex items-center justify-center p-1 rounded hover:bg-slate-100 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing"
          title="Geser kartu"
          onClick={(e) => e.stopPropagation()} // stop click bubbling
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Component: KanbanColumn (Droppable)
// -------------------------------------------------------------
interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: VibeTask[];
  onCardClick: (task: VibeTask) => void;
  onToggleTask: (taskId: string) => void;
  getLayerIcon: (layer: string) => React.ReactNode;
  getLayerColorBadge: (layer: string) => string;
}

function KanbanColumn({
  id,
  title,
  tasks,
  onCardClick,
  onToggleTask,
  getLayerIcon,
  getLayerColorBadge
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  // Column header configurations
  const getHeaderStyle = (columnId: string) => {
    switch (columnId) {
      case "todo":
        return { dot: "bg-slate-400", border: "border-slate-200" };
      case "in_progress":
        return { dot: "bg-amber-500 animate-pulse", border: "border-amber-200" };
      case "done":
        return { dot: "bg-emerald-500", border: "border-emerald-200" };
      default:
        return { dot: "bg-blue-500", border: "border-blue-200" };
    }
  };

  const styleConfig = getHeaderStyle(id);

  return (
    <div 
      ref={setNodeRef} 
      className={`flex flex-col flex-1 min-w-[250px] min-h-[480px] p-4 rounded-2xl border transition-all duration-200 ${
        isOver 
          ? "bg-blue-50/40 border-blue-300 ring-2 ring-blue-500/5" 
          : "bg-slate-50/80 border-slate-200"
      }`}
    >
      {/* Column Title Header */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/60 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${styleConfig.dot}`} />
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{title}</h4>
        </div>
        <span className="text-[10px] font-bold bg-white text-slate-500 border border-slate-150 px-2.5 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      {/* Column Tasks Body */}
      <div className="flex flex-col gap-3 flex-1 overflow-y-auto max-h-[500px] pr-1 scrollbar-thin">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-200 rounded-xl bg-white/40 flex-1">
            <p className="text-[10px] font-semibold text-slate-400">Belum ada tugas</p>
            <p className="text-[9px] text-slate-350 mt-1">Tarik tugas ke sini</p>
          </div>
        ) : (
          tasks.map(task => (
            <KanbanCard 
              key={task.id} 
              task={task} 
              onClick={() => onCardClick(task)}
              onToggleTask={onToggleTask}
              getLayerIcon={getLayerIcon}
              getLayerColorBadge={getLayerColorBadge}
            />
          ))
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Main Component: TaskBreakdown
// -------------------------------------------------------------
export default function TaskBreakdown({ 
  appName, 
  tasks, 
  onToggleTask, 
  onUpdateTaskStatus,
  onBackToPRD, 
  onRestart 
}: TaskBreakdownProps) {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(tasks[0]?.id || null);
  const [copiedTaskId, setCopiedTaskId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  
  // State for displaying card modal details
  const [selectedTask, setSelectedTask] = useState<VibeTask | null>(null);

  // Group tasks by layer category
  const categories = ["Database Schema", "Backend API", "Frontend UI", "Integration"];
  
  const getTasksByLayer = (layer: string) => {
    return tasks.filter(t => t.layer.toLowerCase().includes(layer.toLowerCase()) || 
                             (layer === "Integration" && !["database", "backend", "frontend"].some(l => t.layer.toLowerCase().includes(l))));
  };

  // Group tasks for Kanban columns
  const getTasksByStatus = (status: "todo" | "in_progress" | "done") => {
    return tasks.filter(t => {
      // Backwards compatible fallback mapping
      const s = t.status || (t.completed ? "done" : "todo");
      return s === status;
    });
  };

  // Icon depending on the layer
  const getLayerIcon = (layer: string) => {
    const l = layer.toLowerCase();
    if (l.includes("database")) return <Database className="w-3.5 h-3.5 text-blue-500" />;
    if (l.includes("backend") || l.includes("api")) return <Server className="w-3.5 h-3.5 text-emerald-500" />;
    if (l.includes("frontend") || l.includes("ui")) return <Cpu className="w-3.5 h-3.5 text-pink-500" />;
    return <Layers className="w-3.5 h-3.5 text-purple-500" />;
  };

  const getLayerColorBadge = (layer: string) => {
    const l = layer.toLowerCase();
    if (l.includes("database")) return "bg-blue-50 text-blue-700 border-blue-150";
    if (l.includes("backend") || l.includes("api")) return "bg-emerald-50 text-emerald-700 border-emerald-150";
    if (l.includes("frontend") || l.includes("ui")) return "bg-pink-50 text-pink-700 border-pink-150";
    return "bg-purple-50 text-purple-700 border-purple-150";
  };

  // Drag sensors config (activationConstraint ensures normal click works seamlessly)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // DragEnd event handler for Kanban
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as "todo" | "in_progress" | "done";

    if (onUpdateTaskStatus) {
      onUpdateTaskStatus(taskId, newStatus);
    }
  };

  // Copy standard vibe-coding prompt for single task
  const handleCopyPrompt = async (task: VibeTask) => {
    try {
      const promptText = `
=== VIBE CODING TASK PROMPT ===
APLIKASI: ${appName}
KATEGORI LAYER: ${task.layer}
TUGAS: ${task.title}

DESKRIPSI:
${task.description}

INSTRUKSI DETAIL PENGODEAN:
${task.prompt}
===============================
      `.trim();

      await navigator.clipboard.writeText(promptText);
      setCopiedTaskId(task.id);
      setTimeout(() => setCopiedTaskId(null), 2500);
    } catch (err) {
      console.error("Gagal menyalin prompt:", err);
    }
  };

  // Copy entire task list as a summary prompt
  const handleCopyAllSummary = async () => {
    try {
      let summaryText = `# Vibe Coding Task Board: ${appName}\n\n`;
      tasks.forEach((t, i) => {
        const statusText = t.status === "done" || t.completed ? "x" : t.status === "in_progress" ? "/" : " ";
        summaryText += `${i + 1}. [${statusText}] **${t.title}** (${t.layer})\n   - ${t.description}\n\n`;
      });
      await navigator.clipboard.writeText(summaryText);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) {
      console.error("Gagal menyalin rangkuman:", err);
    }
  };

  // Download tasks board markdown file
  const handleDownloadTasks = () => {
    let md = `# VIBE CODING BOARD - ${appName.toUpperCase()}\n\n`;
    md += `Gunakan file ini untuk memandu asisten koding AI Anda (seperti Cursor/Windsurf) secara bertahap.\n\n`;
    
    categories.forEach(cat => {
      const catTasks = getTasksByLayer(cat);
      if (catTasks.length === 0) return;
      md += `## 📂 ${cat}\n\n`;
      catTasks.forEach(task => {
        const statusText = task.status === "done" || task.completed ? "x" : task.status === "in_progress" ? "/" : " ";
        md += `### [${statusText}] ${task.title}\n`;
        md += `**Deskripsi:** ${task.description}\n\n`;
        md += `**Prompt Vibe Coding:**\n\`\`\`\n${task.prompt}\n\`\`\`\n\n`;
        md += `---\n\n`;
      });
    });

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${appName.toLowerCase().replace(/\s+/g, "_")}_tasks.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Statistics
  const completedCount = tasks.filter(t => t.completed || t.status === "done").length;
  const totalCount = tasks.length;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div id="task-breakdown-container" className="max-w-5xl mx-auto px-4 py-2 space-y-6">
      
      {/* Vibe Coding Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-gradient-to-r from-slate-900 to-slate-950 text-white p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1.5 z-10">
          <span className="text-[9px] bg-blue-500/30 text-blue-200 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
            Vibe Coding Ready
          </span>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Terminal className="w-5 h-5 text-blue-400" />
            Papan Tugas & Prompter AI
          </h2>
          <p className="text-xs text-blue-200/80 max-w-xl">
            Tugas modular siap umpan ke asisten koding Anda. Salin prompt di bawah ini langkah demi langkah agar AI menghasilkan kode yang presisi tanpa halusinasi.
          </p>
        </div>

        {/* Progress Tracker Card */}
        <div className="bg-white/10 backdrop-blur border border-white/10 px-5 py-4 rounded-2xl flex flex-col items-center justify-center min-w-[150px] text-center z-10 self-start md:self-auto">
          <span className="text-[10px] text-blue-200 font-medium uppercase">Progres Koding</span>
          <span className="text-2xl font-bold font-mono mt-0.5">{completedCount}/{totalCount}</span>
          <div className="w-24 bg-white/15 h-1.5 rounded-full overflow-hidden mt-2">
            <div 
              className="bg-blue-400 h-full transition-all duration-300 rounded-full"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <span className="text-[9px] text-blue-300 mt-1 font-medium">{completionPercent}% Selesai</span>
        </div>
      </div>

      {/* Action Buttons Hub */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-150">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={handleCopyAllSummary}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
            title="Salin rangkuman daftar tugas"
          >
            {copiedAll ? (
              <>
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-green-600">Daftar Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                Salin Checklist Tugas
              </>
            )}
          </button>

          <button
            onClick={handleDownloadTasks}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
            title="Unduh instruksi tugas lengkap"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Unduh Papan Tugas (.md)
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            Saran: Kerjakan berurutan dari atas ke bawah
          </span>
        </div>
      </div>

      {/* View Selector Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl self-start">
          <button
            onClick={() => setViewMode("kanban")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              viewMode === "kanban"
                ? "bg-white text-blue-600 shadow-xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Trello className="w-3.5 h-3.5" />
            Papan Kanban
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              viewMode === "list"
                ? "bg-white text-blue-600 shadow-xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            Daftar Tugas
          </button>
        </div>
        
        {viewMode === "kanban" && (
          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 bg-blue-50/50 px-3 py-1 rounded-lg border border-blue-100/50">
            <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
            Petunjuk: Tekan logo garis di kanan bawah kartu lalu geser ke kolom yang sesuai. Klik judul untuk detail.
          </span>
        )}
      </div>

      {/* Render selected view mode */}
      {viewMode === "kanban" ? (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <KanbanColumn 
              id="todo" 
              title="Untuk Dikerjakan (To Do)" 
              tasks={getTasksByStatus("todo")}
              onCardClick={setSelectedTask}
              onToggleTask={onToggleTask}
              getLayerIcon={getLayerIcon}
              getLayerColorBadge={getLayerColorBadge}
            />
            <KanbanColumn 
              id="in_progress" 
              title="Sedang Dikerjakan" 
              tasks={getTasksByStatus("in_progress")}
              onCardClick={setSelectedTask}
              onToggleTask={onToggleTask}
              getLayerIcon={getLayerIcon}
              getLayerColorBadge={getLayerColorBadge}
            />
            <KanbanColumn 
              id="done" 
              title="Selesai (Done)" 
              tasks={getTasksByStatus("done")}
              onCardClick={setSelectedTask}
              onToggleTask={onToggleTask}
              getLayerIcon={getLayerIcon}
              getLayerColorBadge={getLayerColorBadge}
            />
          </div>
        </DndContext>
      ) : (
        /* Main Categorized Task Board - List View */
        <div className="space-y-6">
          {categories.map(category => {
            const categoryTasks = getTasksByLayer(category);
            if (categoryTasks.length === 0) return null;

            return (
              <div key={category} id={`layer-${category.toLowerCase().replace(/\s+/g, "-")}`} className="space-y-3">
                {/* Category Subtitle */}
                <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
                  {getLayerIcon(category)}
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {category}
                  </h3>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                    {categoryTasks.length} Tugas
                  </span>
                </div>

                {/* Task Items */}
                <div className="grid grid-cols-1 gap-3">
                  {categoryTasks.map(task => {
                    const isExpanded = expandedTaskId === task.id;
                    const isCopied = copiedTaskId === task.id;

                    return (
                      <div 
                        key={task.id}
                        className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                          isExpanded 
                            ? "border-blue-400 shadow-sm ring-1 ring-blue-400/20" 
                            : "border-slate-200 hover:border-slate-350 shadow-xs"
                        }`}
                      >
                        {/* Task Header Area */}
                        <div 
                          onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                          className="px-5 py-4 flex items-start gap-4 justify-between cursor-pointer hover:bg-slate-50/50"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            {/* Checkbox button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleTask(task.id);
                              }}
                              className="mt-0.5 text-slate-400 hover:text-blue-600 focus:outline-none flex-shrink-0"
                            >
                              {task.completed ? (
                                <CheckSquare className="w-5 h-5 text-blue-600" />
                              ) : (
                                <Square className="w-5 h-5 text-slate-300" />
                              )}
                            </button>

                            <div className="min-w-0 space-y-1">
                              <h4 className={`text-xs font-bold leading-snug break-words ${task.completed ? "line-through text-slate-400" : "text-slate-800"}`}>
                                {task.title}
                              </h4>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[9px] font-semibold border px-2 py-0.5 rounded-full ${getLayerColorBadge(task.layer)}`}>
                                  {task.layer}
                                </span>
                                <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-md ${
                                  task.status === "done" || task.completed 
                                    ? "bg-emerald-50 text-emerald-700" 
                                    : task.status === "in_progress"
                                      ? "bg-amber-50 text-amber-700"
                                      : "bg-slate-100 text-slate-600"
                                }`}>
                                  {task.status === "done" || task.completed ? "Selesai" : task.status === "in_progress" ? "Progress" : "To Do"}
                                </span>
                                <p className="text-[10px] text-slate-400 line-clamp-1">
                                  {task.description}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Collapsed icon indicators */}
                          <div className="flex items-center gap-2 flex-shrink-0 text-slate-400 ml-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyPrompt(task);
                              }}
                              className={`p-1.5 rounded-lg border transition ${
                                isCopied 
                                  ? "bg-green-50 border-green-200 text-green-600" 
                                  : "bg-white border-slate-200 hover:text-blue-600 hover:border-blue-300"
                              }`}
                              title="Salin Prompt Koding AI"
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>

                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>

                        {/* Expandable Vibe Prompter Details */}
                        {isExpanded && (
                          <div className="px-5 pb-5 pt-1 border-t border-slate-100 bg-slate-50/40 space-y-4">
                            <div className="space-y-1.5">
                              <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Ringkasan Sasaran Tugas:
                              </h5>
                              <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-150">
                                {task.description}
                              </p>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                  <Terminal className="w-3.5 h-3.5 text-slate-500" />
                                  Vibe Coding Prompt (Salin ini ke AI Editor):
                                </h5>
                                <span className="text-[9px] text-slate-400">Format: Instruksi Modular</span>
                              </div>

                              <div className="relative group">
                                <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800 leading-relaxed max-h-[300px] overflow-y-auto shadow-inner">
                                  <code>{task.prompt}</code>
                                </pre>

                                {/* Floating Copy Button inside prompt */}
                                <button
                                  onClick={() => handleCopyPrompt(task)}
                                  className={`absolute right-3 top-3 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition shadow-md flex items-center gap-1 ${
                                    isCopied
                                      ? "bg-green-600 hover:bg-green-700 text-white"
                                      : "bg-blue-600 hover:bg-blue-700 text-white"
                                  }`}
                                >
                                  {isCopied ? (
                                    <>
                                      <Check className="w-3.5 h-3.5" />
                                      Tersalin!
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      Salin Prompt
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Overlay detail task for Kanban view */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                {getLayerIcon(selectedTask.layer)}
                <span className={`text-[9px] font-bold border px-2.5 py-1 rounded-full ${getLayerColorBadge(selectedTask.layer)}`}>
                  {selectedTask.layer}
                </span>
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
                  selectedTask.completed || selectedTask.status === "done"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-150" 
                    : selectedTask.status === "in_progress"
                      ? "bg-amber-50 text-amber-750 border border-amber-150"
                      : "bg-slate-150 text-slate-600 border border-slate-200"
                }`}>
                  {selectedTask.completed || selectedTask.status === "done"
                    ? "Selesai" 
                    : selectedTask.status === "in_progress"
                      ? "Sedang Dikerjakan"
                      : "Untuk Dikerjakan"}
                </span>
              </div>
              <button 
                onClick={() => setSelectedTask(null)}
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 scrollbar-thin">
              <h3 className="text-sm font-bold text-slate-800 leading-snug">
                {selectedTask.title}
              </h3>

              <div className="space-y-1.5">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deskripsi Tugas:</h4>
                <p className="text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-150 leading-relaxed">
                  {selectedTask.description}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5 text-slate-400" />
                    Vibe Coding Prompt (Salin ke AI Editor):
                  </h4>
                  <span className="text-[9px] text-slate-400">Instruksi Siap Tempel</span>
                </div>

                <div className="relative">
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800 leading-relaxed max-h-[250px] overflow-y-auto">
                    <code>{selectedTask.prompt}</code>
                  </pre>

                  {/* Float Copy Button */}
                  <button
                    onClick={() => handleCopyPrompt(selectedTask)}
                    className={`absolute right-3 top-3 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition shadow-md flex items-center gap-1 ${
                      copiedTaskId === selectedTask.id
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {copiedTaskId === selectedTask.id ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Tersalin!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Salin Prompt
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between flex-shrink-0">
              <button
                onClick={() => {
                  onToggleTask(selectedTask.id);
                  // Sync local task modal status
                  setSelectedTask(prev => {
                    if (!prev) return null;
                    const nextCompleted = !prev.completed;
                    return {
                      ...prev,
                      completed: nextCompleted,
                      status: nextCompleted ? "done" : "todo"
                    };
                  });
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition border flex items-center gap-1.5 ${
                  selectedTask.completed 
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" 
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {selectedTask.completed ? (
                  <>
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                    Tandai Belum Selesai
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4 text-slate-400" />
                    Tandai Selesai
                  </>
                )}
              </button>

              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Nav Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-150">
        <button
          onClick={onBackToPRD}
          className="px-4 py-2.5 text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 rounded-xl text-xs font-semibold border border-slate-200 transition flex items-center justify-center gap-1 self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          Edit Ulang Dokumen PRD
        </button>

        <button
          onClick={onRestart}
          className="px-4.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 self-stretch sm:self-auto"
        >
          <RotateCcw className="w-4 h-4" />
          Mulai Papan Baru (Wizard)
        </button>
      </div>
    </div>
  );
}
