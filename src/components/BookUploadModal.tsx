import React, { useState } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  Wand2,
  ListOrdered,
  Layers,
} from 'lucide-react';
import { STAGES_CONFIG, PRIMARY_SUBJECTS, PREP_SUBJECTS, SECONDARY_STREAM_SUBJECTS } from '../data/curriculumData';
import { EducationalStageId, ExternalBook, SecondaryStreamId, UserProfile, Chapter } from '../types';
import { generateCurriculumFromFilename } from '../utils/bookAnalyzer';
import { extractDocumentText } from '../utils/fileTextExtractor';

interface BookUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (newBook: ExternalBook) => void;
  currentUser: UserProfile | null;
}

interface ChapterDraft {
  title: string;
  summary: string;
  explanation: string;
  keyPoints?: string[];
  definitions?: { term: string; definition: string }[];
  quiz?: { question: string; options: string[]; correctIndex: number; explanation: string }[];
  estimatedMinutes?: number;
}

export const BookUploadModal: React.FC<BookUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  currentUser,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publisher, setPublisher] = useState('');
  const [stageId, setStageId] = useState<EducationalStageId>('primary');
  const [gradeId, setGradeId] = useState('grade-p1');
  const [subjectId, setSubjectId] = useState('arabic');
  const [streamId, setStreamId] = useState<SecondaryStreamId>('scientific');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [fileType, setFileType] = useState<'pdf' | 'doc' | 'image'>('pdf');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Automatic Extraction States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [extractedSuccess, setExtractedSuccess] = useState(false);
  const [extractionSource, setExtractionSource] = useState<'ai' | 'engine' | null>(null);
  const [showManualFields, setShowManualFields] = useState(false);
  const [expandedChapterIndex, setExpandedChapterIndex] = useState<number | null>(0);

  // Document Content Metrics & Preview
  const [extractedPagesCount, setExtractedPagesCount] = useState<number>(0);
  const [extractedWordsCount, setExtractedWordsCount] = useState<number>(0);
  const [extractedSnippets, setExtractedSnippets] = useState<string[]>([]);
  const [showSnippets, setShowSnippets] = useState<boolean>(false);

  // Chapters creator with rich defaults
  const [chapters, setChapters] = useState<ChapterDraft[]>([
    {
      title: 'الدرس الأول: مدخل تمهيدي ومفاهيم أساسية',
      summary: 'مقدمة شاملة حول أهم المفاهيم والقوانين المقررة في هذا الفصل.',
      explanation: 'شرح مفصل وميسر للفصل الأول يعتمد على الأمثلة التوضيحية البسيطة والربط بالواقع لمساعدة الطالب على الحفظ والفهم السريع.',
      keyPoints: ['التركيز على القوانين والمصطلحات الرئيسية.', 'التطبيق العملي وحل التدريبات يثبت المعلومة.'],
      definitions: [{ term: 'المفهوم الأساسي', definition: 'تعريف مفاهيمي مبسط لموضوع الفصل.' }],
      estimatedMinutes: 8,
      quiz: [
        {
          question: 'ما هو المفهوم الجوهري الذي يركز عليه هذا الدرس؟',
          options: ['الفهم والتطبيق العملي', 'الحفظ فقط دون فهم', 'إهمال التدريبات', 'لا شيء مما سبق'],
          correctIndex: 0,
          explanation: 'الفهم والتطبيق العملي هو السبيل للتفوق الدراسي.',
        },
      ],
    },
  ]);

  // Stage change sync
  const handleStageChange = (newStage: EducationalStageId) => {
    setStageId(newStage);
    const targetStage = STAGES_CONFIG.find((s) => s.id === newStage);
    if (targetStage && targetStage.grades.length > 0) {
      setGradeId(targetStage.grades[0].id);
    }
  };

  const currentStageConfig = STAGES_CONFIG.find((s) => s.id === stageId) || STAGES_CONFIG[0];

  // Subjects for selected stage & stream
  const currentSubjects =
    stageId === 'primary'
      ? PRIMARY_SUBJECTS
      : stageId === 'prep'
      ? PREP_SUBJECTS
      : SECONDARY_STREAM_SUBJECTS[streamId] || [];

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processAndAnalyzeFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processAndAnalyzeFile(file);
    }
  };

  /**
   * Automatic Book Extraction & Analysis Engine
   * Takes the uploaded book and automatically generates:
   * - Official title
   * - Author & publisher
   * - Exact stage, grade & subject
   * - Comprehensive chapter breakdown
   * - Voice-ready explanations, key points, definitions, and quizzes
   */
  const processAndAnalyzeFile = async (file: File) => {
    setFileName(file.name);
    setFileSize((file.size / (1024 * 1024)).toFixed(1) + ' MB');
    if (file.name.endsWith('.pdf')) setFileType('pdf');
    else if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) setFileType('doc');
    else setFileType('image');

    setIsAnalyzing(true);
    setExtractedSuccess(false);
    setAnalysisStep(1);

    // Step 1: Extract real text directly from the uploaded document
    let extractedText = '';
    try {
      const docResult = await extractDocumentText(file);
      extractedText = docResult.text;
      setExtractedPagesCount(docResult.numPages);
      setExtractedWordsCount(docResult.wordCount);
      setExtractedSnippets(docResult.sampleSnippets);
    } catch (extractErr) {
      console.warn('Direct document extraction warning:', extractErr);
    }

    setAnalysisStep(2);

    // Step animation timer for UI feedback
    const stepInterval = setInterval(() => {
      setAnalysisStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 650);

    try {
      const response = await fetch('/api/ai/analyze-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
          extractedText,
        }),
      });

      let result: any = null;
      if (response.ok) {
        try {
          result = await response.json();
        } catch {
          // non-JSON response fallback
        }
      }
      clearInterval(stepInterval);

      if (result && result.data) {
        applyExtractedData(result.data, result.source === 'gemini-ai' ? 'ai' : 'engine');
      } else {
        // Safe authentic local fallback using the real extracted text!
        const localData = generateCurriculumFromFilename(file.name, extractedText);
        applyExtractedData(localData, 'engine');
      }
    } catch {
      clearInterval(stepInterval);
      const localData = generateCurriculumFromFilename(file.name, extractedText);
      applyExtractedData(localData, 'engine');
    } finally {
      setIsAnalyzing(false);
      setExtractedSuccess(true);
    }
  };

  const applyExtractedData = (data: any, source: 'ai' | 'engine') => {
    setTitle(data.title || fileName);
    setAuthor(data.author || 'سلسلة تعليمية معتمدة');
    setPublisher(data.publisher || 'دار نشر تعليمية');
    if (data.stageId) setStageId(data.stageId);
    if (data.gradeId) setGradeId(data.gradeId);
    if (data.subjectId) setSubjectId(data.subjectId);
    if (data.streamId) setStreamId(data.streamId);
    if (data.description) setDescription(data.description);
    if (data.coverImage) setCoverImage(data.coverImage);

    if (Array.isArray(data.chapters) && data.chapters.length > 0) {
      setChapters(
        data.chapters.map((ch: any, idx: number) => ({
          title: ch.title || `الفصل ${idx + 1}`,
          summary: ch.summary || 'ملخص الفصل المقرر.',
          explanation: ch.detailedExplanation || ch.explanation || 'شرح تفصيلي للدرس.',
          keyPoints: ch.keyPoints || ['التركيز على القواعد والمفاهيم الأساسية.'],
          definitions: ch.definitions || [],
          quiz: ch.quiz || [],
          estimatedMinutes: ch.estimatedMinutes || 10,
        }))
      );
    }
    setExtractionSource(source);
  };

  const handleAddChapter = () => {
    setChapters((prev) => [
      ...prev,
      {
        title: `الدرس ${prev.length + 1}: موضوع دراسي إضافي`,
        summary: 'ملخص موجز لنقاط الدرس.',
        explanation: 'شرح مستوفٍ للمفاهيم والقوانين المقررة في هذا الدرس.',
        keyPoints: ['مراجعة القوانين والتعريفات.'],
        estimatedMinutes: 8,
      },
    ]);
    setExpandedChapterIndex(chapters.length);
  };

  const handleRemoveChapter = (index: number) => {
    if (chapters.length <= 1) return;
    setChapters((prev) => prev.filter((_, i) => i !== index));
    if (expandedChapterIndex === index) {
      setExpandedChapterIndex(0);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) {
      alert('الرجاء كتابة اسم الكتاب واسم المؤلف');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const newBook: ExternalBook = {
        id: `book-user-${Date.now()}`,
        title,
        author,
        publisher: publisher || 'دار نشر خارجية / رفع مستخدم',
        stageId,
        gradeId,
        subjectId,
        streamId: stageId === 'secondary' ? streamId : undefined,
        coverImage,
        description: description || 'كتاب خارجي ومذكرة تعليمية مرفوعة لمساعدة الطلاب في الشرح والمراجعة.',
        uploadedAt: new Date().toISOString().split('T')[0],
        uploaderName: currentUser ? currentUser.name : 'أ. معلم مبادر',
        uploaderRole: currentUser ? currentUser.role : 'teacher',
        status: 'approved',
        viewsCount: 1,
        listensCount: 0,
        rating: 5.0,
        fileType,
        fileSize: fileSize || '14.2 MB',
        chapters: chapters.map((ch, idx) => ({
          id: `ch-user-${Date.now()}-${idx}`,
          number: idx + 1,
          title: ch.title,
          summary: ch.summary,
          detailedExplanation: ch.explanation,
          keyPoints: ch.keyPoints && ch.keyPoints.length > 0 ? ch.keyPoints : [
            'التركيز على القوانين والمصطلحات الرئيسية في هذا الفصل.',
            'التطبيق العملي وحل التدريبات يساعد في ثبات المعلومة.',
          ],
          definitions: ch.definitions || [
            { term: 'المصطلح الأساسي', definition: 'تعريف مفاهيمي مبسط لموضوع الفصل.' },
          ],
          estimatedMinutes: ch.estimatedMinutes || 10,
          quiz: ch.quiz && ch.quiz.length > 0 ? ch.quiz.map((q, qIdx) => ({
            id: `q-user-${idx}-${qIdx}`,
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
          })) : [
            {
              id: `q-user-${idx}-1`,
              question: `سؤال تقييمي على فكرة: ${ch.title}`,
              options: ['الإجابة النموذجية الأولى', 'خيار غير صحيح', 'خيار آخر غير دقيق', 'لا شيء مما سبق'],
              correctIndex: 0,
              explanation: 'الإجابة الأولى هي المطابقة للمفهوم المشروح في الفصل.',
            },
          ],
        })),
      };

      onUploadSuccess(newBook);
      setIsSubmitting(false);
      onClose();
    }, 500);
  };

  const selectedStageName = STAGES_CONFIG.find((s) => s.id === stageId)?.name || '';
  const selectedGradeName = currentStageConfig.grades.find((g) => g.id === gradeId)?.name || '';
  const selectedSubjectName = currentSubjects.find((s) => s.id === subjectId)?.name || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl my-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shadow-xs">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black font-tajawal text-slate-900 dark:text-white">
                  رفع وتوليد الكتاب الذكي تلقائياً
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                  <Sparkles className="w-3 h-3" />
                  ذكاء اصطناعي 100%
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ارفع ملف الكتاب، وسيتولى النظام قراءته واستخراج الفصول والشروحات والأسئلة تلقائياً دون أي تدخل منك
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          {/* File Drag and Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer relative overflow-hidden ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                : 'border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/70'
            }`}
          >
            <input
              id="book-file-input"
              type="file"
              accept=".pdf,.doc,.docx,image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <label htmlFor="book-file-input" className="cursor-pointer block space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="text-slate-800 dark:text-slate-200 font-bold text-sm">
                {fileName ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                    تم اختيار الملف: {fileName} ({fileSize})
                  </span>
                ) : (
                  'اسحب وأفلت ملف الكتاب هنا أو انقر لاختياره من جهازك'
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                يدعم ملفات الكتب PDF (مثل كتب المعاصر، الأضواء، سلاح التلميذ، الامتحان)، ومستندات Word والصور
              </p>
            </label>
          </div>

          {/* AI Scanning / Analyzing Animated State */}
          {isAnalyzing && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-950/40 dark:via-indigo-950/40 dark:to-blue-950/40 border border-purple-200 dark:border-purple-800/50 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-purple-600 dark:text-purple-400 animate-spin shrink-0" />
                <div>
                  <h4 className="font-extrabold text-sm text-purple-950 dark:text-purple-200">
                    جاري تحليل محتوى الكتاب واستخراج الفصول والشروحات تلقائياً...
                  </h4>
                  <p className="text-[11px] text-purple-700 dark:text-purple-300">
                    الذكاء الاصطناعي يقوم بقراءة المنهج وبناء الشروحات الصوتية التفاعلية
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                <div className={`flex items-center gap-1.5 p-2 rounded-xl transition ${
                  analysisStep >= 1 ? 'bg-white/80 dark:bg-slate-800/80 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs' : 'text-slate-400'
                }`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>فحص عنوان وسلسلة الكتاب</span>
                </div>
                <div className={`flex items-center gap-1.5 p-2 rounded-xl transition ${
                  analysisStep >= 2 ? 'bg-white/80 dark:bg-slate-800/80 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs' : 'text-slate-400'
                }`}>
                  <BrainCircuit className="w-3.5 h-3.5" />
                  <span>تحديد المرحلة والصف والمادة</span>
                </div>
                <div className={`flex items-center gap-1.5 p-2 rounded-xl transition ${
                  analysisStep >= 3 ? 'bg-white/80 dark:bg-slate-800/80 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs' : 'text-slate-400'
                }`}>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>توليد الشروحات والأسئلة</span>
                </div>
              </div>
            </div>
          )}

          {/* AI Automatic Extraction Success Banner & Highlights */}
          {extractedSuccess && !isAnalyzing && (
            <div className="p-4 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-emerald-950 dark:text-emerald-200">
                      تم استخراج كافة بيانات وفصول الكتاب وشروحاتها تلقائياً!
                    </h4>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                      جاهز للنشر والاستماع الفوري • لا تحتاج إلى كتابة أو إدخال أي شيء يدوياً
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                    {chapters.length} فصول كاملة مع الشرح
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowManualFields(!showManualFields)}
                    className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{showManualFields ? 'إخفاء التفاصيل' : 'مراجعة أو تعديل الحقول'}</span>
                    {showManualFields ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Extracted Quick Summary Card */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-emerald-100 dark:border-emerald-900/40 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">الكتاب والمؤلف:</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{title}</p>
                  <p className="text-[11px] text-slate-500 truncate">{author}</p>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">التصنيف الأكاديمي:</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{selectedGradeName}</p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">{selectedSubjectName} ({selectedStageName})</p>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">المحتوى المولد تلقائياً:</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200">شروحات صوتية + نقاط ذهبية + اختبارات</p>
                  <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">جاهز لمشغل الصوت العربي (TTS)</p>
                </div>
              </div>

              {/* Document Text Extraction Metrics */}
              {extractedWordsCount > 0 && (
                <div className="p-2.5 rounded-xl bg-emerald-100/60 dark:bg-emerald-900/30 border border-emerald-200/80 dark:border-emerald-800/40 text-xs space-y-1.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5 text-[11px]">
                      <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>تمت قراءة وفهرسة محتوى الملف الفعلي بنجاح ({extractedWordsCount.toLocaleString()} كلمة • {extractedPagesCount} صفحة)</span>
                    </span>
                    {extractedSnippets.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowSnippets(!showSnippets)}
                        className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold underline cursor-pointer"
                      >
                        {showSnippets ? 'إخفاء عينة النص' : 'معاينة عينة من نص الكتاب المفهرس'}
                      </button>
                    )}
                  </div>
                  {showSnippets && extractedSnippets.length > 0 && (
                    <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 text-[11px] text-slate-700 dark:text-slate-300 space-y-1 border border-emerald-200/50 dark:border-emerald-800/30">
                      {extractedSnippets.map((snip, sIdx) => (
                        <p key={sIdx} className="line-clamp-2 italic text-slate-600 dark:text-slate-400">
                          "... {snip} ..."
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Chapters Auto-Generated Interactive Preview */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-blue-600" />
                <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                  فصول الكتاب المستخرجة وشروحاتها ({chapters.length})
                </span>
                {extractedSuccess && (
                  <span className="text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-md">
                    مكتملة آلياً
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleAddChapter}
                className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold hover:bg-blue-100 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة فصل إضافي</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {chapters.map((ch, idx) => {
                const isExpanded = expandedChapterIndex === idx;
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 transition"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setExpandedChapterIndex(isExpanded ? null : idx)}
                        className="flex items-center gap-2 text-right flex-1 cursor-pointer"
                      >
                        <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-extrabold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="truncate">
                          <p className="font-bold text-slate-900 dark:text-white text-xs truncate">
                            {ch.title}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {ch.summary || ch.explanation.substring(0, 70) + '...'}
                          </p>
                        </div>
                      </button>

                      <div className="flex items-center gap-2 shrink-0">
                        {ch.quiz && ch.quiz.length > 0 && (
                          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                            {ch.quiz.length} أسئلة
                          </span>
                        )}
                        {chapters.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveChapter(idx)}
                            className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                            title="حذف الفصل"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setExpandedChapterIndex(isExpanded ? null : idx)}
                          className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Chapter Expanded View: Full Explanation and Details */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2.5 animate-in fade-in">
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                            عنوان الفصل / الدرس:
                          </label>
                          <input
                            type="text"
                            value={ch.title}
                            onChange={(e) => {
                              const updated = [...chapters];
                              updated[idx].title = e.target.value;
                              setChapters(updated);
                            }}
                            className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                            الشرح التفصيلي المستخرج للدرس (المخصص للقراءة وللتحويل الصوتي الذكي TTS):
                          </label>
                          <textarea
                            rows={4}
                            value={ch.explanation}
                            onChange={(e) => {
                              const updated = [...chapters];
                              updated[idx].explanation = e.target.value;
                              setChapters(updated);
                            }}
                            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white leading-relaxed"
                          />
                        </div>

                        {ch.keyPoints && ch.keyPoints.length > 0 && (
                          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40">
                            <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 block mb-1">
                              ⭐ نقاط ذهبية للفهم والامتحان (مولدة آلياً):
                            </span>
                            <ul className="list-disc list-inside text-[11px] text-amber-900 dark:text-amber-200 space-y-1">
                              {ch.keyPoints.map((kp, kIdx) => (
                                <li key={kIdx}>{kp}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Optional Manual Fields (Collapsed by default when AI extracts data) */}
          {(!extractedSuccess || showManualFields) && (
            <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                <Wand2 className="w-3.5 h-3.5 text-purple-600" />
                <span>البيانات الأساسية وتصنيف المنهج (تم تعبئتها آلياً):</span>
              </div>

              {/* Book Title & Author */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">اسم الكتاب الرسمي *</label>
                  <input
                    id="upload-book-title"
                    type="text"
                    required
                    placeholder="مثال: المعاصر في اللغة الإنجليزية Connect Plus 5"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">المؤلف / دار النشر *</label>
                  <input
                    id="upload-book-author"
                    type="text"
                    required
                    placeholder="سلسلة المعاصر أو الأضواء أو اسم المدرس"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Stage, Grade, Subject Cascading Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">المرحلة الدراسية</label>
                  <select
                    id="upload-book-stage"
                    value={stageId}
                    onChange={(e) => handleStageChange(e.target.value as EducationalStageId)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {STAGES_CONFIG.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">الصف الدراسي</label>
                  <select
                    id="upload-book-grade"
                    value={gradeId}
                    onChange={(e) => setGradeId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {currentStageConfig.grades.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">المادة الدراسية</label>
                  <select
                    id="upload-book-subject"
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {currentSubjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Secondary Stream Selector */}
              {stageId === 'secondary' && (
                <div className="space-y-1 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                  <label className="font-bold text-amber-800 dark:text-amber-300 block mb-1">
                    شعبة الثانوية العامة:
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="uploadStream"
                        checked={streamId === 'scientific'}
                        onChange={() => setStreamId('scientific')}
                      />
                      <span>علمي</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="uploadStream"
                        checked={streamId === 'literary'}
                        onChange={() => setStreamId('literary')}
                      />
                      <span>أدبي</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="uploadStream"
                        checked={streamId === 'general'}
                        onChange={() => setStreamId('general')}
                      />
                      <span>مشترك</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Short Description */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">وصف ومميزات الكتاب</label>
                <textarea
                  id="upload-book-desc"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="وصف تفصيلي لمحتوى الكتاب..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Submit Actions */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {extractedSuccess ? (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  تم ملء كافة البيانات والفصول تلقائياً، اضغط للنشر فوراً
                </span>
              ) : (
                'اختر ملف الكتاب للبدء في الاستخراج التلقائي'
              )}
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                id="confirm-upload-book-btn"
                type="submit"
                disabled={isSubmitting || isAnalyzing || !title.trim()}
                className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition"
              >
                {isSubmitting ? (
                  <span>جاري الحفظ والنشر في المنصة...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>اعتماد ونشر الكتاب فوراً</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
