import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PlanCard from "../components/planCard";
import "../styles/plan.css";

export default function Plan() {
  const [selectedPlan, setSelectedPlan] = useState("basic");
  const [billing, setBilling] = useState("monthly"); // ✅ NEW
  const navigate = useNavigate();

  const plans = [
    {
      id: "basic",
      title: "Basic",
      priceMonthly: 5,
      priceYearly: 50,
      features: [
        "Javni profil organizatora radionica",
        "Objava do 3 aktivne radionice",
        "Pregled prijava polaznika",
        "Rezervacije termina putem kalendara",
        "Email podrška",
      ],
    },
    {
      id: "standard",
      title: "Standard",
      priceMonthly: 10,
      priceYearly: 100,
      features: [
        "Sve iz Basic paketa",
        "Neograničen broj radionica",
        "Online plaćanje radionica (PayPal i kartice)",
        "Dodavanje galerije slika s radionica",
        "Prioritetna email podrška",
      ],
    },
    {
      id: "premium",
      title: "Premium",
      priceMonthly: 20,
      priceYearly: 200,
      features: [
        "Sve iz Standard paketa",
        "Prodaja keramičkih proizvoda u webshopu",
        "Sudjelovanje i organizacija izložbi",
        "Recenzije i ocjene kupaca i polaznika",
        "Istaknuti profil i prioritetna podrška",
      ],
    },
  ];

  const getPrice = (plan) =>
    billing === "monthly" ? plan.priceMonthly : plan.priceYearly;

  const priceSuffix = billing === "monthly" ? "mjesečno" : "godišnje";

  return (
    <div className="plan-container">
      <h1 className="h1-plan">Odaberi plan</h1>

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
            className={`planItem ${selectedPlan === plan.id ? "selected" : ""}`}
            key={plan.id}
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
          onClick={() =>
            navigate("/placanje", { state: { planId: selectedPlan, billing } })
          }
        >
          Nastavi s plaćanjem
        </button>
      </div>
    </div>
  );
}
