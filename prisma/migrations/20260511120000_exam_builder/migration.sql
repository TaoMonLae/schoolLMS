-- Extend exams from simple marks records to GED-style exam builder records.
ALTER TYPE "ExamStatus" ADD VALUE IF NOT EXISTS 'PUBLISHED';
ALTER TYPE "ExamStatus" ADD VALUE IF NOT EXISTS 'CLOSED';

DO $$ BEGIN
  CREATE TYPE "GedSubjectType" AS ENUM ('RLA', 'MATH', 'SCIENCE', 'SOCIAL_STUDIES', 'CUSTOM');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ExamQuestionType" AS ENUM ('MULTIPLE_CHOICE', 'MULTIPLE_SELECT', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY', 'FILL_IN_BLANK', 'MATCHING', 'MATH_NUMERIC', 'MATH_EQUATION', 'PASSAGE_BASED', 'IMAGE_BASED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ExamAttemptStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'GRADED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "exams"
  ADD COLUMN IF NOT EXISTS "instructions" TEXT,
  ADD COLUMN IF NOT EXISTS "total_duration_minutes" INTEGER,
  ADD COLUMN IF NOT EXISTS "passing_score" INTEGER,
  ADD COLUMN IF NOT EXISTS "ged_subject_type" "GedSubjectType" NOT NULL DEFAULT 'CUSTOM';

CREATE INDEX IF NOT EXISTS "exams_school_id_status_idx" ON "exams"("school_id", "status");

CREATE TABLE IF NOT EXISTS "exam_sections" (
  "id" TEXT NOT NULL,
  "exam_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "instructions" TEXT,
  "order_index" INTEGER NOT NULL DEFAULT 0,
  "duration_minutes" INTEGER,
  "marks" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "exam_sections_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "exam_sections_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "exam_sections_exam_id_idx" ON "exam_sections"("exam_id");

CREATE TABLE IF NOT EXISTS "exam_questions" (
  "id" TEXT NOT NULL,
  "exam_id" TEXT NOT NULL,
  "section_id" TEXT,
  "type" "ExamQuestionType" NOT NULL,
  "prompt" TEXT NOT NULL,
  "passage" TEXT,
  "image_url" TEXT,
  "explanation" TEXT,
  "points" INTEGER NOT NULL DEFAULT 1,
  "order_index" INTEGER NOT NULL DEFAULT 0,
  "correct_answer_text" TEXT,
  "correct_answer_json" JSONB,
  "allow_calculator" BOOLEAN NOT NULL DEFAULT false,
  "difficulty" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "exam_questions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "exam_questions_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "exam_questions_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "exam_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "exam_questions_exam_id_idx" ON "exam_questions"("exam_id");
CREATE INDEX IF NOT EXISTS "exam_questions_section_id_idx" ON "exam_questions"("section_id");

CREATE TABLE IF NOT EXISTS "exam_question_options" (
  "id" TEXT NOT NULL,
  "question_id" TEXT NOT NULL,
  "option_text" TEXT NOT NULL,
  "is_correct" BOOLEAN NOT NULL DEFAULT false,
  "order_index" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "exam_question_options_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "exam_question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "exam_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "exam_question_options_question_id_idx" ON "exam_question_options"("question_id");

CREATE TABLE IF NOT EXISTS "exam_attempts" (
  "id" TEXT NOT NULL,
  "exam_id" TEXT NOT NULL,
  "student_id" TEXT NOT NULL,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "submitted_at" TIMESTAMP(3),
  "status" "ExamAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
  "score" INTEGER,
  "percentage" DOUBLE PRECISION,
  "time_spent_seconds" INTEGER,
  CONSTRAINT "exam_attempts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "exam_attempts_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "exam_attempts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "exam_attempts_exam_id_student_id_key" ON "exam_attempts"("exam_id", "student_id");
CREATE INDEX IF NOT EXISTS "exam_attempts_exam_id_idx" ON "exam_attempts"("exam_id");
CREATE INDEX IF NOT EXISTS "exam_attempts_student_id_idx" ON "exam_attempts"("student_id");

CREATE TABLE IF NOT EXISTS "exam_answers" (
  "id" TEXT NOT NULL,
  "attempt_id" TEXT NOT NULL,
  "question_id" TEXT NOT NULL,
  "answer_text" TEXT,
  "answer_json" JSONB,
  "is_correct" BOOLEAN,
  "points_awarded" INTEGER,
  "teacher_feedback" TEXT,
  CONSTRAINT "exam_answers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "exam_answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "exam_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "exam_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "exam_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "exam_answers_attempt_id_question_id_key" ON "exam_answers"("attempt_id", "question_id");
CREATE INDEX IF NOT EXISTS "exam_answers_attempt_id_idx" ON "exam_answers"("attempt_id");
CREATE INDEX IF NOT EXISTS "exam_answers_question_id_idx" ON "exam_answers"("question_id");
