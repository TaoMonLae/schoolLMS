import { PlayCircle } from "lucide-react";
import Image from "next/image";
import { VideoLesson } from "@/lib/videos";

export function VideoThumbnail({ lesson }: { lesson: VideoLesson }) {
  if (lesson.thumbnailUrl) {
    return <Image src={lesson.thumbnailUrl} alt={`${lesson.title} thumbnail`} width={480} height={270} className="aspect-video w-full rounded-md object-cover" />;
  }

  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-md bg-ink text-white">
      <div className="text-center">
        <PlayCircle className="mx-auto h-10 w-10 text-[#ffd166]" aria-hidden="true" />
        <p className="mt-3 text-sm font-semibold">{lesson.videoProvider}</p>
      </div>
    </div>
  );
}
