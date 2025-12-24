# Quiz Frontend (Angular + WebSocket)

## Architettura

### Stack Tecnologico
- **Angular 17**: Framework frontend standalone components
- **Socket.IO Client**: Comunicazione WebSocket real-time
- **QRCode**: Generazione QR code per accesso rapido
- **SCSS**: Styling avanzato
- **TypeScript**: Type safety e moderne features

### Componenti Principali

#### 1. Home Component
Pagina iniziale con due opzioni:
- Crea Sessione (Host)
- Unisciti al Gioco (Player)

#### 2. Host Component
**Funzionalità**:
- Crea sessione con codice univoco
- Genera QR code per accesso rapido
- Visualizza giocatori connessi in tempo reale
- Controlla l'avvio del quiz
- Mostra domande e timer
- Visualizza classifica live
- Mostra risultati finali

**Stati**:
- `waiting`: Attesa giocatori
- `playing`: Quiz in corso
- `finished`: Quiz terminato

#### 3. Player Component
**Funzionalità**:
- Join tramite codice sessione
- Inserimento nome giocatore
- Visualizzazione domande
- Selezione e invio risposte
- Feedback immediato (punti guadagnati)
- Visualizzazione classifica finale

**Interazione**:
- Timer sincronizzato
- Blocco dopo risposta inviata
- Evidenziazione risposta selezionata
- Feedback visivo su correttezza

#### 4. Socket Service
Gestisce tutte le comunicazioni WebSocket:
- Connessione al server
- Invio eventi (emit)
- Ricezione eventi (on)
- Observable-based per integrazione Angular

### Flusso Utente

#### Host:
1. Clicca "Crea Sessione"
2. Condivide QR code o codice sessione
3. Attende giocatori
4. Avvia il quiz
5. Osserva progressione e classifica

#### Player:
1. Scansiona QR code o inserisce codice
2. Inserisce nome
3. Attende inizio quiz
4. Risponde alle domande
5. Visualizza punteggio e classifica

## Installazione e Avvio

### Prerequisiti
- Node.js 18+ (raccomandato LTS)
- npm o yarn

### Setup

```bash
# Clona il repository
git clone https://github.com/lorenzomariabruni/quizFE.git
cd quizFE

# Installa dipendenze
npm install
```

### Configurazione

Modifica l'URL del server in `src/app/services/socket.service.ts`:

```typescript
private readonly serverUrl = 'http://localhost:8000'; // Cambia se necessario
```

### Avvio Applicazione

```bash
# Development mode con live reload
npm start

# Oppure
ng serve
```

L'applicazione sarà disponibile su: http://localhost:4200

### Build per Produzione

```bash
# Build ottimizzato
npm run build

# Output in dist/quiz-fe/
```

## Struttura Progetto

```
src/
├── app/
│   ├── components/
│   │   ├── home/          # Homepage
│   │   ├── host/          # Interfaccia host
│   │   └── player/        # Interfaccia giocatore
│   ├── services/
│   │   └── socket.service.ts  # WebSocket manager
│   ├── app.component.ts
│   └── app.routes.ts      # Routing
├── styles.scss            # Stili globali
└── index.html
```

## Routing

- `/` - Homepage
- `/host` - Interfaccia host
- `/play/:sessionId` - Interfaccia giocatore

## Features UI

### Design
- Gradient background moderno
- Card-based layout
- Responsive design
- Animazioni smooth
- Feedback visivi immediati

### Timer
- Visualizzazione in tempo reale
- Warning state (ultimi 3 secondi)
- Animazione pulse
- Sincronizzato tra tutti i client

### Risposte
- Hover effect
- Selezione visuale
- Colori per correttezza (verde/rosso)
- Disabilitazione post-invio

### Classifica
- Medaglie per top 3
- Evidenziazione giocatore corrente
- Punteggio in tempo reale
- Conteggio risposte corrette

## WebSocket Events

### Emessi dal Client
- `create_session` (host)
- `join_session` (player)
- `start_game` (host)
- `submit_answer` (player)

### Ricevuti dal Server
- `session_created`
- `joined_session`
- `player_joined`
- `game_started`
- `new_question`
- `timer_update`
- `answer_submitted`
- `question_results`
- `game_over`

## Customizzazione

### Colori
Modifica `src/styles.scss`:

```scss
$primary-color: #667eea;
$success-color: #48bb78;
$danger-color: #f56565;
```

### Timer
Modifica durata in `host.component.ts` e `player.component.ts`

### QR Code
Personalizza dimensione e stile in `host.component.ts`:

```typescript
await QRCode.toDataURL(joinUrl, { 
  width: 300,
  margin: 2,
  color: {
    dark: '#667eea',
    light: '#ffffff'
  }
});
```

## Estensioni Future

- Avatar giocatori personalizzati
- Modalità team
- Chat in-game
- Power-ups
- Temi personalizzabili
- Salvataggio partite
- Statistiche giocatore
- Modalità practice

## Troubleshooting

### WebSocket non si connette
1. Verifica che il backend sia avviato
2. Controlla URL in `socket.service.ts`
3. Verifica CORS nel backend
4. Ispeziona console browser per errori

### QR Code non appare
- Verifica installazione libreria `qrcode`
- Controlla console per errori
- Verifica che il componente sia inizializzato

### Styling non applicato
- Verifica `styles.scss` sia incluso in `angular.json`
- Esegui `ng serve` dopo modifiche
- Pulisci cache browser

## Performance

### Ottimizzazioni
- Standalone components (tree-shaking)
- OnPush change detection (dove possibile)
- Lazy loading routes
- Produzione build optimization

## Licenza
MIT