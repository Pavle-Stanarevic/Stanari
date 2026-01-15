import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PlanCard from "../components/planCard";
import "../styles/plan.css";
import plans from "../data/plans";
import { createSubscription } from "../api/subscriptions";
import useAuth from "../hooks/useAuth";

export default function Plan() {
  const [billing, setBilling] = useState("monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isOrganizer = user?.userType === "organizator";

  // ✅ samo jedan plan (uzmi prvi iz plans.js)
  const plan = useMemo(() => plans?.[0], []);

  const getPrice = (p) => (billing === "monthly" ? p.priceMonthly : p.priceYearly);
  const priceSuffix = billing === "monthly" ? "mjesečno" : "godišnje";

  if (!user) {
    return (
      <div className="plan-container">
        <h1 className="h1-plan">Pretplata</h1>

        <div className="auth-guard">
          <p>Za pretplatu morate biti prijavljeni.</p>

          <div className="button-container">
            <button
              className="continue-btn"
              onClick={() => navigate("/login", { state: { from: location.pathname } })}
            >
              Prijavi se
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isOrganizer) {
    return (
      <div className="plan-container">
        <h1 className="h1-plan">Pretplata je dostupna samo organizatorima</h1>

        <div className="auth-guard">
          <p>
            Trenutno nemate organizatorski račun. Ako želite organizirati radionice,
            zatražite ulogu organizatora.
          </p>

          <div className="button-container" style={{ paddingBottom: "2rem" }}>
            <button className="continue-btn" onClick={() => navigate("/")}>
              Nazad
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="plan-container">
        <h1 className="h1-plan">Pretplata</h1>
        <p className="error">Plan nije konfiguriran (plans[0] ne postoji).</p>
      </div>
    );
  }

  const handleContinue = async () => {
    try {
      setLoading(true);
      setError("");

      const userId = user?.id ?? user?.idKorisnik;
      if (!userId) throw new Error("Ne mogu pronaći ID korisnika.");

      const data = await createSubscription({
        userId,
        planId: plan.id, // ✅ uvijek isti plan
        billing,
      });

      navigate("/placanje", {
        state: { subscriptionId: data.subscriptionId, subscription: data },
      });
    } catch (e) {
      setError(e?.message || "Greška kod spremanja pretplate.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="plan-container">
      <h1 className="h1-plan">Pretplata</h1>

      {error && <p className="error">{error}</p>}

      <div className="billing-toggle" role="tablist" aria-label="Billing period">
        <button
          type="button"
          className={`billing-tab ${billing === "monthly" ? "active" : ""}`}
          onClick={() => setBilling("monthly")}
        >
          Mjesečni
        </button>

        <button
          type="button"
          className={`billing-tab ${billing === "yearly" ? "active" : ""}`}
          onClick={() => setBilling("yearly")}
        >
          Godišnji
        </button>

        <div className={`billing-indicator ${billing}`} />
      </div>

      {/* ✅ jedna kartica */}
      <div className="plans single-plan">
        <div className="planItem selected">
          <PlanCard
            title={plan.title}
            price={`${getPrice(plan)} ${priceSuffix}`}
            features={plan.features}
            selected={true}
          />
        </div>
      </div>

      <div className="button-container">
        <button className="continue-btn" onClick={handleContinue} disabled={loading}>
          {loading ? "Spremam..." : "Nastavi s plaćanjem"}
        </button>
      </div>
    </div>
  );
}
