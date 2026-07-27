import type { BotDictionary } from "./en";

export const pt: BotDictionary = {
  bot: {
    welcome:
      "Oi, sou o Will. Me manda uma mensagem — texto, áudio, foto ou PDF — e eu salvo como anotação. Também posso agendar lembretes.",
    linked:
      "Telegram conectado. Me manda qualquer coisa e eu guardo pra você.",
    linkExpired:
      "Esse link expirou. Abra o Will na web e gere um novo em /settings/telegram.",
    notLinked:
      "Não reconheço essa conta do Telegram. Abra o Will na web, vá em /settings/telegram e cole o link para conectar.",
    quotaExceeded: (limit) =>
      `Você atingiu o limite de ${limit} mensagens hoje. Reinicia às 00:00 UTC.`,
    saved: "Salvo.",
    savedWithReminder: (when) => `Salvo. Te aviso em ${when}.`,
    tagPrompt: "Quer colocar alguma etiqueta?",
    tagApplied: (tags) => `Etiquetas: ${tags.map((t) => `#${t}`).join(" ")}`,
    tagSkipped: "Sem etiquetas. Beleza.",
    reminderConfirm: (when) => `Lembrete agendado para ${when}. Quer mudar algo?`,
    reminderFired: (body) => `Lembrete: ${body}`,
    listEmpty: "Ainda sem anotações. Me manda algo e começamos.",
    listHeader: (count, range) =>
      `Últimas ${count} anotaç${count === 1 ? "ão" : "ões"} ${range}:`,
    deleted: "Anotação apagada.",
    error: "Algo deu errado. Tenta de novo?",
    languageChanged: (label) => `Beleza — vou responder em ${label} a partir de agora.`,
    voiceTooLong: "Esse áudio está muito longo. Tente algo abaixo de 10 minutos.",
    photoFailed: "Não consegui ler essa imagem. Me manda como texto?",
    pdfFailed: "Não consegui ler esse PDF. Tenta um menor ou cola o texto?",
    confirmDeleteTitle: "Apago isso do pergaminho?",
    confirmDeleteSummary: "Depois de apagada, não dá para recuperar.",
    confirmNoteLabel: "Anotação",
    deleteCancelled: "Mantida, milorde. Não apaguei nada.",
    confirmStale:
      "Esse pedido já envelheceu, milorde. Peça de novo e eu ofereço outra vez.",
    confirmFailed: "Não consegui fazer isso. Tenta de novo?",
  },
  buttons: {
    yes: "Sim",
    no: "Não",
    skip: "Pular",
    delete: "Apagar",
    cancel: "Manter",
  },
};
