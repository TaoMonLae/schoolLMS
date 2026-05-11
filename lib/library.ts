import { db } from "@/lib/db";
import { tenantFilter } from "@/lib/tenant";
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

function mapBook(book: { id:string; schoolId:string; title:string; author:string|null; description:string|null; category:string; subject:string; readingLevel:string; language:string; fileUrl:string; coverImageUrl:string|null; uploadedBy?: { name: string } | null; createdAt: Date; updatedAt: Date; }): LibraryBook {
  return { id: book.id, schoolId: book.schoolId, title: book.title, author: book.author || undefined, description: book.description || undefined, category: book.category, subject: book.subject, readingLevel: book.readingLevel, language: book.language, fileUrl: book.fileUrl, coverImageUrl: book.coverImageUrl || undefined, uploadedBy: book.uploadedBy?.name || "", createdAt: book.createdAt.toISOString().slice(0,10), updatedAt: book.updatedAt.toISOString().slice(0,10) };
}

export async function getLibraryBooksForUser(user: AppUser, filters: LibraryFilters = {}) {
  const search = filters.search?.trim();
  const books = await db.libraryBook.findMany({
    where: {
      ...tenantFilter(user),
      ...(!filters.subject || filters.subject === "ALL" ? {} : { subject: filters.subject }),
      ...(!filters.language || filters.language === "ALL" ? {} : { language: filters.language }),
      ...(!filters.readingLevel || filters.readingLevel === "ALL" ? {} : { readingLevel: filters.readingLevel }),
      ...(!filters.category || filters.category === "ALL" ? {} : { category: filters.category }),
      ...(search ? { OR: [
        { title: { contains: search, mode: "insensitive" } }, { author: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }, { category: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } }, { language: { contains: search, mode: "insensitive" } }, { readingLevel: { contains: search, mode: "insensitive" } }
      ] } : {})
    },
    include: { uploadedBy: { select: { name: true } } },
    orderBy: { title: "asc" }
  });
  return books.map(mapBook);
}

export async function getLibraryBookForUser(user: AppUser, bookId: string) {
  const book = await db.libraryBook.findFirst({ where: { id: bookId, ...tenantFilter(user) }, include: { uploadedBy: { select: { name: true } } } });
  return book ? mapBook(book) : undefined;
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
