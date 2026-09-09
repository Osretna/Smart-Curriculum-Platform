import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowRight,
  BookOpen,
  Volume2,
  Pause,
  Play,
  Square,
  Sparkles,
  Send,
  Star,
  CheckCircle2,
  XCircle,
  Bookmark,
  BookmarkCheck,
  Share2,
  RefreshCw,
  Award,
  Layers,
  Sliders,
  Languages,
  FileText,
  VolumeX,
} from 'lucide-react';
import { ExternalBook, Chapter, UserProfile } from '../types';
import {
  TTSController,
  TTSState,
  TTSAudioMode,
  BilingualPair,
  parseBilingualContent,
  detectLanguage,
} from '../utils/ttsHelper';

interface BookReaderViewProps {
  book: ExternalBook;
  initialChapterId?: string;
  onBack: () => void;
  currentUser: UserProfile | null;
  onUpdateUserFavorites?: (bookId: string) => void;
  onRecordProgress?: (bookId: string, chapterId: string, progress: number) => void;
}

export const BookReaderView: React.FC<BookReaderViewProps> = ({
  book,
  initialChapterId,
  onBack,
  currentUser,
  onUpdateUserFavorites,
  onRecordProgress,
}) => {
  // Current active chapter
  const [selectedChapterId, setSelectedChapterId] = useState<string>(() => {
    if (initialChapterId && book.chapters.some((c) => c.id === initialChapterId)) {
      return initialChapterId;
    }
    return book.chapters[0]?.id || '';
  });

  const activeChapter: Chapter = useMemo(() => {
    return book.chapters.find((c) => c.id === selectedChapterId) || book.chapters[0];
  }, [book.chapters, selectedChapterId]);

  // Foreign Language Detection (English, French, etc.)
  const isForeignLanguageBook = useMemo(() => {
    const title = (book.title || '').toLowerCase();
    const subject = (book.subjectId || '').toLowerCase();
    return (
      subject === 'english' ||
      subject === 'french' ||
      subject === 'german' ||
      title.includes('connect') ||
      title.includes('english') ||
      title.includes('انجليزي') ||
      title.includes('فرنسي')
    );
  }, [book.subjectId, book.title]);

  const foreignLangCode = useMemo<'en' | 'fr'>(() => {
    if (
      book.subjectId === 'french' ||
      book.title.toLowerCase().includes('french') ||
      book.title.includes('فرنساوي')
    ) {
      return 'fr';
    }
    return 'en';
  }, [book.subjectId, book.title]);

  // Bilingual Pairs for foreign language chapters
  const bilingualPairs: BilingualPair[] = useMemo(() => {
    if (!activeChapter?.detailedExplanation) return [];
    return parseBilingualContent(activeChapter.detailedExplanation, foreignLangCode);
  }, [activeChapter?.detailedExplanation, foreignLangCode]);

  // Audio Mode: bilingual (Foreign sentence then Arabic translation), source_only, or arabic_only
  const [audioMode, setAudioMode] = useState<TTSAudioMode>('bilingual');

  // Explanation view format toggle
  const [viewMode, setViewMode] = useState<'bilingual_cards' | 'continuous'>('bilingual_cards');

  // TTS Controller and State
  const [ttsState, setTtsState] = useState<TTSState>({
    isPlaying: false,
    isPaused: false,
    currentSentenceIndex: 0,
    currentPairIndex: 0,
    rate: 1.0,
    audioMode: 'bilingual',
    currentLang: 'ar',
    statusText: 'جاهز للاستماع',
    items: [],
  });

  const ttsRef = useRef<TTSController | null>(null);

  useEffect(() => {
    ttsRef.current = new TTSController((state) => {
      setTtsState(state);
      if (state.items.length > 0 && onRecordProgress) {
        const progress = Math.round(((state.currentSentenceIndex + 1) / state.items.length) * 100);
        onRecordProgress(book.id, activeChapter.id, progress);
      }
    });

    return () => {
      if (ttsRef.current) {
        ttsRef.current.stop();
      }
    };
  }, [book.id, activeChapter.id, onRecordProgress]);

  // Stop TTS when chapter changes
  useEffect(() => {
    if (ttsRef.current) {
      ttsRef.current.stop();
    }
    setAiQuestion('');
    setAiExplanation(null);
    setAiNotice(null);
    setAiError(null);
    setUserAnswers({});
    setQuizSubmitted(false);
  }, [selectedChapterId]);

  // AI Custom Explanation States
  const [aiQuestion, setAiQuestion] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiSource, setAiSource] = useState<'gemini' | 'simulated' | 'curriculum-expert' | null>(null);
  const [aiModel, setAiModel] = useState<string | null>(null);
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Quiz States
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Bookmark toggle
  const isBookmarked = currentUser?.favorites.includes(book.id) || false;

  // Handler: Play TTS for active chapter text
  const handlePlayTTS = () => {
    if (!ttsRef.current) return;
    if (ttsState.isPaused) {
      ttsRef.current.resume();
      return;
    }

    if (isForeignLanguageBook && bilingualPairs.length > 0) {
      ttsRef.current.speakBilingualPairs(bilingualPairs, audioMode);
    } else {
      const fullContent = `${activeChapter.title}. ${activeChapter.summary}. ${activeChapter.detailedExplanation}`;
      ttsRef.current.speak(fullContent);
    }
  };

  const handlePauseTTS = () => {
    ttsRef.current?.pause();
  };

  const handleStopTTS = () => {
    ttsRef.current?.stop();
  };

  const handleChangeRate = (rate: number) => {
    ttsRef.current?.setRate(rate);
  };

  const handleSwitchAudioMode = (mode: TTSAudioMode) => {
    setAudioMode(mode);
    if (ttsRef.current) {
      ttsRef.current.setAudioMode(mode);
      if (ttsState.isPlaying && isForeignLanguageBook && bilingualPairs.length > 0) {
        ttsRef.current.speakBilingualPairs(bilingualPairs, mode, ttsState.currentPairIndex);
      }
    }
  };

  // Play individual sentence or pair
  const handlePlaySingleItem = (text: string, lang?: 'en' | 'ar' | 'fr') => {
    ttsRef.current?.speakSingleSentence(text, lang);
  };

  const handlePlayPair = (pairIdx: number) => {
    if (isForeignLanguageBook && bilingualPairs.length > 0) {
      ttsRef.current?.speakBilingualPairs(bilingualPairs, audioMode, pairIdx);
    }
  };

  // Play TTS for AI generated text
  const handlePlayAiExplanationTTS = () => {
    if (!ttsRef.current || !aiExplanation) return;
    if (isForeignLanguageBook) {
      const aiPairs = parseBilingualContent(aiExplanation, foreignLangCode);
      if (aiPairs.length > 0) {
        ttsRef.current.speakBilingualPairs(aiPairs, 'bilingual');
        return;
      }
    }
    ttsRef.current.speak(aiExplanation);
  };

  // Submit AI custom explanation request
  const handleAskAi = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiQuestion.trim()) return;

    setIsGeneratingAi(true);
    setAiError(null);
    try {
      const response = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: aiQuestion,
          bookTitle: book.title,
          chapterTitle: activeChapter.title,
          grade: book.gradeId,
          subject: book.subjectId,
          currentExplanation: activeChapter.detailedExplanation,
        }),
      });
      const data = await response.json();
      if (data.explanation) {
        setAiExplanation(data.explanation);
        setAiSource(data.source || 'gemini');
        setAiModel(data.model || null);
        setAiNotice(data.notice || data.warning || null);
      } else {
        throw new Error(data.error || 'تعذر الحصول على الشرح، يرجى المحاولة ثانية.');
      }
    } catch (err: any) {
      console.error('Failed to get AI explanation:', err);
      setAiError(err?.message || 'حدث خطأ مؤقت أثناء التواصل مع المعلم الذكي. الرجاء الضغط على إعادة المحاولة.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Quiz handler
  const handleOptionSelect = (questionId: string, optionIndex: number) => {
    if (quizSubmitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleCalculateScore = () => {
    setQuizSubmitted(true);
  };

  const handleResetQuiz = () => {
    setUserAnswers({});
    setQuizSubmitted(false);
  };

  const quizScore = useMemo(() => {
    let correct = 0;
    activeChapter.quiz.forEach((q) => {
      if (userAnswers[q.id] === q.correctIndex) {
        correct++;
      }
    });
    return correct;
  }, [activeChapter.quiz, userAnswers]);

  return (
    <div id="book-reader-view-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Back button & Navigation bar */}
      <div className="flex items-center justify-between">
        <button
          id="reader-back-btn"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition cursor-pointer shadow-2xs"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة لقائمة الكتب والصفوف</span>
        </button>

        <div className="flex items-center gap-2">
          {onUpdateUserFavorites && (
            <button
              id="bookmark-book-btn"
              onClick={() => onUpdateUserFavorites(book.id)}
              className={`p-2.5 rounded-xl border transition cursor-pointer ${
                isBookmarked
                  ? 'bg-amber-50 dark:bg-amber-950 border-amber-300 text-amber-600'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-amber-500'
              }`}
              title={isBookmarked ? 'محفوظ في المفضلة' : 'إضافة إلى المفضلة'}
            >
              {isBookmarked ? <BookmarkCheck className="w-4 h-4 fill-amber-500" /> : <Bookmark className="w-4 h-4" />}
            </button>
          )}

          <button
            id="share-book-btn"
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
                alert('تم نسخ رابط الكتاب والشرح بنجاح!');
              }
            }}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 transition cursor-pointer"
            title="مشاركة الكتاب"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Book Metadata Header Card */}
      <section
        id="book-meta-header"
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <img
            src={book.coverImage}
            alt={book.title}
            className="w-32 sm:w-40 h-44 sm:h-52 object-cover rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 shrink-0"
          />

          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200/50">
                {book.author}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {book.publisher}
              </span>
              {isForeignLanguageBook && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 flex items-center gap-1">
                  <Languages className="w-3.5 h-3.5" />
                  كتاب لغة أجنبية (شرح بلغة الكتاب + ترجمة عربية وصوتية)
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black font-tajawal text-slate-900 dark:text-white leading-tight">
              {book.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
              {book.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2">
              <span>الفصول المتاحة: {book.chapters.length} فصول تعليمية</span>
              <span>•</span>
              <span>مرات الاستماع: {book.listensCount.toLocaleString('ar-EG')} استماع</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {book.rating}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Chapter Index (فهرس الفصول كأزرار قابلة للنقر) */}
      <section
        id="chapters-index-section"
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
              فهرس فصول الكتاب ({book.chapters.length} دروس متاحة للشرح)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">انقر على أي درس لعرض شرحه المباشر</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {book.chapters.map((ch, idx) => {
            const isSelected = ch.id === activeChapter.id;
            return (
              <button
                key={ch.id}
                id={`chapter-index-btn-${ch.id}`}
                onClick={() => setSelectedChapterId(ch.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] ${
                    isSelected
                      ? 'bg-white/25 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {idx + 1}
                </span>
                <span>{ch.title}</span>
                {isSelected && <Volume2 className="w-3.5 h-3.5 text-amber-300 animate-pulse" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* ACTIVE CHAPTER WORKSPACE */}
      <section id="active-chapter-workspace" className="space-y-8">
        {/* Chapter Header + TTS Audio Control Bar */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/20 text-amber-300 inline-block">
                  فصل قيد العرض والاستماع
                </span>
                {isForeignLanguageBook && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-400 text-slate-950 inline-flex items-center gap-1 shadow-xs">
                    <Languages className="w-3.5 h-3.5" />
                    شرح ثنائي (لغة الكتاب + ترجمة عربية وصوتية)
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-black font-tajawal">{activeChapter.title}</h2>
              <p className="text-xs text-blue-100">
                {activeChapter.summary} • مدة الشرح الصوتي التقديرية: {activeChapter.estimatedMinutes} دقائق
              </p>
            </div>

            {/* Main TTS Player Controls */}
            <div className="flex items-center gap-2">
              {!ttsState.isPlaying ? (
                <button
                  id="start-tts-btn"
                  onClick={handlePlayTTS}
                  className="px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg transition transform hover:scale-105 flex items-center gap-2 cursor-pointer"
                >
                  <Volume2 className="w-5 h-5 text-slate-950" />
                  <span>
                    {isForeignLanguageBook
                      ? '🔊 استمع للشرح الصوتي (لغة الكتاب + ترجمة)'
                      : '🔊 استمع للشرح الصوتي الكامل'}
                  </span>
                </button>
              ) : ttsState.isPaused ? (
                <button
                  id="resume-tts-btn"
                  onClick={handlePlayTTS}
                  className="px-5 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs shadow-lg transition flex items-center gap-2 cursor-pointer"
                >
                  <Play className="w-5 h-5" />
                  <span>استئناف الاستماع</span>
                </button>
              ) : (
                <button
                  id="pause-tts-btn"
                  onClick={handlePauseTTS}
                  className="px-5 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs shadow-lg transition flex items-center gap-2 cursor-pointer"
                >
                  <Pause className="w-5 h-5" />
                  <span>إيقاف مؤقت</span>
                </button>
              )}

              {ttsState.isPlaying && (
                <button
                  id="stop-tts-btn"
                  onClick={handleStopTTS}
                  className="p-3.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white transition cursor-pointer"
                  title="إيقاف تام"
                >
                  <Square className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Sound Controls, Audio Modes & Speech Speed */}
          <div className="pt-4 border-t border-white/15 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
            {/* Foreign Language Audio Modes Selector */}
            {isForeignLanguageBook ? (
              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-black/20 backdrop-blur-xs">
                <span className="text-amber-300 text-[11px] px-2 font-bold flex items-center gap-1">
                  <Languages className="w-3.5 h-3.5" />
                  نمط الصوت:
                </span>
                <button
                  type="button"
                  id="audio-mode-bilingual-btn"
                  onClick={() => handleSwitchAudioMode('bilingual')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer text-xs ${
                    audioMode === 'bilingual'
                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  🎙️ شرح ثنائي (لغة الكتاب + ترجمة)
                </button>
                <button
                  type="button"
                  id="audio-mode-source-btn"
                  onClick={() => handleSwitchAudioMode('source_only')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer text-xs ${
                    audioMode === 'source_only'
                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  🇬🇧 لغة الكتاب فقط (English)
                </button>
                <button
                  type="button"
                  id="audio-mode-arabic-btn"
                  onClick={() => handleSwitchAudioMode('arabic_only')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer text-xs ${
                    audioMode === 'arabic_only'
                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  🇪🇬 ترجمة وشرح بالعربية فقط
                </button>
              </div>
            ) : (
              <div className="text-white/80 font-medium">نظام تحويل النص لشرح صوتي فصيح ومبسط</div>
            )}

            {/* Speed selector & Live Playing indicator */}
            <div className="flex items-center gap-4 flex-wrap">
              {/* Speed buttons */}
              <div className="flex items-center gap-1.5">
                <span className="text-white/80 font-semibold flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5" />
                  السرعة:
                </span>
                {[0.75, 1.0, 1.25, 1.5].map((rate) => (
                  <button
                    key={rate}
                    id={`tts-rate-btn-${rate}`}
                    onClick={() => handleChangeRate(rate)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                      ttsState.rate === rate ? 'bg-white text-blue-900' : 'bg-white/15 text-white hover:bg-white/25'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              {/* Sound Test / Diagnostic Button */}
              <button
                type="button"
                id="test-tts-audio-btn"
                onClick={() => ttsRef.current?.testAudio()}
                className="px-2.5 py-1 rounded-lg font-bold bg-white/10 hover:bg-white/20 text-amber-200 border border-amber-300/30 transition cursor-pointer text-xs flex items-center gap-1.5"
                title="اضغط للتأكد من عمل الصوت والنطق باللغتين الإنجليزية والعربية"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                <span>فحص الصوت</span>
              </button>

              {/* Live Audio indicator */}
              {ttsState.isPlaying && !ttsState.isPaused && (
                <div className="flex items-center gap-2 font-bold animate-pulse">
                  {ttsState.currentLang === 'en' ? (
                    <span className="bg-emerald-400 text-slate-950 px-2.5 py-1 rounded-lg text-[11px] font-black">
                      🇬🇧 ينطق بالإنجليزية الآن...
                    </span>
                  ) : ttsState.currentLang === 'fr' ? (
                    <span className="bg-blue-300 text-slate-950 px-2.5 py-1 rounded-lg text-[11px] font-black">
                      🇫🇷 ينطق بالفرنسية الآن...
                    </span>
                  ) : (
                    <span className="bg-amber-300 text-slate-950 px-2.5 py-1 rounded-lg text-[11px] font-black">
                      🇪🇬 يقرأ الترجمة والشرح بالعربية...
                    </span>
                  )}
                  <div className="flex items-end gap-0.5 h-4">
                    <span className="w-1 bg-amber-300 h-3 animate-bounce"></span>
                    <span className="w-1 bg-amber-300 h-4 animate-bounce delay-75"></span>
                    <span className="w-1 bg-amber-300 h-2 animate-bounce delay-150"></span>
                    <span className="w-1 bg-amber-300 h-4 animate-bounce"></span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 📖 1. الشرح النصي والتفاعلي المفصل */}
        <div
          id="chapter-text-explanation"
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-xs space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-black font-tajawal text-slate-900 dark:text-white">
                {isForeignLanguageBook
                  ? '📖 الشرح بلغة الكتاب والترجمة الفورية أسفله'
                  : '📖 الشرح النصي المفصل للفصل'}
              </h3>
            </div>

            {/* View Mode Toggle for Foreign books */}
            {isForeignLanguageBook && bilingualPairs.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setViewMode('bilingual_cards')}
                    className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      viewMode === 'bilingual_cards'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Languages className="w-3.5 h-3.5" />
                    <span>بطاقات ثنائية (شرح + ترجمة)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('continuous')}
                    className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      viewMode === 'continuous'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>النص الكامل</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bilingual Interactive Learning Cards Area */}
          {isForeignLanguageBook && viewMode === 'bilingual_cards' && bilingualPairs.length > 0 ? (
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 flex items-center gap-2">
                <Languages className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  💡 <strong>نظام التعلم الثنائي الذكي</strong>: تم تقسيم الدرس إلى فقرات واضحة بلغة الكتاب،
                  وتحت كل فقرة ترجمتها التوضيحية بالعربية. اضغط على أيقونة 🔊 لسماع أي فقرة بشكل منفصل أو
                  استمع للشرح الكامل!
                </span>
              </div>

              <div className="space-y-4">
                {bilingualPairs.map((pair, idx) => {
                  const isPureArabic = detectLanguage(pair.sourceText) === 'ar';
                  const isSpeakingThis =
                    ttsState.isPlaying &&
                    ttsState.currentPairIndex === idx &&
                    !ttsState.isPaused;

                  return (
                    <div
                      key={idx}
                      className={`p-5 rounded-2xl border transition-all duration-300 ${
                        isSpeakingThis
                          ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-400 ring-2 ring-amber-400/40 shadow-md'
                          : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {/* Active speech indicator */}
                      {isSpeakingThis && (
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-amber-200 dark:border-amber-900/50">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-3 py-1 rounded-full">
                            <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                            جاري القراءة الآن:{' '}
                            {ttsState.currentLang === 'en'
                              ? '🇬🇧 لغة الكتاب بالإنجليزية'
                              : '🇪🇬 الترجمة والشرح بالعربية'}
                          </span>
                        </div>
                      )}

                      {/* Part 1: Foreign Language Text (or pure Arabic headline) */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <p
                            className={`text-base sm:text-lg leading-relaxed text-slate-900 dark:text-white font-medium ${
                              isPureArabic ? 'font-tajawal text-right' : 'dir-ltr text-left'
                            }`}
                          >
                            {pair.sourceText}
                          </p>

                          <button
                            type="button"
                            onClick={() => handlePlaySingleItem(pair.sourceText, pair.sourceLang)}
                            className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer shrink-0 shadow-2xs"
                            title="استمع لنطق هذا الجزء"
                          >
                            <Volume2 className="w-4 h-4 text-blue-600" />
                          </button>
                        </div>
                      </div>

                      {/* Part 2: Arabic Translation & Explanation Underneath */}
                      {!isPureArabic && pair.translationText && pair.translationText !== pair.sourceText && (
                        <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-700/60 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-md">
                              <Languages className="w-3 h-3" />
                              الترجمة والشرح بالعربية:
                            </span>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handlePlaySingleItem(pair.translationText, 'ar')}
                                className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                                title="استمع للترجمة العربية فقط"
                              >
                                <Volume2 className="w-3 h-3" />
                                <span>صوت عربي</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handlePlayPair(idx)}
                                className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 hover:bg-amber-200 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                                title="استمع للجملة مع ترجمتها"
                              >
                                <Play className="w-3 h-3" />
                                <span>قراءة ثنائية</span>
                              </button>
                            </div>
                          </div>

                          <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed font-tajawal pr-1">
                            {pair.translationText}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Continuous Text View */
            <div className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed space-y-4 whitespace-pre-line text-sm sm:text-base">
              {activeChapter.detailedExplanation}
            </div>
          )}
        </div>

        {/* ⭐ 2. نقاط مهمة / تعريفات / قوانين مختصرة */}
        <div id="chapter-key-points-and-rules" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Key Points */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Star className="w-5 h-5 fill-amber-500" />
              <h3 className="text-base font-bold">نقاط ذهبية وركائز للامتحان</h3>
            </div>
            <ul className="space-y-2.5">
              {activeChapter.keyPoints.map((point, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300"
                >
                  <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 text-[11px] font-bold">
                    {idx + 1}
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Definitions & Formulas */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Award className="w-5 h-5" />
              <h3 className="text-base font-bold">أهم التعريفات والقوانين المختصرة</h3>
            </div>

            {activeChapter.definitions && activeChapter.definitions.length > 0 && (
              <div className="space-y-3">
                {activeChapter.definitions.map((def, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
                  >
                    <span className="font-bold text-blue-600 dark:text-blue-400 block mb-1">
                      📌 {def.term}:
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 leading-normal">{def.definition}</p>
                  </div>
                ))}
              </div>
            )}

            {activeChapter.formulas && activeChapter.formulas.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 block">القوانين الرياضية/العلمية:</span>
                {activeChapter.formulas.map((form, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 font-mono text-xs font-bold dir-ltr text-center"
                  >
                    {form}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 📝 3. قسم "اطلب شرحًا مخصصًا" (AI Customized Explanation with Bilingual TTS) */}
        <div
          id="ai-custom-explanation-section"
          className="rounded-3xl bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 dark:from-slate-900 dark:via-purple-950/20 dark:to-slate-900 border-2 border-purple-200 dark:border-purple-900/50 p-6 sm:p-8 space-y-6 shadow-xs"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black font-tajawal text-slate-900 dark:text-white">
                  📝 اطلب شرحًا مخصصًا من المعلم الذكي
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isForeignLanguageBook
                    ? 'اكتب سؤالك وسيقوم المعلم بشرحه بلغة الكتاب وترجمته التوضيحية بالعربية مع النطق الصوتي'
                    : 'هل تجد نقطة غامضة في هذا الفصل؟ اكتب سؤالك وسيقوم الذكاء الاصطناعي بشرحها فوراً'}
                </p>
              </div>
            </div>

            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 self-start sm:self-auto">
              توليد فوري + نطق صوتي ثنائي
            </span>
          </div>

          {/* Prompt suggestions pills */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="text-slate-500 font-semibold self-center">اقتراحات سريعة:</span>
            {isForeignLanguageBook
              ? [
                  'اشرح لي قاعدة المضارع البسيط في هذا الدرس بالأمثلة والترجمة',
                  'ما هي أهم الكلمات والمفردات مع معناها بالعربية؟',
                  'أعطني جملتين من الدرس وكيفية نطقهما الصحيح',
                ].map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => setAiQuestion(sug)}
                    className="px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-purple-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-purple-100 dark:hover:bg-purple-950 text-[11px] transition cursor-pointer"
                  >
                    {sug}
                  </button>
                ))
              : [
                  'اشرح لي هذا الدرس كأنني طفل في سن التاسعة بأمثلة من المنزل',
                  'ما هي أكثر 3 أسئلة تتكرر في امتحانات هذا الفصل؟',
                  'أعطني حيلة ذهنية بسيطة لتذكر هذه القاعدة بدون نسيان',
                ].map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => setAiQuestion(sug)}
                    className="px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-purple-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-purple-100 dark:hover:bg-purple-950 text-[11px] transition cursor-pointer"
                  >
                    {sug}
                  </button>
                ))}
          </div>

          {/* Form input */}
          <form onSubmit={handleAskAi} className="space-y-3">
            <div className="relative">
              <textarea
                id="ai-question-input"
                rows={3}
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder={
                  isForeignLanguageBook
                    ? 'اكتب سؤالك أو الكلمة أو القاعدة التي تريد شرحها بلغة الكتاب وترجمتها بالعربية...'
                    : 'اكتب ما تريد شرحه أو سؤالك المحدد في هذا الفصل بالتفصيل...'
                }
                className="w-full p-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-purple-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:border-purple-600 focus:outline-hidden transition shadow-inner placeholder-slate-400 resize-none"
              />

              <button
                id="submit-ai-question-btn"
                type="submit"
                disabled={isGeneratingAi || !aiQuestion.trim()}
                className="absolute bottom-3 left-3 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs shadow-md flex items-center gap-2 transition cursor-pointer"
              >
                {isGeneratingAi ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري تحضير الشرح...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>شرح بالمعلم الذكي</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* AI Error Alert with Retry */}
          {aiError && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{aiError}</span>
              </div>
              <button
                type="button"
                onClick={() => handleAskAi()}
                disabled={isGeneratingAi}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                <span>إعادة المحاولة الآن</span>
              </button>
            </div>
          )}

          {/* AI Response Display */}
          {aiExplanation && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/90 border border-purple-200 dark:border-purple-800/50 shadow-md space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-purple-100 dark:border-slate-700 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    الشرح الذكي المخصص لك:
                  </span>
                  {aiSource && (
                    <span className="text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-md font-mono">
                      {aiSource === 'gemini'
                        ? `Gemini (${aiModel || '3.1 Flash Lite'})`
                        : aiSource === 'curriculum-expert'
                        ? 'خبير المنهج المعتمد'
                        : 'المنهج الذكي'}
                    </span>
                  )}
                </div>

                <button
                  id="listen-ai-explanation-btn"
                  onClick={handlePlayAiExplanationTTS}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>🔊 استمع لهذا الشرح</span>
                </button>
              </div>

              {aiNotice && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{aiNotice}</span>
                </div>
              )}

              <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                {aiExplanation}
              </div>
            </div>
          )}
        </div>

        {/* ✅ 4. اختبار قصير على الفصل (اختيار من متعدد) مع تصحيح فوري */}
        <div
          id="chapter-quiz-section"
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-xs space-y-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <div>
                <h3 className="text-lg font-black font-tajawal text-slate-900 dark:text-white">
                  ✅ اختبار قصير على الفصل (تقييم فوري)
                </h3>
                <p className="text-xs text-slate-500">
                  أجب عن الأسئلة التالية لتثبيت معلوماتك وتحصل على نتيجة فورية وشرح الحل
                </p>
              </div>
            </div>

            {quizSubmitted && (
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  <span>
                    النتيجة: {quizScore} من {activeChapter.quiz.length}
                  </span>
                </div>
                <button
                  id="reset-quiz-btn"
                  onClick={handleResetQuiz}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold transition cursor-pointer"
                >
                  إعادة الاختبار
                </button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {activeChapter.quiz.map((q, qIndex) => {
              const selectedOpt = userAnswers[q.id];
              const isAnswered = selectedOpt !== undefined;
              const isCorrect = isAnswered && selectedOpt === q.correctIndex;

              return (
                <div
                  key={q.id}
                  className={`p-6 rounded-2xl border transition-all ${
                    quizSubmitted
                      ? isCorrect
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                        : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                      : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {qIndex + 1}
                    </span>
                    <div className="space-y-4 flex-1">
                      <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        {q.question}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {q.options.map((option, optIdx) => {
                          const isOptionSelected = selectedOpt === optIdx;
                          let btnStyle =
                            'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400';

                          if (quizSubmitted) {
                            if (optIdx === q.correctIndex) {
                              btnStyle =
                                'bg-emerald-500 text-white border-emerald-600 font-bold shadow-xs';
                            } else if (isOptionSelected) {
                              btnStyle =
                                'bg-rose-500 text-white border-rose-600 font-bold line-through opacity-80';
                            } else {
                              btnStyle = 'opacity-40 bg-slate-100 dark:bg-slate-800 border-transparent';
                            }
                          } else if (isOptionSelected) {
                            btnStyle =
                              'bg-blue-600 text-white border-blue-600 font-bold shadow-md shadow-blue-500/20';
                          }

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              disabled={quizSubmitted}
                              onClick={() => handleOptionSelect(q.id, optIdx)}
                              className={`p-3 rounded-xl border text-xs sm:text-sm text-right transition cursor-pointer flex items-center gap-2 ${btnStyle}`}
                            >
                              <span className="w-5 h-5 rounded-md border border-current/30 flex items-center justify-center text-[10px] shrink-0 font-bold">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span>{option}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation if submitted */}
                      {quizSubmitted && (
                        <div
                          className={`p-3.5 rounded-xl text-xs space-y-1 ${
                            isCorrect
                              ? 'bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-200'
                              : 'bg-rose-100/70 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border border-rose-200'
                          }`}
                        >
                          <div className="font-bold flex items-center gap-1.5">
                            {isCorrect ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-600" />
                            )}
                            <span>{isCorrect ? 'إجابة صحيحة! أحسنت' : 'إجابة غير دقيقة! انتبه'}</span>
                          </div>
                          <p className="leading-relaxed pr-5">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {!quizSubmitted && (
            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                id="submit-quiz-answers-btn"
                type="button"
                onClick={handleCalculateScore}
                className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg transition cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>تصحيح الإجابات وعرض النتيجة</span>
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
