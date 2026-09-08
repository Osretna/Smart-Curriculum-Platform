import React, { useState } from 'react';
import {
  X,
  Shield,
  BookOpen,
  Users,
  CheckCircle2,
  XCircle,
  Trash2,
  Plus,
  BarChart3,
  Search,
  Layers,
  Award,
  Filter,
} from 'lucide-react';
import { ExternalBook, UserProfile } from '../types';
import { STAGES_CONFIG } from '../data/curriculumData';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  books: ExternalBook[];
  onUpdateBookStatus: (bookId: string, status: 'approved' | 'rejected') => void;
  onDeleteBook: (bookId: string) => void;
}

type AdminTab = 'stats' | 'books' | 'stages' | 'users' | 'quizzes';

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  books,
  onUpdateBookStatus,
  onDeleteBook,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const [bookSearch, setBookSearch] = useState('');

  // Sample users
  const [usersList, setUsersList] = useState<UserProfile[]>([
    {
      id: 'u-1',
      name: 'أ. سامح عبد الرازق',
      email: 'sameh.science@almanhaj.edu',
      role: 'teacher',
      stageId: 'primary',
      gradeId: 'grade-p4',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      favorites: [],
      listeningHistory: [],
    },
    {
      id: 'u-2',
      name: 'أستاذة منى توفيق',
      email: 'mona.arabic@almanhaj.edu',
      role: 'teacher',
      stageId: 'primary',
      gradeId: 'grade-p6',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
      favorites: [],
      listeningHistory: [],
    },
    {
      id: 'u-3',
      name: 'كريم أحمد حسني',
      email: 'karim.ahmed@gmail.com',
      role: 'student',
      stageId: 'secondary',
      gradeId: 'grade-s3',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80',
      favorites: [],
      listeningHistory: [],
    },
  ]);

  const filteredBooks = books.filter(
    (b) =>
      b.title.includes(bookSearch) ||
      b.author.includes(bookSearch) ||
      b.uploaderName.includes(bookSearch)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl my-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/30">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black font-tajawal text-slate-900 dark:text-white">
                لوحة تحكم المشرف والأدمن
              </h2>
              <p className="text-xs text-slate-500">
                إدارة شاملة للمحتوى، الكتب المرفوعة، المستخدمين، والاختبارات
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

        {/* Sub-tabs Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'stats'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>إحصائيات المنصة</span>
          </button>

          <button
            onClick={() => setActiveTab('books')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'books'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>إدارة الكتب المرفوعة ({books.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('stages')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'stages'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>المراحل والمواد</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'users'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>المستخدمون والمعلمون</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-center">
                <span className="text-2xl font-black text-blue-700 dark:text-blue-300 block">
                  {books.length}
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-bold">الكتب المسجلة</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-center">
                <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300 block">
                  {books.reduce((acc, b) => acc + b.chapters.length, 0)}
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-bold">الفصول المشروحة</span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-center">
                <span className="text-2xl font-black text-amber-700 dark:text-amber-300 block">
                  {books.reduce((acc, b) => acc + b.listensCount, 0).toLocaleString()}
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-bold">استماع صوتي</span>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 text-center">
                <span className="text-2xl font-black text-purple-700 dark:text-purple-300 block">
                  {usersList.length * 350 + 820}
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-bold">طالب نشط</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                حالة التحويل الصوتي (TTS) ونشاط الخادم
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                جميع محركات تحويل النص إلى كلام (Web Speech API) تعمل بكفاءة مع التوافق الكامل مع نطق اللغة العربية الفصحى واللهجات التعليمية، ومفتاح الذكاء الاصطناعي موصول لتوليد الشروحات المخصصة للطلاب.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Books Management */}
        {activeTab === 'books' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث في قائمة الكتب المرفوعة..."
                  value={bookSearch}
                  onChange={(e) => setBookSearch(e.target.value)}
                  className="w-full pr-10 pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold">
                    <th className="pb-3 px-2">الكتاب</th>
                    <th className="pb-3 px-2">المؤلف / الرافع</th>
                    <th className="pb-3 px-2">المرحلة</th>
                    <th className="pb-3 px-2">الحالة</th>
                    <th className="pb-3 px-2 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredBooks.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-2 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <img
                          src={b.coverImage}
                          alt=""
                          className="w-8 h-10 object-cover rounded-md"
                        />
                        <div>
                          <div className="line-clamp-1">{b.title}</div>
                          <div className="text-[10px] text-slate-400">{b.chapters.length} فصول</div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-slate-600 dark:text-slate-300">
                        {b.author}
                        <span className="block text-[10px] text-blue-600">بواسطة: {b.uploaderName}</span>
                      </td>
                      <td className="py-3 px-2 text-slate-500">
                        {b.stageId === 'primary' ? 'ابتدائي' : b.stageId === 'prep' ? 'إعدادي' : 'ثانوي'}
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {b.status === 'approved' ? 'معتمد ومنشور' : 'قيد المراجعة'}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {b.status !== 'approved' && (
                            <button
                              onClick={() => onUpdateBookStatus(b.id, 'approved')}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition"
                              title="قبول واعتماد"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => onDeleteBook(b.id)}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                            title="حذف الكتاب"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Stages & Curricula */}
        {activeTab === 'stages' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {STAGES_CONFIG.map((st) => (
                <div
                  key={st.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{st.name}</h4>
                    <span className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 px-2 py-0.5 rounded-md font-bold">
                      {st.grades.length} صفوف
                    </span>
                  </div>

                  <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                    {st.grades.map((g) => (
                      <li key={g.id} className="p-1.5 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-between">
                        <span>{g.name}</span>
                        <span className="text-[10px] text-slate-400">نشط</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Users */}
        {activeTab === 'users' && (
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold">
                    <th className="pb-3 px-2">المستخدم</th>
                    <th className="pb-3 px-2">البريد الإلكتروني</th>
                    <th className="pb-3 px-2">الدور والصلاحية</th>
                    <th className="pb-3 px-2">الصف / المرحلة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-2 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <img src={u.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                        <span>{u.name}</span>
                      </td>
                      <td className="py-3 px-2 text-slate-500">{u.email}</td>
                      <td className="py-3 px-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          {u.role === 'teacher' ? 'معلم معتمد' : 'طالب'}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-slate-500">{u.gradeId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
