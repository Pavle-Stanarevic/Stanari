import { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PlanCard from "../components/planCard";
import "../styles/plan.css";
import plans from "../data/plans";
import { createSubscription } from "../api/subscriptions";
import useAuth from "../hooks/useAuth";
import { me } from "../api/auth";

export default function Plan() {
  const [billing, setBilling] = useState("monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useAuth();

  const isSubscribed = !!user?.isSubscribed;
  
  // Dodatna provjera za isSubscribed iz sessionStorage ako context još nije sinkroniziran
  const isSubscribedSession = useMemo(() => {
    try {
      const raw = sessionStorage.getItem("user");
      const u = raw ? JSON.parse(raw) : null;
      return !!u?.isSubscribed;
    } catch { return false; }
  }, []);

  const effectiveIsSubscribed = useMemo(() => {
    return !!(user?.isSubscribed || isSubscribedSession);
  }, [user?.isSubscribed, isSubscribedSession]);

  const subscribedUntil = useMemo(() => {
    if (effectiveIsSubscribed && user?.subscriptionEndDate) {
      const d = new Date(user.subscriptionEndDate);
      return d.toLocaleDateString("hr-HR");
    }
    if (effectiveIsSubscribed) {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d.toLocaleDateString("hr-HR");
    }
    return null;
  }, [effectiveIsSubscribed, user?.subscriptionEndDate]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        console.log("Plan.jsx: Fetching user data via me()...");
        const u = await me();
        console.log("Plan.jsx: User data received:", u);
        if (u && isMounted) {
          if (u.isSubscribed !== user?.isSubscribed) {
            console.log("Plan.jsx: Subscription status change detected!", u.isSubscribed);
          }
          setUser(u);
          sessionStorage.setItem("user", JSON.stringify(u));
        }
      } catch (err) {
        console.error("Plan.jsx: Error fetching user data", err);
      }
    })();
    
    const handleStorageChange = (e) => {
      if (e.key === "user" && isMounted) {
        try {
          const u = JSON.parse(e.newValue);
          if (u) setUser(u);
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => { 
      isMounted = false; 
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [setUser]); // Namjerno maknuto user?.isSubscribed kako bi se izbjegao loop ako setUser ne promijeni referencu savršeno

  const isOrganizer =
    user?.userType === "organizator" ||
    user?.role === "ORGANIZER" ||
    user?.role === "ORGANIZATOR" ||
    user?.type === "organizator";

  const plan = useMemo(() => plans?.[0], []);

  const getPrice = (p) => {
    if (!p) return 0;
    return billing === "monthly" ? p.priceMonthly : p.priceYearly;
  };

  console.log("Plan.jsx: Rendering", { 
    user, 
    isOrganizer, 
    isSubscribed, 
    isSubscribedSession,
    effectiveIsSubscribed,
    userIsSubscribed: user?.isSubscribed,
    typeofIsSubscribed: typeof user?.isSubscribed 
  });

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

      const userId = user?.id ?? user?.idKorisnik ?? user?.userId;
      if (!userId) throw new Error("Ne mogu pronaći ID korisnika.");

      const data = await createSubscription({
        userId,
        planId: plan.id,
        billing,
      });

      // data može biti { subscriptionId, ... } ili { id, ... } ovisno o backendu
      const subscriptionId = data?.subscriptionId ?? data?.id;
      if (!subscriptionId) throw new Error("Backend nije vratio subscriptionId.");

      const amount = data.amount;

      navigate("/placanje", {
        state: { 
          subscriptionId, 
          subscription: { 
            ...data, 
            amount, 
            billing, 
            title: plan.title, 
            id: subscriptionId 
          }, 
          mode: "subscription" 
        },
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

      {effectiveIsSubscribed && (
        <p className="subscription-status">
          Vaš plan vrijedi do: <strong>{subscribedUntil}</strong>
        </p>
      )}

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

      <div className="plans single-plan">
        <div className="planItem selected">
          <PlanCard
            title={plan.title}
            price={`${getPrice(plan)} € / ${billing === "monthly" ? "mjesečno" : "godišnje"}`}
            features={plan.features}
            selected={true}
          />
        </div>
      </div>

      <div className="button-container">
        {effectiveIsSubscribed ? (
          <button className="continue-btn" onClick={() => navigate("/")}>
            Povratak na početnu
          </button>
        ) : (
          <button className="continue-btn" onClick={handleContinue} disabled={loading}>
            {loading ? "Spremam..." : "Nastavi s plaćanjem"}
          </button>
        )}
      </div>
    </div>
  );
}
