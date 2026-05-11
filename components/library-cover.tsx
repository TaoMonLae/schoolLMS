import { BookOpen } from "lucide-react";
import Image from "next/image";
import { LibraryBook } from "@/lib/library";

export function LibraryCover({ book, size = "md" }: { book: LibraryBook; size?: "sm" | "md" | "lg" }) {
  const sizeClass = {
    sm: "h-16 w-12",
    md: "h-36 w-28",
    lg: "h-56 w-40"
  }[size];

  if (book.coverImageUrl) {
    return (
      <Image
        src={book.coverImageUrl}
        alt={`${book.title} cover`}
        width={160}
        height={224}
        className={`${sizeClass} rounded-md object-cover shadow-sm`}
      />
    );
  }

  return (
    <div className={`${sizeClass} flex shrink-0 flex-col justify-between rounded-md bg-ink p-3 text-white shadow-sm`}>
      <BookOpen className="h-5 w-5 text-[#ffd166]" aria-hidden="true" />
      <span className="text-xs font-semibold leading-4">{book.title}</span>
    </div>
  );
}
