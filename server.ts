/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const PORT = 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

// Lazy-initialized Gemini client
let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY environment variable is not set. Please configure it in Settings > Secrets or the env configuration.');
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

async function startServer() {
  const app = express();
  
  // Middleware to parse JSON bodies
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API Endpoint for Note Summarization & Synthesis
  app.post('/api/summarize', async (req, res) => {
    try {
      const { notes, focusMode, length, image, files, targetLanguage } = req.body;

      const hasNotes = notes && typeof notes === 'string' && notes.trim().length > 0;
      const hasImage = image && typeof image === 'object' && image.data && image.mimeType;
      const hasFiles = files && Array.isArray(files) && files.length > 0;

      if (!hasNotes && !hasImage && !hasFiles) {
        return res.status(400).json({ error: 'Please provide some typed notes or upload files to synthesize.' });
      }

      // Check if API key is present
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        return res.status(403).json({
          error: 'Gemini API Key is missing. Please add your GEMINI_API_KEY in the Secrets panel in AI Studio Settings (top-right).',
          isKeyMissing: true
        });
      }

      const ai = getGeminiClient();
      
      let translationInstruction = '';
      const langSuffix = (targetLanguage && targetLanguage !== 'Original' && targetLanguage !== 'English')
        ? ` Write this entire field strictly in fluent, natural ${targetLanguage} language characters and script (e.g. Devanagari script for Hindi, Bengali script for Bengali, etc.). Do NOT use English alphabet script for translation, do NOT leave any text untranslated except for standard inline mathematical/scientific formulas. Every sentence, title, definition, question, and answer must be 100% fully translated.`
        : '';

      if (targetLanguage && targetLanguage !== 'Original' && targetLanguage !== 'English') {
        translationInstruction = `\n\nCRITICAL LANGUAGE DIRECTIVE: Output ALL user-facing text fields (such as 'title', 'overview', 'concepts' names & definitions, 'summaryPoints' titles & details, 'flashcards' questions & answers, and 'actionSteps') fully translated and represented in fluent ${targetLanguage} language and script (e.g., Devanagari for Hindi). Keep the JSON keys strictly in English, but translate all values clearly, exhaustively, and accurately to ${targetLanguage}. Do not mix languages or leave English headers/explanations.`;
      }

      const systemPrompt = `You are an elite academic synthesizer and cognitive architect. 
Your job is to analyze the user's study notes, raw text, uploaded files, or handwritten images, and construct a high-impact, exhaustively complete, and high-fidelity "Second Brain" digital study template.
Never generalize or omit crucial background details, academic formulas, mathematical equations, structural explanations, code snippets, or conceptual nuances. Ensure that every definition is rich and fully detailed, capturing the entire context and background without hand-waving or overclassifying.${translationInstruction}

Create an elegant structure including:
1. An action-oriented conceptual Title.
2. A highly comprehensive, detailed, and clear conceptual Overview.
3. Key Concepts extracted precisely (including concept name, a complete, highly rigorous and rich definition, and level of importance: high, medium, or low).
4. Detailed Summary Points providing a complete, elaborate breakdown of all core themes without omitting anything.
5. In-depth Q&A study cards / Flashcards for active recall covering both subtle and major aspects thoroughly.
6. Highly actionable, specific study next steps.

Format your response strictly as JSON conforming to the requested schema. Do not include markdown code ticks around your JSON.`;

      const parts: any[] = [];

      // Add files if present (supports up to 30 files of any type)
      if (hasFiles) {
        for (const file of files) {
          if (!file.data || !file.mimeType) continue;

          let cleanBase64 = file.data;
          if (cleanBase64.includes('base64,')) {
            cleanBase64 = cleanBase64.split('base64,')[1];
          }

          // Differentiate text-based files vs multi-modal binary files
          const fileNameLower = (file.name || '').toLowerCase();
          const isTextType = file.mimeType.startsWith('text/') || 
                             fileNameLower.endsWith('.txt') || 
                             fileNameLower.endsWith('.md') || 
                             fileNameLower.endsWith('.json') || 
                             fileNameLower.endsWith('.csv') ||
                             fileNameLower.endsWith('.js') ||
                             fileNameLower.endsWith('.ts') ||
                             fileNameLower.endsWith('.py') ||
                             fileNameLower.endsWith('.html') ||
                             fileNameLower.endsWith('.css') ||
                             file.mimeType === 'application/json' ||
                             file.mimeType === 'application/javascript';

          if (isTextType) {
            try {
              const decodedText = Buffer.from(cleanBase64, 'base64').toString('utf-8');
              parts.push({
                text: `\n--- ATTACHED FILE CONTENT (Name: ${file.name}) ---\n${decodedText}\n--- END OF FILE ---\n`
              });
            } catch (e) {
              parts.push({
                text: `\n--- ATTACHED FILE BASE64 (Name: ${file.name}) ---\n${cleanBase64}\n--- END OF FILE ---\n`
              });
            }
          } else {
            // Send binary files directly as inlineData to Gemini (Images, PDFs, Audio, etc.)
            let mimeType = file.mimeType;
            // PDF fallback safety
            if (fileNameLower.endsWith('.pdf')) {
              mimeType = 'application/pdf';
            }
            parts.push({
              inlineData: {
                mimeType: mimeType,
                data: cleanBase64
              }
            });
          }
        }
      }

      // Add original fallback image if present
      if (hasImage && !hasFiles) {
        // Enforce base64 data format without "data:image/jpeg;base64," header
        let cleanBase64 = image.data;
        if (cleanBase64.includes('base64,')) {
          cleanBase64 = cleanBase64.split('base64,')[1];
        }
        parts.push({
          inlineData: {
            mimeType: image.mimeType,
            data: cleanBase64
          }
        });
      }

      let textPrompt = `Synthesize the following educational content. Focus context: ${focusMode || 'General Academic Mastery'}. Target depth length: ${length || 'detailed'}.\n\n`;
      if (hasNotes) {
        textPrompt += `Typed Source Notes / Guidance:\n${notes}\n\n`;
      }
      if (hasFiles) {
        textPrompt += `Please carefully synthesize the attached files (which can compile textbook PDF pages, images of whiteboard drafts, raw notes, or spreadsheets). Perform OCR or context synthesis where necessary and build the cognitive structured response studying these materials. Ensure you extract and expand on every single piece of useful technical/academic data exhaustively, leaving no important details or structural aspects out.`;
      } else if (hasImage) {
        textPrompt += `Please carefully perform OCR/transcription on the attached image of handwritten/printed notes or graphs. Incorporate that structured material together with any typed notes provided above inside your synthesized response. Make sure every line, chart data, and text explanation is fully and completely represented without truncation.`;
      }

      parts.push({ text: textPrompt });

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: { parts: parts },
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: 'A stellar theme-oriented title for this study session.' + langSuffix,
              },
              originalWordCount: {
                type: Type.INTEGER,
                description: 'The estimated word count of the original input notes (include uploaded images estimation).',
              },
              synthesizedWordCount: {
                type: Type.INTEGER,
                description: 'The estimated word count of your synthesized output.',
              },
              overview: {
                type: Type.STRING,
                description: 'A highly comprehensive, deep conceptual overview explaining the background, context, importance, and realistic applications of the material.' + langSuffix,
              },
              concepts: {
                type: Type.ARRAY,
                description: 'The core academic concepts found in the notes. Definitions must be fully comprehensive, academic, rigorous, and detailed.',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    concept: { type: Type.STRING, description: 'Concept name.' + langSuffix },
                    definition: { type: Type.STRING, description: 'Fully detailed definition, formula representation, or structural explanation with comprehensive information.' + langSuffix },
                    importance: { type: Type.STRING, description: 'Must be high, medium, or low' },
                  },
                  required: ['concept', 'definition', 'importance'],
                },
              },
              summaryPoints: {
                type: Type.ARRAY,
                description: 'Major narrative summary items detailing core takeaways under titles with complete, deep, and robust detail.',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: 'Takeaway chunk title' + langSuffix },
                    details: { type: Type.STRING, description: 'A highly comprehensive, well-elaborated explanation of the theme, omitting no technical nuance or surrounding context.' + langSuffix },
                  },
                  required: ['title', 'details'],
                },
              },
              flashcards: {
                type: Type.ARRAY,
                description: 'Active recall visual flashcards to master the content containing a question and answer.',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING, description: 'Flashcard question.' + langSuffix },
                    answer: { type: Type.STRING, description: 'Flashcard answer.' + langSuffix },
                  },
                  required: ['question', 'answer'],
                },
              },
              actionSteps: {
                type: Type.ARRAY,
                description: 'Immediate action steps to master these notes.',
                items: {
                  type: Type.STRING,
                  description: 'Action step text.' + langSuffix,
                },
              },
            },
            required: [
              'title',
              'originalWordCount',
              'synthesizedWordCount',
              'overview',
              'concepts',
              'summaryPoints',
              'flashcards',
              'actionSteps',
            ],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Empirical logic failed: Empty response returned from the synthesis provider.');
      }

      const parsedJSON = JSON.parse(responseText.trim());
      return res.json(parsedJSON);
    } catch (error: any) {
      console.error('Synthesis Error:', error);
      return res.status(500).json({
        error: error.message || 'An unexpected error occurred during study note synthesis.',
      });
    }
  });

  // API Endpoint for dynamic translation of parsed study materials
  app.post('/api/translate', async (req, res) => {
    try {
      const { synthesis, targetLanguage } = req.body;
      if (!synthesis || !targetLanguage) {
        return res.status(400).json({ error: 'Please provide both the active synthesis content and the target language.' });
      }

      // Check if API key is present
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        return res.status(403).json({
          error: 'Gemini API Key is missing. Please add your GEMINI_API_KEY in the Secrets panel in AI Studio Settings (top-right).',
          isKeyMissing: true
        });
      }

      const ai = getGeminiClient();

      const langNotice = ` This property MUST be written 100% entirely in fluent, natural ${targetLanguage} language characters and script (e.g., Devanagari script for Hindi, Bengali script for Bengali, etc.). Absolutely no English alphabet words are allowed here. Everything must be fully translated.`;

      const translationPrompt = `You are an elite academic translator. Translate the following structured study guide into the Indian language: ${targetLanguage}.
Keep the exact same JSON structure, array lengths, keys, and schemas, but translate all textual values (such as titles, concepts, definitions, overview, summary titles and details, flashcard questions & answers, and action steps) into high-fidelity, accurate, fluent, and natural ${targetLanguage}.
Do not translate the JSON keys. Keep keys exactly as they are ('title', 'overview', 'concepts', 'concept', 'definition', 'importance', 'summaryPoints', 'details', 'flashcards', 'question', 'answer', 'actionSteps', 'originalWordCount', 'synthesizedWordCount').
Keep the values of 'importance' exactly as they are ('high', 'medium', or 'low') as they are enums.

CRITICAL HARD REQUIREMENT: Every single word of the JSON property value strings must be written in the script/characters of ${targetLanguage}. No English explanatory residue, no partial translation. Translate everything perfectly.

Original Study Guide JSON:
${JSON.stringify(synthesis, null, 2)}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: translationPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'Translated study guide title.' + langNotice },
              originalWordCount: { type: Type.INTEGER },
              synthesizedWordCount: { type: Type.INTEGER },
              overview: { type: Type.STRING, description: 'Translated cognitive overview.' + langNotice },
              concepts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    concept: { type: Type.STRING, description: 'Translated concept name.' + langNotice },
                    definition: { type: Type.STRING, description: 'Translated concept definition.' + langNotice },
                    importance: { type: Type.STRING },
                  },
                  required: ['concept', 'definition', 'importance'],
                },
              },
              summaryPoints: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: 'Translated summary item title.' + langNotice },
                    details: { type: Type.STRING, description: 'Translated summary item description.' + langNotice },
                  },
                  required: ['title', 'details'],
                },
              },
              flashcards: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING, description: 'Translated flashcard question.' + langNotice },
                    answer: { type: Type.STRING, description: 'Translated flashcard answer.' + langNotice },
                  },
                  required: ['question', 'answer'],
                },
              },
              actionSteps: {
                type: Type.ARRAY,
                items: { type: Type.STRING, description: 'Translated action step.' + langNotice },
              },
            },
            required: [
              'title',
              'originalWordCount',
              'synthesizedWordCount',
              'overview',
              'concepts',
              'summaryPoints',
              'flashcards',
              'actionSteps',
            ],
          },
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Translation returned empty from Gemini.');
      }

      const parsedJSON = JSON.parse(responseText.trim());
      return res.json(parsedJSON);
    } catch (error: any) {
      console.error('Translation Error:', error);
      return res.status(500).json({
        error: error.message || 'An unexpected error occurred during translation.',
      });
    }
  });

  // API Endpoint for OCR & Optional Translation of handwritten canvas sketches
  app.post('/api/ocr', async (req, res) => {
    try {
      const { image, targetLanguage } = req.body;
      if (!image) {
        return res.status(400).json({ error: 'Please provide a valid canvas sketch image data.' });
      }

      // Check if API key is present
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        return res.status(403).json({
          error: 'Gemini API Key is missing. Please add your GEMINI_API_KEY in the Secrets panel in AI Studio Settings (top-right).',
          isKeyMissing: true
        });
      }

      const ai = getGeminiClient();

      let cleanBase64 = image;
      if (cleanBase64.includes('base64,')) {
        cleanBase64 = cleanBase64.split('base64,')[1];
      }

      const imagePart = {
        inlineData: {
          mimeType: 'image/png',
          data: cleanBase64,
        }
      };

      let prompt = `Analyze this handwritten sketch/whiteboard image. Perform precise, high-fidelity OCR to read and transcribe all of its handwritten text, formulas, diagrams, or bullet notes into natural high-contrast Markdown text. Stay extremely truthful and capture every small detail. Do not add conversational fluff or meta-explanations.`;

      if (targetLanguage && targetLanguage !== 'Original' && targetLanguage !== 'English') {
        prompt += `\n\nAdditionally, please TRANSLATE the transcribed output directly into ${targetLanguage} accurately while preserving the scientific, academic, or logical meaning of the notes perfectly. Output only the translated transcription.`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [imagePart, prompt]
      });

      const text = response.text || 'Unable to detect legible text on the canvas.';
      return res.json({ transcription: text.trim() });
    } catch (error: any) {
      console.error('OCR Translation Error:', error);
      return res.status(500).json({
        error: error.message || 'An unexpected error occurred during OCR transcription/translation.',
      });
    }
  });

  // API Endpoint for translating plain text notes/drafts directly
  app.post('/api/translate-text', async (req, res) => {
    try {
      const { text, targetLanguage } = req.body;
      if (!text || !targetLanguage) {
        return res.status(400).json({ error: 'Please provide both the text content and target language.' });
      }

      // Check if API key is present
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        return res.status(403).json({
          error: 'Gemini API Key is missing. Please add your GEMINI_API_KEY in the Secrets panel in AI Studio Settings (top-right).',
          isKeyMissing: true
        });
      }

      const ai = getGeminiClient();

      const prompt = `Translate the following educational notes accurately into ${targetLanguage}.
Keep all academic formulas, markdown structure, code syntax, and list elements fully intact. Ensure high academic accuracy, fluent translations, and professional terminology. Do not add any extra preambles, introductory comments, or meta explanations—output ONLY the direct translated text.

Source Text:
${text}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt
      });

      const translated = response.text || 'Translation returned empty.';
      return res.json({ translated: translated.trim() });
    } catch (error: any) {
      console.error('Text Translation Error:', error);
      return res.status(500).json({
        error: error.message || 'An unexpected error occurred during draft translation.',
      });
    }
  });

  // API Endpoint for OCR & translating custom uploaded files (Images, PDFs, Text)
  app.post('/api/translate-file', async (req, res) => {
    try {
      const { file, targetLanguage } = req.body;
      if (!file || !targetLanguage) {
        return res.status(400).json({ error: 'Please provide both the active file and target language parameters.' });
      }

      // Check if API key is present
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        return res.status(403).json({
          error: 'Gemini API Key is missing. Please add your GEMINI_API_KEY in the Secrets panel in AI Studio Settings (top-right).',
          isKeyMissing: true
        });
      }

      const ai = getGeminiClient();

      let cleanBase64 = file.data;
      if (cleanBase64.includes('base64,')) {
        cleanBase64 = cleanBase64.split('base64,')[1];
      }

      const fileNameLower = (file.name || '').toLowerCase();
      // Handle text-type files specifically
      const isTextType = file.mimeType.startsWith('text/') || 
                         fileNameLower.endsWith('.txt') || 
                         fileNameLower.endsWith('.md') || 
                         fileNameLower.endsWith('.json') || 
                         fileNameLower.endsWith('.csv') ||
                         fileNameLower.endsWith('.js') ||
                         fileNameLower.endsWith('.ts');

      let translatedText = '';

      if (isTextType) {
        // Text Decode and direct text-to-text translation
        const decodedText = Buffer.from(cleanBase64, 'base64').toString('utf-8');
        const textPrompt = `You are an elite bilingual academic expert. Translate the following file contents precisely and accurately into fluent, natural ${targetLanguage}.
Do NOT leave any English text explanation/details untranslated. Use exclusively the unique characters and script of ${targetLanguage} (e.g. Devanagari script for Hindi, Bengali script for Bengali, etc.). Ensure all terminology is natural and fluent. Do not add any intro, conversational preambles, or explanations—output ONLY the translated body text.

Source document content:
${decodedText}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: textPrompt
        });
        translatedText = response.text || 'Translation returned empty.';
      } else {
        // Multi-modal (Image / PDF)
        let mimeType = file.mimeType;
        if (fileNameLower.endsWith('.pdf')) {
          mimeType = 'application/pdf';
        }

        const imagePart = {
          inlineData: {
            mimeType: mimeType,
            data: cleanBase64,
          }
        };

        const multimodalPrompt = `You are an academic document OCR and translation assistant. First, precisely read and transcribe all handwritten drawings, charts, formulas, or printed text from the attached file.
Then, translate that raw text 100% and completely into accurate, fluent ${targetLanguage} language using its native script (e.g., Devanagari script for Hindi).
Do NOT include any English descriptions or side commentaries. Output ONLY the translated document content beautifully formatted in Markdown with proper headings and bullets.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: [imagePart, multimodalPrompt]
        });
        translatedText = response.text || 'Could not parse document content.';
      }

      // Convert translated text back into plain text file data URL
      const base64Outcome = Buffer.from(translatedText.trim()).toString('base64');
      const suffix = fileNameLower.split('.').pop() || 'txt';
      const cleanName = file.name.replace(`.${suffix}`, '');
      const finalName = `${cleanName} [Translated to ${targetLanguage}].txt`;

      return res.json({
        name: finalName,
        mimeType: 'text/plain',
        size: Buffer.from(translatedText.trim()).length,
        data: `data:text/plain;base64,${base64Outcome}`,
        translatedText: translatedText.trim()
      });
    } catch (error: any) {
      console.error('File Translation Error:', error);
      return res.status(500).json({
        error: error.message || 'An unexpected error occurred during direct file translation.',
      });
    }
  });

  // Setup Vite Dev Server / Static Asset Hosting matching guidelines
  if (!IS_PROD) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite development middleware integrated.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Production static build serving active from /dist.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AuraStudy Backend Engine online at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to initiate AuraStudy server:', err);
});
