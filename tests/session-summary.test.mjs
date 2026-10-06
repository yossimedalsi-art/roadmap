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
      /from ["'](?:\.\.\/data\/|\.\/)(mechanisms|worlds|journeyAnswers)["']/g,
      'from "./$1.mjs"',
    ),
  );
}
after(() => rmSync(temporary, { recursive: true, force: true }));
const { buildSessionSummary } = await import(
  pathToFileURL(join(temporary, "sessionSummary.mjs"))
);
const task = "לפני בקשה אחת השבוע אבדוק מה אני רוצה";
const proposal = { homework_proposal: task, homework_proposal_id: "v1" };
const approved = {
  ...proposal,
  homework_approved_text: task,
  homework_approved_id: "v1",
  homework_confirmation: "approved",
};

test("coach proposal and legacy homework cannot become a participant-approved assignment", () => {
  for (const answers of [
    proposal,
    { homework: task },
    { ...proposal, homework_confirmation: "approved" },
  ]) {
    const summary = buildSessionSummary({ answers });
    assert.equal(summary.homeworkApproved, false);
    assert.equal(summary.homework, undefined);
    assert.equal(summary.proposal, task);
  }
});
test("approval refers to exact wording and revision, not just a yes flag", () => {
  assert.equal(buildSessionSummary({ answers: approved }).homework, task);
  for (const changes of [
    { homework_proposal: "משימה חדשה" },
    { homework_proposal_id: "v2" },
    { homework_approved_text: "טקסט שונה" },
    { homework_approved_id: "" },
  ]) {
    assert.equal(
      buildSessionSummary({ answers: { ...approved, ...changes } })
        .homeworkApproved,
      false,
    );
  }
  // Returning to the same text after an edit still needs a fresh participant choice.
  assert.equal(
    buildSessionSummary({
      answers: { ...approved, homework_proposal_id: "v3" },
    }).homework,
    undefined,
  );
});
test("participant may explicitly choose no task; later proposal does not silently keep that choice", () => {
  const answers = {
    ...proposal,
    homework_confirmation: "none",
    homework_approved_text: "",
    homework_approved_id: "v1",
  };
  const declined = buildSessionSummary({ answers });
  assert.equal(declined.noTask, true);
  assert.equal(declined.homework, undefined);
  assert.equal(declined.proposal, undefined);
  assert.equal(
    buildSessionSummary({ answers: { ...answers, homework_proposal_id: "v2" } })
      .noTask,
    false,
  );
});
test("summary loop retains observed answers and never invents an uncaptured result or emotion", () => {
  const result = buildSessionSummary({
    journeyStage: 2,
    trigger: "חבר ביקש עזרה",
    answers: {
      s2_step_3_interpretation: "חששתי שיכעס",
      s2_step_5_reaction: "אמרתי כן",
      s2_step_4_sensitive_spot: "לשמור על קשר",
      session_takeaway: "מותר לי לבדוק גם מה אני רוצה",
    },
  });
  assert.equal(
    result.loop.find((part) => part.id === "event").value,
    "חבר ביקש עזרה",
  );
  assert.equal(
    result.loop.find((part) => part.id === "meaning").value,
    "חששתי שיכעס",
  );
  assert.equal(
    result.loop.find((part) => part.id === "emotion").value,
    undefined,
  );
  assert.equal(
    result.loop.find((part) => part.id === "reaction").value,
    "אמרתי כן",
  );
  assert.equal(
    result.loop.find((part) => part.id === "consequence").value,
    undefined,
  );
  assert.equal(result.takeaway, "מותר לי לבדוק גם מה אני רוצה");
});
test("recorded consequence closes the actual loop while goals are not relabeled as past behavior", () => {
  const result = buildSessionSummary({
    journeyStage: 4,
    trigger: "הציעו לי תפקיד",
    answers: {
      s4_step_1_what_i_want: "ליצור משהו",
      s4_step_6_action: "להתחיל מחר",
      loop_consequence: "החבר אמר שאפשר לחשוב",
      loop_result_meaning: "אפשר לקחת זמן",
    },
  });
  assert.equal(
    result.loop.find((part) => part.id === "reaction").value,
    undefined,
  );
  assert.equal(
    result.loop.find((part) => part.id === "consequence").value,
    "החבר אמר שאפשר לחשוב",
  );
  assert.equal(
    result.loop.find((part) => part.id === "resultMeaning").value,
    "אפשר לקחת זמן",
  );
  assert.equal(result.homework, undefined);
});
