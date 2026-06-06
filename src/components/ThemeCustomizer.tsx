/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Palette, RefreshCw, Check, Sparkles, AlertCircle, Heart, HardDrive } from 'lucide-react';
import { StudyTheme } from '../types';

interface ThemeCustomizerProps {
  currentTheme: StudyTheme;
  onChangeTheme: (theme: StudyTheme) => void;
}

interface CustomColors {
  'bg-base': string;
  'text-primary': string;
  'text-secondary': string;
  'border-accent': string;
  'accent-primary': string;
  'accent-secondary': string;
  'card-bg': string;
  'font-heading': string;
}

const DEFAULT_CUSTOM: CustomColors = {
  'bg-base': '#0F172A',
  'text-primary': '#F8FAFC',
  'text-secondary': '#94A3B8',
  'border-accent': '#6366F1',
  'accent-primary': '#4F46E5',
  'accent-secondary': '#10B981',
  'card-bg': '#1E293B',
  'font-heading': "'Inter', sans-serif"
};

const PALETTES = [
  {
    name: '🍬 Cotton Candy Glow',
    colors: {
      'bg-base': '#0c0714',
      'text-primary': '#ffd4f0',
      'text-secondary': '#f472b6',
      'border-accent': '#f472b6',
      'accent-primary': '#fb7185',
      'accent-secondary': '#38bdf8',
      'card-bg': '#1e112d',
      'font-heading': "'Syne', sans-serif"
    }
  },
  {
    name: '📟 Retro terminal Hacker',
    colors: {
      'bg-base': '#080F0A',
      'text-primary': '#4AF626',
      'text-secondary': '#22C55E',
      'border-accent': '#22C55E',
      'accent-primary': '#15803D',
      'accent-secondary': '#4AF626',
      'card-bg': '#121C15',
      'font-heading': "'JetBrains Mono', monospace"
    }
  },
  {
    name: '🎃 Pumpkin Spice Grid',
    colors: {
      'bg-base': '#1C1310',
      'text-primary': '#FFF3E0',
      'text-secondary': '#FB923C',
      'border-accent': '#EA580C',
      'accent-primary': '#C2410C',
      'accent-secondary': '#FBBF24',
      'card-bg': '#2E1F1A',
      'font-heading': "'Space Grotesk', sans-serif"
    }
  },
  {
    name: '🤖 Cyber Gladiator',
    colors: {
      'bg-base': '#040d12',
      'text-primary': '#93c5fd',
      'text-secondary': '#06b6d4',
      'border-accent': '#06b6d4',
      'accent-primary': '#3b82f6',
      'accent-secondary': '#ea580c',
      'card-bg': '#111f25',
      'font-heading': "'Space Grotesk', sans-serif"
    }
  },
  {
    name: '☕ Warm Macchiato',
    colors: {
      'bg-base': '#FAF7F2',
      'text-primary': '#2D221E',
      'text-secondary': '#78350F',
      'border-accent': '#78350F',
      'accent-primary': '#D97706',
      'accent-secondary': '#B45309',
      'card-bg': '#FFFDFC',
      'font-heading': "'Space Grotesk', sans-serif"
    }
  },
  {
    name: '🛹 Grunge Brutalist Mono',
    colors: {
      'bg-base': '#EEEEEE',
      'text-primary': '#000000',
      'text-secondary': '#555555',
      'border-accent': '#000000',
      'accent-primary': '#000000',
      'accent-secondary': '#E11D48',
      'card-bg': '#FFFFFF',
      'font-heading': "'Syne', sans-serif"
    }
  }
];

export default function ThemeCustomizer({ currentTheme, onChangeTheme }: ThemeCustomizerProps) {
  const [colors, setColors] = useState<CustomColors>(DEFAULT_CUSTOM);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load saved colors on mount
  useEffect(() => {
    const saved = localStorage.getItem('aurastudy_custom_theme_colors');
    if (saved) {
      try {
        setColors(JSON.parse(saved));
      } catch (err) {
        console.error('Failed to parse custom colors saved details', err);
      }
    }
  }, []);

  // Set style values whenever custom colors modify
  const applyColorsToDocument = (colorsToApply: CustomColors) => {
    Object.keys(colorsToApply).forEach((key) => {
      document.documentElement.style.setProperty(`--custom-${key}`, colorsToApply[key as keyof CustomColors]);
    });
  };

  const handleChangeColor = (key: keyof CustomColors, value: string) => {
    const updated = { ...colors, [key]: value };
    setColors(updated);
    applyColorsToDocument(updated);
    localStorage.setItem('aurastudy_custom_theme_colors', JSON.stringify(updated));
    
    // Ensure Custom Theme is actively enabled so user sees changes live!
    if (currentTheme !== 'custom') {
      onChangeTheme('custom');
    }
  };

  const handleApplyPalette = (paletteColors: CustomColors) => {
    setColors(paletteColors);
    applyColorsToDocument(paletteColors);
    localStorage.setItem('aurastudy_custom_theme_colors', JSON.stringify(paletteColors));
    onChangeTheme('custom');
    
    setSuccessMsg('Palette injected successfully!');
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  const handleResetToDefault = () => {
    setColors(DEFAULT_CUSTOM);
    applyColorsToDocument(DEFAULT_CUSTOM);
    localStorage.setItem('aurastudy_custom_theme_colors', JSON.stringify(DEFAULT_CUSTOM));
    onChangeTheme('custom');
    
    setSuccessMsg('Colors restored to Default Slate Blue!');
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  return (
    <div className="p-6 border-3 border-black text-black bg-white rounded-none shadow-[6px_6px_0px_black] space-y-8 animate-fadeIn">
      
      {/* Title block */}
      <div className="border-b-2 border-black pb-4">
        <span className="text-[10px] font-mono font-bold bg-[#ff007f] text-white border border-black px-2 py-0.5 uppercase tracking-widest inline-block mb-2">
          CREATIVE CONTROL TERMINAL
        </span>
        <h2 className="text-xl font-brutal font-black uppercase flex items-center gap-2">
          <Palette className="w-6 h-6 text-[#ff007f]" />
          Aesthetic Studio & Theme Builder
        </h2>
        <p className="font-mono text-xs text-slate-500 mt-1 leading-relaxed">
          Unlock absolute design sovereignty. Fine-tune your cockpit background, margins, cards, borders, and fonts or select beautifully crafted preset environments. Apply instantaneously across 22 study microtools.
        </p>
      </div>

      {successMsg && (
        <div className="p-2 text-center text-xs font-mono font-bold bg-[#00ff66] border-2 border-black animate-pulse">
          ⚡ {successMsg} ⚡
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: THE PALETTES & COLOR SELECTORS */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Quick Preset Spaces */}
          <div className="p-4 border-2 border-black bg-slate-50 space-y-3.5">
            <h3 className="font-mono text-xs font-black uppercase text-slate-800 flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              1-Click Designer Palettes
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PALETTES.map((palette, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => handleApplyPalette(palette.colors as CustomColors)}
                  className="p-2 border border-black hover:border-[#ff007f] bg-white text-left transition cursor-pointer flex flex-col justify-between hover:shadow-[3px_3px_0px_black] active:translate-y-px"
                >
                  <span className="font-mono text-[10px] font-extrabold text-slate-800">{palette.name}</span>
                  <div className="flex gap-1 mt-2">
                    <span className="w-3.5 h-3.5 border border-black/30" style={{ backgroundColor: palette.colors['bg-base'] }} />
                    <span className="w-3.5 h-3.5 border border-black/30" style={{ backgroundColor: palette.colors['card-bg'] }} />
                    <span className="w-3.5 h-3.5 border border-black/30" style={{ backgroundColor: palette.colors['border-accent'] }} />
                    <span className="w-3.5 h-3.5 border border-black/30" style={{ backgroundColor: palette.colors['accent-secondary'] }} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Color Pickers */}
          <div className="p-4 border-2 border-black bg-white space-y-4">
            <h3 className="font-mono text-xs font-black uppercase text-gray-800 flex items-center justify-between border-b pb-2">
              <span>Manual Variable Regulators</span>
              <button
                onClick={handleResetToDefault}
                className="text-[9px] font-mono hover:underline text-blue-600 font-bold uppercase flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Reset to defaults
              </button>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 font-mono text-[11px] font-bold text-slate-700">
              
              {/* Background Base */}
              <div className="flex items-center justify-between p-2 border border-slate-100 hover:bg-slate-50">
                <div className="space-y-0.5">
                  <span className="text-slate-900 block">BASE BACKGROUND</span>
                  <span className="text-[9px] text-slate-400 font-normal">--bg-base</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">{colors['bg-base']}</span>
                  <input
                    type="color"
                    value={colors['bg-base']}
                    onChange={(e) => handleChangeColor('bg-base', e.target.value)}
                    className="w-8 h-8 cursor-pointer border border-black"
                  />
                </div>
              </div>

              {/* Card Background */}
              <div className="flex items-center justify-between p-2 border border-slate-100 hover:bg-slate-50">
                <div className="space-y-0.5">
                  <span className="text-slate-900 block">CARD/BOXES FILL</span>
                  <span className="text-[9px] text-slate-400 font-normal">--card-bg</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">{colors['card-bg']}</span>
                  <input
                    type="color"
                    value={colors['card-bg']}
                    onChange={(e) => handleChangeColor('card-bg', e.target.value)}
                    className="w-8 h-8 cursor-pointer border border-black"
                  />
                </div>
              </div>

              {/* Primary Text */}
              <div className="flex items-center justify-between p-2 border border-slate-100 hover:bg-slate-50">
                <div className="space-y-0.5">
                  <span className="text-slate-900 block">PRIMARY TITLES TEXT</span>
                  <span className="text-[9px] text-slate-400 font-normal">--text-primary</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">{colors['text-primary']}</span>
                  <input
                    type="color"
                    value={colors['text-primary']}
                    onChange={(e) => handleChangeColor('text-primary', e.target.value)}
                    className="w-8 h-8 cursor-pointer border border-black"
                  />
                </div>
              </div>

              {/* Secondary Text */}
              <div className="flex items-center justify-between p-2 border border-slate-100 hover:bg-slate-50">
                <div className="space-y-0.5">
                  <span className="text-slate-900 block">SECONDARY DETAILS</span>
                  <span className="text-[9px] text-slate-400 font-normal">--text-secondary</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">{colors['text-secondary']}</span>
                  <input
                    type="color"
                    value={colors['text-secondary']}
                    onChange={(e) => handleChangeColor('text-secondary', e.target.value)}
                    className="w-8 h-8 cursor-pointer border border-black"
                  />
                </div>
              </div>

              {/* Border Accent */}
              <div className="flex items-center justify-between p-2 border border-slate-100 hover:bg-slate-50">
                <div className="space-y-0.5">
                  <span className="text-slate-900 block">BORDER ACCENT</span>
                  <span className="text-[9px] text-slate-400 font-normal">--border-accent</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">{colors['border-accent']}</span>
                  <input
                    type="color"
                    value={colors['border-accent']}
                    onChange={(e) => handleChangeColor('border-accent', e.target.value)}
                    className="w-8 h-8 cursor-pointer border border-black"
                  />
                </div>
              </div>

              {/* Primary Accent */}
              <div className="flex items-center justify-between p-2 border border-slate-100 hover:bg-slate-50">
                <div className="space-y-0.5">
                  <span className="text-slate-900 block">PRIMARY ACCENT GLOW</span>
                  <span className="text-[9px] text-slate-400 font-normal">--accent-primary</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">{colors['accent-primary']}</span>
                  <input
                    type="color"
                    value={colors['accent-primary']}
                    onChange={(e) => handleChangeColor('accent-primary', e.target.value)}
                    className="w-8 h-8 cursor-pointer border border-black"
                  />
                </div>
              </div>

              {/* Secondary Accent */}
              <div className="flex items-center justify-between p-2 border border-slate-100 hover:bg-slate-50">
                <div className="space-y-0.5">
                  <span className="text-slate-900 block">SECONDARY ACCENT FLASH</span>
                  <span className="text-[9px] text-slate-400 font-normal">--accent-secondary</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">{colors['accent-secondary']}</span>
                  <input
                    type="color"
                    value={colors['accent-secondary']}
                    onChange={(e) => handleChangeColor('accent-secondary', e.target.value)}
                    className="w-8 h-8 cursor-pointer border border-black"
                  />
                </div>
              </div>

              {/* Font Heading */}
              <div className="flex items-center justify-between p-2 border border-slate-100 hover:bg-slate-50">
                <div className="space-y-0.5">
                  <span className="text-slate-900 block">TYPOGRAPHY MODE</span>
                  <span className="text-[9px] text-slate-400 font-normal">--font-heading</span>
                </div>
                <select
                  value={colors['font-heading']}
                  onChange={(e) => handleChangeColor('font-heading', e.target.value)}
                  className="p-1 px-2 border-2 border-black font-mono text-[10px] font-bold bg-white text-black"
                >
                  <option value="'Inter', sans-serif">SANS SERIF (Standard)</option>
                  <option value="'Space Grotesk', sans-serif">TECH GEOMETRIC</option>
                  <option value="'Syne', sans-serif">BRUTALIST DISPLAY</option>
                  <option value="'JetBrains Mono', monospace">CYBER CODING MONO</option>
                </select>
              </div>

            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: INTERACTIVE PREVIEW PANEL */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div className="p-4 border-2 border-dashed border-slate-300 rounded space-y-4 h-full flex flex-col justify-between">
            <h3 className="font-mono text-xs font-black uppercase text-slate-800 flex items-center gap-1">
              <HardDrive className="w-4 h-4 text-slate-400" />
              Real-Time Synthetic Simulation
            </h3>

            {/* Simulated Live View Box inside custom rules */}
            <div 
              className="p-5 border-3 border-black text-black space-y-4 select-none"
              style={{
                backgroundColor: colors['card-bg'],
                borderColor: colors['border-accent'],
                color: colors['text-primary']
              }}
            >
              
              {/* Internal header banner */}
              <div className="flex justify-between items-center pb-2 border-b-2" style={{ borderColor: colors['border-accent'] }}>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[10px]" style={{ fontFamily: colors['font-heading'] }}>Aura Simulated Terminal</span>
                </div>
                <span className="text-[8px] font-mono p-1 border font-semibold select-none" style={{ borderColor: colors['border-accent'], color: colors['accent-secondary'] }}>
                  LIVE PREVIEW
                </span>
              </div>

              {/* Body */}
              <div className="space-y-2">
                <h4 className="text-sm font-black uppercase" style={{ fontFamily: colors['font-heading'], color: colors['text-primary'] }}>
                  🧬 Genetic Ribosomes Synthesis
                </h4>
                <p className="text-[11px] leading-relaxed" style={{ color: colors['text-secondary'] }}>
                  The ribosome is a complex macromolecular cell machine which serves as the site of biological protein synthesis translation.
                </p>
              </div>

              {/* Mini metrics bar */}
              <div className="space-y-1">
                <div className="flex justify-between font-mono text-[9px] font-bold">
                  <span>COGNITIVE ABSORPTION INTEGRITY</span>
                  <span style={{ color: colors['accent-secondary'] }}>94% OPTIMAL MODE</span>
                </div>
                <div className="w-full h-2.5 border" style={{ borderColor: colors['border-accent'], backgroundColor: colors['bg-base'] }}>
                  <div className="h-full transition-all duration-300" style={{ width: '94%', backgroundColor: colors['accent-primary'] }} />
                </div>
              </div>

              {/* Simulated button triggers */}
              <div className="flex gap-2 pt-2">
                <button 
                  className="flex-1 py-1.5 text-[9px] font-mono font-bold uppercase transition"
                  style={{
                    backgroundColor: colors['accent-secondary'],
                    color: colors['bg-base'],
                    border: `1.5px solid ${colors['border-accent']}`
                  }}
                >
                  🚀 RECALL CARD
                </button>
                <button 
                  className="flex-1 py-1.5 text-[9px] font-mono font-bold uppercase transition"
                  style={{
                    backgroundColor: colors['bg-base'],
                    color: colors['text-primary'],
                    border: `1.5px solid ${colors['border-accent']}`
                  }}
                >
                  ⏱️ 25M Pomodoro
                </button>
              </div>

            </div>

            {/* Reassuring user call-to-action */}
            <div className="bg-indigo-50 border border-indigo-200 p-3 flex gap-2 items-start text-xs rounded">
              <AlertCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <p className="font-mono text-[10px] text-indigo-950 font-medium leading-relaxed">
                Applying a theme automatically synchronizes all 22 integrated components dynamically. Open any view or play any synapse game to experience your styled environment instantly.
              </p>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
