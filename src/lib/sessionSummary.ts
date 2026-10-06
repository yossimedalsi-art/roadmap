import { findMechanism } from "../data/mechanisms";
import { goodPowersData, worldsData } from "../data/worlds";
import { chosenAction } from "./journeyAnswers";

export type SummarySession = {
  journeyStage?: number;
  phase?: number;
  status?: string;
  answers?: Record<string, string>;
  trigger?: string | null;
  mechanismId?: string | null;
  resourceArchetype?: string | null;
  blockerStrengthAfter?: number | null;
};

// Bounded weekly experiments, proposed for joint agreement, never assigned automatically.
export const weeklyExperiments: Record<string, string> = {
  procrastination:
    "בחר משימה אחת שחשובה לך. פעמיים השבוע קבע זמן להתחלה של חמש דקות בלבד, ושים לב מה הקל על ההתחלה.",
  avoidance:
    "בחר עם המנחה מצב אחד שמתאים לך להתקרב אליו בצעד קטן. פעם השבוע נסה את הצעד עם תמיכה שבחרת, ורשום מה גילית.",
  perfectionism:
    "בחר משימה קטנה אחת והגדר מראש מה מספיק טוב עבורך. פעם השבוע עצור בנקודה הזאת ובדוק מה התאפשר גם בלי שלמות.",
  "stress-alertness":
    "בשני רגעים השבוע שים לב מתי הדריכות עולה. בדוק מה נדרש עכשיו בפועל, והיעזר במשאב שבחרת לפני החלטה אחת.",
  "black-white":
    "בשתי סיטואציות השבוע שבהן מופיעות רק שתי אפשרויות קצה, כתוב אפשרות שלישית ובדוק אם היא מתאימה לך.",
  "decision-hesitation":
    "בחר החלטה קטנה אחת והגדר מה חשוב לך ומה מספיק לדעת כדי לבחור. השבוע נסה לבחור בזמן שקבעת ובדוק מה למדת.",
  "skepticism-negativity":
    "בחר רעיון קטן אחד שמעניין אותך. השבוע בדוק אותו בניסיון קצר, ורשום מה קרה בפועל לצד מה שציפית שיקרה.",
  "diminishing-difference":
    "פעם השבוע, מול דעה שונה, שים לב לתגובה שלך ותן מקום להסבר אחד של האחר לפני שתבחר את עמדתך.",
  "financial-existential-anxiety":
    "בחר רגע אחד של דאגה השבוע. הפרד בין עובדה, חשש ודבר שניתן לעשות עכשיו, ובדוק יחד עם מבוגר מתאים איזו תמיכה נחוצה.",
  "self-criticism":
    "אחרי טעות אחת השבוע, תאר מה קרה בלי כינוי על עצמך. בחר תיקון קטן אחד ורשום גם דבר שעשית כדי להתמודד.",
  victimhood:
    "בחר מצב אחד השבוע. הפרד בין מה שאינו בשליטתך לבין אפשרות השפעה קטנה, ובחר אם לנסות אותה או לבקש תמיכה.",
  "self-sabotage":
    "בחר צעד אחד שמקרב לרצון שלך. לפניו בדוק מה מושך לעצור ומה יעזור, ונסה אותו פעם אחת השבוע בגודל שמתאים לך.",
  "appearance-preoccupation":
    "פעם ביום שתבחר השבוע, שים לב לתכונה או יכולת שלך שאינה קשורה למראה. הבא דוגמה אחת למפגש הבא.",
  "impostor-syndrome":
    "בחר הצלחה קטנה אחת השבוע. כתוב פעולה שעשית ותרומה של עזרה שקיבלת, כדי לתת מקום גם לחלק שלך.",
  "glass-half-empty":
    "בשני ימים השבוע תעד משהו שחסר לך ולצדו משהו שכבר קיים ועוזר. בדוק מה תרצה לקדם מתוך התמונה המלאה.",
  concealment:
    "בחר דבר קטן שמותר ונוח לך לשתף השבוע עם אדם שבחרת. אפשר גם לבחור גבול פרטיות; בדוק מה בחרת ומה עזר לך לבחור.",
  "low-mood":
    "בחר עם המנחה פעילות קטנה וקשר תומך שמתאימים לכוחות שלך. נסה פעם אחת השבוע ושים לב מה תמך בך, בלי דרישה לשינוי במצב הרוח.",
  overthinking:
    "בחר התלבטות קטנה אחת השבוע. הקצה זמן קצר לחשיבה, ואז בדוק אם נחוץ עוד מידע, צעד קטן או להשאיר שאלה פתוחה.",
  "fobo-fomo":
    "בחר פעילות אחת שבאמת מעניינת אותך והקדש לה זמן שקבעת השבוע. בסוף בדוק מה היה בה עבורך לפני שתשווה לחלופות.",
  "unfinished-starts":
    "בחר דבר קטן אחד לסיים השבוע והגדר סיום שאפשר להגיע אליו. חלק אותו לשני צעדים ובדוק מה עזר להמשיך.",
  "low-energy":
    "בשני רגעים השבוע שים לב למה הכוחות שלך מאפשרים. בחר מנוחה, תמיכה או פעולה קטנה שמתאימה לך ותעד מה עזר.",
  "people-pleasing":
    "בשתי בקשות קטנות השבוע, עצור לפני הסכמה ובדוק מה אתה רוצה. באחת מהן נסה להביע רצון או גבול במילים שבחרת.",
  "self-cancellation":
    "בשיחה אחת השבוע, תן מקום לרצון קטן שלך. אפשר לנסח אותו קודם עם אדם תומך; רשום איך היה להביע אותו.",
  "others-opinion":
    "בחר פעולה קטנה אחת שחשובה לך השבוע. בדוק מה אתה רוצה ומה אתה מצפה שאחרים יחשבו, ובחר צעד שמתאים לערכים שלך.",
  "exposure-fear":
    "בחר שיתוף קטן ובטוח עם אדם מתאים, ורק אם נוח לך. השבוע בדוק מה הגבול שלך ואיזו תמיכה מאפשרת להישאר בבחירה.",
  significance:
    "בחר רגע אחד השבוע שבו תרצה הכרה. נסה לומר במילים שלך מה חשוב לך בקשר, ושים לב גם למקום שאתה נותן לעצמך.",
  "conflict-avoidance":
    "בחר הבדל קטן מול אדם שנוח לך לדבר איתו. השבוע נסח בקשה או גבול במשפט קצר, עם התמיכה שאתה צריך.",
  "judgment-criticism":
    "ברגע אחד השבוע שבו עולה ביקורת על אחר, תאר את המעשה בלי כינוי על האדם. בדוק איזה צורך או גבול שלך חשוב לבטא.",
  overcomparison:
    "בחר התקדמות קטנה שחשובה לך. השבוע השווה אותה לנקודת ההתחלה שלך ורשום דבר שעשית, במקום לדרג מול אחרים.",
  "inauthentic-voice":
    "לפני שיחה אחת השבוע, כתוב מה אתה באמת רוצה לומר. נסה להביע משפט אחד משלך במצב שנוח לך.",
  drama:
    "בחר עם המנחה רגע אחד בקשר שבו התגובה מתעצמת. השבוע נסה הפוגה קצרה שבחרת, ואז בטא צורך או בקשה בלי להידרש להעלים את הרגש.",
};

export function buildSessionSummary(session: SummarySession) {
  const answers = session.answers || {};
  const confirmedPattern = findMechanism(answers.summary_pattern_id);
  const pattern = confirmedPattern || findMechanism(session.mechanismId);
  const actionKeys: Record<number, string> = {
    1: "step_9_resource_action",
    2: "s2_step_8_new_action",
    3: "s3_step_9_new_contract",
    4: "s4_step_6_action",
  };
  const action = chosenAction(answers[actionKeys[session.journeyStage || 1]]);
  const resource = [
    ...goodPowersData,
    ...worldsData.flatMap((world) => world.archetypes),
  ].find((item) => item.id === session.resourceArchetype);
  const proposal =
    answers.homework_proposal?.trim() || answers.homework?.trim();
  const proposalId = answers.homework_proposal_id || "";
  const approvedText = answers.homework_approved_text?.trim();
  const approvalMatches =
    Boolean(proposalId) && answers.homework_approved_id === proposalId;
  const homeworkApproved =
    approvalMatches &&
    answers.homework_confirmation === "approved" &&
    Boolean(proposal) &&
    approvedText === proposal;
  const noTask =
    answers.homework_confirmation === "none" &&
    answers.homework_approved_id === proposalId;
  const homework = homeworkApproved ? approvedText : undefined;
  const stage = session.journeyStage || 1;
  const firstRecorded = (...values: Array<string | null | undefined>) =>
    values.find((value) => value?.trim())?.trim();
  const eventKeys: Record<number, string> = {
    1: "step_2_trigger",
    2: "s2_step_2_trigger",
    3: "s3_step_1_trigger",
    4: "s4_placeholder_trigger",
  };
  const meaningKeys: Record<number, string | undefined> = {
    1: "step_6_thought",
    2: "s2_step_3_interpretation",
    3: undefined,
    4: undefined,
  };
  const reactionKeys: Record<number, string | undefined> = {
    1: "step_5_urge",
    2: "s2_step_5_reaction",
    3: "s3_step_2b_reaction",
    4: undefined,
  };
  const meaningKey = meaningKeys[stage];
  const reactionKey = reactionKeys[stage];
  const loop = [
    {
      id: "event",
      label: "מה קרה",
      value: firstRecorded(answers[eventKeys[stage]], session.trigger),
    },
    {
      id: "meaning",
      label: "מה הבנתי מזה",
      value: firstRecorded(
        answers.loop_meaning,
        meaningKey ? answers[meaningKey] : undefined,
      ),
    },
    {
      id: "emotion",
      label: "מה הרגשתי",
      value: firstRecorded(
        answers.loop_emotion,
        stage === 1 ? answers.step_3_feeling : undefined,
      ),
    },
    {
      id: "reaction",
      label: "מה עשיתי או רציתי לעשות",
      value: firstRecorded(
        answers.loop_reaction,
        reactionKey ? answers[reactionKey] : undefined,
      ),
    },
    {
      id: "consequence",
      label: "מה קרה בעקבות התגובה",
      value: firstRecorded(answers.loop_consequence),
    },
    {
      id: "resultMeaning",
      label: "מה התוצאה גרמה לי לחשוב",
      value: firstRecorded(answers.loop_result_meaning),
    },
  ];
  const takeaway = firstRecorded(
    answers.session_takeaway,
    stage === 2 ? answers.s2_step_10_closure : undefined,
  );
  return {
    pattern,
    patternConfirmed: Boolean(confirmedPattern),
    action,
    choice: answers.choice_moment,
    resourceName: resource?.name,
    homework,
    homeworkApproved,
    proposal: noTask ? undefined : proposal,
    proposalId,
    noTask,
    loop,
    takeaway,
    taskSuggestion: pattern ? weeklyExperiments[pattern.id] : undefined,
    afterIntensity: session.blockerStrengthAfter,
    status:
      session.status === "completed"
        ? "completed"
        : answers.choice_moment
          ? "in_progress"
          : "choosing",
  };
}
