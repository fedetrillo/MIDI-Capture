// MIDI Capture: listens to LUNA's MIDI input while its window is open, keeps what you play as
// takes (a take ends after a silence), and puts the one you pick on an instrument track: where
// you played it when LUNA was rolling, or at the cursor. The pure part lives in logic.js.

(() => {
  const $ = (id) => document.getElementById(id);
  const L = window.CaptureLogic;
  const VERSION = '1.0.1';
  const KEY = 'com.fedetrillo.midicapture.';
  const store = {
    get: (k) => { try { return JSON.parse(localStorage.getItem(KEY + k)); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch { /* not fatal */ } },
  };

  const I18N = {
    en: {
      help: "Quick guide", tNext: "Next", tBack: "Back", tSkip: "Skip", tDone: "Got it", g1t: "It is always listening", g1: "While this window is open, everything you play on your MIDI keyboard is kept, with LUNA playing or stopped, recording or not. Choose a device or channel here if you need to.", g2t: "Your takes", g2: "When you stop playing for a few seconds, what you played becomes a take in this list. The last 15 minutes are kept.", g3t: "See, listen, choose", g3: "Pick a take to see it, play it through your instrument and choose where it goes: where you played it, or at the cursor.", g4t: "Capture it", g4: "Sends the last take to your armed or selected instrument track in one step. You can also press C. Tip: keep this window open in a corner while you play.", _name: 'English',
      listening: 'Listening', notListening: 'Not listening', input: 'Input', allInputs: 'All devices', chan: 'Channel', allChans: 'All', cut: 'New take after',
      memory: '{n} takes · last {m} min', last: 'Capture the last one', takes: 'Takes', clearAll: 'Clear all',
      take: 'Take {n}', playing: 'Playing now…', rolling: 'LUNA rolling', free: 'Free', captured: 'Captured',
      bars: 'Bars {a}–{b}', notes: '{n} notes', sustain: 'sustain', ago: '{t} ago', now: 'now',
      emptyList: 'Play something on your MIDI keyboard: it is kept here even if you are not recording.',
      emptyView: 'Pick a take on the left to see it, hear it and capture it.',
      place: 'Place', placePlayed: 'Where I played it', placeCursor: 'At the cursor',
      dest: 'On', destAuto: 'Armed or selected track · {t}', destNone: 'Arm or select an instrument track', destNew: 'New track',
      pedal: 'Fold the sustain pedal into the note lengths',
      listen: '▶ Listen', stopListen: '■ Stop', discard: 'Discard', capture: 'Capture on {t}', captureNew: 'Capture on a new track',
      sCaptured: '{n} notes captured on {t}', sNoTrack: 'Arm or select an instrument track first, or choose New track', sNothing: 'Nothing to capture yet',
      sNoDevices: 'LUNA sees no MIDI input device', sDiscarded: 'Take discarded', sCleared: 'Takes cleared',
      foot: 'Play whenever you like: what you play in the next {m} minutes stays here even if you do not record. Press C to capture the last take.',
      error: 'Error: {e}', waiting: 'Waiting for LUNA…', noSession: 'Open a session in LUNA.', report: 'Report copied', newTrackName: 'MIDI Capture',
      dark: 'Dark', grey: 'Grey', color: 'Colour', cYellow: 'Yellow', cOrange: 'Orange', cRed: 'Red', cGreen: 'Green', cBlue: 'Blue', cPink: 'Pink', cPurple: 'Purple',
    },
    es: {
      help: "Guía rápida", tNext: "Siguiente", tBack: "Atrás", tSkip: "Saltar", tDone: "Entendido", g1t: "Siempre está escuchando", g1: "Mientras esta ventana está abierta, se guarda todo lo que tocas en tu teclado MIDI, con LUNA en marcha o parado, grabando o no. Aquí puedes elegir un dispositivo o canal si lo necesitas.", g2t: "Tus tomas", g2: "Cuando dejas de tocar unos segundos, lo que tocaste se convierte en una toma en esta lista. Se guardan los últimos 15 minutos.", g3t: "Mira, escucha, elige", g3: "Elige una toma para verla, escucharla con tu instrumento y decidir dónde va: donde la tocaste o en el cursor.", g4t: "Captúrala", g4: "Manda la última toma a tu pista de instrumento armada o seleccionada en un solo paso. También puedes pulsar C. Consejo: deja esta ventana abierta en un rincón mientras tocas.", _name: 'Español',
      listening: 'Escuchando', notListening: 'Sin escuchar', input: 'Entrada', allInputs: 'Todos los dispositivos', chan: 'Canal', allChans: 'Todos', cut: 'Nueva toma tras',
      memory: '{n} tomas · últimos {m} min', last: 'Capturar la última', takes: 'Tomas', clearAll: 'Borrar todas',
      take: 'Toma {n}', playing: 'Tocando ahora…', rolling: 'Con LUNA en marcha', free: 'Libre', captured: 'Capturada',
      bars: 'Compases {a}–{b}', notes: '{n} notas', sustain: 'sustain', ago: 'hace {t}', now: 'ahora',
      emptyList: 'Toca algo en tu teclado MIDI: se queda aquí aunque no estés grabando.',
      emptyView: 'Elige una toma a la izquierda para verla, escucharla y capturarla.',
      place: 'Colocar', placePlayed: 'Donde la toqué', placeCursor: 'En el cursor',
      dest: 'En', destAuto: 'Pista armada o seleccionada · {t}', destNone: 'Arma o selecciona una pista de instrumento', destNew: 'Pista nueva',
      pedal: 'Aplicar el pedal de sustain a la duración de las notas',
      listen: '▶ Escuchar', stopListen: '■ Parar', discard: 'Descartar', capture: 'Capturar en {t}', captureNew: 'Capturar en una pista nueva',
      sCaptured: '{n} notas capturadas en {t}', sNoTrack: 'Arma o selecciona antes una pista de instrumento, o elige Pista nueva', sNothing: 'Aún no hay nada que capturar',
      sNoDevices: 'LUNA no ve ningún dispositivo de entrada MIDI', sDiscarded: 'Toma descartada', sCleared: 'Tomas borradas',
      foot: 'Toca cuando quieras: lo que toques en los próximos {m} minutos queda aquí aunque no grabes. Pulsa C para capturar la última toma.',
      error: 'Error: {e}', waiting: 'Esperando a LUNA…', noSession: 'Abre una sesión en LUNA.', report: 'Informe copiado', newTrackName: 'MIDI Capture',
      dark: 'Oscuro', grey: 'Gris', color: 'Color', cYellow: 'Amarillo', cOrange: 'Naranja', cRed: 'Rojo', cGreen: 'Verde', cBlue: 'Azul', cPink: 'Rosa', cPurple: 'Morado',
    },
  };

  Object.assign(I18N, {"ca": { "help": "Guia ràpida", "tNext": "Següent", "tBack": "Enrere", "tSkip": "Saltar", "tDone": "Entesos", "g1t": "Sempre està escoltant", "g1": "Mentre aquesta finestra és oberta, es guarda tot el que toques al teu teclat MIDI, amb LUNA en marxa o aturat, gravant o no. Aquí pots triar un dispositiu o canal si cal.", "g2t": "Les teves preses", "g2": "Quan deixes de tocar uns segons, el que has tocat es converteix en una presa en aquesta llista. Es guarden els últims 15 minuts.", "g3t": "Mira, escolta, tria", "g3": "Tria una presa per veure-la, escoltar-la amb el teu instrument i decidir on va: on la vas tocar o al cursor.", "g4t": "Captura-la", "g4": "Envia l’última presa a la pista d’instrument armada o seleccionada en un sol pas. També pots prémer C. Consell: deixa aquesta finestra oberta en un racó mentre toques.","_name": "Català", "listening": "Escoltant", "notListening": "Sense escoltar", "input": "Entrada", "allInputs": "Tots els dispositius", "chan": "Canal", "allChans": "Tots", "cut": "Presa nova després de", "memory": "{n} preses · últims {m} min", "last": "Capturar l’última", "takes": "Preses", "clearAll": "Esborrar-les totes", "take": "Presa {n}", "playing": "Tocant ara…", "rolling": "Amb LUNA en marxa", "free": "Lliure", "captured": "Capturada", "bars": "Compassos {a}–{b}", "notes": "{n} notes", "sustain": "sustain", "ago": "fa {t}", "now": "ara", "emptyList": "Toca alguna cosa al teu teclat MIDI: es queda aquí encara que no estiguis gravant.", "emptyView": "Tria una presa a l’esquerra per veure-la, escoltar-la i capturar-la.", "place": "Col·locar", "placePlayed": "On la vaig tocar", "placeCursor": "Al cursor", "dest": "A", "destAuto": "Pista armada o seleccionada · {t}", "destNone": "Arma o selecciona una pista d’instrument", "destNew": "Pista nova", "pedal": "Aplicar el pedal de sustain a la durada de les notes", "listen": "▶ Escoltar", "stopListen": "■ Aturar", "discard": "Descartar", "capture": "Capturar a {t}", "captureNew": "Capturar en una pista nova", "sCaptured": "{n} notes capturades a {t}", "sNoTrack": "Arma o selecciona abans una pista d’instrument, o tria Pista nova", "sNothing": "Encara no hi ha res a capturar", "sNoDevices": "LUNA no veu cap dispositiu d’entrada MIDI", "sDiscarded": "Presa descartada", "sCleared": "Preses esborrades", "foot": "Toca quan vulguis: el que toquis els propers {m} minuts queda aquí encara que no gravis. Prem C per capturar l’última presa.", "error": "Error: {e}", "waiting": "Esperant LUNA…", "noSession": "Obre una sessió a LUNA.", "report": "Informe copiat", "newTrackName": "MIDI Capture", "dark": "Fosc", "grey": "Gris", "color": "Color", "cYellow": "Groc", "cOrange": "Taronja", "cRed": "Vermell", "cGreen": "Verd", "cBlue": "Blau", "cPink": "Rosa", "cPurple": "Morat"}, "fr": { "help": "Guide rapide", "tNext": "Suivant", "tBack": "Retour", "tSkip": "Passer", "tDone": "Compris", "g1t": "Toujours à l’écoute", "g1": "Tant que cette fenêtre est ouverte, tout ce que vous jouez sur votre clavier MIDI est gardé, LUNA en lecture ou à l’arrêt, en enregistrement ou non. Choisissez ici un appareil ou un canal si besoin.", "g2t": "Vos prises", "g2": "Quand vous arrêtez de jouer quelques secondes, ce que vous avez joué devient une prise dans cette liste. Les 15 dernières minutes sont gardées.", "g3t": "Voir, écouter, choisir", "g3": "Choisissez une prise pour la voir, l’écouter avec votre instrument et décider où elle va : là où vous l’avez jouée, ou au curseur.", "g4t": "Capturez-la", "g4": "Envoie la dernière prise sur votre piste instrument armée ou sélectionnée en une seule étape. Vous pouvez aussi appuyer sur C. Astuce : gardez cette fenêtre ouverte dans un coin pendant que vous jouez.","_name": "Français", "listening": "À l’écoute", "notListening": "Pas à l’écoute", "input": "Entrée", "allInputs": "Tous les appareils", "chan": "Canal", "allChans": "Tous", "cut": "Nouvelle prise après", "memory": "{n} prises · {m} dernières min", "last": "Capturer la dernière", "takes": "Prises", "clearAll": "Tout effacer", "take": "Prise {n}", "playing": "En cours…", "rolling": "LUNA en lecture", "free": "Libre", "captured": "Capturée", "bars": "Mesures {a}–{b}", "notes": "{n} notes", "sustain": "sustain", "ago": "il y a {t}", "now": "maintenant", "emptyList": "Jouez quelque chose sur votre clavier MIDI : c’est gardé ici même sans enregistrer.", "emptyView": "Choisissez une prise à gauche pour la voir, l’écouter et la capturer.", "place": "Placer", "placePlayed": "Là où je l’ai jouée", "placeCursor": "Au curseur", "dest": "Sur", "destAuto": "Piste armée ou sélectionnée · {t}", "destNone": "Armez ou sélectionnez une piste instrument", "destNew": "Nouvelle piste", "pedal": "Appliquer la pédale de sustain à la durée des notes", "listen": "▶ Écouter", "stopListen": "■ Arrêter", "discard": "Jeter", "capture": "Capturer sur {t}", "captureNew": "Capturer sur une nouvelle piste", "sCaptured": "{n} notes capturées sur {t}", "sNoTrack": "Armez ou sélectionnez d’abord une piste instrument, ou choisissez Nouvelle piste", "sNothing": "Rien à capturer pour l’instant", "sNoDevices": "LUNA ne voit aucun appareil d’entrée MIDI", "sDiscarded": "Prise jetée", "sCleared": "Prises effacées", "foot": "Jouez quand vous voulez : ce que vous jouez pendant les {m} prochaines minutes reste ici même sans enregistrer. Appuyez sur C pour capturer la dernière prise.", "error": "Erreur : {e}", "waiting": "En attente de LUNA…", "noSession": "Ouvrez une session dans LUNA.", "report": "Rapport copié", "newTrackName": "MIDI Capture", "dark": "Sombre", "grey": "Gris", "color": "Couleur", "cYellow": "Jaune", "cOrange": "Orange", "cRed": "Rouge", "cGreen": "Vert", "cBlue": "Bleu", "cPink": "Rose", "cPurple": "Violet"}, "de": { "help": "Kurzanleitung", "tNext": "Weiter", "tBack": "Zurück", "tSkip": "Überspringen", "tDone": "Verstanden", "g1t": "Hört immer zu", "g1": "Solange dieses Fenster offen ist, bleibt alles, was du auf deinem MIDI-Keyboard spielst, erhalten – ob LUNA läuft oder steht, mit oder ohne Aufnahme. Hier kannst du bei Bedarf ein Gerät oder einen Kanal wählen.", "g2t": "Deine Takes", "g2": "Wenn du ein paar Sekunden nicht spielst, wird das Gespielte zu einem Take in dieser Liste. Die letzten 15 Minuten bleiben erhalten.", "g3t": "Ansehen, anhören, wählen", "g3": "Wähle einen Take, um ihn zu sehen, mit deinem Instrument anzuhören und festzulegen, wohin er kommt: dorthin, wo du ihn gespielt hast, oder an den Cursor.", "g4t": "Übernimm ihn", "g4": "Schickt den letzten Take in einem Schritt auf deine scharfe oder gewählte Instrumentspur. Du kannst auch C drücken. Tipp: Lass dieses Fenster beim Spielen in einer Ecke offen.","_name": "Deutsch", "listening": "Hört zu", "notListening": "Hört nicht zu", "input": "Eingang", "allInputs": "Alle Geräte", "chan": "Kanal", "allChans": "Alle", "cut": "Neuer Take nach", "memory": "{n} Takes · letzte {m} Min.", "last": "Letzten übernehmen", "takes": "Takes", "clearAll": "Alle löschen", "take": "Take {n}", "playing": "Wird gespielt…", "rolling": "LUNA läuft", "free": "Frei", "captured": "Übernommen", "bars": "Takte {a}–{b}", "notes": "{n} Noten", "sustain": "Sustain", "ago": "vor {t}", "now": "jetzt", "emptyList": "Spiel etwas auf deinem MIDI-Keyboard: es bleibt hier, auch ohne Aufnahme.", "emptyView": "Wähle links einen Take, um ihn zu sehen, anzuhören und zu übernehmen.", "place": "Platzieren", "placePlayed": "Wo ich ihn gespielt habe", "placeCursor": "Am Cursor", "dest": "Auf", "destAuto": "Scharfe oder gewählte Spur · {t}", "destNone": "Instrumentspur scharf schalten oder wählen", "destNew": "Neue Spur", "pedal": "Sustain-Pedal in die Notenlängen übernehmen", "listen": "▶ Anhören", "stopListen": "■ Stopp", "discard": "Verwerfen", "capture": "Auf {t} übernehmen", "captureNew": "Auf neue Spur übernehmen", "sCaptured": "{n} Noten auf {t} übernommen", "sNoTrack": "Zuerst eine Instrumentspur scharf schalten oder wählen, oder Neue Spur wählen", "sNothing": "Noch nichts zu übernehmen", "sNoDevices": "LUNA sieht kein MIDI-Eingangsgerät", "sDiscarded": "Take verworfen", "sCleared": "Takes gelöscht", "foot": "Spiel, wann du willst: was du in den nächsten {m} Minuten spielst, bleibt hier, auch ohne Aufnahme. Drücke C, um den letzten Take zu übernehmen.", "error": "Fehler: {e}", "waiting": "Warte auf LUNA…", "noSession": "Öffne eine Session in LUNA.", "report": "Bericht kopiert", "newTrackName": "MIDI Capture", "dark": "Dunkel", "grey": "Grau", "color": "Farbe", "cYellow": "Gelb", "cOrange": "Orange", "cRed": "Rot", "cGreen": "Grün", "cBlue": "Blau", "cPink": "Pink", "cPurple": "Lila"}, "it": { "help": "Guida rapida", "tNext": "Avanti", "tBack": "Indietro", "tSkip": "Salta", "tDone": "Capito", "g1t": "Sempre in ascolto", "g1": "Finché questa finestra è aperta, tutto ciò che suoni sulla tastiera MIDI viene conservato, con LUNA in riproduzione o fermo, registrando o no. Qui puoi scegliere un dispositivo o un canale se serve.", "g2t": "Le tue take", "g2": "Quando smetti di suonare per qualche secondo, ciò che hai suonato diventa una take in questo elenco. Si conservano gli ultimi 15 minuti.", "g3t": "Guarda, ascolta, scegli", "g3": "Scegli una take per vederla, ascoltarla con il tuo strumento e decidere dove va: dove l’hai suonata o al cursore.", "g4t": "Catturala", "g4": "Manda l’ultima take sulla traccia strumento armata o selezionata in un solo passo. Puoi anche premere C. Consiglio: tieni questa finestra aperta in un angolo mentre suoni.","_name": "Italiano", "listening": "In ascolto", "notListening": "Non in ascolto", "input": "Ingresso", "allInputs": "Tutti i dispositivi", "chan": "Canale", "allChans": "Tutti", "cut": "Nuova take dopo", "memory": "{n} take · ultimi {m} min", "last": "Cattura l’ultima", "takes": "Take", "clearAll": "Cancella tutte", "take": "Take {n}", "playing": "Sto suonando…", "rolling": "Con LUNA in riproduzione", "free": "Libera", "captured": "Catturata", "bars": "Battute {a}–{b}", "notes": "{n} note", "sustain": "sustain", "ago": "{t} fa", "now": "ora", "emptyList": "Suona qualcosa sulla tastiera MIDI: resta qui anche se non stai registrando.", "emptyView": "Scegli una take a sinistra per vederla, ascoltarla e catturarla.", "place": "Posiziona", "placePlayed": "Dove l’ho suonata", "placeCursor": "Al cursore", "dest": "Su", "destAuto": "Traccia armata o selezionata · {t}", "destNone": "Arma o seleziona una traccia strumento", "destNew": "Nuova traccia", "pedal": "Applica il pedale di sustain alla durata delle note", "listen": "▶ Ascolta", "stopListen": "■ Ferma", "discard": "Scarta", "capture": "Cattura su {t}", "captureNew": "Cattura su una nuova traccia", "sCaptured": "{n} note catturate su {t}", "sNoTrack": "Arma o seleziona prima una traccia strumento, o scegli Nuova traccia", "sNothing": "Ancora niente da catturare", "sNoDevices": "LUNA non vede alcun dispositivo di ingresso MIDI", "sDiscarded": "Take scartata", "sCleared": "Take cancellate", "foot": "Suona quando vuoi: ciò che suoni nei prossimi {m} minuti resta qui anche se non registri. Premi C per catturare l’ultima take.", "error": "Errore: {e}", "waiting": "In attesa di LUNA…", "noSession": "Apri una sessione in LUNA.", "report": "Rapporto copiato", "newTrackName": "MIDI Capture", "dark": "Scuro", "grey": "Grigio", "color": "Colore", "cYellow": "Giallo", "cOrange": "Arancione", "cRed": "Rosso", "cGreen": "Verde", "cBlue": "Blu", "cPink": "Rosa", "cPurple": "Viola"}, "pt": { "help": "Guia rápido", "tNext": "Seguinte", "tBack": "Voltar", "tSkip": "Saltar", "tDone": "Percebi", "g1t": "Está sempre a ouvir", "g1": "Enquanto esta janela está aberta, tudo o que tocas no teclado MIDI fica guardado, com o LUNA a tocar ou parado, a gravar ou não. Aqui podes escolher um dispositivo ou canal se precisares.", "g2t": "Os teus takes", "g2": "Quando paras de tocar uns segundos, o que tocaste passa a ser um take nesta lista. Ficam guardados os últimos 15 minutos.", "g3t": "Vê, ouve, escolhe", "g3": "Escolhe um take para o ver, ouvir com o teu instrumento e decidir para onde vai: onde o tocaste ou no cursor.", "g4t": "Captura-o", "g4": "Envia o último take para a tua faixa de instrumento armada ou selecionada num só passo. Também podes carregar em C. Dica: deixa esta janela aberta num canto enquanto tocas.","_name": "Português", "listening": "A ouvir", "notListening": "Sem ouvir", "input": "Entrada", "allInputs": "Todos os dispositivos", "chan": "Canal", "allChans": "Todos", "cut": "Novo take após", "memory": "{n} takes · últimos {m} min", "last": "Capturar o último", "takes": "Takes", "clearAll": "Apagar todos", "take": "Take {n}", "playing": "A tocar…", "rolling": "Com o LUNA a tocar", "free": "Livre", "captured": "Capturado", "bars": "Compassos {a}–{b}", "notes": "{n} notas", "sustain": "sustain", "ago": "há {t}", "now": "agora", "emptyList": "Toca algo no teu teclado MIDI: fica aqui mesmo que não estejas a gravar.", "emptyView": "Escolhe um take à esquerda para o ver, ouvir e capturar.", "place": "Colocar", "placePlayed": "Onde o toquei", "placeCursor": "No cursor", "dest": "Em", "destAuto": "Faixa armada ou selecionada · {t}", "destNone": "Arma ou seleciona uma faixa de instrumento", "destNew": "Faixa nova", "pedal": "Aplicar o pedal de sustain à duração das notas", "listen": "▶ Ouvir", "stopListen": "■ Parar", "discard": "Descartar", "capture": "Capturar em {t}", "captureNew": "Capturar numa faixa nova", "sCaptured": "{n} notas capturadas em {t}", "sNoTrack": "Arma ou seleciona primeiro uma faixa de instrumento, ou escolhe Faixa nova", "sNothing": "Ainda não há nada para capturar", "sNoDevices": "O LUNA não vê nenhum dispositivo de entrada MIDI", "sDiscarded": "Take descartado", "sCleared": "Takes apagados", "foot": "Toca quando quiseres: o que tocares nos próximos {m} minutos fica aqui mesmo que não graves. Carrega em C para capturar o último take.", "error": "Erro: {e}", "waiting": "À espera do LUNA…", "noSession": "Abre uma sessão no LUNA.", "report": "Relatório copiado", "newTrackName": "MIDI Capture", "dark": "Escuro", "grey": "Cinzento", "color": "Cor", "cYellow": "Amarelo", "cOrange": "Laranja", "cRed": "Vermelho", "cGreen": "Verde", "cBlue": "Azul", "cPink": "Rosa", "cPurple": "Roxo"}});

  let lang = store.get('lang') ?? (() => { for (const l of navigator.languages ?? [navigator.language]) { const c = String(l || '').slice(0, 2).toLowerCase(); if (I18N[c]) return c; } return 'en'; })();
  if (!I18N[lang]) lang = 'en';
  const t = (k, v = {}) => String(I18N[lang]?.[k] ?? I18N.en[k] ?? k).replace(/\{(\w+)\}/g, (m, x) => (x in v ? String(v[x]) : m));
  const COLORS = ['yellow', 'orange', 'red', 'green', 'blue', 'pink', 'purple'];

  // The device picker.
  const PICK = {
    en: ['Notes', 'Quiet', 'Choose which device to capture. The light shows which one is sending MIDI right now.'],
    es: ['Notas', 'En silencio', 'Elige qué aparato capturar. La luz indica cuál está mandando MIDI ahora mismo.'],
    ca: ['Notes', 'En silenci', 'Tria quin aparell capturar. La llum indica quin està enviant MIDI ara mateix.'],
    fr: ['Notes', 'Silencieux', 'Choisissez l’appareil à capturer. Le voyant montre lequel envoie du MIDI en ce moment.'],
    de: ['Noten', 'Still', 'Wähle das Gerät, das aufgefangen wird. Das Licht zeigt, welches gerade MIDI sendet.'],
    it: ['Note', 'Silenzio', 'Scegli quale dispositivo catturare. La luce indica quale sta inviando MIDI in questo momento.'],
    pt: ['Notas', 'Em silêncio', 'Escolhe que aparelho capturar. A luz mostra qual está a enviar MIDI neste momento.'],
  };
  for (const [c, [a, b, h]] of Object.entries(PICK)) Object.assign(I18N[c], { mNotes: a, mQuiet: b, pickHint: h });

  // Dropping a take on the arrangement with a click, and the guide button.
  const AIM = {
    en: { helpBtn: 'Guide', aimBtn: 'Drop with a click', aimOn: 'Now click in the arrangement, on the instrument track and at the spot where you want it. Esc cancels.', aimNotInst: 'That is not an instrument track: click on one.', aimCancel: 'Cancel', aimOff: 'Drop cancelled', dragHint: 'Drag it out of this window, then click where you want it in the arrangement', g3x: ' Or drag it out of this window and click where you want it in the arrangement.', g5t: 'Always at hand', g5: 'Open this guide again whenever you need it with the Guide button.' },
    es: { helpBtn: 'Guía', aimBtn: 'Soltar con un clic', aimOn: 'Ahora haz clic en el arrangement, en la pista de instrumento y en el punto donde la quieras. Esc cancela.', aimNotInst: 'Esa no es una pista de instrumento: haz clic en una.', aimCancel: 'Cancelar', aimOff: 'Cancelado', dragHint: 'Arrástrala fuera de esta ventana y haz clic donde la quieras en el arrangement', g3x: ' O arrástrala fuera de esta ventana y haz clic donde la quieras en el arrangement.', g5t: 'Siempre a mano', g5: 'Vuelve a esta guía cuando la necesites con el botón Guía.' },
    ca: { helpBtn: 'Guia', aimBtn: 'Deixar amb un clic', aimOn: 'Ara fes clic a l’arrangement, a la pista d’instrument i al punt on la vulguis. Esc cancel·la.', aimNotInst: 'Aquesta no és una pista d’instrument: fes clic en una.', aimCancel: 'Cancel·lar', aimOff: 'Cancel·lat', dragHint: 'Arrossega-la fora d’aquesta finestra i fes clic on la vulguis a l’arrangement', g3x: ' O arrossega-la fora d’aquesta finestra i fes clic on la vulguis a l’arrangement.', g5t: 'Sempre a mà', g5: 'Torna a aquesta guia quan la necessitis amb el botó Guia.' },
    fr: { helpBtn: 'Guide', aimBtn: 'Déposer d’un clic', aimOn: 'Cliquez maintenant dans l’arrangement, sur la piste instrument et à l’endroit voulu. Échap annule.', aimNotInst: 'Ce n’est pas une piste instrument : cliquez sur l’une d’elles.', aimCancel: 'Annuler', aimOff: 'Annulé', dragHint: 'Faites-la glisser hors de cette fenêtre, puis cliquez où vous la voulez dans l’arrangement', g3x: ' Ou faites-la glisser hors de cette fenêtre et cliquez où vous la voulez dans l’arrangement.', g5t: 'Toujours à portée', g5: 'Rouvrez ce guide quand vous voulez avec le bouton Guide.' },
    de: { helpBtn: 'Anleitung', aimBtn: 'Per Klick ablegen', aimOn: 'Klicke jetzt im Arrangement auf die Instrumentspur, an die Stelle, wo er hin soll. Esc bricht ab.', aimNotInst: 'Das ist keine Instrumentspur: klicke auf eine.', aimCancel: 'Abbrechen', aimOff: 'Abgebrochen', dragHint: 'Zieh ihn aus diesem Fenster und klicke im Arrangement, wo er hin soll', g3x: ' Oder zieh ihn aus diesem Fenster und klicke im Arrangement, wo er hin soll.', g5t: 'Immer zur Hand', g5: 'Öffne diese Anleitung jederzeit wieder mit dem Button Anleitung.' },
    it: { helpBtn: 'Guida', aimBtn: 'Rilascia con un clic', aimOn: 'Ora fai clic nell’arrangement, sulla traccia strumento e nel punto in cui la vuoi. Esc annulla.', aimNotInst: 'Quella non è una traccia strumento: fai clic su una.', aimCancel: 'Annulla', aimOff: 'Annullato', dragHint: 'Trascinala fuori da questa finestra, poi fai clic dove la vuoi nell’arrangement', g3x: ' Oppure trascinala fuori da questa finestra e fai clic dove la vuoi nell’arrangement.', g5t: 'Sempre a portata di mano', g5: 'Riapri questa guida quando ti serve con il pulsante Guida.' },
    pt: { helpBtn: 'Guia', aimBtn: 'Largar com um clique', aimOn: 'Agora clica no arrangement, na faixa de instrumento e no ponto onde o queres. Esc cancela.', aimNotInst: 'Essa não é uma faixa de instrumento: clica numa.', aimCancel: 'Cancelar', aimOff: 'Cancelado', dragHint: 'Arrasta-o para fora desta janela e clica onde o queres no arrangement', g3x: ' Ou arrasta-o para fora desta janela e clica onde o queres no arrangement.', g5t: 'Sempre à mão', g5: 'Volta a este guia quando precisares com o botão Guia.' },
  };
  for (const [c, v] of Object.entries(AIM)) Object.assign(I18N[c], v, { g3: I18N[c].g3 + v.g3x });

  // The guide opens with a language choice.
  const LANGQ = {
    en: ['Choose your language', 'The guide and the whole window will use it. You can change it later here, at the top right.'],
    es: ['Elige tu idioma', 'La guía y toda la ventana lo usarán. Puedes cambiarlo luego aquí, arriba a la derecha.'],
    ca: ['Tria el teu idioma', 'La guia i tota la finestra el faran servir. El pots canviar després aquí, a dalt a la dreta.'],
    fr: ['Choisissez votre langue', 'Le guide et toute la fenêtre l’utiliseront. Vous pourrez la changer ici, en haut à droite.'],
    de: ['Wähle deine Sprache', 'Die Anleitung und das ganze Fenster verwenden sie. Du kannst sie später hier oben rechts ändern.'],
    it: ['Scegli la tua lingua', 'La guida e tutta la finestra la useranno. Puoi cambiarla poi qui, in alto a destra.'],
    pt: ['Escolhe o teu idioma', 'O guia e toda a janela vão usá-lo. Podes mudá-lo depois aqui, em cima à direita.'],
  };
  for (const [c, [a, b]] of Object.entries(LANGQ)) Object.assign(I18N[c], { langT: a, langX: b });
  let theme = store.get('theme') === 'grey' ? 'grey' : 'dark';
  let color = COLORS.includes(store.get('color')) ? store.get('color') : 'purple';
  let statusTimer;
  const say = (key, vars = {}, kind = '', ms = 0) => { clearTimeout(statusTimer); $('status').textContent = key ? t(key, vars) : t('foot', { m: KEEP_MIN }); $('status').className = `status ${key ? kind : ''}`; if (ms) statusTimer = setTimeout(() => say(null), ms); };
  const log = [];
  const note = (what, extra = {}) => { log.push({ t: new Date().toISOString().slice(11, 23), what, ...extra }); if (log.length > 200) log.shift(); };
  const errText = (e) => String(e?.message || e);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const KEEP_MIN = 15;
  const opts = { input: 'all', chan: -1, gap: 10, place: 'played', dest: 'auto', pedal: true, ...(store.get('opts') ?? {}) };
  const saveOpts = () => store.set('opts', opts);

  let app = null, tour = null;
  const closeColors = () => { $('colorMenu').hidden = true; $('colorBtn').classList.remove('open'); };
  function seg(box, items, cur, onPick, disabled = []) {
    box.replaceChildren(...items.map(([v, label]) => { const b = el('button', v === cur ? 'on' : '', label); b.title = label; b.disabled = disabled.includes(v); b.onclick = () => onPick(v); return b; }));
    return box;
  }
  function paintStatic() {
    document.documentElement.lang = lang;
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.color = color;
    $('ver').textContent = `v${VERSION}`;
    $('lang').replaceChildren(...Object.keys(I18N).map((c) => Object.assign(el('option', '', I18N[c]._name), { value: c })));
    $('lang').value = lang;
    for (const [id, name] of [['tDark', 'dark'], ['tGrey', 'grey']]) { $(id).classList.toggle('on', theme === name); $(id).title = t(name); }
    $('colorBtn').title = t('color');
    $('help').title = t('help'); $('help').replaceChildren(el('b', '', '?'), el('span', '', t('helpBtn')));
    $('colorMenu').replaceChildren(...COLORS.map((c) => {
      const b = el('button', c === color ? 'on' : '');
      b.innerHTML = `<i class="sw" data-color="${c}" data-theme="${theme}"></i><span></span><svg viewBox="0 0 12 12"><path d="M2.5 6.5L5 9L9.5 3.5"/></svg>`;
      b.querySelector('span').textContent = t(`c${c[0].toUpperCase()}${c.slice(1)}`);
      b.onclick = () => { color = c; store.set('color', c); closeColors(); paintStatic(); };
      return b;
    }));
    $('inLbl').textContent = t('input'); $('chLbl').textContent = t('chan'); $('gapLbl').textContent = t('cut');
    $('chan').replaceChildren(Object.assign(el('option', '', t('allChans')), { value: '-1' }), ...Array.from({ length: 16 }, (_, i) => Object.assign(el('option', '', String(i + 1)), { value: String(i) })));
    $('chan').value = String(opts.chan);
    $('gap').replaceChildren(...[5, 10, 20, 30].map((s) => Object.assign(el('option', '', `${s} s`), { value: String(s) })));
    $('gap').value = String(opts.gap);
    $('clearAll').textContent = t('clearAll');
    $('last').innerHTML = ''; $('last').append(t('last'), Object.assign(el('kbd', '', 'C')));
    say(null);
    app?.paint();
  }
  $('lang').onchange = () => { lang = $('lang').value; store.set('lang', lang); paintStatic(); };
  for (const b of [$('tDark'), $('tGrey')]) b.onclick = () => { theme = b.dataset.t; store.set('theme', theme); paintStatic(); };
  $('colorBtn').onclick = (ev) => { ev.stopPropagation(); const open = $('colorMenu').hidden; $('colorMenu').hidden = !open; $('colorBtn').classList.toggle('open', open); };
  document.addEventListener('mousedown', (ev) => { if (!ev.target.closest?.('.colors')) closeColors(); });
  $('chan').onchange = () => { opts.chan = Number($('chan').value); saveOpts(); };
  $('gap').onchange = () => { opts.gap = Number($('gap').value); saveOpts(); taker.gap = opts.gap * 1000; };

  // ---- Listening ---------------------------------------------------------------------------------
  const taker = L.makeTaker({ gapMs: opts.gap * 1000, keepMs: KEEP_MIN * 60 * 1000 });
  // LUNA stamps each message on its own MIDI clock; `offset` turns that into performance.now().
  // The smallest gap seen between arrival and stamp is the best estimate of the clock offset.
  let offset = null;
  const clockNow = () => performance.now() - (offset ?? 0);
  const ACT = 40;
  const act = new Array(ACT).fill(0);

  let luna, built, stopListen = null;
  const input = { listen: null };
  // Every device is watched on its own, so the picker can light up whichever one is sending,
  // even when only one of them is being captured. `heard` keeps each device's last message.
  let devs = [], devStops = [], capture = null;
  const heard = new Map();          // name -> { at, label }
  const ALL = 'all';
  const devName = (d) => d.name.value ?? '?';
  const msgLabel = (m) => {
    const ch = ` · ch ${m.channel + 1}`;
    switch (m.type) {
      case 'noteOn': case 'noteOff': return t('mNotes') + ch;
      case 'controlChange': return `CC ${m.data1}${ch}`;
      case 'pitchBend': return `Pitch bend${ch}`;
      case 'programChange': return `PC ${m.data1 + 1}${ch}`;
      case 'channelPressure': case 'polyPressure': return `Aftertouch${ch}`;
      default: return m.type + ch;
    }
  };
  function hit(name, m) {
    const h = { at: performance.now(), label: msgLabel(m) };
    heard.set(name, h); heard.set(ALL, h);
    for (const d of document.querySelectorAll(`.pd[data-dev="${CSS.escape(name)}"], .pd[data-dev="${ALL}"]${opts.input === name || opts.input === ALL ? ', #pickBtn .pd' : ''}`)) {
      d.classList.add('hit', 'warm'); clearTimeout(d._h); d._h = setTimeout(() => d.classList.remove('hit'), 110);
    }
    if (!$('pickMenu').hidden) paintPickRow(name);
  }
  // A device that has gone quiet for a while loses its glow.
  setInterval(() => {
    const now = performance.now();
    for (const d of document.querySelectorAll('.pd.warm')) {
      const key = d.closest('#pickBtn') ? opts.input : d.dataset.dev;
      if (now - (heard.get(key)?.at ?? 0) > 2000) d.classList.remove('warm');
    }
    if (!$('pickMenu').hidden) for (const d of [ALL, ...devs.map(devName)]) paintPickRow(d);
  }, 500);

  function paintPick() {
    const cur = opts.input === ALL ? t('allInputs') : opts.input;
    $('pickName').textContent = cur; $('pickBtn').title = cur;
    const rows = [[ALL, t('allInputs')], ...devs.map((d) => [devName(d), devName(d)])];
    $('pickMenu').replaceChildren(el('p', 'phint', t('pickHint')), ...rows.map(([v, label]) => {
      const b = el('button', `prow${v === opts.input ? ' on' : ''}`);
      b.dataset.v = v;
      b.innerHTML = `<span class="pd" data-dev=""></span><span class="pn"></span><span class="pk"></span><svg viewBox="0 0 12 12"><path d="M2.5 6.5L5 9L9.5 3.5"/></svg>`;
      b.querySelector('.pd').dataset.dev = v; b.querySelector('.pn').textContent = label; b.title = label;
      b.onclick = () => { opts.input = v; saveOpts(); closePick(); paintPick(); app?.relisten(); };
      return b;
    }));
    for (const v of rows.map((r) => r[0])) paintPickRow(v);
  }
  function paintPickRow(v) {
    const row = $('pickMenu').querySelector(`.prow[data-v="${CSS.escape(v)}"]`);
    if (!row) return;
    const h = heard.get(v), live = h && performance.now() - h.at < 2000;
    row.querySelector('.pk').textContent = live ? h.label : t('mQuiet');
    row.classList.toggle('busy', !!live);
  }
  const closePick = () => { $('pickMenu').hidden = true; $('pickBtn').classList.remove('open'); };
  $('pickBtn').onclick = (ev) => { ev.stopPropagation(); const open = $('pickMenu').hidden; if (open) paintPick(); $('pickMenu').hidden = !open; $('pickBtn').classList.toggle('open', open); };
  document.addEventListener('mousedown', (ev) => { if (!ev.target.closest?.('.pick')) closePick(); });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') closePick(); });

  // One listener per device, for the lights; the chosen device (or every device) is captured.
  function watchDevices() {
    for (const off of devStops) off();
    devStops = [];
    for (const d of devs) {
      const name = devName(d);
      try {
        devStops.push(input.listen.listen(d, (m) => {
          hit(name, m);
          if (opts.input === name) capture?.(m);
        }));
      } catch (e) { note('watch failed', { name, e: errText(e) }); }
    }
  }
  async function startListening(onEvent) {
    stopListen?.(); stopListen = null;
    $('live').classList.remove('on'); $('liveTxt').textContent = t('notListening');
    try {
      await luna.midiDevices.load();
      devs = luna.midiDevices.items.filter((d) => d.isPhysical && d.inputPort);
      // A device that is not plugged in today falls back to every device, without forgetting it.
      const chosen = opts.input === ALL ? ALL : (devs.find((d) => devName(d) === opts.input) ? opts.input : ALL);
      if (!devs.length) say('sNoDevices', {}, 'bad', 6000);
      input.listen ??= new Luna.MidiInput(luna);
      capture = (m) => {
        const now = performance.now();
        const o = now - m.time;
        offset = offset === null ? o : Math.min(offset + 0.02, o);   // follows a drifting clock slowly
        if (opts.chan >= 0 && m.channel !== opts.chan) return;
        onEvent(m);
      };
      watchDevices();
      // "All devices" goes through LUNA's own All port, so nothing it hears is missed.
      if (chosen === ALL) stopListen = input.listen.listen(ALL, (m) => capture(m), { onGap: (g) => note('gap', g) });
      else stopListen = () => undefined;
      if (chosen !== opts.input) { $('pickName').textContent = t('allInputs'); }
      else paintPick();
      $('live').classList.add('on'); $('liveTxt').textContent = t('listening');
      note('listen', { target: chosen, devices: devs.map(devName) });
    } catch (e) { note('listen failed', { e: errText(e) }); say('error', { e: errText(e) }, 'bad', 8000); }
  }

  async function build() {
    const s = luna.sessions.current();
    if (s === built) return;
    built = s;
    app = null;
    if (!s) { say('noSession'); return; }
    await s.ready();
    if (s !== built) return;
    await s.musical.ready().catch(() => undefined);
    const tl = s.musical.timeline, tr = s.transport, ctx = s.context, TPB = Luna.TICKS_PER_BEAT;
    say(null);

    // The playhead, with when we saw it, to place what is played while LUNA rolls.
    let loc = null;
    tr.location.onChange(() => { const v = tr.location.value; if (v && typeof v.tick === 'number') loc = { perf: performance.now(), tick: v.tick }; });
    // When the transport starts, the playhead starts from where it rests.
    tr.playing.onChange(() => { if (tr.playing.value) loc = { perf: performance.now(), tick: Number(tr.location.value?.tick ?? tr.playStart.value ?? 0) }; });
    const tickAt = (perf) => {
      if (!loc) loc = { perf: performance.now(), tick: Number(tr.location.value?.tick ?? tr.playStart.value ?? 0) };
      try { return tl.tickAtSeconds(tl.seconds(loc.tick) + (perf - loc.perf) / 1000); } catch { return loc.tick; }
    };

    let selId = null, auditioning = null;
    const captured = new Set();
    const onEvent = (m) => {
      const play = !!tr.playing.value;
      const perf = m.time + (offset ?? 0);
      const ev = { t: m.time, st: m.status, d1: m.data1, d2: m.data2, play, tick: play ? tickAt(perf) : null };
      const before = taker.takes.length;
      taker.push(ev);
      if ((m.status & 0xf0) === 0x90 && m.data2 > 0) {
        act.shift(); act.push(m.data2 / 127);
        $('live').classList.add('hit'); clearTimeout(onEvent.h); onEvent.h = setTimeout(() => $('live').classList.remove('hit'), 90);
      }
      if (taker.takes.length !== before) paintList();
      schedulePaint();
    };
    let pt = 0;
    const schedulePaint = () => { if (!pt) pt = requestAnimationFrame(() => { pt = 0; paintAct(); paintList(); if (!selId || selId === taker.current?.id) paintView(); }); };
    setInterval(() => {
      const n = taker.takes.length, cur = taker.current;
      taker.tick(clockNow());
      if (cur && !taker.current) { if (selId === cur.id || !selId) selId = cur.id; paintList(); paintView(); }
      if (taker.takes.length !== n) paintList();
      act.shift(); act.push(0); paintAct();
      paintTimes();
    }, 500);

    // ---- Where it goes ------------------------------------------------------------------------
    const isInst = (tk) => tk && ['instrument', 'midi_matrix'].includes(tk.trackType?.value);
    function destTrack() {
      const armed = s.tracks.items.filter((tk) => isInst(tk) && tk.recordEnabled?.value);
      if (armed.length) return armed[0];
      const ids = [ctx.lastSelectedTrack?.value, ...(ctx.selectionTracks?.value ?? [])].filter(Boolean);
      for (const id of ids) { const tk = s.tracks.byId(id); if (isInst(tk)) return tk; }
      return null;
    }
    for (const p of [ctx.selectionTracks, ctx.lastSelectedTrack]) p?.onChange?.(() => paintView());

    // ---- Painting ------------------------------------------------------------------------------
    function paintAct() {
      const box = $('act');
      if (box.children.length !== ACT) box.replaceChildren(...act.map(() => { const i = el('i'); i.append(el('b')); return i; }));
      [...box.children].forEach((i, k) => { i.firstChild.style.height = `${Math.round(act[k] * 100)}%`; });
    }
    const all = () => [...(taker.current ? [taker.current] : []), ...taker.takes];
    const numberOf = (take) => { const list = [...taker.takes].reverse(); const i = list.indexOf(take); return i >= 0 ? i + 1 : list.length + 1; };
    const ago = (take) => {
      if (take === taker.current) return t('now');
      const s2 = Math.max(0, Math.round((clockNow() - take.endT) / 1000));
      return t('ago', { t: s2 < 60 ? `${s2} s` : `${Math.floor(s2 / 60)} min` });
    };
    const fmtDur = (ms) => { const s2 = Math.round(ms / 1000); return `${Math.floor(s2 / 60)}:${String(s2 % 60).padStart(2, '0')}`; };
    const barOf = (tick) => { try { return tl.barBeat(tick).bar; } catch { return 1; } };
    function info(take) {
      const parts = [];
      if (take.play && take.notes[0]?.tick0 !== null) {
        const a = Math.min(...take.notes.map((n) => n.tick0)), b = Math.max(...take.notes.map((n) => n.tick1 ?? n.tick0));
        parts.push(t('bars', { a: barOf(a), b: barOf(b) }));
      } else parts.push(fmtDur(L.durMs(take)));
      parts.push(t('notes', { n: take.notes.length }));
      if (take.pedals.length) parts.push(t('sustain'));
      return parts.join(' · ');
    }
    function rollSvg(take, w, h, withGrid) {
      const notes = opts.pedal ? L.withPedal(take) : take.notes;
      if (!notes.length) return '';
      const [lo0, hi0] = L.range(notes);
      const lo = Math.max(0, lo0 - 2), hi = Math.min(127, hi0 + 2), span = Math.max(12, hi - lo);
      const t0 = take.startT, t1 = Math.max(take.endT, ...notes.map((n) => n.t1 ?? take.endT)), dur = Math.max(500, t1 - t0);
      const nh = Math.max(2, Math.min(10, h / span));
      const out = [];
      if (withGrid && take.play && notes[0].tick0 !== null) {
        // Bar lines where the take was played.
        const a = Math.min(...notes.map((n) => n.tick0)), b = Math.max(...notes.map((n) => n.tick1 ?? n.tick0));
        try {
          for (let bar = tl.barBeat(a).bar; bar <= tl.barBeat(b).bar + 1; bar++) {
            const tk = tl.tickAtBar(bar);
            const n0 = notes.find((n) => n.tick0 !== null);
            const sec = tl.seconds(tk) - tl.seconds(n0.tick0);
            const x = ((n0.t0 - t0) / dur + (sec * 1000) / dur) * w;
            if (x >= 0 && x <= w) out.push(`<line x1="${x.toFixed(1)}" y1="0" x2="${x.toFixed(1)}" y2="${h}" class="bl"/><text x="${(x + 3).toFixed(1)}" y="11" class="lbl">${bar}</text>`);
          }
        } catch { /* no grid */ }
      } else if (withGrid) {
        for (let s2 = 0; s2 * 1000 < dur; s2++) { const x = ((s2 * 1000) / dur) * w; out.push(`<line x1="${x.toFixed(1)}" y1="0" x2="${x.toFixed(1)}" y2="${h}" class="gl"/>`); }
      }
      for (const n of notes) {
        const x = ((n.t0 - t0) / dur) * w, x2 = (((n.t1 ?? t1) - t0) / dur) * w;
        const y = h - ((n.pitch - lo + 0.5) / span) * h - nh / 2;
        out.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(2, x2 - x - 1).toFixed(1)}" height="${nh.toFixed(1)}" rx="1.5" class="nt" opacity="${(0.45 + 0.55 * n.vel / 127).toFixed(2)}"/>`);
      }
      return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${out.join('')}</svg>`;
    }
    function badge(take) {
      if (take === taker.current) return el('span', 'badge rec', t('playing'));
      if (captured.has(take.id)) return el('span', 'badge done', t('captured'));
      return take.play ? el('span', 'badge run', t('rolling')) : el('span', 'badge free', t('free'));
    }
    function paintList() {
      const list = all();
      $('tkTitle').textContent = t('memory', { n: taker.takes.length, m: KEEP_MIN });
      $('last').disabled = !list.length;
      if (!list.length) { $('takes').replaceChildren(el('div', 'empty', t('emptyList'))); return; }
      $('takes').replaceChildren(...list.map((take) => {
        const b = el('button', `tk${take.id === selId ? ' sel' : ''}${take === taker.current ? ' live' : ''}`);
        const th = el('div', 'th'); const wh = el('span', 'when', ago(take)); wh.dataset.id = take.id; th.append(el('b', '', t('take', { n: numberOf(take) })), wh);
        const mini = el('div', 'mini'); mini.innerHTML = rollSvg(take, 220, 34, false);
        const tf = el('div', 'tf'); tf.append(badge(take), el('span', 'inf', info(take)));
        b.append(th, mini, tf);
        b.onclick = () => { if (b.dataset.noclick) { delete b.dataset.noclick; return; } selId = take.id; paintList(); paintView(); };
        if (take !== taker.current) { b.title = t('dragHint'); b.onpointerdown = (ev) => dragTake(b, take, ev); }
        if (aiming?.take === take) b.classList.add('aim');
        return b;
      }));
    }
    function paintTimes() { for (const w of document.querySelectorAll('.when')) { const take = all().find((k) => k.id === w.dataset.id); if (take) w.textContent = ago(take); } }
    const selected = () => all().find((k) => k.id === selId) ?? null;
    function paintView() {
      const v = $('view');
      const take = selected();
      if (!take) { v.replaceChildren(el('div', 'empty', t('emptyView'))); return; }
      const vh = el('div', 'vh'); vh.append(el('b', '', t('take', { n: numberOf(take) })), badge(take), el('span', 'inf', `${info(take)} · ${ago(take)}`));
      const roll = el('div', 'roll'); roll.innerHTML = rollSvg(take, 600, 230, true);
      const opt = el('div', 'opts');
      const f1 = el('div', 'f'); f1.append(el('label', '', t('place')));
      const canPlayed = take.play && take.notes[0]?.tick0 !== null;
      const place = canPlayed ? opts.place : 'cursor';
      f1.append(seg(el('div', 'seg'), [['played', t('placePlayed')], ['cursor', t('placeCursor')]], place, (x) => { opts.place = x; saveOpts(); paintView(); }, canPlayed ? [] : ['played']));
      const dt = destTrack();
      const f2 = el('div', 'f'); f2.append(el('label', '', t('dest')));
      f2.append(seg(el('div', 'seg'), [['auto', dt ? t('destAuto', { t: dt.name.value }) : t('destNone')], ['new', t('destNew')]], opts.dest, (x) => { opts.dest = x; saveOpts(); paintView(); }));
      const ck = el('label', 'chk'); const cb = el('input'); cb.type = 'checkbox'; cb.checked = opts.pedal; cb.onchange = () => { opts.pedal = cb.checked; saveOpts(); paintList(); paintView(); };
      ck.append(cb, el('span', '', t('pedal')));
      opt.append(f1, f2);
      const btns = el('div', 'btns');
      const ls = el('button', 'btn', auditioning ? t('stopListen') : t('listen'));
      ls.disabled = take === taker.current || !(dt || auditioning);
      ls.onclick = () => (auditioning ? stopAudition() : audition(take));
      const ds = el('button', 'btn', t('discard')); ds.disabled = take === taker.current;
      ds.onclick = () => { const i = taker.takes.indexOf(take); if (i >= 0) taker.takes.splice(i, 1); selId = taker.takes[0]?.id ?? null; paintList(); paintView(); say('sDiscarded', {}, 'ok', 3000); };
      const go = el('button', 'go', opts.dest === 'new' ? t('captureNew') : dt ? t('capture', { t: dt.name.value }) : t('destNone'));
      go.disabled = take === taker.current || (opts.dest !== 'new' && !dt);
      go.onclick = () => capture(take);
      const am = el('button', 'btn', t('aimBtn')); am.disabled = take === taker.current;
      am.onclick = () => startAim(take);
      btns.append(ls, ds, am, go);
      if (aiming?.take === take) {
        const bar = el('div', 'aimbar'); const x = el('button', 'btn', t('aimCancel')); x.onclick = () => stopAim(true);
        bar.append(el('span', '', t('aimOn')), x);
        v.replaceChildren(vh, roll, opt, ck, bar);
      } else v.replaceChildren(vh, roll, opt, ck, btns);
    }

    // ---- Listening back: the take played on the destination track's instrument ----------------
    const sender = new Luna.SendMidi(luna);
    function stopAudition() {
      if (!auditioning) return;
      auditioning.timers.forEach(clearTimeout);
      for (const k of auditioning.on) { const [p] = k.split(':').map(Number); sender.sendMidiNote(s.uid ?? s.id, auditioning.track.id, p, 0, false).catch(() => undefined); }
      auditioning = null; paintView();
    }
    function audition(take) {
      const track = destTrack();
      if (!track) { say('sNoTrack', {}, 'bad', 5000); return; }
      stopAudition();
      const notes = opts.pedal ? L.withPedal(take) : take.notes;
      const a = { timers: [], on: new Set(), track };
      const sid = s.uid ?? s.id;
      for (const n of notes) {
        a.timers.push(setTimeout(() => { a.on.add(`${n.pitch}:`); sender.sendMidiNote(sid, track.id, n.pitch, n.vel, true).catch(() => undefined); }, n.t0 - take.startT));
        a.timers.push(setTimeout(() => { a.on.delete(`${n.pitch}:`); sender.sendMidiNote(sid, track.id, n.pitch, 0, false).catch(() => undefined); }, (n.t1 ?? take.endT) - take.startT));
      }
      a.timers.push(setTimeout(() => { auditioning = null; paintView(); }, Math.max(...notes.map((n) => (n.t1 ?? take.endT) - take.startT)) + 200));
      auditioning = a; paintView();
    }

    // ---- Capture ---------------------------------------------------------------------------------
    async function capture(take, at = null) {
      if (!take || take === taker.current) { say('sNothing', {}, 'bad', 3000); return; }
      stopAudition();
      try {
        let track = at ? at.track : opts.dest === 'new' ? null : destTrack();
        if (!track && !at && opts.dest !== 'new') { say('sNoTrack', {}, 'bad', 5000); return; }
        if (!track) {
          await s.newTrack({ name: t('newTrackName'), trackType: 'instrument', stemFormat: 'stereo', makeNameUnique: true });
          await sleep(300);
          track = [...s.tracks.items].reverse().find(isInst);
        }
        const lane = s.playlistFor(track);
        await lane.clips.load();
        const canPlayed = take.play && take.notes[0]?.tick0 !== null;
        const place = at ? 'cursor' : canPlayed ? opts.place : 'cursor';
        const cursor = at ? at.tick : Number(tr.location.value?.tick ?? tr.playStart.value ?? 0);
        const base = tl.seconds(cursor);
        const notes = L.layout(take, { place, cursorTick: cursor, pedal: opts.pedal, minTicks: Math.round(TPB / 64), toTick: (sec) => tl.tickAtSeconds(base + sec) });
        await s.transaction(`MIDI Capture: ${t('take', { n: numberOf(take) })}`, async () => { await lane.createNotes(notes); }, { continuous: true });
        captured.add(take.id);
        note('captured', { notes: notes.length, place, track: track.name.value, first: notes[0]?.startTick });
        say('sCaptured', { n: notes.length, t: track.name.value }, 'ok', 5000);
        paintList(); paintView();
      } catch (e) { note('capture failed', { e: errText(e) }); say('error', { e: errText(e) }, 'bad', 8000); }
    }

    // ---- Drop with a click: a take dragged out of the window (or its button) waits for a click
    // in LUNA's arrangement, and lands on the instrument track and at the spot that click picks.
    // An Add On window cannot be a drag source for LUNA's timeline, so the click finishes the drop.
    let aiming = null;
    const selSnap = () => JSON.stringify([ctx.selectionStart?.value ?? null, ctx.selectionTracks?.value ?? null, ctx.lastSelectedTrack?.value ?? null, tr.playStart?.value ?? null]);
    function startAim(take) {
      if (!take || take === taker.current) { say('sNothing', {}, 'bad', 3000); return; }
      stopAim(false);
      stopAudition();
      selId = take.id;
      aiming = { take, snap: selSnap(), start: ctx.selectionStart?.value ?? null, timer: setTimeout(() => stopAim(true), 45000), wait: 0 };
      note('aim', { take: take.id });
      say('aimOn', {}, '', 45000);
      paintList(); paintView();
    }
    function stopAim(told) {
      if (!aiming) return;
      clearTimeout(aiming.timer); clearTimeout(aiming.wait);
      aiming = null;
      if (told) say('aimOff', {}, '', 2500);
      paintList(); paintView();
    }
    function aimHeard() {
      if (!aiming) return;
      clearTimeout(aiming.wait);
      // The click changes several properties one after another; read them once they settle.
      aiming.wait = setTimeout(() => {
        if (!aiming || selSnap() === aiming.snap) return;
        aiming.snap = selSnap();
        const ids = [...(ctx.selectionTracks?.value ?? []), ctx.lastSelectedTrack?.value].filter(Boolean);
        const track = ids.map((id) => s.tracks.byId(id)).find(isInst);
        if (!track) { say('aimNotInst', {}, 'bad', 45000); return; }
        const st = ctx.selectionStart?.value;
        const tick = Number(st !== null && st !== undefined && st !== aiming.start ? st : (tr.playStart?.value ?? tr.location.value?.tick ?? st ?? 0));
        const take = aiming.take;
        note('aim drop', { track: track.name.value, tick });
        stopAim(false);
        capture(take, { track, tick });
      }, 160);
    }
    for (const p of [ctx.selectionStart, ctx.selectionTracks, ctx.lastSelectedTrack, tr.playStart]) p?.onChange?.(aimHeard);

    // Dragging a take card: once the pointer leaves the window, the drop waits for the click.
    function dragTake(card, take, ev) {
      if (ev.button !== 0 || take === taker.current) return;
      const x0 = ev.clientX, y0 = ev.clientY;
      let ghost = null, out = false;
      const outside = (e) => e.clientX <= 1 || e.clientY <= 1 || e.clientX >= innerWidth - 2 || e.clientY >= innerHeight - 2;
      const move = (e) => {
        if (!ghost && Math.hypot(e.clientX - x0, e.clientY - y0) < 8) return;
        if (!ghost) { ghost = el('div', 'ghost', t('take', { n: numberOf(take) })); document.body.append(ghost); document.body.classList.add('dragging'); }
        ghost.style.left = `${e.clientX}px`; ghost.style.top = `${e.clientY}px`;
        if (!out && outside(e)) { out = true; end(); startAim(take); }
      };
      const end = () => {
        card.removeEventListener('pointermove', move); card.removeEventListener('pointerup', up); card.removeEventListener('pointercancel', up);
        document.removeEventListener('mouseleave', leave);
        ghost?.remove(); document.body.classList.remove('dragging');
        try { card.releasePointerCapture(ev.pointerId); } catch {}
      };
      const up = () => { const dragged = !!ghost; end(); if (dragged) card.dataset.noclick = '1'; };
      const leave = () => { if (ghost && !out) { out = true; end(); startAim(take); } };
      try { card.setPointerCapture(ev.pointerId); } catch {}
      card.addEventListener('pointermove', move); card.addEventListener('pointerup', up); card.addEventListener('pointercancel', up);
      document.addEventListener('mouseleave', leave);
    }
    $('last').onclick = () => { const take = taker.takes[0]; if (!take) { say('sNothing', {}, 'bad', 3000); return; } selId = take.id; paintList(); paintView(); capture(take); };
    document.onkeydown = (e) => {
      if (tour?.active || e.target.closest?.('input, select, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Escape' && aiming) { stopAim(true); return; }
      if (e.key === 'c' || e.key === 'C') { e.preventDefault(); $('last').click(); }
    };
    $('clearAll').onclick = () => { stopAudition(); taker.clear(); selId = null; paintList(); paintView(); say('sCleared', {}, 'ok', 3000); };

    // Alt-click the version: a short report for support.
    $('ver').onclick = async (ev) => {
      if (!ev.altKey) return;
      const text = JSON.stringify({ version: VERSION, session: s.name?.value, opts, offset, loc, playing: tr.playing.value,
        devices: luna.midiDevices.items.map((d) => ({ name: d.name.value, physical: d.isPhysical, input: !!d.inputPort })),
        dest: destTrack()?.name.value ?? null,
        takes: taker.takes.slice(0, 10).map((k) => ({ play: k.play, notes: k.notes.length, pedals: k.pedals.length, ms: L.durMs(k), firstTick: k.notes[0]?.tick0 ?? null })),
        log: log.slice(-40) }, null, 2);
      try { if (await AddOnCopy(text)) say('report', {}, 'ok', 5000); } catch { console.log(text); }
    };

    app = { paint: () => { $('liveTxt').textContent = t(stopListen ? 'listening' : 'notListening'); paintPick(); paintAct(); paintList(); paintView(); }, relisten: () => startListening(onEvent) };
    app.paint();
    await startListening(onEvent);
    // Plugging a device in or out while the window is open updates the list.
    let devT = 0, devKey = devs.map(devName).join('|');
    luna.midiDevices.onChange?.(() => { clearTimeout(devT); devT = setTimeout(() => {
      const k = luna.midiDevices.items.filter((d) => d.isPhysical && d.inputPort).map(devName).join('|');
      if (k !== devKey) { devKey = k; note('devices changed', { k }); app?.relisten(); }
    }, 400); });
    tour ??= window.AddOnTour?.attach({
      button: $('help'), key: `${KEY}tourSeen`,
      labels: () => ({ next: t('tNext'), back: t('tBack'), skip: t('tSkip'), done: t('tDone') }),
      language: {
        sel: '#lang',
        list: () => Object.keys(I18N).map((c) => [c, I18N[c]._name]),
        current: () => lang,
        set: (c) => { lang = c; store.set('lang', c); paintStatic(); },
        title: () => t('langT'), text: () => t('langX'),
      },
      steps: () => [
        { sel: '.bar', title: () => t('g1t'), text: () => t('g1') },
        { sel: '.list', title: () => t('g2t'), text: () => t('g2') },
        { sel: '#view', title: () => t('g3t'), text: () => t('g3') },
        { sel: '#last', title: () => t('g4t'), text: () => t('g4') },
        { sel: '#help', title: () => t('g5t'), text: () => t('g5') },
      ],
    });
  }

  paintStatic();
  (async () => {
    for (;;) {
      try { luna = await Luna.connect(); break; }
      catch { say('waiting'); await sleep(1500); }
    }
    Luna.bindShortcuts(luna, { onError: () => undefined });
    await luna.sessions.ready();
    luna.sessions.focused.onChange(() => void build());
    await build();
  })();
})();
