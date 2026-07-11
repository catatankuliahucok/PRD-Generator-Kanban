import React, { useState } from "react";
import { Copy, Download, FileText, Check, ArrowLeft, ArrowRight, Edit3, Eye } from "lucide-react";

interface PrdViewerProps {
  appName: string;
  markdown: string;
  onUpdateMarkdown: (newMarkdown: string) => void;
  onGenerateTasks: () => void;
  onBack: () => void;
  isLoadingTasks: boolean;
}

export default function PrdViewer({ 
  appName, 
  markdown, 
  onUpdateMarkdown, 
  onGenerateTasks, 
  onBack, 
  isLoadingTasks 
}: PrdViewerProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "editor">("preview");
  const [copied, setCopied] = useState(false);

  // Copy Markdown text to Clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Gagal menyalin PRD:", err);
    }
  };

  // Download Markdown file (.md)
  const handleDownload = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${appName.toLowerCase().replace(/\s+/g, "_")}_prd.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom Inline Markdown formatter for text
  const formatInlineText = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    // Split by Bold (**)
    const boldParts = text.split(/\*\*/g);
    
    boldParts.forEach((bp, index) => {
      if (index % 2 === 1) {
        // Bold segment
        parts.push(<strong key={`bold-${index}`} className="font-semibold text-slate-900">{bp}</strong>);
      } else {
        // Plain segment, check for inline code (`)
        const codeParts = bp.split(/`/g);
        codeParts.forEach((cp, cIndex) => {
          if (cIndex % 2 === 1) {
            parts.push(
              <code key={`code-${index}-${cIndex}`} className="bg-slate-100 text-pink-600 px-1 py-0.5 rounded font-mono text-[10px] border border-slate-200">
                {cp}
              </code>
            );
          } else {
            parts.push(cp);
          }
        });
      }
    });

    return parts;
  };

  // Main Markdown Parser & HTML Renderer
  const renderPrdMarkdown = (mdText: string) => {
    const lines = mdText.split("\n");
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Code Block Detection
      if (trimmed.startsWith("```")) {
        if (inCodeBlock) {
          inCodeBlock = false;
          elements.push(
            <pre key={`codeblock-${i}`} className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono my-3.5 overflow-x-auto border border-slate-800 shadow-sm leading-relaxed">
              <code>{codeLines.join("\n")}</code>
            </pre>
          );
          codeLines = [];
        } else {
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        codeLines.push(line);
        continue;
      }

      // Empty spacing lines
      if (trimmed === "") {
        elements.push(<div key={`empty-${i}`} className="h-2.5" />);
        continue;
      }

      // Markdown Headers (H1, H2, H3, H4)
      if (trimmed.startsWith("# ")) {
        elements.push(
          <h1 key={`h1-${i}`} className="text-xl font-bold text-slate-900 mt-6 mb-3 border-b border-slate-150 pb-2 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            {formatInlineText(trimmed.substring(2))}
          </h1>
        );
      } else if (trimmed.startsWith("## ")) {
        elements.push(
          <h2 key={`h2-${i}`} className="text-base font-bold text-slate-800 mt-5 mb-2.5 flex items-center gap-1.5 border-l-2 border-blue-400 pl-2">
            {formatInlineText(trimmed.substring(3))}
          </h2>
        );
      } else if (trimmed.startsWith("### ")) {
        elements.push(
          <h3 key={`h3-${i}`} className="text-sm font-semibold text-slate-700 mt-4 mb-2">
            {formatInlineText(trimmed.substring(4))}
          </h3>
        );
      } else if (trimmed.startsWith("#### ")) {
        elements.push(
          <h4 key={`h4-${i}`} className="text-xs font-semibold text-slate-600 mt-3.5 mb-1.5">
            {formatInlineText(trimmed.substring(5))}
          </h4>
        );
      }
      // Blockquotes
      else if (trimmed.startsWith("> ")) {
        elements.push(
          <blockquote key={`blockquote-${i}`} className="border-l-4 border-blue-500 pl-3.5 italic text-xs text-slate-500 my-3 bg-slate-50/60 py-1 rounded-r-lg">
            {formatInlineText(trimmed.substring(2))}
          </blockquote>
        );
      }
      // Bullet lists (* or -)
      else if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
        elements.push(
          <ul key={`ul-${i}`} className="list-disc list-inside text-xs text-slate-600 pl-4 my-1 space-y-1">
            <li>{formatInlineText(trimmed.substring(2))}</li>
          </ul>
        );
      }
      // Numbered lists (1. 2. etc)
      else if (/^\d+\.\s/.test(trimmed)) {
        const match = trimmed.match(/^\d+\.\s/);
        const prefixLength = match ? match[0].length : 3;
        elements.push(
          <ol key={`ol-${i}`} className="list-decimal list-inside text-xs text-slate-600 pl-4 my-1 space-y-1">
            <li>{formatInlineText(trimmed.substring(prefixLength))}</li>
          </ol>
        );
      }
      // Standard Text Paragraph
      else {
        elements.push(
          <p key={`p-${i}`} className="text-xs text-slate-600 leading-relaxed my-1.5">
            {formatInlineText(line)}
          </p>
        );
      }
    }

    return elements;
  };

  return (
    <div id="prd-viewer-container" className="max-w-4xl mx-auto px-4 py-4 space-y-5">
      {/* PRD Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-150">
        <div>
          <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-500" />
            Dokumen PRD: {appName}
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Tinjau spesifikasi teknis buatan AI. Anda bisa mengedit dokumen ini secara langsung.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-center border border-slate-200">
          <button
            onClick={() => setActiveTab("preview")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === "preview"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Pratinjau PRD
          </button>
          <button
            onClick={() => setActiveTab("editor")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === "editor"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit Markdown
          </button>
        </div>
      </div>

      {/* Document Viewer Body */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        {/* Document Action Ribbon */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex justify-between items-center gap-4">
          <span className="text-[10px] font-mono text-slate-400">
            {activeTab === "preview" ? "MODE: PREVIEW TEKS KAYA" : "MODE: EDIT DOKUMEN MARKDOWN"}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-lg border border-slate-200 text-[10px] font-semibold transition flex items-center gap-1"
              title="Salin isi PRD"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-green-600">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Salin PRD
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-lg border border-slate-200 text-[10px] font-semibold transition flex items-center gap-1"
              title="Unduh file .md"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh .MD
            </button>
          </div>
        </div>

        {/* Content Box */}
        <div className="flex-1 p-6 sm:p-8">
          {activeTab === "preview" ? (
            <div className="prose max-w-none text-slate-700 space-y-1">
              {renderPrdMarkdown(markdown)}
            </div>
          ) : (
            <div className="w-full h-full flex flex-col min-h-[400px]">
              <textarea
                value={markdown}
                onChange={(e) => onUpdateMarkdown(e.target.value)}
                placeholder="Tulis PRD menggunakan format markdown..."
                className="w-full flex-1 min-h-[450px] p-4 bg-slate-50 text-slate-800 font-mono text-xs border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none leading-relaxed"
              />
              <p className="text-[10px] text-slate-400 mt-2">
                * Gunakan format markdown standar (# untuk judul, ## untuk subjudul, ** untuk tebal). Perubahan akan otomatis tersimpan dalam draft.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-150">
        <button
          onClick={onBack}
          className="px-4 py-2.5 text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 rounded-xl text-xs font-semibold border border-slate-200 transition flex items-center justify-center gap-1 self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Mindmap
        </button>

        <button
          onClick={onGenerateTasks}
          disabled={isLoadingTasks || !markdown.trim()}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-semibold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 self-stretch sm:self-auto"
        >
          {isLoadingTasks ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Membuat Daftar Tugas AI...
            </>
          ) : (
            <>
              Konversi ke Task List Vibe Coding
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
