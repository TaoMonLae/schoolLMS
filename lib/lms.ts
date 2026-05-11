import { filterToTenant } from "@/lib/tenant";
import { demoClasses, demoStudents } from "@/lib/students";
import { AppUser, AssignmentStatus, ExamStatus, SubmissionStatus, TenantScoped } from "@/lib/types";

export type Subject = TenantScoped & {
  id: string;
  name: string;
  code: string;
  description?: string;
  isGed: boolean;
};

export type Lesson = TenantScoped & {
  id: string;
  classId: string;
  className: string;
  subjectId: string;
  title: string;
  description: string;
  content: string;
  createdBy: string;
  files: LessonFile[];
};

export type LessonFile = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSizeLabel: string;
};

export type Assignment = TenantScoped & {
  id: string;
  classId: string;
  className: string;
  subjectId: string;
  title: string;
  description: string;
  dueDate: string;
  maxPoints: number;
  status: AssignmentStatus;
};

export type Submission = TenantScoped & {
  id: string;
  assignmentId: string;
  studentId: string;
  status: SubmissionStatus;
  submittedAt?: string;
  points?: number;
  feedback?: string;
  fileUrl?: string;
};

export type Exam = TenantScoped & {
  id: string;
  classId: string;
  className: string;
  subjectId: string;
  title: string;
  description: string;
  examDate: string;
  maxMarks: number;
  status: ExamStatus;
};

export type ExamMark = TenantScoped & {
  id: string;
  examId: string;
  studentId: string;
  marks: number;
  feedback?: string;
};

export const gedSubjects: Subject[] = [
  {
    id: "subject-rla",
    schoolId: "seed-school-mon-rlc",
    name: "Reasoning Through Language Arts",
    code: "GED-RLA",
    description: "Reading comprehension, writing, argument analysis, and language skills.",
    isGed: true
  },
  {
    id: "subject-math-reasoning",
    schoolId: "seed-school-mon-rlc",
    name: "Mathematical Reasoning",
    code: "GED-MATH",
    description: "Quantitative problem solving, algebra, data, geometry, and GED-style reasoning.",
    isGed: true
  },
  {
    id: "subject-science",
    schoolId: "seed-school-mon-rlc",
    name: "Science",
    code: "GED-SCI",
    description: "Life science, physical science, earth science, evidence, and data interpretation.",
    isGed: true
  },
  {
    id: "subject-social-studies",
    schoolId: "seed-school-mon-rlc",
    name: "Social Studies",
    code: "GED-SS",
    description: "Civics, history, geography, economics, and source analysis.",
    isGed: true
  }
];

export const customSubjects: Subject[] = [
  {
    id: "subject-bridge-english",
    schoolId: "seed-school-mon-rlc",
    name: "Bridge English",
    code: "BR-ENG",
    description: "Custom English support subject for mixed-level refugee learners.",
    isGed: false
  }
];

export const demoSubjects = [...gedSubjects, ...customSubjects];

export const demoLessons: Lesson[] = [
  {
    id: "lesson-rla-claims",
    schoolId: "seed-school-mon-rlc",
    classId: "class-bridge-english",
    className: "Bridge English",
    subjectId: "subject-rla",
    title: "Finding Claims and Evidence",
    description: "Students identify claims, reasons, and evidence in short GED-style passages.",
    content: "Read the paragraph, underline the main claim, then list two pieces of supporting evidence.",
    createdBy: "Lead Teacher",
    files: [
      { id: "file-rla-passage", fileName: "claims-and-evidence.pdf", fileUrl: "#", fileType: "PDF", fileSizeLabel: "420 KB" }
    ]
  },
  {
    id: "lesson-math-ratios",
    schoolId: "seed-school-mon-rlc",
    classId: "class-math-2",
    className: "Math Level 2",
    subjectId: "subject-math-reasoning",
    title: "Ratios with Classroom Supplies",
    description: "GED-style ratio reasoning using pencils, notebooks, and small group examples.",
    content: "Model ratios with classroom supplies, then convert each ratio into a fraction and percent.",
    createdBy: "Math Teacher",
    files: [
      { id: "file-ratio-worksheet", fileName: "ratio-practice.xlsx", fileUrl: "#", fileType: "Spreadsheet", fileSizeLabel: "88 KB" }
    ]
  }
];

export const demoAssignments: Assignment[] = [
  {
    id: "assignment-rla-summary",
    schoolId: "seed-school-mon-rlc",
    classId: "class-bridge-english",
    className: "Bridge English",
    subjectId: "subject-rla",
    title: "Paragraph Summary",
    description: "Write a 5-sentence summary of the assigned passage and identify the central idea.",
    dueDate: "2026-05-18",
    maxPoints: 20,
    status: "PUBLISHED"
  },
  {
    id: "assignment-math-ratios",
    schoolId: "seed-school-mon-rlc",
    classId: "class-math-2",
    className: "Math Level 2",
    subjectId: "subject-math-reasoning",
    title: "Ratio Practice Set",
    description: "Complete 10 ratio and proportion questions.",
    dueDate: "2026-05-19",
    maxPoints: 25,
    status: "PUBLISHED"
  }
];

export const demoSubmissions: Submission[] = [
  {
    id: "submission-nilar-summary",
    schoolId: "seed-school-mon-rlc",
    assignmentId: "assignment-rla-summary",
    studentId: "student-nilar-win",
    status: "GRADED",
    submittedAt: "2026-05-17",
    points: 17,
    feedback: "Clear central idea. Add one more detail from the passage."
  },
  {
    id: "submission-sandi-ratios",
    schoolId: "seed-school-mon-rlc",
    assignmentId: "assignment-math-ratios",
    studentId: "student-sandi-oo",
    status: "SUBMITTED",
    submittedAt: "2026-05-18"
  }
];

export const demoExams: Exam[] = [
  {
    id: "exam-rla-practice-1",
    schoolId: "seed-school-mon-rlc",
    classId: "class-bridge-english",
    className: "Bridge English",
    subjectId: "subject-rla",
    title: "GED RLA Practice Check 1",
    description: "Short reading and constructed response practice.",
    examDate: "2026-05-24",
    maxMarks: 100,
    status: "SCHEDULED"
  },
  {
    id: "exam-math-practice-1",
    schoolId: "seed-school-mon-rlc",
    classId: "class-math-2",
    className: "Math Level 2",
    subjectId: "subject-math-reasoning",
    title: "GED Math Practice Check 1",
    description: "Ratios, percent, and simple algebra reasoning.",
    examDate: "2026-05-25",
    maxMarks: 100,
    status: "COMPLETED"
  }
];

export const demoExamMarks: ExamMark[] = [
  {
    id: "mark-sandi-math",
    schoolId: "seed-school-mon-rlc",
    examId: "exam-math-practice-1",
    studentId: "student-sandi-oo",
    marks: 74,
    feedback: "Good ratio reasoning. Practice multi-step percent questions."
  }
];

export function getVisibleClassesForLearning(user: AppUser) {
  if (user.role === "SUPER_ADMIN" || user.role === "SCHOOL_ADMIN" || user.role === "CASE_MANAGER") {
    return demoClasses;
  }

  if (user.role === "TEACHER") {
    return demoClasses.filter((classItem) => user.assignedClassIds.includes(classItem.id));
  }

  const student = demoStudents.find((item) => item.id === user.studentId);
  return student ? demoClasses.filter((classItem) => classItem.id === student.classId) : [];
}

export function getVisibleSubjects(user: AppUser) {
  return filterToTenant(
    user,
    demoSubjects.filter((subject) => user.role === "SUPER_ADMIN" || subject.schoolId === user.schoolId)
  );
}

export function getVisibleLessons(user: AppUser, subjectId = "ALL") {
  const classIds = new Set(getVisibleClassesForLearning(user).map((classItem) => classItem.id));
  return filterToTenant(
    user,
    demoLessons.filter((lesson) => {
      return (user.role === "SUPER_ADMIN" || lesson.schoolId === user.schoolId) && classIds.has(lesson.classId) && (subjectId === "ALL" || lesson.subjectId === subjectId);
    })
  );
}

export function getLessonForUser(user: AppUser, lessonId: string) {
  return getVisibleLessons(user).find((lesson) => lesson.id === lessonId);
}

export function getVisibleAssignments(user: AppUser, subjectId = "ALL") {
  const classIds = new Set(getVisibleClassesForLearning(user).map((classItem) => classItem.id));
  return filterToTenant(
    user,
    demoAssignments.filter((assignment) => {
      return (user.role === "SUPER_ADMIN" || assignment.schoolId === user.schoolId) && classIds.has(assignment.classId) && (subjectId === "ALL" || assignment.subjectId === subjectId);
    })
  );
}

export function getAssignmentForUser(user: AppUser, assignmentId: string) {
  return getVisibleAssignments(user).find((assignment) => assignment.id === assignmentId);
}

export function getSubmissionsForAssignment(user: AppUser, assignmentId: string) {
  const assignment = getAssignmentForUser(user, assignmentId);
  if (!assignment) return [];
  const students = demoStudents.filter((student) => student.classId === assignment.classId && student.status === "ACTIVE");
  return students.map((student) => ({
    student,
    submission: demoSubmissions.find((submission) => submission.assignmentId === assignmentId && submission.studentId === student.id)
  }));
}

export function getVisibleExams(user: AppUser, subjectId = "ALL") {
  const classIds = new Set(getVisibleClassesForLearning(user).map((classItem) => classItem.id));
  return filterToTenant(
    user,
    demoExams.filter((exam) => {
      return (user.role === "SUPER_ADMIN" || exam.schoolId === user.schoolId) && classIds.has(exam.classId) && (subjectId === "ALL" || exam.subjectId === subjectId);
    })
  );
}

export function calculatePercent(points: number, max: number) {
  return Math.round((points / max) * 100);
}

export function getProgressBand(percent: number) {
  if (percent >= 85) return "GED Ready";
  if (percent >= 70) return "On Track";
  if (percent >= 50) return "Building Skills";
  return "Needs Support";
}

export function getStudentReportCard(user: AppUser, studentId: string) {
  const student = demoStudents.find((item) => item.id === studentId);
  if (!student || (user.role !== "SUPER_ADMIN" && student.schoolId !== user.schoolId)) return undefined;

  const rows = getVisibleSubjects(user).map((subject) => {
    const assignments = demoAssignments.filter((assignment) => assignment.subjectId === subject.id && assignment.classId === student.classId);
    const assignmentScores = assignments
      .map((assignment) => {
        const submission = demoSubmissions.find((item) => item.assignmentId === assignment.id && item.studentId === student.id);
        return submission?.points === undefined ? undefined : calculatePercent(submission.points, assignment.maxPoints);
      })
      .filter((value): value is number => typeof value === "number");
    const exams = demoExams.filter((exam) => exam.subjectId === subject.id && exam.classId === student.classId);
    const examScores = exams
      .map((exam) => {
        const mark = demoExamMarks.find((item) => item.examId === exam.id && item.studentId === student.id);
        return mark ? calculatePercent(mark.marks, exam.maxMarks) : undefined;
      })
      .filter((value): value is number => typeof value === "number");
    const allScores = [...assignmentScores, ...examScores];
    const percent = allScores.length ? Math.round(allScores.reduce((sum, score) => sum + score, 0) / allScores.length) : 0;

    return {
      subject,
      assignmentCount: assignmentScores.length,
      examCount: examScores.length,
      percent,
      band: allScores.length ? getProgressBand(percent) : "Not Started"
    };
  });
  const scoredRows = rows.filter((row) => row.percent > 0);
  const overall = scoredRows.length ? Math.round(scoredRows.reduce((sum, row) => sum + row.percent, 0) / scoredRows.length) : 0;

  return {
    student,
    rows,
    overall,
    band: overall ? getProgressBand(overall) : "Not Started",
    parentSummary: `${student.preferredName || student.legalName} is ${overall ? getProgressBand(overall).toLowerCase() : "starting"} across GED-style learning goals. Focus on steady attendance, assignment completion, and practice questions at home.`
  };
}

export function getDefaultReportStudentId() {
  return demoStudents.find((student) => student.status === "ACTIVE")?.id || demoStudents[0]?.id;
}

export function getSubjectName(subjectId: string) {
  return demoSubjects.find((subject) => subject.id === subjectId)?.name || "Unknown subject";
}
