import type { BotDictionary } from "./en";

export const ar: BotDictionary = {
  bot: {
    welcome:
      "مرحباً، أنا ويل. أرسل لي رسالة — نصاً أو صوتاً أو صورة أو ملف PDF — وسأحفظها كملاحظة. يمكنني أيضاً جدولة التذكيرات.",
    linked: "تم ربط Telegram. أرسل أي شيء وسأحتفظ به لك.",
    linkExpired:
      "انتهت صلاحية الرابط. افتح ويل على الويب وأنشئ رابطاً جديداً من /settings/telegram.",
    notLinked:
      "لا أتعرف على حساب Telegram هذا. افتح ويل على الويب، اذهب إلى /settings/telegram، والصق الرابط للاتصال.",
    quotaExceeded: (limit) => `وصلت إلى حد ${limit} رسالة لليوم. يُعاد ضبطه في 00:00 UTC.`,
    saved: "تم الحفظ.",
    savedWithReminder: (when) => `تم الحفظ. سأذكرك في ${when}.`,
    tagPrompt: "هل تريد إضافة وسم؟",
    tagApplied: (tags) => `الوسوم: ${tags.map((t) => `#${t}`).join(" ")}`,
    tagSkipped: "بدون وسوم. حسناً.",
    reminderConfirm: (when) => `تم ضبط التذكير على ${when}. هل تريد تغيير شيء؟`,
    reminderFired: (body) => `تذكير: ${body}`,
    listEmpty: "لا توجد ملاحظات بعد. أرسل لي شيئاً ونبدأ.",
    listHeader: (count, range) => `آخر ${count} ملاحظة ${range}:`,
    deleted: "تم حذف الملاحظة.",
    error: "حدث خطأ ما. هل نحاول مجدداً؟",
    languageChanged: (label) => `تمام — سأرد بـ${label} من الآن.`,
    voiceTooLong: "الرسالة الصوتية طويلة جداً. اجعلها أقل من 10 دقائق.",
    photoFailed: "لم أستطع قراءة هذه الصورة. أرسلها كنص؟",
    pdfFailed: "لم أستطع قراءة ملف PDF. جرب ملفاً أصغر أو الصق النص؟",
    confirmDeleteTitle: "هل أحذف هذه من السجل؟",
    confirmDeleteSummary: "بعد الحذف لا يمكن استرجاعها.",
    confirmNoteLabel: "الملاحظة",
    deleteCancelled: "أبقيتها كما هي. لم أحذف شيئاً.",
    confirmStale: "انتهت صلاحية هذا الطلب. اطلبه مرة أخرى وسأعرضه من جديد.",
    confirmFailed: "لم أتمكن من تنفيذ ذلك. أحاول مرة أخرى؟",
  },
  buttons: {
    yes: "نعم",
    no: "لا",
    skip: "تخطّي",
    delete: "حذف",
    cancel: "إبقاء",
  },
};
