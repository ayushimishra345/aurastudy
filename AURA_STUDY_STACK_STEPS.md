# AuraStudy: Full-Stack Stack Setup & Portability Blueprint

This reference document explains how AuraStudy operates and provides the instructions, requirements, and codebase mappings to port this application to other environments such as a separate **Next.js (TypeScript) Frontend** + **FastAPI (Python) Backend**.

---

## 1. Project Directory Structure
Below is are the folder hierarchies for both our **unified Express + Vite live preview setup** and a **decoupled Next.js + FastAPI production stack**:

### Current Live Architecture (Express + Vite React)
```
/ (Workspace Root)
├── package.json              # Unified package manager specifying build and TS runtimes
├── tsconfig.json             # TypeScript compiler settings for modern ESM module mapping
├── vite.config.ts            # Vite asset compilation pipelines & HMR overrides
├── server.ts                 # Real server-side Express brain & lazy-initialized @google/genai API handles
├── metadata.json             # Workspace system definitions
├── AURA_STUDY_STACK_STEPS.md # Decoupled Next.js / FastAPI blueprint (this folder)
└── /src                      # React Client Portal
    ├── main.tsx              # Portal hydration entrypoint
    ├── App.tsx               # Primary dashboard page wrapper featuring state routers & timers
    ├── index.css             # Stylesheet hosting active structural themes (Midnight, Vaporwave, Minimal-Light)
    ├── types.ts              # Early TS models enforcing structured JSON outputs from Gemini
    └── /components           # Extracted active layout modules
        ├── NoteInput.tsx     # Paste space, lecture presets, lens adapters, & synthesize buttons
        ├── ThemeSelector.tsx # Tactical backdrop attribute selectors & color theme dropdowns
        ├── SynthesisView.tsx # Overview trackers, interactive flashcards, & takeaway blueprints
        └── SavedSessions.tsx # LocalStorage search indexes & session vaults list entries
```

### Decoupled Reference Architecture (Next.js + FastAPI)
```
/aurastudy-decoupled
├── /frontend-nextjs          # Next.js Application
|   ├── package.json          # Dependencies (react, next, lucide-react, framer-motion)
|   ├── tailwind.config.js    # Multi-theme configuration 
|   ├── /app                  # App Router Core
|   |   ├── layout.tsx        # Common shell with context provider
|   |   └── page.tsx          # Port of NoteInput, ThemeSelector, SynthesisView, SavedList
|   └── /components           # Port of modular React elements
└── /backend-fastapi          # Python Processing Microservice
    ├── requirements.txt      # FastAPI, uvicorn, google-genai
    ├── main.py               # FastAPI routers & CORS origins
    └── /app                  # Modular logical scripts if expanded
```

---

## 2. Decoupled Backend: Python FastAPI `main.py` & Dependencies
To run the high-performance AI logic on a Python backend, use the files and requirements outlined here:

### `requirements.txt` (FastAPI + Google GenAI)
```text
fastapi>=0.110.0
uvicorn>=0.28.0
google-genai>=0.1.1
pydantic>=2.6.0
python-dotenv>=1.0.1
```

### `main.py` (FastAPI Server Draft)
```python
"""
AuraStudy: Cognitive Processing Backend Brain.
Handles CORS handshakes, payload valuation, and asynchronous Gemini APIs.
"""

import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

app = FastAPI(
    title="AuraStudy Cognitive Engine",
    description="Microservice interfacing google-genai models and structured JSON schemas",
    version="1.0.0"
)

# Set secure CORS handshakes for Next.js frontend
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://your-next-app.vercel.app",  # Add your deployed production URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Pydantic Models for Schema Verification ───
class StudyNotesRequest(BaseModel):
    notes: str = Field(..., description="Raw pasted lecture texts to boil down")
    focusMode: Optional[str] = "General Academic Mastery"
    length: Optional[str] = "detailed"

class KeyConceptModel(BaseModel):
    concept: str
    definition: str
    importance: str  # high, medium, low

class BulletPointModel(BaseModel):
    title: str
    details: str

class FlashcardModel(BaseModel):
    question: str
    answer: str

class SynthesizedBrainResponse(BaseModel):
    title: str
    originalWordCount: int
    synthesizedWordCount: int
    overview: str
    concepts: List[KeyConceptModel]
    summaryPoints: List[BulletPointModel]
    flashcards: List[FlashcardModel]
    actionSteps: List[str]

# ─── Google GenAI Client Initializer ───
def get_genai_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GEMINI_API_KEY is not defined in backend secrets list."
        )
    return genai.Client(api_key=api_key)

# ─── Async API Route ───
@app.post(
    "/api/summarize", 
    response_model=SynthesizedBrainResponse,
    summary="Synthesize raw records into durable academic templates"
)
def summarize_lecture_notes(payload: StudyNotesRequest):
    if not payload.notes.strip():
        raise HTTPException(
            status_code=400,
            detail="Request text field is empty. Please provide some source notes."
        )

    try:
        client = get_genai_client()
        
        system_instruction = (
            "You are an elite academic synthesizer. "
            "Analyze study notes and structure response strictly according to the request schema. "
            "Formulate detailed descriptions, extracted definitions, and interactive flashcards."
        )
        
        prompt = (
            f"Synthesize this lecture dump.\n"
            f"Lens: {payload.focusMode}\n"
            f"Target: {payload.length}\n\n"
            f"Content:\n{payload.notes}"
        )

        # Call Gemini 3.5 Flash asynchronously with structured JSON schema constraints
        response = client.models.generate_content(
            model='gemini-3.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=SynthesizedBrainResponse, # Strictly enforces Pydantic matches!
            )
        )

        return response.text

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gemini Synthesis Hub failed with report: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    # Start on Port 8000 for standard local separated configs
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
```

---

## 3. Decoupled Frontend: Next.js + Tailwind + `framer-motion` setup

To install and initialize the counterpart frontend client, run the commands below:

### Dependencies Command (Vercel Next.js Setup)
```bash
npx create-next-app@latest frontend-nextjs --typescript --tailwind --eslint --app
cd frontend-nextjs

# Install core icons, theme helper, and transition frame controllers
npm install lucide-react next-themes framer-motion @radix-ui/react-dropdown-menu
```

### Porting Guide (Next.js App Router Page Mapping)
- Place `types.ts` in `/frontend-nextjs/src/types.ts`.
- Port `/src/components/ThemeSelector.tsx` to `/frontend-nextjs/src/components/ThemeSelector.tsx` (using Next.js's state provider or standard component wrapper if running server-side `next-themes`).
- Place `NoteInput.tsx`, `SynthesisView.tsx`, and `SavedSessions.tsx` in `/frontend-nextjs/src/components/`.
- Replace `/frontend-nextjs/src/app/page.tsx` with the outer controller code inside our `/src/App.tsx`, replacing the simple `motion/react` imports with standard `framer-motion` calls (such as `<AnimatePresence>` and `<motion.div>`) as needed.
