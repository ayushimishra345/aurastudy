/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent, useRef, DragEvent } from 'react';
import { 
  Sparkles, BookOpen, ArrowUpRight, Upload, Trash2, 
  Image as ImageIcon, CheckCircle, FileText, File, Music, 
  Paperclip, AlertTriangle, ListRestart
} from 'lucide-react';
import { StudyTheme } from '../types';

interface NoteInputProps {
  currentTheme: StudyTheme;
  onSynthesize: (
    notes: string,
    focusMode: string,
    length: 'concise' | 'detailed',
    image?: { data: string; mimeType: string } | null,
    files?: { data: string; mimeType: string; name: string }[] | null,
    targetLanguage?: string
  ) => void;
  isLoading: boolean;
}

const NOTE_PRESETS = [
  {
    title: '🌿 Plant Photosynthesis',
    category: 'Biology',
    notes: `Photosynthesis is a crucial biological process used by plants, algae, and certain bacteria to harness energy from sunlight and turn it into chemical energy. The process occurs in major stages: the light-dependent reactions and the Calvin cycle.
In light-dependent reactions, chlorophyll within chloroplasts absorbs photons. This energizes electrons, splitting water molecules (photolysis) to release oxygen gas as a byproduct. This stage converts solar energy into chemical carriers: ATP (Adenosine Triphosphate) and NADPH.
In the Calvin Cycle (light-independent phase), which occurs in the stroma, carbon dioxide is captured (carbon fixation) using the RuBisCO enzyme. ATP and NADPH then provide the reduction power to convert these molecules into G3P (glyceraldehyde-3-phosphate), a simple three-carbon sugar, which later forms glucose and other key carbohydrates. The chemical equation is: 6CO2 + 6H2O + Light Energy -> C6H12O6 + 6O2. Plants store excess energy as starch, which can be broken down during cellular respiration to release ATP for metabolic fuel dynamically.`
  },
  {
    title: '🧠 Neural Networks',
    category: 'Computer Science',
    notes: `Artificial Neural Networks (ANNs) are computational systems inspired by the network structure of biological neurons in the human brain. At the heart of an ANN is the artificial neuron, or node. It receives inputs, multiplies them by connection weights, adds a bias value, and routes the sum through a non-linear activation function.
Activation functions like ReLU (Rectified Linear Unit), Sigmoid, or Tanh introduce non-linearity, allowing the network to approximate complex, non-linear mappings. Layers are typically structured as: Input layer, one or more Hidden layers, and an Output layer.
Training involves Feedforward (sending inputs through the network to generate predictions) and Backpropagation. In Backpropagation, the loss function calculates the error difference between predicted output and the true label. The optimization algorithm, usually Gradient Descent or derivatives like Adam, calculates partial derivatives of the loss with respect to weights and updates them iteratively to minimize errors using the Chain Rule of calculus. Overfitting represents a challenge where the network masterfully memorizes training noise rather than generalizable core features, mitigated by strategies like Dropout or L1/L2 weight regularization.`
  },
  {
    title: '🏛️ Fall of West Roman Empire',
    category: 'History',
    notes: `The decline and ultimate collapse of the Western Roman Empire was a complex historical sequence occurring over several centuries, culminating historically around 476 AD when Odoacer deposed Emperor Romulus Augustulus. Historians cite a combination of internal systemic failures and external incursions.
Internal reasons included persistent economic stagnation, severe currency inflation caused by debasing silver coins, high taxation on citizens to support bloated legions, and political volatility with rapid successions and military coups. Structurally, split of the empire under Diocletian into Eastern and Western branches weakened the West, as the East grew more affluent and retained superior military and treasury infrastructure.
Externally, immense migratory pressure (the Migration Period) forced Germanic tribes like the Visigoths, Ostrogoths, Vandals, and Huns across imperial borders. The Roman military, increasingly relying on "foederati" (allied foreign mercenaries), suffered from eroding discipline and loyalty. Sackings of Rome in 410 AD by Alaric the Visigoth and in 455 by the Vandals shattered Roman invincibility, leading to decentralized feudal states.`
  }
];

const INDIAN_LANGUAGES = [
  { code: 'Original', name: 'Original / English' },
  { code: 'Hindi', name: 'Hindi (हिन्दी)' },
  { code: 'Bengali', name: 'Bengali (বাংলা)' },
  { code: 'Telugu', name: 'Telugu (తెలుగు)' },
  { code: 'Marathi', name: 'Marathi (मराठी)' },
  { code: 'Tamil', name: 'Tamil (தமிழ்)' },
  { code: 'Gujarati', name: 'Gujarati (ગુજરાતી)' },
  { code: 'Urdu', name: 'Urdu (اردو)' },
  { code: 'Kannada', name: 'Kannada (ಕನ್ನಡ)' },
  { code: 'Odia', name: 'Odia (ଓଡ଼ିଆ)' },
  { code: 'Malayalam', name: 'Malayalam (മലയാളം)' },
  { code: 'Punjabi', name: 'Punjabi (ਪੰਜਾਬੀ)' },
  { code: 'Sanskrit', name: 'Sanskrit (संस्कृत)' }
];

export default function NoteInput({ currentTheme, onSynthesize, isLoading }: NoteInputProps) {
  const [notes, setNotes] = useState('');
  const [focusMode, setFocusMode] = useState('General Academic Mastery');
  const [length, setLength] = useState<'concise' | 'detailed'>('detailed');
  const [customFocus, setCustomFocus] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('Original');
  const [draftLang, setDraftLang] = useState('Hindi');
  const [isTranslatingDraft, setIsTranslatingDraft] = useState(false);
  const [translatingFileIdx, setTranslatingFileIdx] = useState<number | null>(null);
  
  // Multimodal up to 30 files array state!
  const [files, setFiles] = useState<{ data: string; mimeType: string; name: string; size: number }[]>([]);

  const handleTranslateFile = async (idx: number) => {
    const fileToTranslate = files[idx];
    if (!fileToTranslate) return;
    setTranslatingFileIdx(idx);
    try {
      const response = await fetch('/api/translate-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: {
            data: fileToTranslate.data,
            mimeType: fileToTranslate.mimeType,
            name: fileToTranslate.name,
          },
          targetLanguage: draftLang,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Document translation failed.');
      }
      setFiles((prev) => {
        const next = [...prev];
        next[idx] = {
          data: data.data,
          mimeType: data.mimeType,
          name: data.name,
          size: data.size,
        };
        return next;
      });
      setTargetLanguage(draftLang); // Auto-sync synthesize language target to translated file target
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error occurred while translating this document.');
    } finally {
      setTranslatingFileIdx(null);
    }
  };
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const hasNotes = notes.trim().length > 0;
    const hasFiles = files.length > 0;
    if (!hasNotes && !hasFiles) return;
    
    // We pass the files array directly so server can ingest all 30 files dynamically
    onSynthesize(notes, focusMode, length, null, files, targetLanguage);
  };

  const handleTranslateDraft = async () => {
    if (!notes.trim()) return;
    setIsTranslatingDraft(true);
    try {
      const response = await fetch('/api/translate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: notes,
          targetLanguage: draftLang,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Draft translation failed.');
      }
      setNotes(data.translated || notes);
      setTargetLanguage(draftLang); // Auto-sync synthesize language target to draft translation target
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error occurred while translating your draft.');
    } finally {
      setIsTranslatingDraft(false);
    }
  };

  const handleApplyPreset = (presetText: string, presetCategory: string) => {
    setNotes(presetText);
    setFocusMode(`${presetCategory} Specialization`);
  };

  const getWordCount = (text: string) => {
    if (!text.trim()) return 0;
    return text.trim().split(/\s+/).length;
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) {
      handleMultipleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleMultipleFiles = (targetFiles: File[]) => {
    if (!targetFiles || targetFiles.length === 0) return;

    // Filter duplicates and check bounds
    const uniqueIncoming = targetFiles.filter(
      (newF) => !files.some((existingF) => existingF.name === newF.name)
    );

    if (files.length + uniqueIncoming.length > 30) {
      alert(`Synthesis Restriction: You can only include up to 30 documents max in one session. Adding these would exceed your limit by ${files.length + uniqueIncoming.length - 30} files.`);
      return;
    }

    uniqueIncoming.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFiles((prev) => {
          if (prev.some((f) => f.name === file.name)) return prev;
          if (prev.length >= 30) return prev;
          return [
            ...prev,
            {
              data: reader.result as string,
              mimeType: file.type || 'application/octet-stream',
              name: file.name,
              size: file.size
            }
          ];
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleClearAllFiles = () => {
    setFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Dynamic branding attributes for any file format
  const getFileStyle = (fileName: string, mimeType: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    if (mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext || '')) {
      return {
        icon: ImageIcon,
        bgColor: 'bg-rose-50 border-rose-200 text-rose-600',
        badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
        label: 'IMAGE'
      };
    }
    if (ext === 'pdf') {
      return {
        icon: FileText,
        bgColor: 'bg-red-50 border-red-200 text-red-600',
        badgeColor: 'bg-red-100 text-red-800 border-red-300',
        label: 'PDF DOCUMENT'
      };
    }
    if (['txt', 'md', 'rtf'].includes(ext || '')) {
      return {
        icon: FileText,
        bgColor: 'bg-blue-50 border-blue-200 text-blue-600',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
        label: 'MARKDOWN TEXT'
      };
    }
    if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(ext || '') || mimeType.startsWith('audio/')) {
      return {
        icon: Music,
        bgColor: 'bg-amber-50 border-amber-200 text-amber-600',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
        label: 'AUDIO MATERIAL'
      };
    }
    if (['csv', 'xls', 'xlsx'].includes(ext || '')) {
      return {
        icon: FileText,
        bgColor: 'bg-emerald-50 border-emerald-200 text-emerald-600',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        label: 'DATA SPREADSHEET'
      };
    }
    if (['js', 'ts', 'jsx', 'tsx', 'py', 'json', 'html', 'css', 'cpp', 'c', 'java', 'go'].includes(ext || '')) {
      return {
        icon: FileText,
        bgColor: 'bg-violet-50 border-violet-200 text-violet-600',
        badgeColor: 'bg-violet-100 text-violet-800 border-violet-300',
        label: 'CODE SYNTAX'
      };
    }
    return {
      icon: File,
      bgColor: 'bg-slate-50 border-slate-200 text-slate-600',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
      label: 'ATTACHMENT'
    };
  };

  const hasNotesOrFiles = notes.trim().length > 0 || files.length > 0;
  const totalFilesSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div
      id="note-input-section"
      className={`p-6 md:p-8 rounded-xl ${
        currentTheme === 'minimal-light'
          ? 'border-3 border-black bg-white shadow-[6px_6px_0px_rgba(0,0,0,1)] rounded-none'
          : 'bg-card-bg/70 border border-border-accent/20 shadow-xl backdrop-blur-md'
      }`}
    >
      <div className="mb-6">
        <h2 className={`text-xl font-bold flex items-center gap-2 mb-2 ${
          currentTheme === 'minimal-light' ? 'text-black font-brutal font-extrabold' : 'text-text-primary font-display'
        }`}>
          <BookOpen className="w-5 h-5 text-accent-secondary" />
          Feed the Second Brain
        </h2>
        <p className={`text-sm ${
          currentTheme === 'minimal-light' ? 'text-slate-600' : 'text-text-secondary'
        }`}>
          Type your academic transcripts, or dump up to <strong>30 files of any format</strong> (PDF textbooks, audio lectures, whiteboard capture, spreadsheets, code files, and more).
        </p>
      </div>

      {/* Preset Inserts */}
      <div className="mb-6">
        <div className={`text-xs font-semibold uppercase tracking-wider mb-2.5 ${
          currentTheme === 'minimal-light' ? 'text-slate-800' : 'text-text-secondary/70'
        }`}>
          Quick Demoware Presets
        </div>
        <div className="flex flex-wrap gap-2">
          {NOTE_PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(p.notes, p.category)}
              className={`text-xs px-3 py-1.5 transition-all duration-200 cursor-pointer flex items-center gap-1 hover:scale-102 ${
                currentTheme === 'minimal-light'
                  ? 'border border-black bg-white hover:bg-slate-100 font-medium'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10 active:bg-white/15 rounded text-text-primary'
              }`}
            >
              <span>{p.title}</span>
              <span className="opacity-55 scale-90">{p.category}</span>
              <ArrowUpRight className="w-3 h-3 opacity-70" />
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT CONTAINER: Text typed notes (7 cols) */}
          <div className="lg:col-span-7 relative">
            <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
              <label className={`block text-xs font-semibold uppercase tracking-wider ${
                currentTheme === 'minimal-light' ? 'text-black font-brutal' : 'text-text-secondary'
              }`}>
                Typed Materials / Prompt Guidance
              </label>
              <div className={`flex items-center gap-1 p-1 rounded-md ${
                currentTheme === 'minimal-light' ? 'bg-slate-100 border border-black' : 'bg-black/35 border border-white/5'
              }`}>
                <span className={`text-[10px] font-mono font-bold uppercase px-0.5 ${
                  currentTheme === 'minimal-light' ? 'text-black' : 'text-text-secondary/70'
                }`}>Translate:</span>
                <select
                  value={draftLang}
                  onChange={(e) => setDraftLang(e.target.value)}
                  className={`text-[10px] font-bold font-mono bg-transparent py-0.5 px-1 border-none focus:outline-none focus:ring-0 cursor-pointer ${
                    currentTheme === 'minimal-light' ? 'text-black' : 'text-white'
                  }`}
                >
                  {INDIAN_LANGUAGES.filter(la => la.code !== 'Original').map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
                      {lang.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleTranslateDraft}
                  disabled={isTranslatingDraft || !notes.trim()}
                  className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 transition cursor-pointer ${
                    currentTheme === 'minimal-light'
                      ? 'bg-black text-white hover:bg-slate-800'
                      : 'bg-accent-primary hover:bg-pink-600 text-white'
                  } ${(!notes.trim() || isTranslatingDraft) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isTranslatingDraft ? 'Translating...' : 'Translate'}
                </button>
              </div>
            </div>
            <div className="relative">
              <textarea
                id="notes-dump-textarea"
                className={`w-full min-h-[300px] max-h-[600px] p-4 text-sm font-mono leading-relaxed transition-all duration-300 resize-y focus:outline-none ${
                  currentTheme === 'minimal-light'
                    ? 'border-2 border-black bg-white text-black font-semibold shadow-[3px_3px_0px_black] focus:bg-slate-50'
                    : 'bg-black/30 border border-white/10 text-text-primary focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 rounded-md placeholder-text-secondary/50 shadow-inner'
                }`}
                placeholder="Type your notes or provide instructions for the artificial synthesis provider here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isLoading}
              />
              <div className={`absolute bottom-3 right-3 text-xs font-mono px-2 py-1 rounded bg-black/40 border border-white/5 ${
                currentTheme === 'minimal-light' ? 'text-black border-slate-300 bg-slate-100 font-bold' : 'text-text-secondary'
              }`}>
                ~ {getWordCount(notes)} words
              </div>
            </div>
          </div>

          {/* RIGHT CONTAINER: 30 Files Drag & Drop Control Center (5 cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <label className={`block text-xs font-semibold uppercase tracking-wider ${
                currentTheme === 'minimal-light' ? 'text-black font-brutal' : 'text-text-secondary'
              }`}>
                Multimodal Documents Ingest ({files.length} / 30 Files)
              </label>
              {files.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllFiles}
                  className="text-[10px] font-mono font-bold text-red-500 hover:underline flex items-center gap-1 uppercase"
                >
                  <Trash2 className="w-3 h-3" /> Clear list
                </button>
              )}
            </div>
            
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center p-4 border-2 border-dashed transition-all duration-200 cursor-pointer min-h-[140px] relative text-center ${
                dragActive
                  ? 'border-accent-primary bg-accent-primary/5 scale-102'
                  : currentTheme === 'minimal-light'
                    ? 'border-black bg-white hover:bg-slate-50 shadow-[3px_3px_0px_black]'
                    : 'border-white/10 bg-black/25 hover:bg-black/35 hover:border-white/20'
              } rounded-md`}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                onChange={(e) => {
                  if (e.target.files) handleMultipleFiles(Array.from(e.target.files));
                }}
                disabled={isLoading}
              />

              <div className="space-y-2 pointer-events-none">
                <div className={`p-2.5 mx-auto w-10 h-10 rounded-full flex items-center justify-center ${
                  currentTheme === 'minimal-light' ? 'bg-slate-100 text-black' : 'bg-white/5 text-text-secondary'
                }`}>
                  <Upload className="w-4.5 h-4.5 text-[#00ff66]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-text-primary">Drag & Drop Documents Here</div>
                  <div className="text-[9px] text-text-secondary/70 mt-1 max-w-[240px] mx-auto leading-normal">
                    Compatible with PDF, JPEG, PNG, MP3, XLS, JSON, Text, CSV files (Max 30 documents allowed)
                  </div>
                </div>
              </div>
            </div>

            {/* Ingested Documents Live Inventory */}
            <div className={`flex-grow overflow-hidden flex flex-col justify-between ${
              files.length > 0 ? 'min-h-[200px]' : 'min-h-0'
            }`}>
              
              {files.length === 0 ? (
                <div className={`p-6 text-center border rounded flex flex-col items-center justify-center h-full border-dashed ${
                  currentTheme === 'minimal-light' ? 'border-black text-slate-400' : 'border-white/5 bg-black/10 text-text-secondary/40'
                }`}>
                  <Paperclip className="w-8 h-8 mb-2 opacity-35" />
                  <span className="text-[10px] font-mono font-medium uppercase tracking-wide">No External Dossiers Loaded</span>
                </div>
              ) : (
                <div className="space-y-3 flex-grow flex flex-col justify-between">
                  {/* File items list box */}
                  <div className="max-h-[190px] overflow-y-auto space-y-1.5 border border-white/5 p-1 rounded-md divide-y divide-white/5 pr-1.5">
                    {files.map((file, idx) => {
                      const fileStyle = getFileStyle(file.name, file.mimeType);
                      const TypeIcon = fileStyle.icon;
                      const isImage = file.mimeType.startsWith('image/');
                      
                      return (
                        <div 
                          key={idx}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 pt-2.5 border transition rounded text-black ${
                            currentTheme === 'minimal-light'
                              ? 'border-black bg-slate-50 rounded-none'
                              : 'bg-black/40 border-white/5 hover:border-white/15'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1 w-full">
                            {/* Left Thumbnail or standard visual indicator */}
                            <div className="flex-shrink-0">
                              {isImage ? (
                                <img 
                                  src={file.data} 
                                  alt="Preview" 
                                  className="w-8 h-8 object-cover rounded border border-black/25 bg-black"
                                />
                              ) : (
                                <div className={`w-8 h-8 rounded flex items-center justify-center border border-black/10 ${fileStyle.bgColor}`}>
                                  <TypeIcon className="w-4 h-4" />
                                </div>
                              )}
                            </div>

                            {/* Middle filename details info */}
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className={`text-xs font-bold font-mono tracking-tight truncate ${
                                currentTheme === 'minimal-light' ? 'text-black' : 'text-neutral-200'
                              }`} title={file.name}>
                                {file.name}
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[8px] font-mono py-0.5 px-1 bg-black/10 border border-black/10 text-slate-500 font-bold">
                                  {formatFileSize(file.size)}
                                </span>
                                <span className={`text-[8px] font-mono py-0.5 px-1 border font-black scale-95 ${fileStyle.badgeColor}`}>
                                  {fileStyle.label}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right actions container */}
                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <button
                              type="button"
                              disabled={translatingFileIdx !== null}
                              onClick={() => handleTranslateFile(idx)}
                              className={`p-1 px-2 text-[9px] uppercase font-mono font-bold border transition cursor-pointer rounded flex items-center gap-1 ${
                                currentTheme === 'minimal-light'
                                  ? 'bg-slate-100 hover:bg-black hover:text-white text-black border-slate-300 hover:border-black'
                                  : 'bg-black/30 hover:bg-[#00ff66] hover:text-black text-slate-300 border-white/20'
                              }`}
                              title={`Translate this file to ${draftLang}`}
                            >
                              {translatingFileIdx === idx ? (
                                <span className="animate-pulse text-amber-500 font-bold">Translating...</span>
                              ) : (
                                <span>🌐 Translate to {draftLang}</span>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveFile(idx)}
                              className="p-1 px-1.5 hover:bg-red-500 hover:text-white rounded text-red-400 border border-transparent transition cursor-pointer"
                              title="Purge attachment files"
                            >
                              ✖
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary footprint indicator */}
                  <div className={`p-2.5 border font-mono text-[9px] font-bold flex justify-between items-center ${
                    currentTheme === 'minimal-light' ? 'border-black bg-slate-100 text-black' : 'bg-black/30 border-white/5 text-[#00ff66]'
                  }`}>
                    <span className="uppercase">AGGREGATE STORAGE SIZE LOAD:</span>
                    <span>{formatFileSize(totalFilesSize)} (Max 50MB payload)</span>
                  </div>

                </div>
              )}

            </div>

          </div>

        </div>

        {/* Configurations Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Focus Mode Selection */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${
              currentTheme === 'minimal-light' ? 'text-black font-brutal' : 'text-text-secondary'
            }`}>
              Synthesis Focus Lens
            </label>
            {!customFocus ? (
              <select
                id="preset-focus-select"
                value={focusMode}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setCustomFocus(true);
                    setFocusMode('');
                  } else {
                    setFocusMode(e.target.value);
                  }
                }}
                disabled={isLoading}
                className={`w-full py-2.5 px-3 text-sm transition-all duration-300 focus:outline-none ${
                  currentTheme === 'minimal-light'
                    ? 'border-2 border-black bg-white font-semibold text-black shadow-[3px_3px_0px_black]'
                    : 'bg-black/40 border border-white/10 text-white rounded shadow-inner lg:h-[46px]'
                }`}
              >
                <option value="General Academic Mastery">General Academic Mastery</option>
                <option value="Core Conceptual Formulae & Math">Formulae & Math Principles Only</option>
                <option value="Biological / Physiological taxonomy">Biological & Scientific Taxonomy</option>
                <option value="Chronological & Historical Timelines">Chronology & Historic Factors</option>
                <option value="Engineering / High-level Programming concepts">Software Architecture & Logical Structures</option>
                <option value="custom">✍️ Design Custom Focus Lens...</option>
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  id="custom-focus-input"
                  type="text"
                  placeholder="e.g. Focus on mitochondrial chemistry..."
                  value={focusMode}
                  onChange={(e) => setFocusMode(e.target.value)}
                  disabled={isLoading}
                  className={`flex-1 px-3 py-2 text-sm focus:outline-none ${
                    currentTheme === 'minimal-light'
                      ? 'border-2 border-black bg-white font-semibold shadow-[3px_3px_0px_black]'
                      : 'bg-black/40 border border-white/10 text-white rounded shadow-inner'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => {
                    setCustomFocus(false);
                    setFocusMode('General Academic Mastery');
                  }}
                  className={`px-3 py-1 text-xs cursor-pointer ${
                    currentTheme === 'minimal-light'
                      ? 'border border-black bg-slate-100 text-black font-bold'
                      : 'bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded'
                  }`}
                >
                  Reset
                </button>
              </div>
            )}
          </div>

          {/* Depth / Output Length Selection */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${
              currentTheme === 'minimal-light' ? 'text-black font-brutal' : 'text-text-secondary'
            }`}>
              Cognitive Synthesis Depth
            </label>
            <div className="flex gap-3">
              {[
                { id: 'concise', name: 'Laser Concise', desc: 'Core bullet takeovers' },
                { id: 'detailed', name: 'Full Deep-Dive', desc: 'Granular definitions + flashcards' }
              ].map((lenOpt) => {
                const checked = length === lenOpt.id;
                return (
                  <button
                    key={lenOpt.id}
                    type="button"
                    onClick={() => setLength(lenOpt.id as any)}
                    disabled={isLoading}
                    className={`flex-1 text-left p-2 transition-all duration-300 border cursor-pointer focus:outline-none ${
                      checked
                        ? currentTheme === 'minimal-light'
                          ? 'border-2 border-black bg-black text-white hover:bg-black/90 shadow-[3px_3px_0px_rgba(0,0,0,1)]'
                          : 'border-accent-primary bg-accent-primary/10 text-white border-accent-primary'
                        : currentTheme === 'minimal-light'
                          ? 'border-2 border-slate-300 bg-white text-black hover:border-black shadow-[2px_2px_0px_rgba(0,0,0,0.15)]'
                          : 'border-white/10 bg-black/20 text-text-secondary hover:border-white/20'
                    }`}
                  >
                    <div className="text-xs font-bold font-display">{lenOpt.name}</div>
                    <div className="text-[10px] opacity-70 mt-0.5 line-clamp-1">{lenOpt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Select Indian Translation Language */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${
              currentTheme === 'minimal-light' ? 'text-black font-brutal' : 'text-text-secondary'
            }`}>
              🎯 Target Study Language
            </label>
            <select
              id="study-lang-dropdown"
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              disabled={isLoading}
              className={`w-full py-2.5 px-3 text-sm transition-all duration-300 focus:outline-none ${
                currentTheme === 'minimal-light'
                  ? 'border-2 border-black bg-white font-semibold text-black shadow-[3px_3px_0px_black]'
                  : 'bg-black/40 border border-white/10 text-white rounded shadow-inner lg:h-[46px]'
              }`}
            >
              {INDIAN_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
                  {lang.name}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-text-secondary opacity-75 mt-1.5 leading-relaxed font-mono">
              💡 Selecting a target language translates your uploaded notes, handwritten images, digitizer canvas drawings, text prompts, or files (PDFs, spreadsheets, textbook dumps) into the selected Indian language during synthesis & study guide packaging automatically.
            </p>
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-2 text-right">
          <button
            id="synthesize-notes-trigger-btn"
            type="submit"
            disabled={isLoading || !hasNotesOrFiles}
            className={`w-full md:w-auto px-8 py-4 text-base font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
              isLoading || !hasNotesOrFiles
                ? 'opacity-55 cursor-not-allowed'
                : ''
            } ${
              currentTheme === 'minimal-light'
                ? 'border-3 border-black bg-white shadow-[6px_6px_0px_rgba(0,0,0,1)] rounded-none hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[4px_4px_0px_rgba(0,0,0,1)] text-slate-950 font-brutal'
                : 'bg-gradient-to-r from-accent-primary to-accent-secondary border border-accent-primary/30 text-white rounded shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:brightness-110 hover:shadow-[0_0_30px_rgba(139,92,246,0.55)] hover:scale-101 active:scale-99'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Synthesizing Cognitive Map ({files.length} elements)...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 animate-pulse" />
                <span>Synthesize Note Matrix with {files.length} Attachments</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
