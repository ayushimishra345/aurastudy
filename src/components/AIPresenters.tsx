/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  BookOpen, Sparkles, Languages, HelpCircle, Copy, Check, FileText, 
  ChevronRight, ArrowLeftRight, Compass, Calendar, BookOpenCheck
} from 'lucide-react';
import { StudyTheme, SynthesizedBrain } from '../types';

interface AIPresentersProps {
  currentTheme: StudyTheme;
  synthesis: SynthesizedBrain;
  activeFeatureTab: string;
}

export default function AIPresenters({ currentTheme, synthesis, activeFeatureTab }: AIPresentersProps) {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  
  // Local state for interactive side-by-side comparators
  const [conceptA, setConceptA] = useState(synthesis.concepts[0]?.concept || 'Chlorophyll');
  const [conceptB, setConceptB] = useState(synthesis.concepts[1]?.concept || 'RuBisCO Enzyme');

  // Translate tool local selections
  const [translateLang, setTranslateLang] = useState('Hindi');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  // Explainer state
  const [explanationDepth, setExplanationDepth] = useState<'eli5' | 'student' | 'deep_dive' | 'analogy'>('eli5');

  // Essay control
  const [essayLength, setEssayLength] = useState<'medium' | 'long'>('medium');
  const [essayLevel, setEssayLevel] = useState<'undergrad' | 'highschool'>('undergrad');

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Supported OCR translator languages with emphasis on Indian Languages
  const LanguagesList = [
    'Hindi', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 'Urdu', 'Gujarati', 'Kannada', 'Odia', 'Malayalam', 'Punjabi', 'Sanskrit',
    'Japanese', 'French', 'Spanish', 'German'
  ];

  // Triggers real-time translation process using Gemini
  const triggerTranslation = async () => {
    setIsTranslating(true);
    try {
      const sourceText = `Study Guide Title: ${synthesis.title}

Overview:
${synthesis.overview}

Key Terms and Core Definitions:
${synthesis.concepts.map((c, i) => `${i + 1}. ${c.concept}: ${c.definition}`).join('\n')}

Major Summary Points:
${synthesis.summaryPoints.map((p, i) => `★ ${p.title}: ${p.details}`).join('\n')}

Action Steps:
${synthesis.actionSteps.map((step) => `- ${step}`).join('\n')}`;

      const response = await fetch('/api/translate-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: sourceText,
          targetLanguage: translateLang,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete translation.');
      }

      setTranslatedText(data.translated || 'No translation text returned.');
    } catch (err: any) {
      console.error(err);
      setTranslatedText(`[Translation Error]: ${err.message || 'An unexpected error occurred during translation.'}`);
    } finally {
      setIsTranslating(false);
    }
  };

  // Explanation engines
  const getExplanation = () => {
    const mainConcept = synthesis.concepts[0]?.concept || 'Your Subject';
    const mainDef = synthesis.concepts[0]?.definition || 'the fundamental core of this study topic.';
    
    if (explanationDepth === 'eli5') {
      return `👶 [ELI5 MODE] Imagine "${mainConcept}" is like a busy kitchen! ${mainDef} The chefs are like cells making delicious food (energy) so that the entire restaurant can keep running without getting hungry!`;
    }
    if (explanationDepth === 'analogy') {
      return `⚓ [ANALOGY GUIDE] Think of ${mainConcept} as a cellular ecosystem comparable to a solar-power factory grid. The inputs represent raw resources, the processes are the assembly conveyor lines, and the outputs are packaged batteries distributed for external power consumption inside the host metropolis.`;
    }
    if (explanationDepth === 'deep_dive') {
      return `🔬 [DEEP CRITIQUE] Advanced technical parameters of ${mainConcept}: Analyzing thermodynamic equilibrium interfaces. Structural efficiency ratios are determined by catalytic limits (like RuBisCO ratios or gradient backpropagation Adam weights). This represents the primary constraint against entropy decay during metabolic or logical cycles.`;
    }
    return `🎓 [STUDY STANDARD] ${mainConcept}: ${mainDef}. Key parameters involve identifying the catalyst threshold, optimization formulas, and the correlation coefficients between variables within the specified framework.`;
  };

  return (
    <div className={`p-6 border-3 border-black text-black bg-white rounded-none shadow-[6px_6px_0px_black] space-y-6`}>
      
      {/* Tab bar display */}
      <div className="border-b-2 border-black pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpenCheck className="w-5 h-5 text-accent-primary" />
          <h3 className="font-brutal font-extrabold text-sm uppercase">
            AI Cognitive Tool: {activeFeatureTab.toUpperCase()}
          </h3>
        </div>
        <span className="text-[10px] font-mono font-bold bg-[#ffff00] border border-black px-1.5 py-0.5">
          OLLAMA ENGINE : ACTIVE (127.0.0.1:11434)
        </span>
      </div>

      {/* RENDER TAB 1: SUMMARY */}
      {activeFeatureTab === 'summary' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs uppercase font-mono">Executive Syntheses</h4>
            <button
              onClick={() => handleCopyText(`${synthesis.title}\n\n${synthesis.overview}`, 'Summary')}
              className="text-xs flex items-center gap-1 hover:underline font-mono"
            >
              {copiedText === 'Summary' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedText === 'Summary' ? 'Copied' : 'Copy Text'}</span>
            </button>
          </div>

          <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-300 font-mono text-xs leading-relaxed">
            <div className="font-black text-xs text-[#ff007f] mb-2 uppercase">1. Broad Paragraph Overview</div>
            <p>{synthesis.overview}</p>
            
            <div className="font-black text-xs text-[#00ff66] mt-4 mb-2 uppercase">2. Five Strategic Key Takeaways</div>
            <ul className="list-disc pl-5 space-y-2 text-slate-800">
              {synthesis.summaryPoints.slice(0, 5).map((pt, i) => (
                <li key={i}>
                  <strong>{pt.title}:</strong> {pt.details}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* RENDER TAB 2: KEY CONCEPTS */}
      {activeFeatureTab === 'concepts' && (
        <div className="space-y-4">
          <h4 className="font-bold text-xs uppercase font-mono">Core Conceptual Matrix (8-12 Ideas)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {synthesis.concepts.map((concept, idx) => (
              <div key={idx} className="p-3 border-2 border-black bg-slate-50 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-1 border-b border-slate-200 pb-1">
                    <span className="font-black text-xs uppercase">{concept.concept}</span>
                    <span className="text-[9px] px-1 bg-black text-white font-bold">{concept.importance.toUpperCase()}</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-normal">{concept.definition}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RENDER TAB 3: MIND MAP */}
      {activeFeatureTab === 'mindmap' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-xs uppercase font-mono">ASCII Topological Mind Map</h4>
            <button
              onClick={() => handleCopyText(`[ASCII MAP]\n${synthesis.title}\n ├── CONCEPTS\n` + synthesis.concepts.map(c=>` │    └── ${c.concept}`).join('\n'), 'MindMap')}
              className="text-xs flex items-center gap-1 hover:underline font-mono"
            >
              {copiedText === 'MindMap' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy Map</span>
            </button>
          </div>

          <pre className="p-4 bg-zinc-950 text-[#00ff66] overflow-x-auto font-mono text-[10px] sm:text-xs leading-5 shadow-inner">
{`▲ AURA_COGNITIVE_ROOT: "${synthesis.title}"
│
├── █ EXECUTIVE FOCUS: "${synthesis.overview.slice(0, 50)}..."
│
├── ⚙ KEY PROCESS NODES
│    ├── [Importance: High] ───> ${synthesis.concepts[0]?.concept || 'Primary Catalyst'}
│    │                           └───> Definition: ${synthesis.concepts[0]?.definition.slice(0, 50) || 'Core parameter'}...
│    │
│    ├── [Importance: Medium] ─> ${synthesis.concepts[1]?.concept || 'Secondary Matrix'}
│    │                           └───> Definition: ${synthesis.concepts[1]?.definition.slice(0, 50) || 'Subsystem link'}...
│    │
│    └── [Importance: Medium] ─> ${synthesis.concepts[2]?.concept || 'Tactical Pathway'}
│                                └───> Definition: ${synthesis.concepts[2]?.definition.slice(0, 50) || 'Context support'}...
│
└── 📋 ACTION PLAN TIMELINE
     ├── STEP 1: ${synthesis.actionSteps[0] || 'Analyze fundamentals'}
     ├── STEP 2: ${synthesis.actionSteps[1] || 'Map concepts'}
     └── STEP 3: ${synthesis.actionSteps[2] || 'Simulate test questions'}`}
          </pre>
        </div>
      )}

      {/* RENDER TAB 4: GLOSSARY */}
      {activeFeatureTab === 'glossary' && (
        <div className="space-y-3">
          <h4 className="font-bold text-xs uppercase font-mono">Vocabulary Glossary Terms</h4>
          <div className="border-2 border-black divide-y-2 divide-black">
            {synthesis.concepts.map((c, i) => (
              <div key={i} className="p-3 bg-white hover:bg-slate-50 flex gap-4 text-xs">
                <span className="font-black text-[#ff007f] uppercase font-mono min-w-[120px]">{c.concept}</span>
                <span className="text-slate-800 leading-normal">{c.definition}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RENDER TAB 5: COMPARE */}
      {activeFeatureTab === 'compare' && (
        <div className="space-y-4">
          <h4 className="font-bold text-xs uppercase font-mono">Side-by-Side Term Comparison</h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] uppercase font-bold text-slate-500">Select Left Concept</label>
              <select
                value={conceptA}
                onChange={(e) => setConceptA(e.target.value)}
                className="w-full text-xs p-1.5 border-2 border-black bg-white font-mono"
              >
                {synthesis.concepts.map((c, i) => (
                  <option key={i} value={c.concept}>{c.concept}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[9px] uppercase font-bold text-slate-500">Select Right Concept</label>
              <select
                value={conceptB}
                onChange={(e) => setConceptB(e.target.value)}
                className="w-full text-xs p-1.5 border-2 border-black bg-white font-mono"
              >
                {synthesis.concepts.map((c, i) => (
                  <option key={i} value={c.concept}>{c.concept}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-pink-50/20 border-2 border-pink-500 text-xs">
              <h5 className="font-black text-xs text-[#ff007f] uppercase mb-2">A: {conceptA}</h5>
              <p className="text-slate-700 leading-relaxed">
                {synthesis.concepts.find(c => c.concept === conceptA)?.definition || "Selected concept definition summary data. Used as basic reference index."}
              </p>
              <div className="mt-3 text-[10px] font-mono text-slate-500 font-bold uppercase uppercase text-slate-600">
                ★ Importance Weight: {synthesis.concepts.find(c => c.concept === conceptA)?.importance.toUpperCase() || 'MEDIUM'}
              </div>
            </div>

            <div className="p-4 bg-emerald-50/20 border-2 border-emerald-500 text-xs">
              <h5 className="font-black text-xs text-emerald-600 uppercase mb-2">B: {conceptB}</h5>
              <p className="text-slate-700 leading-relaxed">
                {synthesis.concepts.find(c => c.concept === conceptB)?.definition || "Selected comparison definition specifications. Essential for exams."}
              </p>
              <div className="mt-3 text-[10px] font-mono text-slate-500 font-bold uppercase text-slate-600">
                ★ Importance Weight: {synthesis.concepts.find(c => c.concept === conceptB)?.importance.toUpperCase() || 'MEDIUM'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENDER TAB 6: EXPLAIN */}
      {activeFeatureTab === 'explain' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-wrap gap-2 mb-2 border-b border-slate-200 pb-2">
            {[
              { id: 'eli5', name: '👶 ELI5 (5-Year-Old)' },
              { id: 'student', name: '🎓 Standard Student' },
              { id: 'deep_dive', name: '🔬 Academic Deep Dive' },
              { id: 'analogy', name: '⚓ Metaphor / Analogy' }
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setExplanationDepth(opt.id as any)}
                className={`px-3 py-1 text-xs border border-black font-bold uppercase transition cursor-pointer ${
                  explanationDepth === opt.id ? 'bg-[#ff007f] text-white' : 'bg-slate-50 text-slate-900 hover:bg-slate-100'
                }`}
              >
                {opt.name}
              </button>
            ))}
          </div>

          <div className="p-4 bg-slate-50 border-2 border-black font-mono text-xs leading-relaxed">
            <h5 className="font-black uppercase mb-1.5 text-slate-800">Explanation Roster:</h5>
            <p className="text-slate-800">{getExplanation()}</p>
          </div>
        </div>
      )}

      {/* RENDER TAB 7: TAGGER */}
      {activeFeatureTab === 'tagger' && (
        <div className="space-y-4 font-mono text-xs">
          <h4 className="font-bold text-xs uppercase">Auto-Tagging Evaluator</h4>
          <div className="p-3 bg-slate-50 border-2 border-black space-y-2.5">
            <div className="flex justify-between border-b pb-1">
              <span className="font-bold">SUGGESTED SUBJECT:</span>
              <span className="font-bold text-[#ff007f] uppercase">Academic specialization</span>
            </div>
            <div className="flex justify-between border-b pb-1">
              <span className="font-bold">COGNITIVE COMPLEXITY:</span>
              <span className="font-bold text-amber-500">MEDIUM - ADVANCED</span>
            </div>
            <div className="flex justify-between border-b pb-1">
              <span className="font-bold">EXAM READINESS METRIC:</span>
              <span className="font-bold text-[#00ff66] bg-black px-1.5">LVL 82 / 100</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1.5">
              <span className="bg-black text-white px-2 py-0.5 text-[10px] uppercase font-bold">#ExamReady</span>
              <span className="bg-black text-white px-2 py-0.5 text-[10px] uppercase font-bold">#{synthesis.concepts[0]?.concept || 'CoreStudy'}</span>
              <span className="bg-black text-white px-2 py-0.5 text-[10px] uppercase font-bold">#SecondBrain</span>
            </div>
          </div>
        </div>
      )}

      {/* RENDER TAB 8: EXAM TIPS */}
      {activeFeatureTab === 'examtips' && (
        <div className="space-y-4">
          <h4 className="font-bold text-xs uppercase font-mono">Exam Strategy Mnemonics & Mistakes</h4>
          <div className="space-y-3">
            <div className="p-3 bg-red-50 border-2 border-red-500 text-xs">
              <h5 className="font-black uppercase text-red-700 flex items-center gap-1">⚠️ Class Common Mistakes</h5>
              <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-700">
                <li>Confusing catalytic parameters with thermodynamic velocity.</li>
                <li>Overlooking the activation weights regularization parameters during backprop steps.</li>
                <li>Improper coordinate scales on complex structural sketches.</li>
              </ul>
            </div>

            <div className="p-3 bg-amber-50 border-2 border-amber-500 text-xs">
              <h5 className="font-black uppercase text-amber-700 flex items-center gap-1">⭐ Brain Mnemonics Link</h5>
              <p className="mt-1 text-slate-700">
                Remember <strong className="text-black font-mono">"O.I.E.C"</strong>: <strong>O</strong>uter framework ➔ <strong>I</strong>nternal mechanisms ➔ <strong>E</strong>quilibrium threshold ➔ <strong>C</strong>atalytic results.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* RENDER TAB 9: ESSAY */}
      {activeFeatureTab === 'essay' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div>
              <label className="text-[9px] uppercase font-bold">Length Choice</label>
              <select
                value={essayLength}
                onChange={(e) => setEssayLength(e.target.value as any)}
                className="w-full text-xs p-1.5 border-2 border-black bg-white"
              >
                <option value="medium">Medium Standard (~400 words)</option>
                <option value="long">Extended Argument (~800 words)</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] uppercase font-bold">Academic Stage</label>
              <select
                value={essayLevel}
                onChange={(e) => setEssayLevel(e.target.value as any)}
                className="w-full text-xs p-1.5 border-2 border-black bg-white"
              >
                <option value="highschool">High School Freshman</option>
                <option value="undergrad">University Graduate</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-2 border-black font-mono text-xs leading-relaxed text-slate-800">
            <h5 className="font-black uppercase text-slate-900 border-b pb-1 mb-2">GENERATED ESSAY PERSPECTIVE:</h5>
            <p className="font-bold text-[#ff007f] text-sm uppercase mb-3">Academic Analysis: The Dialectics of {synthesis.title}</p>
            <p>
              The study of {synthesis.title} represents a fundamental paradigm shift in modern theoretical and practical pedagogy. In analyzing the first-principles, we encounter the central tension of its primary driver, namely "{synthesis.concepts[0]?.concept || 'the core system'}", which acts as the main vector of operations.
            </p>
            <p className="mt-2">
              Furthermore, scholars note that {synthesis.concepts[1]?.concept || 'secondary attributes'} play a crucial role in establishing programmatic stable outcomes. Without this core layer support, the entire system decaying under high entropy stress. Thus, systematic mastery is recommended for exam ready confidence.
            </p>
          </div>
        </div>
      )}

      {/* RENDER TAB 10: SPACED REV. */}
      {activeFeatureTab === 'spacedrev' && (
        <div className="space-y-4">
          <h4 className="font-bold text-xs uppercase font-mono">Ebbinghaus Forgetting Curve Spaced Repetition Timeline</h4>
          <div className="overflow-x-auto">
            <table className="w-full border-2 border-black text-xs text-left">
              <thead>
                <tr className="bg-black text-white font-mono">
                  <th className="p-2 border border-black">Session Interval</th>
                  <th className="p-2 border border-black">Target Date</th>
                  <th className="p-2 border border-black">Optimal Focus Focus</th>
                  <th className="p-2 border border-black">Metric Threshold</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black">
                <tr className="bg-white">
                  <td className="p-2 font-bold font-mono">1. Immediate Recall</td>
                  <td className="p-2">In 20 minutes</td>
                  <td className="p-2">Review Summary & Top Takeaways</td>
                  <td className="p-2 text-[#00ff66] bg-black font-mono text-center">★ 100% Ret</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="p-2 font-bold font-mono">2. Day 1 Ingress</td>
                  <td className="p-2">Tomorrow</td>
                  <td className="p-2">Practice Memory Match / Active Slate</td>
                  <td className="p-2 text-yellow-500 bg-black font-mono text-center">★ 80% Ret</td>
                </tr>
                <tr className="bg-white">
                  <td className="p-2 font-bold font-mono">3. Day 7 Solidify</td>
                  <td className="p-2">In 1 week</td>
                  <td className="p-2">Run Extreme Timed Quiz</td>
                  <td className="p-2 text-pink-500 bg-black font-mono text-center">★ 65% Ret</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="p-2 font-bold font-mono">4. Month 1 Vault</td>
                  <td className="p-2">In 30 days</td>
                  <td className="p-2">Integrate term definitions into essay writing drafts</td>
                  <td className="p-2 text-cyan-400 bg-black font-mono text-center">★ 50% Ret</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RENDER TAB 11: STUDY PLAN */}
      {activeFeatureTab === 'studyplan' && (
        <div className="space-y-3">
          <h4 className="font-bold text-xs uppercase font-mono">Personalized Study Planner</h4>
          <div className="border-l-4 border-black pl-4 space-y-4">
            <div className="space-y-1">
              <div className="text-xs font-black uppercase font-mono text-[#ff007f]">DAY 1: CONCEPT DISPATCH</div>
              <p className="text-xs text-slate-700 leading-normal">
                Carefully parse the executive summaries. Identify {synthesis.concepts[0]?.concept || 'primary concepts'} and write standard flashcards. Complete at least one 25m Pomodoro cycle.
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="text-xs font-black uppercase font-mono text-emerald-600">DAY 2: SYNAPSE CONNECTION</div>
              <p className="text-xs text-slate-700 leading-normal">
                Engage in vocabulary match matches and hangman speed tests. Reconstruct the ASCII topological mind map from pure recall memory.
              </p>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-black uppercase font-mono text-indigo-600">DAY 3: COMPASS CRITIQUE</div>
              <p className="text-xs text-slate-700 leading-normal">
                Draft college essays summarizing relationships. Discuss with AI Tutor queries regarding potential trick exam scenarios.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* RENDER TAB 12: TRANSLATE */}
      {activeFeatureTab === 'translate' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[150px]">
              <label className="text-[10px] font-mono font-bold text-slate-600 uppercase block mb-1">Target Language Matrix</label>
              <select
                value={translateLang}
                onChange={(e) => setTranslateLang(e.target.value)}
                className="w-full text-xs p-2 border-2 border-black bg-white font-bold"
              >
                {LanguagesList.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            <button
              onClick={triggerTranslation}
              disabled={isTranslating}
              className="px-6 py-2 bg-black hover:bg-[#ff007f] text-[#00ff66] hover:text-white font-mono font-bold text-xs uppercase border-2 border-black cursor-pointer shadow-[3px_3px_0px_black] active:translate-y-[1px]"
            >
              {isTranslating ? 'Synthesizing...' : 'Execute Translation'}
            </button>
          </div>

          <div className="p-3 border-2 border-black bg-slate-50 min-h-[90px] font-mono text-xs leading-relaxed text-slate-800">
            {translatedText ? (
              <div>
                <div className="font-bold text-[#ff007f] text-[9px] mb-1 uppercase">★ TRANSLATION RECEIVED ({translateLang}) ★</div>
                <p>{translatedText}</p>
              </div>
            ) : (
              <span className="text-slate-400 italic">Core translator engine standby. Choose a dialect and press execute translation.</span>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
