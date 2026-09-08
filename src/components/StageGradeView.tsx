import React, { useState } from 'react';
import {
  BookOpen,
  UploadCloud,
  CheckCircle2,
  FileText,
  Volume2,
  Star,
  ArrowLeft,
  Filter,
  Eye,
  Calendar,
  Sparkles,
  Layers,
  ChevronLeft,
  Download,
} from 'lucide-react';
import {
  STAGES_CONFIG,
  PRIMARY_SUBJECTS,
  PREP_SUBJECTS,
  SECONDARY_STREAM_SUBJECTS,
  INITIAL_SUMMARIES,
} from '../data/curriculumData';
import { EducationalStageId, ExternalBook, SecondaryStreamId, Subject } from '../types';

interface StageGradeViewProps {
  stageId: EducationalStageId;
  gradeId: string;
  initialStreamId?: SecondaryStreamId;
  books: ExternalBook[];
  onSelectGrade: (gradeId: string) => void;
  onOpenBook: (bookId: string, chapterId?: string) => void;
  onOpenUpload: () => void;
  onQuickPlayAudio: (book: ExternalBook, chapterIndex?: number) => void;
}

type TabType = 'books' | 'quizzes' | 'summaries';

export const StageGradeView: React.FC<StageGradeViewProps> = ({
  stageId,
  gradeId,
  initialStreamId = 'scientific',
  books,
  onSelectGrade,
  onOpenBook,
  onOpenUpload,
  onQuickPlayAudio,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('books');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [streamId, setStreamId] = useState<SecondaryStreamId>(initialStreamId);

  const stage = STAGES_CONFIG.find((s) => s.id === stageId)!;
  const grade = stage.grades.find((g) => g.id === gradeId) || stage.grades[0];

  // Determine subjects depending on stage and stream
  let availableSubjects: Subject[] = [];
  if (stageId === 'primary') {
    availableSubjects = PRIMARY_SUBJECTS;
  } else if (stageId === 'prep') {
    availableSubjects = PREP_SUBJECTS;
  } else {
    availableSubjects = SECONDARY_STREAM_SUBJECTS[streamId] || [];
  }

  // Filter books by grade and subject
  const gradeBooks = books.filter((b) => {
    const matchGrade = b.gradeId === grade.id;
    const matchSubject = selectedSubjectId === 'all' || b.subjectId === selectedSubjectId;
    const matchStream = stageId !== 'secondary' || !b.streamId || b.streamId === streamId;
    return matchGrade && matchSubject && matchStream;
  });

  // Collect all quizzes for this grade
  const gradeQuizzes = gradeBooks.flatMap((b) =>
    b.chapters.map((ch) => ({
      book: b,
      chapter: ch,
      questionCount: ch.quiz.length,
    }))
  );

  // Filter summaries
  const summaries = INITIAL_SUMMARIES.filter((s) => s.gradeId === grade.id);

  return (
    <div id="stage-grade-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Breadcrumb */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                {stage.name}
              </span>
              <ChevronLeft className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-500">{grade.name}</span>
            </div>

            <h1 className="text-3xl font-black font-tajawal text-slate-900 dark:text-white">
              {grade.name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              تصفح الكتب الخارجية المرفوعة، واستمع لشرح الفصول نصياً وصوتياً
            </p>
          </div>

          {/* Action button: Upload book */}
          <button
            id="sidebar-upload-book-btn"
            onClick={onOpenUpload}
            className="self-start md:self-auto flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>⬆ رفع كتاب خارجي جديد لهذا الصف</span>
          </button>
        </div>

        {/* Grades pills navigation */}
        <div className="pt-4 flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-xs font-bold text-slate-400 shrink-0">تبديل الصف:</span>
          {stage.grades.map((g) => (
            <button
              key={g.id}
              id={`switch-grade-${g.id}`}
              onClick={() => onSelectGrade(g.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                g.id === grade.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>

        {/* High School Stream Switcher */}
        {stageId === 'secondary' && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 shrink-0">
              اختيار الشعبة / القسم:
            </span>
            <div className="flex items-center gap-2">
              <button
                id="stream-scientific-btn"
                onClick={() => {
                  setStreamId('scientific');
                  setSelectedSubjectId('all');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  streamId === 'scientific'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50'
                }`}
              >
                🔬 القسم العلمي (رياضيات - فيزياء - كيمياء - أحياء)
              </button>
              <button
                id="stream-literary-btn"
                onClick={() => {
                  setStreamId('literary');
                  setSelectedSubjectId('all');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  streamId === 'literary'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-50'
                }`}
              >
                📚 القسم الأدبي (تاريخ - جغرافيا - فلسفة - علم نفس)
              </button>
              <button
                id="stream-general-btn"
                onClick={() => {
                  setStreamId('general');
                  setSelectedSubjectId('all');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  streamId === 'general'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50'
                }`}
              >
                ⭐ المواد المشتركة (لغة عربية - إنجليزية - فرنسية - دين)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Sidebar + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside id="grade-sidebar" className="lg:col-span-1 space-y-6">
          {/* Main Tabs in Sidebar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 shadow-xs space-y-1">
            <button
              id="sidebar-tab-books"
              onClick={() => setActiveTab('books')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'books'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                الكتب الخارجية المرفوعة
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-black/20 text-white font-mono">
                {gradeBooks.length}
              </span>
            </button>

            <button
              id="sidebar-tab-quizzes"
              onClick={() => setActiveTab('quizzes')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'quizzes'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                اختبارات وتقييمات قصيرة
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-black/20 text-white font-mono">
                {gradeQuizzes.length}
              </span>
            </button>

            <button
              id="sidebar-tab-summaries"
              onClick={() => setActiveTab('summaries')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'summaries'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                ملخصات ومراجعات
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-black/20 text-white font-mono">
                {summaries.length}
              </span>
            </button>
          </div>

          {/* Subjects Navigation */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                المواد الدراسية
              </h3>
              <span className="text-[10px] text-slate-400">تصفية سريعة</span>
            </div>

            <div className="space-y-1">
              <button
                id="subject-filter-all"
                onClick={() => setSelectedSubjectId('all')}
                className={`w-full text-right px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-between ${
                  selectedSubjectId === 'all'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>جميع المواد</span>
                <span className="text-[10px] opacity-75">{books.filter(b => b.gradeId === grade.id).length}</span>
              </button>

              {availableSubjects.map((sub) => {
                const count = books.filter((b) => b.gradeId === grade.id && b.subjectId === sub.id).length;
                return (
                  <button
                    key={sub.id}
                    id={`subject-filter-${sub.id}`}
                    onClick={() => setSelectedSubjectId(sub.id)}
                    className={`w-full text-right px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-between ${
                      selectedSubjectId === sub.id
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{sub.name}</span>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main id="grade-content-area" className="lg:col-span-3 space-y-6">
          {/* TAB 1: Books */}
          {activeTab === 'books' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  عرض الكتب المرفوعة ({gradeBooks.length} كتاب)
                </span>

                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  {selectedSubjectId === 'all'
                    ? 'كل المواد'
                    : availableSubjects.find((s) => s.id === selectedSubjectId)?.name}
                </span>
              </div>

              {gradeBooks.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 space-y-4">
                  <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                      لا توجد كتب مرفوعة حالياً لهذه المادة
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      كن أول من يرفع كتاباً خارجياً أو مذكرة تعليمية معتمدة لهذا الصف ليستفيد منها جميع الطلاب
                    </p>
                  </div>
                  <button
                    onClick={onOpenUpload}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md cursor-pointer"
                  >
                    رفع كتاب الآن
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {gradeBooks.map((book) => (
                    <div
                      key={book.id}
                      id={`grade-book-${book.id}`}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative h-44 overflow-hidden bg-slate-100 dark:bg-slate-800">
                          <img
                            src={book.coverImage}
                            alt={book.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span>{book.rating}</span>
                          </div>

                          <div className="absolute top-3 left-3 bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-md">
                            {book.chapters.length} فصول مشروحة
                          </div>

                          <button
                            onClick={() => onQuickPlayAudio(book)}
                            className="absolute bottom-3 left-3 w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-lg transition transform hover:scale-105 cursor-pointer"
                            title="استمع للشرح الصوتي"
                          >
                            <Volume2 className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="p-5 space-y-3">
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                              {book.author}
                            </span>
                            <span>{book.publisher}</span>
                          </div>

                          <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                            {book.title}
                          </h3>

                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {book.description}
                          </p>

                          {/* Chapters preview chips */}
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-bold text-slate-400 block mb-1.5">
                              فصول الكتاب:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {book.chapters.map((ch) => (
                                <button
                                  key={ch.id}
                                  onClick={() => onOpenBook(book.id, ch.id)}
                                  className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                                >
                                  {ch.title.split(':')[0]}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 pt-0">
                        <button
                          onClick={() => onOpenBook(book.id)}
                          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/10"
                        >
                          <span>عرض الكتاب وفهرس الشروحات</span>
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Quizzes & Evaluations */}
          {activeTab === 'quizzes' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  اختبارات وتقييمات قصيرة لقياس الفهم ({gradeQuizzes.length} اختبار متاح)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  اختبارات اختيار من متعدد على فصول الكتب مع تصحيح فوري وشرح تفصيلي للحلول
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gradeQuizzes.map(({ book, chapter }) => (
                  <div
                    key={`${book.id}-${chapter.id}`}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                        {chapter.quiz.length} أسئلة اختيار من متعدد
                      </span>
                      <span className="text-[11px] text-slate-400">تصحيح فوري</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {chapter.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-1">{book.title}</p>

                    <button
                      onClick={() => onOpenBook(book.id, chapter.id)}
                      className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>بدء الاختبار الآن</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Summaries & Reviews */}
          {activeTab === 'summaries' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  ملخصات ومراجعات ليلة الامتحان
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  خرائط ذهنية وتلخيصات لأهم القوانين والتعريفات بصيغة مركزة وسريعة
                </p>
              </div>

              <div className="space-y-3">
                {summaries.map((sum) => (
                  <div
                    key={sum.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs hover:border-blue-400 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {sum.title}
                        </h4>
                        <p className="text-xs text-slate-500">
                          إعداد: {sum.author} • {sum.pagesCount} صفحات • {sum.downloads} تحميل
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => alert('جاري تجهيز وتحميل ملف الملخص PDF...')}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-xs font-bold transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تحميل</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
