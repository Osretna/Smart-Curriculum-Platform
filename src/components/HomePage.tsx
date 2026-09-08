import React, { useState, useEffect } from 'react';
import {
  Search,
  Volume2,
  BookOpen,
  ArrowLeft,
  Users,
  CheckCircle2,
  UploadCloud,
  Headphones,
  FileText,
  Star,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { STAGES_CONFIG } from '../data/curriculumData';
import { EducationalStageId, ExternalBook } from '../types';

interface HomePageProps {
  books: ExternalBook[];
  onSelectStage: (stageId: EducationalStageId) => void;
  onSelectGrade: (stageId: EducationalStageId, gradeId: string) => void;
  onOpenBook: (bookId: string, chapterId?: string) => void;
  onOpenUpload: () => void;
  onQuickPlayAudio: (book: ExternalBook, chapterIndex?: number) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  books,
  onSelectStage,
  onSelectGrade,
  onOpenBook,
  onOpenUpload,
  onQuickPlayAudio,
  searchQuery,
  setSearchQuery,
}) => {
  const [sliderIndex, setSliderIndex] = useState(0);

  const heroSlides = [
    {
      title: 'منصة المنهج الذكي: كتبك الخارجية مشروحة نصياً وصوتياً',
      subtitle: 'استمع لشرح كل فصل بصوت عربي نقي، واطلب شرحاً مخصصاً بالذكاء الاصطناعي مع اختبارات تفاعلية فورية.',
      badge: 'الجيل الجديد من التعليم المدرسي',
      color: 'from-blue-700 via-indigo-700 to-amber-500',
      actionText: 'ابدأ الاستماع الآن',
      actionStage: 'primary' as EducationalStageId,
    },
    {
      title: 'ارفع كتبك وشارك ملخصاتك مع آلاف المعلمين والطلاب',
      subtitle: 'نظام متكامل لتصنيف الكتب الخارجية (ابتدائي – إعدادي – ثانوي) بصيغ PDF وWord مع فهرسة آلية للفصول.',
      badge: 'مكتبة رقمية مفتوحة',
      color: 'from-emerald-700 via-teal-700 to-cyan-600',
      actionText: 'رفع كتاب جديد',
      isUpload: true,
    },
    {
      title: 'تأهيل متكامل للثانوية العامة: علمي، أدبي، ومواد مشتركة',
      subtitle: 'شروحات دقيقة لأعقد القوانين والمفاهيم مع بنك أسئلة بنظام الامتحانات الحديث ونماذج إجابات استرشادية.',
      badge: 'استعد للتفوق بالثانوية',
      color: 'from-amber-600 via-orange-600 to-rose-600',
      actionText: 'استكشف مناهج الثانوية',
      actionStage: 'secondary' as EducationalStageId,
    },
  ];

  // Auto slide
  useEffect(() => {
    const timer = setInterval(() => {
      setSliderIndex((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const currentSlide = heroSlides[sliderIndex];

  // Filtered books for search
  const searchResults = searchQuery.trim()
    ? books.filter((b) =>
        b.title.includes(searchQuery) ||
        b.author.includes(searchQuery) ||
        b.description.includes(searchQuery) ||
        b.chapters.some((c) => c.title.includes(searchQuery) || c.detailedExplanation.includes(searchQuery))
      )
    : [];

  const latestBooks = [...books].slice(0, 4);

  return (
    <div id="home-page-container" className="space-y-16 pb-20">
      {/* Hero Slider Section */}
      <section id="hero-slider-section" className="relative overflow-hidden rounded-3xl mx-4 sm:mx-6 lg:mx-8 mt-6">
        <div
          className={`relative z-10 px-6 sm:px-12 py-16 sm:py-20 text-white rounded-3xl bg-gradient-to-r ${currentSlide.color} transition-all duration-700 shadow-2xl flex flex-col justify-between min-h-[420px]`}
        >
          {/* Subtle background illustration shapes */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent"></div>

          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold tracking-wide border border-white/30">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              {currentSlide.badge}
            </div>

            <h1 className="text-3xl sm:text-5xl font-black font-tajawal leading-tight drop-shadow-xs">
              {currentSlide.title}
            </h1>

            <p className="text-base sm:text-lg text-white/90 font-medium leading-relaxed max-w-2xl">
              {currentSlide.subtitle}
            </p>

            {/* Quick Actions in Hero */}
            <div className="pt-4 flex flex-wrap items-center gap-3">
              {currentSlide.isUpload ? (
                <button
                  id="hero-upload-cta"
                  onClick={onOpenUpload}
                  className="px-6 py-3.5 rounded-2xl bg-white text-emerald-800 font-extrabold text-sm hover:bg-emerald-50 hover:shadow-lg transition transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <UploadCloud className="w-5 h-5 text-emerald-600" />
                  <span>رفع كتاب خارجي جديد</span>
                </button>
              ) : (
                <button
                  id="hero-explore-cta"
                  onClick={() => currentSlide.actionStage && onSelectStage(currentSlide.actionStage)}
                  className="px-6 py-3.5 rounded-2xl bg-white text-slate-900 font-extrabold text-sm hover:bg-slate-100 hover:shadow-lg transition transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <span>{currentSlide.actionText}</span>
                  <ArrowLeft className="w-4 h-4 text-blue-600" />
                </button>
              )}

              <button
                id="hero-quick-listen-cta"
                onClick={() => onQuickPlayAudio(books[0])}
                className="px-5 py-3.5 rounded-2xl bg-black/25 hover:bg-black/35 backdrop-blur-md text-white font-bold text-sm transition border border-white/20 flex items-center gap-2 cursor-pointer"
              >
                <Volume2 className="w-4 h-4 text-amber-300" />
                <span>جرّب الشرح الصوتي المباشر</span>
              </button>
            </div>
          </div>

          {/* Slider controls & dots */}
          <div className="flex items-center justify-between pt-8 border-t border-white/15 mt-6">
            <div className="flex items-center gap-2">
              {heroSlides.map((_, i) => (
                <button
                  key={i}
                  id={`slide-dot-${i}`}
                  onClick={() => setSliderIndex(i)}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${
                    i === sliderIndex ? 'w-8 bg-white' : 'w-2.5 bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`الشريحة ${i + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                id="prev-slide-btn"
                onClick={() => setSliderIndex((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1))}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition cursor-pointer text-white"
                aria-label="السابق"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                id="next-slide-btn"
                onClick={() => setSliderIndex((prev) => (prev + 1) % heroSlides.length)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition cursor-pointer text-white"
                aria-label="التالي"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Search Bar Section */}
      <section id="search-section" className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="absolute right-4 w-6 h-6 text-slate-400 pointer-events-none" />
            <input
              id="main-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن كتاب، مؤلف، مادة، درس، أو شرح صوتي..."
              className="w-full pr-14 pl-12 py-4 text-base rounded-2xl bg-white dark:bg-slate-800/90 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:outline-hidden transition shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-4 text-xs bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md"
              >
                مسح
              </button>
            )}
          </div>

          {/* Quick tags */}
          <div className="flex items-center gap-2 mt-3 flex-wrap text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">أكثر بحثاً:</span>
            {['كان وأخواتها', 'قانون أوم', 'التكيف والبقاء', 'الحملة الفرنسية', 'الجبر والإحصاء'].map((tag) => (
              <button
                key={tag}
                onClick={() => setSearchQuery(tag)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Real-time search results popup */}
          {searchQuery.trim() !== '' && (
            <div className="mt-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  نتائج البحث ({searchResults.length})
                </span>
                <span className="text-xs text-blue-600 dark:text-blue-400">عن: "{searchQuery}"</span>
              </div>

              {searchResults.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm">
                  لم يتم العثور على كتب أو دروس مطابقة لكلمة البحث. جرّب كلمات أخرى.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {searchResults.map((book) => (
                    <div
                      key={book.id}
                      className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2 rounded-xl transition"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="w-12 h-14 object-cover rounded-lg shadow-xs"
                        />
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                            {book.title}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {book.author} • {book.chapters.length} فصول مشروحة
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onOpenBook(book.id)}
                          className="px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded-lg hover:bg-blue-100 transition cursor-pointer"
                        >
                          تصفح الكتاب
                        </button>
                        <button
                          onClick={() => onQuickPlayAudio(book)}
                          className="p-2 text-xs bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition cursor-pointer"
                          title="استمع للشرح"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 3 Main Stages Cards */}
      <section id="stages-cards-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full">
            المسارات التعليمية المعتمدة
          </span>
          <h2 className="text-3xl font-black font-tajawal text-slate-900 dark:text-white">
            اختر مرحلتك الدراسية للوصول لجميع الكتب والشروحات
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            فهرسة شاملة للمناهج المصرية والعربية مقسمة حسب الصفوف والمواد الدراسية
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {STAGES_CONFIG.map((stage) => {
            const isPrimary = stage.id === 'primary';
            const isPrep = stage.id === 'prep';

            return (
              <div
                key={stage.id}
                id={`stage-card-${stage.id}`}
                className="group relative rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden"
              >
                {/* Top Accent bar */}
                <div
                  className={`absolute top-0 right-0 left-0 h-2 bg-gradient-to-r ${stage.themeClass}`}
                ></div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        isPrimary
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : isPrep
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {stage.badge}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">
                      {stage.grades.length} صفوف دراسية
                    </span>
                  </div>

                  <h3 className="text-2xl font-black font-tajawal text-slate-900 dark:text-white mb-2">
                    {stage.name}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                    {stage.tagline}
                  </p>

                  {/* Grades pills */}
                  <div className="space-y-1.5 mb-6">
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">الصفوف المتاحة:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {stage.grades.map((grade) => (
                        <button
                          key={grade.id}
                          onClick={() => onSelectGrade(stage.id, grade.id)}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                        >
                          {grade.name.replace('المرحلة ', '')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    id={`enter-stage-btn-${stage.id}`}
                    onClick={() => onSelectStage(stage.id)}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r ${stage.themeClass} hover:opacity-95 shadow-md flex items-center justify-center gap-2 transition cursor-pointer`}
                  >
                    <span>دخول قسم {stage.name}</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Latest Uploaded Books */}
      <section id="latest-books-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h2 className="text-2xl font-black font-tajawal text-slate-900 dark:text-white">
                أحدث الكتب الخارجية المرفوعة
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              كتب معتمدة من كبرى دور النشر والمعلمين مرفوعة ومفهرسة بالكامل
            </p>
          </div>

          <button
            id="upload-new-book-banner-btn"
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>⬆ رفع كتاب جديد</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {latestBooks.map((book) => (
            <div
              key={book.id}
              id={`book-card-${book.id}`}
              className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-xl transition duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>{book.rating}</span>
                  </div>

                  <button
                    onClick={() => onQuickPlayAudio(book)}
                    className="absolute bottom-3 left-3 w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition cursor-pointer"
                    title="استمع لشرح الكتاب"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{book.uploaderName}</span>
                    <span>{book.chapters.length} فصول</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                    {book.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {book.description}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0">
                <button
                  onClick={() => onOpenBook(book.id)}
                  className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>فتح فهرس الكتاب والشرح</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Most Popular Audio Lessons */}
      <section id="popular-audio-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-10 border border-slate-800 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                <Headphones className="w-3.5 h-3.5" />
                <span>أكثر الشروحات الصوتية استماعاً هذا الأسبوع</span>
              </div>
              <h2 className="text-2xl font-black font-tajawal">استمع وتعلّم أينما كنت بصوت واضح</h2>
              <p className="text-xs text-slate-400">
                حوّل الدروس والكتب الخارجية إلى بودكاست تعليمي مفصّل مع التحكم بسرعة الصوت
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {books.flatMap((b) =>
              b.chapters.map((ch, idx) => ({
                book: b,
                chapter: ch,
                index: idx,
              }))
            ).slice(0, 3).map(({ book, chapter, index }) => (
              <div
                key={`${book.id}-${chapter.id}`}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400/50 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onQuickPlayAudio(book, index)}
                    className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 group-hover:bg-amber-500 group-hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
                  >
                    <Volume2 className="w-6 h-6" />
                  </button>
                  <div className="text-right">
                    <h4 className="text-xs font-bold text-white line-clamp-1">{chapter.title}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{book.title}</p>
                    <span className="text-[10px] text-amber-400/90 font-medium">
                      ⏱ {chapter.estimatedMinutes} دقائق استماع
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onOpenBook(book.id, chapter.id)}
                  className="text-xs text-slate-300 hover:text-white px-2 py-1 bg-white/10 rounded-lg cursor-pointer transition shrink-0"
                >
                  قراءة
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Statistics */}
      <section id="platform-stats-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-1 shadow-xs">
            <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-3xl font-black font-tajawal text-slate-900 dark:text-white">1,480+</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">كتاب خارجي ومذكرة</div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-1 shadow-xs">
            <Volume2 className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <div className="text-3xl font-black font-tajawal text-slate-900 dark:text-white">8,250+</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">شرح صوتي تركيبي</div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-1 shadow-xs">
            <Users className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <div className="text-3xl font-black font-tajawal text-slate-900 dark:text-white">95,000+</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">طالب ومعلم مسجل</div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-1 shadow-xs">
            <CheckCircle2 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-3xl font-black font-tajawal text-slate-900 dark:text-white">18,400+</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">اختبار قصير مصحح</div>
          </div>
        </div>
      </section>

      {/* Why Smart Curriculum Platform */}
      <section id="features-overview-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-blue-50/60 dark:bg-slate-800/40 border border-blue-100 dark:border-slate-800 p-8 sm:p-12">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100/60 dark:bg-blue-950 px-3 py-1 rounded-full">
              مميزات استثنائية للطلاب والمعلمين
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-tajawal text-slate-900 dark:text-white">
              لماذا يفضل الطلاب منصة المنهج الذكي؟
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                <Volume2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">شرح صوتي بالعربية (TTS)</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                استمع لنصوص وفصول الكتب بصوت واضح مع إمكانية تسريع وتيرة القراءة وتتبع الجمل خطوة بخطوة.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">اطلب شرحاً مخصصاً بالذكاء الاصطناعي</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                اكتب أي سؤال يخطر ببالك حول الفصل، وستتلقى إجابة فورية ذكية وشرحاً صوتياً مدعوماً بأمثلة حية.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">تقييمات واختبارات فورية</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                اختبر استيعابك لكل درس باختبارات اختيار من متعدد مع إظهار النتيجة الفورية والشرح التفصيلي للحل.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
