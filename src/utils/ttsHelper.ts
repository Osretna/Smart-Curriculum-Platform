export type TTSAudioMode = 'bilingual' | 'source_only' | 'arabic_only';

export interface SpokenItem {
  text: string;
  lang: 'en' | 'ar' | 'fr';
  label?: string;
  pairIndex: number;
  isTranslation?: boolean;
}

export interface BilingualPair {
  sourceText: string;
  sourceLang: 'en' | 'fr';
  translationText: string;
}

export interface TTSState {
  isPlaying: boolean;
  isPaused: boolean;
  currentSentenceIndex: number;
  currentPairIndex: number;
  rate: number;
  audioMode: TTSAudioMode;
  currentLang: 'en' | 'ar' | 'fr';
  statusText: string;
  items: SpokenItem[];
}

/**
 * Detect language of a text segment
 */
export function detectLanguage(text: string): 'en' | 'ar' | 'fr' {
  const clean = text.trim();
  const arabicRegex = /[\u0600-\u06FF]/;
  const arabicCount = (clean.match(/[\u0600-\u06FF]/g) || []).length;
  const latinCount = (clean.match(/[A-Za-z]/g) || []).length;

  if (arabicCount > latinCount) {
    return 'ar';
  }
  if (/[éèêëàâôûùç]/i.test(clean)) {
    return 'fr';
  }
  return 'en';
}

/**
 * Parse text into bilingual pairs (Foreign sentence + Arabic translation)
 * Detects patterns like:
 * "English text. ترجمة: النص العربي."
 * or line-by-line bilingual structures.
 */
export function parseBilingualContent(fullText: string, defaultForeignLang: 'en' | 'fr' = 'en'): BilingualPair[] {
  if (!fullText) return [];

  const lines = fullText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('###') && !l.startsWith('---'));

  const pairs: BilingualPair[] = [];
  let currentSource: string[] = [];
  let currentTrans: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isArabic = detectLanguage(line) === 'ar';
    const hasTranslationPrefix =
      line.startsWith('ترجمة') ||
      line.startsWith('الترجمة') ||
      line.startsWith('شرح بالعربية') ||
      line.startsWith('المعنى:') ||
      line.startsWith('💡');

    if (hasTranslationPrefix || (isArabic && currentSource.length > 0 && currentTrans.length === 0)) {
      currentTrans.push(line.replace(/^(ترجمة وشرح|ترجمة الشرح|ترجمة|الترجمة|المعنى)[\s:؛\-]*/i, '').trim());
      // Commit pair
      pairs.push({
        sourceText: currentSource.join(' '),
        sourceLang: defaultForeignLang,
        translationText: currentTrans.join(' '),
      });
      currentSource = [];
      currentTrans = [];
    } else if (!isArabic) {
      if (currentSource.length > 0 && currentTrans.length > 0) {
        pairs.push({
          sourceText: currentSource.join(' '),
          sourceLang: defaultForeignLang,
          translationText: currentTrans.join(' '),
        });
        currentSource = [];
        currentTrans = [];
      }
      currentSource.push(line);
    } else {
      // Line is Arabic, could be an Arabic introduction or standalone explanation
      if (currentSource.length > 0) {
        currentTrans.push(line);
        pairs.push({
          sourceText: currentSource.join(' '),
          sourceLang: defaultForeignLang,
          translationText: currentTrans.join(' '),
        });
        currentSource = [];
        currentTrans = [];
      } else {
        // Pure Arabic line
        pairs.push({
          sourceText: line,
          sourceLang: defaultForeignLang,
          translationText: line,
        });
      }
    }
  }

  // Flush remaining
  if (currentSource.length > 0) {
    pairs.push({
      sourceText: currentSource.join(' '),
      sourceLang: defaultForeignLang,
      translationText: currentTrans.join(' ') || currentSource.join(' '),
    });
  }

  return pairs.filter((p) => p.sourceText.length > 1);
}

export class TTSController {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private onStateChange: ((state: TTSState) => void) | null = null;
  private keepAliveInterval: any = null;
  private activeState: TTSState = {
    isPlaying: false,
    isPaused: false,
    currentSentenceIndex: 0,
    currentPairIndex: 0,
    rate: 1.0,
    audioMode: 'bilingual',
    currentLang: 'ar',
    statusText: 'جاهز للاستماع',
    items: [],
  };

  private voices: SpeechSynthesisVoice[] = [];

  constructor(onStateChange?: (state: TTSState) => void) {
    if (onStateChange) {
      this.onStateChange = onStateChange;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.refreshVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.refreshVoices();
      }
    }
  }

  private refreshVoices() {
    if (!this.synth) return;
    try {
      this.voices = this.synth.getVoices();
    } catch {
      this.voices = [];
    }
  }

  private getBestVoiceForLang(lang: 'en' | 'ar' | 'fr'): SpeechSynthesisVoice | null {
    this.refreshVoices();
    if (!this.voices || this.voices.length === 0) return null;

    if (lang === 'ar') {
      // Find Arabic voice (e.g. ar-SA, ar-EG, ar)
      const arVoice = this.voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith('ar') ||
          v.lang.toLowerCase().includes('arabic') ||
          v.name.toLowerCase().includes('arabic')
      );
      if (arVoice) return arVoice;
    } else if (lang === 'fr') {
      const frVoice = this.voices.find(
        (v) => v.lang.toLowerCase().startsWith('fr') || v.lang.toLowerCase().includes('french')
      );
      if (frVoice) return frVoice;
    } else {
      // English
      const enVoice = this.voices.find(
        (v) =>
          (v.lang.toLowerCase().startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google'))) ||
          v.lang.toLowerCase().startsWith('en-us') ||
          v.lang.toLowerCase().startsWith('en-gb') ||
          v.lang.toLowerCase().startsWith('en')
      );
      if (enVoice) return enVoice;
    }

    // Fallback: any voice
    return this.voices[0] || null;
  }

  public setRate(newRate: number) {
    this.activeState.rate = newRate;
    if (this.activeState.isPlaying && this.currentUtterance) {
      const idx = this.activeState.currentSentenceIndex;
      this.stop();
      this.speakItems(this.activeState.items, idx);
    } else {
      this.notify();
    }
  }

  public setAudioMode(mode: TTSAudioMode) {
    this.activeState.audioMode = mode;
    this.notify();
  }

  /**
   * Play bilingual pairs with teacher narration
   * Mode:
   * - 'bilingual': speaks foreign sentence, then speaks Arabic translation!
   * - 'source_only': speaks foreign sentence only.
   * - 'arabic_only': speaks Arabic translation only.
   */
  public speakBilingualPairs(pairs: BilingualPair[], mode: TTSAudioMode = 'bilingual', startIndex: number = 0) {
    this.stop();
    this.activeState.audioMode = mode;

    const items: SpokenItem[] = [];

    pairs.forEach((pair, pairIdx) => {
      const isPureArabic = detectLanguage(pair.sourceText) === 'ar';

      if (isPureArabic) {
        items.push({
          text: pair.sourceText,
          lang: 'ar',
          label: 'شرح بالعربية',
          pairIndex: pairIdx,
          isTranslation: false,
        });
      } else {
        if (mode === 'bilingual') {
          items.push({
            text: pair.sourceText,
            lang: pair.sourceLang || 'en',
            label: `قراءة لغة الكتاب (${pair.sourceLang === 'en' ? 'الإنجليزية' : 'الفرنسية'})`,
            pairIndex: pairIdx,
            isTranslation: false,
          });
          if (pair.translationText && pair.translationText !== pair.sourceText) {
            items.push({
              text: pair.translationText,
              lang: 'ar',
              label: 'الترجمة والشرح بالعربية',
              pairIndex: pairIdx,
              isTranslation: true,
            });
          }
        } else if (mode === 'source_only') {
          items.push({
            text: pair.sourceText,
            lang: pair.sourceLang || 'en',
            label: `لغة الكتاب (${pair.sourceLang === 'en' ? 'الإنجليزية' : 'الفرنسية'})`,
            pairIndex: pairIdx,
            isTranslation: false,
          });
        } else if (mode === 'arabic_only') {
          items.push({
            text: pair.translationText || pair.sourceText,
            lang: 'ar',
            label: 'الترجمة والشرح بالعربية',
            pairIndex: pairIdx,
            isTranslation: true,
          });
        }
      }
    });

    if (items.length === 0) return;

    this.activeState.items = items;
    this.playAudioCue();
    this.speakItems(items, startIndex);
  }

  /**
   * Speak single full text with automatic language recognition per sentence
   */
  public speak(fullText: string, defaultLang?: 'en' | 'ar' | 'fr') {
    this.stop();
    const cleaned = fullText.replace(/\*\*/g, '').replace(/###/g, '').replace(/##/g, '');
    const rawSentences = cleaned
      .split(/(?<=[.،؟!:\n])/)
      .map((s) => s.trim())
      .filter((s) => s.length > 2);

    if (rawSentences.length === 0) return;

    const items: SpokenItem[] = rawSentences.map((s, idx) => ({
      text: s,
      lang: defaultLang || detectLanguage(s),
      pairIndex: idx,
      label: detectLanguage(s) === 'ar' ? 'العربية' : 'English',
    }));

    this.activeState.items = items;
    this.playAudioCue();
    this.speakItems(items, 0);
  }

  /**
   * Speak a specific single sentence or phrase on demand
   */
  public speakSingleSentence(text: string, lang?: 'en' | 'ar' | 'fr') {
    this.stop();
    const itemLang = lang || detectLanguage(text);
    const items: SpokenItem[] = [
      {
        text,
        lang: itemLang,
        pairIndex: 0,
        label: itemLang === 'ar' ? 'العربية' : 'English',
      },
    ];
    this.activeState.items = items;
    this.speakItems(items, 0);
  }

  private speakItems(items: SpokenItem[], index: number) {
    if (!this.synth || index >= items.length) {
      this.stop();
      return;
    }

    const item = items[index];
    this.activeState.isPlaying = true;
    this.activeState.isPaused = false;
    this.activeState.currentSentenceIndex = index;
    this.activeState.currentPairIndex = item.pairIndex;
    this.activeState.currentLang = item.lang;
    this.activeState.statusText = item.label || (item.lang === 'ar' ? 'شرح بالعربية' : 'نطق بالإنجليزية');
    this.notify();

    // Chrome iframe bug workaround: reset synthesis state
    try {
      this.synth.cancel();
    } catch {
      // ignore
    }

    // Start keep-alive pulse for long speech in Chromium
    this.startKeepAlive();

    setTimeout(() => {
      if (!this.synth || !this.activeState.isPlaying) return;

      const utterance = new SpeechSynthesisUtterance(item.text);
      utterance.rate = this.activeState.rate;

      // Assign matching language and voice
      if (item.lang === 'en') {
        utterance.lang = 'en-US';
      } else if (item.lang === 'fr') {
        utterance.lang = 'fr-FR';
      } else {
        utterance.lang = 'ar-SA';
      }

      const voice = this.getBestVoiceForLang(item.lang);
      if (voice) {
        utterance.voice = voice;
      }

      this.currentUtterance = utterance;

      utterance.onend = () => {
        if (this.activeState.isPlaying && !this.activeState.isPaused) {
          if (index + 1 < items.length) {
            // Slight natural pause between foreign sentence and translation
            const pauseTime = item.lang !== 'ar' ? 450 : 250;
            setTimeout(() => {
              if (this.activeState.isPlaying && !this.activeState.isPaused) {
                this.speakItems(items, index + 1);
              }
            }, pauseTime);
          } else {
            this.stop();
          }
        }
      };

      utterance.onerror = (e) => {
        console.warn('TTS utterance event:', e);
        if (this.activeState.isPlaying && !this.activeState.isPaused) {
          if (index + 1 < items.length) {
            this.speakItems(items, index + 1);
          } else {
            this.stop();
          }
        }
      };

      try {
        this.synth.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis speak call failed:', err);
        if (index + 1 < items.length) {
          this.speakItems(items, index + 1);
        } else {
          this.stop();
        }
      }
    }, 40);
  }

  /**
   * Subtle Web Audio API chime tone so user gets instantaneous audible feedback
   * when starting speech, also unlocks Web Audio context in modern browsers
   */
  private playAudioCue() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch {
      // ignore
    }
  }

  private startKeepAlive() {
    this.stopKeepAlive();
    // In Chromium, SpeechSynthesis can go silent after 15s if resume is not called
    this.keepAliveInterval = setInterval(() => {
      if (this.synth && this.activeState.isPlaying && !this.activeState.isPaused) {
        try {
          this.synth.pause();
          this.synth.resume();
        } catch {
          // ignore
        }
      }
    }, 4500);
  }

  private stopKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  public pause() {
    if (this.synth && this.activeState.isPlaying && !this.activeState.isPaused) {
      try {
        this.synth.pause();
      } catch {
        // ignore
      }
      this.activeState.isPaused = true;
      this.activeState.statusText = 'إيقاف مؤقت';
      this.notify();
    }
  }

  public resume() {
    if (this.synth && this.activeState.isPaused) {
      try {
        this.synth.resume();
      } catch {
        // fallback replay
        const idx = this.activeState.currentSentenceIndex;
        this.speakItems(this.activeState.items, idx);
        return;
      }
      this.activeState.isPaused = false;
      this.activeState.statusText = 'جاري الاستماع';
      this.notify();
    }
  }

  public stop() {
    this.stopKeepAlive();
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {
        // ignore
      }
    }
    this.currentUtterance = null;
    this.activeState.isPlaying = false;
    this.activeState.isPaused = false;
    this.activeState.currentSentenceIndex = 0;
    this.activeState.currentPairIndex = 0;
    this.activeState.statusText = 'جاهز للاستماع';
    this.notify();
  }

  private notify() {
    if (this.onStateChange) {
      this.onStateChange({ ...this.activeState });
    }
  }

  public getState(): TTSState {
    return { ...this.activeState };
  }
}
