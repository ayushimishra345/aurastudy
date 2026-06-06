/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { 
  Eraser, RefreshCw, Download, Save, Image as ImageIcon, 
  Trash2, Sparkles, Check, ChevronRight, PenTool, Clipboard
} from 'lucide-react';
import { StudyTheme } from '../types';

interface DrawingCanvasProps {
  currentTheme: StudyTheme;
  onInsertTranscription: (text: string) => void;
  isLoadingOCR?: boolean;
}

interface SavedSketch {
  id: string;
  name: string;
  timestamp: string;
  dataUrl: string;
  transcription: string;
}

const INDIAN_LANGUAGES_OCR = [
  { code: 'Original', name: 'Original / English' },
  { code: 'Hindi', name: 'Hindi (हिन्दी)' },
  { code: 'Bengali', name: 'Bengali (বাংলা)' },
  { code: 'Telugu', name: 'Telugu (తెలుగు)' },
  { code: 'Marathi', name: 'Marathi (മराठी)' },
  { code: 'Tamil', name: 'Tamil (தமிழ்)' },
  { code: 'Gujarati', name: 'Gujarati (ગુજરાતી)' },
  { code: 'Urdu', name: 'Urdu (اردو)' },
  { code: 'Kannada', name: 'Kannada (ಕನ್ನಡ)' },
  { code: 'Odia', name: 'Odia (ଓଡ଼ିଆ)' },
  { code: 'Malayalam', name: 'Malayalam (മലയാളം)' },
  { code: 'Punjabi', name: 'Punjabi (ਪੰਜਾਬੀ)' },
  { code: 'Sanskrit', name: 'Sanskrit (संस्कृत)' }
];

export default function DrawingCanvas({ currentTheme, onInsertTranscription }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastX = useRef(0);
  const lastY = useRef(0);
  
  const [color, setColor] = useState('#ff007f'); // Hot pink default
  const [lineWidth, setLineWidth] = useState(4);
  const [isErasing, setIsErasing] = useState(false);
  const [savedSketches, setSavedSketches] = useState<SavedSketch[]>([]);
  const [sketchName, setSketchName] = useState('');
  const [transcribedText, setTranscribedText] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrLanguage, setOcrLanguage] = useState('Original');

  useEffect(() => {
    // Load saved canvas sketches
    const stored = localStorage.getItem('aurastudy_drawing_vault');
    if (stored) {
      try {
        setSavedSketches(JSON.parse(stored));
      } catch (err) {
        console.error(err);
      }
    }
    
    // Initialize Canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Make canvas responsive
    resizeCanvas();
    
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Store current drawings
    const tempImage = new Image();
    const currentData = canvas.toDataURL();
    tempImage.src = currentData;
    
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = 300;
    }
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Restore drawings
    tempImage.onload = () => {
      ctx.drawImage(tempImage, 0, 0);
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    isDrawing.current = true;
    
    // Get correct coordinates
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    lastX.current = clientX - rect.left;
    lastY.current = clientY - rect.top;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const currentX = clientX - rect.left;
    const currentY = clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(lastX.current, lastY.current);
    ctx.lineTo(currentX, currentY);
    ctx.strokeStyle = isErasing ? (currentTheme === 'minimal-light' ? '#ffffff' : '#18092C') : color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    
    lastX.current = currentX;
    lastY.current = currentY;
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `AuraSketch_${Date.now()}.png`;
    a.click();
  };

  // Simulated optical character transcription helper for notes canvas
  const handleAIOCR = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setOcrLoading(true);
    setTranscribedText('');

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: dataUrl,
          targetLanguage: ocrLanguage
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze blackboard drawings.');
      }

      setTranscribedText(data.transcription || 'Could not find readable characters on the blackboard.');
    } catch (err: any) {
      console.error(err);
      setTranscribedText(`Transcription failure: ${err.message || 'Ensure your Gemini API key has proper clearances.'}`);
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSaveSketch = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const strName = sketchName.trim() || `Blackboard Sketch #${savedSketches.length + 1}`;
    const dataUrl = canvas.toDataURL();
    
    const newSketch: SavedSketch = {
      id: Math.random().toString(36).substring(2, 9),
      name: strName,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dataUrl,
      transcription: transcribedText || "Simulated handwriting sketch capture ready."
    };
    
    const updated = [newSketch, ...savedSketches];
    setSavedSketches(updated);
    localStorage.setItem('aurastudy_drawing_vault', JSON.stringify(updated));
    setSketchName('');
  };

  const handleDeleteSketch = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedSketches.filter(s => s.id !== id);
    setSavedSketches(updated);
    localStorage.setItem('aurastudy_drawing_vault', JSON.stringify(updated));
  };

  const handleLoadSketchToCanvas = (dataUrl: string, trans: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
    };
    setTranscribedText(trans);
  };

  const neonColors = [
    { value: '#ff007f', name: 'Pink Retro' },
    { value: '#00ff66', name: 'Neon Green' },
    { value: '#00eeee', name: 'Cyber Blue' },
    { value: '#ffff00', name: 'Hot Yellow' },
    { value: '#ffffff', name: 'Monochrome' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Visual Canvas Drawing Area */}
      <div className={`p-4 border-2 border-black ${
        currentTheme === 'minimal-light' ? 'bg-white' : 'bg-black/40'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b-2 border-black pb-2">
          
          {/* Tool selections */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsErasing(false)}
              className={`p-1.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer ${
                !isErasing 
                  ? 'bg-accent-primary text-white border border-black' 
                  : 'bg-white hover:bg-slate-100 text-black border border-black'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Draw</span>
            </button>

            <button
              type="button"
              onClick={() => setIsErasing(true)}
              className={`p-1.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer ${
                isErasing 
                  ? 'bg-accent-secondary text-black border border-black animate-pulse' 
                  : 'bg-white hover:bg-slate-100 text-black border border-black'
              }`}
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Eraser</span>
            </button>

            <button
              type="button"
              onClick={clearCanvas}
              className="p-1.5 bg-white hover:bg-slate-100 border border-black text-black text-xs font-bold uppercase flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>

          {/* Size Brush */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase font-mono text-text-primary">Brush Size: {lineWidth}px</span>
            <input
              type="range"
              min="2"
              max="20"
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              className="w-20 accent-accent-primary cursor-pointer"
            />
          </div>

          {/* Preset Brush Colors */}
          <div className="flex items-center gap-1">
            {neonColors.map((col) => (
              <button
                key={col.value}
                onClick={() => {
                  setColor(col.value);
                  setIsErasing(false);
                }}
                className={`w-5 h-5 rounded-full border-2 transition hover:scale-110 cursor-pointer ${
                  color === col.value && !isErasing ? 'border-accent-secondary scale-110' : 'border-black'
                }`}
                style={{ backgroundColor: col.value }}
                title={col.name}
              />
            ))}
          </div>

        </div>

        {/* Dynamic Drawing Screen with mobile touch controls */}
        <div className="relative border-2 border-black overflow-hidden bg-black/5 rounded cursor-crosshair">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-[300px]"
          />
          {currentTheme !== 'minimal-light' && (
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
          )}
        </div>

        {/* Output capturing controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
          <div className="flex items-center gap-2 flex-grow max-w-sm">
            <input
              type="text"
              placeholder="Give sketch a label..."
              value={sketchName}
              onChange={(e) => setSketchName(e.target.value)}
              className="px-3 py-1.5 text-xs text-black border-2 border-black bg-white flex-grow focus:outline-none focus:bg-slate-50 font-bold font-mono"
            />
            <button
              onClick={handleSaveSketch}
              className="bg-accent-primary hover:bg-pink-600 text-white font-black text-xs uppercase px-4 py-2 border-2 border-black flex items-center gap-1.5 cursor-pointer active:translate-y-[1px]"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 bg-white hover:bg-slate-100 border-2 border-black text-black text-xs font-bold uppercase flex items-center gap-1 cursor-pointer"
              title="Download Canvas Sketch"
            >
              <Download className="w-4 h-4" />
              <span>Save PNG</span>
            </button>

            <div className="flex items-center gap-1 border-2 border-black bg-white rounded-none p-1 shrink-0">
              <span className="text-[9px] font-bold text-black uppercase font-mono px-1">Translate:</span>
              <select
                value={ocrLanguage}
                onChange={(e) => setOcrLanguage(e.target.value)}
                disabled={ocrLoading}
                className="text-[10px] font-mono font-bold bg-transparent text-black border-none focus:outline-none focus:ring-0 max-w-[120px] cursor-pointer"
                title="Whiteboard Handwriting Translate Lens"
              >
                {INDIAN_LANGUAGES_OCR.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleAIOCR}
              disabled={ocrLoading}
              className="py-2 px-4 bg-accent-secondary hover:bg-green-500 text-black border-2 border-black text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer animate-pulse"
            >
              {ocrLoading ? 'Scanning...' : <Sparkles className="w-4 h-4" />}
              <span>Digitize/OCR Handwriting</span>
            </button>
          </div>
        </div>

      </div>

      {/* Grid containing transcribed outputs & sketches vault */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Transcribed Output Card */}
        <div className="p-4 border-2 border-black bg-white text-black space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-brutal font-extrabold text-xs uppercase text-slate-800">Digitized Handwriting Text</h4>
            {transcribedText && (
              <button
                onClick={() => {
                  onInsertTranscription(transcribedText);
                  alert('Transcription inserted into study note console!');
                }}
                className="text-[10px] uppercase font-bold text-accent-secondary flex items-center gap-1 text-green-700 font-mono hover:underline"
              >
                <Clipboard className="w-3 h-3" />
                <span>Inject into Study Notes</span>
              </button>
            )}
          </div>
          
          <div className="p-3 border border-slate-300 rounded bg-slate-50 font-mono text-xs text-slate-800 h-32 overflow-y-auto leading-relaxed">
            {transcribedText || (
              <span className="text-slate-400 italic">No handwritten text digitized yet. Write above and click 'Digitize/OCR Handwriting' to parse terminology instantly.</span>
            )}
          </div>
        </div>

        {/* Saved Blackboard / Sketches vault */}
        <div className="p-4 border-2 border-black bg-white text-black space-y-3 flex flex-col justify-between">
          <div>
            <h4 className="font-brutal font-extrabold text-xs uppercase text-slate-800 mb-2">Saved Sketch Vault</h4>
            <div className="space-y-1.5 overflow-y-auto h-28 pr-1">
              {savedSketches.length === 0 ? (
                <div className="text-[11px] font-mono text-slate-400 italic">No drawing sketches archived. Draw on whiteboard and hit save.</div>
              ) : (
                savedSketches.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleLoadSketchToCanvas(item.dataUrl, item.transcription)}
                    className="flex items-center justify-between p-1.5 border border-slate-300 hover:border-black hover:bg-slate-100 transition cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <img src={item.dataUrl} className="w-7 h-7 object-cover border border-slate-400" alt="sketch thumbnail" />
                      <div className="truncate font-mono font-bold">
                        <div>{item.name}</div>
                        <div className="text-[9px] text-slate-400 font-normal">{item.timestamp}</div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSketch(item.id, e)}
                      className="p-1 hover:bg-red-50 text-red-500 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="text-[9px] font-mono text-slate-500 italic mt-1 bg-slate-100 p-1">
            💻 Tip: Touch enabled devices can double click on loaded elements inside local drawing frame.
          </div>
        </div>

      </div>

    </div>
  );
}
