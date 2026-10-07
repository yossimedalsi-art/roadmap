import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const temporary = mkdtempSync(join(tmpdir(), "msa-summary-"));
for (const [folder, name] of [
  ["data", "mechanisms"],
  ["data", "worlds"],
  ["lib", "journeyAnswers"],
  ["lib", "sessionSummary"],
  ["lib", "summaryPrint"],
  ["data", "journey"],
  ["lib", "participantScreen"],
]) {
  const output = ts.transpileModule(
    readFileSync(
      new URL(`../src/${folder}/${name}.ts`, import.meta.url),
      "utf8",
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2023,
      },
    },
  ).outputText;
  writeFileSync(
    join(temporary, `${name}.mjs`),
    output.replace(
      /from ["'](?:\.\.\/data\/|\.\/)(mechanisms|worlds|journeyAnswers|sessionSummary|journey)["']/g,
      'from "./$1.mjs"',
    ),
  );
}
after(() => rmSync(temporary, { recursive: true, force: true }));
const { buildSessionSummary } = await import(
  pathToFileURL(join(temporary, "sessionSummary.mjs"))
);
const { summaryPrintHtml } = await import(
  pathToFileURL(join(temporary, "summaryPrint.mjs"))
);
const { resolveParticipantScreen, eventAnswerKey, eventChoices } = await import(
  pathToFileURL(join(temporary, "participantScreen.mjs"))
);

test("all stages produce an automatic task without an approval field", () => {
  const tasks = [1, 2, 3, 4].map((journeyStage) =>
    buildSessionSummary({ journeyStage, mechanismId: "perfectionism" }),
  );
  assert.equal(new Set(tasks.map((summary) => summary.homework)).size, 4);
  for (const summary of tasks) {
    assert.ok(summary.homework.length > 70);
    assert.ok(summary.reflection);
  }
  assert.match(tasks[0].homework, /אין צורך לשנות/);
  assert.match(tasks[1].homework, /הסבר אפשרי נוסף/);
  assert.match(tasks[2].practice.review, /עבודת העומק ממשיכים עם המנחה/);
});
test("different session choices produce different exercises in the same stage", () => {
  const request = buildSessionSummary({
    journeyStage: 2,
    answers: { s2_step_8_new_action: "להגיד בקשה או גבול במילים שלי" },
  });
  const experiment = buildSessionSummary({
    journeyStage: 2,
    answers: { s2_step_8_new_action: "לעשות צעד לכיוון משהו שאני רוצה" },
  });
  assert.notEqual(request.homework, experiment.homework);
  assert.match(request.homework, /אמור בקשה או גבול/);
  assert.match(experiment.homework, /פעולה של חמש דקות/);
  const time = buildSessionSummary({
    journeyStage: 4,
    answers: { s4_step_6_action: "זמן קצר שאקדיש לדבר שבחרתי" },
  });
  const help = buildSessionSummary({
    journeyStage: 4,
    answers: { s4_step_6_action: "בקשת עזרה או מידע שחסר לי" },
  });
  assert.notEqual(time.homework, help.homework);
});
test("integration includes the actual new quality and support, while skipped depth never becomes release", () => {
  const session = {
    journeyStage: 3,
    resourceArchetype: "power_listen",
    answers: {
      meditation_permission: "מתאים לי להמשיך עם המנחה",
      new_quality: "בחירה מתוך הרצון שלי",
      s3_step_9_new_contract: "לתת יותר מקום לרצון שלי לצד הפחד",
    },
  };
  const summary = buildSessionSummary(session);
  assert.match(summary.homework, /בחירה מתוך הרצון שלי/);
  assert.match(summary.homework, /מה היית רוצה אם לא היית צריך להוכיח/);
  assert.doesNotMatch(summary.reflection, /הדפוס סולק/);
  const skipped = buildSessionSummary({
    ...session,
    answers: { ...session.answers, meditation_permission: "לא עכשיו" },
  });
  assert.match(skipped.practice.review, /עבודת העומק ממשיכים עם המנחה/);
  assert.doesNotMatch(skipped.homework, /האיכות שבחרת/);
});
test("manual adjustment replaces the automatic task without approval, old approval metadata does not block it", () => {
  const text = "לפני בקשה אחת השבוע אבדוק מה אני רוצה";
  const summary = buildSessionSummary({
    answers: {
      homework_proposal: text,
      homework_proposal_id: "new",
      homework_approved_id: "old",
      homework_confirmation: "none",
    },
  });
  assert.equal(summary.homework, text);
  const reset = buildSessionSummary({
    answers: { homework_proposal: "", homework: "" },
  });
  assert.match(reset.homework, /בשני רגעים השבוע/);
});
test("the core loop has exactly four parts; uncaptured feeling is not invented from a need", () => {
  const result = buildSessionSummary({
    journeyStage: 2,
    trigger: "חבר ביקש עזרה",
    answers: {
      s2_step_3_interpretation: "חששתי שיכעס",
      s2_step_5_reaction: "אמרתי כן",
      s2_step_4_sensitive_spot: "לשמור על קשר",
      loop_consequence: "אחרי",
      loop_result_meaning: "אחר כך",
      session_takeaway: "אפשר לבדוק גם מה אני רוצה",
    },
  });
  assert.deepEqual(
    result.loop.map((part) => part.id),
    ["event", "meaning", "emotion", "reaction"],
  );
  assert.equal(result.loop[2].value, undefined);
  assert.equal(result.takeaway, "אפשר לבדוק גם מה אני רוצה");
  assert.equal(
    buildSessionSummary({
      journeyStage: 4,
      answers: { s4_step_6_action: "להתחיל מחר" },
    }).loop[3].value,
    undefined,
  );
});
test("print document contains the entire summary and escapes participant text", () => {
  const html = summaryPrintHtml({
    journeyStage: 1,
    mechanismId: "people-pleasing",
    trigger: '<script>alert("x")</script>',
    answers: {
      step_6_thought: "אולי לא יקבלו אותי",
      step_3_feeling: "כעס או תסכול",
      step_5_urge: "הסכמתי למרות שרציתי אחרת",
      session_takeaway: "אפשר לבחור",
    },
  });
  for (const value of [
    "ריצוי",
    "המעגל שביררנו",
    "מה לקחנו להמשך",
    "התרגול שלי לשבוע",
    "אפשר לבחור",
    "למפגש הבא",
  ])
    assert.ok(html.includes(value), value);
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(!html.includes("<script>"));
  assert.doesNotMatch(html, /overflow:\s*hidden|height:\s*100vh/);
});
test("actual phase overrides stale metadata for events and meditation", () => {
  assert.equal(
    resolveParticipantScreen({
      journeyStage: 3,
      phase: 2,
      answers: { participant_screen: "question" },
    }),
    "event",
  );
  assert.equal(
    resolveParticipantScreen({
      journeyStage: 3,
      phase: 7,
      answers: { participant_screen: "event" },
    }),
    "meditation",
  );
  assert.equal(
    resolveParticipantScreen({ status: "completed", phase: 7 }),
    "summary",
  );
  assert.equal(
    resolveParticipantScreen({
      phase: 0,
      answers: { participant_screen: "world" },
    }),
    "world",
  );
  assert.equal(eventAnswerKey(3), "s3_step_1_trigger");
  assert.deepEqual(eventChoices({}), []);
  assert.ok(
    eventChoices({
      environment: "fairies",
      archetype: "perfection_fairy",
      isYouthMode: true,
    }).length > 0,
  );
  assert.deepEqual(
    eventChoices({
      environment: "fairies",
      archetype: "perfection_fairy",
      isYouthMode: true,
      mechanismId: "people-pleasing",
    }),
    eventChoices({
      environment: "fairies",
      archetype: "perfection_fairy",
      isYouthMode: true,
    }),
  );
});

test("final observation choice does not turn an earlier action into compulsory practice", () => {
  const session = {
    journeyStage: 2,
    answers: {
      s2_step_8_new_action: "להגיד בקשה או גבול במילים שלי",
      choice_moment: "בינתיים רוצה רק להתבונן",
    },
  };
  assert.doesNotMatch(
    buildSessionSummary(session).homework,
    /אמור בקשה או גבול/,
  );
});
test("personal actions and actual support survive task generation", () => {
  for (const journeyStage of [2, 4]) {
    const key =
      journeyStage === 2 ? "s2_step_8_new_action" : "s4_step_6_action";
    const summary = buildSessionSummary({
      journeyStage,
      resourceArchetype: "power_listen",
      answers: { [key]: "לבקש עשר דקות לסיים את היצירה" },
    });
    assert.match(summary.homework, /לבקש עשר דקות לסיים את היצירה/);
    assert.match(summary.homework, /הקשבה/);
  }
});
