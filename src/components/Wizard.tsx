import React, { useState } from "react";
import { QuestionnaireAnswers } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ArrowRight, ArrowLeft, Plus, Check, RotateCcw } from "lucide-react";

interface WizardProps {
  onComplete: (answers: QuestionnaireAnswers) => void;
  isLoading: boolean;
}

const PRESET_IDEAS = {
  appName: "CleanExpress",
  appConcept: "Platform layanan on-demand Laundry kiloan dan satuan dengan fitur pemesanan kurir antar-jemput, pelacakan cucian real-time, dan pembayaran cashless terintegrasi untuk masyarakat perkotaan.",
  targetUsers: ["Masyarakat Perkotaan Sibuk", "Mahasiswa", "UMKM Laundry Mitra"],
  platform: "Mobile App (Flutter / React Native)",
  coreModules: ["Sistem Otentikasi (Auth)", "Sistem Pembayaran / Stripe", "Notifikasi Real-time", "Pelacakan Kurir (Maps/GPS)"],
  monetization: "E-commerce & Transaksi Langsung",
  visualStyle: "Modern Minimalist (Inter / Soft Gray)",
  customComments: "Tolong rancang agar database mendukung pelacakan status cucian dari: Antrean -> Pencucian -> Penyetrikaan -> Pengiriman.",
};

export default function Wizard({ onComplete, isLoading }: WizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;

  const [answers, setAnswers] = useState<QuestionnaireAnswers>({
    appName: "",
    appConcept: "",
    targetUsers: [],
    platform: "",
    coreModules: [],
    monetization: "",
    visualStyle: "",
    customComments: "",
  });

  const [newTargetInput, setNewTargetInput] = useState("");
  const [newModuleInput, setNewModuleInput] = useState("");
  const [showCustomTarget, setShowCustomTarget] = useState(false);
  const [showCustomModule, setShowCustomModule] = useState(false);

  // Auto-fill preset for testing
  const handleLoadPreset = () => {
    setAnswers({ ...PRESET_IDEAS });
    setCurrentStep(totalSteps); // go to final step for review
  };

  const updateField = (field: keyof QuestionnaireAnswers, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onComplete(answers);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const addCustomTargetUser = () => {
    if (newTargetInput.trim() && !answers.targetUsers.includes(newTargetInput.trim())) {
      updateField("targetUsers", [...answers.targetUsers, newTargetInput.trim()]);
      setNewTargetInput("");
      setShowCustomTarget(false);
    }
  };

  const addCustomModule = () => {
    if (newModuleInput.trim() && !answers.coreModules.includes(newModuleInput.trim())) {
      updateField("coreModules", [...answers.coreModules, newModuleInput.trim()]);
      setNewModuleInput("");
      setShowCustomModule(false);
    }
  };

  const toggleTargetUser = (target: string) => {
    const current = answers.targetUsers;
    if (current.includes(target)) {
      updateField("targetUsers", current.filter((t) => t !== target));
    } else {
      updateField("targetUsers", [...current, target]);
    }
  };

  const toggleCoreModule = (module: string) => {
    const current = answers.coreModules;
    if (current.includes(module)) {
      updateField("coreModules", current.filter((m) => m !== module));
    } else {
      updateField("coreModules", [...current, module]);
    }
  };

  // Progress percentage
  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  // Suggested chips
  const suggestedTargets = [
    "Siswa / Pelajar",
    "UMKM / Toko Retail",
    "Developer / Engineer",
    "Product Manager / Founder",
    "Ibu Rumah Tangga",
    "Masyarakat Umum",
    "Pecinta Kuliner",
    "Gamers",
  ];

  const suggestedModules = [
    "Sistem Otentikasi (Auth)",
    "Sistem Pembayaran / Stripe",
    "Dasbor Analitik & Chart",
    "Notifikasi Real-time",
    "Chatbot / Integrasi AI",
    "Upload File & Cloud Storage",
    "Sistem Database & CRUD",
    "Sistem Keranjang & Checkout",
  ];

  const suggestedPlatforms = [
    "Web App SPA (React Client Only)",
    "Full-Stack Web (React + Express/Node)",
    "Mobile App (Flutter / React Native)",
    "Desktop App (Electron)",
    "Browser Extension",
  ];

  const suggestedMonetization = [
    "SaaS Langganan Bulanan",
    "E-commerce & Transaksi Langsung",
    "Aplikasi Gratis / Open Source",
    "Iklan & Sponsor",
    "MVP Tanpa Monetisasi (Validasi Ide)",
  ];

  const suggestedStyles = [
    "Modern Minimalist (Inter / Soft Gray)",
    "Dark Mode / Cyberpunk (JetBrains Mono / Emerald)",
    "Editorial & Elegant (Playfair Display / Warm Cream)",
    "Playful & Vibrant (Outfit / Indigo Splash)",
  ];

  return (
    <div id="wizard-container" className="max-w-3xl mx-auto px-4 py-8">
      {/* Header and Preset Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500 animate-pulse" />
            AI Requirement Wizard
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Isi detail aplikasi Anda untuk menghasilkan cetak biru (blueprint) lengkap.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLoadPreset}
          className="self-start sm:self-center px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-medium transition flex items-center gap-1.5 border border-blue-100 shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Gunakan Ide Contoh (SaaS Laundry)
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center text-xs text-slate-500 mb-2">
          <span className="font-medium text-slate-700">Langkah {currentStep} dari {totalSteps}</span>
          <span>{progressPercent}% Selesai</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Wizard Question Cards */}
      <div className="bg-white rounded-3xl border border-slate-150 shadow-sm p-6 sm:p-8 min-h-[350px] flex flex-col justify-between">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col justify-center"
          >
            {/* STEP 1: App Name & Basic Concept */}
            {currentStep === 1 && (
              <div id="step-1" className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Aplikasi <span className="text-slate-400 font-normal">(Opsional)</span></label>
                  <input
                    type="text"
                    value={answers.appName}
                    onChange={(e) => updateField("appName", e.target.value)}
                    placeholder="Contoh: KasirKita, EduKids, SereneMind"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Konsep & Ide Utama Aplikasi <span className="text-red-500">*</span></label>
                  <textarea
                    required
                    value={answers.appConcept}
                    onChange={(e) => updateField("appConcept", e.target.value)}
                    placeholder="Tulis ide aplikasi Anda di sini... (misal: 'Saya ingin membuat aplikasi mobile pelacak kebiasaan (habit tracker) yang memiliki sistem gamifikasi hewan virtual, pengingat, dan analitik grafis')"
                    rows={5}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm transition resize-none"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Semakin detail Anda mendeskripsikan idenya, semakin akurat struktur AI yang akan dihasilkan.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 2: Target Users */}
            {currentStep === 2 && (
              <div id="step-2" className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-1">Siapa target pengguna utama aplikasi ini?</h3>
                  <p className="text-xs text-slate-400 mb-4">Pilih beberapa atau tambahkan kustom sesuai persona ideal Anda.</p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {suggestedTargets.map((target) => {
                    const isSelected = answers.targetUsers.includes(target);
                    return (
                      <button
                        key={target}
                        type="button"
                        onClick={() => toggleTargetUser(target)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        {target}
                      </button>
                    );
                  })}

                  {answers.targetUsers.filter(t => !suggestedTargets.includes(t)).map((customTarget) => (
                    <button
                      key={customTarget}
                      type="button"
                      onClick={() => toggleTargetUser(customTarget)}
                      className="px-3.5 py-2 rounded-xl text-xs font-medium bg-blue-600 text-white border border-blue-600 shadow-sm flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {customTarget}
                    </button>
                  ))}

                  {/* Add Custom Trigger */}
                  {!showCustomTarget ? (
                    <button
                      type="button"
                      onClick={() => setShowCustomTarget(true)}
                      className="px-3.5 py-2 rounded-xl text-xs font-medium border border-dashed border-slate-300 hover:border-blue-400 text-slate-500 hover:text-blue-600 transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Lainnya
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newTargetInput}
                        onChange={(e) => setNewTargetInput(e.target.value)}
                        placeholder="Tulis target..."
                        className="px-3 py-1.5 border border-blue-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addCustomTargetUser();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={addCustomTargetUser}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-xl hover:bg-blue-700"
                      >
                        Tambah
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCustomTarget(false)}
                        className="text-slate-400 text-xs hover:text-slate-600"
                      >
                        Batal
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: Platform / Tech Stack */}
            {currentStep === 3 && (
              <div id="step-3" className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-1">Pilih Platform atau Target Pembangunan</h3>
                  <p className="text-xs text-slate-400 mb-4">Jenis aplikasi apa yang ingin Anda kembangkan?</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {suggestedPlatforms.map((plat) => {
                    const isSelected = answers.platform === plat;
                    return (
                      <button
                        key={plat}
                        type="button"
                        onClick={() => updateField("platform", plat)}
                        className={`p-4 rounded-2xl border text-left text-xs font-semibold transition-all duration-200 ${
                          isSelected
                            ? "bg-blue-50 border-blue-500 text-blue-900 shadow-sm"
                            : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{plat}</span>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? "border-blue-600 bg-blue-600" : "border-slate-300"}`}>
                            {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Atau tentukan stack kustom Anda sendiri:</label>
                  <input
                    type="text"
                    value={suggestedPlatforms.includes(answers.platform) ? "" : answers.platform}
                    onChange={(e) => updateField("platform", e.target.value)}
                    placeholder="Contoh: SvelteKit + Postgres, Next.js + Supabase, Go + htmx..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs transition"
                  />
                </div>
              </div>
            )}

            {/* STEP 4: Core Modules */}
            {currentStep === 4 && (
              <div id="step-4" className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-1">Modul Utama apa yang wajib dimiliki aplikasi Anda?</h3>
                  <p className="text-xs text-slate-400 mb-4">Pilih dari rekomendasi di bawah ini atau tambahkan modul kustom.</p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {suggestedModules.map((module) => {
                    const isSelected = answers.coreModules.includes(module);
                    return (
                      <button
                        key={module}
                        type="button"
                        onClick={() => toggleCoreModule(module)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        {module}
                      </button>
                    );
                  })}

                  {answers.coreModules.filter(m => !suggestedModules.includes(m)).map((customMod) => (
                    <button
                      key={customMod}
                      type="button"
                      onClick={() => toggleCoreModule(customMod)}
                      className="px-3.5 py-2 rounded-xl text-xs font-medium bg-blue-600 text-white border border-blue-600 shadow-sm flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {customMod}
                    </button>
                  ))}

                  {/* Add Custom Module Trigger */}
                  {!showCustomModule ? (
                    <button
                      type="button"
                      onClick={() => setShowCustomModule(true)}
                      className="px-3.5 py-2 rounded-xl text-xs font-medium border border-dashed border-slate-300 hover:border-blue-400 text-slate-500 hover:text-blue-600 transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Lainnya
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newModuleInput}
                        onChange={(e) => setNewModuleInput(e.target.value)}
                        placeholder="Tulis modul..."
                        className="px-3 py-1.5 border border-blue-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addCustomModule();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={addCustomModule}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-xl hover:bg-blue-700"
                      >
                        Tambah
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCustomModule(false)}
                        className="text-slate-400 text-xs hover:text-slate-600"
                      >
                        Batal
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 5: Monetization / MVP Goal */}
            {currentStep === 5 && (
              <div id="step-5" className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-1">Rencana Monetisasi / Tujuan Rilis Utama</h3>
                  <p className="text-xs text-slate-400 mb-4">Bagaimana cara produk ini memperoleh pendapatan atau apa tujuan MVP Anda?</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {suggestedMonetization.map((monet) => {
                    const isSelected = answers.monetization === monet;
                    return (
                      <button
                        key={monet}
                        type="button"
                        onClick={() => updateField("monetization", monet)}
                        className={`p-4 rounded-2xl border text-left text-xs font-semibold transition-all duration-200 ${
                          isSelected
                            ? "bg-blue-50 border-blue-500 text-blue-900 shadow-sm"
                            : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{monet}</span>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? "border-blue-600 bg-blue-600" : "border-slate-300"}`}>
                            {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Lainnya (Kustom):</label>
                  <input
                    type="text"
                    value={suggestedMonetization.includes(answers.monetization) ? "" : answers.monetization}
                    onChange={(e) => updateField("monetization", e.target.value)}
                    placeholder="Contoh: Transaksi satu kali, Model Donasi, Freemium..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs transition"
                  />
                </div>
              </div>
            )}

            {/* STEP 6: Visual Style / Branding */}
            {currentStep === 6 && (
              <div id="step-6" className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-1">Gaya Visual & Branding</h3>
                  <p className="text-xs text-slate-400 mb-4">Pilih nuansa estetika yang paling cocok dengan target pasar Anda.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {suggestedStyles.map((style) => {
                    const isSelected = answers.visualStyle === style;
                    return (
                      <button
                        key={style}
                        type="button"
                        onClick={() => updateField("visualStyle", style)}
                        className={`p-4 rounded-2xl border text-left text-xs transition-all duration-200 ${
                          isSelected
                            ? "bg-blue-50 border-blue-500 shadow-sm"
                            : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className={`font-semibold text-xs ${isSelected ? "text-blue-900" : "text-slate-700"}`}>
                              {style.split(" (")[0]}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {style.includes("(") ? style.slice(style.indexOf("(")) : ""}
                            </p>
                          </div>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? "border-blue-600 bg-blue-600" : "border-slate-300"}`}>
                            {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 7: Review & Custom Comments */}
            {currentStep === 7 && (
              <div id="step-7" className="space-y-5">
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-1">Hampir Selesai! Ada permintaan khusus?</h3>
                  <p className="text-xs text-slate-400 mb-3">Tuliskan fungsionalitas unik, batasan teknis, atau preferensi khusus di sini.</p>
                  <textarea
                    value={answers.customComments}
                    onChange={(e) => updateField("customComments", e.target.value)}
                    placeholder="Contoh: 'Tolong buat agar data transaksi bisa diekspor ke Excel', atau 'Gunakan API Google Maps untuk melacak pengiriman', dll."
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm transition resize-none"
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 text-xs text-slate-600">
                  <h4 className="font-semibold text-slate-700 mb-1.5">Ringkasan Spesifikasi Anda:</h4>
                  <ul className="space-y-1 list-inside list-disc">
                    <li>Nama: <strong className="text-slate-800">{answers.appName || "(Belum ditentukan)"}</strong></li>
                    <li className="truncate">Konsep: <span className="text-slate-500">{answers.appConcept ? `${answers.appConcept.slice(0, 100)}...` : "(Kosong)"}</span></li>
                    <li>Target Pengguna: <span className="text-slate-500">{answers.targetUsers.join(", ") || "(Kosong)"}</span></li>
                    <li>Platform: <span className="text-slate-500">{answers.platform || "(Kosong)"}</span></li>
                    <li>Modul Utama: <span className="text-slate-500">{answers.coreModules.join(", ") || "(Kosong)"}</span></li>
                  </ul>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1 || isLoading}
            className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-1 transition ${
              currentStep === 1
                ? "text-slate-300 cursor-not-allowed"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Sebelumnya
          </button>

          <div className="flex items-center gap-3">
            {/* Skip Option for Optional fields */}
            {currentStep > 1 && currentStep < 7 && (
              <button
                type="button"
                onClick={handleSkip}
                disabled={isLoading}
                className="px-4 py-2 text-xs text-slate-400 hover:text-slate-600 transition"
              >
                Lewati
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              disabled={isLoading || (currentStep === 1 && !answers.appConcept.trim())}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm ${
                currentStep === 1 && !answers.appConcept.trim()
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                  : isLoading
                  ? "bg-blue-400 text-white cursor-wait"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Memproses...
                </>
              ) : currentStep === totalSteps ? (
                <>
                  Buat Blueprint AI
                  <Sparkles className="w-4 h-4" />
                </>
              ) : (
                <>
                  Selanjutnya
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
