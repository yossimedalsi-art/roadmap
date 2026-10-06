export type Archetype = {
  id: string;
  name: string;
  role: string;
  icon?: string;
  description: string;
  kind?: "mechanism" | "resource";
  youthDescription?: string;
  coachPrompt: string;
  triggers: string[];
  youthTriggers?: string[];
  goalTriggers?: string[];
  youthGoalTriggers?: string[];
  imageUrl?: string;
};
export type World = {
  id: string;
  title: string;
  theme: "clouds" | "forest" | "arcade" | "fairies";
  archetypes: Archetype[];
};

const identities: Array<[World["theme"], string, Array<[string, string]>]> = [
  [
    "clouds",
    "ממלכת העננים",
    [
      ["turtle", "צב הקריסטל"],
      ["bunny", "ארנב הכוכבים"],
      ["cloud", "הענן הדאגן"],
      ["panda", "פנדה אדומה"],
      ["ghost", "רוח רפאים בשמיכה"],
      ["whale", "לווייתן השמיים"],
    ],
  ],
  [
    "forest",
    "יער השומרים",
    [
      ["golem", "ענק האבן"],
      ["wolf", "זאב הערבה"],
      ["dragon", "דרקון הקוצים"],
      ["wasps", "ענן הצרעות"],
      ["lake", "האגם הקפוא"],
      ["guardian", "שומר היער העתיק"],
    ],
  ],
  [
    "arcade",
    "מרחב המשחק",
    [
      ["firewall", "חומת האש"],
      ["battery", "סוללה על 1%"],
      ["hacker", "ההאקר"],
      ["glitch", "הגליץ׳"],
      ["airplane", "מצב טיסה"],
      ["ai", "ליבת ה־AI"],
    ],
  ],
  [
    "fairies",
    "יער האפשרויות",
    [
      ["perfection_fairy", "פיית השלמות"],
      ["doubt_troll", "טרול הספקות"],
      ["illusion_elf", "שדון הציפיות"],
      ["procrastination_fairy", "פיית המחר"],
      ["frustration_dwarf", "גמד התסכול"],
      ["magic_guardian", "שומרת יער הקסם"],
    ],
  ],
];

const goalEvents = [
  "הגיע הזמן לצעד הראשון במטרה שבחרתי",
  "מישהו שאל למה המטרה הזאת חשובה לי",
  "קיבלתי משוב על ניסיון שעשיתי",
  "נפתחה אפשרות לנסות דרך חדשה",
];
const resourceEvents = [
  "נזכרתי במשהו שעזר לי בעבר",
  "מישהו הציע לי תמיכה",
  "הייתה לי אפשרות לבחור את הקצב",
  "נפתח זמן לדבר על משהו שחשוב לי",
];
const resourceIds = new Set(["whale", "guardian", "ai", "magic_guardian"]);
const imagesOfBarriers: Record<string, string> = {
  turtle: "שריון שיכול לסגור את הדרך או לשמור מרחב.",
  bunny: "תרמיל כוכבים שאפשר לבדוק מה מתאים לשאת בו.",
  cloud: "ענן שאפשר לתת לו צורה, שם ותפקיד משלך.",
  panda: "פרווה מסתמרת שאפשר לברר מה היא מבקשת לשמור.",
  ghost: "שמיכה שאפשר לבחור מה להסתיר ומה להראות מאחוריה.",
  golem: "חומת אבן שאפשר לבדוק היכן היא שומרת והיכן היא חוסמת.",
  wolf: "זאב על השביל שאפשר לברר מה תפקידו עבורך.",
  dragon: "קוצים שאפשר לבדוק מה הם מרחיקים ומה הם שומרים.",
  wasps: "רעש של צרעות שאפשר לתת לו משמעות במילים שלך.",
  lake: "אגם קפוא שאפשר לבדוק מה הוא מייצג עבורך, אם בכלל.",
  firewall: "שער שאפשר לברר מה מתאים להכניס ומה להשאיר בחוץ.",
  battery: "סוללה שאפשר לברר מה הדימוי שלה אומר לך, בלי לקבוע למה אין כוח.",
  hacker: "דמות שמשנה את חוקי המשחק; אתה בוחר מה היא מייצגת.",
  glitch: "תקלה חוזרת שאפשר לבדוק איפה היא מופיעה בדרך שלך.",
  airplane: "מתג מצב טיסה שאפשר לבדוק מתי הוא מועיל ומתי הוא חוסם.",
  perfection_fairy: "פיה עם רף גבוה שאפשר לברר מי קבע אותו ומה הוא שומר.",
  doubt_troll: "טרול על השביל שאפשר לתת לשאלות שלו משמעות משלך.",
  illusion_elf: "שדון שמאיר כמה כיוונים; אפשר לברר איזה מהם שלך.",
  procrastination_fairy: "פיה שמזמינה לחכות; אפשר לברר מה ההמתנה נותנת לך.",
  frustration_dwarf: "גמד בקצב מהיר שאפשר לברר איזה קצב מתאים לך.",
};
const openingEvents: Record<World["theme"], string[]> = {
  clouds: [
    "שלחתי הודעה ועדיין אין תשובה",
    "המורה ביקשה שאציג מול הכיתה",
    "מישהו שאל אותי שאלה אישית",
    "אירוע אחר שאבחר לתאר",
  ],
  forest: [
    "חבר הציע שנדבר על מה שקרה",
    "בבית ביקשו ממני דבר מה",
    "הקבוצה החליטה על תוכנית חדשה",
    "אירוע אחר שאבחר לתאר",
  ],
  arcade: [
    "הגיעה הודעה אחרי שיחה",
    "נפתחה אפשרות לבחור בין שתי פעילויות",
    "התקבל משוב על עבודה",
    "אירוע אחר שאבחר לתאר",
  ],
  fairies: [
    "קיבלתי משימה עם תאריך הגשה",
    "התבקשתי להציג טיוטה",
    "חבר סיפר על תוכנית חדשה",
    "אירוע אחר שאבחר לתאר",
  ],
};

export const worldsData: World[] = identities.map(
  ([theme, title, identitiesInWorld]) => ({
    id: theme,
    title,
    theme,
    archetypes: identitiesInWorld.map(([id, name]) => {
      const isResource = resourceIds.has(id);
      const triggers = isResource
        ? [...resourceEvents]
        : [...openingEvents[theme]];
      const description = isResource
        ? "דמות שאפשר לתת לה תפקיד של תמיכה, קשב או כיוון — לפי הבחירה שלך."
        : imagesOfBarriers[id];
      return {
        id,
        name,
        role: isResource ? "מלווה לבחירה" : "דימוי למחסום אפשרי",
        kind: isResource ? ("resource" as const) : ("mechanism" as const),
        description,
        youthDescription: description,
        coachPrompt:
          "בקש מהמשתתף לתת לדמות משמעות משלו. אין להסיק דפוס מבחירת דמות או אירוע. אפשר לשנות, לדחות או להישאר בלי דמות.",
        triggers,
        youthTriggers: [...triggers],
        goalTriggers: [...goalEvents],
        youthGoalTriggers: [...goalEvents],
        imageUrl: `/images/${id}.webp`,
      };
    }),
  }),
);

const powers: Array<[string, string, string, string, string]> = [
  [
    "power_hug",
    "קשר תומך",
    "קרבה",
    "🫂",
    "לחשוב על אדם מתאים ולבחור אם לבקש נוכחות, שיחה או חיבוק בהסכמה.",
  ],
  [
    "power_word",
    "מילה שבחרתי",
    "עידוד",
    "💬",
    "לבחור משפט אמין שעוזר לך לזכור מה חשוב — בלי להבטיח שהכול יסתדר.",
  ],
  [
    "power_breath",
    "רגע לנשימה",
    "מרווח",
    "🌬️",
    "לשים לב לנשימה בקצב נוח, אם זה מתאים. אפשר לבחור עוגן אחר.",
  ],
  [
    "power_listen",
    "הקשבה",
    "מקום לחוויה",
    "👂",
    "לתת מקום למה שעובר עליך ולבחור מי יכול להקשיב בלי למהר להסביר.",
  ],
  [
    "power_grounding",
    "כאן ועכשיו",
    "התמצאות",
    "🌱",
    "להסתכל סביב, להרגיש את המגע בכיסא או ברצפה ולבחור מה נוח לך.",
  ],
  [
    "power_pause",
    "הפוגה שבחרתי",
    "מנוחה",
    "⏸️",
    "לעצור, לבדוק מה נחוץ עכשיו ולהחליט יחד מתי ואם מתאים להמשיך.",
  ],
  [
    "power_compassion",
    "יחס מכבד לעצמי",
    "קבלה",
    "💛",
    "לשים לב למאמץ ולהגנה בלי להפוך טעות למדד לערך שלך.",
  ],
  [
    "power_action",
    "תנועה או יצירה",
    "ביטוי",
    "🎨",
    "לבחור תנועה, ציור, מוזיקה או כתיבה שמתאימים לך עכשיו.",
  ],
];

export const goodPowersData: Archetype[] = powers.map(
  ([id, name, role, icon, description]) => ({
    id,
    name,
    role,
    icon,
    kind: "resource",
    description,
    youthDescription: description,
    coachPrompt:
      "הצע כאפשרות בלבד. שאל מה עזר בעבר, מה מתאים עכשיו ואיך המשתתף רוצה להשתמש במשאב.",
    triggers: [
      "כשארצה תמיכה",
      "כשארצה מרווח לפני בחירה",
      "כשארצה לחזור למה שחשוב לי",
    ],
    youthTriggers: [
      "כשארצה תמיכה",
      "כשארצה מרווח לפני בחירה",
      "כשארצה לחזור למה שחשוב לי",
    ],
  }),
);
