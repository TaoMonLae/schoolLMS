"use client";

import { Copy, Eye, Plus, Save, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type Option = { id: string; optionText: string; isCorrect: boolean };
type Question = {
  id: string;
  type: string;
  prompt: string;
  passage: string;
  imageUrl: string;
  explanation: string;
  points: number;
  correctAnswerText: string;
  correctAnswerJson?: unknown;
  allowCalculator: boolean;
  difficulty: string;
  options: Option[];
};
type Section = { id: string; title: string; description: string; instructions: string; durationMinutes: number | ""; marks: number; questions: Question[] };
type ExamSeed = {
  id?: string;
  classId?: string;
  subjectId?: string;
  title?: string;
  description?: string | null;
  instructions?: string | null;
  examDate?: Date | string | null;
  totalDurationMinutes?: number | null;
  maxMarks?: number;
  passingScore?: number | null;
  status?: string;
  gedSubjectType?: string;
  sections?: Array<Omit<Section, "durationMinutes" | "questions"> & { durationMinutes?: number | string | null; questions: Array<Question & { options: Option[] }> }>;
};

type ExamBuilderProps = {
  action: (formData: FormData) => Promise<void>;
  classes: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
  exam?: ExamSeed;
};

const sectionTemplates = {
  RLA: { title: "Reading Language Arts", description: "Passage, language usage, and extended response essay tasks.", durationMinutes: 150, marks: 40 },
  MATH: { title: "Mathematical Reasoning", description: "Numeric, equation, formula, and multiple choice math tasks.", durationMinutes: 115, marks: 40 },
  SCIENCE: { title: "Science", description: "Data, chart, table, and short stimulus interpretation.", durationMinutes: 90, marks: 40 },
  SOCIAL_STUDIES: { title: "Social Studies", description: "Source, document, map, chart, and table interpretation.", durationMinutes: 70, marks: 40 },
  CUSTOM: { title: "Custom Section", description: "Custom exam section.", durationMinutes: "" as const, marks: 10 }
};

const questionTypes = [
  ["MULTIPLE_CHOICE", "Multiple Choice"],
  ["MULTIPLE_SELECT", "Multiple Select"],
  ["TRUE_FALSE", "True / False"],
  ["SHORT_ANSWER", "Short Answer"],
  ["ESSAY", "Essay / Extended Response"],
  ["FILL_IN_BLANK", "Fill in the Blank"],
  ["MATCHING", "Matching"],
  ["MATH_NUMERIC", "Math Numeric Answer"],
  ["MATH_EQUATION", "Math Equation / Formula"],
  ["PASSAGE_BASED", "Passage-based Question"],
  ["IMAGE_BASED", "Image-based Question"]
];

function uid(prefix: string) { return `${prefix}_${Math.random().toString(36).slice(2, 10)}`; }
function dateValue(value?: Date | string | null) { if (!value) return ""; return new Date(value).toISOString().slice(0, 10); }
function blankOption(index: number): Option { return { id: uid("option"), optionText: `Option ${index}`, isCorrect: index === 1 }; }
function blankQuestion(type = "MULTIPLE_CHOICE"): Question {
  return { id: uid("question"), type, prompt: "", passage: "", imageUrl: "", explanation: "", points: 1, correctAnswerText: "", allowCalculator: false, difficulty: "", options: [blankOption(1), blankOption(2)] };
}
function makeSection(template = "CUSTOM"): Section {
  const base = sectionTemplates[template as keyof typeof sectionTemplates] || sectionTemplates.CUSTOM;
  return { id: uid("section"), title: base.title, description: base.description, instructions: "", durationMinutes: base.durationMinutes, marks: base.marks, questions: [] };
}
function normalizeSections(sections?: ExamSeed["sections"]): Section[] {
  if (!sections?.length) return [makeSection("RLA")];
  return sections.map((section) => ({
    ...section,
    id: section.id || uid("section"),
    description: section.description || "",
    instructions: section.instructions || "",
    durationMinutes: section.durationMinutes === null || section.durationMinutes === undefined ? "" : section.durationMinutes === "" ? "" : Number(section.durationMinutes),
    marks: section.marks || 0,
    questions: (section.questions || []).map((question) => ({ ...blankQuestion(question.type), ...question, id: question.id || uid("question"), passage: question.passage || "", imageUrl: question.imageUrl || "", explanation: question.explanation || "", correctAnswerText: question.correctAnswerText || "", difficulty: question.difficulty || "", options: question.options?.length ? question.options.map((option, index) => ({ id: option.id || uid("option"), optionText: option.optionText || `Option ${index + 1}`, isCorrect: Boolean(option.isCorrect) })) : [blankOption(1), blankOption(2)] }))
  }));
}

export function ExamBuilder({ action, classes, subjects, exam }: ExamBuilderProps) {
  const [status, setStatus] = useState(exam?.status || "DRAFT");
  const [gedType, setGedType] = useState(exam?.gedSubjectType || "RLA");
  const [sections, setSections] = useState<Section[]>(() => normalizeSections(exam?.sections));
  const [maxMarks, setMaxMarks] = useState(exam?.maxMarks || 100);
  const [previewMode, setPreviewMode] = useState(false);
  const totalPoints = useMemo(() => sections.flatMap((section) => section.questions).reduce((sum, question) => sum + Number(question.points || 0), 0), [sections]);
  const warnings = useMemo(() => {
    const messages: string[] = [];
    if (sections.length === 0) messages.push("Add at least one section before publishing.");
    if (!sections.some((section) => section.questions.length)) messages.push("Add at least one question before publishing.");
    if (totalPoints !== maxMarks) messages.push(`Question points total ${totalPoints}, but max marks is ${maxMarks}.`);
    sections.forEach((section, sectionIndex) => section.questions.forEach((question, questionIndex) => {
      const label = `${section.title || `Section ${sectionIndex + 1}`} Q${questionIndex + 1}`;
      if (!question.prompt.trim()) messages.push(`${label} has no prompt.`);
      if (["MULTIPLE_CHOICE", "MULTIPLE_SELECT", "PASSAGE_BASED"].includes(question.type)) {
        const filled = question.options.filter((option) => option.optionText.trim());
        const correct = filled.filter((option) => option.isCorrect);
        if (filled.length < 2) messages.push(`${label} needs at least two options.`);
        if (question.type === "MULTIPLE_CHOICE" && correct.length !== 1) messages.push(`${label} needs exactly one correct option.`);
        if (question.type === "MULTIPLE_SELECT" && correct.length < 1) messages.push(`${label} needs one or more correct options.`);
      }
    }));
    return messages;
  }, [maxMarks, sections, totalPoints]);
  const builderJson = JSON.stringify({ sections });

  function updateSection(id: string, patch: Partial<Section>) { setSections((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item)); }
  function updateQuestion(sectionId: string, questionId: string, patch: Partial<Question>) { setSections((items) => items.map((section) => section.id === sectionId ? { ...section, questions: section.questions.map((question) => question.id === questionId ? { ...question, ...patch } : question) } : section)); }
  function updateOption(sectionId: string, questionId: string, optionId: string, patch: Partial<Option>) { setSections((items) => items.map((section) => section.id === sectionId ? { ...section, questions: section.questions.map((question) => question.id === questionId ? { ...question, options: question.options.map((option) => option.id === optionId ? { ...option, ...patch } : option) } : question) } : section)); }
  function applyTemplate(template: string) {
    setGedType(template);
    if (sections.length === 1 && !sections[0].questions.length) setSections([makeSection(template)]);
  }
  function addTemplateQuestion(sectionId: string, template: string) {
    const question = blankQuestion(template === "MATH" ? "MATH_NUMERIC" : template === "RLA" ? "PASSAGE_BASED" : "MULTIPLE_CHOICE");
    if (template === "RLA") question.passage = "Paste the reading passage here.";
    if (template === "MATH") { question.allowCalculator = true; question.prompt = "Solve and enter the numeric answer."; }
    if (template === "SCIENCE") question.passage = "Describe the chart, table, graph, or data stimulus.";
    if (template === "SOCIAL_STUDIES") question.passage = "Paste the source document, map note, chart, or table stimulus.";
    updateSection(sectionId, { questions: [...(sections.find((section) => section.id === sectionId)?.questions || []), question] });
  }

  return (
    <form action={action} className="space-y-6 text-foreground">
      <input type="hidden" name="id" value={exam?.id || ""} />
      <input type="hidden" name="builderJson" value={builderJson} />
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 shadow-soft lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-orange">Exam Builder</p>
          <h1 className="mt-1 text-3xl font-semibold text-foreground">Create Exam</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Build GED-style class exams with sections, question types, timers, and scoring.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="submit" name="intentStatus" value="DRAFT" onClick={() => setStatus("DRAFT")} className="inline-flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-bold text-secondary-foreground"><Save className="h-4 w-4" /> Save Draft</button>
          {exam?.id ? <Link href={`/dashboard/exams/${exam.id}/preview`} className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-bold text-foreground"><Eye className="h-4 w-4" /> Preview</Link> : <button type="button" onClick={() => setPreviewMode((value) => !value)} className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-bold text-foreground"><Eye className="h-4 w-4" /> Preview</button>}
          <button type="submit" name="intentStatus" value="PUBLISHED" onClick={() => setStatus("PUBLISHED")} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"><Send className="h-4 w-4" /> Publish</button>
          <Link href="/dashboard/exams" className="rounded-md border border-border px-4 py-2 text-sm font-bold text-foreground">Exam list</Link>
        </div>
      </div>

      <input type="hidden" name="status" value={status} />
      <section className="rounded-lg border border-border bg-card p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-xl font-semibold text-foreground">Step 1: Exam Setup</h2><p className="text-sm text-muted-foreground">Keep the existing metadata and add timers, passing score, instructions, and GED style.</p></div><button type="button" onClick={() => setMaxMarks(totalPoints || maxMarks)} className="rounded-md bg-secondary px-3 py-2 text-sm font-bold text-secondary-foreground">Auto-calculate max marks from questions</button></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Field label="Class"><select name="classId" defaultValue={exam?.classId || ""} required className="field"><option value="">Choose class</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
          <Field label="Subject"><select name="subjectId" defaultValue={exam?.subjectId || ""} required className="field"><option value="">Choose subject</option>{subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
          <Field label="GED style"><select name="gedSubjectType" value={gedType} onChange={(event) => applyTemplate(event.target.value)} className="field"><option value="RLA">Reading Language Arts</option><option value="MATH">Mathematical Reasoning</option><option value="SCIENCE">Science</option><option value="SOCIAL_STUDIES">Social Studies</option><option value="CUSTOM">Custom</option></select></Field>
          <Field label="Title"><input name="title" defaultValue={exam?.title || ""} required className="field" /></Field>
          <Field label="Exam date"><input name="examDate" type="date" defaultValue={dateValue(exam?.examDate)} className="field" /></Field>
          <Field label="Duration (minutes)"><input name="totalDurationMinutes" type="number" min="1" defaultValue={exam?.totalDurationMinutes || ""} className="field" /></Field>
          <Field label="Max marks"><input name="maxMarks" type="number" min="1" value={maxMarks} onChange={(event) => setMaxMarks(Number(event.target.value))} className="field" /></Field>
          <Field label="Passing score"><input name="passingScore" type="number" min="0" defaultValue={exam?.passingScore || ""} className="field" /></Field>
          <Field label="Workflow status"><select value={status} onChange={(event) => setStatus(event.target.value)} className="field"><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="CLOSED">Closed</option></select></Field>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2"><Field label="Description"><textarea name="description" defaultValue={exam?.description || ""} rows={4} className="field" /></Field><Field label="Instructions"><textarea name="instructions" defaultValue={exam?.instructions || ""} rows={4} className="field" placeholder="Student-facing rules, allowed materials, and timing notes." /></Field></div>
        {warnings.length ? <div className="mt-4 rounded-md border border-warning/30 bg-tint-yellow p-3 text-sm text-foreground"><p className="font-semibold">Draft/publish warnings</p><ul className="mt-2 list-disc space-y-1 pl-5">{warnings.slice(0, 8).map((warning) => <li key={warning}>{warning}</li>)}</ul></div> : null}
      </section>

      <section className="rounded-lg border border-border bg-card p-5 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-semibold text-foreground">Step 2: Exam Sections</h2><p className="text-sm text-muted-foreground">Add GED or custom sections with optional section timers.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setSections([...sections, makeSection(gedType)])} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" /> Add Section</button></div></div>
        <div className="mt-5 space-y-5">{sections.map((section, sectionIndex) => (
          <article key={section.id} className="rounded-lg border border-border bg-background p-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_140px_120px_auto]"><Field label={`Section ${sectionIndex + 1} title`}><input value={section.title} onChange={(event) => updateSection(section.id, { title: event.target.value })} className="field" /></Field><Field label="Time limit"><input type="number" min="0" value={section.durationMinutes} onChange={(event) => updateSection(section.id, { durationMinutes: event.target.value ? Number(event.target.value) : "" })} className="field" /></Field><Field label="Marks"><input type="number" min="0" value={section.marks} onChange={(event) => updateSection(section.id, { marks: Number(event.target.value) })} className="field" /></Field><div className="flex items-end gap-2"><button type="button" onClick={() => setSections(sections.filter((item) => item.id !== section.id))} className="rounded-md bg-destructive px-3 py-3 text-sm font-bold text-destructive-foreground"><Trash2 className="h-4 w-4" /></button></div></div>
            <div className="mt-3 grid gap-3 md:grid-cols-2"><Field label="Description"><textarea value={section.description} onChange={(event) => updateSection(section.id, { description: event.target.value })} className="field" rows={3} /></Field><Field label="Instructions"><textarea value={section.instructions} onChange={(event) => updateSection(section.id, { instructions: event.target.value })} className="field" rows={3} /></Field></div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold text-foreground">Step 3: Questions ({section.questions.length})</h3><div className="flex flex-wrap gap-2"><button type="button" onClick={() => updateSection(section.id, { questions: [...section.questions, blankQuestion()] })} className="rounded-md bg-secondary px-3 py-2 text-sm font-bold text-secondary-foreground">Add blank question</button><button type="button" onClick={() => addTemplateQuestion(section.id, gedType)} className="rounded-md border border-border px-3 py-2 text-sm font-bold text-foreground">Add GED-style question</button></div></div>
            <div className="mt-3 space-y-3">{section.questions.map((question, questionIndex) => <QuestionCard key={question.id} section={section} sectionIndex={sectionIndex} question={question} questionIndex={questionIndex} updateQuestion={updateQuestion} updateOption={updateOption} updateSection={updateSection} />)}</div>
          </article>
        ))}</div>
      </section>
      {previewMode ? <ExamPreview sections={sections} totalPoints={totalPoints} /> : null}
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-semibold text-foreground"><span>{label}</span><span className="mt-2 block">{children}</span></label>; }

function QuestionCard({ section, question, questionIndex, updateQuestion, updateOption, updateSection }: { section: Section; sectionIndex: number; question: Question; questionIndex: number; updateQuestion: (sectionId: string, questionId: string, patch: Partial<Question>) => void; updateOption: (sectionId: string, questionId: string, optionId: string, patch: Partial<Option>) => void; updateSection: (id: string, patch: Partial<Section>) => void }) {
  const isOptions = ["MULTIPLE_CHOICE", "MULTIPLE_SELECT", "PASSAGE_BASED"].includes(question.type);
  const isPassage = ["PASSAGE_BASED", "ESSAY", "SHORT_ANSWER", "SCIENCE", "SOCIAL_STUDIES"].includes(question.type) || question.passage;
  return <div className="rounded-lg border border-border bg-card p-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"><div className="grid flex-1 gap-3 md:grid-cols-[220px_1fr_110px]"><Field label={`Q${questionIndex + 1} type`}><select value={question.type} onChange={(event) => updateQuestion(section.id, question.id, { type: event.target.value })} className="field">{questionTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="Prompt"><textarea value={question.prompt} onChange={(event) => updateQuestion(section.id, question.id, { prompt: event.target.value })} rows={3} className="field" placeholder="Write the student-facing question prompt." /></Field><Field label="Points"><input type="number" min="1" value={question.points} onChange={(event) => updateQuestion(section.id, question.id, { points: Number(event.target.value) })} className="field" /></Field></div><div className="flex gap-2"><button type="button" onClick={() => updateSection(section.id, { questions: [...section.questions.slice(0, questionIndex + 1), { ...question, id: uid("question"), options: question.options.map((option) => ({ ...option, id: uid("option") })) }, ...section.questions.slice(questionIndex + 1)] })} className="rounded-md border border-border px-3 py-2 text-foreground"><Copy className="h-4 w-4" /></button><button type="button" onClick={() => updateSection(section.id, { questions: section.questions.filter((item) => item.id !== question.id) })} className="rounded-md bg-destructive px-3 py-2 text-destructive-foreground"><Trash2 className="h-4 w-4" /></button></div></div>{isPassage ? <Field label="Passage / stimulus / source"><textarea value={question.passage} onChange={(event) => updateQuestion(section.id, question.id, { passage: event.target.value })} rows={4} className="field" placeholder="Paste passage, data description, document source, chart/table text, or stimulus." /></Field> : null}<div className="mt-3 grid gap-3 md:grid-cols-3"><Field label="Correct answer text"><input value={question.correctAnswerText} onChange={(event) => updateQuestion(section.id, question.id, { correctAnswerText: event.target.value })} className="field" placeholder="For numeric, short, essay rubric notes, or fill blank." /></Field><Field label="Difficulty"><input value={question.difficulty} onChange={(event) => updateQuestion(section.id, question.id, { difficulty: event.target.value })} className="field" placeholder="Easy / Medium / Hard" /></Field><label className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-foreground"><input type="checkbox" checked={question.allowCalculator} onChange={(event) => updateQuestion(section.id, question.id, { allowCalculator: event.target.checked })} /> Calculator/formula tools allowed</label></div>{isOptions ? <OptionsEditor section={section} question={question} updateOption={updateOption} updateQuestion={updateQuestion} /> : null}<Field label="Explanation / teacher notes"><textarea value={question.explanation} onChange={(event) => updateQuestion(section.id, question.id, { explanation: event.target.value })} rows={2} className="field" /></Field></div>;
}

function OptionsEditor({ section, question, updateOption, updateQuestion }: { section: Section; question: Question; updateOption: (sectionId: string, questionId: string, optionId: string, patch: Partial<Option>) => void; updateQuestion: (sectionId: string, questionId: string, patch: Partial<Question>) => void }) {
  const max = question.type === "MULTIPLE_SELECT" ? 8 : 6;
  return <div className="my-3 rounded-md border border-border bg-background p-3"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-foreground">Options</p><button type="button" disabled={question.options.length >= max} onClick={() => updateQuestion(section.id, question.id, { options: [...question.options, blankOption(question.options.length + 1)] })} className="rounded-md bg-secondary px-3 py-1 text-sm font-bold text-secondary-foreground disabled:opacity-50">Add option</button></div><div className="mt-3 space-y-2">{question.options.map((option, index) => <div key={option.id} className="grid gap-2 sm:grid-cols-[auto_1fr_auto]"><label className="flex items-center gap-2 text-sm text-foreground"><input type={question.type === "MULTIPLE_SELECT" ? "checkbox" : "radio"} checked={option.isCorrect} onChange={(event) => { if (question.type === "MULTIPLE_CHOICE" || question.type === "PASSAGE_BASED") updateQuestion(section.id, question.id, { options: question.options.map((item) => ({ ...item, isCorrect: item.id === option.id })) }); else updateOption(section.id, question.id, option.id, { isCorrect: event.target.checked }); }} /> Correct</label><input value={option.optionText} onChange={(event) => updateOption(section.id, question.id, option.id, { optionText: event.target.value })} className="field" placeholder={`Option ${index + 1}`} /><button type="button" disabled={question.options.length <= 2} onClick={() => updateQuestion(section.id, question.id, { options: question.options.filter((item) => item.id !== option.id) })} className="rounded-md border border-border px-3 text-sm font-bold text-foreground disabled:opacity-50">Remove</button></div>)}</div></div>;
}

function ExamPreview({ sections, totalPoints }: { sections: Section[]; totalPoints: number }) {
  return <section className="rounded-lg border border-border bg-card p-5 shadow-soft"><div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-semibold text-foreground">Step 4: Preview and Publish</h2><p className="text-sm text-muted-foreground">Student preview hides correct answers and shows timers.</p></div><span className="rounded-md bg-secondary px-3 py-1 text-sm font-bold text-secondary-foreground">{totalPoints} points</span></div><div className="mt-4 space-y-4">{sections.map((section, index) => <article key={section.id} className="rounded-lg border border-border bg-background p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-xs font-bold uppercase tracking-wide text-brand-orange">Section {index + 1}</p><h3 className="text-lg font-semibold text-foreground">{section.title}</h3><p className="text-sm text-muted-foreground">{section.instructions || section.description}</p></div>{section.durationMinutes ? <span className="rounded-md bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">Timer: {section.durationMinutes} min</span> : null}</div><div className="mt-3 space-y-3">{section.questions.map((question, qIndex) => <div key={question.id} className="rounded-md border border-border bg-card p-3"><p className="text-sm font-semibold text-foreground">{qIndex + 1}. {question.prompt || "Untitled question"} <span className="text-muted-foreground">({question.points} pts)</span></p>{question.passage ? <p className="mt-2 whitespace-pre-line rounded-md bg-secondary p-3 text-sm text-secondary-foreground">{question.passage}</p> : null}{["MULTIPLE_CHOICE", "MULTIPLE_SELECT", "PASSAGE_BASED"].includes(question.type) ? <ul className="mt-2 space-y-1 text-sm text-foreground">{question.options.map((option) => <li key={option.id} className="rounded-md border border-border px-3 py-2">○ {option.optionText}</li>)}</ul> : <p className="mt-2 rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">Student answer area</p>}</div>)}</div></article>)}</div></section>;
}
