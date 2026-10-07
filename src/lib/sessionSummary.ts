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

type WeeklyPractice = {
  title: string;
  purpose: string;
  text: string;
  review: string;
};

// The phase and recorded choices determine the exercise, never the character artwork.
function weeklyPractice(
  stage: number,
  answers: Record<string, string>,
  action: string | undefined,
  resource: string | undefined,
  patternId: string | undefined,
): WeeklyPractice {
  const support = resource
    ? `אפשר להיעזר בכוח שבחרת: ${resource}.`
    : "אפשר להיעזר באדם שנוח לך לפנות אליו.";
  if (stage === 1) {
    const focus =
      answers.step_7_protection === "לשמור על קשר או קבלה"
        ? "שים לב במיוחד לרגע שבו רצית להסכים למרות שרצית אחרת."
        : answers.step_7_protection === "לשמור על שליטה או עצמאות"
          ? "שים לב במיוחד לרגע שבו הרגשת צורך לוודא או לשלוט לפני תגובה."
          : answers.step_7_protection === "למנוע פגיעה או חשיפה"
            ? "שים לב במיוחד לרגע שבו רצית להתרחק או לא להיראות."
            : "בחר רגע דומה לאירוע שמיפינו במפגש.";
    return {
      title: "לזהות את המעגל בזמן אמת",
      purpose: "מיפוי · להכיר את הרצף לפני שמנסים לשנות אותו",
      text: `בשני רגעים השבוע עצור אחרי האירוע ותעד בארבע שורות: מה קרה, מה הבנת מזה, מה הרגשת ואיך הגבת. ${focus} אין צורך לשנות את התגובה בתרגיל הזה.`,
      review: "הבא דוגמה אחת: באיזה חלק של המעגל שמת לב לעצמך לראשונה?",
    };
  }
  if (stage === 2) {
    if (
      action &&
      ![
        "לתת לעצמי רגע לפני תגובה",
        "להגיד בקשה או גבול במילים שלי",
        "לעשות צעד לכיוון משהו שאני רוצה",
        "להמשיך להתבונן לפני פעולה",
      ].includes(action)
    )
      return {
        title: "לבדוק את הצעד האישי במצב קטן",
        purpose: "בירור ההגנה · ניסיון בדרך שנבחרה במפגש",
        text: `פעם אחת השבוע, במצב קטן ודומה לזה שביררנו, נסה את הצעד שלך: ״${action}״. לפניו שים לב למה ההגנה חוששת שיקרה; אחריו בדוק מה קרה בפועל ומה התאפשר לרצון שלך. ${support}`,
        review:
          "מה גילית על ההגנה ועל האפשרות החדשה, ומה כדאי להתאים בניסיון הבא?",
      };
    if (action === "להגיד בקשה או גבול במילים שלי")
      return {
        title: "לתת לצורך מקום בתוך הקשר",
        purpose: "בירור ההגנה · לבדוק דרך נוספת לשמור על מה שחשוב",
        text: `בשיחה אחת עם אדם שנוח לך לדבר איתו, אמור בקשה או גבול קטן. לפני השיחה שים לב למה אתה חושש שיקרה; אחריה השווה את החשש למה שקרה בפועל. ${support}`,
        review: "מה נשמר בקשר, ומה התאפשר כשהרצון שלך קיבל מקום?",
      };
    if (action === "לעשות צעד לכיוון משהו שאני רוצה")
      return {
        title: "ניסוי קטן מתוך רצון",
        purpose: "בירור ההגנה · לבדוק אם יש דרך נוספת לצד הפחד",
        text: `בחר פעולה של חמש דקות בכיוון שחשוב לך, ונסה אותה פעם אחת השבוע. לפני ההתחלה בדוק מה ההגנה מנסה למנוע ומה יאפשר לך להתחיל בגודל הזה. ${support} בסוף תעד מה קרה בפועל.`,
        review:
          "מה למדת על החשש ועל היכולת שלך, גם אם התוצאה לא הייתה כפי שרצית?",
      };
    return {
      title: "לבדוק את המשמעות שהאירוע קיבל",
      purpose: "בירור ההגנה · להפריד בין מה שקרה לבין מה שהבנת ממנו",
      text: `ברגע אחד השבוע, לפני שאתה מגיב או מיד אחר כך, כתוב עובדה אחת מהאירוע ואת המשפט שעבר לך בראש. הוסף הסבר אפשרי נוסף לאותה עובדה, בלי חובה להאמין בו. בדוק מה ההגנה ניסתה לשמור והאם האפשרות הנוספת פותחת לך בחירה. ${support}`,
      review: "איזו משמעות ניהלה את התגובה, והאם התווספה אפשרות שלא ראית קודם?",
    };
  }
  if (stage === 3) {
    if (answers.meditation_permission !== "מתאים לי להמשיך עם המנחה" || !action)
      return {
        title: "לשמור על הצורך בלי להעמיק לבד",
        purpose: "סילוק · המשך עדין של הבירור שנעשה במפגש",
        text: `פעם אחת השבוע, במצב דומה, שים לב למה ההגנה מנסה לשמור. תן לצורך הזה מענה קטן בהווה: גבול, תמיכה או הפוגה שמתאימה לך. ${support} תעד מה עזר ומה עדיין צריך לברר יחד.`,
        review:
          "איזה מענה נתן לך יותר מקום או בחירה? את עבודת העומק ממשיכים עם המנחה.",
      };
    const quality = chosenAction(answers.new_quality);
    const direction = quality
      ? `האיכות שבחרת: ״${quality}״.`
      : `הכיוון שבחרת: ״${action}״.`;
    const exercise =
      action === "לנסות צעד קטן עם תמיכה"
        ? "במצב אחד השבוע, פנה לתמיכה שבחרת ונסה בעזרתה פעולה קטנה שההגנה בדרך כלל עוצרת."
        : action === "לתת יותר מקום לרצון שלי לצד הפחד"
          ? "בשני רגעים השבוע, לפני תגובה מוכרת, שאל מה היית רוצה אם לא היית צריך להוכיח דבר. תן לרצון מקום בפעולה אחת קטנה."
          : "בשני רגעים השבוע, הקשב לאזהרה של ההגנה בלי להגיב מיד. בדוק מה נדרש במציאות ובחר תגובה שמתאימה לרצון שלך.";
    return {
      title: "לתת לכיוון החדש ביטוי בחיים",
      purpose: "סילוק והטמעה · לבנות עדות חדשה לבחירה ולמסוגלות",
      text: `${direction} ${exercise} ${support} אחר כך שים לב אם הדרך הישנה ניהלה פחות, ואיפה היה מקום לכיוון החדש; גם מרווח קטן הוא מידע.`,
      review:
        "הבא רגע אחד שבו הכיוון החדש קיבל ביטוי, ורגע שבו ההגנה עדיין ניהלה. אין צורך לחזור על תרגול העומק לבד.",
    };
  }
  const goal = chosenAction(answers.s4_step_1_what_i_want);
  const goalContext = goal ? `בכיוון שבחרת: ״${goal}״. ` : "";
  if (!action)
    return {
      title: "לברר כיוון שאפשר להתחיל ממנו",
      purpose: "עצמאות · למצוא רצון אישי וצעד אפשרי",
      text: `${goalContext}הקדש השבוע עשר דקות לפעילות אחת שמסקרנת אותך. אחריה רשום מה משך אותך ומה היית רוצה לבדוק שוב, בלי צורך להחליט עדיין על מטרה גדולה.`,
      review: "מה עורר עניין, ומה יכול להיות צעד ראשון שמתאים לכוחות שלך?",
    };
  const exercise = ![
    "ניסוי קטן ומוגדר שאוכל ללמוד ממנו",
    "בקשת עזרה או מידע שחסר לי",
    "זמן קצר שאקדיש לדבר שבחרתי",
  ].includes(action)
    ? `פעם אחת השבוע, במועד שמתאים לך, נסה את הצעד האישי: ״${action}״. אפשר להקטין אותו לחמש דקות כדי להתחיל.`
    : action === "בקשת עזרה או מידע שחסר לי"
      ? "בחר מידע אחד שחסר כדי להתקדם. פנה השבוע לאדם מתאים בשאלה ממוקדת, והשתמש בתשובה להחלטה אחת שלך."
      : action === "זמן קצר שאקדיש לדבר שבחרתי"
        ? "קבע ביומן שני זמנים של עשר דקות השבוע לדבר שבחרת. בכל זמן עשה חלק קטן אחד, ובסיום ציין מה הצלחת להתחיל או להשלים."
        : patternId && weeklyExperiments[patternId]
          ? weeklyExperiments[patternId]
          : `נסה פעם אחת השבוע את הצעד שבחרת: ״${action}״. קבע זמן קצר ותנאי התחלה שאפשר לעמוד בו.`;
  return {
    title: "צעד שמייצר הוכחה חדשה למסוגלות",
    purpose: "עצמאות · להפוך את הרצון לפעולה מדידה",
    text: `${goalContext}${exercise} ${support} בדוק מה עשית מתוך הרצון שלך ומה היה ניסיון לקבל אישור או להימנע מטעות.`,
    review:
      "מה התאפשר ביחס לנקודת ההתחלה שלך, ומה כדאי להקטין או להתאים בניסיון הבא?",
  };
}

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
  const practiceAction = ["בינתיים רוצה רק להתבונן", "מספיק לי להיום"].includes(
    answers.choice_moment,
  )
    ? undefined
    : action;
  const resource = [
    ...goodPowersData,
    ...worldsData.flatMap((world) => world.archetypes),
  ].find(
    (item) =>
      item.id === session.resourceArchetype ||
      item.name === session.resourceArchetype,
  );
  const proposal =
    answers.homework_proposal?.trim() || answers.homework?.trim();
  const proposalId = answers.homework_proposal_id || "";
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
  ];
  const takeaway = firstRecorded(
    answers.session_takeaway,
    stage === 2 ? answers.s2_step_10_closure : undefined,
  );
  const practice = weeklyPractice(
    stage,
    answers,
    practiceAction,
    resource?.name,
    pattern?.id,
  );
  let reflection =
    stage === 1
      ? "מיפינו את הקשר בין האירוע, המשמעות שנתת לו והתגובה. הכיוון להמשך הוא להבחין במעגל כשהוא מופיע, לפני שמנסים לשנות אותו."
      : stage === 2
        ? "ביררנו מה ההגנה מנסה לשמור ואיפה הדרך שלה מצמצמת את הבחירה. התרגול הוא לבדוק אם אפשר לתת לצורך מקום בדרך נוספת."
        : stage === 3
          ? practiceAction &&
            answers.meditation_permission === "מתאים לי להמשיך עם המנחה"
            ? "הכיוון להמשך הוא לתת לבחירה החדשה ביטוי במצב יומיומי, ולבדוק אם ההגנה מנהלת פחות. העבודה במפגש אינה מבטיחה שהדפוס נעלם; השינוי נבחן בחיים."
            : "הבירור נשאר פתוח. ההמשך הוא לתת לצורך מענה בהווה ולהביא למפגש הבא את מה שעדיין מבקש עבודה משותפת."
          : practiceAction
            ? "חיברנו את הכיוון הרצוי לצעד שאפשר לבדוק במציאות. ההתקדמות נבחנת מול נקודת ההתחלה שלך: מה התאפשר, מה למדת ומה מתאים לשנות."
            : "הכיוון עדיין בבירור. התרגול הוא למצוא מה מעורר עניין ומה יכול להתאים לך כצעד ראשון, בלי להחליט עדיין על מטרה גדולה.";
  if (
    (stage === 1 &&
      answers.step_7_protection === "לשמור על קשר או קבלה" &&
      answers.step_5_urge === "הסכמתי למרות שרציתי אחרת") ||
    (stage === 2 &&
      answers.s2_step_3_interpretation === "מצפים ממני ולא כדאי לאכזב" &&
      answers.s2_step_5_reaction === "הסכמתי או לקחתי על עצמי עוד")
  ) {
    reflection =
      "כיוון שהתבהר לבדיקה: הסכמה יכולה להפחית את החשש לאכזב מיד, אבל להשאיר פחות מקום לרצון שלך. ההסכמה גם משאירה פתוחה את השאלה אם הקשר יכול להכיל רצון אחר. התרגול השבוע מחבר בין הצורך בקשר לבין יותר מקום לבחירה שלך.";
  }
  return {
    pattern,
    patternConfirmed: Boolean(confirmedPattern),
    action,
    choice: answers.choice_moment,
    resourceName: resource?.name,
    homework: proposal || practice.text,
    proposal,
    proposalId,
    loop,
    takeaway,
    reflection,
    practice,
    taskSuggestion: practice.text,
    afterIntensity: session.blockerStrengthAfter,
    status:
      session.status === "completed"
        ? "completed"
        : answers.choice_moment
          ? "in_progress"
          : "choosing",
  };
}
