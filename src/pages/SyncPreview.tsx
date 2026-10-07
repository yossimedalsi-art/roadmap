import { useState } from "react";
import CoachLiveSession from "./CoachLiveSession";
import TraineeJourney from "./TraineeJourney";
import type { GuidedSession } from "../lib/sessionTypes";
import CoachPauseAlert from "../components/CoachPauseAlert";

const seed: GuidedSession = {
  id: "00000000-0000-4000-8000-000000000001",
  coachId: "preview",
  traineeId: "fictional",
  phase: 8,
  status: "active",
  journeyStage: 1,
  isYouthMode: true,
  environment: "clouds",
  archetype: "bunny",
  mechanismId: "people-pleasing",
  answers: {
    step_6_thought: "אולי יכעסו אם לא אסכים",
    step_7_protection: "לשמור על קשר או קבלה",
    participant_screen: "question",
  },
};
export default function SyncPreview() {
  const [session, setSession] = useState(seed);
  async function save(patch: Record<string, unknown>) {
    setSession((current) => {
      const next = { ...current, answers: { ...current.answers } };
      for (const [key, value] of Object.entries(patch)) {
        if (key.startsWith("answers."))
          next.answers[key.slice(8)] = value as string;
        else Object.assign(next, { [key]: value });
      }
      return next;
    });
    return true;
  }
  return (
    <div dir="rtl">
      <div className="hc-shell px-4 pt-4">
        <CoachPauseAlert
          sessions={[session]}
          trainees={[
            {
              id: "fictional",
              name: "אורי · דמות בדיונית",
              coachId: "preview",
            },
          ]}
          onOpen={() => {}}
        />
      </div>
      <div className="hc-shell p-4 flex flex-wrap gap-3 items-center">
        <strong>בדיקת שני מסכים · סיפור בדיוני בזיכרון · ללא Firebase</strong>
        {[1, 2, 3, 4].map((stage) => (
          <button
            key={stage}
            className="hc-button-secondary"
            onClick={() =>
              setSession({
                ...seed,
                status: "completed",
                journeyStage: stage,
                phase: 13,
                resourceArchetype: "power_listen",
                trigger: "חבר ביקש ממני להצטרף למרות שרציתי לסיים יצירה",
                answers: {
                  participant_screen: "summary",
                  step_6_thought: "אולי לא יקבלו אותי",
                  step_3_feeling: "כעס או תסכול",
                  step_5_urge: "הסכמתי למרות שרציתי אחרת",
                  step_7_protection: "לשמור על קשר או קבלה",
                  s2_step_3_interpretation: "מצפים ממני ולא כדאי לאכזב",
                  s2_step_5_reaction: "הסכמתי או לקחתי על עצמי עוד",
                  s2_step_8_new_action: "להגיד בקשה או גבול במילים שלי",
                  meditation_permission: "מתאים לי להמשיך עם המנחה",
                  s3_step_9_new_contract: "לתת יותר מקום לרצון שלי לצד הפחד",
                  new_quality: "שייכות לצד מקום לרצון שלי",
                  s4_step_1_what_i_want: "ללמוד או ליצור משהו שמעניין אותי",
                  s4_step_6_action: "זמן קצר שאקדיש לדבר שבחרתי",
                  session_takeaway: "אפשר לתת מקום לרצון שלי גם בתוך קשר",
                },
              })
            }
          >
            סיכום · שלב {stage}
          </button>
        ))}
        <button
          className="hc-button-secondary"
          onClick={() =>
            setSession({
              ...seed,
              journeyStage: 3,
              phase: 2,
              environment: "fairies",
              archetype: "perfection_fairy",
              mechanismId: null,
              trigger: null,
              answers: { participant_screen: "question" },
            })
          }
        >
          סילוק · בחירת אירוע
        </button>
        <button
          className="hc-button-secondary"
          onClick={() =>
            setSession({
              ...seed,
              journeyStage: 3,
              phase: 7,
              answers: { participant_screen: "event" },
            })
          }
        >
          סילוק · מדיטציה
        </button>
        <button
          className="hc-button-secondary"
          onClick={() =>
            setSession({
              ...seed,
              phase: 0,
              environment: null,
              archetype: null,
              resourceArchetype: null,
              answers: { participant_screen: "welcome" },
            })
          }
        >
          מסכי הפתיחה
        </button>
        <button
          className="hc-button-secondary"
          onClick={() => setSession(seed)}
        >
          בחירת כוח
        </button>
        <button
          className="hc-button-secondary"
          onClick={() =>
            setSession((current) => ({
              ...current,
              phase: 11,
              status: "active",
              answers: {
                ...current.answers,
                choice_moment: "",
                participant_screen: "choice",
                step_9_resource_action: "לבדוק מה אני רוצה לפני שאסכים",
              },
            }))
          }
        >
          רגע הבחירה
        </button>
      </div>
      <div className="grid xl:grid-cols-2 gap-2 bg-slate-700">
        <section aria-label="תצוגת המשתתף" className="min-w-0">
          <TraineeJourney
            preview
            previewSession={session}
            onPreviewSave={save}
          />
        </section>
        <section aria-label="תצוגת המנחה" className="min-w-0">
          <CoachLiveSession
            sessionId={seed.id}
            onBack={() => {}}
            previewSession={session}
            onPreviewSave={save}
          />
        </section>
      </div>
    </div>
  );
}
