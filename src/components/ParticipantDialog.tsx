import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
export default function ParticipantDialog({
  children,
  labelledBy,
  onClose,
}: {
  children: ReactNode;
  labelledBy: string;
  onClose: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    return () => previous?.focus();
  }, []);
  function handleKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
    if (event.key !== "Tab") return;
    const elements = Array.from(
      panel.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input, textarea, audio[controls], summary, a[href], [tabindex="0"]',
      ) || [],
    );
    const first = elements[0];
    const last = elements[elements.length - 1];
    if (!first) {
      event.preventDefault();
      return;
    }
    if (
      event.shiftKey &&
      (document.activeElement === first ||
        document.activeElement === panel.current)
    ) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey &&
      (document.activeElement === last ||
        document.activeElement === panel.current)
    ) {
      event.preventDefault();
      first.focus();
    }
  }
  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[80] bg-[#060d18]/95 backdrop-blur-md p-5 grid place-items-center"
    >
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onKeyDown={handleKey}
        className="w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-3xl border border-white/15 bg-[#111e30] p-7 md:p-9 outline-none"
      >
        {children}
      </div>
    </div>
  );
}
