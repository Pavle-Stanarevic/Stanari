import React from "react";
import { ArrowRight } from "lucide-react";
import Header from "../components/header";
import "../styles/landingPage.css";

function SectionCard({ title, children, cta, href }) {
  return (
    <div className="card">
      <h3 className="card-title">{title}</h3>
      <p className="card-text">{children}</p>
      <a href={href} className="card-btn">
        {cta}
        <ArrowRight className="icon" />
      </a>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="page-bg">
      <div className="container">

        <SectionCard
          title="Radionice izrade keramike"
          cta="Pregled radionica"
          href="#"
        >
          U svijetu koji juri, glina nas uči strpljenju. Na radionicama keramike
          zastajemo, dišemo i dopuštamo rukama da prate svoju priču. Svaki
          zaljepac, žlica ili figura postaje odraz trenutka, nesavršenog
          savršenstva, baš kao i mi. Dođi i otkrij koliko je lijepo kad se
          kreativnost pretvori u oblik.
        </SectionCard>

        <div className="grid">
          <SectionCard title="Online Shop" cta="Odi u shop" href="#">
            Za sve one koji vole keramiku, ali više uživaju u ispijanju kave
            nego u miješanju gline, otvorili smo naš online shop! Tamo možeš
            pronaći unikatne keramičke komade koje su izradili naši instruktori
            i talentirani umjetnici.
          </SectionCard>

          <SectionCard title="Izložbe Radova" cta="Termini izložbi" href="#">
            Naše izložbe radova polaznika dokaz su da se glina ne radi samo
            žlicama i žlicama - nego i ponosom, strpljenjem i čistom radošću
            stvaranja. Svaki izloženi komad priča svoju malu priču o prvim
            pokušajima, neočekivanim oblinama, pobjedama koje su postale čari, i
            trenucima kad se ruke i mašta savršeno razumiju.
          </SectionCard>
        </div>

        <SectionCard title="Naš Tim" cta="Pogledaj organizatore" href="#">
          Upoznaj ekipu koja vjeruje da je glina najbolja terapija (i da nikad
          nije kasno zaprljati ruke!). Naši instruktori su majstori keramike —
          oni su vješti učitelji, osmijehom i ljubavlju za glinu koja se osjeti
          u svakom komadu.
        </SectionCard>

        <footer className="footer">

        </footer>
      </div>
    </main>
  );
}
