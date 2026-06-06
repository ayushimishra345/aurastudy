/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Flame, Award, CheckSquare, Zap, Clock, BookOpen, 
  Sparkles, Compass, AlertCircle, RefreshCw, Star, Play
} from 'lucide-react';
import { StudyTheme } from '../types';

interface StudyDashboardProps {
  currentTheme: StudyTheme;
  xp: number;
  onAddXp: (amount: number) => void;
  streak: number;
  onAddStreak: () => void;
  setActiveTab: (tabId: string) => void;
  noteCount: number;
}

export interface Bounty {
  id: string;
  title: string;
  rewardXp: number;
  completed: boolean;
  claimed: boolean;
  icon: string;
}

export interface AchievementBadge {
  id: string;
  title: string;
  desc: string;
  unlockedAtXp: number;
  unlocked: boolean;
  icon: string;
  rarity: 'COMMON' | 'EPIC' | 'LEGENDARY';
}

export default function StudyDashboard({ 
  currentTheme, 
  xp, 
  onAddXp, 
  streak, 
  onAddStreak, 
  setActiveTab,
  noteCount
}: StudyDashboardProps) {
  
  // Daily bounties
  const [bounties, setBounties] = useState<Bounty[]>([
    { id: '1', title: 'Synthesize full note matrix transcript', rewardXp: 150, completed: false, claimed: false, icon: '📖' },
    { id: '2', title: 'Complete 25-minute Pomodoro Cycle', rewardXp: 200, completed: false, claimed: false, icon: '⏱️' },
    { id: '3', title: 'Defeat Word Guess or Rapid Fire game', rewardXp: 120, completed: false, claimed: false, icon: '⚡' }
  ]);

  // Achievement badges
  const [badges, setBadges] = useState<AchievementBadge[]>([
    { id: 'b1', title: 'Brain Expander', desc: 'Synthesized first notes stack', unlockedAtXp: 0, unlocked: true, icon: '🧠', rarity: 'COMMON' },
    { id: 'b2', title: 'Focus Guru', desc: 'Accomplish 1000+ XP in study milestones', unlockedAtXp: 1000, unlocked: false, icon: '🧘', rarity: 'COMMON' },
    { id: 'b3', title: 'Vault Collector', desc: 'Unlock 2500+ XP in Second Brain archives', unlockedAtXp: 2500, unlocked: false, icon: '🏛️', rarity: 'EPIC' },
    { id: 'b4', title: 'Polyglot Translator', desc: 'Translate materials across international matrix lines', unlockedAtXp: 3500, unlocked: false, icon: '🌐', rarity: 'EPIC' },
    { id: 'b5', title: 'Academic Terminator', desc: 'Dominate games and achieve 6000+ XP', unlockedAtXp: 6000, unlocked: false, icon: '🤖', rarity: 'LEGENDARY' },
    { id: 'b6', title: 'Cosmic Overlord', desc: 'Achieve legendary class 10000+ XP level status', unlockedAtXp: 10000, unlocked: false, icon: '🪐', rarity: 'LEGENDARY' },
  ]);

  // Handle XP rank names
  const handleXpLevelAndRank = (rawXp: number) => {
    // LVL calculation: base lvl starts at 42 and increases every 300 xp
    const baseLvl = 42;
    const additionalLvl = Math.floor(rawXp / 300);
    const calculatedLvl = baseLvl + additionalLvl;
    
    // Ranks based on total XP
    let rankName = 'STORM_BREAKER';
    if (rawXp >= 10000) rankName = 'VOID_WALKER';
    else if (rawXp >= 6000) rankName = 'CHRONO_ARCHITECT';
    else if (rawXp >= 3500) rankName = 'SYNAPSE_QUANT';
    else if (rawXp >= 2500) rankName = 'CYBER_SCHOLAR';
    else if (rawXp >= 1000) rankName = 'AURA_PIONEER';
    
    return { level: calculatedLvl, rankName };
  };

  const { level, rankName } = handleXpLevelAndRank(xp);

  // Sync state with XP levels
  useEffect(() => {
    const updatedBadges = badges.map(badge => {
      if (xp >= badge.unlockedAtXp) {
        return { ...badge, unlocked: true };
      }
      return badge;
    });
    // Check if badges need update
    if (JSON.stringify(updatedBadges) !== JSON.stringify(badges)) {
      setBadges(updatedBadges);
    }
  }, [xp]);

  const handleCompleteBounty = (id: string) => {
    setBounties(prev => prev.map(b => b.id === id ? { ...b, completed: !b.completed } : b));
  };

  const handleClaimBounty = (id: string, rewardValue: number) => {
    setBounties(prev => prev.map(b => {
      if (b.id === id && b.completed && !b.claimed) {
        onAddXp(rewardValue);
        return { ...b, claimed: true };
      }
      return b;
    }));
  };

  // Quick feature category definitions for simple navigation reference
  const navigationCategories = [
    {
      group: 'Notes Ingress',
      items: [
        { id: 'upload', name: '📄 UPLOAD NOTES', desc: 'Pasted or imported txt data' },
        { id: 'handwritten', name: '✏️ HANDWRITTEN', desc: 'Paintboard + image OCR' },
        { id: 'mynotes', name: '📂 MY NOTES', desc: 'Persistent local study vault' }
      ]
    },
    {
      group: 'AI Synthesis Suite (Ollama Powered)',
      items: [
        { id: 'summary', name: '📖 CORE SUMMARY', desc: 'Paragraph/takeaway summaries' },
        { id: 'concepts', name: '⚡ KEY CONCEPTS', desc: '8-12 conceptual metrics' },
        { id: 'mindmap', name: '🗺️ ASCI Mind Map', desc: 'Visual hierarchy mapping' },
        { id: 'glossary', name: '📖 GLOSSARY BUILDER', desc: 'Instant definitions' },
        { id: 'compare', name: '♊ CONCEPT COMPARE', desc: 'Side-by-side matrices' },
        { id: 'explain', name: '💡 EXPLAINER ENGINE', desc: 'ELI5 to expert guides' },
        { id: 'tagger', name: '🏷️ SMART TAGGER', desc: 'Readiness evaluation' },
        { id: 'examtips', name: '🎯 EXAM TIPS / MNEMONICS', desc: 'Study timetables' },
        { id: 'essay', name: '✍️ COMPASS ESSAY', desc: 'Essay drafting engine' },
        { id: 'spacedrev', name: '📅 SPACED TIMELINES', desc: 'Ebbinghaus forget curve' },
        { id: 'studyplan', name: '🗓️ STUDY ROSTER', desc: 'Day-by-day routines' },
        { id: 'translate', name: '🌐 CORE TRANSLATOR', desc: '20+ languages' }
      ]
    },
    {
      group: 'Interactive Cognitive Tools',
      items: [
        { id: 'flashcards', name: '🎴 FLASHCARDS RECALL', desc: 'Adaptive revision sets' },
        { id: 'pomodoro', name: '⏱️ CYCLIC POMODORO', desc: 'Earn XP as clock ticks' },
        { id: 'askai', name: '💬 ASK AI HELPER', desc: 'Notes contextual chatbot' }
      ]
    },
    {
      group: 'Synapse Arcade Games',
      items: [
        { id: 'game-guess', name: '🎮 Word Guess', desc: 'Hangman core terms' },
        { id: 'game-scramble', name: '🎮 Word Scramble', desc: 'Conceptual puzzles' },
        { id: 'game-match', name: '🎮 Memory Match', desc: 'Term/definition cards' },
        { id: 'game-tf', name: '🎮 True / False', desc: 'Adrenaline confidence test' },
        { id: 'game-fire', name: '🎮 Rapid Fire Quiz', desc: 'Timed recall countdowns' }
      ]
    }
  ];

  return (
    <div className="space-y-8">
      
      {/* Dynamic Cyber Scoreboards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Total XP ScoreCard */}
        <div className={`p-5 border-3 border-black text-black flex flex-col justify-between ${
          currentTheme === 'minimal-light' ? 'bg-white shadow-[4px_4px_0px_black]' : 'bg-[#00ff66] shadow-[4px_4px_0px_rgba(255,0,127,1)]'
        }`}>
          <div>
            <div className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-800">COGNITIVE TALLY</div>
            <div className="text-3xl font-black font-mono tracking-tighter mt-1">{xp} XP</div>
          </div>
          <div className="text-[11px] font-bold font-mono text-slate-700 uppercase mt-4">Rank: {rankName}</div>
        </div>

        {/* Level Indicator */}
        <div className={`p-5 border-3 border-black text-black flex flex-col justify-between ${
          currentTheme === 'minimal-light' ? 'bg-white shadow-[4px_4px_0px_black]' : 'bg-[#ff007f] text-white shadow-[4px_4px_0px_rgba(0,255,102,1)]'
        }`}>
          <div>
            <div className={`text-[10px] font-mono font-black uppercase tracking-widest ${currentTheme === 'minimal-light' ? 'text-slate-800':'text-pink-100'}`}>COGNITIVE LEVEL</div>
            <div className="text-3.5xl font-black font-mono mt-1">LVL {level}</div>
          </div>
          <div className="flex items-center gap-1.5 mt-3">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
            </span>
            <span className={`text-[9px] font-mono font-black tracking-widest ${currentTheme === 'minimal-light' ? 'text-slate-900':'text-yellow-300'}`}>PROGRESS ACTIVE</span>
          </div>
        </div>

        {/* Dynamic Streak Indicator */}
        <div className={`p-5 border-3 border-black text-black flex flex-col justify-between bg-yellow-300 shadow-[4px_4px_0px_black]`}>
          <div>
            <div className="text-[10px] font-mono font-black uppercase tracking-widest text-yellow-900">STUDY STREAK</div>
            <div className="text-3xl font-black font-mono mt-1 flex items-center gap-1.5 text-yellow-950">
              <Flame className="w-7 h-7 text-red-600 fill-current" />
              <span>{streak}-DAY</span>
            </div>
          </div>
          <button
            onClick={onAddStreak}
            className="mt-3 w-full py-1.5 bg-black hover:bg-zinc-800 text-yellow-300 font-bold font-mono text-[9px] uppercase tracking-widest border border-black active:translate-y-[1px] cursor-pointer"
          >
            🔥 Ignite Daily Streak
          </button>
        </div>

        {/* Static Metrics (PDFs, Notes Count) */}
        <div className={`p-5 border-3 border-black ${
          currentTheme === 'minimal-light' ? 'bg-white text-black shadow-[4px_4px_0px_black]' : 'bg-[#18113c] text-white shadow-[4px_4px_0px_black]'
        }`}>
          <div className="text-[10px] font-mono font-black uppercase tracking-widest opacity-75">SECOND BRAIN STORAGE</div>
          <div className="text-3xl font-black font-mono tracking-tighter mt-1">{noteCount} STACKED</div>
          <div className="text-[10px] text-[#00ff66] font-bold font-mono uppercase mt-4">✓ 100% SECURE MEMORY ARCHIVE</div>
        </div>

      </div>

      {/* Row containing lists for Daily Bounties & Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Daily Bounties Frame */}
        <div className={`p-6 border-3 border-black rounded-none bg-white text-black shadow-[6px_6px_0px_black]`}>
          <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-black">
            <h3 className="font-brutal font-extrabold text-sm uppercase flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-red-600" />
              Daily Study Bounties (Missions)
            </h3>
            <span className="text-[10px] font-mono font-bold bg-[#00ff66] border border-black p-1 text-black uppercase">
              RESETS DAILY
            </span>
          </div>

          <div className="space-y-3">
            {bounties.map(b => (
              <div 
                key={b.id} 
                className={`p-3 border-2 border-black flex items-center justify-between transition-all ${
                  b.claimed 
                    ? 'bg-slate-100 opacity-60' 
                    : b.completed 
                      ? 'bg-emerald-50 border-emerald-500' 
                      : 'bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{b.icon}</span>
                  <div>
                    <h4 className={`text-xs font-black font-mono ${b.completed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                      {b.title}
                    </h4>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                      +{b.rewardXp} XP Reward Milestone
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!b.completed ? (
                    <button
                      onClick={() => handleCompleteBounty(b.id)}
                      className="px-2.5 py-1 text-[10px] font-bold font-mono uppercase bg-slate-100 hover:bg-slate-200 text-black border border-black cursor-pointer"
                    >
                      Complete
                    </button>
                  ) : !b.claimed ? (
                    <button
                      onClick={() => handleClaimBounty(b.id, b.rewardXp)}
                      className="px-2.5 py-1 text-[10px] font-bold font-mono uppercase bg-amber-400 hover:bg-amber-500 text-black border border-black cursor-pointer animate-bounce"
                    >
                      🎁 Claim XP
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold font-mono text-emerald-600 uppercase">
                      ✓ Claimed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievement Badges Display */}
        <div className={`p-6 border-3 border-black rounded-none bg-white text-black shadow-[6px_6px_0px_black]`}>
          <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-black">
            <h3 className="font-brutal font-extrabold text-sm uppercase flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Unlockable Cognitive Badges ({badges.filter(b=>b.unlocked).length} / {badges.length})
            </h3>
            <span className="text-[10px] font-mono font-bold bg-[#ff007f] text-white border border-black p-1 uppercase">
              PERSISTENT
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 max-h-[190px] overflow-y-auto pr-1">
            {badges.map(b => (
              <div 
                key={b.id} 
                className={`p-2.5 border-2 border-black flex flex-col justify-between rounded-none transition-all ${
                  b.unlocked 
                    ? b.rarity === 'LEGENDARY' 
                      ? 'bg-amber-100' 
                      : b.rarity === 'EPIC' 
                        ? 'bg-purple-100' 
                        : 'bg-emerald-50'
                    : 'bg-slate-100 opacity-40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">{b.unlocked ? b.icon : '🔒'}</span>
                  <span className={`text-[8px] font-black uppercase font-mono px-1 rounded ${
                    b.rarity === 'LEGENDARY' ? 'bg-amber-500' : b.rarity === 'EPIC' ? 'bg-purple-500' : 'bg-slate-500'
                  } text-white`}>
                    {b.rarity}
                  </span>
                </div>
                
                <div className="mt-2.5">
                  <div className="text-[10px] font-black font-brutal truncate text-slate-950" title={b.title}>
                    {b.unlocked ? b.title : 'Encrypted Badge'}
                  </div>
                  <p className="text-[9px] text-slate-600 line-clamp-2 leading-tight mt-0.5" title={b.desc}>
                    {b.unlocked ? b.desc : `Unlock at ${b.unlockedAtXp} XP`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Category Shortcut Link Cards */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b-2 border-black">
          <Compass className="w-5 h-5 text-blue-600" />
          <h3 className={`font-brutal font-extrabold text-sm uppercase ${currentTheme === 'minimal-light' ? 'text-black':'text-text-primary'}`}>
            System Capability Directory Shortcut Registry (22 Tools)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {navigationCategories.map((group, idx) => (
            <div key={idx} className="p-4 border-2 border-black bg-white rounded-none shadow-[4px_4px_0px_black] text-black space-y-3">
              <h4 className="font-brutal font-extrabold text-xs uppercase text-[#ff007f] border-b border-zinc-200 pb-1.5 select-none">
                {group.group}
              </h4>
              <div className="space-y-1.5 flex-1 select-none">
                {group.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className="w-full text-left p-1.5 hover:bg-slate-150 rounded font-mono font-bold text-[10px] uppercase text-slate-800 hover:text-black flex items-center justify-between transition cursor-pointer"
                  >
                    <span className="truncate">{item.name}</span>
                    <span className="text-[8px] font-normal text-slate-400">Jump ⏵</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
