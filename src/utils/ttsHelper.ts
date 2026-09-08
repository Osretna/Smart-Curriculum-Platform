export interface TTSState {
  isPlaying: boolean;
  isPaused: boolean;
  currentSentenceIndex: number;
  rate: number;
  sentences: string[];
}

export class TTSController {
  private synth: SpeechSynthesis | null = null;
  private utterance: SpeechSynthesisUtterance | null = null;
  private arabicVoice: SpeechSynthesisVoice | null = null;
  private onStateChange: ((state: TTSState) => void) | null = null;
  private activeState: TTSState = {
    isPlaying: false,
    isPaused: false,
    currentSentenceIndex: 0,
    rate: 1.0,
    sentences: [],
  };

  constructor(onStateChange?: (state: TTSState) => void) {
    if (onStateChange) {
      this.onStateChange = onStateChange;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.initVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    // Look for Arabic voice
    const arVoice = voices.find(v => v.lang.startsWith('ar') || v.lang.includes('AR'));
    if (arVoice) {
      this.arabicVoice = arVoice;
    }
  }

  public getVoices(): SpeechSynthesisVoice[] {
    return this.synth ? this.synth.getVoices().filter(v => v.lang.startsWith('ar')) : [];
  }

  public setRate(newRate: number) {
    this.activeState.rate = newRate;
    if (this.utterance && this.activeState.isPlaying) {
      // Replay current sentence with new rate
      const currentIndex = this.activeState.currentSentenceIndex;
      this.stop();
      this.speakSentences(this.activeState.sentences, currentIndex);
    } else {
      this.notify();
    }
  }

  public speak(fullText: string) {
    this.stop();
    // Split text into meaningful Arabic sentences or paragraphs
    const cleaned = fullText.replace(/\*\*/g, '').replace(/###/g, '').replace(/##/g, '');
    const sentences = cleaned
      .split(/(?<=[.،؟!:\n])/)
      .map(s => s.trim())
      .filter(s => s.length > 2);

    if (sentences.length === 0) return;

    this.activeState.sentences = sentences;
    this.activeState.currentSentenceIndex = 0;
    this.speakSentences(sentences, 0);
  }

  private speakSentences(sentences: string[], startIndex: number) {
    if (!this.synth || startIndex >= sentences.length) {
      this.stop();
      return;
    }

    this.activeState.isPlaying = true;
    this.activeState.isPaused = false;
    this.activeState.currentSentenceIndex = startIndex;
    this.notify();

    const sentenceToRead = sentences[startIndex];
    this.utterance = new SpeechSynthesisUtterance(sentenceToRead);
    this.utterance.lang = 'ar-SA';
    this.utterance.rate = this.activeState.rate;

    if (this.arabicVoice) {
      this.utterance.voice = this.arabicVoice;
    }

    this.utterance.onend = () => {
      if (this.activeState.isPlaying && !this.activeState.isPaused) {
        if (startIndex + 1 < sentences.length) {
          this.speakSentences(sentences, startIndex + 1);
        } else {
          this.stop();
        }
      }
    };

    this.utterance.onerror = (e) => {
      console.warn('TTS utterance event:', e);
      if (startIndex + 1 < sentences.length) {
        this.speakSentences(sentences, startIndex + 1);
      } else {
        this.stop();
      }
    };

    try {
      this.synth.speak(this.utterance);
    } catch (err) {
      console.warn('Speech synthesis failed:', err);
      this.stop();
    }
  }

  public pause() {
    if (this.synth && this.activeState.isPlaying && !this.activeState.isPaused) {
      this.synth.pause();
      this.activeState.isPaused = true;
      this.notify();
    }
  }

  public resume() {
    if (this.synth && this.activeState.isPaused) {
      this.synth.resume();
      this.activeState.isPaused = false;
      this.notify();
    }
  }

  public stop() {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {
        // ignore
      }
    }
    this.activeState.isPlaying = false;
    this.activeState.isPaused = false;
    this.activeState.currentSentenceIndex = 0;
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
