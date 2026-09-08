import React, { useState } from 'react';
import {
  X,
  User,
  BookOpen,
  Headphones,
  Award,
  Bookmark,
  CheckCircle2,
  Trash2,
  Play,
  ArrowLeft,
  GraduationCap,
} from 'lucide-react';
import { UserProfile, ExternalBook } from '../types';
import { STAGES_CONFIG } from '../data/curriculumData';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  allBooks: ExternalBook[];
  onOpenBook: (bookId: string, chapterId?: string) => void;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allBooks,
  onOpenBook,
  onUpdateUser,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'favorites' | 'history' | 'quizzes'>('favorites');

  const favoriteBooks = allBooks.filter((b) => currentUser.favorites.includes(b.id));

  // User stage & grade names
  const stageName = STAGES_CONFIG.find((s) => s.id === currentUser.stageId)?.name || 'غير محدد';
  const gradeName =
    STAGES_CONFIG.flatMap((s) => s.grades).find((g) => g.id === currentUser.gradeId)?.name ||
    'غير محدد';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl my-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-xl font-black font-tajawal text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <span>الملف الشخصي للطالب / المعلم</span>
          </h2>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card info */}
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-blue-50/60 dark:bg-slate-800/60 border border-blue-100 dark:border-slate-800">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-white dark:border-slate-700"
          />

          <div className="space-y-1 text-center sm:text-right flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{currentUser.name}</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-600 text-white">
                {currentUser.role === 'teacher'
                  ? 'معلم معتمد'
                  : currentUser.role === 'admin'
                  ? 'مشرف النظام'
                  : 'طالب متميز'}
              </span>
            </div>

            <p className="text-xs text-slate-500">{currentUser.email}</p>

            <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold flex items-center justify-center sm:justify-start gap-2">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span>
                {stageName} • {gradeName}
              </span>
            </div>
          </div>

          {/* Role switcher for demo testing */}
          <div className="text-left">
            <button
              onClick={() =>
                onUpdateUser({
                  role: currentUser.role === 'student' ? 'teacher' : 'student',
                })
              }
              className="text-[11px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
            >
              تبديل الدور إلى: {currentUser.role === 'student' ? 'معلم' : 'طالب'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'favorites'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>الكتب المفضلة ({favoriteBooks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>سجل الاستماع ({currentUser.listeningHistory.length})</span>
          </button>
        </div>

        {/* Tab 1: Favorites */}
        {activeTab === 'favorites' && (
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {favoriteBooks.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                لم تقم بإضافة أي كتب إلى المفضلة بعد. انقر على أيقونة الإشارة المرجعية داخل أي كتاب لإضافته هنا.
              </div>
            ) : (
              favoriteBooks.map((b) => (
                <div
                  key={b.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <img src={b.coverImage} alt="" className="w-10 h-12 object-cover rounded-lg" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{b.title}</h4>
                      <p className="text-[11px] text-slate-500">{b.author}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onOpenBook(b.id);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
                  >
                    فتح الكتاب
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Listening History */}
        {activeTab === 'history' && (
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {currentUser.listeningHistory.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                لا يوجد سجل استماع حتى الآن. اضغط على "استمع للشرح" في أي فصل لحفظ تقدمك هنا.
              </div>
            ) : (
              currentUser.listeningHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.chapterTitle}
                      </h4>
                      <p className="text-[11px] text-slate-500">{item.bookTitle}</p>
                    </div>

                    <button
                      onClick={() => {
                        onOpenBook(item.bookId, item.chapterId);
                        onClose();
                      }}
                      className="p-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition cursor-pointer"
                      title="متابعة الاستماع"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>نسبة الإنجاز</span>
                      <span className="font-bold text-blue-600">{item.progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${item.progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
