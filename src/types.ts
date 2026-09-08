export type EducationalStageId = 'primary' | 'prep' | 'secondary';

export type SecondaryStreamId = 'scientific' | 'literary' | 'general';

export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
  stream?: SecondaryStreamId;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface DefinitionItem {
  term: string;
  definition: string;
  example?: string;
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  summary: string;
  detailedExplanation: string;
  keyPoints: string[];
  definitions?: DefinitionItem[];
  formulas?: string[];
  estimatedMinutes: number;
  quiz: QuizQuestion[];
}

export interface ExternalBook {
  id: string;
  title: string;
  author: string;
  publisher?: string;
  stageId: EducationalStageId;
  gradeId: string;
  subjectId: string;
  streamId?: SecondaryStreamId;
  coverImage: string;
  description: string;
  uploadedAt: string;
  uploaderName: string;
  uploaderRole: 'teacher' | 'student' | 'admin';
  status: 'approved' | 'pending' | 'rejected';
  viewsCount: number;
  listensCount: number;
  rating: number;
  chapters: Chapter[];
  fileType: 'pdf' | 'doc' | 'image';
  fileSize?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  stageId: EducationalStageId;
  gradeId: string;
  avatar: string;
  favorites: string[]; // book ids
  listeningHistory: {
    bookId: string;
    chapterId: string;
    bookTitle: string;
    chapterTitle: string;
    progressPercentage: number;
    timestamp?: number;
    listenedAt?: string;
  }[];
  lastListenedChapter?: {
    bookId: string;
    chapterId: string;
    bookTitle: string;
    chapterTitle: string;
    progressPercentage: number;
  };
}

export interface SummaryReview {
  id: string;
  title: string;
  gradeId: string;
  subjectId: string;
  author: string;
  date: string;
  downloads: number;
  pagesCount: number;
  downloadUrl?: string;
}
