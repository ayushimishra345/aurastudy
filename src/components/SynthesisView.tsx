/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Brain, CheckCircle, Zap, HelpCircle, 
  Copy, Check, FileText, ChevronRight, ChevronLeft, Bookmark, 
  Flame, Award, RotateCcw, ThumbsUp, ThumbsDown, Layers, Grid, Play, AlertCircle
} from 'lucide-react';
import { SynthesizedBrain, StudyTheme } from '../types';

interface SynthesisViewProps {
  currentTheme: StudyTheme;
  synthesis: SynthesizedBrain;
  onSaveToBrain?: () => void;
  isSaved?: boolean;
  onTranslate?: (targetLang: string) => void;
  isTranslating?: boolean;
  currentLanguage?: string;
}

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
  { code: 'Odia', name: 'Odia (ଓડ଼ିଆ)' },
  { code: 'Malayalam', name: 'Malayalam (മലയാളം)' },
  { code: 'Punjabi', name: 'Punjabi (ਪੰਜਾਬੀ)' },
  { code: 'Sanskrit', name: 'Sanskrit (संस्कृत)' }
];

export default function SynthesisView({ 
  currentTheme, 
  synthesis, 
  onSaveToBrain, 
  isSaved,
  onTranslate,
  isTranslating,
  currentLanguage = 'Original'
}: SynthesisViewProps) {
  const [activeTab, setActiveTab] = useState<'blueprint' | 'concepts' | 'recall' | 'rapidfire' | 'roadmap'>('blueprint');
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});

  // Slideshow Recall States
  const [cardViewMode, setCardViewMode] = useState<'slideshow' | 'grid'>('slideshow');
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [slideshowFlipped, setSlideshowFlipped] = useState(false);

  // Rapid Fire Game States
  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'revealed' | 'finished'>('idle');
  const [gameCardIndex, setGameCardIndex] = useState(0);
  const [gameScore, setGameScore] = useState(0);
  const [gameStreak, setGameStreak] = useState(0);
  const [gameMaxStreak, setGameMaxStreak] = useState(0);
  const [gameTimeLeft, setGameTimeLeft] = useState(15);
  const [gameAnswersHistory, setGameAnswersHistory] = useState<Array<{ question: string; answer: string; wasCorrect: boolean }>>([]);

  const flashcards = synthesis.flashcards && synthesis.flashcards.length > 0 
    ? synthesis.flashcards 
    : [
        { question: "Define core synthesis mapping", answer: "A structured representation of technical material for higher logical indexing." }
      ];

  // Game timer loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTab === 'rapidfire' && gameStatus === 'playing') {
      interval = setInterval(() => {
        setGameTimeLeft((prev) => {
          if (prev <= 1) {
            setGameStatus('revealed');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab, gameStatus]);

  const handleFlip = (idx: number) => {
    setFlippedCards((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleCopySection = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(label);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const toggleStep = (idx: number) => {
    setCheckedSteps((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  // Next and Prev functions for slideshow flashcards
  const handleNextSlideshowCard = () => {
    setSlideshowFlipped(false);
    setSlideshowIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrevSlideshowCard = () => {
    setSlideshowFlipped(false);
    setSlideshowIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  // Rapid Fire Game Logic
  const handleStartGame = () => {
    setGameStatus('playing');
    setGameCardIndex(0);
    setGameScore(0);
    setGameStreak(0);
    setGameMaxStreak(0);
    setGameTimeLeft(15);
    setGameAnswersHistory([]);
  };

  const handleRevealGameAnswer = () => {
    setGameStatus('revealed');
  };

  const handleScoreCard = (correct: boolean) => {
    const isCompleted = gameCardIndex + 1 >= flashcards.length;
    
    // Streak tracking
    const newStreak = correct ? gameStreak + 1 : 0;
    if (newStreak > gameMaxStreak) {
      setGameMaxStreak(newStreak);
    }
    setGameStreak(newStreak);

    // Score: 10 base points + streak bonus!
    const points = correct ? 10 + (newStreak * 3) : 0;
    setGameScore((prev) => prev + points);

    // Track historical card performance
    setGameAnswersHistory((prev) => [
      ...prev,
      {
        question: flashcards[gameCardIndex].question,
        answer: flashcards[gameCardIndex].answer,
        wasCorrect: correct
      }
    ]);

    if (isCompleted) {
      setGameStatus('finished');
    } else {
      setGameCardIndex((prev) => prev + 1);
      setGameTimeLeft(15);
      setGameStatus('playing');
    }
  };

  const getRankBadgeAndName = (score: number) => {
    const maxPoss = flashcards.length * 10;
    const ratio = maxPoss > 0 ? score / maxPoss : 0;
    if (ratio >= 0.9) return { badge: '👑 Overlord', name: 'Synaptic Overlord' };
    if (ratio >= 0.7) return { badge: '🚀 Pioneer', name: 'Cognitive Pioneer' };
    if (ratio >= 0.4) return { badge: '📝 Apprentice', name: 'Scholar Apprentice' };
    return { badge: '🪐 Explorer', name: 'Synapse Explorer' };
  };

  // Generate markdown-formatted representation for easy study
  const getFullMarkdown = () => {
    let md = `# ${synthesis.title}\n\n`;
    md += `## Overview\n${synthesis.overview}\n\n`;
    md += `## Key Concepts\n`;
    synthesis.concepts.forEach(c => {
      md += `- **${c.concept}** [Importance: ${c.importance.toUpperCase()}]: ${c.definition}\n`;
    });
    md += `\n## Core Blueprint\n`;
    synthesis.summaryPoints.forEach(p => {
      md += `### ${p.title}\n${p.details}\n\n`;
    });
    md += `## Active Recall Flashcards\n`;
    flashcards.forEach((f, idx) => {
      md += `Q${idx+1}: ${f.question}\nA${idx+1}: ${f.answer}\n\n`;
    });
    md += `## Recommended Roadmap\n`;
    synthesis.actionSteps.forEach(s => {
      md += `- [ ] ${s}\n`;
    });
    return md;
  };

  const compressionRatio = synthesis.originalWordCount > 0 
    ? Math.round((1 - (synthesis.synthesizedWordCount / synthesis.originalWordCount)) * 100)
    : 0;

  return (
    <div
      id="synthesis-view-card"
      className={`transition-all duration-500 rounded-xl overflow-hidden ${
        currentTheme === 'minimal-light'
          ? 'border-3 border-black bg-white shadow-[8px_8px_0px_rgba(0,0,0,1)] rounded-none'
          : 'bg-card-bg/60 border border-border-accent/30 shadow-2xl backdrop-blur-md'
      }`}
    >
      {/* Top Banner & Metadata Metrics */}
      <div className={`p-6 border-b ${
        currentTheme === 'minimal-light' ? 'border-b-3 border-black bg-slate-100' : 'border-b-white/10 bg-black/35'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] uppercase tracking-widest font-mono px-2 py-0.5 rounded ${
                currentTheme === 'minimal-light'
                  ? 'border border-black bg-black text-white font-bold'
                  : 'bg-accent-primary/20 text-accent-primary border border-accent-primary/30'
              }`}>
                Aura Synthesis Matrix Complete
              </span>
            </div>
            <h1 className={`text-2xl md:text-3xl font-black font-display tracking-tight ${
              currentTheme === 'minimal-light' ? 'text-black font-brutal leading-normal' : 'text-text-primary'
            }`}>
              {synthesis.title}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onTranslate && (
              <div className="flex items-center gap-1.5" id="translating-indicator-wrapper">
                <select
                  id="active-translation-selector"
                  value={currentLanguage}
                  onChange={(e) => onTranslate(e.target.value)}
                  disabled={isTranslating}
                  className={`text-xs h-9 px-2.5 transition-all duration-300 focus:outline-none focus:ring-1 cursor-pointer ${
                    currentTheme === 'minimal-light'
                      ? 'border-2 border-black bg-white text-black font-semibold'
                      : 'bg-black/35 border border-white/10 text-white rounded focus:border-accent-primary focus:ring-accent-primary/20'
                  }`}
                  title="Translate study guides instantly into major Indian regional languages"
                >
                  <option value="" disabled>Translate Guide...</option>
                  {INDIAN_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-slate-900 text-white text-xs">
                      {lang.code === 'Original' ? 'Original / English' : `${lang.name}`}
                    </option>
                  ))}
                </select>
                {isTranslating && (
                  <div className="flex items-center gap-1 font-mono text-[10px] text-accent-secondary animate-pulse">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-secondary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-secondary"></span>
                    </span>
                    <span>Translating...</span>
                  </div>
                )}
              </div>
            )}

            {onSaveToBrain && (
              <button
                id="save-brain-btn"
                onClick={onSaveToBrain}
                className={`px-4 py-2 text-xs font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                  isSaved
                    ? currentTheme === 'minimal-light'
                      ? 'bg-slate-200 border-2 border-slate-400 text-slate-500 rounded-none'
                      : 'bg-green-500/10 border border-green-500/50 text-green-400'
                    : currentTheme === 'minimal-light'
                      ? 'border-2 border-black bg-white shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[1px_1px_0px_rgba(0,0,0,1)] text-black'
                      : 'border border-accent-primary bg-accent-primary/10 hover:bg-accent-primary text-white hover:shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                <span>{isSaved ? 'Vaulted In Second Brain' : 'Vault to Second Brain'}</span>
              </button>
            )}

            <button
              id="copy-md-btn"
              onClick={() => handleCopySection(getFullMarkdown(), 'Full Study Guide')}
              className={`px-4 py-2 text-xs font-semibold transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                currentTheme === 'minimal-light'
                  ? 'border-2 border-black bg-slate-100 text-black hover:bg-slate-200'
                  : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
              }`}
            >
              {copiedSection === 'Full Study Guide' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Markdown</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Compression Visual Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6">
          <div className={`p-3 rounded border ${
            currentTheme === 'minimal-light' ? 'border-black bg-white' : 'border-white/5 bg-black/25'
          }`}>
            <div className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold font-display">Source Length</div>
            <div className="text-sm font-black font-mono mt-0.5">{synthesis.originalWordCount || 'N/A'} <span className="text-[9px] font-normal opacity-60">words</span></div>
          </div>
          <div className={`p-3 rounded border ${
            currentTheme === 'minimal-light' ? 'border-black bg-white' : 'border-white/5 bg-black/25'
          }`}>
            <div className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold font-display">Synthesis Length</div>
            <div className="text-sm font-black font-mono mt-0.5">{synthesis.synthesizedWordCount || 'N/A'} <span className="text-[9px] font-normal opacity-60">words</span></div>
          </div>
          <div className={`p-3 rounded border ${
            currentTheme === 'minimal-light' ? 'border-black bg-white' : 'border-white/5 bg-black/25'
          }`}>
            <div className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold font-display">Cognitive Density</div>
            <div className="text-sm font-black font-mono mt-0.5 text-accent-secondary">+{compressionRatio || '50'}% <span className="text-[9px] font-normal opacity-75">lighter</span></div>
          </div>
          <div className={`p-3 rounded border ${
            currentTheme === 'minimal-light' ? 'border-black bg-white' : 'border-white/5 bg-black/25'
          }`}>
            <div className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold font-display">Ready Cards</div>
            <div className="text-sm font-black font-mono mt-0.5 text-accent-primary">{flashcards.length} <span className="text-[9px] font-normal opacity-60">metrics</span></div>
          </div>
          <div className={`p-3 rounded border ${
            currentTheme === 'minimal-light' ? 'border-black bg-white' : 'border-white/5 bg-black/25'
          } col-span-2 sm:col-span-1`}>
            <div className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold font-display">Simulator Rank</div>
            <div className="text-sm font-black font-mono mt-0.5 text-green-400">
              {getRankBadgeAndName(gameScore).badge}
            </div>
          </div>
        </div>
      </div>

      {/* Synthesis Overview Card */}
      <div className={`p-6 border-b ${
        currentTheme === 'minimal-light' ? 'border-b-2 border-black bg-amber-50/30' : 'border-b-white/5 bg-white/[0.01]'
      }`}>
        <div className="flex items-start gap-3">
          <Brain className={`w-5 h-5 mt-1 text-accent-primary flex-shrink-0 ${currentTheme === 'midnight' ? 'animate-pulse' : ''}`} />
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-display mb-1">Executive Summary</div>
            <p className={`text-xs md:text-sm leading-relaxed ${
              currentTheme === 'minimal-light' ? 'text-slate-800' : 'text-slate-200'
            }`}>
              {synthesis.overview}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Tabs */}
      <div className={`flex flex-wrap border-b text-xs md:text-sm font-bold ${
        currentTheme === 'minimal-light' ? 'border-b-3 border-black bg-slate-50' : 'border-b-white/10 bg-black/10'
      }`}>
        {[
          { id: 'blueprint', name: 'Takeaway Blueprint', icon: FileText },
          { id: 'concepts', name: 'Concepts Matrix', icon: Zap },
          { id: 'recall', name: 'Recall Slideshow', icon: HelpCircle },
          { id: 'rapidfire', name: 'Rapid Fire Quiz ⚡', icon: Flame },
          { id: 'roadmap', name: 'System Roadmap', icon: CheckCircle },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setSlideshowFlipped(false);
              }}
              className={`flex-1 min-w-[120px] py-4 px-3 flex items-center justify-center gap-1.5 border-r cursor-pointer transition-all duration-200 ${
                currentTheme === 'minimal-light'
                  ? 'border-r-3 border-r-black'
                  : 'border-r-white/5'
              } ${
                isActive
                  ? currentTheme === 'minimal-light'
                    ? 'bg-black text-white font-brutal font-extrabold shadow-[-2px_0px_0px_black]'
                    : 'bg-white/5 text-accent-secondary border-b-2 border-b-accent-secondary font-black scale-102'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.02]'
              }`}
            >
              <TabIcon className="w-4 h-4 flex-shrink-0" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="p-6 md:p-8 min-h-[340px]">
        
        {/* TAB 1: BLUEPRINT TAKEAWAYS */}
        {activeTab === 'blueprint' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className={`text-base font-bold font-display ${currentTheme === 'minimal-light' ? 'text-black' : 'text-text-primary'}`}>
                Durable Takeaways Blueprint
              </h3>
              <button
                type="button"
                onClick={() => handleCopySection(synthesis.summaryPoints.map(p => `### ${p.title}\n${p.details}`).join('\n\n'), 'Blueprint Text')}
                className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1.5 transition"
              >
                {copiedSection === 'Blueprint Text' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Summary Section</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {synthesis.summaryPoints.map((point, index) => (
                <div
                  key={index}
                  className={`p-4 transition-all duration-300 relative group border ${
                    currentTheme === 'minimal-light'
                      ? 'border-2 border-black bg-white rounded-none shadow-[4px_4px_0px_rgba(0,0,0,1)]'
                      : 'bg-black/30 border-white/5 hover:border-white/15 rounded-lg'
                  }`}
                >
                  <div className="absolute top-4 left-4 flex items-center justify-center w-5 h-5 text-[10px] font-black rounded-full font-mono bg-accent-secondary/10 border border-accent-secondary/20 text-accent-secondary">
                    {index + 1}
                  </div>
                  <div className="pl-8">
                    <h4 className={`text-sm font-bold font-display mb-1.5 flex items-center justify-between ${
                      currentTheme === 'minimal-light' ? 'text-black font-extrabold' : 'text-text-primary'
                    }`}>
                      {point.title}
                    </h4>
                    <p className={`text-xs leading-relaxed ${
                      currentTheme === 'minimal-light' ? 'text-slate-700' : 'text-text-secondary'
                    }`}>
                      {point.details}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: CONCEPTS MATRIX */}
        {activeTab === 'concepts' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className={`text-base font-bold font-display ${currentTheme === 'minimal-light' ? 'text-black' : 'text-text-primary'}`}>
                Core Conceptual Lexicon
              </h3>
              <button
                type="button"
                onClick={() => handleCopySection(synthesis.concepts.map(c => `**${c.concept}**: ${c.definition}`).join('\n'), 'Concepts Lexicon')}
                className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1.5 transition"
              >
                {copiedSection === 'Concepts Lexicon' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Lexicon</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {synthesis.concepts.map((concept, index) => {
                const isHigh = concept.importance?.toLowerCase() === 'high';
                const isMedium = concept.importance?.toLowerCase() === 'medium';
                
                let tagColor = '';
                if (currentTheme === 'minimal-light') {
                  tagColor = isHigh ? 'bg-red-100 text-red-900 border-2 border-black font-black' : isMedium ? 'bg-amber-100 text-amber-900 border-2 border-black' : 'bg-slate-100 text-slate-800 border-2 border-black';
                } else {
                  tagColor = isHigh 
                    ? 'bg-red-500/10 border border-red-500/40 text-red-400 font-bold' 
                    : isMedium 
                      ? 'bg-amber-500/10 border border-amber-500/40 text-amber-400' 
                      : 'bg-slate-500/10 border border-slate-500/40 text-slate-400';
                }

                return (
                  <div
                    key={index}
                    className={`p-4 flex flex-col justify-between border transition-all duration-300 ${
                      currentTheme === 'minimal-light'
                        ? 'border-2 border-black bg-white rounded-none shadow-[3px_3px_0px_rgba(0,0,0,1)]'
                        : `bg-black/30 border-white/5 hover:bg-black/40 ${isHigh ? 'border-l-2 border-l-red-500' : isMedium ? 'border-l-2 border-l-yellow-500' : 'border-l-2 border-l-slate-400'} rounded-lg`
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3 gap-2">
                        <span className={`text-sm font-semibold font-display ${
                          currentTheme === 'minimal-light' ? 'text-black font-extrabold' : 'text-text-primary'
                        }`}>
                          {concept.concept}
                        </span>
                        
                        <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-mono ${tagColor}`}>
                          {concept.importance || 'medium'} Import
                        </span>
                      </div>
                      <p className={`text-xs leading-relaxed ${
                        currentTheme === 'minimal-light' ? 'text-slate-700' : 'text-text-secondary/90'
                      }`}>
                        {concept.definition}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: ACTIVE RECALL CARDS & SLIDESHOW (NEXT / PREV FULLY OPERATIONAL) */}
        {activeTab === 'recall' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className={`text-base font-bold font-display ${currentTheme === 'minimal-light' ? 'text-black' : 'text-text-primary'}`}>
                  Smart Active Recall Hub
                </h3>
                <p className="text-[11px] text-text-secondary mt-0.5">Test your memory dynamically. Toggle slideshow view to iterate questions consecutively.</p>
              </div>

              {/* Grid / Slideshow toggle buttons */}
              <div className="flex items-center gap-2 p-1 bg-black/20 border border-white/5 rounded">
                <button
                  type="button"
                  onClick={() => setCardViewMode('slideshow')}
                  className={`px-3 py-1.5 text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition ${
                    cardViewMode === 'slideshow'
                      ? 'bg-accent-primary text-white rounded'
                      : 'text-text-secondary hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Slideshow View
                </button>
                <button
                  type="button"
                  onClick={() => setCardViewMode('grid')}
                  className={`px-3 py-1.5 text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition ${
                    cardViewMode === 'grid'
                      ? 'bg-accent-primary text-white rounded'
                      : 'text-text-secondary hover:text-white'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  All Cards Grid
                </button>
              </div>
            </div>

            {cardViewMode === 'slideshow' ? (
              /* SLIDESHOW VIEW - PREV & NEXT COMPLETELY FUNCTIONAL */
              <div className="max-w-xl mx-auto space-y-6">
                
                {/* Active Recall interactive flipping slideshow card */}
                <div
                  onClick={() => setSlideshowFlipped(!slideshowFlipped)}
                  className="w-full h-56 [perspective:1000px] cursor-pointer relative"
                >
                  <div
                    className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${
                      slideshowFlipped ? '[transform:rotateY(180deg)]' : ''
                    }`}
                  >
                    {/* Front side */}
                    <div
                      className={`absolute inset-0 w-full h-full p-6 flex flex-col justify-between border [backface-visibility:hidden] overflow-hidden ${
                        currentTheme === 'minimal-light'
                          ? 'border-3 border-black bg-white rounded-none shadow-[4px_4px_0px_rgba(0,0,0,1)]'
                          : 'bg-card-bg/95 border-b-2 border-b-accent-primary border-white/5 rounded-xl shadow-xl'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-mono tracking-widest text-text-secondary bg-white/5 px-2.5 py-1 rounded">
                          Card {slideshowIndex + 1} of {flashcards.length}
                        </span>
                        <HelpCircle className="w-4 h-4 text-accent-secondary" />
                      </div>
                      
                      <div className={`text-sm md:text-base font-bold leading-relaxed text-center py-4 px-2 ${
                        currentTheme === 'minimal-light' ? 'text-black' : 'text-text-primary'
                      }`}>
                        "{flashcards[slideshowIndex]?.question}"
                      </div>

                      <div className="text-[9px] text-center uppercase tracking-widest text-accent-primary font-bold">
                        Click / Tap Card to Check Answer
                      </div>
                    </div>

                    {/* Back side */}
                    <div
                      className={`absolute inset-0 w-full h-full p-6 flex flex-col justify-between border [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-y-auto ${
                        currentTheme === 'minimal-light'
                          ? 'border-3 border-black bg-black text-white rounded-none shadow-[4px_4px_0px_rgba(0,0,0,1)]'
                          : 'bg-gradient-to-br from-[#1c122e] to-black border-accent-secondary/30 rounded-xl text-text-primary shadow-2xl'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 bg-emerald-500/5 px-2.5 py-1 rounded">
                          Response Revealed
                        </span>
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      </div>

                      <div className="text-xs md:text-sm text-center leading-relaxed font-mono py-4 px-2 text-slate-100">
                        {flashcards[slideshowIndex]?.answer}
                      </div>

                      <div className="text-[9px] text-center uppercase tracking-widest text-text-secondary opacity-60">
                        Click Card to Flip question
                      </div>
                    </div>
                  </div>
                </div>

                {/* Slideshow Navigations buttons - NEXT and PREV */}
                <div className="flex items-center justify-between gap-4 pt-1">
                  <button
                    type="button"
                    onClick={handlePrevSlideshowCard}
                    className={`px-4 py-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider cursor-pointer border transition-all ${
                      currentTheme === 'minimal-light'
                        ? 'border-2 border-black bg-white hover:bg-slate-100 active:bg-slate-200'
                        : 'bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded active:scale-95'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous Card</span>
                  </button>

                  <div className="text-xs text-text-secondary font-mono">
                    Slide {slideshowIndex + 1} / {flashcards.length}
                  </div>

                  <button
                    type="button"
                    onClick={handleNextSlideshowCard}
                    className={`px-4 py-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider cursor-pointer border transition-all ${
                      currentTheme === 'minimal-light'
                        ? 'border-2 border-black bg-white hover:bg-slate-100 active:bg-slate-200'
                        : 'bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded active:scale-95'
                    }`}
                  >
                    <span>Next Card</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ) : (
              /* GRID OVERVIEW OF ALL CARDS */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {flashcards.map((card, index) => {
                  const isFlipped = !!flippedCards[index];
                  return (
                    <div
                      key={index}
                      onClick={() => handleFlip(index)}
                      className="group h-44 [perspective:1000px] cursor-pointer"
                    >
                      <div
                        className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${
                          isFlipped ? '[transform:rotateY(180deg)]' : ''
                        }`}
                      >
                        {/* FRONT OF THE CARD */}
                        <div
                          className={`absolute inset-0 w-full h-full p-4 flex flex-col justify-between border [backface-visibility:hidden] overflow-hidden ${
                            currentTheme === 'minimal-light'
                              ? 'border-2 border-black bg-white rounded-none shadow-[3px_3px_0px_rgba(0,0,0,1)]'
                              : 'bg-card-bg/90 border-white/5 rounded-lg hover:border-accent-primary/40'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-text-secondary opacity-65">Active Recall #{index + 1}</span>
                            <HelpCircle className="w-3.5 h-3.5 text-accent-secondary" />
                          </div>
                          <div className={`my-auto text-xs font-bold leading-relaxed text-center p-2 truncate-3-lines ${
                            currentTheme === 'minimal-light' ? 'text-black' : 'text-text-primary'
                          }`}>
                            "{card.question}"
                          </div>
                          <div className="text-[9px] text-center uppercase tracking-widest text-accent-primary font-bold">
                            Tap to Reveal Solution
                          </div>
                        </div>

                        {/* BACK OF THE CARD */}
                        <div
                          className={`absolute inset-0 w-full h-full p-4 flex flex-col justify-between border [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-y-auto ${
                            currentTheme === 'minimal-light'
                              ? 'border-2 border-black bg-black text-white rounded-none shadow-[3px_3px_0px_rgba(0,0,0,1)]'
                              : 'bg-gradient-to-br from-[#1b152b] to-black border-accent-primary/30 rounded-lg text-text-primary'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono opacity-65">Cognitive Response</span>
                            <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                          </div>
                          <div className={`my-auto text-xs text-center leading-relaxed font-mono ${
                            currentTheme === 'minimal-light' ? 'text-white' : 'text-emerald-400'
                          }`}>
                            {card.answer}
                          </div>
                          <div className="text-[9px] text-center uppercase tracking-widest text-text-secondary opacity-60">
                            Click to Flip Back
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ADVANCED RAPID FIRE QUIZ GAME (GAME PAGE INCORPORATING ACCURACY FEEDBACK & RATIO SCORE) */}
        {activeTab === 'rapidfire' && (
          <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
            
            {/* GAME STATE: IDLE */}
            {gameStatus === 'idle' && (
              <div className={`p-8 text-center border relative overflow-hidden ${
                currentTheme === 'minimal-light'
                  ? 'border-3 border-black bg-white rounded-none shadow-[6px_6px_0px_rgba(0,0,0,1)]'
                  : 'bg-card-bg/85 border-white/5 rounded-xl shadow-2xl backdrop-blur-md'
              }`}>
                {/* Decorative retro aura element */}
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-accent-secondary/10 rounded-full blur-xl pointer-events-none" />

                <div className="max-w-md mx-auto space-y-6">
                  <div className={`p-3.5 mx-auto w-14 h-14 rounded-full flex items-center justify-center ${
                    currentTheme === 'minimal-light' ? 'bg-black text-white' : 'bg-accent-primary/10 text-accent-secondary animate-bounce'
                  }`}>
                    <Flame className="w-7 h-7" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className={`text-xl font-black uppercase tracking-tight ${
                      currentTheme === 'minimal-light' ? 'text-black font-brutal' : 'text-text-primary font-display'
                    }`}>
                      Rapid Fire Simulator
                    </h3>
                    <p className={`text-xs md:text-sm leading-relaxed ${
                      currentTheme === 'minimal-light' ? 'text-slate-750' : 'text-text-secondary'
                    }`}>
                      Master your notes under adrenaline. You have exactly <strong className="text-accent-secondary font-mono">15 seconds</strong> per flashcard to test your recall speed. Score points, sustain correct streaks, and get ranked!
                    </p>
                  </div>

                  {/* Simulator facts metrics */}
                  <div className="grid grid-cols-3 gap-3 p-3 bg-black/25 border border-white/5 rounded text-left">
                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-text-secondary opacity-70">Duration</div>
                      <div className="text-xs font-bold font-mono text-white mt-0.5">15s / Card</div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-text-secondary opacity-70">Bonus</div>
                      <div className="text-xs font-bold font-mono text-accent-secondary mt-0.5">🔥 Streak Mult</div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-text-secondary opacity-70">Deck size</div>
                      <div className="text-xs font-bold font-mono text-accent-primary mt-0.5">{flashcards.length} cards</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleStartGame}
                    className={`w-full py-4 text-base font-black uppercase tracking-widest cursor-pointer transition flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] ${
                      currentTheme === 'minimal-light'
                        ? 'border-3 border-black bg-yellow-150 text-black shadow-[4px_4px_0px_black]'
                        : 'bg-gradient-to-r from-accent-primary to-accent-secondary hover:brightness-110 text-white rounded-lg shadow-lg'
                    }`}
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>Ignite Rapid Fire Quiz</span>
                  </button>
                </div>
              </div>
            )}

            {/* GAME STATE: PLAYING & REVEALED */}
            {(gameStatus === 'playing' || gameStatus === 'revealed') && (
              <div className={`p-6 md:p-8 border relative ${
                currentTheme === 'minimal-light'
                  ? 'border-3 border-black bg-white rounded-none shadow-[6px_6px_0px_black]'
                  : 'bg-card-bg/90 border-white/10 rounded-2xl shadow-xl'
              }`}>
                
                {/* Visual Timer Progress Bar at top */}
                <div className="w-full bg-slate-350/25 h-1.5 rounded-full overflow-hidden mb-6">
                  <div 
                    className={`h-full transition-all duration-1000 ${
                      gameTimeLeft <= 4 
                        ? 'bg-red-500 animate-pulse' 
                        : gameTimeLeft <= 8 
                          ? 'bg-yellow-500' 
                          : 'bg-accent-primary'
                    }`}
                    style={{ width: `${(gameTimeLeft / 15) * 100}%` }}
                  />
                </div>

                {/* Game score / dashboard bar */}
                <div className="flex items-center justify-between gap-4 mb-6 border-b border-white/5 pb-4">
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase tracking-wider text-text-secondary/70">Card Progress</span>
                    <div className="text-xs font-mono font-bold text-text-primary">
                      {gameCardIndex + 1} of {flashcards.length}
                    </div>
                  </div>

                  {gameStreak > 1 && (
                    <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-amber-400 font-bold text-xs font-mono animate-pulse">
                      <Flame className="w-3.5 h-3.5 fill-current text-amber-500" />
                      <span>STREAK: {gameStreak}x</span>
                    </div>
                  )}

                  <div className="text-right space-y-0.5">
                    <span className="text-[9px] uppercase tracking-wider text-text-secondary/70 font-mono">Tally score</span>
                    <div className="text-sm font-black text-accent-secondary font-mono">
                      {gameScore} XP
                    </div>
                  </div>
                </div>

                {/* Dynamic Game terminal displaying the question */}
                <div className="space-y-6 py-4 text-center">
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-text-secondary opacity-60">QUESTION</span>
                    <h4 className={`text-base md:text-xl font-bold leading-relaxed px-4 ${
                      currentTheme === 'minimal-light' ? 'text-black' : 'text-text-primary'
                    }`}>
                      "{flashcards[gameCardIndex]?.question}"
                    </h4>
                  </div>

                  {gameStatus === 'playing' ? (
                    /* PLAYING: PRESS REVEAL */
                    <div className="space-y-4 pt-4">
                      {gameTimeLeft === 0 ? (
                        <div className="text-xs font-bold text-red-400 flex items-center justify-center gap-1.5">
                          <AlertCircle className="w-4 h-4" />
                          <span>Time's Up! Checking Solution...</span>
                        </div>
                      ) : (
                        <div className="text-xs font-mono text-text-secondary/80">
                          Seconds remaining: <strong className="font-bold text-white text-sm">{gameTimeLeft}s</strong>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleRevealGameAnswer}
                        className={`w-full max-w-sm mx-auto py-3 text-xs font-bold uppercase tracking-wider cursor-pointer border transition ${
                          currentTheme === 'minimal-light'
                            ? 'border-2 border-black bg-white hover:bg-slate-100 text-black shadow-[3px_3px_0px_black]'
                            : 'bg-white/5 border border-white/15 text-white hover:bg-white/10 rounded-lg'
                        }`}
                      >
                        Reveal Solution Card
                      </button>
                    </div>
                  ) : (
                    /* REVEALED: CHECK ANSWER & ASSIGN CONFIDENCE POINT SCORE */
                    <div className="space-y-6 pt-4 animate-scale-up">
                      <div className={`p-4 rounded-xl border max-w-lg mx-auto ${
                        currentTheme === 'minimal-light'
                          ? 'border-2 border-black bg-black text-white'
                          : 'bg-black/40 border-accent-primary/20 text-text-primary'
                      }`}>
                        <div className="text-[9px] font-mono text-text-secondary/75 uppercase tracking-wider mb-1.5">SOLUTION RESPONSE</div>
                        <p className="text-xs md:text-sm font-mono leading-relaxed text-slate-100">
                          {flashcards[gameCardIndex]?.answer}
                        </p>
                      </div>

                      {/* Accuracy Self-assessment buttons */}
                      <div className="space-y-2 max-w-lg mx-auto">
                        <div className="text-[10px] text-text-secondary uppercase tracking-widest font-mono">Self-Scoring Handshake</div>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => handleScoreCard(true)}
                            className="bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 text-green-400 py-3.5 px-4 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider transition cursor-pointer active:scale-97"
                          >
                            <ThumbsUp className="w-4 h-4" />
                            <span>Correct! (+10 XP)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleScoreCard(false)}
                            className="bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 py-3.5 px-4 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider transition cursor-pointer active:scale-97"
                          >
                            <ThumbsDown className="w-4 h-4" />
                            <span>Incorrect / Skip</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

              </div>
            )}

            {/* GAME STATE: FINISHED (XP RANK SUMMARIZATION REPORT) */}
            {gameStatus === 'finished' && (
              <div className={`p-6 md:p-8 border ${
                currentTheme === 'minimal-light'
                  ? 'border-3 border-black bg-white rounded-none shadow-[6px_6px_0px_black]'
                  : 'bg-card-bg/90 border-white/10 rounded-2xl shadow-xl'
              }`}>
                
                <div className="text-center space-y-6">
                  
                  {/* Rank celebration badge */}
                  <div className="inline-flex flex-col items-center p-6 bg-accent-primary/5 rounded-full border border-accent-secondary/15 mx-auto">
                    <Award className="w-12 h-12 text-amber-400 mb-2" />
                    <span className="text-[10px] font-mono text-text-secondary uppercase tracking-wider">Aura Study Rank</span>
                    <h3 className="text-lg font-black text-accent-secondary mt-1">
                      {getRankBadgeAndName(gameScore).name}
                    </h3>
                  </div>

                  <div className="space-y-1">
                    <h2 className={`text-2xl font-black font-display tracking-tight ${
                      currentTheme === 'minimal-light' ? 'text-black font-brutal' : 'text-text-primary'
                    }`}>
                      Rapid-Fire Completed!
                    </h2>
                    <p className="text-xs text-text-secondary">
                      Your memory synapses are active. Check your statistical breakdown below:
                    </p>
                  </div>

                  {/* Visual key game scores */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-md mx-auto">
                    <div className="p-3 bg-black/30 border border-white/5 rounded text-center">
                      <span className="text-[9px] uppercase tracking-wider text-text-secondary font-display">Tally Score</span>
                      <div className="text-base font-black text-white mt-1">{gameScore} XP</div>
                    </div>
                    <div className="p-3 bg-black/30 border border-white/5 rounded text-center">
                      <span className="text-[9px] uppercase tracking-wider text-text-secondary font-display">Max Streak Run</span>
                      <div className="text-base font-black text-accent-primary mt-1">🔥 {gameMaxStreak}x</div>
                    </div>
                    <div className="p-3 bg-black/30 border border-white/5 rounded text-center col-span-2 md:col-span-1">
                      <span className="text-[9px] uppercase tracking-wider text-text-secondary font-display">Correct Ratio</span>
                      <div className="text-base font-black text-emerald-400 mt-1">
                        {gameAnswersHistory.filter(h => h.wasCorrect).length} / {flashcards.length}
                      </div>
                    </div>
                  </div>

                  {/* Summary of questions list with correct/review checks */}
                  <div className="space-y-2 text-left max-w-lg mx-auto pt-4 border-t border-white/5">
                    <h4 className="text-xs font-bold text-text-primary uppercase tracking-wide">Synaptic Performance Log</h4>
                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {gameAnswersHistory.map((item, idx) => (
                        <div key={idx} className="flex items-start justify-between gap-3 text-xs p-2 bg-black/20 border border-white/5 rounded">
                          <div className="flex-1 space-y-0.5 truncate pr-2">
                            <span className="text-[9px] text-text-secondary font-mono">Question {idx + 1}</span>
                            <div className="truncate text-white font-medium" title={item.question}>"{item.question}"</div>
                          </div>
                          <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded font-mono ${
                            item.wasCorrect ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {item.wasCorrect ? 'Got Right' : 'Review'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 max-w-sm mx-auto">
                    <button
                      type="button"
                      onClick={handleStartGame}
                      className={`w-full py-4 uppercase tracking-widest text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                        currentTheme === 'minimal-light'
                          ? 'border-3 border-black bg-white hover:bg-slate-100 text-black shadow-[4px_4px_0px_black]'
                          : 'bg-accent-primary text-white hover:brightness-110 rounded-lg shadow'
                      }`}
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Replay Rapid Fire</span>
                    </button>
                  </div>

                </div>

              </div>
            )}

          </div>
        )}

        {/* TAB 5: ACTION ROADMAP */}
        {activeTab === 'roadmap' && (
          <div className="space-y-6 animate-fade-in pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-base font-bold font-display ${currentTheme === 'minimal-light' ? 'text-black' : 'text-text-primary'}`}>
                  Knowledge Mastery Roadmap
                </h3>
                <p className="text-[11px] text-text-secondary mt-0.5">Iterative, action steps suggested by Gemini artificial reasoning to build long-term synapse memory.</p>
              </div>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                currentTheme === 'minimal-light' ? 'bg-black text-white border border-black rounded-none' : 'bg-black/40 text-text-secondary'
              }`}>
                {Object.values(checkedSteps).filter(Boolean).length} / {synthesis.actionSteps.length} complete
              </span>
            </div>

            <div className="space-y-3 max-w-2xl">
              {synthesis.actionSteps.map((step, index) => {
                const isChecked = !!checkedSteps[index];
                return (
                  <div
                    key={index}
                    onClick={() => toggleStep(index)}
                    className={`flex items-start gap-3.5 p-3.5 transition-all duration-200 cursor-pointer border ${
                      isChecked
                        ? currentTheme === 'minimal-light'
                          ? 'border-neutral-300 bg-slate-100 opacity-60 line-through text-slate-500 rounded-none'
                          : 'border-white/5 bg-accent-primary/5 text-text-secondary opacity-60 line-through'
                        : currentTheme === 'minimal-light'
                          ? 'border-2 border-black bg-white hover:translate-x-1 shadow-[2px_2px_0px_rgba(0,0,0,1)] rounded-none text-black'
                          : 'bg-black/25 border-white/5 hover:border-white/10 hover:bg-black/35 rounded'
                    }`}
                  >
                    <div className="pt-0.5">
                      <div className={`w-4 h-4 rounded-sm flex items-center justify-center transition-all ${
                        isChecked 
                          ? currentTheme === 'minimal-light' ? 'bg-black border border-black text-white' : 'bg-accent-secondary border border-accent-secondary text-black'
                          : currentTheme === 'minimal-light' ? 'bg-white border-2 border-black text-transparent' : 'bg-transparent border border-white/30 text-transparent'
                      }`}>
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    </div>
                    
                    <div className="flex-1 text-xs md:text-sm font-medium leading-relaxed font-display">
                      {step}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
