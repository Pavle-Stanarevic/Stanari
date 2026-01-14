import { useState } from "react"; // ✅ DODANO: maknut useMemo iz importa
import { useLocation, useNavigate } from "react-router-dom";
import PlanCard from "../components/planCard";
import "../styles/plan.css";
import plans from "../data/plans";
import { createSubscription } from "../api/subscriptions";
import useAuth from "../hooks/useAuth";

export default function Plan() {
  const [selectedPlan, setSelectedPlan] = useState("basic");
  const [billing, setBilling] = useState("monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isOrganizer = user?.userType === "organizator";

  const getPrice = (plan) =>
    billing === "monthly" ? plan.priceMonthly : plan.priceYearly;

  const priceSuffix = billing === "monthly" ? "mjesečno" : "godišnje";


  if (!user) {
    return (
      <div className="plan-container">
        <h1 className="h1-plan">Odaberi plan</h1>

        <div className="auth-guard">
          <p>Za odabir pretplate morate biti prijavljeni.</p>

          <div className="button-container">
            <button
              className="continue-btn"
              onClick={() =>
                navigate("/login", {
                  state: { from: location.pathname },
                })
              }
            >
              Prijavi se
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ✅ 3) Ako NIJE organizator → blokiraj stranicu + CTA
  if (!isOrganizer) {
    return (
      <div className="plan-container">
        <h1 className="h1-plan">Pretplate su dostupne samo organizatorima</h1>

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

  // ✅ 4) Backend flow: kreiraj pretplatu i idi na /placanje sa subscriptionId
  const handleContinue = async () => {
    try {
      setLoading(true);
      setError("");

      const userId = user?.id ?? user?.idKorisnik;
      if (!userId) throw new Error("Ne mogu pronaći ID korisnika.");

      // ✅ MAKNUTO: dupli check za isOrganizer u handleContinue
      // (jer već gore vraćamo return ako nije organizator)

      const data = await createSubscription({
        userId,
        planId: selectedPlan,
        billing,
      });

      navigate("/placanje", {
        state: { subscriptionId: data.subscriptionId },
      });
    } catch (e) {
      setError(e?.message || "Greška kod spremanja pretplate.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="plan-container">
      <h1 className="h1-plan">Odaberi plan</h1>

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

      <div className="plans">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`planItem ${selectedPlan === plan.id ? "selected" : ""}`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            <PlanCard
              title={plan.title}
              price={`${getPrice(plan)} ${priceSuffix}`}
              features={plan.features}
              selected={selectedPlan === plan.id}
            />
          </div>
        ))}
      </div>

      <div className="button-container">
        <button className="continue-btn" onClick={handleContinue} disabled={loading}>
          {loading ? "Spremam..." : "Nastavi s plaćanjem"}
        </button>
      </div>
    </div>
  );
}
