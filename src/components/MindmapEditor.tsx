import React, { useState, useRef, useEffect } from "react";
import { MindmapData, MindmapNode, MindmapEdge } from "../types";
import { 
  ZoomIn, ZoomOut, Maximize, Plus, Trash2, Edit2, Check, Sparkles, 
  Settings, RefreshCw, Layers, ArrowRight, Download, Save
} from "lucide-react";

interface MindmapEditorProps {
  initialData: MindmapData;
  onSave: (data: MindmapData) => void;
  onGeneratePRD: (data: MindmapData) => void;
  isLoadingPRD: boolean;
}

// Spacing layout algorithm for the tree structure
function autoLayout(nodes: MindmapNode[], canvasWidth: number = 1000, canvasHeight: number = 650): MindmapNode[] {
  const adjusted = nodes.map(n => ({ ...n }));
  const root = adjusted.find(n => n.type === "root") || adjusted[0];
  if (!root) return nodes;

  const rootX = 100;
  const rootY = canvasHeight / 2;

  // Set Root Node
  const rootRef = adjusted.find(n => n.id === root.id)!;
  rootRef.x = rootX;
  rootRef.y = rootY;

  const paddingX = 300;
  const paddingY = 70;

  // Process Modules
  const modules = adjusted.filter(n => n.type === "module");
  const moduleCount = modules.length;

  modules.forEach((mod, mIdx) => {
    // Distribute modules vertically
    const modY = moduleCount > 1 
      ? 50 + (canvasHeight - 100) * (mIdx / (moduleCount - 1))
      : rootY;
    
    mod.x = rootX + paddingX;
    mod.y = modY;

    // Process Subfeatures for this module
    const subfeatures = adjusted.filter(n => n.type === "subfeature" && n.parentId === mod.id);
    const sfCount = subfeatures.length;

    subfeatures.forEach((sf, sfIdx) => {
      sf.x = mod.x! + paddingX;
      // Center subfeatures around their parent module
      const offset = sfCount > 1 
        ? (sfIdx - (sfCount - 1) / 2) * paddingY
        : 0;
      sf.y = modY + offset;
    });
  });

  return adjusted;
}

export default function MindmapEditor({ initialData, onSave, onGeneratePRD, isLoadingPRD }: MindmapEditorProps) {
  // Initialize nodes with layout if they don't have x/y
  const [nodes, setNodes] = useState<MindmapNode[]>(() => {
    const hasPositions = initialData.nodes.every(n => n.x !== undefined && n.y !== undefined);
    if (hasPositions) {
      return initialData.nodes;
    }
    return autoLayout(initialData.nodes);
  });

  // Pan and Zoom states
  const [pan, setPan] = useState({ x: 50, y: 0 });
  const [zoom, setZoom] = useState(0.95);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Dragging node states
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Editing node states
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");

  // Context menus or selected node
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Sync state if initialData changes
  useEffect(() => {
    const hasPositions = initialData.nodes.every(n => n.x !== undefined && n.y !== undefined);
    setNodes(hasPositions ? initialData.nodes : autoLayout(initialData.nodes));
  }, [initialData]);

  // Compute bezier curve path for links
  const getBezierPath = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = Math.abs(x2 - x1);
    const controlX1 = x1 + dx * 0.4;
    const controlX2 = x2 - dx * 0.4;
    return `M ${x1} ${y1} C ${controlX1} ${y1}, ${controlX2} ${y2}, ${x2} ${y2}`;
  };

  // Drag Canvas/Background to Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    // If clicking directly on a node or button, don't pan
    const target = e.target as HTMLElement;
    if (target.closest(".node-element") || target.closest(".action-btn")) {
      return;
    }

    setIsPanning(true);
    panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y
      });
    } else if (draggingNodeId) {
      // Drag node
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        // Convert screen coordinates to zoomed/panned canvas coordinates
        const mouseXInCanvas = (e.clientX - rect.left - pan.x) / zoom;
        const mouseYInCanvas = (e.clientY - rect.top - pan.y) / zoom;
        
        setNodes(prev => prev.map(n => {
          if (n.id === draggingNodeId) {
            return {
              ...n,
              x: Math.round(mouseXInCanvas - dragOffset.current.x),
              y: Math.round(mouseYInCanvas - dragOffset.current.y)
            };
          }
          return n;
        }));
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 0.05;
    let nextZoom = zoom - e.deltaY * zoomFactor * 0.01;
    // Clamp zoom between 0.5 and 2.0
    nextZoom = Math.max(0.5, Math.min(2.0, nextZoom));
    setZoom(nextZoom);
  };

  // Node Dragging Handlers
  const handleNodeDragStart = (e: React.MouseEvent, node: MindmapNode) => {
    e.stopPropagation();
    setSelectedNodeId(node.id);
    setDraggingNodeId(node.id);

    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseXInCanvas = (e.clientX - rect.left - pan.x) / zoom;
      const mouseYInCanvas = (e.clientY - rect.top - pan.y) / zoom;
      
      dragOffset.current = {
        x: mouseXInCanvas - (node.x || 0),
        y: mouseYInCanvas - (node.y || 0)
      };
    }
  };

  // Node Editing
  const startEditing = (node: MindmapNode) => {
    setEditingNodeId(node.id);
    setEditingLabel(node.label);
  };

  const saveEditing = () => {
    if (editingNodeId && editingLabel.trim()) {
      setNodes(prev => prev.map(n => n.id === editingNodeId ? { ...n, label: editingLabel.trim() } : n));
    }
    setEditingNodeId(null);
  };

  // Add Child Node
  const handleAddChild = (parentNode: MindmapNode) => {
    const parentId = parentNode.id;
    let childType: "root" | "module" | "subfeature" = "subfeature";
    let typeName = "Sub-fitur";
    
    if (parentNode.type === "root") {
      childType = "module";
      typeName = "Modul Baru";
    }

    const id = `${parentNode.type === "root" ? "m" : "sf"}-${Date.now()}`;
    const newChild: MindmapNode = {
      id,
      label: `${typeName} ${nodes.length + 1}`,
      type: childType,
      parentId: parentId,
      phase: parentNode.phase || "Fase 1",
      x: (parentNode.x || 0) + 250,
      y: (parentNode.y || 0) + (Math.random() * 80 - 40)
    };

    setNodes(prev => [...prev, newChild]);
    setSelectedNodeId(id);
    // Directly focus and edit name
    setEditingNodeId(id);
    setEditingLabel(newChild.label);
  };

  // Add free module
  const handleAddModuleAtRoot = () => {
    const root = nodes.find(n => n.type === "root");
    if (root) {
      handleAddChild(root);
    }
  };

  // Delete Node (and all its children recursively)
  const handleDeleteNode = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || node.type === "root") return; // cannot delete root

    // Collect all descendant ids
    const getDescendants = (id: string): string[] => {
      const direct = nodes.filter(n => n.parentId === id);
      return [id, ...direct.flatMap(d => getDescendants(d.id))];
    };

    const toDeleteIds = getDescendants(nodeId);
    setNodes(prev => prev.filter(n => !toDeleteIds.includes(n.id)));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  };

  // Toggle release phase of node
  const handleTogglePhase = (nodeId: string) => {
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        const nextPhase = n.phase === "Fase 1" ? "Fase 2" : "Fase 1";
        return { ...n, phase: nextPhase };
      }
      return n;
    }));
  };

  // Recalculate auto layout
  const handleAutoLayout = () => {
    setNodes(prev => autoLayout(prev));
  };

  // Reset viewport
  const handleResetView = () => {
    setPan({ x: 50, y: 50 });
    setZoom(0.95);
  };

  // Trigger Save
  const handleLocalSave = () => {
    const data: MindmapData = {
      appName: nodes.find(n => n.type === "root")?.label || "AI Application",
      nodes,
      edges: nodes
        .filter(n => n.parentId !== undefined)
        .map(n => ({ source: n.parentId!, target: n.id }))
    };
    onSave(data);
  };

  // Trigger Generation
  const handleGeneratePRDTrigger = () => {
    const data: MindmapData = {
      appName: nodes.find(n => n.type === "root")?.label || "AI Application",
      nodes,
      edges: nodes
        .filter(n => n.parentId !== undefined)
        .map(n => ({ source: n.parentId!, target: n.id }))
    };
    onGeneratePRD(data);
  };

  return (
    <div className="space-y-4">
      {/* Mindmap Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-150">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-500" />
          <h3 className="text-xs font-semibold text-slate-800">Visual Mindmap Canvas</h3>
          <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
            {nodes.length} Nodes
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Zoom controls */}
          <button
            onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
            className="action-btn p-1.5 bg-white hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono text-slate-500 w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(z => Math.min(2.0, z + 0.1))}
            className="action-btn p-1.5 bg-white hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          
          <div className="w-[1px] h-5 bg-slate-200 mx-1" />

          <button
            onClick={handleResetView}
            className="action-btn p-1.5 bg-white hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition flex items-center gap-1 text-[10px] font-medium"
            title="Reset View"
          >
            <Maximize className="w-3.5 h-3.5" />
            Reset View
          </button>

          <button
            onClick={handleAutoLayout}
            className="action-btn p-1.5 bg-white hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition flex items-center gap-1 text-[10px] font-medium"
            title="Auto-Arrange Nodes"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Auto-Layout
          </button>

          <button
            onClick={handleAddModuleAtRoot}
            className="action-btn p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-100 transition flex items-center gap-1 text-[10px] font-medium"
            title="Tambah Modul"
          >
            <Plus className="w-3.5 h-3.5" />
            Modul Utama
          </button>

          <div className="w-[1px] h-5 bg-slate-200 mx-1" />

          <button
            onClick={handleLocalSave}
            className="action-btn px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition flex items-center gap-1 text-[10px] font-semibold"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            Simpan Draft
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div 
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-[550px] bg-slate-100 border border-slate-200 rounded-2xl relative overflow-hidden select-none cursor-grab active:cursor-grabbing shadow-inner"
        style={{ contentVisibility: "auto" }}
      >
        {/* Canvas Grid Background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(#1e293b 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0"
          }}
        />

        {/* Node & Connection Link Wrapper */}
        <div 
          className="absolute w-full h-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0"
          }}
        >
          {/* SVG Links */}
          <svg className="absolute inset-0 pointer-events-none w-[5000px] h-[5000px]">
            <g>
              {nodes.map(node => {
                if (!node.parentId) return null;
                const parent = nodes.find(n => n.id === node.parentId);
                if (!parent) return null;

                const parentX = (parent.x || 0) + 160; // middle of parent right boundary
                const parentY = (parent.y || 0) + 32;  // vertically centered
                const nodeX = node.x || 0;
                const nodeY = (node.y || 0) + 32;

                const isSelectedLink = selectedNodeId === node.id || selectedNodeId === parent.id;

                return (
                  <path
                    key={`link-${parent.id}-${node.id}`}
                    d={getBezierPath(parentX, parentY, nodeX, nodeY)}
                    fill="none"
                    stroke={isSelectedLink ? "#2563eb" : "#cbd5e1"}
                    strokeWidth={isSelectedLink ? 3 : 1.5}
                    className="transition-colors duration-200"
                  />
                );
              })}
            </g>
          </svg>

          {/* Interactive HTML Nodes */}
          {nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const isEditing = editingNodeId === node.id;

            // Positioning styling
            const nodeStyle: React.CSSProperties = {
              left: `${node.x || 0}px`,
              top: `${node.y || 0}px`,
              width: "190px",
              minHeight: "64px"
            };

            // Custom color presets depending on depth type
            let typeColorClass = "border-slate-300 bg-white shadow-sm text-slate-800";
            if (node.type === "root") {
              typeColorClass = "border-blue-600 bg-blue-50 shadow-md text-blue-900 font-bold ring-2 ring-blue-200";
            } else if (node.type === "module") {
              typeColorClass = "border-emerald-500 bg-emerald-50/40 shadow text-emerald-900";
            }

            return (
              <div
                key={node.id}
                style={nodeStyle}
                onMouseDown={(e) => handleNodeDragStart(e, node)}
                className={`node-element absolute rounded-xl border p-3 flex flex-col justify-between cursor-pointer select-none transition-all duration-150 ${typeColorClass} ${
                  isSelected ? "ring-2 ring-blue-500 scale-[1.02] shadow-blue-100 z-10" : ""
                }`}
              >
                {/* Node Title & Input */}
                <div className="flex-1 min-w-0 pr-1">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingLabel}
                      onChange={(e) => setEditingLabel(e.target.value)}
                      onBlur={saveEditing}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEditing();
                      }}
                      autoFocus
                      className="w-full bg-white px-2 py-1 text-xs border border-blue-400 rounded focus:outline-none"
                    />
                  ) : (
                    <div 
                      className="text-xs font-semibold leading-tight break-words select-text"
                      onDoubleClick={() => startEditing(node)}
                    >
                      {node.label}
                    </div>
                  )}
                </div>

                {/* Bottom Stats / Action triggers */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100/60 text-[10px]">
                  {/* Phase badge for modules/subfeatures */}
                  {node.type !== "root" ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePhase(node.id);
                      }}
                      className={`px-1.5 py-0.5 rounded font-medium transition ${
                        node.phase === "Fase 2"
                          ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                          : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                      }`}
                      title="Klik untuk ubah fase rilis"
                    >
                      {node.phase || "Fase 1"}
                    </button>
                  ) : (
                    <span className="text-slate-400 font-mono text-[9px]">Root App</span>
                  )}

                  {/* Inline quick buttons */}
                  <div className="flex items-center gap-1 text-slate-400 opacity-60 hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(node);
                      }}
                      className="p-1 hover:text-blue-600 rounded"
                      title="Edit Nama"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>

                    {node.type !== "subfeature" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddChild(node);
                        }}
                        className="p-1 hover:text-blue-600 rounded hover:bg-slate-100"
                        title="Tambah Anak Node"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    )}

                    {node.type !== "root" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNode(node.id);
                        }}
                        className="p-1 hover:text-red-500 rounded hover:bg-slate-100"
                        title="Hapus Node"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Zoom Instructions Help Overlay */}
        <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200/50 text-[10px] text-slate-500 font-medium">
          💡 Klik & seret background untuk geser. Dobel klik node untuk ganti nama.
        </div>
      </div>

      {/* Main Actions Box */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-150">
        <div className="text-xs text-slate-500">
          <p className="font-semibold text-slate-700">Tahap Berikutnya: Generasi PRD Teknis</p>
          <p className="mt-0.5">AI akan mengubah seluruh struktur modul diatas menjadi dokumen spesifikasi lengkap.</p>
        </div>

        <button
          onClick={handleGeneratePRDTrigger}
          disabled={isLoadingPRD}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-semibold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 self-stretch sm:self-center"
        >
          {isLoadingPRD ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Menghasilkan PRD Komprehensif...
            </>
          ) : (
            <>
              Selesaikan Mindmap & Buat PRD
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
