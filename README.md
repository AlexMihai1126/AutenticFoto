# 📘 Ghid de utilizare – Platforma **AutenticFoto** pentru licențiere a fotografiilor digitale

Acest ghid descrie pașii de bază pentru utilizarea aplicației de licențiere a fotografiilor, realizată în cadrul lucrării de licență. Platforma permite autentificarea utilizatorilor, conectarea unui portofel digital și interacțiunea cu rețeaua blockchain pentru atestarea și achiziționarea de imagini.

---

## 🔐 1. Creare cont

1. Accesați pagina principală a aplicației.
2. Navigați la secțiunea **„Înregistrare”**.
3. Completați formularul cu:
   - Adresă de e-mail validă
   - Nume de utilizator
   - Parolă (minimum 8 caractere, conține litere mici, cel puțin o majusculă, cel puțin un număr și simboluri)
4. După înregistrare, veți primi un email de confirmare.
5. Accesați link-ul din email pentru a valida contul.

---

## 🔑 2. Autentificare

1. După confirmarea contului, accesați pagina de **„Autentificare”**.
2. Introduceți email-ul și parola.
3. Veți fi redirecționat către pagina principală.

---

## 🔗 3. Asociere portofel electronic cu ajutorul extensiei MetaMask

1. Dați click pe **„Conectează Wallet”**, fie din alerta de sub bara de navigare sau butonul din pagina de profil.
2. Selectați contul dorit în MetaMask și confirmați conexiunea.
3. La prima conectare, veți fi rugat să semnați un mesaj pentru a confirma identitatea.
4. După semnare, platforma va genera automat o atestare EAS pentru cont și va lega permanent portofelul pentru a permite interacțiunea cu funcționalitățile blockchain.

---

## 🖼️ 4. Atestarea unei fotografii (pentru fotografi)

1. Accesați secțiunea **„Fotografiile mele”** din pagina de profil, după care face click pe butonul .
2. Selectați fișierul imagine și completați:
   - Titlu
   - Descriere (opțional)
   - Categorie
   - Tag-uri (opțional)
   - Locația unde a fost realizată fotografia (opțional)
   - Prețul în ETH
3. După încărcare, aplicația va genera un hash unic (SHA-256) pentru imagine.
4. Dați click pe butonul **„Atestă”** din vizualizarea fotografiilor de pe profil. **Observație** - este necesar să aveți fonduri suficiente pentru a acoperi costurile tranzacției pe rețea (mai multe în secțiunea de **„Întrebări frecvente”** a aplicației)
5. Aprobați tranzacția în MetaMask pentru a înregistra atestarea on-chain.
6. După confirmare, fotografia devine publică și va fi la vânzare imediat.

---

## 💳 5. Cumpărarea unei fotografii

1. Navigați în galerie și faceți click pe butonul **„Vezi detalii”** de pe card-ul fotografiei dorite.
2. Apăsați butonul **„Achiziționează”**.
3. Aprobați tranzacția în MetaMask.
4. După confirmarea pe blockchain:
   - Veți primi o atestare care certifică achiziția și copia pe care ați primit-o (fiecare fotografie achiziționată conține metadate despre achiziție, copia fiind unică fiecărei tranzacții).
   - Imaginea va fi disponibilă imediat pentru descărcare în contul dumneavoastră, din pagina de **„Tranzacții”**.

---

## 📥 6. Descărcarea fotografiei cumpărate

1. Accesați secțiunea **„Tranzacțiile mele”** din pagina de profil.
2. Selectați o fotografie achiziționată.
3. Dacă link-ul de descărcare este activ, apăsați pe butonul de **Descărcare**.
4. Dacă link-ul a expirat, apăsați pe butonul **„Generează link nou”**, iar acesta va fi disponibil imediat. Acesta va fi trimis automat și prin email.

---

## ℹ️ Observații

- Toate interacțiunile blockchain sunt publice și anonime.
- Utilizatorii trebuie să aibă un portofel MetaMask conectat și asociat contului pentru a putea cumpăra sau vinde imagini.
- Plata se face prin rețeaua Ethereum, prin moneda ETH.
- Platforma este o aplicație demonstrativă, rulând pe rețeaua de test Ethereum Sepolia, fără costuri reale.

---

## 📂 Despre proiect

- Aplicație realizată de către absolventul Mihai Alexandru al Universității din București, Facultatea de Matematică și Informatică, specializarea Calculatoare și Tehnologia Informației, în cadrul proiectului de licență „Platformă descentralizată pentru gestionarea licențelor de fotografie folosind tehnologia Blockchain și Web3”
- Proiectul a fost realizat din pasiunea pentru tehnologii moderne în aplicațiile web și soluții inovatoare pentru licențierea conținutului digital, utilizând tehnologii Blockchain.
- A fost utilizată stiva MERN (MongoDB, Express.js, React și Node.js) pentru dezvoltarea aplicației.
- Componente principale
  - Backend (server) - Express.JS
  - Frontend (interfața tradițională web cu utilizatorul) - Next.JS
  - Componentă de ascultare a rețelei Blockchain (listener) pentru a confirma tranzacțiile utilizatorului și a face legătura cu mediul on-chain - Ethers.JS v6
- Limbaje de programare
  - TypeScript (Backend, UI, listener)
  - Solidity (smart contracts pe rețeaua Ethereum)

---

## 🎓 Cunoștințe dobândite din realizarea proiectului

   - Înțelegerea arhitecturii aplicațiilor web full-stack și gestionarea unui proiect complet (frontend + backend + blockchain)
   - Scrierea și implementarea de contracte inteligente în limbajul Solidity, pe rețeaua Ethereum
   - Utilizarea serviciului Ethereum Attestation Service (EAS) pentru atestări on-chain cu scheme și contracte resolver personalizate
   - Integrarea cu biblioteca Ethers.js v6 pentru:
     - conectare portofel MetaMask
     - ascultarea evenimentelor de pe blockchain
     - trimiterea tranzacțiilor către EAS
   - Dezvoltarea unui listener WebSocket care:
     - ascultă evenimente on-chain în timp real
     - sincronizează datele în baza de date off-chain (prin intermediul unor API-uri către server)
   - Crearea unei aplicații web cu Next.js (React + SSR) și stilizare modernă cu Bootstrap + CSS modular
   - Configurarea și utilizarea MongoDB Cloud pentru baza de date
   - Configurarea și utilizarea Google Cloud Storage pentru fișierele utilizatorilor
   - Configurarea și utilizarea IPFS (InterPlanetary File System) prin intermediul serviciilor oferite de Pinata
   - Interacțiunea cu rețeaua Blockchain Ethereum prin intermediul API-urilor oferite de Infura (MetaMask developer)
   - Implementarea unui sistem complet de autentificare și autorizare:
     - autentificare clasică (email + parolă)
     - confirmare cont prin email
     - semnătură cu portofel digital
     - validări pe bază de roluri (user, admin, owner)
   - Utilizarea TypeScript pentru siguranță și organizare mai clară în componente
   - Scrierea de teste folosind `Jest`
   - Testare manuală a API-urilor cu `Postman`
   - Utilizarea pachetului `concurrently` pentru rularea simultană a serviciilor
   - Configurarea mediului de lucru cu fișiere `.env` pentru gestionarea variabilelor de mediu și a cheilor de autentificare pentru serviciile externe
