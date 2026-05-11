import Link from "next/link";
import { createStudent, softDeleteStudent, updateStudent } from "@/app/dashboard/students/actions";
import { formatEnumLabel } from "@/lib/students";
import { canManageSensitiveStudentDocuments } from "@/lib/rbac";
import { genders, refugeeDocumentTypes, roles, SchoolClassOption, StudentRecord, studentStatuses } from "@/lib/types";

type StudentFormProps = {
  mode: "create" | "edit";
  student?: StudentRecord;
  currentRole: (typeof roles)[number];
  classOptions: SchoolClassOption[];
};

export function StudentForm({ mode, student, currentRole, classOptions }: StudentFormProps) {
  const canManageDocuments = canManageSensitiveStudentDocuments(currentRole);
  const actionLabel = mode === "create" ? "Add Student" : "Save Changes";

  const formAction = mode === "create" ? createStudent : updateStudent.bind(null, student?.id || "");
  const deleteAction = student ? softDeleteStudent.bind(null, student.id) : undefined;

  return (
    <form action={formAction} className="space-y-5">
      <FormSection title="Student Details" description="Core record fields used by teachers, administrators, and reports.">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Student number" name="studentNumber" defaultValue={student?.studentNumber} required />
          <TextField label="Legal name" name="legalName" defaultValue={student?.legalName} required />
          <TextField label="Preferred name" name="preferredName" defaultValue={student?.preferredName} />
          <TextField label="Date of birth" name="dateOfBirth" type="date" defaultValue={student?.dateOfBirth} />
          <SelectField label="Gender" name="gender" defaultValue={student?.gender || "NOT_SPECIFIED"} options={genders} />
          <SelectField label="Status" name="status" defaultValue={student?.status || "ACTIVE"} options={studentStatuses} />
          <SelectField label="Class" name="classId" defaultValue={student?.classId || classOptions[0]?.id} options={classOptions.map((item) => item.id)} labels={Object.fromEntries(classOptions.map((item) => [item.id, item.name]))} />
          <TextField label="Primary language" name="primaryLanguage" defaultValue={student?.primaryLanguage} />
        </div>
        <div className="mt-4">
          <label htmlFor="photo" className="text-sm font-semibold text-ink">
            Student photo
          </label>
          <input id="photo" name="photo" type="file" accept="image/*" className="mt-2 w-full rounded-md border border-hairline bg-canvas px-3 py-3 text-sm text-slate file:mr-4 file:rounded-md file:border-0 file:bg-ink file:px-3 file:py-2 file:text-sm file:font-semibold file:text-on-dark" />
          <p className="mt-2 text-xs leading-5 text-slate">Photo storage is not implemented yet; this file input is intentionally not persisted until object storage is configured.</p>
        </div>
      </FormSection>

      <FormSection title="Guardian Information" description="Primary family or caregiver contact for school communication.">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Guardian name" name="guardianName" defaultValue={student?.guardianName} />
          <TextField label="Relationship" name="guardianRelationship" defaultValue={student?.guardianRelationship} />
          <TextField label="Guardian phone" name="guardianPhone" defaultValue={student?.guardianPhone} />
          <TextField label="Guardian email" name="guardianEmail" type="email" defaultValue={student?.guardianEmail} />
        </div>
        <label htmlFor="homeAddress" className="mt-4 block text-sm font-semibold text-ink">
          Home address
        </label>
        <textarea id="homeAddress" name="homeAddress" defaultValue={student?.homeAddress} rows={3} className="mt-2 w-full rounded-md border border-hairline bg-canvas px-3 py-3 text-sm text-ink outline-none ring-primary/20 focus:ring-4" />
      </FormSection>

      <FormSection title="Emergency Contact" description="Backup contact details for urgent school situations.">
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField label="Contact name" name="emergencyContactName" defaultValue={student?.emergencyContactName} />
          <TextField label="Phone" name="emergencyContactPhone" defaultValue={student?.emergencyContactPhone} />
          <TextField label="Relationship" name="emergencyRelationship" defaultValue={student?.emergencyRelationship} />
        </div>
      </FormSection>

      <FormSection
        title="Refugee Document Fields"
        description={canManageDocuments ? "Optional sensitive fields for authorized administrators only." : "Sensitive document fields are hidden for this role."}
      >
        {canManageDocuments ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="UNHCR status" name="unhcrStatus" defaultValue={student?.unhcrStatus} />
            <SelectField label="Document type" name="documentType" defaultValue={student?.documentType || ""} options={["", ...refugeeDocumentTypes]} labels={{ "": "Not recorded" }} />
            <TextField label="Document number" name="documentNumber" defaultValue={student?.documentNumber} />
            <TextField label="Expiry date" name="documentExpiryDate" type="date" defaultValue={student?.documentExpiryDate} />
          </div>
        ) : (
          <div className="rounded-md border border-hairline bg-surface p-4 text-sm leading-6 text-slate">Your current role can manage general student records but cannot view or edit refugee document identifiers.</div>
        )}
      </FormSection>

      {mode === "edit" ? (
        <div className="rounded-lg border border-error/30 bg-tint-rose p-5">
          <h2 className="text-base font-semibold text-error">Soft Delete</h2>
          <p className="mt-2 text-sm leading-6 text-error">
            Soft delete marks the student as deleted with `deleted_at` while preserving audit history and related records.
          </p>
          <button formAction={deleteAction} className="mt-4 rounded-md border border-error/45 px-4 py-2 text-sm font-semibold text-error hover:bg-canvas">
            Soft Delete Student
          </button>
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href={student ? `/dashboard/students/${student.id}` : "/dashboard/students"} className="inline-flex justify-center rounded-md border border-hairline bg-canvas px-4 py-3 text-sm font-semibold text-ink hover:bg-surface">
          Cancel
        </Link>
        <button className="inline-flex justify-center rounded-md bg-ink px-4 py-3 text-sm font-bold text-on-dark hover:bg-slate">
          {actionLabel}
        </button>
      </div>
    </form>
  );
}

function FormSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-hairline bg-canvas p-5 shadow-soft">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate">{description}</p>
      </div>
      {children}
    </section>
  );
}

function TextField({ label, name, type = "text", defaultValue, required }: { label: string; name: string; type?: string; defaultValue?: string; required?: boolean }) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-semibold text-ink">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className="mt-2 w-full rounded-md border border-hairline bg-canvas px-3 py-3 text-sm text-ink outline-none ring-primary/20 placeholder:text-slate/55 focus:ring-4"
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
  labels = {}
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: readonly string[];
  labels?: Record<string, string>;
}) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-semibold text-ink">
        {label}
      </label>
      <select id={name} name={name} defaultValue={defaultValue} className="mt-2 w-full rounded-md border border-hairline bg-canvas px-3 py-3 text-sm text-ink outline-none ring-primary/20 focus:ring-4">
        {options.map((option) => (
          <option key={option} value={option}>
            {labels[option] || formatEnumLabel(option)}
          </option>
        ))}
      </select>
    </div>
  );
}
