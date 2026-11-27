"use client";

import { useActionState, useEffect, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { submitMembershipAction } from "@/server/actions/members";
import type { SubmitState } from "@/lib/validators";

const fieldClass =
  "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function MembershipForm({ wings }: { wings: { id: string; name: string }[] }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<SubmitState, FormData>(submitMembershipAction, {});
  // Controlled values survive React's automatic form reset after a rejected action.
  const [values, setValues] = useState({ name: "", studentId: "", email: "", batch: "", phone: "", wingPrefId: "" });
  const onChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));

  useEffect(() => {
    if (state.memberId) router.push(`/join/${state.memberId}`);
  }, [state.memberId, router]);

  return (
    <form action={action} className="grid gap-5 rounded-xl border border-border bg-card p-5 sm:p-7 md:grid-cols-2">
      <div className="md:col-span-2">
        <label htmlFor="name" className="text-sm font-medium">
          Full name
        </label>
        <input
          id="name"
          name="name"
          autoComplete="name"
          required
          minLength={2}
          maxLength={100}
          value={values.name}
          onChange={onChange}
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="studentId" className="text-sm font-medium">
          DIU SWE student ID
        </label>
        <input
          id="studentId"
          name="studentId"
          placeholder="221-35-123"
          required
          value={values.studentId}
          onChange={onChange}
          className={fieldClass}
        />
        <p className="mt-1 text-xs text-muted-foreground">Format XXX-35-XXX</p>
      </div>
      <div>
        <label htmlFor="email" className="text-sm font-medium">
          Institutional email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@diu.edu.bd"
          required
          value={values.email}
          onChange={onChange}
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="batch" className="text-sm font-medium">
          Batch <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <input id="batch" name="batch" maxLength={10} value={values.batch} onChange={onChange} className={fieldClass} />
      </div>
      <div>
        <label htmlFor="phone" className="text-sm font-medium">
          Phone <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <input id="phone" name="phone" type="tel" maxLength={20} value={values.phone} onChange={onChange} className={fieldClass} />
      </div>
      <div className="md:col-span-2">
        <label htmlFor="wingPrefId" className="text-sm font-medium">
          Preferred wing <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <select id="wingPrefId" name="wingPrefId" value={values.wingPrefId} onChange={onChange} className={fieldClass}>
          <option value="">No preference yet</option>
          {wings.map((wing) => (
            <option key={wing.id} value={wing.id}>
              {wing.name}
            </option>
          ))}
        </select>
      </div>
      {state.error ? (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive md:col-span-2">
          {state.error}
        </p>
      ) : null}
      <div className="md:col-span-2">
        <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Submitting…" : "Apply and get my ID card"}
        </Button>
      </div>
    </form>
  );
}
