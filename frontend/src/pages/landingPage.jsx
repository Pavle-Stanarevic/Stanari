import React from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import "../styles/landingPage.css";
import MapOSM from "../components/MapOSM";

function SectionCard({ title, children, cta, href }) {
  const isInternal = href && href.startsWith("/");

  return (
    <div className="card">
      <h3 className="card-title">{title}</h3>
      <p className="card-text">{children}</p>

      {isInternal ? (
        <Link to={href} className="card-btn">
          {cta}
          <ArrowRight className="icon" />
        </Link>
      ) : (
        <a href={href} className="card-btn">
          {cta}
          <ArrowRight className="icon" />
        </a>
      )}
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
          href="/pregledRadionica"
        >
          U svijetu koji juri, glina nas uči strpljenju. Na radionicama keramike
          zastajemo, dišemo i dopuštamo rukama da prate svoju priču. Svaki
          zaljepac, žlica ili figura postaje odraz trenutka, nesavršenog
          savršenstva, baš kao i mi. Dođi i otkrij koliko je lijepo kad se
          kreativnost pretvori u oblik.
        </SectionCard>

        <div className="grid">
          <SectionCard title="Online shop" cta="Odi u shop" href="#">
            Za sve one koji vole keramiku, ali više uživaju u ispijanju kave
            nego u miješanju gline, otvorili smo naš online shop! Tamo možeš
            pronaći unikatne keramičke komade koje su izradili naši instruktori
            i talentirani umjetnici.
          </SectionCard>

          <SectionCard title="Izložbe radova" cta="Termini izložbi" href="#">
            Naše izložbe radova polaznika dokaz su da se glina ne radi samo
            žlicama i žlicama - nego i ponosom, strpljenjem i čistom radošću
            stvaranja. Svaki izloženi komad priča svoju malu priču o prvim
            pokušajima, neočekivanim oblinama, pobjedama koje su postale čari, i
            trenucima kad se ruke i mašta savršeno razumiju.
          </SectionCard>
        </div>

        <SectionCard title="Naš tim" cta="Pogledaj organizatore" href="#">
          Upoznaj ekipu koja vjeruje da je glina najbolja terapija (i da nikad
          nije kasno zaprljati ruke!). Naši instruktori su majstori keramike —
          oni su vješti učitelji, osmijehom i ljubavlju za glinu koja se osjeti
          u svakom komadu.
        </SectionCard>

        <section className="location-wrap">
          <div className="location-card-zadnja">
            <h3>ClayPlay Studio</h3>
            <p className="lead">Unska 3, Zagreb • FER kvart</p>

            <div className="location-badges">
              <span className="badge">Keramika</span>
              <span className="badge">Radionice</span>
              <span className="badge">Izložbe</span>
            </div>

            <ul className="info-list">
              <li>
                <strong>Radno vrijeme:</strong> pon–pet 08:00–20:00
              </li>
              <li>
                <strong>Kontakt:</strong> info@clayplay.hr • 091 111 222
              </li>
              <li>
                <strong>Pristup:</strong> Tram 5/7/14, stanica Vjesnik • parking
                u blizini
              </li>
            </ul>

            <div className="btn-row">
              <a
                className="btn"
                href="https://www.google.com/maps/dir/?api=1&destination=45.8016,15.9710"
                target="_blank"
                rel="noreferrer"
              >
                🧭 Upute
              </a>
            </div>
          </div>

          <div className="map-shell">
            <div className="map-frame">
              <MapOSM lat={45.8016} lng={15.971} />
            </div>
          </div>
        </section>

        <footer className="footer"></footer>
      </div>
    </main>
  );
}
