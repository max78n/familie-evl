# Familie E-V-L — Familieplanlegger

Web-app (PWA) for Juni, Max, Finn og Felix.  
Fungerer på alle telefoner — ingen app-butikk nødvendig.

---

## Hva du trenger

- En datamaskin (Windows, Mac eller Linux)
- Node.js installert → last ned gratis fra **https://nodejs.org** (velg "LTS")
- En gratis konto på **https://vercel.com**

---

## Steg 1 — Kjør appen lokalt (test først)

Åpne Terminal (Mac/Linux) eller Command Prompt (Windows):

```bash
cd familie-evl
npm install
npm run dev
```

Åpne **http://localhost:5173** i nettleseren.  
Du skal se appen med familie E-V-L og alle fire skjermer.

---

## Steg 2 — Legg koden på GitHub

1. Gå til **https://github.com** og opprett en gratis konto
2. Klikk **"New repository"** → gi den navnet `familie-evl` → trykk **"Create"**
3. Følg instruksjonene GitHub viser for å laste opp koden:

```bash
cd familie-evl
git init
git add .
git commit -m "Familie E-V-L app"
git remote add origin https://github.com/DITT-BRUKERNAVN/familie-evl.git
git push -u origin main
```

---

## Steg 3 — Publiser gratis på Vercel

1. Gå til **https://vercel.com** og logg inn med GitHub-kontoen din
2. Klikk **"Add New Project"**
3. Velg `familie-evl` fra listen
4. Vercel oppdager automatisk at det er Vite — bare trykk **"Deploy"**
5. Etter ~1 minutt får du en adresse som ser slik ut:
   ```
   https://familie-evl.vercel.app
   ```

Det er alt! Del lenken med Juni.

---

## Steg 4 — Installer på begge telefonene (gjør dette på BEGGE)

### iPhone (Safari):
1. Åpne lenken i **Safari** (ikke Chrome!)
2. Trykk på **Del-ikonet** (firkant med pil opp) nederst
3. Scroll ned og trykk **"Legg til på Hjem-skjerm"**
4. Trykk **"Legg til"**
5. Appen dukker opp som et ikon på hjemskjermen — akkurat som en vanlig app!

### Android (Chrome):
1. Åpne lenken i **Chrome**
2. Trykk på de tre prikkene øverst til høyre
3. Trykk **"Legg til på startskjermen"**
4. Trykk **"Legg til"**

---

## Viktig å vite

- **All data lagres lokalt på hver telefon** — ingenting sendes til noen server
- Dere må legge til hendelser/oppgaver manuelt på hver telefon, eller bruke Outlook-synkronisering (se nedenfor)
- Appen fungerer **uten internett** etter første lasting (PWA)
- Appen oppdaterer seg automatisk når du laster opp ny kode til Vercel

---

## Outlook-oppsett (valgfritt)

For å hente kalenderavtaler automatisk fra Outlook:

1. Gå til **https://portal.azure.com**
2. Søk etter **"App registrations"** → **"New registration"**
3. Navn: `Familie E-V-L`, velg **"Personal Microsoft accounts only"**
4. Under **"Authentication"** → legg til Redirect URI:
   ```
   https://familie-evl.vercel.app/auth
   ```
5. Under **"API permissions"** → legg til:
   - `Calendars.Read` (Delegated)
   - `User.Read` (Delegated)
6. Kopier **"Application (client) ID"**
7. Åpne filen `src/utils/outlookService.ts` og bytt ut:
   ```typescript
   const CLIENT_ID = 'YOUR_AZURE_CLIENT_ID'
   ```
   med din ID, f.eks.:
   ```typescript
   const CLIENT_ID = 'a1b2c3d4-1234-5678-abcd-ef1234567890'
   ```
8. Deploy på nytt til Vercel

---

## Vigilo PDF

1. Åpne Vigilo-appen på telefonen
2. Finn ukebrev eller arrangement → trykk **"Del"** → **"Lagre som PDF"**
3. Åpne Familie E-V-L appen → gå til **"Koble til"**
4. Trykk **"Velg Vigilo-PDF"** og velg filen
5. Appen henter ut datoer og hendelser automatisk

---

## Oppdatere appen

Når du vil gjøre endringer (f.eks. legge til funksjoner):
```bash
# Gjør endringer i koden, så:
git add .
git commit -m "Hva du endret"
git push
```
Vercel oppdaterer appen automatisk innen ~30 sekunder.

---

## Prosjektstruktur

```
familie-evl/
├── src/
│   ├── screens/
│   │   ├── CalendarScreen.tsx    # Kalender med månedsoversikt
│   │   ├── TasksScreen.tsx       # Husarbeid og skoleoppgaver
│   │   ├── FoodScreen.tsx        # Måltidsplan og handleliste
│   │   └── ConnectScreen.tsx     # Outlook + Vigilo PDF
│   ├── components/
│   │   ├── AddEventModal.tsx     # Legg til hendelse
│   │   └── AddTaskModal.tsx      # Legg til oppgave
│   ├── store/
│   │   └── index.ts              # All data (Zustand)
│   ├── utils/
│   │   ├── members.ts            # Juni, Max, Finn, Felix
│   │   └── vigiloParser.ts       # PDF-parser
│   ├── types/index.ts            # TypeScript-typer
│   ├── App.tsx                   # Tab-navigasjon
│   ├── main.tsx                  # Inngang
│   └── index.css                 # Design-system
├── public/                       # PWA-ikoner
├── index.html
├── vite.config.ts                # Vite + PWA-plugin
└── package.json
```
