import type { BotDictionary } from "./en";

export const es: BotDictionary = {
  bot: {
    welcome:
      "Salud, milord. Soy Will, vuestro escriba. Mandame un mensaje — texto, audio, foto o PDF — y lo paso al pergamino. También programo recordatorios.",
    linked:
      "Telegram enlazado, milord. Mandame lo que quieras y lo anoto.",
    linkExpired:
      "Ese enlace venció, milord. Abrí Will en la web y generá uno fresco desde /settings/telegram.",
    notLinked:
      "No reconozco esta cuenta, viajero. Abrí Will en la web, entrá a /settings/telegram y pegá el enlace para conectar.",
    quotaExceeded: (limit) =>
      `Llegaste al límite de ${limit} mensajes por hoy, milord. Se renueva a las 00:00 UTC.`,
    saved: "Anotado.",
    savedWithReminder: (when) => `Anotado. Os llamo el ${when}.`,
    tagPrompt: "¿Le sumamos alguna etiqueta?",
    tagApplied: (tags) => `Etiquetas: ${tags.map((t) => `#${t}`).join(" ")}`,
    tagSkipped: "Sin etiquetas. Listo.",
    reminderConfirm: (when) => `Recordatorio listo para el ${when}. ¿Tocamos algo?`,
    reminderFired: (body) => `Recordatorio: ${body}`,
    listEmpty: "El pergamino está en blanco todavía, milord. Mandame algo y arrancamos.",
    listHeader: (count, range) =>
      `Últimas ${count} nota${count === 1 ? "" : "s"} ${range}:`,
    deleted: "Nota borrada del pergamino.",
    error: "Algo se torció, milord. ¿Probamos de nuevo?",
    languageChanged: (label) => `Listo — te respondo en ${label} desde ahora.`,
    voiceTooLong: "El audio es muy largo, milord. Mantenelo bajo los 10 minutos.",
    photoFailed: "No pude descifrar esa imagen. ¿Me la mandás como texto?",
    pdfFailed: "No pude leer ese PDF. ¿Probá uno más chico o pegame el texto?",
    confirmDeleteTitle: "¿La borro del pergamino?",
    confirmDeleteSummary: "Una vez borrada, no hay vuelta atrás.",
    confirmNoteLabel: "Nota",
    deleteCancelled: "La dejo donde está, milord. No borré nada.",
    confirmStale:
      "Ese pedido ya quedó viejo, milord. Pedímelo de nuevo y te lo ofrezco otra vez.",
    confirmFailed: "No pude hacerlo. ¿Probamos de nuevo?",
  },
  buttons: {
    yes: "Sí",
    no: "No",
    skip: "Saltar",
    delete: "Borrar",
    cancel: "Dejarla",
  },
};
