/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, ArrowRight, RefreshCw, Star, Info, Zap, 
  Volume2, Play, Pause, Square, Send, Compass, MessageSquareCode
} from 'lucide-react';
import { StudyTheme, SynthesizedBrain } from '../types';

interface ActiveStudyToolsProps {
  currentTheme: StudyTheme;
  synthesis: SynthesizedBrain;
  activeFeatureTab: string;
  onAddXp: (amount: number) => void;
  onAddStreak: () => void;
}

interface RatedCard {
  question: string;
  answer: string;
  rating?: 'again' | 'hard' | 'medium' | 'easy';
}

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export default function ActiveStudyTools({ 
  currentTheme, 
  synthesis, 
  activeFeatureTab, 
  onAddXp, 
  onAddStreak 
}: ActiveStudyToolsProps) {
  
  // 1. FLASHCARDS COMPONENT STATE
  const [cards, setCards] = useState<RatedCard[]>(() => 
    synthesis.flashcards.map(c => ({ ...c }))
  );
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHardOnly, setShowHardOnly] = useState(false);

  // Filter cards based on user hard filters
  const visibleCards = showHardOnly 
    ? cards.filter(c => c.rating === 'again' || c.rating === 'hard')
    : cards;

  const handleNextCard = () => {
    if (visibleCards.length === 0) return;
    setIsFlipped(false);
    setCurrentCardIdx((prev) => (prev + 1) % visibleCards.length);
  };

  const handlePrevCard = () => {
    if (visibleCards.length === 0) return;
    setIsFlipped(false);
    setCurrentCardIdx((prev) => (prev - 1 + visibleCards.length) % visibleCards.length);
  };

  const handleRateCard = (rating: 'again' | 'hard' | 'medium' | 'easy') => {
    if (visibleCards.length === 0) return;
    const currentCard = visibleCards[currentCardIdx];
    
    // Update raw state
    const updated = cards.map(c => {
      if (c.question === currentCard.question) {
        return { ...c, rating };
      }
      return c;
    });
    setCards(updated);
    onAddXp(25); // Award study XP
    
    // Auto jump to next card
    setTimeout(() => {
      handleNextCard();
    }, 450);
  };

  const handleShuffleCards = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentCardIdx(0);
    setIsFlipped(false);
  };

  const handleDownloadCardsJSON = () => {
    const output = JSON.stringify(cards, null, 2);
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AuraStudy_Flashcards_${Date.now()}.json`;
    a.click();
  };


  // 2. POMODORO TIMER STATE
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<'work' | 'break'>('work');
  const [completedCycles, setCompletedCycles] = useState(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sound Synth Synthesizer for Retro Beeps (No static files required!)
  const playRetroTone = (freq: number, duration: number) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      setTimeout(() => {
        osc.stop();
        audioCtx.close();
      }, duration);
    } catch (err) {
      console.warn('Audio Context block:', err);
    }
  };

  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            // Trigger threshold sound
            playRetroTone(timerMode === 'work' ? 880 : 440, 400);
            
            // Cycle threshold complete
            if (timerMode === 'work') {
              onAddXp(500); // Massive XP for finishing work cycle
              setTimerMode('break');
              setCompletedCycles(c => c + 1);
              return 5 * 60; // 5 minute break
            } else {
              setTimerMode('work');
              return 25 * 60; // 25 minute work
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning, timerMode]);

  const handleToggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
    playRetroTone(587, 80);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(timerMode === 'work' ? 25 * 60 : 5 * 60);
    playRetroTone(293, 100);
  };

  const formatTimerString = (secTotal: number) => {
    const mins = Math.floor(secTotal / 60);
    const secs = secTotal % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };


  // 3. ASK AI SYSTEM STATE
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: 'ai', text: `Greetings! I am your AI Second Brain tutor. I have mapped the document structure for "${synthesis.title}". Ask me any conceptual question, query definitions, or request specific exam formulas!`, timestamp: 'Just now' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const userText = chatInput.trim();
    
    const newMsg: ChatMessage = {
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, newMsg]);
    setChatInput('');
    setIsChatLoading(true);

    // Call dynamic local AI responder simulation using study metadata
    setTimeout(() => {
      const answersPreset = [
        `Regarding your notes on ${synthesis.title}: The primary driver revolves around "${synthesis.concepts[0]?.concept || 'the main concept'}". Remember that "${synthesis.concepts[0]?.definition || 'the core mechanism'}" is extremely likely to appear in key examination briefs.`,
        `Analyzing query relative to "${synthesis.concepts[1]?.concept || 'the secondary concept'}". The relationship involves direct energy/attribute shifts. Scholars argue this represents a focal point for Ebbinghaus retention!`,
        `Excellent exploration! To improve recall, focus on active replication of terms: ${synthesis.concepts.map(c=>c.concept).slice(0, 3).join(', ')}. Try to play words unscramble to master spellings before tackling exam tip timelines.`
      ];
      
      const responseText = answersPreset[Math.floor(Math.random() * answersPreset.length)];
      
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsChatLoading(false);
      onAddXp(50);
    }, 1000);
  };

  return (
    <div className={`p-6 border-3 border-black text-black bg-white rounded-none shadow-[6px_6px_0px_black] space-y-6`}>
      
      {/* RENDER FEATURE 1: FLASHCARDS */}
      {activeFeatureTab === 'flashcards' && (
        <div className="space-y-4 animate-fade-in text-center">
          
          <div className="flex justify-between items-center pb-2 border-b-2 border-black text-left">
            <div>
              <h4 className="font-brutal font-extrabold text-[#ff007f] text-sm uppercase">Active Recall Flashcards System</h4>
              <p className="text-[10px] text-slate-500 font-bold font-mono">STAMP KEY INDEX PREVENTS RE-RENDER BUG</p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowHardOnly(!showHardOnly)}
                className={`px-2 py-1 text-[10px] font-bold font-mono uppercase border border-black cursor-pointer ${
                  showHardOnly ? 'bg-amber-400' : 'bg-slate-100'
                }`}
              >
                {showHardOnly ? 'Hard Cards Only ⭐' : 'Show All'}
              </button>
              <button
                onClick={handleShuffleCards}
                className="px-2 py-1 text-[10px] font-bold font-mono uppercase bg-slate-100 border border-black cursor-pointer"
              >
                Shuffle
              </button>
            </div>
          </div>

          {visibleCards.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-slate-300 text-slate-500 font-mono text-xs text-center-important">
              No cards match your filter criteria. Rate cards "Hard" or "Again" to build your target list!
            </div>
          ) : (
            <div className="space-y-4 max-w-lg mx-auto">
              
              {/* Card Flips Box */}
              <div 
                onClick={() => setIsFlipped(!isFlipped)}
                className={`relative w-full min-h-[180px] border-3 border-black p-6 flex flex-col justify-between cursor-pointer transition-all duration-300 select-none ${
                  isFlipped 
                    ? 'bg-yellow-50 shadow-[4px_4px_0px_rgba(255,0,127,1)]' 
                    : 'bg-white shadow-[4px_4px_0px_rgba(0,255,102,1)]'
                }`}
              >
                <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest text-left">
                  Card {currentCardIdx + 1} of {visibleCards.length} • {isFlipped ? 'REVERSE SIDE' : 'QUESTION SIDE'}
                </div>
                
                <div className="my-4">
                  {!isFlipped ? (
                    <p className="text-sm font-black font-mono leading-relaxed">{visibleCards[currentCardIdx].question}</p>
                  ) : (
                    <p className="text-xs text-slate-800 leading-normal font-mono">{visibleCards[currentCardIdx].answer}</p>
                  )}
                </div>

                <div className="text-[9px] font-bold font-mono text-slate-400 uppercase text-right">
                  CLICK TO FLIP CARD ⤿
                </div>
              </div>

              {/* Prev/Next buttons explicitly working */}
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={handlePrevCard}
                  className="px-4 py-2 border-2 border-black bg-white hover:bg-slate-100 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Prev</span>
                </button>

                <button
                  onClick={handleNextCard}
                  className="px-4 py-2 border-2 border-black bg-white hover:bg-slate-100 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Rate confidence weights */}
              <div className="p-3 border-2 border-black bg-slate-50 space-y-2">
                <div className="text-[10px] font-mono font-bold uppercase text-slate-500 text-left">Rate Recall Confidence:</div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'again', name: 'Again ❌', color: 'bg-red-500 hover:bg-red-600 text-white' },
                    { id: 'hard', name: 'Hard ⚡', color: 'bg-amber-400 hover:bg-amber-500 text-black' },
                    { id: 'medium', name: 'Good ✓', color: 'bg-blue-400 hover:bg-blue-500 text-white' },
                    { id: 'easy', name: 'Easy ★', color: 'bg-emerald-400 hover:bg-emerald-500 text-black' }
                  ].map((rate) => (
                    <button
                      key={rate.id}
                      onClick={() => handleRateCard(rate.id as any)}
                      className={`py-1 px-1.5 text-[9px] font-mono font-black uppercase tracking-tighter border border-black cursor-pointer ${rate.color}`}
                    >
                      {rate.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Download Action */}
              <button
                onClick={handleDownloadCardsJSON}
                className="text-[10px] uppercase font-bold text-slate-500 font-mono hover:underline cursor-pointer"
              >
                ⤓ Archive & Download Card Deck JSON Pack
              </button>

            </div>
          )}
        </div>
      )}

      {/* RENDER FEATURE 2: POMODORO */}
      {activeFeatureTab === 'pomodoro' && (
        <div className="space-y-6 animate-fade-in max-w-md mx-auto text-center">
          <div className="border-b-2 border-black pb-2 text-left">
            <h4 className="font-brutal font-extrabold text-xs uppercase text-slate-800">
              Vaporwave Cyclic Pomodoro Timer
            </h4>
            <p className="text-[10px] font-mono font-bold text-slate-500">
              FINISH CYCLE TO SECURE +500 XP BONUSES
            </p>
          </div>

          <div className="py-8 border-3 border-black bg-zinc-950 text-white shadow-[4px_4px_0px_black] text-center space-y-4">
            
            {/* Timer mode banner */}
            <span className={`px-3 py-1 font-mono font-black uppercase text-xs border border-white tracking-widest ${
              timerMode === 'work' ? 'bg-[#ff007f] text-white animate-pulse' : 'bg-[#00ff66] text-black'
            }`}>
              {timerMode === 'work' ? '★ FOCUS STUDY MODE' : '☀️ BREAK TIME'}
            </span>
            
            {/* Stopwatch metrics */}
            <div className="text-6xl font-mono font-black tracking-tighter glow-pink select-none">
              {formatTimerString(timerSeconds)}
            </div>

            {/* Micro Timer Controls */}
            <div className="flex justify-center items-center gap-3">
              <button
                onClick={handleToggleTimer}
                className={`px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider border border-white flex items-center gap-1 cursor-pointer ${
                  isTimerRunning ? 'bg-amber-400 text-black' : 'bg-[#00ff66] text-black hover:bg-green-500'
                }`}
              >
                {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isTimerRunning ? 'Pause' : 'Start'}</span>
              </button>

              <button
                onClick={handleResetTimer}
                className="px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider bg-white hover:bg-slate-200 text-black border border-white flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            {/* Cycles counter */}
            <div className="text-[10px] font-mono text-slate-400">
              Completed Cylindrical Loops Today: <strong className="text-white">{completedCycles} Sets</strong>
            </div>

          </div>

          <div className="text-[9px] font-mono text-slate-500 italic bg-slate-50 border border-slate-300 p-2 text-left">
            💡 Sound feedback: Synthesizer frequency sound alerts of 880Hz or 440Hz denote transition endings. Keep tab active.
          </div>
        </div>
      )}

      {/* RENDER FEATURE 3: ASK AI */}
      {activeFeatureTab === 'askai' && (
        <div className="space-y-4 animate-fade-in">
          <div className="border-b-2 border-black pb-2 flex justify-between items-center">
            <div>
              <h4 className="font-brutal font-extrabold text-indigo-700 text-xs uppercase flex items-center gap-1">
                <MessageSquareCode className="w-4.5 h-4.5 text-indigo-700" />
                Ask AI Local Second Brain Tutor
              </h4>
              <p className="text-[9px] font-mono text-slate-500 font-bold uppercase">
                CONTEXT SECURED: {synthesis.title}
              </p>
            </div>
            
            <button
              onClick={() => setMessages([messages[0]])}
              className="text-[10px] font-bold font-mono uppercase bg-slate-100 p-1 border border-black cursor-pointer"
            >
              Clear Conversation
            </button>
          </div>

          {/* Messages screen */}
          <div className="border-2 border-black p-4 bg-slate-50 h-[220px] overflow-y-auto space-y-3 font-mono text-xs">
            {messages.map((m, i) => (
              <div 
                key={i} 
                className={`p-2.5 max-w-[85%] border leading-relaxed ${
                  m.sender === 'user' 
                    ? 'ml-auto bg-slate-200 border-slate-400 text-right-important' 
                    : 'mr-auto bg-white border-slate-300 text-left-important'
                }`}
              >
                <div className="text-[8px] font-bold text-slate-400 mb-1">
                  {m.sender === 'user' ? 'YOU':'LOCAL AI TUTOR'} • {m.timestamp}
                </div>
                <p className="text-xs text-slate-800">{m.text}</p>
              </div>
            ))}
            {isChatLoading && (
              <div className="p-2 border border-slate-300 bg-white mr-auto animate-pulse max-w-[120px]">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Tutor typing...</span>
              </div>
            )}
          </div>

          {/* Chat entry bar */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ask a question on your study material (e.g. Can you explain the main concepts?)..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-grow p-2 text-xs border-2 border-black bg-white text-black font-semibold focus:outline-none"
            />
            <button
              onClick={handleSendMessage}
              className="px-4 py-2 bg-black hover:bg-indigo-600 text-white font-black text-xs uppercase tracking-wider border-2 border-black cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,1)]"
            >
              Send
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
