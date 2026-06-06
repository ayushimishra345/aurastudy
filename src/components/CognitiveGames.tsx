/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { 
  Zap, Star, Trophy, RefreshCw, AlertTriangle, Check, X,
  Timer, Award, Flame, Compass, HelpCircle
} from 'lucide-react';
import { StudyTheme, SynthesizedBrain } from '../types';

interface CognitiveGamesProps {
  currentTheme: StudyTheme;
  synthesis: SynthesizedBrain;
  activeGameId: string; // 'game-guess' | 'game-scramble' | 'game-match' | 'game-tf' | 'game-fire'
  onAddXp: (amount: number) => void;
}

// 1. Types for Word Guess
interface MysteryWord {
  word: string;
  hint: string;
}

// 2. Types for Memory Match
interface MatchCard {
  id: string;
  label: string;
  type: 'concept' | 'def';
  pairedId: number; // concept index reference
  isFlipped: boolean;
  isMatched: boolean;
}

export default function CognitiveGames({ currentTheme, synthesis, activeGameId, onAddXp }: CognitiveGamesProps) {
  
  // Game success notification
  const [successPhrase, setSuccessPhrase] = useState<string | null>(null);

  // Sound Synth Synthesizer for Retro Game Beeps (No static files required!)
  const playSfx = (freq: number, type: 'sine'|'square'|'triangle'|'sawtooth' = 'sine', duration = 100) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      setTimeout(() => {
        osc.stop();
        audioCtx.close();
      }, duration);
    } catch (e) {
      console.warn("Audio Context blocked by policy.");
    }
  };


  // ==========================================
  // GAME A: WORD GUESS (HANGMAN MODEL)
  // ==========================================
  const [guessWordsList, setGuessWordsList] = useState<MysteryWord[]>([]);
  const [currentGuessIndex, setCurrentGuessIndex] = useState(0);
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [wrongCount, setWrongCount] = useState(0);
  const maxWrong = 6;

  useEffect(() => {
    if (synthesis.concepts.length > 0) {
      const parsed = synthesis.concepts.map(c => ({
        word: c.concept.toUpperCase().replace(/[^\p{L}\p{N}]/gu, ''),
        hint: c.definition
      })).filter(w => w.word.length >= 2);
      
      if (parsed.length === 0) {
        parsed.push({ word: 'COGNITIVE', hint: 'Relating to mental processes' });
      }
      setGuessWordsList(parsed);
      setCurrentGuessIndex(0);
      setGuessedLetters([]);
      setWrongCount(0);
    }
  }, [synthesis]);

  const activeMystery = guessWordsList[currentGuessIndex] || { word: 'COGNITIVE', hint: 'Relating to mental processes' };

  const getWordDisplay = () => {
    return activeMystery.word.split('').map(char => 
      guessedLetters.includes(char) ? char : '_'
    ).join(' ');
  };

  const handleLetterGuess = (letter: string) => {
    if (guessedLetters.includes(letter) || wrongCount >= maxWrong) return;
    
    const isCorrect = activeMystery.word.includes(letter);
    setGuessedLetters(prev => [...prev, letter]);
    
    if (isCorrect) {
      playSfx(523, 'sine', 120); // Nice pitch
      onAddXp(20);
      
      // Check if won
      const allGuessed = activeMystery.word.split('').every(char => 
        [...guessedLetters, letter].includes(char)
      );
      if (allGuessed) {
        playSfx(880, 'sine', 350);
        onAddXp(150); // Won study bonus
        setSuccessPhrase(`🏆 Correct! The term is "${activeMystery.word}". You secured +150 XP!`);
      }
    } else {
      playSfx(147, 'sawtooth', 150); // Error buzz
      setWrongCount(p => p + 1);
    }
  };

  const handleNextGuessWord = () => {
    setSuccessPhrase(null);
    setGuessedLetters([]);
    setWrongCount(0);
    setCurrentGuessIndex(prev => (prev + 1) % guessWordsList.length);
  };

  const getActiveAlphabet = (): string[] => {
    const hasUnicode = /[^\x00-\x7F]/.test(activeMystery.word);
    
    if (hasUnicode) {
      const wordChars = activeMystery.word.split('').filter(c => c.trim() !== '') as string[];
      const uniqueChars = Array.from(new Set(wordChars)) as string[];
      
      const otherWordsChars = guessWordsList
        .map(w => w.word.split(''))
        .flat()
        .filter(c => c.trim() !== '' && !uniqueChars.includes(c)) as string[];
      const filteredOtherChars = Array.from(new Set(otherWordsChars)) as string[];
      
      const combinedCount = Math.max(14, uniqueChars.length + Math.min(7, filteredOtherChars.length));
      const combined = [...uniqueChars, ...filteredOtherChars].slice(0, Math.max(14, combinedCount)).sort() as string[];
      return combined;
    } else {
      return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    }
  };

  const alphabet = getActiveAlphabet();


  // ==========================================
  // GAME B: RAPID FIRE (STREAKS & TIMERS - STABLE INTERVALLING!)
  // ==========================================
  const [rfQuestions, setRfQuestions] = useState<{ q: string; a: string; options: string[] }[]>([]);
  const [rfIdx, setRfIdx] = useState(0);
  const [rfScore, setRfScore] = useState(0);
  const [rfStreak, setRfStreak] = useState(0);
  const [rfTimer, setRfTimer] = useState(8);
  const [isRfActive, setIsRfActive] = useState(false);
  const [rfFeedback, setRfFeedback] = useState<'correct' | 'wrong' | 'timeout' | null>(null);
  const rfIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (synthesis.concepts.length > 0) {
      const qSets = synthesis.concepts.map((c, i) => {
        const falseDef = synthesis.concepts[(i + 1) % synthesis.concepts.length]?.definition || "Alt definition context.";
        return {
          q: `Is "${c.concept}" correctly defined as: "${c.definition}"?`,
          a: 'TRUE',
          options: ['TRUE', 'FALSE']
        };
      });
      
      // Inject some false ones to make Q&As active
      if (synthesis.concepts.length > 1) {
        synthesis.concepts.forEach((c, i) => {
          const falseDef = synthesis.concepts[(i + 1) % synthesis.concepts.length]?.definition;
          qSets.push({
            q: `Is "${c.concept}" correctly defined as: "${falseDef}"?`,
            a: 'FALSE',
            options: ['TRUE', 'FALSE']
          });
        });
      }

      setRfQuestions(qSets.sort(() => Math.random() - 0.5));
    }
  }, [synthesis]);

  // Handle clean single interval for timer. Reset on RF question load.
  useEffect(() => {
    if (isRfActive && rfFeedback === null) {
      rfIntervalRef.current = setInterval(() => {
        setRfTimer(prev => {
          if (prev <= 1) {
            handleRfTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (rfIntervalRef.current) clearInterval(rfIntervalRef.current);
    }
    return () => {
      if (rfIntervalRef.current) clearInterval(rfIntervalRef.current);
    };
  }, [isRfActive, rfIdx, rfFeedback]);

  const handleStartRfGame = () => {
    setRfIdx(0);
    setRfScore(0);
    setRfStreak(0);
    setRfTimer(8);
    setRfFeedback(null);
    setSuccessPhrase(null);
    setIsRfActive(true);
    playSfx(587, 'sine', 150);
  };

  const handleRfTimeout = () => {
    playSfx(220, 'square', 250);
    setRfFeedback('timeout');
    setRfStreak(0);
  };

  const handleRfAnswer = (ans: string) => {
    if (rfFeedback !== null) return;
    
    // Stop single timers
    if (rfIntervalRef.current) clearInterval(rfIntervalRef.current);
    
    const correctAns = rfQuestions[rfIdx]?.a || 'TRUE';
    if (ans === correctAns) {
      playSfx(659, 'sine', 110);
      setRfFeedback('correct');
      setRfScore(s => s + 1);
      setRfStreak(s => s + 1);
      onAddXp(50 + (rfStreak * 10)); // Reward increased via multiplier streak!
    } else {
      playSfx(147, 'triangle', 200);
      setRfFeedback('wrong');
      setRfStreak(0);
    }
  };

  const handleNextRfQ = () => {
    setRfFeedback(null);
    setRfTimer(8);
    if (rfIdx + 1 >= rfQuestions.length) {
      setIsRfActive(false);
      onAddXp(300); // Complete game bonus
      setSuccessPhrase(`🎮 Rapid Fire Completed! Score: ${rfScore} / ${rfQuestions.length}. You earned +300 study XP!`);
    } else {
      setRfIdx(i => i + 1);
    }
  };


  // ==========================================
  // GAME C: WORD SCRAMBLE
  // ==========================================
  const [scrambleList, setScrambleList] = useState<{ clean: string; scrambled: string; hint: string }[]>([]);
  const [scIndex, setScIndex] = useState(0);
  const [scInput, setScInput] = useState('');
  const [isScCorrect, setIsScCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    if (synthesis.concepts.length > 0) {
      const items = synthesis.concepts.map(c => {
        const word = c.concept.toUpperCase().replace(/[^\p{L}\p{N}]/gu, '');
        // Shuffle letters
        const chars = word.split('');
        for (let i = chars.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [chars[i], chars[j]] = [chars[j], chars[i]];
        }
        return {
          clean: word,
          scrambled: chars.join(''),
          hint: c.definition
        };
      }).filter(w => w.clean.length >= 2);

      setScrambleList(items);
      setScIndex(0);
      setScInput('');
      setIsScCorrect(null);
    }
  }, [synthesis]);

  const activeScramble = scrambleList[scIndex] || { clean: 'SYNAPSE', scrambled: 'PAYNSES', hint: 'The connection junctions between neurons.' };

  const handleCheckScrambleInput = () => {
    if (scInput.toUpperCase().trim() === activeScramble.clean) {
      playSfx(698, 'sine', 150);
      setIsScCorrect(true);
      onAddXp(120);
      setSuccessPhrase(`🏆 Correctly Unscrambled! You found "${activeScramble.clean}". Obtained +120 XP!`);
    } else {
      playSfx(165, 'square', 180);
      setIsScCorrect(false);
    }
  };

  const handleNextScramble = () => {
    setSuccessPhrase(null);
    setIsScCorrect(null);
    setScInput('');
    setScIndex(p => (p + 1) % scrambleList.length);
  };


  // ==========================================
  // GAME D: MEMORY MATCH (CARDS MATCHING GAME - 10 CARDS)
  // ==========================================
  const [matchDeck, setMatchDeck] = useState<MatchCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]); // stores MatchCard index
  const [matchesCount, setMatchesCount] = useState(0);

  const startMemoryMatchGame = () => {
    if (synthesis.concepts.length < 3) return;
    
    // Choose top 5 concepts to make a 10 deck layout
    const targetConcepts = synthesis.concepts.slice(0, 5);
    const conceptualCards: MatchCard[] = [];
    
    targetConcepts.forEach((c, idx) => {
      // Add concept word card
      conceptualCards.push({
        id: `c-${idx}`,
        label: c.concept.toUpperCase(),
        type: 'concept',
        pairedId: idx,
        isFlipped: false,
        isMatched: false
      });
      // Add definition card
      conceptualCards.push({
        id: `d-${idx}`,
        label: c.definition.slice(0, 50) + '...',
        type: 'def',
        pairedId: idx,
        isFlipped: false,
        isMatched: false
      });
    });

    // Shuffle
    const shuffledCards = conceptualCards
      .map((c, i) => ({ ...c, originalIdx: i }))
      .sort(() => Math.random() - 0.5);

    setMatchDeck(shuffledCards);
    setSelectedCards([]);
    setMatchesCount(0);
    setSuccessPhrase(null);
  };

  useEffect(() => {
    startMemoryMatchGame();
  }, [synthesis, activeGameId]);

  const handleFlipMatchCard = (idx: number) => {
    const card = matchDeck[idx];
    if (card.isFlipped || card.isMatched || selectedCards.length >= 2) return;
    
    playSfx(440, 'triangle', 80);
    
    // Flip card
    const updated = [...matchDeck];
    updated[idx].isFlipped = true;
    setMatchDeck(updated);
    
    const newSelected = [...selectedCards, idx];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      const idx1 = newSelected[0];
      const idx2 = newSelected[1];
      const card1 = matchDeck[idx1];
      const card2 = matchDeck[idx2];

      if (card1.pairedId === card2.pairedId && card1.type !== card2.type) {
        // MATCH FOUND!
        setTimeout(() => {
          playSfx(784, 'sine', 200);
          const matchedDeck = matchDeck.map((c, i) => {
            if (i === idx1 || i === idx2) {
              return { ...c, isMatched: true };
            }
            return c;
          });
          setMatchDeck(matchedDeck);
          setSelectedCards([]);
          setMatchesCount(m => {
            const nextVal = m + 1;
            if (nextVal === 5) {
              // WON FULL BOARD!
              onAddXp(250);
              setSuccessPhrase("🏆 Board Cleared! Masterfully matched all terminology side-by-side! Reaped +250 Study XP!");
            }
            return nextVal;
          });
          onAddXp(50);
        }, 500);
      } else {
        // FAIL MATCH. FLIP BACK
        setTimeout(() => {
          playSfx(147, 'sine', 150);
          const ResetFlippedDeck = matchDeck.map((c, i) => {
            if (i === idx1 || i === idx2) {
              return { ...c, isFlipped: false };
            }
            return c;
          });
          setMatchDeck(ResetFlippedDeck);
          setSelectedCards([]);
        }, 1100);
      }
    }
  };


  // ==========================================
  // GAME E: TRUE / FALSE BLITZ
  // ==========================================
  const [tfQuestions, setTfQuestions] = useState<{ statement: string; isCorrect: boolean; explanation: string }[]>([]);
  const [tfIndex, setTfIndex] = useState(0);
  const [tfScore, setTfScore] = useState(0);
  const [tfFeedback, setTfFeedback] = useState<'right' | 'wrong' | null>(null);

  useEffect(() => {
    if (synthesis.concepts.length > 0) {
      const sets = [
        {
          statement: `Is the concept "${synthesis.concepts[0]?.concept || 'Primary study point'}" ranked as higher importance than alt secondary metadata?`,
          isCorrect: true,
          explanation: "Primary synthesized takeaways represent first-principles foundations."
        },
        {
          statement: `Is it true that "${synthesis.concepts[0]?.concept || 'Your Concept'}" represents a low-priority detail that can safely be bypassed?`,
          isCorrect: false,
          explanation: `Bypassing "${synthesis.concepts[0]?.concept || 'Your Concept'}" destroys active cognitive mapping constructs.`
        }
      ];
      if (synthesis.concepts[1]) {
        sets.push({
          statement: `Regarding notes: "${synthesis.concepts[1].concept}" is essential for forming structural academic outcomes.`,
          isCorrect: true,
          explanation: synthesis.concepts[1].definition
        });
      }
      setTfQuestions(sets);
      setTfIndex(0);
      setTfScore(0);
      setTfFeedback(null);
    }
  }, [synthesis]);

  const activeTF = tfQuestions[tfIndex] || { statement: 'Standard True/False Statement placeholder ready.', isCorrect: true, explanation: 'Basic concept context' };

  const handleTfTrigger = (choice: boolean) => {
    if (tfFeedback !== null) return;
    
    if (choice === activeTF.isCorrect) {
      playSfx(587, 'sine', 120);
      setTfFeedback('right');
      setTfScore(s => s + 1);
      onAddXp(80);
    } else {
      playSfx(130, 'square', 180);
      setTfFeedback('wrong');
    }
  };

  const handleNextTF = () => {
    setTfFeedback(null);
    if (tfIndex + 1 >= tfQuestions.length) {
      setSuccessPhrase(`🏆 True/False Blitz complete! Score: ${tfScore} / ${tfQuestions.length}. Securing final exam confidence!`);
    } else {
      setTfIndex(p => p + 1);
    }
  };

  return (
    <div className={`p-6 border-3 border-black text-black bg-white rounded-none shadow-[6px_6px_0px_black] space-y-6`}>
      
      {/* Visual Header */}
      <div className="border-b-2 border-black pb-2 flex justify-between items-center bg-yellow-100 p-2 border">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h3 className="font-brutal font-extrabold text-sm uppercase">
            ARCADE GAME: {activeGameId === 'game-guess' ? 'Word Guess (Hangman)' : 
                            activeGameId === 'game-scramble' ? 'Word Scramble' : 
                            activeGameId === 'game-match' ? 'Memory Match Deck' : 
                            activeGameId === 'game-tf' ? 'True / False Blitz' : 'Rapid Q&A Fire'}
          </h3>
        </div>
        <span className="text-[10px] font-mono font-black uppercase text-slate-800">
          ★ Arcade XP multiplier ACTIVE
        </span>
      </div>

      {/* Success Modal */}
      {successPhrase && (
        <div className="p-4 bg-emerald-50 border-3 border-emerald-500 text-slate-900 font-mono text-xs font-bold leading-relaxed space-y-3">
          <p>{successPhrase}</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSuccessPhrase(null);
                if (activeGameId === 'game-guess') handleNextGuessWord();
                if (activeGameId === 'game-scramble') handleNextScramble();
                if (activeGameId === 'game-match') startMemoryMatchGame();
                if (activeGameId === 'game-tf') { setTfIndex(0); setTfScore(0); }
                if (activeGameId === 'game-fire') handleStartRfGame();
              }}
              className="px-3 py-1 bg-black text-[#00ff66] font-mono uppercase text-[10px] border border-black cursor-pointer shadow-[2px_2px_0px_black]"
            >
              Play Board Again
            </button>
          </div>
        </div>
      )}

      {/* ======================= RENDER GAME: WORD GUESS ======================= */}
      {activeGameId === 'game-guess' && !successPhrase && (
        <div className="space-y-4 animate-fade-in text-center max-w-md mx-auto">
          <div className="text-left bg-slate-50 border border-slate-300 p-2.5 text-xs font-mono">
            <span className="font-bold text-[#ff007f] uppercase">DEFINITION HINT:</span>
            <p className="mt-0.5 text-slate-705 leading-relaxed">{activeMystery.hint}</p>
          </div>

          {/* Graphic wrong count display */}
          <div className="text-3xl font-mono tracking-widest text-[#ff007f] my-4 transition">
            💀 {wrongCount} / {maxWrong} STRIKES
          </div>

          <div className="text-2xl font-black font-mono tracking-widest bg-zinc-900 text-[#00ff66] py-3.5 px-4 inline-block border-2 border-black">
            {getWordDisplay()}
          </div>

          {/* Virtual terminal keyboard */}
          <div className="grid grid-cols-7 gap-1.5 pt-3 select-none">
            {alphabet.map((letter) => (
              <button
                key={letter}
                onClick={() => handleLetterGuess(letter)}
                disabled={guessedLetters.includes(letter) || wrongCount >= maxWrong}
                className={`py-1 text-xs font-bold border border-black uppercase font-mono cursor-pointer transition ${
                  guessedLetters.includes(letter)
                    ? 'bg-zinc-200 text-slate-400 opacity-50'
                    : 'bg-white hover:bg-slate-100 text-black'
                }`}
              >
                {letter}
              </button>
            ))}
          </div>

          <button
            onClick={handleNextGuessWord}
            className="mt-6 w-full py-1.5 bg-black hover:bg-zinc-800 text-white font-mono font-bold text-xs uppercase cursor-pointer border border-black active:translate-y-[1px]"
          >
            Skip / Next Keyword
          </button>
        </div>
      )}

      {/* ======================= RENDER GAME: RAPID FIRE (STABLE countdown implementation) ======================= */}
      {activeGameId === 'game-fire' && !successPhrase && (
        <div className="space-y-4 animate-fade-in text-center max-w-md mx-auto">
          
          {!isRfActive ? (
            <div className="space-y-4 py-6">
              <p className="text-xs font-mono text-slate-600">
                You will be asked speed true/false statements relating to definitions. Timers reset with each prompt. Let's see your high score streak!
              </p>
              <button
                onClick={handleStartRfGame}
                className="py-2 px-6 bg-[#00ff66] hover:bg-green-500 text-black border-2 border-black font-black font-mono text-xs uppercase cursor-pointer shadow-[3px_3px_0px_black]"
              >
                🎮 Ignite Rapid Fire Loop
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Score indicators */}
              <div className="flex justify-between font-mono text-xs">
                <span className="font-bold flex items-center gap-1">
                  <Flame className="w-4.5 h-4.5 text-red-500 fill-current" />
                  STREAK: {rfStreak}x
                </span>
                <span className="font-bold">SCORE: {rfScore} / {rfQuestions.length}</span>
              </div>

              {/* Timer indicator and gauge */}
              <div className="p-2 border-2 border-black bg-zinc-950 text-white font-mono text-center flex items-center justify-between">
                <span className="text-[10px] text-slate-400">BULLET TIMER STANDBY</span>
                <span className={`text-xl font-bold ${rfTimer <= 3 ? 'text-red-500 animate-pulse':'text-[#00ff66]'}`}>
                  ⏱ {rfTimer}s
                </span>
              </div>

              {/* Question container */}
              <div className="p-4 border-2 border-black bg-slate-50 text-xs text-left font-mono min-h-[90px] flex items-center leading-relaxed">
                {rfQuestions[rfIdx]?.q}
              </div>

              {/* Feedback responses */}
              {rfFeedback !== null && (
                <div className={`p-2 font-mono text-xs font-bold uppercase ${
                  rfFeedback === 'correct' ? 'bg-emerald-100 text-emerald-800' :
                  rfFeedback === 'wrong' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {rfFeedback === 'correct' ? '✓ EXCELLENT RECALL (+50 XP!)' :
                   rfFeedback === 'wrong' ? '❌ INCORRECT STREAK LOST' : '⏰ TIMEOUT STREAK LOST'}
                </div>
              )}

              {/* Buttons choices */}
              {rfFeedback === null ? (
                <div className="grid grid-cols-2 gap-3 pt-2 select-none">
                  <button
                    onClick={() => handleRfAnswer('TRUE')}
                    className="py-2.5 bg-[#00ff66] hover:bg-green-500 text-black font-black border-2 border-black uppercase text-xs cursor-pointer active:translate-y-[1px]"
                  >
                    TRUE
                  </button>
                  <button
                    onClick={() => handleRfAnswer('FALSE')}
                    className="py-2.5 bg-[#ff007f] hover:bg-pink-600 text-white font-black border-2 border-black uppercase text-xs cursor-pointer active:translate-y-[1px]"
                  >
                    FALSE
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleNextRfQ}
                  className="py-2 bg-black hover:bg-zinc-800 text-white font-black font-mono uppercase text-xs w-full cursor-pointer mt-2"
                >
                  Load Next Prompt ⏵
                </button>
              )}

            </div>
          )}

        </div>
      )}

      {/* ======================= RENDER GAME: WORD SCRAMBLE ======================= */}
      {activeGameId === 'game-scramble' && !successPhrase && (
        <div className="space-y-4 animate-fade-in text-center max-w-md mx-auto">
          <div className="text-left bg-slate-50 border border-slate-300 p-2.5 text-xs font-mono">
            <span className="font-bold text-[#ff007f] uppercase">DEFINITION HINT:</span>
            <p className="mt-0.5 text-slate-700 leading-relaxed">{activeScramble.hint}</p>
          </div>

          <div className="text-2xl font-black font-mono tracking-widest text-[#ff007f] bg-slate-100 inline-block px-6 py-2.5 border-2 border-dashed border-black">
            {activeScramble.scrambled}
          </div>

          <div className="space-y-2 pt-2">
            <input
              type="text"
              placeholder="Spell your unscrambled terminology answer..."
              value={scInput}
              onChange={(e) => setScInput(e.target.value)}
              className="w-full font-mono text-center border-2 border-black p-2 bg-white text-black text-xs font-bold uppercase"
              onKeyDown={(e) => e.key === 'Enter' && handleCheckScrambleInput()}
            />
            
            {isScCorrect === false && (
              <p className="text-xs font-mono font-bold text-red-600 uppercase">❌ INCORRECT SPELLING. TRY AGAIN!</p>
            )}

            <div className="grid grid-cols-2 gap-3 select-none">
              <button
                onClick={handleCheckScrambleInput}
                className="py-2 bg-black hover:bg-zinc-800 text-[#00ff66] font-bold border border-black uppercase text-xs cursor-pointer"
              >
                Unscramble Answer
              </button>
              <button
                onClick={handleNextScramble}
                className="py-2 bg-white hover:bg-slate-100 text-black border border-black uppercase text-xs cursor-pointer"
              >
                Skip Word
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= RENDER GAME: MEMORY MATCH ======================= */}
      {activeGameId === 'game-match' && !successPhrase && (
        <div className="space-y-4 animate-fade-in font-mono text-center">
          <div className="flex justify-between text-xs pb-1 mb-2">
            <span className="font-bold">STATUS: MATCHING TERMS TO DEFS</span>
            <span className="font-bold text-green-700">MATCHES: {matchesCount} / 5</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 select-none">
            {matchDeck.map((card, idx) => (
              <div
                key={card.id}
                onClick={() => handleFlipMatchCard(idx)}
                className={`p-2 min-h-[90px] border-2 border-black flex flex-col justify-center items-center text-center cursor-pointer transition-all text-[10px] sm:text-xs leading-tight ${
                  card.isMatched 
                    ? 'bg-emerald-50 opacity-40 border-emerald-500 line-through' 
                    : card.isFlipped 
                      ? 'bg-white font-bold' 
                      : 'bg-zinc-950 text-white font-bold'
                }`}
              >
                {card.isMatched ? (
                  <span className="text-emerald-700 font-bold">✓ MATCHED</span>
                ) : card.isFlipped ? (
                  <div>
                    <span className="text-[7.5px] font-bold block mb-1 uppercase opacity-65 text-indigo-800">
                      [{card.type.toUpperCase()}]
                    </span>
                    <span className="font-bold">{card.label}</span>
                  </div>
                ) : (
                  <span className="font-black text-xs text-yellow-300">AURA ★ MATCH</span>
                )}
              </div>
            ))}
          </div>

          <div className="pt-3">
            <button
              onClick={startMemoryMatchGame}
              className="py-1.5 px-4 bg-slate-100 hover:bg-slate-200 border border-black text-xs uppercase font-bold cursor-pointer inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Matching Board</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================= RENDER GAME: TRUE/FALSE blitz ======================= */}
      {activeGameId === 'game-tf' && !successPhrase && (
        <div className="space-y-4 animate-fade-in text-center max-w-md mx-auto">
          <div className="text-left font-mono bg-indigo-50 text-indigo-950 p-2 border border-indigo-200 text-xs">
            <strong>BLITZ FLASH CARD STATEMENT:</strong>
            <p className="mt-1 font-bold leading-relaxed">{activeTF.statement}</p>
          </div>

          {tfFeedback !== null && (
            <div className={`p-3 font-mono text-xs border ${
              tfFeedback === 'right' ? 'bg-emerald-50 border-emerald-500' : 'bg-red-50 border-red-500'
            } text-left`}>
              <div className="font-bold uppercase text-xs mb-1">
                {tfFeedback === 'right' ? '✓ Correct Answer!' : '❌ Incorrect Statement'}
              </div>
              <p className="text-slate-700">{activeTF.explanation}</p>
            </div>
          )}

          {tfFeedback === null ? (
            <div className="grid grid-cols-2 gap-3 pt-2 select-none">
              <button
                onClick={() => handleTfTrigger(true)}
                className="py-2.5 bg-zinc-900 text-[#00ff66] font-bold uppercase text-xs border border-black cursor-pointer shadow-[2px_2px_0px_black]"
              >
                TRUE✓
              </button>
              <button
                onClick={() => handleTfTrigger(false)}
                className="py-2.5 bg-zinc-900 text-pink-500 font-bold uppercase text-xs border border-black cursor-pointer shadow-[2px_2px_0px_black]"
              >
                FALSE❌
              </button>
            </div>
          ) : (
            <button
              onClick={handleNextTF}
              className="py-2.5 bg-[#00ff66] text-black font-black uppercase text-xs w-full cursor-pointer mt-2 border-2 border-black"
            >
              Move to next verification ➔
            </button>
          )}

        </div>
      )}

    </div>
  );
}
