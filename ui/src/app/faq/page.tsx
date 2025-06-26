"use client";

import { FaqItem } from "@/lib/commonInterfaces";
import Link from "next/link";
import { Accordion } from "react-bootstrap";
import Container from "react-bootstrap/Container";

export default function FAQPage() {
  const faqItems: FaqItem[] = [
    {
      question: "Ce este platforma AutenticFoto?",
      answer: (
        <>
          <strong>AutenticFoto</strong> este o platformă hibridă pentru vânzarea
          de fotografii, care folosește tehnologia blockchain pentru atestarea
          utilizatorilor, a fotografiilor și a achizițiilor.
        </>
      ),
    },
    {
      question: "Ce taxe sunt percepute de platformă?",
      answer: (
        <>
          Platforma percepe un <strong>comision fix de 15%</strong> la fiecare
          tranzacție de cumpărare a unei fotografii.
          <br />
          <br />
          Acest comision este deja inclus în prețul final afișat. La listarea
          unei fotografii, prețul introdus este cel pe care îl vei primi la
          achiziție, fiind afișate clar și taxa platformei, dar și prețul total
          pe care îl va plăti cumpărătorul.
          <br />
          <br />
          În plus, utilizatorul suportă{" "}
          <strong>costul tranzacției on-chain (gas fees)</strong> atunci când se
          generează o atestare pentru listarea sau achiziționarea unei
          fotografii.
          <br />
          <br />
          <strong>Important:</strong> Validarea portofelului electronic pe
          blockchain și generarea atestării pentru confirmarea contului sunt
          realizate automat de platforma noastră. Ție ți se va cere doar să
          semnezi un mesaj din portofelul MetaMask — restul procesului este
          gestionat de noi și nu necesită cunoștințe tehnice. Nu se percep taxe
          pentru această acțiune.
          <br />
          <br />
          <strong>De ce există aceste taxe de rețea?</strong>
          <br />
          Rețeaua Ethereum este descentralizată și funcționează prin mii de
          noduri care validează și înregistrează tranzacții. Pentru ca o
          tranzacție să fie acceptată și salvată permanent, trebuie să plătești
          o taxă numită <strong>gas fee</strong>. Aceasta:
          <ul>
            <li>
              Recompensează proprietarii nodurilor pentru procesarea
              tranzacțiilor
            </li>
            <li>Previne abuzurile și supraîncărcarea rețelei</li>
            <li>
              Reflectă complexitatea operațiunii — atestările folosite în
              platformă sunt procese on-chain mai sofisticate, care implică{" "}
              <strong>interacțiuni cu contracte inteligente</strong>, validări
              de date și scriere permanentă în rețea. Acest lucru necesită mai
              multă putere de calcul decât un simplu transfer de ETH între două
              conturi.
            </li>
          </ul>
          <br />
          <strong>Pe scurt:</strong>
          <ul>
            <li>
              Comision platformă (15%) → pentru susținerea platformei noastre
            </li>
            <li>
              Taxe de rețea (gas fees) → plătite către nodurile rețelei
              Ethereum, nu către platformă
            </li>
          </ul>
          Ne străduim să menținem aceste costuri cât mai mici prin optimizări și
          arhitectura hibridă a platformei.
        </>
      ),
    },

    {
      question: "Ce avantaje aduce tehnologia blockchain Ethereum?",
      answer: (
        <>
          Platforma folosește tehnologia <strong>Ethereum</strong> pentru a
          garanta autenticitatea fiecărei fotografii înregistrate sau
          achiziționate.
          <br />
          <br />
          <strong>Ce este Ethereum?</strong>
          <br />
          Ethereum este o rețea blockchain descentralizată, unde datele
          înregistrate sunt{" "}
          <u>
            disponibile permanent, verificabile și imposibil de modificat
          </u>{" "}
          ulterior. Este una dintre cele mai utilizate platforme pentru
          aplicații descentralizate și contracte inteligente.
          <br />
          <br />
          <strong>Ce înregistrăm pe blockchain?</strong>
          <br />
          Pentru fiecare fotografie, se calculează o{" "}
          <strong>„amprentă digitală”</strong> unică a fișierului, care este
          stocată public pe blockchain împreună cu atestarea autorului. De
          asemenea, cumpărătorul primește o atestare care confirmă achiziția,
          inclusiv detalii precum adresa portofelului său, data și ora
          tranzacției, precum și hash-ul unic al fotografiei primite.
          <br />
          <br />
          <strong>Care sunt avantajele concrete?</strong>
          <ul>
            <li>
              Poți verifica oricând cine este autorul original al fotografiei
            </li>
            <li>
              Poți demonstra că tu ai cumpărat o fotografie (cu o atestare
              publică)
            </li>
            <li>
              Orice modificare adusă fișierului schimbă automat hash-ul, deci{" "}
              <u>falsificarea este detectabilă imediat</u>
            </li>
            <li>
              Toate tranzacțiile sunt publice și transparente, dar anonime
            </li>
          </ul>
          Astfel, Ethereum oferă o <strong>bază de încredere</strong> între
          fotograf, cumpărător și platformă, fără a depinde de sisteme
          centralizate.
        </>
      ),
    },
    {
      question: "Ce este MetaMask și de ce este necesar?",
      answer: (
        <>
          <strong>MetaMask</strong> este o extensie de browser care funcționează
          ca un <strong>portofel digital pentru Ethereum</strong>.
          <br />
          <br />
          Pe platforma noastră, MetaMask este necesar pentru:
          <ul>
            <li>Confirmarea identității tale prin atestări on-chain</li>
            <li>
              Cumpărarea de fotografii și trimiterea tranzacțiilor în rețea
            </li>
          </ul>
          <strong>MetaMask NU stochează parole sau date personale</strong> —
          interacțiunile se bazează pe criptografie și semnături digitale,
          oferind securitate și transparență. Tranzacțiile sunt anonime.
          <br />
          <br />
          Poți instala MetaMask de pe{" "}
          <Link
            href="https://metamask.io"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>site-ul oficial</span>
          </Link>{" "}
          și îl poți conecta cu ușurință la contul tău din platformă.
        </>
      ),
    },
    {
      question: "Cum funcționează atestarea prin serviciul EAS?",
      answer: (
        <>
          Platforma creează o{" "}
          <strong>atestare on-chain (pe rețeaua Ethereum)</strong> pentru
          fiecare acțiune: utilizator înregistrat, listare fotografii,
          achiziționare.
        </>
      ),
    },
    {
      question: "Cum achiziționez o fotografie?",
      answer: (
        <>
          Trebuie să ai un portofel Ethereum asociat contului (o poți face din
          pagina de{" "}
          <Link href={"myaccount/confirm-wallet"} target="_blank">
            <span>aici</span>
          </Link>{" "}
          dacă nu ai făcut-o deja). Apoi poți achiziționa fotografiile cu
          ușurință, prin tranzacții în moneda Ethereum. Achizițiile sunt
          gestionate automat prin contracte inteligente Solidity, eliminând
          disputele și asigurând transparență procesului.
        </>
      ),
    },
    {
      question: "Ce înseamnă livrarea prin IPFS?",
      answer: (
        <>
          IPFS (InterPlanetary File System) este un protocol descentralizat de
          stocare și partajare a fișierelor. În loc să fie găzduite pe un server
          central, fișierele sunt distribuite între noduri dintr-o rețea
          peer-to-peer și sunt identificate printr-un{" "}
          <strong>identificator unic de conținut (CID)</strong>.
          <br />
          <br />
          Atunci când o fotografie este vândută, cumpărătorul poate alege să
          primească un <strong>link IPFS</strong> către fișierul achiziționat,
          în locul unui link tradițional de descărcare gestionat direct de
          platformă.
          <br />
          <br />
          <strong>Ce avantaje are livrarea prin IPFS?</strong>
          <ul>
            <li>
              Fișierele sunt distribuite pe mai multe noduri — nu depind de
              server-ul nostru central
            </li>
            <li>
              Fiecare fișier are un <strong>identificator unic (CID)</strong>,
              ceea ce garantează autenticitatea sa: dacă fișierul este
              modificat, CID-ul se schimbă automat
            </li>
            <li>
              Conținutul este public, dar link-ul este furnizat doar
              cumpărătorului
            </li>
          </ul>
          <strong>Pe scurt:</strong> IPFS asigură o livrare descentralizată și
          sigură a fotografiilor cumpărate — în spiritul aplicațiilor Web3.
        </>
      ),
    },
    {
      question: "Cum listez o fotografie?",
      answer: (
        <>
          Pentru a lista o fotografie pe platformă, trebuie să urmezi câțiva
          pași simpli:
          <br />
          <br />
          <strong>1. Încarcă fotografia:</strong> Accesează pagina de{" "}
          <Link href={"/myaccount/photos/upload"} target="_blank">
            <span>încărcare fotografie</span>
          </Link>{" "}
          din contul tău și încarcă fișierul dorit. Sunt acceptate doar fișiere
          în format <strong>.jpg, .jpeg sau .png</strong> .
          <br />
          <strong>Notă:</strong> Nu poți încărca aceeași fotografie de două ori.
          Platforma verifică <strong>unicitatea fișierului</strong> prin
          calcularea unui hash criptografic. Dacă încarci o fotografie deja
          existentă, vei primi un mesaj de eroare și fișierul nu va fi acceptat.
          <br />
          <br />
          <strong>2. Completează detaliile:</strong> Adaugă un titlu, descriere,
          categorie, tag-uri (opționale), locația unde a fost realizată
          fotografia (opțional) și suma în ETH pe care dorești să o primești la
          fiecare achiziție (aceasta nu poate fi modificată ulterior). Platforma
          îți va afișa automat comisionul și prețul final plătit de cumpărător.
          <br />
          <br />
          <strong>3. Atestarea și publicarea:</strong> După încărcarea
          fotografiei, aceasta trebuie confirmată și pe rețeaua Ethereum. Pe
          pagina ta de fotograf, vei putea vedea fotografiile care nu au fost
          atestate, să le confirmi (prin apăsarea butonului de atestare și
          confirmarea tranzacției), iar fotografia ta devine vizibilă în galerie
          și poate fi achiziționată după ce se confirmă atestarea.
        </>
      ),
    },

    {
      question:
        "Ce înseamnă mesajul de alertă „Portofelul electronic nu este confirmat”?",
      answer: (
        <>
          Acest mesaj apare atunci când portofelul tău electronic{" "}
          <strong>nu a fost confirmat de platformă</strong>.
          <br />
          <br />
          Confirmarea se face printr-o <strong>atestare on-chain</strong>, care
          dovedește că ți-ai asociat contul cu portofelul electronic.
          <br />
          <br />
          <strong>Fără această confirmare:</strong>
          <ul>
            <li>Nu poți cumpăra fotografii</li>
            <li>Dacă ești fotograf, nu poți lista opere public</li>
          </ul>
          <strong>Ce trebuie să faci?</strong>
          <br />
          Accesează pagina contului tău și apasă pe butonul{" "}
          <em>„Confirmă portofelul”</em>. Ți se va cere să semnezi un mesaj —
          procesul este rapid, nu implică niciun cost și este necesar doar o
          singură dată.
        </>
      ),
    },
    {
      question:
        "Ce înseamnă mesajul de eroare „Portofelul MetaMask conectat NU coincide cu cel asociat contului!”?",
      answer: (
        <>
          Acest mesaj apare atunci când ești autentificat în platformă, dar
          portofelul MetaMask conectat <strong>nu este același</strong> cu cel
          pe care l-ai folosit la confirmare.
          <br />
          <br />
          Pentru siguranța contului și a datelor, fiecare utilizator are asociat
          un <strong>portofel unic</strong>, validat prin atestare.
          <br />
          <br />
          <strong>Acest mesaj apare în următoarele cazuri:</strong>
          <ul>
            <li>Ai schimbat contul MetaMask după autentificare</li>
            <li>Încerci să accesezi contul tău cu un alt portofel</li>
          </ul>
          <strong>Soluție:</strong>
          <br />
          Verifică în MetaMask că ai selectat portofelul corect. Dacă problema
          persistă, deconectează-te și reconectează-te cu portofelul validat.
        </>
      ),
    },
    {
      question: "Pot revinde o fotografie achiziționată?",
      answer: (
        <>
          Nu. Fotografiile achiziționate{" "}
          <strong>nu pot fi revândute sau redistribuite</strong>.
          <br />
          <br />
          Fiecare fotografie conține metadate adiționale despre cumpărător, iar
          orice tentativă de revânzare este <strong>ușor detectabilă</strong> și
          reprezintă o încălcare a termenilor platformei.
          <br />
          <br />
          Licențele oferite sunt <strong>personale și netransferabile</strong>.
          Orice utilizare în afara termenilor și condițiilor duce la revocarea
          accesului la platformă și eventuale acțiuni legale.
        </>
      ),
    },
  ];

  return (
    <Container className="py-5">
      <h1 className="mb-4">Întrebări frecvente (FAQ)</h1>
      <Accordion defaultActiveKey="0">
        {faqItems.map((item, index) => (
          <Accordion.Item eventKey={index.toString()} key={index}>
            <Accordion.Header>{item.question}</Accordion.Header>
            <Accordion.Body>{item.answer}</Accordion.Body>
          </Accordion.Item>
        ))}
      </Accordion>
    </Container>
  );
}
