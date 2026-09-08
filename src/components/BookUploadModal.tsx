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
} from 'lucide-react';
import { STAGES_CONFIG, PRIMARY_SUBJECTS, PREP_SUBJECTS, SECONDARY_STREAM_SUBJECTS } from '../data/curriculumData';
import { EducationalStageId, ExternalBook, SecondaryStreamId, UserProfile } from '../types';

interface BookUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (newBook: ExternalBook) => void;
  currentUser: UserProfile | null;
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
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [fileType, setFileType] = useState<'pdf' | 'doc' | 'image'>('pdf');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Chapters creator
  const [chapters, setChapters] = useState([
    {
      title: 'الدرس الأول: مدخل تمهيدي ومفاهيم أساسية',
      summary: 'مقدمة شاملة حول أهم المفاهيم والقوانين المقررة في هذا الفصل.',
      explanation: 'شرح مفصل وميسر للفصل الأول يعتمد على الأمثلة التوضيحية البسيطة والربط بالواقع لمساعدة الطالب على الحفظ والفهم السريع.',
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

  const currentStageConfig = STAGES_CONFIG.find((s) => s.id === stageId)!;

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
      processFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setFileName(file.name);
    setFileSize((file.size / (1024 * 1024)).toFixed(1) + ' MB');
    if (file.name.endsWith('.pdf')) setFileType('pdf');
    else if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) setFileType('doc');
    else setFileType('image');

    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleAddChapter = () => {
    setChapters((prev) => [
      ...prev,
      {
        title: `الدرس ${prev.length + 1}: موضوع تعليمي جديد`,
        summary: 'ملخص موجز لنقاط الدرس.',
        explanation: 'شرح مستوفٍ للمفاهيم والقوانين المقررة في هذا الدرس.',
      },
    ]);
  };

  const handleRemoveChapter = (index: number) => {
    if (chapters.length <= 1) return;
    setChapters((prev) => prev.filter((_, i) => i !== index));
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
        coverImage:
          fileType === 'pdf'
            ? 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'
            : 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
        description: description || 'كتاب خارجي ومذكرة تعليمية مرفوعة لمساعدة الطلاب في الشرح والمراجعة.',
        uploadedAt: new Date().toISOString().split('T')[0],
        uploaderName: currentUser ? currentUser.name : 'أ. معلم مبادر',
        uploaderRole: currentUser ? currentUser.role : 'teacher',
        status: 'approved',
        viewsCount: 1,
        listensCount: 0,
        rating: 5.0,
        fileType,
        fileSize: fileSize || '12.4 MB',
        chapters: chapters.map((ch, idx) => ({
          id: `ch-user-${Date.now()}-${idx}`,
          number: idx + 1,
          title: ch.title,
          summary: ch.summary,
          detailedExplanation: ch.explanation,
          keyPoints: [
            'التركيز على القوانين والمصطلحات الرئيسية في هذا الفصل.',
            'التطبيق العملي وحل التدريبات يساعد في ثبات المعلومة.',
          ],
          definitions: [
            { term: 'المصطلح الأساسي', definition: 'تعريف مفاهيمي مبسط لموضوع الفصل.' },
          ],
          estimatedMinutes: 5,
          quiz: [
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
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl my-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black font-tajawal text-slate-900 dark:text-white">
                رفع كتاب خارجي جديد
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                صيغ مقبولة: PDF • Word • صور، مع تقسيم وشرح الفصول
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
          {/* File Drag and Drop */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
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
              <UploadCloud className="w-8 h-8 text-emerald-600 mx-auto" />
              <div className="text-slate-700 dark:text-slate-300 font-bold">
                {fileName ? (
                  <span className="text-emerald-600">تم اختيار الملف: {fileName} ({fileSize})</span>
                ) : (
                  'اسحب وأفلت ملف الكتاب هنا أو انقر للتصفح'
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                يدعم ملفات PDF، ومستندات Word، والصور بجودة عالية
              </p>
            </label>
          </div>

          {/* Book Details Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">اسم الكتاب *</label>
              <input
                id="upload-book-title"
                type="text"
                required
                placeholder="مثال: المعاصر في الرياضيات أو الأضواء"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">المؤلف / المدرس *</label>
              <input
                id="upload-book-author"
                type="text"
                required
                placeholder="اسم الكاتب أو المدرس"
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

          {/* Secondary Stream */}
          {stageId === 'secondary' && (
            <div className="space-y-1 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
              <label className="font-bold text-amber-800 dark:text-amber-300 block mb-1">
                تحديد القسم للثانوية العامة:
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
            <label className="font-bold text-slate-700 dark:text-slate-300">وصف مختصر للكتاب</label>
            <textarea
              id="upload-book-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اكتب نبذة عن محتوى الكتاب، الفصول المميزة، ونماذج التمارين..."
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Chapters builder */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                فصول الكتاب وشروحاتها ({chapters.length})
              </span>
              <button
                type="button"
                onClick={handleAddChapter}
                className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold hover:bg-blue-100 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة فصل آخر</span>
              </button>
            </div>

            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {chapters.map((ch, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-600">الفصل {idx + 1}</span>
                    {chapters.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveChapter(idx)}
                        className="text-slate-400 hover:text-rose-500 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={ch.title}
                    onChange={(e) => {
                      const updated = [...chapters];
                      updated[idx].title = e.target.value;
                      setChapters(updated);
                    }}
                    placeholder="عنوان الفصل"
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                  <textarea
                    rows={2}
                    value={ch.explanation}
                    onChange={(e) => {
                      const updated = [...chapters];
                      updated[idx].explanation = e.target.value;
                      setChapters(updated);
                    }}
                    placeholder="الشرح النصي للفصل (الذي سيتحول لصوت)"
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
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
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>جاري الحفظ والنشر...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>نشر وتخزين الكتاب الآن</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
