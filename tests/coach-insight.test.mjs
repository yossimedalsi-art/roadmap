import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const directory = mkdtempSync(join(tmpdir(), "msa-insight-"));
for (const [file, name] of [
  ["../src/data/journey.ts", "journey"],
  ["../src/lib/coachInsight.ts", "coachInsight"],
]) {
  const output = ts
    .transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2023,
      },
    })
    .outputText.replace(
      /from ["']\.\.\/data\/journey["']/g,
      'from "./journey.mjs"',
    );
  writeFileSync(join(directory, `${name}.mjs`), output);
}
after(() => rmSync(directory, { recursive: true, force: true }));
const data = await import(pathToFileURL(join(directory, "journey.mjs")));
const { getCoachInsight, getCoachQuestions } = await import(
  pathToFileURL(join(directory, "coachInsight.mjs"))
);
const steps = [
  ...data.journeyPhases,
  ...data.stage2Phases,
  ...data.stage3Phases,
  ...data.stage4Phases,
];
const step = (id) => steps.find((item) => item.id === id);

test("insights explain a relationship instead of repeating an answer or deepening question", () => {
  for (const item of steps.filter((item) => item.options)) {
    const explanations = item.options.clouds.map((answer) => {
      const result = getCoachInsight({ step: item, answer });
      assert.ok(result.explanation.length > 60, item.id);
      assert.ok(!result.explanation.includes(`״${answer}״`));
      for (const question of item.coachDeepeningQuestions)
        assert.ok(!result.explanation.includes(question));
      assert.equal(
        item.patternRevealed.clouds[item.options.clouds.indexOf(answer)],
        result.explanation,
      );
      return result.explanation;
    });
    assert.equal(
      new Set(explanations).size,
      4,
      `${item.id} must distinguish answer meanings`,
    );
  }
});

test("distance insight names immediate gain and possible later cost without asserting cause", () => {
  const result = getCoachInsight({
    step: step("step_5_urge"),
    answer: "התרחקתי או רציתי להתרחק",
  });
  assert.match(result.explanation, /עשויה להפחית/);
  assert.match(result.explanation, /הקלה המיידית והמחיר בהמשך/);
  assert.doesNotMatch(result.explanation, /בילדות|ההורים שלך|אבחנ/);
});

test("explicit earlier answers can reveal a possible reinforcing loop; unrelated text cannot", () => {
  const item = step("step_7_protection");
  const base = getCoachInsight({ step: item, answer: item.options.clouds[0] });
  const linked = getCoachInsight({
    step: item,
    answer: item.options.clouds[0],
    answers: {
      step_6_thought: "אולי לא יקבלו אותי",
      step_5_urge: "התרחקתי או רציתי להתרחק",
    },
  });
  assert.notEqual(base.explanation, linked.explanation);
  assert.match(linked.explanation, /לחזק שוב את החשש המקורי/);
  assert.match(linked.evidence, /הפירוש שנאמר/);
  const custom = getCoachInsight({
    step: item,
    answer: item.options.clouds[0],
    answers: {
      step_6_thought: "לא חששתי שלא יקבלו אותי",
      step_5_urge: "בחרתי להתרחק כדי לנוח",
    },
  });
  assert.equal(custom.explanation, base.explanation);
});

test("personal or skipped answers never inherit a preselected mechanism interpretation", () => {
  const item = step("step_6_thought");
  const personal = getCoachInsight({
    step: item,
    answer: "לא פחדתי מדחייה, רציתי לנוח",
  });
  assert.equal(personal.kind, "clarification");
  assert.match(personal.explanation, /אין להתאים לה אוטומטית/);
  const skipped = getCoachInsight({
    step: item,
    answer: "לא עכשיו — מעדיף לדלג בשיחה עם המנחה",
  });
  assert.equal(skipped.kind, "clarification");
  assert.doesNotMatch(skipped.explanation, /התחייב|הסכם/);
  assert.equal(getCoachInsight({ step: item }), undefined);
});

test("verified canonical pattern supplies a frame, never a diagnosis or character-based inference", () => {
  const item = step("step_7_protection");
  const input = { step: item, answer: item.options.clouds[1] };
  const generic = getCoachInsight(input);
  const verified = getCoachInsight({ ...input, mechanism: { title: "ריצוי" } });
  assert.equal(generic.explanation, verified.explanation);
  assert.equal(verified.title, "כיוון לבדיקה בתוך ״ריצוי״");
  assert.doesNotMatch(generic.title, /ריצוי/);
});

test("experiential permission only describes present readiness, never completed release", () => {
  const item = step("s3_step_6_meditation_release");
  const noConsent = getCoachInsight({ step: item });
  assert.equal(noConsent.kind, "readiness");
  assert.match(noConsent.explanation, /לא תועדה הסכמה/);
  const consent = getCoachInsight({
    step: item,
    answers: { meditation_permission: "מתאים לי להמשיך עם המנחה" },
  });
  assert.match(consent.explanation, /אינה מוכיחה סילוק/);
  assert.match(consent.nextFocus, /אפשרות עצירה/);
});

test("visible progress cannot substitute for independent motive", () => {
  const item = step("s4_step_6_action");
  const result = getCoachInsight({
    step: item,
    answer: item.options.clouds[0],
    answers: { s4_step_3_blocker_impact: "אני פועל בעיקר כדי לקבל אישור" },
  });
  assert.match(result.explanation, /גם פעולה שנראית כהתקדמות/);
  assert.match(result.explanation, /גם כאשר אחרים אינם משבחים/);
});

test("answered emotion prompts explore meaning and action, unknown answers do not force an explanation", () => {
  const questions = getCoachQuestions(step("step_3_feeling"), "כעס או תסכול");
  assert.match(questions[0], /גבול, רצון או ציפייה/);
  assert.doesNotMatch(questions.join(" "), /איך אתה מתאר|עוד רגשות/);
  assert.equal(
    getCoachQuestions(step("step_3_feeling"), "קשה לי לזהות כרגע").length,
    1,
  );
  assert.match(
    getCoachQuestions(step("step_3_feeling"), "פחד או דאגה")[0],
    /מה חששת שיקרה/,
  );
});
