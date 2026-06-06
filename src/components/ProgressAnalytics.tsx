/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BarChart, Trophy, Clock, CheckCircle2, Award, Calendar, Flame } from 'lucide-react';
import { StudyTheme } from '../types';

interface ProgressAnalyticsProps {
  currentTheme: StudyTheme;
  xp: number;
  streak: number;
  noteCount: number;
}

export default function ProgressAnalytics({ currentTheme, xp, streak, noteCount }: ProgressAnalyticsProps) {
  
  // Custom ratios
  const percentToNextLevel = Math.floor((xp % 300) / 3);
  const nextLevelXp = 300 - (xp % 300);

  // Stats bento boxes
  const diagnostics = [
    { title: 'Total Pomodoro focus intervals', value: '4 Cycles completed', detail: '100 Active Minutes', progress: 80, color: 'bg-[#ff007f]' },
    { title: 'Active Recall accuracy metrics', value: '88% Correct Responses', detail: '24 Flashcards reviewed', progress: 88, color: 'bg-[#00ff66]' },
    { title: 'Arcade games victory count', value: '8 Matches conquered', detail: '+1,200 XP Secured', progress: 65, color: 'bg-blue-400' },
    { title: 'Brain database integrity level', value: 'Optimal state verified', detail: `${noteCount} Term stacks compiled`, progress: 100, color: 'bg-amber-400' }
  ];

  return (
    <div className={`p-6 border-3 border-black text-black bg-white rounded-none shadow-[6px_6px_0px_black] space-y-6`}>
      
      {/* Tab Visual Header */}
      <div className="border-b-2 border-black pb-2 flex justify-between items-center bg-slate-100 p-2 border">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#ff007f]" />
          <h3 className="font-brutal font-extrabold text-sm uppercase">
            Aura Cognitive Performance Diagnostics
          </h3>
        </div>
        <span className="text-[10px] font-mono font-bold bg-[#00ff66] border border-black p-1 text-black uppercase">
          METRICS: NOMINAL
        </span>
      </div>

      {/* Level advancement progression */}
      <div className="p-4 border-2 border-black bg-slate-50 space-y-2">
        <div className="flex justify-between font-mono text-xs font-bold">
          <span className="text-slate-700">ADVANCEMENT FOR ADVANCED LVL:</span>
          <span>{percentToNextLevel}% • Needs {nextLevelXp} XP to progress</span>
        </div>

        {/* Custom Progress Gauge */}
        <div className="w-full bg-slate-200 border-2 border-black h-5 relative">
          <div 
            className="h-full bg-gradient-to-r from-[#ff007f] to-[#00ff66] transition-all duration-500"
            style={{ width: `${percentToNextLevel}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-[10px] text-zinc-950">
            TALLY: {xp % 300} / 300 XP
          </div>
        </div>
      </div>

      {/* Analytics Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {diagnostics.map((item, idx) => (
          <div key={idx} className="p-4 border-2 border-black bg-white text-black flex flex-col justify-between">
            <div className="space-y-1">
              <span className="font-mono text-[9px] uppercase font-bold text-slate-400 tracking-wider">Metrics Block #{idx+1}</span>
              <h4 className="font-mono text-xs font-black uppercase text-slate-800">{item.title}</h4>
              <div className="text-sm font-black font-mono pt-1 text-slate-900">{item.value}</div>
              <p className="text-[11px] text-slate-500 font-mono font-semibold">{item.detail}</p>
            </div>

            {/* Micro visual indicator metrics bar */}
            <div className="mt-4 space-y-1">
              <div className="flex justify-between font-mono text-[9px] font-bold text-slate-700">
                <span>RATING STATUS</span>
                <span>{item.progress}% MATCH</span>
              </div>
              <div className="w-full bg-slate-150 h-2 border border-black overflow-hidden">
                <div className={`h-full ${item.color}`} style={{ width: `${item.progress}%` }} />
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Cognitive Consistency Timelines */}
      <div className="p-3 bg-indigo-50/30 border-2 border-black space-y-1 text-xs">
        <span className="font-brutal font-extrabold uppercase text-indigo-900 flex items-center gap-1">
          <Flame className="w-4.5 h-4.5 text-orange-500" />
          Streak Consistency Tracker:
        </span>
        <p className="font-mono text-slate-700 leading-normal">
          Maintained consistent memory synthesis daily logs! Active study days: <strong className="text-black">{streak} straight days</strong>. Ebbinghaus projection models indicate target long-term memory solidification threshold will reach peak maturity ratios inside 14 target studying days.
        </p>
      </div>

    </div>
  );
}
