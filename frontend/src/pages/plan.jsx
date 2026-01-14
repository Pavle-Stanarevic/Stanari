import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const { user } = useAuth();

  const getPrice = (plan) =>
    billing === "monthly" ? plan.priceMonthly : plan.priceYearly;

  const priceSuffix = billing === "monthly" ? "mjesečno" : "godišnje";

  const handleContinue = async () => {
    try {
      setLoading(true);
      setError("");

      const userId = user?.id ?? user?.idKorisnik;
      if (!userId) throw new Error("Korisnik nije prijavljen.");

      const data = await createSubscription({
        userId,
        planId: selectedPlan,
        billing,
      });

      navigate("/placanje", {
        state: { subscriptionId: data.subscriptionId },
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="plan-container">
      <h1 className="h1-plan">Odaberi plan</h1>

      {error && <p className="error">{error}</p>}

      {/* ✅ BILLING TOGGLE – ISPRAVNO */}
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

        {/* 🔥 OVO JE KLJUČNO – CRNI SLIDER */}
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
        <button
          className="continue-btn"
          onClick={handleContinue}
          disabled={loading}
        >
          {loading ? "Spremam..." : "Nastavi s plaćanjem"}
        </button>
      </div>
    </div>
  );
}
