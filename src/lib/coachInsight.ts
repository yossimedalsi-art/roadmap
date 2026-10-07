import { coachHypotheses, type JourneyStep } from "../data/journey";
import type { Mechanism } from "../data/mechanisms";

export type CoachInsight = {
  title: string;
  explanation: string;
  evidence?: string;
  nextFocus: string;
  kind: "hypothesis" | "clarification" | "readiness";
};
export type CoachInsightInput = {
  step: JourneyStep;
  answer?: string;
  answers?: Record<string, string>;
  // Caller must pass only a pattern explicitly validated by the participant.
  mechanism?: Mechanism;
};

const unresolved = new Set([
  "לא יודע",
  "לא יודעת",
  "עוד לא ברור לי",
  "לא עכשיו — מעדיף לדלג בשיחה עם המנחה",
]);

const purposefulQuestions: Record<string, string[]> = {
  step_3_feeling: [
    "מה היה חשוב לך באותו רגע ולא קיבל מקום?",
    "מה ההרגשה דחפה אותך לעשות, והאם עשית זאת בפועל?",
  ],
  step_4_somatic: [
    "האם תשומת הלב לתחושה עוזרת להתבונן באירוע, או שעדיף לחזור לשיחה?",
  ],
  step_5_urge: [
    "מה התגובה הקלה מיד, ומה היא הקשתה בהמשך?",
    "האם התגובה קירבה אותך למה שרצית מהמצב?",
  ],
  step_6_thought: [
    "איזה פרט באירוע הוביל למשפט הזה?",
    "האם אותו פרט יכול להתפרש גם בדרך אחרת, ומה משתנה אז בתגובה?",
  ],
  step_7_protection: [
    "איך אפשר לשמור על הדבר החשוב הזה בלי שהתגובה תחליט במקומך?",
    "מה יהיה קשה אם תנסה דרך אחרת?",
  ],
  step_8_resource_help: [
    "באיזה רגע בתוך האירוע המשאב הזה היה יכול לעזור, ואיך?",
  ],
  step_9_resource_action: [
    "באיזה מצב קטן השבוע יהיה אפשר לבדוק את הכיוון הזה?",
    "מה יעזור לזה להיות צעד שלך ולא ניסיון לרצות?",
  ],
  step_10_integration: [
    "מה במעגל נעשה ברור יותר עכשיו?",
    "מה תרצה לזהות בפעם הבאה שהמצב הזה מופיע?",
  ],
  s2_step_3_interpretation: [
    "מה ראית או שמעת באירוע, ומה הוספת לזה במחשבה?",
    "איזה מידע היה מאפשר לבדוק את המשמעות הזאת, במקום לקבל אותה כעובדה?",
  ],
  s2_step_4_sensitive_spot: [
    "מה היית צריך לקבל באותו רגע כדי שלא יהיה צורך בדרך ההגנה הזאת?",
    "האם אפשר לתת לצורך מקום גם בלי לשלוט בתגובה של האחר?",
  ],
  s2_step_5_reaction: [
    "מה התגובה נתנה לך מיד, ומה היא מנעה מהרצון שלך?",
    "מה הייתה אפשרות נוספת ששומרת על הצורך שלך?",
  ],
  s2_step_6_cost: [
    "מה צריך להישאר מוגן גם אם נקטין את המחיר?",
    "איזה שינוי קטן לא ירגיש כמו ויתור על ההגנה כולה?",
  ],
  s2_step_7_resource: ["איך המשאב ייתן מקום לצורך כשיעלה הדחף המוכר?"],
  s2_step_8_new_action: [
    "מה יאפשר לנסות את זה בגודל שמתאים לך השבוע?",
    "מה נבדוק כדי ללמוד מהניסוי גם אם התוצאה לא תהיה כפי שרצית?",
  ],
  s2_step_9_agreement: [
    "כשההגנה תתריע שוב, מה יאפשר לך לבדוק לפני שהיא מחליטה?",
  ],
  s2_step_10_closure: ["באיזה רגע השבוע תוכל לזהות את מה שהתבהר כאן?"],
  s3_step_2_secondary_gain: [
    "איזה מענה אחר יוכל לשמור על הדבר הזה אם ההגנה תנהל פחות?",
    "מה עוד צריך לקבל מקום לפני שננסה שינוי?",
  ],
  s3_step_2b_reaction: [
    "מה התגובה הזאת מנסה לחסוך לך להרגיש או להתמודד איתו?",
    "מה חשוב שהדרך החדשה תאפשר במקום זה?",
  ],
  s3_step_3_need: ["איזה מענה לצורך הזה יאפשר לבדוק שינוי בלי לוותר עליו?"],
  s3_step_9_new_contract: [
    "איך הכיוון הזה ייראה בפעולה קטנה בחיים שלך?",
    "למה נשים לב כדי לדעת שהישן מנהל פחות והחדש מקבל מקום?",
  ],
  s4_step_1_what_i_want: [
    "איך ייראה רגע יומיומי שבו הכיוון הזה כבר מקבל מקום?",
    "מה בו יהיה חשוב גם אם איש לא ישבח אותך עליו?",
  ],
  s4_step_2_capability: [
    "איזה חלק מהצעד אפשר לעשות עם מה שכבר יש לך, ואיזה חלק מצריך עזרה?",
  ],
  s4_step_3_blocker_impact: [
    "מה צריך לשנות בתנאים במציאות, ומה דורש עבודה עם החשש?",
  ],
  s4_step_4_secondary_gain: ["אם הפחד יישאר לצדך, מה בכל זאת תרצה לבחור?"],
  s4_step_5_resource_help: ["מתי בדיוק תשתמש במשאב כדי להתחיל את הצעד?"],
  s4_step_6_action: [
    "מה עלול לעצור את ההתחלה, ואיך אפשר להקטין את הצעד?",
    "איזה סימן קטן יראה שהתקדמת מול נקודת ההתחלה שלך?",
  ],
};

export function getCoachQuestions(
  step: JourneyStep,
  answer?: string,
): string[] {
  if (
    answer &&
    (unresolved.has(answer.trim()) ||
      /לא ברור|קשה לי לזהות|לא יודע|עדיין לא לבחור|להשאיר את הדברים פתוחים|עוד לא מתאים/.test(
        answer,
      ))
  ) {
    return ["תרצה שנעבור לדוגמה אחרת, נחזור למה שקרה או נשאיר את השאלה פתוחה?"];
  }
  if (!answer || step.uiType === "meditation")
    return (step.coachDeepeningQuestions || []).slice(0, 2);
  if (step.id === "step_3_feeling") {
    const first =
      answer === "פחד או דאגה"
        ? "מה חששת שיקרה, ומה ממנו היה ידוע באותו רגע?"
        : answer === "עצב או בדידות"
          ? "מה היה חסר לך בקשר או במצב הזה?"
          : answer === "כעס או תסכול"
            ? "איזה גבול, רצון או ציפייה לא קיבלו מקום באותו רגע?"
            : "מה ההרגשה הזאת מספרת לך על מה שהיה חשוב באותו רגע?";
    return [first, purposefulQuestions.step_3_feeling[1]];
  }
  return (
    purposefulQuestions[step.id] ||
    (step.coachDeepeningQuestions || []).slice(0, 2)
  );
}
const focuses: Record<string, string> = {
  step_3_feeling: "המשמעות האישית של הרגש, לפני הסבר על מקורו.",
  step_4_somatic: "התאמת דרך הבירור, ללא פירוש של תחושה כראיה.",
  step_5_urge: "הרווח המיידי, התוצאה ומה היא חיזקה בעיני המשתתף.",
  step_6_thought: "ההבדל בין עובדה, פירוש ותנאי לתחושת ערך.",
  step_7_protection: "מה נחוץ לשמור ומה המחיר של הדרך הנוכחית.",
  step_9_resource_action: "בעלות על הצעד, או בחירה מודעת בהתבוננות בלבד.",
  step_10_integration: "משמעות הצורך; הוא אינו פעולה או הסכם.",
  s2_step_3_interpretation: "החיבור האפשרי בין האירוע למשמעות על העצמי.",
  s2_step_4_sensitive_spot: "הפרדה בין הצורך, התנאי לקבלתו והחשש מאי־קבלתו.",
  s2_step_5_reaction: "השלמת התוצאה והמשמעות שסוגרות את הלולאה.",
  s2_step_6_cost: "שני צדדי השינוי: ההגנה הנחוצה והמחיר העודף.",
  s2_step_8_new_action: "הרצון שמניע את הצעד, ולא רק ההתנהגות החיצונית.",
  s2_step_9_agreement: "תפקיד ההגנה במצב ממשי בלי להכריז שנעלמה.",
  s2_step_10_closure: "סיכום אישי ומה עדיין פתוח, בלי הוכחת שחרור.",
  s3_step_2_secondary_gain: "מה קשה לאבד אם ההגנה תנהל פחות.",
  s3_step_2b_reaction: "תועלת התגובה לצד מה שהיא מונעת.",
  s3_step_3_need: "שמירת הצורך בלי להכתיב עבר או דימוי.",
  s3_step_9_new_contract: "הסכמה אישית ומרווח לבחירה לצד הפחד.",
  s4_step_1_what_i_want: "מה המטרה מאפשרת בחיים ולמי הרצון שייך.",
  s4_step_2_capability: "יכולת קיימת, פער מעשי וגודל צעד מתאים.",
  s4_step_3_blocker_impact: "מחסום אוטומטי לעומת מגבלה במציאות.",
  s4_step_4_secondary_gain: "מקור הבחירה: תשוקה, פחד או שניהם.",
  s4_step_6_action: "צעד, מועד, מחיר ומשמעות שהמשתתף בחר.",
};

function excerpt(value: string): string {
  const compact = value.replace(/\s+/g, " ").trim();
  return compact.length > 140 ? `${compact.slice(0, 137)}…` : compact;
}
function relatedEvidence(
  stepId: string,
  answers: Record<string, string>,
): string | undefined {
  const stage = stepId.startsWith("s4_")
    ? 4
    : stepId.startsWith("s3_")
      ? 3
      : stepId.startsWith("s2_")
        ? 2
        : 1;
  const keys: Array<[string, string]> =
    stage === 4
      ? [
          ["s4_step_1_what_i_want", "הרצון שנאמר"],
          ["s4_step_3_blocker_impact", "ההשפעה שתוארה"],
        ]
      : stage === 3
        ? [
            ["s3_step_2_secondary_gain", "התועלת שתוארה"],
            ["s3_step_3_need", "הצורך שנאמר"],
          ]
        : stage === 2
          ? [
              ["s2_step_3_interpretation", "המשמעות שנאמרה"],
              ["s2_step_5_reaction", "התגובה שתוארה"],
            ]
          : [
              ["step_6_thought", "הפירוש שנאמר"],
              ["step_5_urge", "התגובה שתוארה"],
            ];
  const evidence = keys
    .filter(
      ([key]) =>
        key !== stepId &&
        !!answers[key]?.trim() &&
        !unresolved.has(answers[key].trim()),
    )
    .map(([key, label]) => `${label}: ״${excerpt(answers[key])}״`);
  return evidence.length ? evidence.join(" · ") : undefined;
}

function relationship(
  stepId: string,
  answers: Record<string, string>,
): string | undefined {
  if (
    [
      "step_7_protection",
      "step_10_integration",
      "s2_step_6_cost",
      "s2_step_9_agreement",
    ].includes(stepId)
  ) {
    const thought = stepId.startsWith("s2_")
      ? answers.s2_step_3_interpretation
      : answers.step_6_thought;
    const reaction = stepId.startsWith("s2_")
      ? answers.s2_step_5_reaction
      : answers.step_5_urge;
    if (
      ["מצפים ממני ולא כדאי לאכזב", "אני חייב להסתדר או להצליח"].includes(
        thought,
      ) &&
      ["הסכמתי למרות שרציתי אחרת", "הסכמתי או לקחתי על עצמי עוד"].includes(
        reaction,
      )
    ) {
      return "בחיבור בין התשובות, ייתכן שההסכמה מפחיתה את החשש לאכזב מיד, אך אינה מאפשרת לבדוק אם הקשר יכול להישמר גם עם רצון שונה. כך התנאי לקבלה עשוי להישאר ללא בדיקה.";
    }
    if (
      ["אולי לא יקבלו אותי", "אולי אני לא חשוב כאן"].includes(thought) &&
      ["התרחקתי או רציתי להתרחק", "התרחקתי מהמצב"].includes(reaction)
    ) {
      return "בחיבור בין התשובות, ייתכן שהריחוק מגן מחשיפה אך גם מצמצם קשר או בירור שיכלו לתת מידע אחר. אם המרחק שנוצר מתפרש כהוכחה לחוסר מקום, הוא עשוי לחזק שוב את החשש המקורי.";
    }
    if (
      thought === "אם אטעה זה אומר משהו עליי" &&
      reaction === "התגוננתי או ניסיתי לשנות אחרים"
    ) {
      return "בחיבור בין התשובות, ייתכן שהתגובה מנסה להרחיק משמעות שלילית על העצמי, ולא רק לתקן את המשימה. הבחנה בין משוב על פעולה לבין ערך האדם יכולה לפתוח דרך לברר את המצב בלי לאבד כבוד.";
    }
  }
  if (
    ["s4_step_4_secondary_gain", "s4_step_6_action"].includes(stepId) &&
    answers.s4_step_3_blocker_impact === "אני פועל בעיקר כדי לקבל אישור"
  ) {
    return "מול חיפוש האישור שתואר, גם פעולה שנראית כהתקדמות עשויה להמשיך את אותו תנאי. חשוב לבדוק אם הצעד יהיה רצוי למשתתף גם כאשר אחרים אינם משבחים אותו.";
  }
  return undefined;
}

export function getCoachInsight({
  step,
  answer,
  answers = {},
  mechanism,
}: CoachInsightInput): CoachInsight | undefined {
  const selected = (answer ?? answers[step.id])?.trim();
  if (step.uiType === "meditation") {
    const permitted =
      answers.meditation_permission === "מתאים לי להמשיך עם המנחה";
    return {
      kind: "readiness",
      title: permitted ? "הסכמה להמשך, לא הוכחה לשינוי" : "מוכנות לפני עומק",
      explanation: permitted
        ? "ההסכמה מאפשרת לבדוק את דרך העבודה כרגע, אך אינה מחייבת המשך ואינה מוכיחה סילוק. גם בהמשך נדרש לעקוב אחר נוחות, נוכחות ורצון, ולסיים בהתמצאות כאן ועכשיו."
        : "לא תועדה הסכמה לדרך העבודה החווייתית. בירור צורך או בחירת דמות אינם הסכמה לדימוי, לעבודה עם חלק צעיר או להעמקה; אפשר להישאר בשיחה.",
      nextFocus: "הסכמה נוכחית, אפשרות עצירה ועוגן נוח במפגש.",
    };
  }
  if (!selected) return undefined;
  if (unresolved.has(selected))
    return {
      kind: "clarification",
      title: "משמעות שעוד לא נבחרה",
      explanation:
        "המשתתף לא נתן כאן הסבר אישי. אין למלא את החסר מתוך הדמות, האירוע או הכותרת שבחר המנחה; אפשר לשנות דרך בירור או להניח לשאלה.",
      nextFocus: "שמירה על הקצב ועל האפשרות לא לדעת.",
    };
  if (step.uiType === "text-input" || step.id === "s4_placeholder_trigger")
    return {
      kind: "clarification",
      title: "אירוע לפני משמעות",
      explanation:
        "תיאור האירוע מספק נקודת התחלה, אך אינו קובע מה האדם פירש או מה ניסתה התגובה להשיג. הפרדת הרגע המצולם מהמשמעות מאפשרת לבנות לולאה אישית במקום לשייך דפוס לפי סוג האירוע.",
      evidence: `האירוע שתואר: ״${excerpt(selected)}״`,
      nextFocus: "מה נאמר או נעשה, ואיזו משמעות נוספה לכך.",
    };
  if (step.uiType === "archetype-selector")
    return {
      kind: "clarification",
      title: "דימוי לפני הסבר",
      explanation:
        "בחירת דמות מאפשרת להתבונן במחסום ממרחק, אך אינה מגלה איזה דפוס פועל או למה הוא נוצר. המשמעות שהמשתתף נותן לדמות היא נקודת הבירור, ואפשר גם לשנות או לדחות אותה.",
      nextFocus: "תפקיד הדמות במילים האישיות, לפני חיבור לכותרת דפוס.",
    };
  if (step.uiType === "good-powers")
    return {
      kind: "clarification",
      title: "משאב שמרחיב בחירה",
      explanation:
        "בחירת משאב אינה מבטיחה שהוא מתאים או שיוריד מתח. הוא מועיל כשיש למשתתף דרך אישית להשתמש בו כדי לתת מקום לצורך ולרצון, ולא כדי להציג התקדמות למנחה.",
      nextFocus: "התאמה אישית ושימוש מעשי במשאב.",
    };
  const choices = step.options?.clouds ?? [];
  const index = choices.indexOf(selected);
  const explanation =
    index >= 0 ? coachHypotheses[step.id]?.[index] : undefined;
  if (!explanation)
    return {
      kind: "clarification",
      title: "תשובה אישית — לפני הסבר",
      explanation:
        "המשתתף ניסח חוויה מחוץ לאפשרויות המוצעות. אין להתאים לה אוטומטית פירוש של תשובה אחרת; כדאי לברר את המשמעות שלו לפני חיבור לצורך, לפחד או לתועלת של ההגנה.",
      evidence: `הניסוח האישי: ״${excerpt(selected)}״`,
      nextFocus: "המשמעות המדויקת של המילים עבור המשתתף.",
    };
  return {
    kind: "hypothesis",
    title: mechanism
      ? `כיוון לבדיקה בתוך ״${mechanism.title}״`
      : "חיבור אפשרי במנגנון",
    explanation: [explanation, relationship(step.id, answers)]
      .filter(Boolean)
      .join(" "),
    evidence: relatedEvidence(step.id, answers),
    nextFocus: focuses[step.id] ?? "התועלת, המחיר והמשמעות האישית של התגובה.",
  };
}
