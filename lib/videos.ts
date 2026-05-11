import { filterToTenant } from "@/lib/tenant";
import { demoClasses, demoStudents } from "@/lib/students";
import { AppUser, TenantScoped, VideoProvider, VideoVisibility } from "@/lib/types";

export type VideoSubject = {
  id: string;
  name: string;
};

export type VideoLesson = TenantScoped & {
  id: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  title: string;
  description?: string;
  videoUrl: string;
  videoProvider: VideoProvider;
  thumbnailUrl?: string;
  durationMinutes?: number;
  visibility: VideoVisibility;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type VideoProgressRecord = TenantScoped & {
  id: string;
  videoLessonId: string;
  studentId: string;
  watchedSeconds: number;
  completed: boolean;
  lastWatchedAt?: string;
};

export const demoVideoSubjects: VideoSubject[] = [
  { id: "subject-english", name: "English" },
  { id: "subject-math", name: "Math" },
  { id: "subject-life-skills", name: "Life Skills" },
  { id: "subject-literacy", name: "Literacy" }
];

export const demoVideoLessons: VideoLesson[] = [
  {
    id: "video-english-greetings",
    schoolId: "seed-school-mon-rlc",
    classId: "class-primary-a",
    className: "Primary A",
    subjectId: "subject-english",
    subjectName: "English",
    title: "English Greetings and Classroom Words",
    description: "A short introduction to greetings, classroom routines, and common teacher instructions.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    videoProvider: "YOUTUBE",
    thumbnailUrl: "",
    durationMinutes: 12,
    visibility: "CLASS_ONLY",
    uploadedBy: "Lead Teacher",
    createdAt: "2026-05-06",
    updatedAt: "2026-05-06"
  },
  {
    id: "video-math-fractions",
    schoolId: "seed-school-mon-rlc",
    classId: "class-math-2",
    className: "Math Level 2",
    subjectId: "subject-math",
    subjectName: "Math",
    title: "Fractions with Paper Shapes",
    description: "Teacher-led fraction explanation using folded paper, shapes, and classroom practice questions.",
    videoUrl: "https://vimeo.com/76979871",
    videoProvider: "VIMEO",
    thumbnailUrl: "",
    durationMinutes: 18,
    visibility: "CLASS_ONLY",
    uploadedBy: "Math Teacher",
    createdAt: "2026-05-07",
    updatedAt: "2026-05-07"
  },
  {
    id: "video-safety-routines",
    schoolId: "seed-school-mon-rlc",
    classId: "class-bridge-english",
    className: "Bridge English",
    subjectId: "subject-life-skills",
    subjectName: "Life Skills",
    title: "School Safety Routines",
    description: "Private school video for safe travel, emergency contact routines, and respectful classroom care.",
    videoUrl: "https://schoolos.local/videos/safety-routines.mp4",
    videoProvider: "PRIVATE",
    thumbnailUrl: "",
    durationMinutes: 9,
    visibility: "SCHOOL",
    uploadedBy: "School Administrator",
    createdAt: "2026-05-08",
    updatedAt: "2026-05-08"
  }
];

export const demoVideoProgress: VideoProgressRecord[] = [
  {
    id: "progress-aye-english",
    schoolId: "seed-school-mon-rlc",
    videoLessonId: "video-english-greetings",
    studentId: "student-aye-chan",
    watchedSeconds: 480,
    completed: false,
    lastWatchedAt: "2026-05-10T08:30:00.000Z"
  },
  {
    id: "progress-min-english",
    schoolId: "seed-school-mon-rlc",
    videoLessonId: "video-english-greetings",
    studentId: "student-min-thu",
    watchedSeconds: 720,
    completed: true,
    lastWatchedAt: "2026-05-10T09:10:00.000Z"
  }
];

export type VideoFilters = {
  search?: string;
  classId?: string;
  subjectId?: string;
  provider?: VideoProvider | "ALL";
};

export function getVisibleVideoLessonsForUser(user: AppUser, filters: VideoFilters = {}) {
  const search = filters.search?.trim().toLowerCase();

  return filterToTenant(
    user,
    demoVideoLessons
      .filter((lesson) => user.role === "SUPER_ADMIN" || lesson.schoolId === user.schoolId)
      .filter((lesson) => {
        if (user.role === "TEACHER") {
          return lesson.visibility === "SCHOOL" || user.assignedClassIds.includes(lesson.classId);
        }

        if (user.role === "STUDENT") {
          const student = demoStudents.find((item) => item.id === user.studentId);
          return Boolean(student && (lesson.visibility === "SCHOOL" || lesson.classId === student.classId));
        }

        return true;
      })
      .filter((lesson) => !filters.classId || filters.classId === "ALL" || lesson.classId === filters.classId)
      .filter((lesson) => !filters.subjectId || filters.subjectId === "ALL" || lesson.subjectId === filters.subjectId)
      .filter((lesson) => !filters.provider || filters.provider === "ALL" || lesson.videoProvider === filters.provider)
      .filter((lesson) => {
        if (!search) {
          return true;
        }

        return [lesson.title, lesson.description, lesson.subjectName, lesson.className, lesson.uploadedBy]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(search));
      })
  );
}

export function getVideoLessonForUser(user: AppUser, lessonId: string) {
  return getVisibleVideoLessonsForUser(user).find((lesson) => lesson.id === lessonId);
}

export function getPlaylistLessonsForUser(user: AppUser, currentLesson: VideoLesson) {
  return getVisibleVideoLessonsForUser(user, {
    classId: currentLesson.classId,
    subjectId: currentLesson.subjectId
  });
}

export function getManageableVideoClassesForUser(user: AppUser) {
  if (user.role === "SUPER_ADMIN" || user.role === "SCHOOL_ADMIN") {
    return demoClasses;
  }

  if (user.role === "TEACHER") {
    return demoClasses.filter((classItem) => user.assignedClassIds.includes(classItem.id));
  }

  return [];
}

export function canManageVideoClass(user: AppUser, classId: string) {
  return getManageableVideoClassesForUser(user).some((classItem) => classItem.id === classId);
}

export function canManageVideoLesson(user: AppUser, lesson: VideoLesson) {
  if (user.role === "SUPER_ADMIN" || user.role === "SCHOOL_ADMIN") {
    return user.role === "SUPER_ADMIN" || lesson.schoolId === user.schoolId;
  }

  if (user.role === "TEACHER") {
    return lesson.schoolId === user.schoolId && user.assignedClassIds.includes(lesson.classId);
  }

  return false;
}

export function getVideoProgressForLesson(user: AppUser, lessonId: string) {
  return demoVideoProgress.filter((progress) => {
    if (user.role !== "SUPER_ADMIN" && progress.schoolId !== user.schoolId) {
      return false;
    }

    if (progress.videoLessonId !== lessonId) {
      return false;
    }

    if (user.role === "STUDENT") {
      return progress.studentId === user.studentId;
    }

    return true;
  });
}

export function getClassVideoProgressForLesson(user: AppUser, lesson: VideoLesson) {
  if (!canManageVideoLesson(user, lesson)) {
    return [];
  }

  const progressByStudent = new Map(
    demoVideoProgress
      .filter((progress) => progress.schoolId === lesson.schoolId && progress.videoLessonId === lesson.id)
      .map((progress) => [progress.studentId, progress])
  );

  return demoStudents
    .filter((student) => student.schoolId === lesson.schoolId && student.classId === lesson.classId && student.status === "ACTIVE" && !student.deletedAt)
    .map((student) => ({
      student,
      progress: progressByStudent.get(student.id)
    }));
}

export function detectVideoProvider(url: string): VideoProvider {
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return "YOUTUBE";
  }

  if (url.includes("vimeo.com")) {
    return "VIMEO";
  }

  return "PRIVATE";
}

export function getEmbeddableVideoUrl(lesson: VideoLesson) {
  if (lesson.videoProvider === "YOUTUBE") {
    const match = lesson.videoUrl.match(/[?&]v=([^&]+)/) || lesson.videoUrl.match(/youtu\.be\/([^?]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : lesson.videoUrl;
  }

  if (lesson.videoProvider === "VIMEO") {
    const match = lesson.videoUrl.match(/vimeo\.com\/(\d+)/);
    return match ? `https://player.vimeo.com/video/${match[1]}` : lesson.videoUrl;
  }

  return lesson.videoUrl;
}

export function getVideoSubjectName(subjectId: string) {
  return demoVideoSubjects.find((subject) => subject.id === subjectId)?.name || "Unknown subject";
}
