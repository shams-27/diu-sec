"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import { Button } from "@/frontend/shared/ui/button";
import { HoneypotField } from "@/frontend/shared/form/honeypot-field";
import type { ContactState } from "@/backend/shared/validators";
import { submitContactAction } from "@/server/actions/contact";

const fieldClass =
  "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ContactForm() {
  const [state, action, pending] = useActionState<ContactState, FormData>(submitContactAction, {});
  const [values, setValues] = useState({ name: "", email: "", message: "" });
  const onChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));

  if (state.sent) {
    return (
      <p role="status" className="rounded-xl border border-primary/40 bg-card p-6 text-sm font-medium text-primary">
        Thanks — your message is with the club team.
      </p>
    );
  }

  return (
    <form action={action} className="grid gap-5 rounded-xl border border-border bg-card p-5 sm:p-7">
      <HoneypotField id="contact-website" />
      <div>
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
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={values.email}
          onChange={onChange}
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="message" className="text-sm font-medium">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          required
          minLength={10}
          maxLength={2000}
          value={values.message}
          onChange={onChange}
          className={fieldClass}
        />
      </div>
      {state.error ? (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
