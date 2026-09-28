import { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { budgetOptions, problemPlaceholders, timelineOptions } from "@/content/site";
import { cn } from "@/lib/utils";
import { rgba, spread } from "@/lib/spectrum";

type Status = "idle" | "loading" | "success" | "error" | "limited";

/** Each field focuses in its own spectrum colour, in form order. */
const FIELD_COLORS = spread(7);

const fieldClass =
  "w-full rounded-lg border border-field-border bg-surface-1 px-3 py-2.5 text-body-sm text-ink placeholder:text-ink-tertiary outline-none transition-[border-color,box-shadow] focus:border-[var(--field)] focus:shadow-[0_0_0_3px_var(--field-ring)] aria-invalid:border-red-500/70";

/** Aceternity: Signup Form + Placeholders & Vanish Input + Stateful Button. */
export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [problem, setProblem] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  // When the form appeared; the API drops submissions that come back implausibly fast.
  // Recorded after mount: a render-time value would be baked into the prerendered HTML at build time.
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);
  const formRef = useRef<HTMLFormElement>(null);

  // After the server rejects fields, move focus to the first one (errors are rendered by now)
  useEffect(() => {
    if (Object.keys(errors).length === 0) return;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [errors]);

  // Cycle the problem placeholder while the field is empty.
  useEffect(() => {
    if (problem) return;
    const id = setInterval(() => setPlaceholderIndex((i) => (i + 1) % problemPlaceholders.length), 3500);
    return () => clearInterval(id);
  }, [problem]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = { ...Object.fromEntries(new FormData(form).entries()), started_at: startedAt.current };
    setStatus("loading");
    setErrors({});
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.status === 422) {
        setErrors((await res.json()).errors ?? {});
        setStatus("idle");
        return;
      }
      if (res.status === 429) {
        setStatus("limited");
        return;
      }
      if (!res.ok) throw new Error();
      setStatus("success");
      form.reset();
      setProblem("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      noValidate
      className="flex w-full flex-col gap-4 rounded-2xl border border-hairline-strong bg-surface-2 p-5 shadow-[0_24px_48px_rgba(0,0,0,0.5)] sm:p-7 lg:w-[500px] lg:shrink-0"
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-body text-ink">Tell us what you’re trying to solve.</p>
        <span className="text-mono whitespace-nowrap text-ink-tertiary">~2 min</span>
      </div>

      {/* Spam trap: a field only bots fill in (the render time is added on submit) */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Leave this empty
          <input name="company_url" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Name" name="name" color={FIELD_COLORS[0]} error={errors.name}>
          <input
            name="name"
            autoComplete="name"
            placeholder="Your name"
            className={fieldClass}
            aria-required
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
        </Field>
        <Field label="Email" name="email" color={FIELD_COLORS[1]} error={errors.email}>
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@organization.com"
            className={fieldClass}
            aria-required
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
        </Field>
      </div>

      <Field label="Organization" name="organization" color={FIELD_COLORS[2]} error={errors.organization}>
        <input
          name="organization"
          autoComplete="organization"
          placeholder="Where you work"
          className={fieldClass}
          aria-required
          aria-invalid={!!errors.organization}
          aria-describedby={errors.organization ? "organization-error" : undefined}
        />
      </Field>

      <Field label="What are you trying to solve?" name="problem" color={FIELD_COLORS[3]} error={errors.problem}>
        <div className="relative">
          <textarea
            name="problem"
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            rows={4}
            className={cn(fieldClass, "h-[104px] resize-none")}
            aria-required
            aria-invalid={!!errors.problem}
            aria-describedby={errors.problem ? "problem-error" : undefined}
          />
          <AnimatePresence mode="wait">
            {!problem && (
              <motion.span
                key={placeholderIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="pointer-events-none absolute top-2.5 right-3 left-3 text-body-sm text-ink-tertiary"
              >
                {problemPlaceholders[placeholderIndex]}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Website" name="website" color={FIELD_COLORS[4]} optional error={errors.website}>
          <input name="website" type="url" placeholder="https://" className={fieldClass}
            aria-invalid={!!errors.website}
            aria-describedby={errors.website ? "website-error" : undefined}
          />
        </Field>
        <Field label="Timeline" name="timeline" color={FIELD_COLORS[5]} optional error={errors.timeline}>
          <Select name="timeline" placeholder="Select" options={timelineOptions} />
        </Field>
      </div>

      <Field label="Budget / project range" name="budget" color={FIELD_COLORS[6]} optional error={errors.budget}>
        <Select name="budget" placeholder="Select a range" options={budgetOptions} />
      </Field>

      <button
        type="submit"
        disabled={status === "loading" || status === "success"}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm leading-[1.2] font-medium text-on-accent transition-colors",
          status === "success" ? "bg-success-solid" : "bg-accent hover:bg-accent-pressed",
          status === "loading" && "cursor-wait opacity-80",
        )}
      >
        {status === "loading" && (
          <span className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />
        )}
        {status === "success" ? (
          <>
            Thanks, we’ll be in touch <span aria-hidden>✓</span>
          </>
        ) : status === "loading" ? (
          "Sending…"
        ) : (
          <>
            Start a conversation <span aria-hidden>→</span>
          </>
        )}
      </button>

      <p className="text-center text-caption text-ink-tertiary" aria-live="polite">
        {status === "success"
          ? "Message sent. We’ll reply by email."
          : status === "error"
          ? "Something went wrong. Please try again."
          : status === "limited"
            ? "You’ve sent a few messages already. Please try again later."
          : "We read every message. No package sales on the first call."}
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  color,
  optional,
  error,
  children,
}: {
  label: string;
  /** Field name; the error message gets id `${name}-error` for aria-describedby. */
  name: string;
  color: [number, number, number];
  optional?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label
      className="flex min-w-0 flex-col gap-1.5"
      style={{ "--field": rgba(color), "--field-ring": rgba(color, 0.35) } as CSSProperties}
    >
      <span className="flex gap-1.5 text-caption">
        <span className="text-ink-muted">{label}</span>
        {optional && <span className="text-ink-tertiary">optional</span>}
      </span>
      {children}
      {error && (
        <span id={`${name}-error`} className="text-caption text-red-400">
          {error}
        </span>
      )}
    </label>
  );
}

/**
 * Custom dropdown (no native <select>): a field-styled trigger and an animated
 * listbox. Keyboard: ↑/↓ move, Enter/Space choose, Home/End, Esc closes, typing
 * a letter jumps to the first match. A hidden input carries the value into the
 * form, and it clears when the form resets.
 */
function Select({ name, placeholder, options }: { name: string; placeholder: string; options: string[] }) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const hidden = useRef<HTMLInputElement>(null);
  const listId = useId();

  // Close when clicking anywhere else
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  // form.reset() doesn't touch React state, so listen for it
  useEffect(() => {
    const form = hidden.current?.form;
    if (!form) return;
    const onReset = () => setValue("");
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, []);

  // Open upward when the viewport has no room below the trigger
  const [dropUp, setDropUp] = useState(false);
  const openList = () => {
    const rect = root.current?.getBoundingClientRect();
    if (rect) {
      const listHeight = options.length * 40 + 16;
      const below = window.innerHeight - rect.bottom;
      setDropUp(below < listHeight && rect.top > below);
    }
    setActive(Math.max(0, options.indexOf(value)));
    setOpen(true);
  };
  const choose = (i: number) => {
    setValue(options[i]);
    setOpen(false);
  };

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    const last = options.length - 1;
    switch (e.key) {
      case "ArrowDown":
      case "ArrowUp": {
        e.preventDefault();
        if (!open) return openList();
        const step = e.key === "ArrowDown" ? 1 : -1;
        setActive((i) => Math.min(last, Math.max(0, i + step)));
        return;
      }
      case "Home":
      case "End":
        if (!open) return;
        e.preventDefault();
        setActive(e.key === "Home" ? 0 : last);
        return;
      case "Enter":
      case " ":
        e.preventDefault();
        if (open) choose(active);
        else openList();
        return;
      case "Escape":
        if (open) {
          e.preventDefault();
          e.stopPropagation();
          setOpen(false);
        }
        return;
      case "Tab":
        setOpen(false);
        return;
      default:
        // Type-to-jump
        if (e.key.length === 1) {
          const match = options.findIndex((o) => o.toLowerCase().startsWith(e.key.toLowerCase()));
          if (match >= 0) {
            if (!open) setOpen(true);
            setActive(match);
          }
        }
    }
  }

  return (
    <div ref={root} className="relative">
      <input ref={hidden} type="hidden" name={name} value={value} />
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={cn(
          fieldClass,
          "flex items-center justify-between gap-2 text-left",
          !value && "text-ink-tertiary",
          open && "border-[var(--field)] shadow-[0_0_0_3px_var(--field-ring)]",
        )}
      >
        <span className="truncate">{value || placeholder}</span>
        <svg
          aria-hidden
          viewBox="0 0 12 12"
          className={cn("size-3 shrink-0 text-ink-tertiary transition-transform duration-200", open && "rotate-180")}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 4.5 6 7.5 9 4.5" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            id={listId}
            role="listbox"
            initial={{ opacity: 0, y: dropUp ? 4 : -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: dropUp ? 4 : -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute inset-x-0 z-30 overflow-hidden rounded-lg border border-hairline-strong bg-surface-3 p-1 shadow-[0_16px_32px_rgba(0,0,0,0.55)]",
              dropUp ? "bottom-full mb-1.5 origin-bottom" : "top-full mt-1.5 origin-top",
            )}
          >
            {options.map((option, i) => {
              const selected = option === value;
              return (
                <li
                  key={option}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={selected}
                  onPointerEnter={() => setActive(i)}
                  // Keep focus on the trigger so the keyboard keeps working
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    // The field is wrapped in a <label>, which would forward this click to the trigger and reopen it
                    e.preventDefault();
                    choose(i);
                  }}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-3 rounded-md px-2.5 py-2 text-body-sm transition-colors",
                    // Highlight in the field's own spectrum colour (--field, set by <Field>)
                    i === active
                      ? "bg-[color-mix(in_srgb,var(--field)_16%,transparent)] text-[var(--field)]"
                      : "text-ink-muted",
                  )}
                >
                  <span>{option}</span>
                  {selected && (
                    <span aria-hidden className="text-[var(--field)]">
                      ✓
                    </span>
                  )}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
