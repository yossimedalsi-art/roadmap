# מ.ס.ע — implementation brief

Scope: a substantial upgrade of the guided game. No autonomous depth journey, deployment, or live client data access. Source of truth is the current Drive charter; historical course language and older local skill rules are subordinate to it.

## Method

- מיפוי, סילוק, עצמאות. סילוק reduces automatic dominance; never destroys a person or part. Fear may be present without deciding. Worth is independent of outcome.
- A character represents a possible protective mechanism/obstacle, never the teen or a diagnosis. Learner gives it meaning and can reject the suggestion. Describe function as a hypothesis, not a childhood fact.
- Start with trust/resources; permission and pace, one live pattern per session. Open questions, concrete facts separate from interpretation; underlying need distinct from action.
- Same action can come from passion or fear. Check motive alongside action. Direction and goals can begin alongside release.
- Experiential/young-part work only with coach, readiness, permission and grounding. No mandatory closed eyes, suggested memories, purge, or proof of release from a click or emotion.
- Not knowing, pausing, skipping, changing a proposed meaning are valid. No emotional scores, rankings, streak pressure or correct-answer grading. Final summary faithfully reflects actual submitted answers, no invented agreement.

## Shared catalog contract (content agent owns src/data/mechanisms.ts)

Export type Mechanism with fields: id:string, title:string, aliases:string[], description:string, protectiveIntent:string, possibleCost:string, openingQuestion:string, questions:string[], worldId:string, archetypeId:string, scenarios:Array<{id:string,title:string,context:"school"|"friends"|"home"|"online"|"goals"}>.
Export mechanisms:Mechanism[], findMechanism(id:string|undefined|null):Mechanism|undefined, getMechanismForArchetype(archetypeId:string|undefined|null):Mechanism|undefined, searchMechanisms(query:string):Mechanism[]. All text Hebrew; search normalizes niqqud, punctuation, whitespace, supports multiword queries and aliases.
Coach selected mechanism persists as mechanismId on session. Choice narrows starting suggestion, not learner meaning; learner may choose another character or their own event.

## Ownership

- content agent: src/data/worlds.ts, src/data/journey.ts, src/data/mechanisms.ts. Preserve existing step IDs, exports and consumer-compatible shape. Stage1 action is step_9_resource_action; step_10_integration is need. Keep youth/adult options aligned in length/order.
- experience agent: src/pages/TraineeJourney.tsx, src/components/Backpack.tsx, src/components/JourneyMap.tsx, new participant-only components. May add participantPause boolean in hc_live_sessions updates, must notify foundation agent. Avoid overwriting coach-controlled fields in participant writes. Leave public demo to root.
- foundation agent: src/pages/CoachDashboard.tsx, src/pages/CoachLiveSession.tsx, firestore.rules, new MechanismLibrary component and lib helpers. Search available to coach, readiness-based selection, UUID IDs, youth-aligned options, observe participantPause, restrict participant changed keys. Existing participant fields must continue to save and complete correctly. Metadata privacy assessment: shared doc accessible via secret link, coach private notes must be in owner-only document, not shared payload.
- root: integration, landing/demo, global CSS, index.html, tests, README, review and final verification. Shared worktree, no other agent's owned files. Send a message before touching cross-owned files.

## Quality bar

Complete, responsive Hebrew RTL flows; accessible keyboard/focus, reduced-motion support; not a cosmetic theme-only update. Search must work without requiring a live session and have useful empty results. No writes/deployment to production. Build and meaningful test coverage for search, content invariants and permission transitions; report existing lint separately from new issues.
