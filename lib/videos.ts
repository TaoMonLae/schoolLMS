import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { tenantFilter } from "@/lib/tenant";
import { AppUser, SchoolClassOption, StudentRecord, TenantScoped, VideoProvider, VideoVisibility } from "@/lib/types";
import { mapStudentRecord } from "@/lib/students";

export type VideoSubject = { id: string; name: string };

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

export type VideoFilters = {
  search?: string;
  classId?: string;
  subjectId?: string;
  provider?: VideoProvider | "ALL";
  schoolId?: string;
};

type VideoWithRelations = Prisma.VideoLessonGetPayload<{ include: { class: true; uploadedBy: { select: { name: true } } } }>;

function dateValue(value: Date) {
  return value.toISOString().slice(0, 10);
}

async function subjectNameMap(schoolId: string, subjectIds: string[]) {
  if (subjectIds.length === 0) return new Map<string, string>();
  const subjects = await db.subject.findMany({ where: { schoolId, id: { in: [...new Set(subjectIds)] } }, select: { id: true, name: true } });
  return new Map(subjects.map((subject) => [subject.id, subject.name]));
}

function mapVideoLesson(lesson: VideoWithRelations, subjects: Map<string, string>): VideoLesson {
  return {
    id: lesson.id,
    schoolId: lesson.schoolId,
    classId: lesson.classId,
    className: lesson.class.name,
    subjectId: lesson.subjectId,
    subjectName: subjects.get(lesson.subjectId) || "Unknown subject",
    title: lesson.title,
    description: lesson.description || undefined,
    videoUrl: lesson.videoUrl,
    videoProvider: lesson.videoProvider,
    thumbnailUrl: lesson.thumbnailUrl || undefined,
    durationMinutes: lesson.durationMinutes || undefined,
    visibility: lesson.visibility,
    uploadedBy: lesson.uploadedBy?.name || "School staff",
    createdAt: dateValue(lesson.createdAt),
    updatedAt: dateValue(lesson.updatedAt)
  };
}

export async function getVideoSubjectsForUser(user: AppUser, explicitSchoolId?: string): Promise<VideoSubject[]> {
  const subjects = await db.subject.findMany({
    where: tenantFilter(user, explicitSchoolId),
    orderBy: { name: "asc" },
    select: { id: true, name: true }
  });
  return subjects;
}

export async function getVisibleVideoClassesForUser(user: AppUser, explicitSchoolId?: string): Promise<SchoolClassOption[]> {
  const classes = await db.class.findMany({
    where: {
      ...tenantFilter(user, explicitSchoolId),
      ...(user.role === "TEACHER" ? { id: { in: user.assignedClassIds } } : {})
    },
    orderBy: [{ academicYear: "desc" }, { name: "asc" }],
    select: { id: true, name: true, teacherId: true }
  });
  return classes.map((item) => ({ id: item.id, name: item.name, teacherId: item.teacherId || undefined }));
}

export const getManageableVideoClassesForUser = getVisibleVideoClassesForUser;

export async function getVisibleVideoLessonsForUser(user: AppUser, filters: VideoFilters = {}): Promise<VideoLesson[]> {
  const schoolFilter = tenantFilter(user, filters.schoolId);
  const where: Prisma.VideoLessonWhereInput = {
    ...schoolFilter,
    ...(filters.classId && filters.classId !== "ALL" ? { classId: filters.classId } : {}),
    ...(filters.subjectId && filters.subjectId !== "ALL" ? { subjectId: filters.subjectId } : {}),
    ...(filters.provider && filters.provider !== "ALL" ? { videoProvider: filters.provider } : {})
  };

  if (user.role === "TEACHER") {
    where.OR = [{ visibility: "SCHOOL" }, { classId: { in: user.assignedClassIds } }];
  }

  if (user.role === "STUDENT") {
    const student = user.studentId
      ? await db.student.findFirst({
          where: { id: user.studentId, ...schoolFilter, deletedAt: null },
          include: { enrollments: { where: { status: "ACTIVE" }, take: 1, orderBy: { startDate: "desc" } } }
        })
      : null;
    const classId = student?.enrollments[0]?.classId || "__none__";
    where.OR = [{ visibility: "SCHOOL" }, { classId }];
  }

  const search = filters.search?.trim();
  if (search) {
    where.AND = [{
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { class: { name: { contains: search, mode: "insensitive" } } },
        { uploadedBy: { name: { contains: search, mode: "insensitive" } } }
      ]
    }];
  }

  const lessons = await db.videoLesson.findMany({
    where,
    include: { class: true, uploadedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" }
  });
  const subjects = await subjectNameMap(schoolFilter.schoolId, lessons.map((lesson) => lesson.subjectId));
  return lessons.map((lesson) => mapVideoLesson(lesson, subjects));
}

export async function getVideoLessonForUser(user: AppUser, lessonId: string) {
  const lesson = await db.videoLesson.findFirst({
    where: { id: lessonId, ...tenantFilter(user) },
    include: { class: true, uploadedBy: { select: { name: true } } }
  });
  if (!lesson) return null;
  const visible = await getVisibleVideoLessonsForUser(user, { classId: lesson.classId, subjectId: lesson.subjectId });
  return visible.find((item) => item.id === lesson.id) || null;
}

export async function getPlaylistLessonsForUser(user: AppUser, currentLesson: VideoLesson) {
  return getVisibleVideoLessonsForUser(user, { classId: currentLesson.classId, subjectId: currentLesson.subjectId });
}

export async function canManageVideoClass(user: AppUser, classId: string) {
  return (await getManageableVideoClassesForUser(user)).some((classItem) => classItem.id === classId);
}

export function canManageVideoLesson(user: AppUser, lesson: VideoLesson) {
  if (user.role === "SUPER_ADMIN") return true;
  if (user.role === "SCHOOL_ADMIN") return lesson.schoolId === user.schoolId;
  if (user.role === "TEACHER") return lesson.schoolId === user.schoolId && user.assignedClassIds.includes(lesson.classId);
  return false;
}

export async function getVideoProgressForLesson(user: AppUser, lessonId: string): Promise<VideoProgressRecord[]> {
  const progress = await db.videoProgress.findMany({ where: { videoLessonId: lessonId, ...tenantFilter(user) }, orderBy: { lastWatchedAt: "desc" } });
  return progress
    .filter((item) => user.role !== "STUDENT" || item.studentId === user.studentId)
    .map((item) => ({
      id: item.id,
      schoolId: item.schoolId,
      videoLessonId: item.videoLessonId,
      studentId: item.studentId,
      watchedSeconds: item.watchedSeconds,
      completed: item.completed,
      lastWatchedAt: item.lastWatchedAt?.toISOString()
    }));
}

export async function getClassVideoProgressForLesson(user: AppUser, lesson: VideoLesson): Promise<{ student: StudentRecord; progress?: VideoProgressRecord }[]> {
  if (!canManageVideoLesson(user, lesson)) return [];
  const progress = await getVideoProgressForLesson(user, lesson.id);
  const progressByStudent = new Map(progress.map((item) => [item.studentId, item]));
  const students = await db.student.findMany({
    where: { schoolId: lesson.schoolId, deletedAt: null, status: "ACTIVE", enrollments: { some: { status: "ACTIVE", classId: lesson.classId } } },
    include: { enrollments: { where: { status: "ACTIVE" }, include: { class: true }, orderBy: { startDate: "desc" }, take: 1 } },
    orderBy: [{ studentNumber: "asc" }]
  });
  return students.map((student) => ({ student: mapStudentRecord(student), progress: progressByStudent.get(student.id) }));
}

export function detectVideoProvider(url: string): VideoProvider {
  if (getYouTubeVideoId(url)) return "YOUTUBE";
  if (url.includes("vimeo.com")) return "VIMEO";
  return "PRIVATE";
}

export function getYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "youtu.be") return cleanYouTubeId(parsed.pathname.split("/").filter(Boolean)[0]);
    if (!host.endsWith("youtube.com")) return null;
    if (parsed.pathname === "/watch") return cleanYouTubeId(parsed.searchParams.get("v"));
    const [kind, id] = parsed.pathname.split("/").filter(Boolean);
    if (["embed", "shorts", "live", "v"].includes(kind)) return cleanYouTubeId(id);
    return null;
  } catch {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([A-Za-z0-9_-]{6,})/);
    return cleanYouTubeId(match?.[1]);
  }
}

export function toYouTubeEmbedUrl(url: string): string | null {
  const id = getYouTubeVideoId(url);
  if (!id) return null;
  const start = getYouTubeStartSeconds(url);
  return `https://www.youtube.com/embed/${id}${start ? `?start=${start}` : ""}`;
}

export function getEmbeddableVideoUrl(lesson: VideoLesson) {
  if (lesson.videoProvider === "YOUTUBE") return toYouTubeEmbedUrl(lesson.videoUrl);
  if (lesson.videoProvider === "VIMEO") {
    const match = lesson.videoUrl.match(/vimeo\.com\/(\d+)/);
    return match ? `https://player.vimeo.com/video/${match[1]}` : lesson.videoUrl;
  }
  return lesson.videoUrl;
}

function cleanYouTubeId(value?: string | null) {
  if (!value) return null;
  const [id] = value.split(/[?&#]/);
  return /^[A-Za-z0-9_-]{6,}$/.test(id) ? id : null;
}

function getYouTubeStartSeconds(url: string) {
  try {
    const parsed = new URL(url.trim());
    return parseTimestamp(parsed.searchParams.get("start") || parsed.searchParams.get("t"));
  } catch {
    return parseTimestamp(url.match(/[?&](?:start|t)=([^&]+)/)?.[1]);
  }
}

function parseTimestamp(value?: string | null) {
  if (!value) return 0;
  if (/^\d+$/.test(value)) return Number(value);
  const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/i);
  if (!match) return 0;
  return Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0);
}

export async function getVideoSubjectName(user: AppUser, subjectId: string) {
  return (await db.subject.findFirst({ where: { id: subjectId, ...tenantFilter(user) }, select: { name: true } }))?.name || "Unknown subject";
}
