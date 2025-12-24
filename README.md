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
- **Rileva automaticamente IP di rete** (usando WebRTC)
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
- **Connessione dinamica al server** (usa hostname corrente, non localhost hardcoded)
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
- Python 3.8+ (per il backend)

### Setup Backend

```bash
# In una finestra terminale
cd quizBE
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Avvia backend
uvicorn app.main:socket_app --reload --host 0.0.0.0 --port 8000
```

### Setup Frontend

```bash
# Clona il repository
git clone https://github.com/lorenzomariabruni/quizFE.git
cd quizFE

# Installa dipendenze
npm install
```

### Avvio Applicazione

**IMPORTANTE**: Per permettere l'accesso da altri dispositivi sulla rete locale:

```bash
# Esponi su tutte le interfacce di rete
ng serve --host 0.0.0.0
```

L'applicazione sarà disponibile su:
- Local: http://localhost:4200
- Network: http://[TUO_IP]:4200 (es. http://192.168.1.100:4200)

**Il QR code verrà generato automaticamente con l'IP di rete rilevato!**

### Trovare il tuo IP locale

**Mac/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```bash
ipconfig
```

Cerca l'indirizzo IPv4 della tua scheda WiFi/Ethernet (es. 192.168.1.100)

## Configurazione Multi-Dispositivo

### Setup Completo:

1. **Avvia Backend** (porta 8000):
   ```bash
   cd quizBE
   uvicorn app.main:socket_app --reload --host 0.0.0.0 --port 8000
   ```

2. **Avvia Frontend** (porta 4200):
   ```bash
   cd quizFE
   ng serve --host 0.0.0.0
   ```

3. **Sul PC Host**: Vai su http://localhost:4200

4. **Sui dispositivi mobili**: 
   - Scansiona il QR code
   - OPPURE vai su http://[IP_DEL_PC]:4200

**Nota importante**: Il frontend si connetterà automaticamente al backend usando lo stesso IP/hostname, quindi:
- Se apri da `http://192.168.1.100:4200` si connetterà a `http://192.168.1.100:8000`
- Se apri da `http://localhost:4200` si connetterà a `http://localhost:8000`

Questo significa che **tutti i dispositivi devono usare lo stesso IP del PC host**!

## Rilevamento IP di Rete

Il componente Host usa **WebRTC** per rilevare automaticamente l'IP locale della macchina sulla rete:

- Rileva IP privato (es. 192.168.x.x, 10.x.x.x)
- Esclude automaticamente localhost (127.0.0.1)
- Timeout di 3 secondi
- Se il rilevamento fallisce, chiede di inserire l'IP manualmente

Questo permette ai dispositivi mobili sulla stessa rete di connettersi facilmente scansionando il QR code!

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

## Troubleshooting

### Backend non raggiungibile da mobile

**Problema**: Il mobile non riesce a connettersi al backend

**Soluzioni**:
1. Verifica che il backend sia avviato con `--host 0.0.0.0`
2. Verifica che il firewall non blocchi la porta 8000:
   ```bash
   # Mac
   sudo lsof -i :8000
   
   # Linux
   sudo ufw allow 8000
   
   # Windows
   # Aggiungi eccezione nel Windows Firewall per porta 8000
   ```
3. Testa la connessione dal mobile: http://[IP_PC]:8000/health

### QR Code mostra IP errato

**Problema**: Il QR code mostra localhost o IP sbagliato

**Soluzioni**:
1. Assicurati di avviare con: `ng serve --host 0.0.0.0`
2. Verifica che non ci siano VPN attive
3. Se richiesto, inserisci manualmente l'IP corretto
4. Ricarica la pagina host

### WebSocket non si connette

**Problema**: Errori di connessione WebSocket

**Soluzioni**:
1. Verifica che backend e frontend usino lo stesso IP
2. Controlla console browser per errori
3. Verifica CORS nel backend (`.env` deve includere l'IP)
4. Controlla che entrambi i servizi siano in esecuzione

### Device sulla stessa rete ma non si connette

**Checklist**:
- [ ] Backend avviato con `--host 0.0.0.0`
- [ ] Frontend avviato con `--host 0.0.0.0`
- [ ] Firewall non blocca porte 4200 e 8000
- [ ] Dispositivi sulla stessa rete WiFi
- [ ] IP corretto nel QR code
- [ ] Backend raggiungibile: `curl http://[IP]:8000/health`

## Performance

### Ottimizzazioni
- Standalone components (tree-shaking)
- OnPush change detection (dove possibile)
- Lazy loading routes
- Produzione build optimization

## Licenza
MIT