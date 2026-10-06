const unresolvedActions = new Set([
  "עוד לא ברור לי",
  "לא עכשיו — מעדיף לדלג בשיחה עם המנחה",
  "עדיין לא לבחור צעד",
  "להשאיר את הדברים פתוחים כרגע",
  "עוד לא לבחור צעד / לשנות את המטרה",
]);

// Preserve the original answer, but never present a skipped choice as a commitment.
export function chosenAction(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && !unresolvedActions.has(trimmed) ? trimmed : undefined;
}
