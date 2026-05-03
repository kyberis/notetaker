import type { BotDictionary } from "./en";

export const es: BotDictionary = {
  bot: {
    welcome:
      "Hola, soy Will. Mandame un mensaje — texto, audio, foto o PDF — y lo guardo como nota. También puedo programar recordatorios.",
    linked:
      "Telegram conectado. Mandame lo que quieras y lo guardo.",
    linkExpired:
      "Ese link venció. Abrí Will en la web y generá uno nuevo desde /settings/telegram.",
    notLinked:
      "No reconozco esta cuenta de Telegram. Abrí Will en la web, andá a /settings/telegram y pegá el link para conectar.",
    quotaExceeded: (limit) =>
      `Llegaste al límite de ${limit} mensajes por hoy. Se resetea a las 00:00 UTC.`,
    saved: "Guardado.",
    savedWithReminder: (when) => `Guardado. Te aviso el ${when}.`,
    tagPrompt: "¿Le ponés alguna etiqueta?",
    tagApplied: (tags) => `Etiquetas: ${tags.map((t) => `#${t}`).join(" ")}`,
    tagSkipped: "Sin etiquetas. Listo.",
    reminderConfirm: (when) => `Recordatorio programado para el ${when}. ¿Cambiamos algo?`,
    reminderFired: (body) => `Recordatorio: ${body}`,
    listEmpty: "Todavía no hay notas. Mandame algo y arrancamos.",
    listHeader: (count, range) =>
      `Últimas ${count} nota${count === 1 ? "" : "s"} ${range}:`,
    deleted: "Nota borrada.",
    error: "Algo salió mal. ¿Probamos de nuevo?",
    languageChanged: (label) => `Listo — te respondo en ${label} desde ahora.`,
    voiceTooLong: "El audio es muy largo. Mantenelo bajo los 10 minutos.",
    photoFailed: "No pude leer esa imagen. ¿Me lo mandás como texto?",
    pdfFailed: "No pude leer ese PDF. ¿Probá uno más chico o pegá el texto?",
  },
  buttons: {
    yes: "Sí",
    no: "No",
    skip: "Saltar",
  },
};
