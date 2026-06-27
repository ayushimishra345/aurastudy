/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Brain, BookOpen, AlertTriangle, Flame, LayoutGrid, CheckCircle2,
  ListTodo, Cpu, ChevronRight, Menu, X, ArrowUpRight, Compass, Settings, Zap, History, ClipboardCheck
} from 'lucide-react';

import { StudyTheme, SynthesizedBrain, SavedBrainItem } from './types';
import ThemeSelector from './components/ThemeSelector';
import NoteInput from './components/NoteInput';
import DrawingCanvas from './components/DrawingCanvas';
import StudyDashboard from './components/StudyDashboard';
import AIPresenters from './components/AIPresenters';
import ActiveStudyTools from './components/ActiveStudyTools';
import CognitiveGames from './components/CognitiveGames';
import ProgressAnalytics from './components/ProgressAnalytics';
import ThemeCustomizer from './components/ThemeCustomizer';
import SynthesisView from './components/SynthesisView';
import SavedSessions from './components/SavedSessions';

// Instant highly informative default preset to make all 22 tabs immediately fully functional upon loading
const DEFAULT_PRESET_SYNTHESIS: SynthesizedBrain = {
  title: "🌿 Plant Photosynthesis",
  originalWordCount: 520,
  synthesizedWordCount: 180,
  overview: "Photosynthesis converts solar radiations into chemical energy carriers like ATP & NADPH, facilitating carbon fixation via the RuBisCO enzyme to produce carbohydrates.",
  concepts: [
    { concept: "Chlorophyll", definition: "Primary green pigment within chloroplasts that absorbs photons and splits water molecules in photolysis.", importance: "high" },
    { concept: "Calvin Cycle", definition: "The light-independent reactions occurring in stroma that assimilate carbon dioxide using ATP.", importance: "high" },
    { concept: "RuBisCO", definition: "Key enzyme involved in the first major step of carbon fixation, catalyzing CO2 reactions.", importance: "medium" },
    { concept: "Photolysis", definition: "The chemical process of splitting water molecules under the influence of light to release oxygen.", importance: "high" },
    { concept: "Adenosine Triphosphate (ATP)", definition: "The primary energy currency of biological cells, providing chemical power for synthesis.", importance: "high" },
    { concept: "NADPH", definition: "An electron carrier providing reduction power for carbon reactions inside the stroma.", importance: "medium" },
    { concept: "Stroma", definition: "The fluid-filled internal space of chloroplasts surrounding thylakoids where dark reactions occur.", importance: "low" },
    { concept: "Gglyceraldehyde-3-phosphate", definition: "A three-carbon sugar intermediate synthesized during Calvin cycles to construct glucose.", importance: "medium" }
  ],
  summaryPoints: [
    { title: "Light Capture", details: "Photons are caught by Chlorophyll, triggering electron cascade movements." },
    { title: "Water Splitting", details: "Photolysis splits water, producing gaseous Oxygen and H+ protons." },
    { title: "Chemical Loading", details: "Energy is loaded into ATP and NADPH carriers inside the thylakoid membranes." },
    { title: "Carbon Assimilation", details: "RuBisCO fixes carbon dioxide directly into organic compounds." },
    { title: "Sugar Exportation", details: "G3P sugars are exported to synthesize glucose starches for cellular respiration." }
  ],
  flashcards: [
    { question: "What is the primary green pigment that absorbs light in plants?", answer: "Chlorophyll" },
    { question: "Where do light-independent reactions of the Calvin Cycle occur?", answer: "In the Stroma fluid of the chloroplasts" },
    { question: "Which enzyme catalyzes the primary step of Carbon Fixation?", answer: "RuBisCO enzyme" },
    { question: "What process splits water molecules to produce oxygen byproduct?", answer: "Photolysis (light splitting)" },
    { question: "What is the primary molecular energy currency of living cells?", answer: "ATP (Adenosine Triphosphate)" }
  ],
  actionSteps: [
    "Recite the balanced chemical formula for glucose synthesis.",
    "Solve flashcard confidence rating exercises weekly.",
    "Map Chlorophyll inputs using the ASCII Topological Mind Map."
  ]
};

export default function App() {
  const [currentTheme, setCurrentTheme] = useState<StudyTheme>('modern-slate'); // Eye-friendly Slate Default
  const [mode, setMode] = useState<'front' | 'app'>('front'); // Landing Page first!
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Gamification stats
  const [xp, setXp] = useState<number>(1450); // Set to 1450 initially to unlock badges based on level criteria
  const [streak, setStreak] = useState<number>(14); // 🔥 14-day streak by default!
  
  // States for study synthesis data
  const [synthesis, setSynthesis] = useState<SynthesizedBrain>(DEFAULT_PRESET_SYNTHESIS);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedSessions, setSavedSessions] = useState<SavedBrainItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(undefined);
  const [studyLanguage, setStudyLanguage] = useState<string>('Original');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  // Load persistence configurations from localStorage on mount
  useEffect(() => {
    const storedHistory = localStorage.getItem('aurastudy_knowledge_vault');
    if (storedHistory) {
      try {
        setSavedSessions(JSON.parse(storedHistory));
      } catch (err) {
        console.error(err);
      }
    }
    const theme = localStorage.getItem('aurastudy_theme') as StudyTheme;
    if (theme && ['midnight', 'vaporwave', 'minimal-light', 'cyberpunk', 'forest', 'coffee', 'custom', 'modern-slate'].includes(theme)) {
      setCurrentTheme(theme);
    }
    const storedXp = localStorage.getItem('aurastudy_user_xp');
    if (storedXp) setXp(Number(storedXp));
    
    const storedStreak = localStorage.getItem('aurastudy_user_streak');
    if (storedStreak) setStreak(Number(storedStreak));
  }, []);

  const handleThemeChange = (theme: StudyTheme) => {
    setCurrentTheme(theme);
    localStorage.setItem('aurastudy_theme', theme);
  };

  const handleAddXp = (amount: number) => {
    setXp(prev => {
      const nextVal = prev + amount;
      localStorage.setItem('aurastudy_user_xp', String(nextVal));
      return nextVal;
    });
  };

  const handleAddStreak = () => {
    setStreak(prev => {
      const nextVal = prev + 1;
      localStorage.setItem('aurastudy_user_streak', String(nextVal));
      return nextVal;
    });
  };

  // Reassuring messages on loading screen for better UX
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % 4);
      }, 2500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const LOADING_MESSAGES = [
    "Decrypting lectures & structural fragments...",
    "Querying Gemini models to synthesize cognitive links...",
    "Reconstructuring active recall parameters & index guides...",
    "Pouring results securely into your Aura Study Suite..."
  ];

  // Call server-side API to synthesize notes
  const handleSynthesizeOnServer = async (
    notes: string,
    focusMode: string,
    length: 'concise' | 'detailed',
    image?: { data: string; mimeType: string } | null,
    files?: { data: string; mimeType: string; name: string }[] | null,
    targetLanguage?: string
  ) => {
    setIsLoading(true);
    setErrorMsg(null);
    setActiveSessionId(undefined);

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, focusMode, length, image, files, targetLanguage }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Cognitive processor encountered a system halt.');
      }

      setSynthesis(data);
      setStudyLanguage(targetLanguage || 'Original');
      handleAddXp(350); // Massive XP for compiling notes
      setActiveTab('dashboard'); // Jump straight to stats board
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Connecting to server failed. Ensure your API security credentials are set.');
    } finally {
      setIsLoading(false);
    }
  };

  // Implement dynamic translation of loaded synthesis
  const handleTranslateActiveNotes = async (targetLang: string) => {
    if (!synthesis) return;
    if (targetLang === 'Original') {
      // If original requested, can either remain as is or keep state updated
      setStudyLanguage('Original');
      return;
    }

    setIsTranslating(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ synthesis, targetLanguage: targetLang }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Translation provider reported an error.');
      }

      setSynthesis(data);
      setStudyLanguage(targetLang);

      // If viewing loaded session, sync translated status back to Local Vault securely
      if (activeSessionId) {
        setSavedSessions((prev) => {
          const updated = prev.map((s) => (s.id === activeSessionId ? { ...s, synthesis: data } : s));
          localStorage.setItem('aurastudy_knowledge_vault', JSON.stringify(updated));
          return updated;
        });
      }

      handleAddXp(150); // Reward active learning polyglot translation xp
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Dynamic translation requests failed. Ensure the server is online.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSaveToBrainVault = () => {
    const exists = savedSessions.find(
      (s) => s.synthesis.title === synthesis.title && s.synthesis.overview === synthesis.overview
    );
    if (exists) return;

    const newSession: SavedBrainItem = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      notesExcerpt: synthesis.overview.slice(0, 100) + '...',
      themeUsed: currentTheme,
      synthesis,
    };

    const updated = [newSession, ...savedSessions];
    setSavedSessions(updated);
    localStorage.setItem('aurastudy_knowledge_vault', JSON.stringify(updated));
    setActiveSessionId(newSession.id);
    handleAddXp(200);
  };

  const handleDeleteSession = (id: string) => {
    const updated = savedSessions.filter((s) => s.id !== id);
    setSavedSessions(updated);
    localStorage.setItem('aurastudy_knowledge_vault', JSON.stringify(updated));
    if (activeSessionId === id) {
      setActiveSessionId(undefined);
    }
  };

  const handleLoadSession = (session: SavedBrainItem) => {
    setSynthesis(session.synthesis);
    setActiveSessionId(session.id);
    setCurrentTheme(session.themeUsed);
    setErrorMsg(null);
    setActiveTab('dashboard');
  };

  // List of all grouped 22 features
  const sidebarSections = [
    {
      group: 'Home & Navigation',
      items: [
        { id: 'dashboard', name: '🏠 Dashboard' },
        { id: 'theme-builder', name: '🎨 Aesthetic Studio' }
      ]
    },
    {
      group: 'Notes Input Ingress',
      items: [
        { id: 'upload', name: '📄 Upload Notes / Presets' },
        { id: 'handwritten', name: '✏️ Whiteboard Paintboard' }
      ]
    },
    {
      group: 'AI Synthesis Tools',
      items: [
        { id: 'summary', name: '📖 Core Summaries' },
        { id: 'concepts', name: '⚡ Essential Concepts' },
        { id: 'mindmap', name: '🗺️ ASCII Mind Map' },
        { id: 'glossary', name: '📖 Glossary Terms' },
        { id: 'compare', name: '♊ Concept Comparators' },
        { id: 'explain', name: '💡 Explainer Engine' },
        { id: 'tagger', name: '🏷️ Smart Subject Tagger' },
        { id: 'examtips', name: '🎯 Exam Tips / Mnemonics' },
        { id: 'essay', name: '✍️ Essay Draft Writer' },
        { id: 'spacedrev', name: '📅 Spaced Repetition' },
        { id: 'studyplan', name: '🗓️ Day-by-Day Plan' },
        { id: 'translate', name: '🌐 Instant Translator' }
      ]
    },
    {
      group: 'Active Recall Tools',
      items: [
        { id: 'flashcards', name: '🎴 Flashcards deck' },
        { id: 'pomodoro', name: '⏱️ Pomodoro Clock' },
        { id: 'askai', name: '💬 AI Second Brain chat' }
      ]
    },
    {
      group: 'Synapse Arcade Games',
      items: [
        { id: 'game-guess', name: '🎮 Term Word Guess' },
        { id: 'game-fire', name: '⚡ Rapid Q&A Quiz' },
        { id: 'game-scramble', name: '🧩 Words Scramble' },
        { id: 'game-match', name: '🎴 Memory Match Pairs' },
        { id: 'game-tf', name: '❓ True / False Blitz' }
      ]
    },
    {
      group: 'Pedagogical Progress',
      items: [
        { id: 'analytics', name: '📊 Diagnostics Analytics' }
      ]
    }
  ];

  return (
    <div 
      id="root" 
      data-theme={currentTheme}
      className={`min-h-screen relative font-sans text-text-primary bg-bg-base overflow-x-hidden`}
    >

      {/* ======================= FRONT LANDING SCREEN ======================= */}
      <AnimatePresence>
        {mode === 'front' && (
          <motion.div
            key="landing-portal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-bg-base text-text-primary overflow-y-auto flex flex-col justify-between p-6 transition-colors duration-300"
          >
            {/* Grid background decoration */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

            {/* Quick action theme selection at top-right corner of landing page */}
            <div className="absolute top-4 right-4 z-50">
              <ThemeSelector currentTheme={currentTheme} onChangeTheme={handleThemeChange} />
            </div>

            <div className="max-w-4xl mx-auto w-full space-y-12 my-auto z-10 text-center select-none py-10">
              
              {/* Spinning Logo Badge */}
              <div className={`relative w-24 h-24 mx-auto mb-4 flex items-center justify-center border-4 bg-card-bg transition-all duration-300 ${
                currentTheme === 'minimal-light'
                  ? 'border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]'
                  : 'border-accent-secondary shadow-lg shadow-accent-primary/25'
              }`}>
                <Brain className="w-12 h-12 text-accent-primary animate-pulse" />
              </div>

              {/* Title & Slogans in bold display headings */}
              <div className="space-y-4">
                <h1 className="text-4xl md:text-7xl font-black tracking-tighter leading-none text-text-primary uppercase font-display">
                  AuraStudy
                </h1>
                <p className="text-sm md:text-xl font-mono text-accent-secondary uppercase tracking-widest font-bold">
                  ⚡ THE DECENTRALIZED COGNITIVE "SECOND BRAIN" STUDY SUITE ⚡
                </p>
              </div>

              <p className="max-w-2xl mx-auto text-xs md:text-xs font-mono text-text-secondary leading-relaxed opacity-90 border-l-2 border-accent-primary pl-4 text-center">
                Inject massive lecture pdf text or handwritten blackboard scans. Our system generates ASCII topological maps, active flashcards, spaced recollection rosters, and interactive arcade games entirely local-first.
              </p>

              {/* Enter Button */}
              <div>
                <button
                  onClick={() => setMode('app')}
                  className={`px-10 py-5 font-black text-sm md:text-base uppercase tracking-widest transition-all duration-200 cursor-pointer text-center ${
                    currentTheme === 'minimal-light'
                      ? 'bg-black text-white border-3 border-black shadow-[6px_6px_0px_rgba(0,0,0,0.15)] hover:bg-slate-900'
                      : 'bg-accent-primary text-bg-base hover:opacity-90 shadow-md hover:scale-102 hover:shadow-lg'
                  }`}
                >
                  ENTER THE COGNITIVE MATRIX ⏵
                </button>
              </div>

              {/* Feature Highlight Bento */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto pt-6">
                {[
                  { icon: '📝', label: 'Whiteboard Ink' },
                  { icon: '🧠', label: '12 AI Microtools' },
                  { icon: '⏱️', label: 'XP Pomodoro Block' },
                  { icon: '🎮', label: '5 Arcade Games' }
                ].map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 border text-center font-mono transition-colors duration-300 ${
                      currentTheme === 'minimal-light'
                        ? 'border-black bg-white text-black'
                        : 'border-border-accent/40 bg-card-bg/50 text-text-primary shadow-sm'
                    }`}
                  >
                    <span className="text-xl block">{item.icon}</span>
                    <span className="text-[10px] font-black uppercase tracking-wider block mt-1.5">{item.label}</span>
                  </div>
                ))}
              </div>

            </div>

            {/* Micro Credit footer */}
            <div className="text-center z-10 select-none space-y-1">
              <p className="text-[10px] uppercase font-mono tracking-widest font-bold text-text-secondary">
                Co-Created & Engineered with 💖 by <span className="text-accent-secondary">Ayushi</span> & <span className="text-accent-primary">Deepanshi</span>
              </p>
              <p className="text-[8px] opacity-40 uppercase font-mono tracking-widest text-text-secondary">
                AuraStudy System Terminal v3.2.0 • Sandbox Compliant
              </p>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================= CORE INTERACTIVE APPLICATION ======================= */}
      <div className="flex min-h-screen relative">
        
        {/* Backdrop for Mobile Sidebar Drawer */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
            />
          )}
        </AnimatePresence>

        {/* SIDEBAR NAVIGATION MENUS */}
        <aside 
          className={`fixed top-0 bottom-0 left-0 z-50 md:sticky md:top-0 h-screen transition-all duration-300 flex flex-col justify-between ${
            mobileSidebarOpen ? 'translate-x-0 w-72 max-w-[85vw]' : '-translate-x-full md:translate-x-0'
          } ${
            sidebarOpen ? 'md:w-64' : 'md:w-0 md:overflow-hidden md:border-none'
          } ${
            currentTheme === 'minimal-light'
              ? 'border-r-3 border-black bg-white text-black'
              : 'border-r border-border-accent/30 bg-card-bg/95 text-text-primary'
          }`}
        >
          <div className="p-4 space-y-6 overflow-y-auto select-none" style={{ maxHeight: 'calc(100vh - 120px)' }}>
            
            {/* Logo area with responsive close trigger */}
            <div className={`flex items-center justify-between pb-4 border-b ${
              currentTheme === 'minimal-light' ? 'border-black' : 'border-border-accent/30'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`p-1 border ${
                  currentTheme === 'minimal-light' ? 'border border-black bg-black text-white' : 'border-accent-primary/30 bg-black/40 text-accent-primary'
                }`}>
                  <Brain className="w-5 h-5 animate-pulse" />
                </div>
                <span className="font-display font-black tracking-tight text-sm uppercase">AURA CORE CONTROL</span>
              </div>
              <button 
                onClick={() => setMobileSidebarOpen(false)}
                className={`p-1 border hover:bg-red-500 hover:text-white rounded md:hidden ${
                  currentTheme === 'minimal-light' ? 'border-black text-black' : 'border-white/10 text-slate-400'
                }`}
                title="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sidebar segments */}
            <div className="space-y-4">
              {sidebarSections.map((sect, sIdx) => (
                <div key={sIdx} className="space-y-1.5">
                  <h4 className="text-[9px] font-bold font-mono tracking-widest uppercase text-accent-primary">
                    {sect.group}
                  </h4>
                  <div className="space-y-1">
                    {sect.items.map((item) => {
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            setMobileSidebarOpen(false);
                          }}
                          className={`w-full text-left p-2.5 font-mono font-bold text-[10px] uppercase transition cursor-pointer flex items-center justify-between ${
                            isActive 
                              ? currentTheme === 'minimal-light'
                                ? 'bg-black text-white border border-black shadow-[2px_2px_0px_black]'
                                : 'bg-accent-primary/10 text-accent-primary border border-accent-primary/35 shadow-sm'
                              : currentTheme === 'minimal-light'
                                ? 'bg-transparent border border-transparent text-slate-700 hover:bg-slate-100'
                                : 'bg-transparent border border-transparent text-text-secondary hover:bg-white/5 hover:text-text-primary'
                          }`}
                        >
                          <span>{item.name}</span>
                          {isActive && <ChevronRight className="w-3 h-3" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Saved Sessions list in sidebar footer */}
          <div className={`p-4 border-t space-y-3 ${
            currentTheme === 'minimal-light' ? 'bg-slate-50 border-black' : 'bg-black/20 border-border-accent/30'
          }`}>
            <h5 className="text-[9px] font-mono font-bold uppercase flex items-center gap-1 text-accent-secondary">
              <History className="w-3.5 h-3.5" />
              Brain Archives ({savedSessions.length})
            </h5>
            
            <div className="space-y-1 px-1 overflow-y-auto max-h-[140px]">
              {savedSessions.length === 0 ? (
                <div className="text-[9px] font-mono italic text-text-secondary/60">Archive empty. Synthesize notes and hit save.</div>
              ) : (
                savedSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => {
                      handleLoadSession(session);
                      setMobileSidebarOpen(false);
                    }}
                    className={`p-1.5 border text-[9px] font-mono truncate transition cursor-pointer flex justify-between items-center ${
                      activeSessionId === session.id 
                        ? currentTheme === 'minimal-light'
                          ? 'bg-slate-200 border-black font-extrabold'
                          : 'bg-accent-primary/15 border-accent-primary text-text-primary w-full'
                        : currentTheme === 'minimal-light'
                          ? 'border-slate-300 hover:border-black text-slate-800'
                          : 'border-white/5 hover:border-white/20 text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <span className="truncate">{session.synthesis.title}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }}
                      className="p-0.5 hover:scale-110 text-red-400 font-bold ml-1 text-[11px]"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* MAIN BODY LAYOUT */}
        <div className="flex-grow flex flex-col justify-between">
          
          {/* Main Top Navigation Header */}
          <nav className={`p-4 border-b-3 text-text-primary bg-card-bg flex items-center justify-between select-none z-30 transition-colors duration-300 ${
            currentTheme === 'minimal-light'
              ? 'border-black shadow-[0_3px_0px_black] bg-white text-black'
              : 'border-border-accent/40 shadow-md'
          }`}>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (window.innerWidth >= 768) {
                    setSidebarOpen(!sidebarOpen);
                  } else {
                    setMobileSidebarOpen(true);
                  }
                }}
                className={`p-2 border-2 transition hover:opacity-85 cursor-pointer ${
                  currentTheme === 'minimal-light'
                    ? 'border-black bg-slate-50 hover:bg-slate-100 text-black'
                    : 'border-border-accent/50 bg-black/30 text-text-primary'
                }`}
                title="Toggle Sidebar Map"
              >
                <Menu className="w-4.5 h-4.5" />
              </button>
              
              <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setMode('front')}>
                <Brain className="w-5.5 h-5.5 text-accent-primary animate-pulse" />
                <span className="font-display font-black tracking-tight text-base uppercase text-text-primary">AuraStudy</span>
                <span className={`hidden sm:inline-flex items-center gap-1 text-[8px] font-mono px-2 py-0.5 border font-extrabold rotate-2 hover:rotate-0 transition duration-150 shadow-md ${
                  currentTheme === 'minimal-light'
                    ? 'bg-black text-white border-black'
                    : 'bg-accent-primary/10 text-accent-primary border-accent-primary/30'
                }`}>
                  🚀 CO-AUTHORED BY AD: AYUSHI & DEEPANSHI
                </span>
              </div>
            </div>

            {/* Scoreboard items */}
            <div className="flex items-center gap-4">
              
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-bold p-1 border ${
                  currentTheme === 'minimal-light' 
                    ? 'bg-[#00ff66] border-black text-black' 
                    : 'bg-accent-secondary/15 border-accent-secondary/30 text-accent-secondary'
                }`}>
                  LVL Math: {Math.floor(xp / 300) + 42}
                </span>
                <span className={`text-[10px] font-mono font-black p-1 flex items-center gap-0.5 border ${
                  currentTheme === 'minimal-light'
                    ? 'bg-yellow-300 border-black text-black'
                    : 'bg-accent-primary/15 border-accent-primary/30 text-accent-primary'
                }`}>
                  🔥 {streak}D STREAK
                </span>
              </div>

              <ThemeSelector currentTheme={currentTheme} onChangeTheme={handleThemeChange} />
            </div>
          </nav>

          {/* CORE AREA MAIN VIEWS ROUTER */}
          <main className="p-4 md:p-8 flex-grow max-w-6xl w-full mx-auto space-y-8">
            
            {/* FLOATING SYSTEM ERROR ALERTS */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-4 border-3 border-red-500 bg-red-50 text-red-950 font-mono text-xs font-bold leading-relaxed flex items-start gap-3"
                >
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-grow">
                    <div>System Ingress Blocked:</div>
                    <p className="font-semibold text-slate-800 text-[11px] mt-1">{errorMsg}</p>
                  </div>
                  <button onClick={() => setErrorMsg(null)} className="font-bold underline text-[10px]">DISMISS</button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* RENDER CURRENT RELEVANT ACTIVE VIEW */}
            
            {/* 1. DASHBOARD OVERVIEW VIEW */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <StudyDashboard
                  currentTheme={currentTheme}
                  xp={xp}
                  onAddXp={handleAddXp}
                  streak={streak}
                  onAddStreak={handleAddStreak}
                  setActiveTab={setActiveTab}
                  noteCount={savedSessions.length + 1}
                />
                
                {synthesis && (
                  <SynthesisView
                    currentTheme={currentTheme}
                    synthesis={synthesis}
                    onSaveToBrain={handleSaveToBrainVault}
                    isSaved={!!savedSessions.find(s => s.synthesis.title === synthesis.title && s.synthesis.overview === synthesis.overview)}
                    onTranslate={handleTranslateActiveNotes}
                    isTranslating={isTranslating}
                    currentLanguage={studyLanguage}
                  />
                )}
              </div>
            )}

            {/* 2. UPLOAD NOTES / INGEST */}
            {activeTab === 'upload' && (
              <div className="space-y-4">
                <div className={`flex items-center justify-between pb-2 border-b ${
                  currentTheme === 'minimal-light' ? 'border-black' : 'border-border-accent/40'
                }`}>
                  <h3 className="font-display font-extrabold text-sm uppercase">Upload & Synthesize Note Materials</h3>
                  {synthesis && (
                    <button
                      onClick={handleSaveToBrainVault}
                      className={`px-3 py-1 font-mono uppercase text-[10px] border cursor-pointer flex items-center gap-1.5 transition ${
                        currentTheme === 'minimal-light'
                          ? 'bg-black text-[#00ff66] border-black shadow-[2px_2px_0px_black]'
                          : 'bg-accent-primary/10 text-accent-primary border-accent-primary/30 hover:bg-accent-primary/20 shadow-sm'
                      }`}
                    >
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      <span>Archive to vault</span>
                    </button>
                  )}
                </div>
                <NoteInput
                  currentTheme={currentTheme}
                  onSynthesize={handleSynthesizeOnServer}
                  isLoading={isLoading}
                />
              </div>
            )}

            {/* 3. DRAWING PAINTBOARD CANVAS */}
            {activeTab === 'handwritten' && (
              <div className="space-y-4">
                <div className={`border-b pb-2 ${
                  currentTheme === 'minimal-light' ? 'border-black' : 'border-border-accent/40'
                }`}>
                  <h3 className="font-display font-extrabold text-sm uppercase">Whiteboard / Slate Drawing capture</h3>
                  <p className="text-xs text-text-secondary font-bold font-mono">DRAW FORMULAE OR METRICS & TRANSCRIBE INSTANTLY</p>
                </div>
                <DrawingCanvas
                  currentTheme={currentTheme}
                  onInsertTranscription={(txt) => {
                    // Load transcription text directly into local notes session
                    alert(`Digitized successfully!\nInserted: "${txt.slice(0, 50)}..."`);
                  }}
                />
              </div>
            )}

            {/* 4. AI PRESENTERS (MAPPED TO CATEGORICAL ID STATES - 12 AI TOOLS) */}
            {[
              'summary', 'concepts', 'mindmap', 'glossary', 'compare', 
              'explain', 'tagger', 'examtips', 'essay', 'spacedrev', 
              'studyplan', 'translate'
            ].includes(activeTab) && (
              <AIPresenters
                currentTheme={currentTheme}
                synthesis={synthesis}
                activeFeatureTab={activeTab}
              />
            )}

            {/* 5. PASSIVE FLASHCARD / STUDY ACTIONS - 3 MODULAR ITEMS */}
            {['flashcards', 'pomodoro', 'askai'].includes(activeTab) && (
              <ActiveStudyTools
                currentTheme={currentTheme}
                synthesis={synthesis}
                activeFeatureTab={activeTab}
                onAddXp={handleAddXp}
                onAddStreak={handleAddStreak}
              />
            )}

            {/* 6. COGNITIVE mini arcade arcade arcade GAMES - 5 SECTIONS */}
            {['game-guess', 'game-scramble', 'game-match', 'game-tf', 'game-fire'].includes(activeTab) && (
              <CognitiveGames
                currentTheme={currentTheme}
                synthesis={synthesis}
                activeGameId={activeTab}
                onAddXp={handleAddXp}
              />
            )}

            {/* 7. DIAGNOSTICS PROGRESS METRICS BAR */}
            {activeTab === 'analytics' && (
              <ProgressAnalytics
                currentTheme={currentTheme}
                xp={xp}
                streak={streak}
                noteCount={savedSessions.length + 1}
              />
            )}

            {/* 7.5 LOCAL SAVED SECOND BRAIN VAULT */}
            {activeTab === 'mynotes' && (
              <SavedSessions
                currentTheme={currentTheme}
                sessions={savedSessions}
                onLoadSession={handleLoadSession}
                onDeleteSession={handleDeleteSession}
                activeSessionId={activeSessionId}
              />
            )}

            {/* 8. AESTHETIC STUDIO THEME BUILDER */}
            {activeTab === 'theme-builder' && (
              <ThemeCustomizer
                currentTheme={currentTheme}
                onChangeTheme={handleThemeChange}
              />
            )}

          </main>

          {/* Bottom layout navigation toolbar for mobile/responsive sizes */}
          <footer className={`p-4 border-t-3 text-text-primary bg-card-bg flex flex-col items-center justify-between border-b gap-3 select-none text-center transition-colors duration-300 ${
            currentTheme === 'minimal-light'
              ? 'border-black bg-white'
              : 'border-border-accent/40'
          }`}>
            <p className="text-[9px] font-mono font-bold text-text-secondary uppercase tracking-tight">
              AuraStudy Second Brain Cognitive Terminal • Engineered for Ayushi and Deepanshi
            </p>
          </footer>

        </div>
      </div>

      {/* BACKEND ASYNC PROGRESS LOADING MODAL PANEL */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none"
          >
            <div className={`p-8 max-w-sm w-full bg-card-bg text-text-primary text-center relative border transition-all duration-300 ${
              currentTheme === 'minimal-light' 
                ? 'border-3 border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] bg-white text-black animate-none' 
                : 'border-border-accent/40 shadow-xl shadow-black/40'
            }`}>
              
              <div className={`relative w-16 h-16 mx-auto mb-4 flex items-center justify-center border ${
                currentTheme === 'minimal-light' 
                  ? 'border-2 border-black bg-[#ffff00] text-black' 
                  : 'border-accent-primary/20 bg-accent-primary/15 text-accent-primary'
              }`}>
                <Brain className="w-8 h-8 animate-bounce" />
              </div>

              <h3 className="font-display font-extrabold text-sm uppercase mb-1">Expanding Synapse Matrix</h3>
              <p className="font-mono text-[10px] text-accent-primary font-bold min-h-[40px] px-3 leading-relaxed">
                {LOADING_MESSAGES[loadingStep]}
              </p>

              {/* Progress gauge animation */}
              <div className={`w-full border h-3 mt-4 overflow-hidden ${
                currentTheme === 'minimal-light' ? 'border-black bg-slate-200' : 'border-border-accent/30 bg-black/40'
              }`}>
                <div 
                  className={`h-full transition-all duration-700 ${
                    currentTheme === 'minimal-light' ? 'bg-black' : 'bg-accent-primary'
                  }`}
                  style={{ width: `${(loadingStep + 1) * 25}%` }}
                />
              </div>

              <div className="text-[8px] font-mono text-text-secondary/70 mt-2">
                OLLAMA/GEMINI COGNITIVE INGRESS LAYER • PHASE {loadingStep + 1} OF 4
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
