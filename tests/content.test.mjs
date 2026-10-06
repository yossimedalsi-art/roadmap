import { test, after } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  readFileSync,
  writeFileSync,
  rmSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import { chosenAction } from "../src/lib/journeyAnswers.ts";

test("unresolved answers cannot become a commitment, while self-chosen observation remains valid", () => {
  for (const value of [
    undefined,
    "",
    "עוד לא ברור לי",
    "לא עכשיו — מעדיף לדלג בשיחה עם המנחה",
    "עדיין לא לבחור צעד",
    "להשאיר את הדברים פתוחים כרגע",
    "עוד לא לבחור צעד / לשנות את המטרה",
  ]) {
    assert.equal(chosenAction(value), undefined);
  }
  assert.equal(
    chosenAction("להמשיך להתבונן לפני פעולה"),
    "להמשיך להתבונן לפני פעולה",
  );
  assert.equal(
    chosenAction("עוד לא אענה לפני שאבדוק מה אני רוצה"),
    "עוד לא אענה לפני שאבדוק מה אני רוצה",
  );
});

// Transpile the actual data modules, not duplicated implementations.
const temporary = mkdtempSync(join(tmpdir(), "msa-content-"));
for (const name of ["mechanisms", "worlds", "journey"]) {
  const source = readFileSync(
    new URL(`../src/data/${name}.ts`, import.meta.url),
    "utf8",
  );
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2023,
    },
  }).outputText;
  writeFileSync(
    join(temporary, `${name}.mjs`),
    output.replace(/from ["']\.\/mechanisms["']/g, 'from "./mechanisms.mjs"'),
  );
}
const catalog = await import(pathToFileURL(join(temporary, "mechanisms.mjs")));
const { worldsData, goodPowersData } = await import(
  pathToFileURL(join(temporary, "worlds.mjs"))
);
const journey = await import(pathToFileURL(join(temporary, "journey.mjs")));
const sourceMap = JSON.parse(
  readFileSync(new URL("../docs/pattern-map.json", import.meta.url), "utf8"),
);
after(() => rmSync(temporary, { recursive: true, force: true }));

test("every pattern title matches the independently transcribed source map exactly", () => {
  const expected = sourceMap.groups.flatMap((group) => group.patterns);
  assert.deepEqual(catalog.canonicalPatternTitles, expected);
  assert.deepEqual(
    catalog.mechanisms.map((item) => item.title),
    expected,
  );
  assert.equal(
    new Set(catalog.mechanisms.map((item) => item.id)).size,
    expected.length,
  );
  assert.equal(catalog.patternMapSource.url, sourceMap.source.url);
  for (const item of catalog.mechanisms) {
    const group = sourceMap.groups.find((group) =>
      group.patterns.includes(item.title),
    );
    assert.equal(item.domain, group.domain);
    assert.equal(item.emotionGroup, group.emotion);
  }
});

test("search finds everyday language, respects all query words and handles Hebrew niqqud", () => {
  assert.equal(
    catalog.searchMechanisms("לא מצליח להגיד לא")[0]?.title,
    "ריצוי",
  );
  assert.equal(catalog.searchMechanisms("רִיצּוּי!")[0]?.title, "ריצוי");
  assert.equal(catalog.searchMechanisms("דוחה משימות")[0]?.title, "דחיינות");
  assert.deepEqual(catalog.searchMechanisms("מילהשלאקיימת"), []);
  assert.deepEqual(catalog.searchMechanisms("ריצוי מילהשלאקיימת"), []);
  assert.equal(
    catalog.searchMechanisms("   ").length,
    sourceMap.groups.flatMap((group) => group.patterns).length,
  );
  assert.equal(catalog.searchMechanisms("FOBO-FOMO")[0]?.title, "FOBO-FOMO");
});

test("every search result can open a valid character and real scenario without conflating pattern IDs", () => {
  const characters = worldsData.flatMap((world) => world.archetypes);
  const scenarioIds = new Set();
  for (const item of catalog.mechanisms) {
    const world = worldsData.find((world) => world.id === item.worldId);
    const character = world?.archetypes.find(
      (character) => character.id === item.archetypeId,
    );
    assert.ok(character, item.title);
    assert.equal(character.kind, "mechanism");
    assert.ok(item.scenarios.length >= 3);
    assert.ok(
      catalog
        .getMechanismsForArchetype(item.archetypeId)
        .some((candidate) => candidate.id === item.id),
    );
    for (const scenario of item.scenarios) {
      assert.ok(!scenarioIds.has(scenario.id));
      scenarioIds.add(scenario.id);
      assert.ok(scenario.title.trim().length > 5);
    }
  }
  for (const character of [...characters, ...goodPowersData]) {
    if (character.imageUrl)
      assert.ok(
        existsSync(new URL(`../public${character.imageUrl}`, import.meta.url)),
        character.imageUrl,
      );
  }
  assert.ok(
    characters.some(
      (character) => catalog.getMechanismsForArchetype(character.id).length > 1,
    ),
  );
});

test("resource cards remain separate from barrier choices", () => {
  for (const world of worldsData) {
    assert.equal(
      world.archetypes.filter((character) => character.kind === "resource")
        .length,
      1,
    );
    assert.ok(
      world.archetypes.filter((character) => character.kind === "mechanism")
        .length > 0,
    );
  }
  assert.ok(goodPowersData.every((character) => character.kind === "resource"));
});

test("journey IDs remain compatible with stored sessions and youth choice meanings stay aligned", () => {
  const lists = [
    journey.journeyPhases,
    journey.stage2Phases,
    journey.stage3Phases,
    journey.stage4Phases,
  ];
  assert.deepEqual(
    lists.map((list) => list.length),
    [10, 10, 12, 8],
  );
  const ids = new Set();
  for (const list of lists)
    list.forEach((step, index) => {
      assert.ok(!ids.has(step.id), step.id);
      ids.add(step.id);
      assert.equal(step.order, index + 1);
      assert.ok(step.coachDeepeningQuestions.length >= 2);
      assert.equal(step.youthTraineeTitle, step.traineeTitle);
      assert.deepEqual(step.youthOptions, step.options);
      assert.deepEqual(step.youthPatternRevealed, step.patternRevealed);
    });
  assert.ok(ids.has("step_9_resource_action"));
  assert.ok(ids.has("step_10_integration"));
  assert.ok(ids.has("s3_step_9_new_contract"));
  assert.ok(ids.has("s4_step_6_action"));
});
