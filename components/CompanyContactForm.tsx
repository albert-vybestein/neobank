"use client";

import { FormEvent, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/http-client";
import { trackEvent } from "@/lib/analytics";
import { contactSubmissionSchema } from "@/lib/validation";

type ContactFormState = {
  name: string;
  email: string;
  message: string;
  website: string;
};

type FieldErrors = Partial<Record<keyof ContactFormState, string>>;

type ContactApiResponse = {
  ok: boolean;
  id: string;
  receivedAt: string;
};

const initialState: ContactFormState = {
  name: "",
  email: "",
  message: "",
  website: ""
};

export function CompanyContactForm() {
  const [values, setValues] = useState<ContactFormState>(initialState);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  const canSubmit = useMemo(
    () => values.name.trim().length > 1 && values.email.trim().length > 3 && values.message.trim().length > 9,
    [values.email, values.message, values.name]
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("idle");
    setMessage("");

    const parsed = contactSubmissionSchema.safeParse(values);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        name: fieldErrors.name?.[0],
        email: fieldErrors.email?.[0],
        message: fieldErrors.message?.[0]
      });
      return;
    }

    setErrors({});
    setStatus("loading");

    try {
      const response = await postJson<typeof parsed.data, ContactApiResponse>("/api/contact", parsed.data);

      setStatus("success");
      setValues(initialState);
      setMessage("Thanks. Your message was sent. Our team will respond by email.");
      void trackEvent("contact_submitted", { submissionId: response.id });
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit} noValidate>
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-slate-700">
          Name
        </label>
        <input
          id="name"
          type="text"
          value={values.name}
          onChange={(event) => setValues((prev) => ({ ...prev, name: event.target.value }))}
          className="h-11 w-full rounded-2xl border border-border bg-white px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="Your name"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "name-error" : undefined}
          autoComplete="name"
          required
        />
        {errors.name ? <p id="name-error" className="text-sm text-rose-600">{errors.name}</p> : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={values.email}
          onChange={(event) => setValues((prev) => ({ ...prev, email: event.target.value }))}
          className="h-11 w-full rounded-2xl border border-border bg-white px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="you@company.com"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          autoComplete="email"
          required
        />
        {errors.email ? <p id="email-error" className="text-sm text-rose-600">{errors.email}</p> : null}
      </div>

      <div className="space-y-2 md:col-span-2">
        <label htmlFor="message" className="text-sm font-medium text-slate-700">
          Message
        </label>
        <textarea
          id="message"
          rows={5}
          value={values.message}
          onChange={(event) => setValues((prev) => ({ ...prev, message: event.target.value }))}
          className="w-full rounded-2xl border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="Tell us about your partnership, hiring, or enterprise needs"
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "message-error" : undefined}
          required
        />
        {errors.message ? <p id="message-error" className="text-sm text-rose-600">{errors.message}</p> : null}
      </div>

      <div className="sr-only" aria-hidden>
        <label htmlFor="website">Website</label>
        <input
          id="website"
          type="text"
          name="website"
          value={values.website}
          onChange={(event) => setValues((prev) => ({ ...prev, website: event.target.value }))}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="md:col-span-2">
        <Button type="submit" className="w-full sm:w-auto" disabled={status === "loading" || !canSubmit}>
          {status === "loading" ? "Sending..." : "Send message"}
        </Button>
      </div>

      <p aria-live="polite" className={`text-sm md:col-span-2 ${status === "error" ? "text-rose-600" : "text-emerald-700"}`}>
        {message}
      </p>
    </form>
  );
}
