import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  Play,
  Pause,
  Square,
  X,
  BookOpen,
  Sliders,
} from 'lucide-react';
import { ExternalBook, Chapter } from '../types';
import { TTSController, TTSState } from '../utils/ttsHelper';

interface AudioPlayerFloatingProps {
  book: ExternalBook | null;
  chapterIndex?: number;
  onClose: () => void;
  onOpenBook: (bookId: string, chapterId: string) => void;
}

export const AudioPlayerFloating: React.FC<AudioPlayerFloatingProps> = ({
  book,
  chapterIndex = 0,
  onClose,
  onOpenBook,
}) => {
  if (!book) return null;

  const currentChapter: Chapter = book.chapters[chapterIndex] || book.chapters[0];

  const [ttsState, setTtsState] = useState<TTSState>({
    isPlaying: false,
    isPaused: false,
    currentSentenceIndex: 0,
    rate: 1.0,
    sentences: [],
  });

  const ttsRef = useRef<TTSController | null>(null);

  useEffect(() => {
    ttsRef.current = new TTSController((state) => setTtsState(state));

    // Auto start playing
    const fullText = `${currentChapter.title}. ${currentChapter.summary}. ${currentChapter.detailedExplanation}`;
    ttsRef.current.speak(fullText);

    return () => {
      if (ttsRef.current) {
        ttsRef.current.stop();
      }
    };
  }, [book.id, currentChapter.id]);

  const togglePlayPause = () => {
    if (!ttsRef.current) return;
    if (ttsState.isPlaying) {
      if (ttsState.isPaused) {
        ttsRef.current.resume();
      } else {
        ttsRef.current.pause();
      }
    } else {
      const fullText = `${currentChapter.title}. ${currentChapter.summary}. ${currentChapter.detailedExplanation}`;
      ttsRef.current.speak(fullText);
    }
  };

  const handleStop = () => {
    ttsRef.current?.stop();
  };

  const handleRateChange = (rate: number) => {
    ttsRef.current?.setRate(rate);
  };

  return (
    <div
      id="floating-audio-player-bar"
      className="fixed bottom-4 right-4 left-4 sm:right-6 sm:left-auto sm:w-[480px] z-50 bg-slate-900/95 text-white backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl p-4 animate-in slide-in-from-bottom-5"
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Volume2 className="w-5 h-5 animate-pulse" />
          </div>
          <div className="overflow-hidden">
            <h4 className="text-xs font-bold text-white truncate">{currentChapter.title}</h4>
            <p className="text-[11px] text-slate-400 truncate">{book.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onOpenBook(book.id, currentChapter.id)}
            className="px-2.5 py-1 text-[11px] font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition cursor-pointer flex items-center gap-1"
          >
            <BookOpen className="w-3 h-3" />
            <span>عرض النص</span>
          </button>
          <button
            onClick={() => {
              handleStop();
              onClose();
            }}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlayPause}
            className="w-8 h-8 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center transition cursor-pointer shadow-md"
          >
            {ttsState.isPlaying && !ttsState.isPaused ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 mr-0.5" />
            )}
          </button>

          <button
            onClick={handleStop}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1 text-[11px]">
          <span className="text-slate-400">السرعة:</span>
          {[1.0, 1.25, 1.5].map((r) => (
            <button
              key={r}
              onClick={() => handleRateChange(r)}
              className={`px-1.5 py-0.5 rounded-md font-bold transition cursor-pointer ${
                ttsState.rate === r ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              {r}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
