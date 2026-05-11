import { Role } from "@prisma/client";
import { ManagedUser } from "@/lib/users";

export function UserForm({ action, user, options, error }: { action: (formData: FormData) => void | Promise<void>; user?: ManagedUser; options: { schools: { id: string; name: string }[]; classes: { id: string; name: string }[]; students: { id: string; studentNumber: string; legalName: string | null; preferredName: string | null; userId: string | null }[]; roles: Role[] }; error?: string }) {
  return (
    <form action={action} className="space-y-5">
      {user ? <input type="hidden" name="id" value={user.id} /> : null}
      {error ? <div className="rounded-lg border border-error/30 bg-tint-rose p-4 text-sm font-semibold text-error">{error}</div> : null}
      <section className="rounded-lg border border-hairline bg-canvas p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">Account</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Text name="name" label="Name" defaultValue={user?.name} required />
          <Text name="email" label="Email" type="email" defaultValue={user?.email} required />
          {!user ? <Text name="password" label="Temporary password" type="password" /> : null}
          <label className="text-sm font-semibold text-ink">Role<select name="role" defaultValue={user?.role || "TEACHER"} className="mt-2 w-full rounded-md border border-hairline bg-canvas px-3 py-3 text-sm text-ink">{options.roles.map((role) => <option key={role} value={role}>{role}</option>)}</select></label>
          {options.schools.length > 0 ? <label className="text-sm font-semibold text-ink">School<select name="schoolId" defaultValue={user?.schoolId || ""} className="mt-2 w-full rounded-md border border-hairline bg-canvas px-3 py-3 text-sm text-ink"><option value="">Choose school</option>{options.schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}</select></label> : <input type="hidden" name="schoolId" value={user?.schoolId || ""} />}
          <label className="flex items-center gap-2 text-sm font-semibold text-ink"><input type="checkbox" name="isActive" defaultChecked={user?.isActive ?? true} /> Active</label>
          <label className="flex items-center gap-2 text-sm font-semibold text-ink"><input type="checkbox" name="caseManagerApproved" defaultChecked={user?.caseManagerApproved ?? false} /> Case manager approved</label>
        </div>
      </section>
      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-hairline bg-canvas p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Teacher class assignments</h2>
          <div className="mt-4 grid gap-2">
            {options.classes.map((klass) => <label key={klass.id} className="flex items-center gap-2 text-sm text-slate"><input type="checkbox" name="classIds" value={klass.id} defaultChecked={user?.classIds.includes(klass.id)} />{klass.name}</label>)}
            {options.classes.length === 0 ? <p className="text-sm text-slate">No classes available in this school context.</p> : null}
          </div>
        </div>
        <div className="rounded-lg border border-hairline bg-canvas p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Student account link</h2>
          <select name="studentId" defaultValue={user?.studentId || ""} className="mt-4 w-full rounded-md border border-hairline bg-canvas px-3 py-3 text-sm text-ink"><option value="">No linked student</option>{options.students.map((student) => <option key={student.id} value={student.id}>{student.studentNumber} — {student.preferredName || student.legalName || student.id}{student.userId && student.id !== user?.studentId ? " (linked)" : ""}</option>)}</select>
        </div>
      </section>
      <div className="flex justify-end"><button className="rounded-md bg-primary px-5 py-3 text-sm font-bold text-on-primary hover:bg-primary-pressed active:bg-primary-deep">Save User</button></div>
    </form>
  );
}

function Text({ name, label, type = "text", defaultValue, required }: { name: string; label: string; type?: string; defaultValue?: string; required?: boolean }) {
  return <label className="text-sm font-semibold text-ink">{label}<input name={name} type={type} defaultValue={defaultValue} required={required} className="mt-2 w-full rounded-md border border-hairline bg-canvas px-3 py-3 text-sm text-ink" /></label>;
}
