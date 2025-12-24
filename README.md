# 🎮 Quiz Frontend (Angular + WebSocket)

> Interfaccia web real-time per quiz multiplayer con supporto mobile, QR code e riconnessione automatica

## 📋 Indice

- [Caratteristiche](#-caratteristiche)
- [Stack Tecnologico](#-stack-tecnologico)
- [Architettura](#-architettura)
- [Installazione](#-installazione)
- [Avvio Completo](#-avvio-completo)
- [Accesso Multi-Dispositivo](#-accesso-multi-dispositivo)
- [Componenti](#-componenti)
- [Troubleshooting](#-troubleshooting)

## ✨ Caratteristiche

- 📱 **QR Code dinamico** con rilevamento IP automatico
- 🔄 **Riconnessione automatica** per dispositivi mobile
- ⚡ **Real-time sync** con Socket.IO
- 🏆 **Classifica live** durante il quiz
- 🎮 **Interfaccia responsive** per desktop e mobile
- 📊 **Feedback immediato** su risposte
- ⏱️ **Timer sincronizzato** tra tutti i dispositivi
- 🔒 **Prevenzione risposte duplicate** dopo riconnessione
- 🎨 **UI moderna** con animazioni fluide

## 🛠 Stack Tecnologico

- **Angular 17** - Framework frontend con standalone components
- **Socket.IO Client** - Comunicazione WebSocket real-time
- **QRCode.js** - Generazione QR code
- **TypeScript** - Type safety
- **SCSS** - Styling avanzato
- **RxJS** - Reactive programming

## 🏗 Architettura

### Componenti Principali

#### 1. Home Component
Pagina iniziale con scelta:
- 🎯 **Crea Sessione** (Host)
- 📱 **Unisciti al Gioco** (Player)

#### 2. Host Component
**Funzionalità**:
- Crea sessione con codice univoco
- Genera QR code con IP rilevato automaticamente (WebRTC)
- Visualizza giocatori connessi real-time
- Controlla avvio quiz
- Mostra domande, timer e classifica
- Gestisce risultati finali

**Stati**:
- `waiting` - Attesa giocatori
- `playing` - Quiz in corso
- `finished` - Quiz terminato

#### 3. Player Component
**Funzionalità**:
- Join tramite QR code o codice manuale
- Inserimento nome
- Visualizzazione domande
- Selezione risposte
- Feedback punti guadagnati
- Classifica finale
- **Riconnessione automatica** dopo disconnect

**Caratteristiche riconnessione**:
- Recupero sessione da localStorage
- Auto-rejoin su reconnect
- Sincronizzazione domanda corrente
- Mantiene punteggio accumulato
- Banner stato connessione

#### 4. Socket Service
**Gestione WebSocket**:
- Connessione dinamica (usa hostname corrente, non localhost)
- Riconnessione infinita con backoff
- Auto-rejoin dopo disconnect
- Event emitters & listeners Observable-based
- Logging dettagliato per debug

**Configurazione**:
```typescript
transports: ['polling', 'websocket']  // Polling first (mobile-friendly)
reconnection: true
reconnectionAttempts: Infinity
reconnectionDelay: 1000
reconnectionDelayMax: 5000
```

## 📦 Installazione

### Prerequisiti

- **Node.js 18+** ([Download](https://nodejs.org/))
- **npm** (incluso con Node.js)
- **Backend quizBE** avviato ([Repository](https://github.com/lorenzomariabruni/quizBE))

### Clone Repository

```bash
git clone https://github.com/lorenzomariabruni/quizFE.git
cd quizFE
```

### Installa Dipendenze

```bash
npm install
```

Dipendenze principali installate:
- `@angular/core@17`
- `socket.io-client@4.7`
- `qrcode@1.5`
- `rxjs@7.8`

## 🚀 Avvio Completo

### 1. Avvia Backend

**In un terminale separato:**

```bash
cd quizBE

# Attiva virtual environment
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows

# Avvia server
uvicorn app.main:socket_app --reload --host 0.0.0.0 --port 8000
```

⚠️ **IMPORTANTE**: Usa `--host 0.0.0.0` per accesso da mobile!

### 2. Avvia Frontend

**In un altro terminale:**

```bash
cd quizFE

# Avvia development server
ng serve --host 0.0.0.0
```

⚠️ **IMPORTANTE**: Usa `--host 0.0.0.0` per accesso da rete locale!

### 3. Verifica

- **Frontend**: http://localhost:4200
- **Backend**: http://localhost:8000/health

Dovresti vedere la homepage del quiz! 🎉

## 🌍 Accesso Multi-Dispositivo

### Setup Network

#### Trova il tuo IP locale

**Mac/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```bash
ipconfig
```

Cerca l'IPv4 della tua scheda WiFi/Ethernet (es. `192.168.1.100`)

### Connessione Dispositivi

#### PC Host (dove gira il server)

```
http://localhost:4200
```

#### Dispositivi Mobile (stessa rete WiFi)

**Opzione 1 - QR Code (consigliato)**:
1. Crea sessione da PC
2. Scansiona QR code con smartphone
3. Inserisci nome e gioca! 🚀

**Opzione 2 - URL manuale**:
```
http://192.168.1.100:4200
```

Sostituisci `192.168.1.100` con il TUO IP!

### Come Funziona la Connessione

Il frontend si connette **automaticamente** al backend usando lo stesso hostname:

- Da `http://192.168.1.100:4200` → si connette a `http://192.168.1.100:8000`
- Da `http://localhost:4200` → si connette a `http://localhost:8000`

⚠️ **Tutti i dispositivi devono usare lo stesso IP del PC host!**

## 📐 Componenti

### Struttura Progetto

```
src/
├── app/
│   ├── components/
│   │   ├── home/          # Homepage
│   │   ├── host/          # Interfaccia host
│   │   └── player/        # Interfaccia player
│   ├── services/
│   │   └── socket.service.ts  # WebSocket manager
│   ├── app.component.ts
│   └── app.routes.ts      # Routing
├── styles.scss            # Stili globali
└── index.html
```

### Routing

```typescript
Routes:
/              # Home
/host          # Crea sessione
/play/:id      # Join sessione
```

### Socket Events

**Emessi dal componente**:
- `create_session` - Crea nuova sessione
- `join_session` - Unisciti/Riconnettiti
- `start_game` - Avvia quiz
- `submit_answer` - Invia risposta

**Ricevuti dal server**:
- `session_created` - Sessione creata
- `joined_session` - Join confermato (con `reconnected` flag)
- `player_joined` - Nuovo player unito
- `game_started` - Quiz iniziato
- `new_question` - Nuova domanda (con `already_answered`)
- `timer_update` - Countdown
- `answer_submitted` - Feedback risposta
- `question_results` - Risultati domanda
- `game_over` - Fine quiz

## 🐛 Troubleshooting

### Backend non raggiungibile da mobile

**Problema**: Mobile mostra errore connessione

**Checklist**:
1. ✅ Backend avviato con `--host 0.0.0.0`
2. ✅ Frontend avviato con `--host 0.0.0.0`
3. ✅ Firewall permette porte 4200 e 8000
4. ✅ Dispositivi sulla stessa rete WiFi
5. ✅ IP corretto nel QR code

**Test connessione backend**:
```bash
# Dal browser mobile
http://192.168.1.100:8000/health

# Dovrebbe mostrare JSON
```

**Apri firewall**:

```bash
# Linux
sudo ufw allow 4200/tcp
sudo ufw allow 8000/tcp

# Mac
# System Preferences → Security & Privacy → Firewall Options

# Windows
# Windows Defender Firewall → Advanced Settings → Inbound Rules
# Nuova regola per porte 4200 e 8000
```

### QR Code mostra IP sbagliato

**Problema**: QR code contiene localhost o IP errato

**Soluzioni**:
1. Riavvia con: `ng serve --host 0.0.0.0`
2. Disattiva VPN se attiva
3. Inserisci IP manualmente quando richiesto
4. Ricarica pagina host

### Riconnessione non funziona

**Problema**: Dopo blocco schermo, non si riconnette

**Debug**:
1. Apri console browser (F12)
2. Cerca log tipo:
   ```
   ❌ Disconnected from server
   🔄 Reconnection attempt #1
   ✅ Reconnected after 1 attempts
   🔄 Auto-rejoining session
   ✅ Joined session successfully
   ```

3. Verifica backend logs per eventi `join_session`

**Fix comuni**:
- Backend deve essere raggiungibile (ping timeout 60s)
- localStorage non cancellato (contiene session info)
- Network stabile durante riconnessione

### Errore "Errore di connessione. Riprova"

**Problema**: Join fallisce con timeout

**Cause**:
1. Backend non avviato
2. Backend su porta diversa da 8000
3. CORS bloccato
4. Network firewall

**Verifica**:
```bash
# Backend running?
curl http://localhost:8000/health

# CORS OK?
# Backend deve avere: allow_origins=["*"]
```

### Mobile non riceve eventi

**Problema**: Timer/domande non appaiono su mobile

**Debug console mobile**:

**Android Chrome**:
1. PC: Apri `chrome://inspect`
2. Collega telefono via USB
3. Abilita USB debugging
4. Ispeziona pagina
5. Guarda console

**iOS Safari**:
1. iPhone: Settings → Safari → Advanced → Web Inspector
2. Mac: Safari → Develop → [Your iPhone]
3. Ispeziona pagina

**Cerca log**:
```
📥 Received: new_question {...}
📥 Received: timer_update {remaining: 9}
```

Se non li vedi, problema di connessione WebSocket.

### Build produzione

```bash
# Build ottimizzato
ng build --configuration production

# Output in dist/quiz-fe/
# Deploy su server statico (Netlify, Vercel, etc.)
```

**Configurazione ambiente produzione**:
Modifica `socket.service.ts` per usare URL backend produzione:

```typescript
// Sviluppo
const host = window.location.hostname;
const port = '8000';
this.serverUrl = `http://${host}:${port}`;

// Produzione
this.serverUrl = 'https://api.yourquiz.com';
```

## 📚 Risorse

- [Angular Documentation](https://angular.dev/)
- [Socket.IO Client API](https://socket.io/docs/v4/client-api/)
- [QRCode.js](https://github.com/soldair/node-qrcode)
- [RxJS Guide](https://rxjs.dev/guide/overview)

## 🤝 Contributing

Contributi benvenuti!

1. Fork repository
2. Crea feature branch: `git checkout -b feature/AmazingFeature`
3. Commit: `git commit -m 'Add AmazingFeature'`
4. Push: `git push origin feature/AmazingFeature`
5. Apri Pull Request

## 📄 Licenza

MIT

## 👨‍💻 Autore

**Lorenzo Maria Bruni**
- GitHub: [@lorenzomariabruni](https://github.com/lorenzomariabruni)

---

⭐ **Se questo progetto ti è utile, lascia una stella!** ⭐