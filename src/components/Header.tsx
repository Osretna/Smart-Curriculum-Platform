import React, { useState } from 'react';
import {
  GraduationCap,
  ChevronDown,
  Sun,
  Moon,
  Search,
  User,
  ShieldAlert,
  Menu,
  X,
  BookOpen,
  Info,
  Phone,
  Sparkles,
} from 'lucide-react';
import { STAGES_CONFIG } from '../data/curriculumData';
import { EducationalStageId, UserProfile } from '../types';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onNavigateHome: () => void;
  onSelectGrade: (stageId: EducationalStageId, gradeId: string, streamId?: 'scientific' | 'literary' | 'general') => void;
  onOpenSearch: () => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenAdmin: () => void;
  onOpenAbout: () => void;
  onOpenContact: () => void;
  currentUser: UserProfile | null;
  activeStageId?: EducationalStageId;
  activeGradeId?: string;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleDarkMode,
  onNavigateHome,
  onSelectGrade,
  onOpenSearch,
  onOpenAuth,
  onOpenProfile,
  onOpenAdmin,
  onOpenAbout,
  onOpenContact,
  currentUser,
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const primaryStage = STAGES_CONFIG.find((s) => s.id === 'primary')!;
  const prepStage = STAGES_CONFIG.find((s) => s.id === 'prep')!;
  const secondaryStage = STAGES_CONFIG.find((s) => s.id === 'secondary')!;

  const handleGradeClick = (
    stageId: EducationalStageId,
    gradeId: string,
    streamId?: 'scientific' | 'literary' | 'general'
  ) => {
    onSelectGrade(stageId, gradeId, streamId);
    setOpenDropdown(null);
    setMobileMenuOpen(false);
  };

  return (
    <header
      id="main-app-header"
      className="sticky top-0 z-50 backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 transition-colors shadow-xs"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              id="brand-logo-btn"
              onClick={onNavigateHome}
              className="flex items-center gap-3 text-right group cursor-pointer focus:outline-hidden"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white font-tajawal">
                    منصة المنهج الذكي
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    <Sparkles className="w-3 h-3 ml-0.5" />
                    الذكية
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  شروحات نصية وصوتية • كتب خارجية • اختبارات
                </p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-1" aria-label="التنقل الرئيسي">
            {/* Home */}
            <button
              id="nav-home-btn"
              onClick={onNavigateHome}
              className="px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              الرئيسية
            </button>

            {/* Primary Stage Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setOpenDropdown('primary')}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button
                id="nav-primary-btn"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                المرحلة الابتدائية
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openDropdown === 'primary' ? 'rotate-180' : ''}`} />
              </button>

              {openDropdown === 'primary' && (
                <div className="absolute top-full right-0 mt-1 w-64 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 p-2 py-3 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 mb-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">صفوف المرحلة الابتدائية (١ - ٦)</span>
                  </div>
                  {primaryStage.grades.map((grade) => (
                    <button
                      key={grade.id}
                      id={`menu-${grade.id}`}
                      onClick={() => handleGradeClick('primary', grade.id)}
                      className="w-full text-right px-3 py-2 text-sm rounded-xl text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center justify-between cursor-pointer"
                    >
                      <span>{grade.name}</span>
                      <BookOpen className="w-3.5 h-3.5 opacity-40" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Preparatory Stage Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setOpenDropdown('prep')}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button
                id="nav-prep-btn"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                المرحلة الإعدادية
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openDropdown === 'prep' ? 'rotate-180' : ''}`} />
              </button>

              {openDropdown === 'prep' && (
                <div className="absolute top-full right-0 mt-1 w-72 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 p-2 py-3 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 mb-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">صفوف المرحلة الإعدادية</span>
                  </div>
                  {prepStage.grades.map((grade) => (
                    <button
                      key={grade.id}
                      id={`menu-${grade.id}`}
                      onClick={() => handleGradeClick('prep', grade.id)}
                      className="w-full text-right px-3 py-2.5 text-sm rounded-xl text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:text-emerald-600 dark:hover:text-emerald-400 transition flex items-center justify-between cursor-pointer"
                    >
                      <span>{grade.name}</span>
                      <BookOpen className="w-3.5 h-3.5 opacity-40" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Secondary Stage Dropdown with Branch quick selection */}
            <div
              className="relative"
              onMouseEnter={() => setOpenDropdown('secondary')}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button
                id="nav-secondary-btn"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                المرحلة الثانوية
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openDropdown === 'secondary' ? 'rotate-180' : ''}`} />
              </button>

              {openDropdown === 'secondary' && (
                <div className="absolute top-full right-0 mt-1 w-80 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 mb-2 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">صفوف المرحلة الثانوية العامة</span>
                    <span className="text-[11px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md font-semibold">
                      شعبة علمي وأدبي
                    </span>
                  </div>

                  <div className="space-y-1">
                    {secondaryStage.grades.map((grade) => (
                      <div key={grade.id} className="p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 px-2">
                          {grade.name}
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <button
                            id={`btn-${grade.id}-scientific`}
                            onClick={() => handleGradeClick('secondary', grade.id, 'scientific')}
                            className="text-right px-2 py-1 text-xs rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 font-medium transition cursor-pointer"
                          >
                            🔬 علمي
                          </button>
                          <button
                            id={`btn-${grade.id}-literary`}
                            onClick={() => handleGradeClick('secondary', grade.id, 'literary')}
                            className="text-right px-2 py-1 text-xs rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900 font-medium transition cursor-pointer"
                          >
                            📚 أدبي
                          </button>
                          <button
                            id={`btn-${grade.id}-general`}
                            onClick={() => handleGradeClick('secondary', grade.id, 'general')}
                            className="text-right px-2 py-1 text-xs rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 font-medium transition cursor-pointer"
                          >
                            ⭐ مشترك
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* About Us */}
            <button
              id="nav-about-btn"
              onClick={onOpenAbout}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <Info className="w-4 h-4 text-slate-400" />
              من نحن
            </button>

            {/* Contact Us */}
            <button
              id="nav-contact-btn"
              onClick={onOpenContact}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <Phone className="w-4 h-4 text-slate-400" />
              تواصل معنا
            </button>
          </nav>

          {/* Left Action Controls */}
          <div className="flex items-center gap-2">
            {/* Search Trigger */}
            <button
              id="search-header-btn"
              onClick={onOpenSearch}
              className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 transition cursor-pointer"
              title="ابحث عن كتاب أو فصل"
              aria-label="بحث"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              id="dark-mode-toggle-btn"
              onClick={onToggleDarkMode}
              className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title={darkMode ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
              aria-label="تغيير المظهر"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
            </button>

            {/* Admin Switcher */}
            <button
              id="admin-dashboard-btn"
              onClick={onOpenAdmin}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-950 hover:text-purple-700 dark:hover:text-purple-300 transition cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>لوحة الأدمن</span>
            </button>

            {/* User Account / Profile */}
            {currentUser ? (
              <button
                id="user-profile-header-btn"
                onClick={onOpenProfile}
                className="flex items-center gap-2 pr-1.5 pl-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80 border border-blue-200/50 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-blue-400 transition cursor-pointer"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-lg object-cover ring-2 ring-blue-500/30"
                />
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold leading-tight line-clamp-1">{currentUser.name}</p>
                  <p className="text-[10px] text-blue-600 dark:text-blue-400">
                    {currentUser.role === 'teacher' ? 'معلم' : currentUser.role === 'admin' ? 'مشرف' : 'طالب'}
                  </p>
                </div>
              </button>
            ) : (
              <button
                id="header-login-btn"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>دخول / تسجيل</span>
              </button>
            )}

            {/* Mobile Menu Trigger */}
            <button
              id="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="القائمة"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 pt-2 pb-6 space-y-3">
          <div className="space-y-1">
            <button
              onClick={() => {
                onNavigateHome();
                setMobileMenuOpen(false);
              }}
              className="w-full text-right px-3 py-2 text-sm font-bold text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              الرئيسية
            </button>

            {/* Mobile Primary */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 px-3">المرحلة الابتدائية</span>
              <div className="grid grid-cols-2 gap-1 mt-1">
                {primaryStage.grades.map((grade) => (
                  <button
                    key={grade.id}
                    onClick={() => handleGradeClick('primary', grade.id)}
                    className="text-right px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 rounded hover:bg-blue-50 dark:hover:bg-blue-950"
                  >
                    {grade.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Prep */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 px-3">المرحلة الإعدادية</span>
              <div className="grid grid-cols-1 gap-1 mt-1">
                {prepStage.grades.map((grade) => (
                  <button
                    key={grade.id}
                    onClick={() => handleGradeClick('prep', grade.id)}
                    className="text-right px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950"
                  >
                    {grade.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Secondary */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 px-3">المرحلة الثانوية</span>
              <div className="space-y-1.5 mt-1">
                {secondaryStage.grades.map((grade) => (
                  <div key={grade.id} className="p-1.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200 block mb-1">{grade.name}</span>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={() => handleGradeClick('secondary', grade.id, 'scientific')}
                        className="px-2 py-1 text-[11px] rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                      >
                        علمي
                      </button>
                      <button
                        onClick={() => handleGradeClick('secondary', grade.id, 'literary')}
                        className="px-2 py-1 text-[11px] rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                      >
                        أدبي
                      </button>
                      <button
                        onClick={() => handleGradeClick('secondary', grade.id, 'general')}
                        className="px-2 py-1 text-[11px] rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                      >
                        مشترك
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-around">
              <button
                onClick={() => {
                  onOpenAbout();
                  setMobileMenuOpen(false);
                }}
                className="text-xs font-semibold text-slate-600 dark:text-slate-400 py-1"
              >
                من نحن
              </button>
              <button
                onClick={() => {
                  onOpenContact();
                  setMobileMenuOpen(false);
                }}
                className="text-xs font-semibold text-slate-600 dark:text-slate-400 py-1"
              >
                تواصل معنا
              </button>
              <button
                onClick={() => {
                  onOpenAdmin();
                  setMobileMenuOpen(false);
                }}
                className="text-xs font-bold text-purple-600 dark:text-purple-400 py-1"
              >
                لوحة الأدمن
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
