import { filterToTenant } from "@/lib/tenant";
import { AppUser, TenantScoped } from "@/lib/types";

export const allowedBookFileTypes = ["application/pdf"] as const;
export const allowedCoverImageTypes = ["image/jpeg", "image/png", "image/webp"] as const;
export const maxBookFileSizeMb = 25;
export const maxCoverImageSizeMb = 5;

export type LibraryBook = TenantScoped & {
  id: string;
  title: string;
  author?: string;
  description?: string;
  category: string;
  subject: string;
  readingLevel: string;
  language: string;
  fileUrl: string;
  coverImageUrl?: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type LibraryFilters = {
  search?: string;
  subject?: string;
  language?: string;
  readingLevel?: string;
  category?: string;
};

export type FileValidationInput = {
  type: string;
  size: number;
  kind: "book" | "cover";
};

export const demoLibraryBooks: LibraryBook[] = [
  {
    id: "book-english-starter",
    schoolId: "seed-school-mon-rlc",
    title: "English Starter Reader",
    author: "Refugee SchoolOS Curriculum Team",
    description: "A beginner reading pack with simple classroom vocabulary, picture prompts, and short practice passages.",
    category: "Reader",
    subject: "English",
    readingLevel: "Beginner",
    language: "English",
    fileUrl: "/demo-files/english-starter-reader.pdf",
    coverImageUrl: "",
    uploadedBy: "Lead Teacher",
    createdAt: "2026-05-01",
    updatedAt: "2026-05-01"
  },
  {
    id: "book-math-foundations",
    schoolId: "seed-school-mon-rlc",
    title: "Math Foundations Workbook",
    author: "Mon Refugee Learning Centre",
    description: "Printable number sense, addition, subtraction, and fractions practice for mixed-age classrooms.",
    category: "Workbook",
    subject: "Math",
    readingLevel: "Primary",
    language: "English",
    fileUrl: "/demo-files/math-foundations-workbook.pdf",
    coverImageUrl: "",
    uploadedBy: "School Administrator",
    createdAt: "2026-05-03",
    updatedAt: "2026-05-03"
  },
  {
    id: "book-health-safety",
    schoolId: "seed-school-mon-rlc",
    title: "Health and Safety Picture Guide",
    author: "Community Education Network",
    description: "Visual guide for hygiene, safe travel, emergency contacts, and school wellbeing routines.",
    category: "Guide",
    subject: "Life Skills",
    readingLevel: "Beginner",
    language: "Burmese",
    fileUrl: "/demo-files/health-safety-picture-guide.pdf",
    coverImageUrl: "",
    uploadedBy: "Case Manager",
    createdAt: "2026-05-05",
    updatedAt: "2026-05-05"
  },
  {
    id: "book-mon-stories",
    schoolId: "seed-school-mon-rlc",
    title: "Mon Stories for Young Readers",
    author: "Community Teachers",
    description: "Short cultural stories and reading questions for mother-tongue literacy sessions.",
    category: "Stories",
    subject: "Literacy",
    readingLevel: "Intermediate",
    language: "Mon",
    fileUrl: "/demo-files/mon-stories-young-readers.pdf",
    coverImageUrl: "",
    uploadedBy: "Lead Teacher",
    createdAt: "2026-05-06",
    updatedAt: "2026-05-06"
  }
];

export function getLibraryBooksForUser(user: AppUser, filters: LibraryFilters = {}) {
  const search = filters.search?.trim().toLowerCase();

  return filterToTenant(
    user,
    demoLibraryBooks
      .filter((book) => user.role === "SUPER_ADMIN" || book.schoolId === user.schoolId)
      .filter((book) => !filters.subject || filters.subject === "ALL" || book.subject === filters.subject)
      .filter((book) => !filters.language || filters.language === "ALL" || book.language === filters.language)
      .filter((book) => !filters.readingLevel || filters.readingLevel === "ALL" || book.readingLevel === filters.readingLevel)
      .filter((book) => !filters.category || filters.category === "ALL" || book.category === filters.category)
      .filter((book) => {
        if (!search) {
          return true;
        }

        return [book.title, book.author, book.description, book.category, book.subject, book.language, book.readingLevel]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(search));
      })
  );
}

export function getLibraryBookForUser(user: AppUser, bookId: string) {
  return getLibraryBooksForUser(user).find((book) => book.id === bookId);
}

export function getLibraryFilterOptions(books: LibraryBook[]) {
  return {
    subjects: uniqueSorted(books.map((book) => book.subject)),
    languages: uniqueSorted(books.map((book) => book.language)),
    readingLevels: uniqueSorted(books.map((book) => book.readingLevel)),
    categories: uniqueSorted(books.map((book) => book.category))
  };
}

export function validateLibraryFile({ type, size, kind }: FileValidationInput) {
  const allowedTypes = kind === "book" ? allowedBookFileTypes : allowedCoverImageTypes;
  const maxSizeMb = kind === "book" ? maxBookFileSizeMb : maxCoverImageSizeMb;
  const maxBytes = maxSizeMb * 1024 * 1024;

  if (!allowedTypes.includes(type as never)) {
    return {
      ok: false,
      message: kind === "book" ? "Only PDF book files are allowed." : "Cover image must be JPG, PNG, or WebP."
    };
  }

  if (size > maxBytes) {
    return {
      ok: false,
      message: `${kind === "book" ? "Book file" : "Cover image"} must be ${maxSizeMb}MB or smaller.`
    };
  }

  return { ok: true, message: "File is valid." };
}

export function isLibraryFileUrlAllowed(user: AppUser, book: LibraryBook, requestedUrl: string) {
  if (user.role !== "SUPER_ADMIN" && book.schoolId !== user.schoolId) {
    return false;
  }

  return requestedUrl === book.fileUrl || requestedUrl === book.coverImageUrl;
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort((first, second) => first.localeCompare(second));
}
