import { useEffect, type RefObject } from "react";

export function useDialogFocus(
  open: boolean,
  ref: RefObject<HTMLDivElement | null>,
  close: () => void,
) {
  useEffect(() => {
    if (!open || !ref.current) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    const selector =
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]';
    const controls = () =>
      Array.from(dialog.querySelectorAll<HTMLElement>(selector));
    controls()[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
      if (event.key !== "Tab") return;
      const items = controls();
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    dialog.addEventListener("keydown", onKey);
    return () => {
      dialog.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [open, ref, close]);
}
