import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize GoogleGenAI client with the key from environment variables
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Helper for error responses
const handleError = (res: express.Response, error: any, message: string) => {
  console.error(`${message}:`, error);
  res.status(500).json({
    error: message,
    details: error instanceof Error ? error.message : String(error),
  });
};

/**
 * 1. Generate Mindmap from Questionnaire
 */
app.post("/api/generate-mindmap", async (req, res) => {
  try {
    const { answers } = req.body;
    if (!answers) {
      return res.status(400).json({ error: "Answers are required" });
    }

    const prompt = `
      Anda adalah seorang Arsitek Perangkat Lunak AI senior. Berdasarkan jawaban kuesioner pengguna di bawah ini, rancang struktur aplikasi yang komprehensif, modular, dan logis dalam format JSON.
      
      Spesifikasi Masukan Pengguna:
      - Nama & Deskripsi Aplikasi: ${answers.appName || "Aplikasi Kustom"} - ${answers.appConcept || "Tidak ada deskripsi"}
      - Target Pengguna: ${answers.targetUsers?.join(", ") || "Semua orang"}
      - Preferensi Platform / Tech Stack: ${answers.platform || "Web App"}
      - Modul Utama yang Diinginkan: ${answers.coreModules?.join(", ") || "Tidak ditentukan"}
      - Monetisasi / Tujuan Fase 1: ${answers.monetization || "MVP"}
      - Gaya Visual: ${answers.visualStyle || "Modern & Clean"}
      - Komentar Khusus: ${answers.customComments || "Tidak ada"}

      Instruksi Pembuatan Struktur:
      1. Tentukan satu Node Root (Aplikasi Utama).
      2. Tentukan 4 sampai 6 Modul Utama (Module Nodes) yang diperlukan untuk mendukung ide ini. Sesuaikan dengan modul yang dipilih pengguna, tapi tambahkan modul penting lainnya (seperti Manajemen Pengguna, Notifikasi, Pembayaran, Admin, dsb) secara logis.
      3. Untuk setiap Modul Utama, tentukan 2 sampai 4 Sub-Fitur spesifik (Sub-Feature Nodes) yang menjelaskan fungsionalitas mendalam.
      4. Tentukan fase rilis ("Fase 1" untuk MVP inti, "Fase 2" untuk fitur sekunder/lanjutan) secara cerdas.
      5. Hubungkan node-node tersebut menggunakan "edges" (Root -> Module -> Sub-Feature).
      6. Output HARUS berupa JSON yang valid dengan skema yang tepat.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "Anda adalah asisten pembuat struktur perangkat lunak. Selalu kembalikan respon dalam struktur JSON yang valid sesuai dengan skema yang diberikan.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["appName", "nodes", "edges"],
          properties: {
            appName: { type: Type.STRING, description: "Nama akhir aplikasi yang dioptimalkan oleh AI" },
            nodes: {
              type: Type.ARRAY,
              description: "Daftar node hierarkis untuk mindmap",
              items: {
                type: Type.OBJECT,
                required: ["id", "label", "type"],
                properties: {
                  id: { type: Type.STRING, description: "ID unik (misal: root, m1, sf1)" },
                  label: { type: Type.STRING, description: "Label teks node (singkat dan jelas)" },
                  type: { type: Type.STRING, description: "Jenis node: 'root', 'module', atau 'subfeature'" },
                  phase: { type: Type.STRING, description: "Fase rilis: 'Fase 1' (MVP) atau 'Fase 2' (Lanjutan)" },
                  parentId: { type: Type.STRING, description: "ID dari node induk (opsional untuk root)" }
                }
              }
            },
            edges: {
              type: Type.ARRAY,
              description: "Hubungan relasional antar node",
              items: {
                type: Type.OBJECT,
                required: ["source", "target"],
                properties: {
                  source: { type: Type.STRING, description: "ID node asal" },
                  target: { type: Type.STRING, description: "ID node tujuan" }
                }
              }
            }
          }
        }
      }
    });

    const resultText = response.text || "{}";
    const parsedData = JSON.parse(resultText);
    res.json(parsedData);
  } catch (error) {
    handleError(res, error, "Gagal menggenerasi struktur mindmap AI");
  }
});

/**
 * 2. Generate PRD (Product Requirements Document) from Mindmap Structure
 */
app.post("/api/generate-prd", async (req, res) => {
  try {
    const { appName, nodes, comments } = req.body;
    if (!nodes || !Array.isArray(nodes)) {
      return res.status(400).json({ error: "Nodes structure is required" });
    }

    const modules = nodes.filter((n: any) => n.type === "module");
    const subfeatures = nodes.filter((n: any) => n.type === "subfeature");

    const prompt = `
      Anda adalah Manajer Produk Teknis AI (Technical Product Manager) tingkat dunia.
      Tugas Anda adalah membuat dokumen **Product Requirements Document (PRD)** yang sangat profesional, komprehensif, dan siap diimplementasikan berdasarkan struktur fitur aplikasi di bawah ini.

      Nama Aplikasi: ${appName || "Aplikasi Kustom"}
      Komentar/Catatan Tambahan Pengguna: ${comments || "Tidak ada"}

      Daftar Fitur & Struktur Modul (dari Mindmap):
      ${modules.map((m: any) => {
        const children = subfeatures.filter((sf: any) => sf.parentId === m.id || sf.id.startsWith(m.id + "-") || sf.parentId === undefined); // fallback parent check
        return `- Modul: ${m.label} (${m.phase || "Fase 1"})
  ${children.map((sf: any) => `  * Sub-fitur: ${sf.label} (${sf.phase || "Fase 1"})`).join("\n")}`;
      }).join("\n\n")}

      Dokumen PRD HARUS ditulis dalam Markdown yang indah dan terstruktur secara rapi dengan bab-bab berikut:
      1. **Ringkasan Eksekutif & Tujuan (Executive Summary & Goals)**: Deskripsikan visi aplikasi, masalah utama yang dipecahkan, dan target pengguna.
      2. **Arsitektur Teknis & Stack Teknologi yang Direkomendasikan**: Rancang pilihan stack modern (misal: React/Next.js, Node.js/Express, Tailwind CSS, Postgres/Firestore) yang paling efisien untuk membangun aplikasi ini.
      3. **Spesifikasi & Detail Kebutuhan Fungsional**:
         Untuk SETIAP Modul Utama di atas, uraikan:
         - **Deskripsi Fungsional**: Apa kegunaannya?
         - **Aturan Bisnis (Business Rules)**: Logika dan batasan sistem (contoh: 'User hanya bisa checkout jika keranjang tidak kosong').
         - **Kriteria Penerimaan (Acceptance Criteria)**: Skenario pengujian (User Story) dalam format Gherkin (Given-When-Then) atau checklist teknis.
      4. **Kebutuhan Non-Fungsional (Non-Functional Requirements)**: Keamanan data, performa, skalabilitas, responsivitas UI.
      5. **Rencana Rilis & Roadmap Pengembangan**: Jelaskan distribusi fitur antara Fase 1 (MVP Inti) dan Fase 2 (Lanjutan) untuk strategi rilis pasar yang cepat.

      Tulis dokumen ini dengan bahasa Indonesia yang profesional, formal, berbobot, dan sangat mendalam agar developer dapat langsung memahaminya. Jangan disingkat-singkat.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "Anda adalah Technical Product Manager berpengalaman. Tulis PRD berkualitas industri perangkat lunak dengan format Markdown yang sangat rapi."
      }
    });

    res.json({ prd: response.text });
  } catch (error) {
    handleError(res, error, "Gagal menggenerasi dokumen PRD AI");
  }
});

/**
 * 3. Generate Task Breakdown for Vibe Coding from PRD
 */
app.post("/api/generate-tasks", async (req, res) => {
  try {
    const { appName, prd, nodes } = req.body;
    if (!prd) {
      return res.status(400).json({ error: "PRD text is required" });
    }

    const prompt = `
      Anda adalah Instruktur Rekayasa Perangkat Lunak AI (AI Software Engineering Coach).
      Tugas Anda adalah mengonversi dokumen PRD dan struktur aplikasi berikut menjadi **Daftar Tugas Modular (Task List)** yang siap digunakan untuk metode **Vibe Coding** menggunakan AI Code Editor (seperti Cursor, Windsurf, Copilot, dll.).

      Nama Aplikasi: ${appName || "Aplikasi Kustom"}
      Struktur Node Fitur: ${JSON.stringify(nodes || [])}

      PRD Singkat/Ref:
      ${prd.slice(0, 3000)}... (Potongan PRD)

      Instruksi Pembagian Tugas:
      1. Pecah pengerjaan aplikasi menjadi **6 hingga 10 tugas modular independen** yang terstruktur secara berurutan agar AI editor dapat mengeksekusinya tanpa mengalami kebingungan atau kegagalan konteks.
      2. Setiap tugas HARUS dimasukkan ke dalam salah satu Kategori Layer berikut:
         - **Database Schema**: Perancangan skema tabel, relasi database, migrasi, atau rancangan dokumen Firestore.
         - **Backend API**: Pembuatan rute endpoint, middleware auth, controller logic, integrasi service pihak ketiga.
         - **Frontend UI**: Pembuatan tata letak, komponen interaktif, animasi visual, transisi state.
         - **Integration**: Menghubungkan client-side dengan backend API, sinkronisasi state real-time, pengujian fungsionalitas end-to-end.
      3. Yang paling krusial: Untuk SETIAP tugas, buatlah satu bagian bernama "prompt" (Vibe Coding Prompt). Ini adalah **prompter instruksi tingkat lanjut** yang akan disalin oleh pengguna dan ditempelkan langsung ke AI Chat Editor. Prompt ini harus ditulis dengan format instruksi imperatif, detail, menyebutkan standar arsitektur, parameter masukan/keluaran, validasi, dan penanganan error.

      Kembalikan respon hanya dalam struktur JSON yang valid sesuai skema.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "Anda adalah AI Engineering Architect. Buat rincian tugas vibe coding yang modular dan berikan instruksi prompt yang sangat spesifik dan detail untuk setiap tugas.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["tasks"],
          properties: {
            tasks: {
              type: Type.ARRAY,
              description: "Daftar tugas vibe coding modular",
              items: {
                type: Type.OBJECT,
                required: ["id", "title", "layer", "description", "prompt"],
                properties: {
                  id: { type: Type.STRING, description: "ID unik tugas (misal: task-01, task-02)" },
                  title: { type: Type.STRING, description: "Judul tugas yang ringkas dan fungsional" },
                  layer: { type: Type.STRING, description: "Layer teknis: 'Database Schema', 'Backend API', 'Frontend UI', atau 'Integration'" },
                  description: { type: Type.STRING, description: "Penjelasan singkat tentang output dan tujuan tugas ini" },
                  prompt: { 
                    type: Type.STRING, 
                    description: "Prompt instruksi lengkap, terstruktur, dan sangat teknis yang siap disalin oleh developer ke AI Code Editor untuk mengimplementasikan fitur tersebut." 
                  }
                }
              }
            }
          }
        }
      }
    });

    const resultText = response.text || "{}";
    const parsedData = JSON.parse(resultText);
    res.json(parsedData);
  } catch (error) {
    handleError(res, error, "Gagal menggenerasi daftar tugas AI");
  }
});

/**
 * Static file serving & Vite development server setup
 */
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Mounted Vite middleware for development");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static files from production dist/");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
