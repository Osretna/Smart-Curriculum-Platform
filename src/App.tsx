import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { StageGradeView } from './components/StageGradeView';
import { BookReaderView } from './components/BookReaderView';
import { BookUploadModal } from './components/BookUploadModal';
import { AdminPanel } from './components/AdminPanel';
import { UserProfileModal } from './components/UserProfileModal';
import { AudioPlayerFloating } from './components/AudioPlayerFloating';
import { INITIAL_BOOKS, DEFAULT_USER, STAGES_CONFIG } from './data/curriculumData';
import { EducationalStageId, ExternalBook, UserProfile } from './types';
import { BookOpen, Sparkles, Heart } from 'lucide-react';

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('almanhaj_theme');
    return saved ? saved === 'dark' : false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('almanhaj_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('almanhaj_theme', 'light');
    }
  }, [darkMode]);

  // Books state with local persistence
  const [books, setBooks] = useState<ExternalBook[]>(() => {
    const saved = localStorage.getItem('almanhaj_books');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved books', e);
      }
    }
    return INITIAL_BOOKS;
  });

  useEffect(() => {
    localStorage.setItem('almanhaj_books', JSON.stringify(books));
  }, [books]);

  // Current User profile state
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('almanhaj_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved user', e);
      }
    }
    return DEFAULT_USER;
  });

  useEffect(() => {
    localStorage.setItem('almanhaj_user', JSON.stringify(currentUser));
  }, [currentUser]);

  // Navigation State
  const [activePage, setActivePage] = useState<'home' | 'stage' | 'book'>('home');
  const [selectedStageId, setSelectedStageId] = useState<EducationalStageId>('primary');
  const [selectedGradeId, setSelectedGradeId] = useState<string>('grade-p4');
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | undefined>(undefined);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Floating widgets
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [floatingAudio, setFloatingAudio] = useState<{
    book: ExternalBook;
    chapterIndex: number;
  } | null>(null);

  // Handlers for Navigation
  const handleNavigateHome = () => {
    setActivePage('home');
    setSelectedBookId(null);
    setSelectedChapterId(undefined);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectStage = (stageId: EducationalStageId) => {
    setSelectedStageId(stageId);
    const stage = STAGES_CONFIG.find((s) => s.id === stageId);
    if (stage && stage.grades.length > 0) {
      setSelectedGradeId(stage.grades[0].id);
    }
    setActivePage('stage');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectGrade = (stageId: EducationalStageId, gradeId: string) => {
    setSelectedStageId(stageId);
    setSelectedGradeId(gradeId);
    setActivePage('stage');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenBook = (bookId: string, chapterId?: string) => {
    setSelectedBookId(bookId);
    setSelectedChapterId(chapterId);
    setActivePage('book');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickPlayAudio = (book: ExternalBook, chapterIndex: number = 0) => {
    setFloatingAudio({ book, chapterIndex });
  };

  // Upload book handler
  const handleUploadSuccess = (newBook: ExternalBook) => {
    setBooks((prev) => [newBook, ...prev]);
    // Also navigate to this book
    setSelectedBookId(newBook.id);
    setSelectedChapterId(newBook.chapters[0]?.id);
    setActivePage('book');
  };

  // Book status update (Admin)
  const handleUpdateBookStatus = (bookId: string, status: 'approved' | 'rejected') => {
    setBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, status } : b))
    );
  };

  // Delete book (Admin)
  const handleDeleteBook = (bookId: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
    if (selectedBookId === bookId) {
      setActivePage('home');
    }
  };

  // Favorites toggle
  const handleToggleFavorite = (bookId: string) => {
    setCurrentUser((prev) => {
      const exists = prev.favorites.includes(bookId);
      return {
        ...prev,
        favorites: exists
          ? prev.favorites.filter((id) => id !== bookId)
          : [...prev.favorites, bookId],
      };
    });
  };

  // Record listening progress
  const handleRecordProgress = (bookId: string, chapterId: string, progress: number) => {
    const book = books.find((b) => b.id === bookId);
    const chapter = book?.chapters.find((c) => c.id === chapterId);
    if (!book || !chapter) return;

    setCurrentUser((prev) => {
      const existingHistory = [...prev.listeningHistory];
      const foundIdx = existingHistory.findIndex(
        (h) => h.bookId === bookId && h.chapterId === chapterId
      );

      const newItem = {
        bookId,
        bookTitle: book.title,
        chapterId,
        chapterTitle: chapter.title,
        progressPercentage: progress,
        listenedAt: new Date().toISOString(),
      };

      if (foundIdx >= 0) {
        existingHistory[foundIdx] = newItem;
      } else {
        existingHistory.unshift(newItem);
      }

      return {
        ...prev,
        listeningHistory: existingHistory.slice(0, 15), // keep last 15
      };
    });
  };

  // Find currently selected book object
  const currentBook = books.find((b) => b.id === selectedBookId) || books[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-cairo antialiased transition-colors duration-200 selection:bg-blue-500 selection:text-white">
      {/* Top Main Navigation Header */}
      <Header
        activeStageId={activePage === 'stage' ? selectedStageId : null}
        onSelectStage={handleSelectStage}
        onSelectGrade={handleSelectGrade}
        onNavigateHome={handleNavigateHome}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode(!darkMode)}
        userRole={currentUser.role}
      />

      {/* Main App Body */}
      <main className="flex-1">
        {activePage === 'home' && (
          <HomePage
            books={books.filter((b) => b.status === 'approved')}
            onSelectStage={handleSelectStage}
            onSelectGrade={handleSelectGrade}
            onOpenBook={handleOpenBook}
            onOpenUpload={() => setIsUploadModalOpen(true)}
            onQuickPlayAudio={handleQuickPlayAudio}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}

        {activePage === 'stage' && (
          <StageGradeView
            stageId={selectedStageId}
            gradeId={selectedGradeId}
            books={books.filter((b) => b.status === 'approved')}
            onSelectGrade={(gradeId) => setSelectedGradeId(gradeId)}
            onOpenBook={handleOpenBook}
            onOpenUpload={() => setIsUploadModalOpen(true)}
            onQuickPlayAudio={handleQuickPlayAudio}
          />
        )}

        {activePage === 'book' && currentBook && (
          <BookReaderView
            book={currentBook}
            initialChapterId={selectedChapterId}
            onBack={() => {
              if (selectedStageId) {
                setActivePage('stage');
              } else {
                setActivePage('home');
              }
            }}
            currentUser={currentUser}
            onUpdateUserFavorites={handleToggleFavorite}
            onRecordProgress={handleRecordProgress}
          />
        )}
      </main>

      {/* Floating Audio Player */}
      {floatingAudio && (
        <AudioPlayerFloating
          book={floatingAudio.book}
          chapterIndex={floatingAudio.chapterIndex}
          onClose={() => setFloatingAudio(null)}
          onOpenBook={(bookId, chapterId) => {
            handleOpenBook(bookId, chapterId);
            setFloatingAudio(null);
          }}
        />
      )}

      {/* Modals */}
      <BookUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
        currentUser={currentUser}
      />

      <AdminPanel
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        books={books}
        onUpdateBookStatus={handleUpdateBookStatus}
        onDeleteBook={handleDeleteBook}
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        allBooks={books}
        onOpenBook={handleOpenBook}
        onUpdateUser={(updated) => setCurrentUser((prev) => ({ ...prev, ...updated }))}
      />

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-10 mt-16 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black font-tajawal text-slate-900 dark:text-white">
                  منصة المنهج الذكي
                </h4>
                <p className="text-[11px] text-slate-500">
                  الكتب الخارجية مشروحة نصياً وصوتياً مع ذكاء اصطناعي واختبارات فورية
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 font-bold text-slate-700 dark:text-slate-300">
              <button onClick={handleNavigateHome} className="hover:text-blue-600 cursor-pointer">
                الرئيسية
              </button>
              <button onClick={() => handleSelectStage('primary')} className="hover:text-blue-600 cursor-pointer">
                الابتدائية
              </button>
              <button onClick={() => handleSelectStage('prep')} className="hover:text-blue-600 cursor-pointer">
                الإعدادية
              </button>
              <button onClick={() => handleSelectStage('secondary')} className="hover:text-blue-600 cursor-pointer">
                الثانوية
              </button>
              <button onClick={() => setIsUploadModalOpen(true)} className="hover:text-emerald-600 cursor-pointer">
                رفع كتاب جديد
              </button>
              <button onClick={() => setIsAdminModalOpen(true)} className="hover:text-purple-600 cursor-pointer">
                لوحة الأدمن
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
            <span>
              جميع الحقوق محفوظة © {new Date().getFullYear()} لمنصة المنهج الذكي. متوافقة مع المناهج التعليمية المعتمدة.
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              واجهة عربية 100% (RTL) • مدعومة بتقنية TTS والذكاء الاصطناعي
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
