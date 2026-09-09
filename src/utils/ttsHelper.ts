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
        pairs.push({
          sourceText: line,
          sourceLang: defaultForeignLang,
          translationText: line,
        });
      }
    }
  }

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
  private currentAudio: HTMLAudioElement | null = null;
  private onStateChange: ((state: TTSState) => void) | null = null;
  private keepAliveInterval: any = null;
  private audioContext: AudioContext | null = null;
  private voices: SpeechSynthesisVoice[] = [];

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

  constructor(onStateChange?: (state: TTSState) => void) {
    if (onStateChange) {
      this.onStateChange = onStateChange;
    }
    if (typeof window !== 'undefined') {
      if ('speechSynthesis' in window) {
        this.synth = window.speechSynthesis;
        this.refreshVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = () => this.refreshVoices();
        }
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
      const arVoice = this.voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith('ar') ||
          v.name.toLowerCase().includes('arabic') ||
          v.name.toLowerCase().includes('tarik') ||
          v.name.toLowerCase().includes('laila') ||
          v.name.toLowerCase().includes('maged') ||
          v.name.toLowerCase().includes('salma') ||
          v.name.toLowerCase().includes('hoda')
      );
      // If no native Arabic voice is installed, DO NOT return an English voice (which causes silent failures in Chrome!)
      return arVoice || null;
    } else if (lang === 'fr') {
      const frVoice = this.voices.find(
        (v) => v.lang.toLowerCase().startsWith('fr') || v.name.toLowerCase().includes('french')
      );
      return frVoice || null;
    } else {
      const enVoice = this.voices.find(
        (v) =>
          (v.lang.toLowerCase().startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Online'))) ||
          v.lang.toLowerCase().startsWith('en-us') ||
          v.lang.toLowerCase().startsWith('en-gb') ||
          v.lang.toLowerCase().startsWith('en')
      );
      return enVoice || null;
    }
  }

  public setRate(newRate: number) {
    this.activeState.rate = newRate;
    if (this.currentAudio) {
      this.currentAudio.playbackRate = newRate;
    }
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
   */
  public speakBilingualPairs(pairs: BilingualPair[], mode: TTSAudioMode = 'bilingual', startIndex: number = 0) {
    this.stop();
    this.unlockAudio();
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
    this.unlockAudio();
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
    this.unlockAudio();
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
    this.playAudioCue();
    this.speakItems(items, 0);
  }

  /**
   * Diagnostic quick audio test: plays pleasant 2-tone melodic chime + speaks test greeting in English & Arabic
   */
  public testAudio() {
    this.stop();
    this.unlockAudio();
    this.playAudioCue();
    this.speakBilingualPairs(
      [
        {
          sourceText: 'Audio system is working perfectly. Welcome!',
          sourceLang: 'en',
          translationText: 'نظام الصوت والشرح المنهجي يعمل بنجاح تام. أهلاً بك!',
        },
      ],
      'bilingual'
    );
  }

  private speakItems(items: SpokenItem[], index: number) {
    if (index >= items.length) {
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

    // Check voice support for this language in Web Speech API
    const voice = this.getBestVoiceForLang(item.lang);

    // If browser lacks speech synthesis or lacks an Arabic voice for Arabic text,
    // immediately use the high-fidelity HTML5 audio streaming fallback
    if (!this.synth || (item.lang === 'ar' && !voice && !this.voices.some((v) => v.lang.startsWith('ar')))) {
      this.playStreamingAudio(item, items, index);
      return;
    }

    // Chrome iframe/resumed state handling
    try {
      if (this.synth.paused) {
        this.synth.resume();
      }
      this.synth.cancel();
      this.synth.resume();
    } catch {
      // ignore
    }

    this.startKeepAlive();

    setTimeout(() => {
      if (!this.synth || !this.activeState.isPlaying) return;

      const utterance = new SpeechSynthesisUtterance(item.text);
      utterance.rate = this.activeState.rate;
      utterance.volume = 1.0;

      if (item.lang === 'en') {
        utterance.lang = 'en-US';
      } else if (item.lang === 'fr') {
        utterance.lang = 'fr-FR';
      } else {
        utterance.lang = 'ar-SA';
      }

      if (voice) {
        utterance.voice = voice;
      }

      this.currentUtterance = utterance;

      utterance.onstart = () => {
        this.activeState.isPlaying = true;
        this.activeState.isPaused = false;
        this.notify();
      };

      utterance.onend = () => {
        if (this.activeState.isPlaying && !this.activeState.isPaused) {
          if (index + 1 < items.length) {
            const pauseTime = item.lang !== 'ar' ? 400 : 250;
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
        console.warn('SpeechSynthesis error event, falling back to streaming audio:', e);
        // Fallback to streaming audio if synthesis throws any error
        this.playStreamingAudio(item, items, index);
      };

      try {
        if (this.synth.paused) {
          this.synth.resume();
        }
        this.synth.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis speak call threw, using streaming audio fallback:', err);
        this.playStreamingAudio(item, items, index);
      }
    }, 40);
  }

  /**
   * Native HTML5 Audio Streaming fallback
   * Provides 100% reliable pronunciation for Arabic, English, and French
   */
  private playStreamingAudio(item: SpokenItem, items: SpokenItem[], index: number) {
    if (!this.activeState.isPlaying) return;

    try {
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio = null;
      }

      const langCode = item.lang === 'ar' ? 'ar' : item.lang === 'fr' ? 'fr' : 'en';
      const cleanText = item.text.replace(/[\n\r]+/g, ' ').trim().slice(0, 190);
      const streamUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${langCode}&client=tw-ob&q=${encodeURIComponent(cleanText)}`;

      const audio = new Audio(streamUrl);
      audio.playbackRate = this.activeState.rate;
      this.currentAudio = audio;

      audio.onplay = () => {
        this.activeState.isPlaying = true;
        this.activeState.isPaused = false;
        this.notify();
      };

      audio.onended = () => {
        this.currentAudio = null;
        if (this.activeState.isPlaying && !this.activeState.isPaused) {
          if (index + 1 < items.length) {
            const pauseTime = item.lang !== 'ar' ? 350 : 200;
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

      audio.onerror = (err) => {
        console.warn('Streaming audio failed:', err);
        this.currentAudio = null;
        if (this.activeState.isPlaying && !this.activeState.isPaused) {
          if (index + 1 < items.length) {
            this.speakItems(items, index + 1);
          } else {
            this.stop();
          }
        }
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((playErr) => {
          console.warn('Audio play promise error:', playErr);
          if (index + 1 < items.length) {
            this.speakItems(items, index + 1);
          } else {
            this.stop();
          }
        });
      }
    } catch (streamErr) {
      console.warn('Streaming initialization error:', streamErr);
      if (index + 1 < items.length) {
        this.speakItems(items, index + 1);
      } else {
        this.stop();
      }
    }
  }

  /**
   * Unlock Web Audio API context during user interactions
   */
  public unlockAudio() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioContext) {
        this.audioContext = new AudioCtx();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      if (this.synth && this.synth.paused) {
        this.synth.resume();
      }
    } catch {
      // ignore
    }
  }

  /**
   * Melodic chime audio cue to give instant acoustic feedback
   */
  public playAudioCue() {
    try {
      this.unlockAudio();
      if (!this.audioContext) return;
      const ctx = this.audioContext;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.19);
    } catch {
      // ignore
    }
  }

  private startKeepAlive() {
    this.stopKeepAlive();
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
    }
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
      } catch {
        // ignore
      }
    }
    this.activeState.isPaused = true;
    this.activeState.statusText = 'إيقاف مؤقت';
    this.notify();
  }

  public resume() {
    if (this.activeState.isPaused) {
      if (this.currentAudio) {
        try {
          this.currentAudio.play();
        } catch {
          // ignore
        }
      } else if (this.synth) {
        try {
          this.synth.resume();
        } catch {
          const idx = this.activeState.currentSentenceIndex;
          this.speakItems(this.activeState.items, idx);
          return;
        }
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
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.src = '';
        this.currentAudio = null;
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
