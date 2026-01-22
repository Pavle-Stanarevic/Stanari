import { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PlanCard from "../components/planCard";
import "../styles/plan.css";
import plans from "../data/plans";
import { createSubscription, getPricing } from "../api/subscriptions";
import useAuth from "../hooks/useAuth";
import { me } from "../api/auth";

export default function Plan() {
  const [billing, setBilling] = useState("monthly");
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState(null);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser, isSubscribed: authIsSubscribed } = useAuth();

  const isSubscribed = !!user?.isSubscribed;
  
  const isSubscribedSession = useMemo(() => {
    try {
      const raw = sessionStorage.getItem("user");
      const u = raw ? JSON.parse(raw) : null;
      return !!u?.isSubscribed;
    } catch { return false; }
  }, []);

  const effectiveIsSubscribed = useMemo(() => {
    return !!(user?.isSubscribed || isSubscribedSession || authIsSubscribed);
  }, [user?.isSubscribed, isSubscribedSession, authIsSubscribed]);

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
    (async () => {
      setPricesLoading(true);
      try {
        const data = await getPricing();
        console.log("[DEBUG_LOG] Plan.jsx: Received pricing data:", data);
        if (data && data.monthly !== undefined) {
          setPrices({
            monthly: data.monthly,
            yearly: data.yearly
          });
        }
      } catch (err) {
        console.error("[DEBUG_LOG] Plan.jsx: Error fetching pricing", err);
      } finally {
        setPricesLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const refreshUser = async (force = false) => {
      try {
        console.log("[DEBUG_LOG] Plan.jsx: Fetching fresh user data via me()...", { force });
        const u = await me(!!force);
        console.log("[DEBUG_LOG] Plan.jsx: User data received:", u);
        if (u && isMounted) {
          setUser(u);
          sessionStorage.setItem("user", JSON.stringify(u));
        }
      } catch (err) {
        console.error("[DEBUG_LOG] Plan.jsx: Error fetching user data", err);
      }
    };

    const params = new URLSearchParams(window.location.search);
    const refreshedFlag = params.get("refreshed");
    if (!user || refreshedFlag) {
      refreshUser(!!refreshedFlag);
    }

    const handleStorageChange = (e) => {
      if (e.key === "user" && isMounted) {
        try {
          const u = JSON.parse(e.newValue);
          if (u) setUser(u);
        } catch {}
      }
    };

    const handleAuthUpdated = (e) => {
      const newUser = e?.detail?.user;
      if (!isMounted) return;
      if (newUser !== undefined) {
        setUser(newUser);
        try {
          if (newUser) sessionStorage.setItem("user", JSON.stringify(newUser));
          else sessionStorage.removeItem("user");
        } catch {}
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("auth:updated", handleAuthUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth:updated", handleAuthUpdated);
    };
  }, [setUser, user]);

  const isOrganizer =
    user?.userType === "organizator" ||
    user?.role === "ORGANIZER" ||
    user?.role === "ORGANIZATOR" ||
    user?.type === "organizator";

  const plan = useMemo(() => plans?.[0], []);

  const getPrice = (p) => {
    if (pricesLoading) return "...";
    if (!prices) return billing === "monthly" ? 5 : 50;
    const val = billing === "monthly" ? prices.monthly : prices.yearly;
    return val !== undefined ? val : (billing === "monthly" ? 5 : 50);
  };

  console.log("[DEBUG_LOG] Plan.jsx: Rendering", { 
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

      if (effectiveIsSubscribed) {
        setError("Već imate aktivnu subskripciju.");
        setLoading(false);
        return;
      }

      const userId = user?.id ?? user?.idKorisnik ?? user?.userId;
      if (!userId) throw new Error("Ne mogu pronaći ID korisnika.");

      const data = await createSubscription({
        userId,
        planId: plan.id,
        billing,
      });


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
        {effectiveIsSubscribed && !error ? (
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
