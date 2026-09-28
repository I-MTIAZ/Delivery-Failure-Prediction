"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

const DATASET_LIMITS = {
  distanceKm: { min: 3.6, max: 297.1 },
  packageWeightKg: { min: 0.67, max: 49.52 },
  deliveryCost: { min: 95.6674, max: 1632.7206 },
};

const EXPECTED_TIME_VALUES = [2, 3, 4, 5, 6, 7, 8, 16, 24];

type FormData = {
  deliveryPartner: string;
  packageType: string;
  vehicleType: string;
  deliveryMode: string;
  region: string;
  weatherCondition: string;
  distanceKm: string;
  packageWeightKg: string;
  expectedTimeHours: string;
  deliveryCost: string;
};

const initialForm: FormData = {
  deliveryPartner: "",
  packageType: "",
  vehicleType: "",
  deliveryMode: "",
  region: "",
  weatherCondition: "",
  distanceKm: "",
  packageWeightKg: "",
  expectedTimeHours: "",
  deliveryCost: "",
};

export default function Home() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [apiError, setApiError] = useState("");
  const [isPredicting, setIsPredicting] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [prediction, setPrediction] = useState<{
    probability: number;
    label: string;
    threshold: number;
  } | null>(null);

  const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

  useEffect(() => {
    let cancelled = false;

    async function checkApi() {
      try {
        const response = await fetch(`${API_URL}/health`);
        if (!response.ok) throw new Error("API health check failed");
        if (!cancelled) setApiConnected(true);
      } catch {
        if (!cancelled) setApiConnected(false);
      }
    }

    checkApi();
    const interval = window.setInterval(checkApi, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [API_URL]);

  const completion = useMemo(() => {
    const values = Object.values(form);
    return Math.round(
      (values.filter((value) => value.trim() !== "").length / values.length) * 100
    );
  }, [form]);

  function updateField(field: keyof FormData, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setSubmitted(false);
    setValidationError("");
    setApiError("");
    setPrediction(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitted(true);
    setValidationError("");
    setApiError("");
    setPrediction(null);

    if (completion < 100) {
      setValidationError("Please complete all fields before running the prediction.");
      return;
    }

    const distance = Number(form.distanceKm);
    const weight = Number(form.packageWeightKg);
    const cost = Number(form.deliveryCost);
    const expectedTime = Number(form.expectedTimeHours);

    if (
      distance < DATASET_LIMITS.distanceKm.min ||
      distance > DATASET_LIMITS.distanceKm.max
    ) {
      setValidationError(
        `Distance must be between ${DATASET_LIMITS.distanceKm.min} and ${DATASET_LIMITS.distanceKm.max} km.`
      );
      return;
    }

    if (
      weight < DATASET_LIMITS.packageWeightKg.min ||
      weight > DATASET_LIMITS.packageWeightKg.max
    ) {
      setValidationError(
        `Package weight must be between ${DATASET_LIMITS.packageWeightKg.min} and ${DATASET_LIMITS.packageWeightKg.max} kg.`
      );
      return;
    }

    if (!EXPECTED_TIME_VALUES.includes(expectedTime)) {
      setValidationError(
        `Expected delivery time must be one of: ${EXPECTED_TIME_VALUES.join(", ")} hours.`
      );
      return;
    }

    if (
      cost < DATASET_LIMITS.deliveryCost.min ||
      cost > DATASET_LIMITS.deliveryCost.max
    ) {
      setValidationError(
        `Delivery cost must be between ${DATASET_LIMITS.deliveryCost.min} and ${DATASET_LIMITS.deliveryCost.max}.`
      );
      return;
    }

    setIsPredicting(true);

    try {
      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          delivery_partner: form.deliveryPartner,
          package_type: form.packageType,
          vehicle_type: form.vehicleType,
          delivery_mode: form.deliveryMode,
          region: form.region,
          weather_condition: form.weatherCondition,
          distance_km: distance,
          package_weight_kg: weight,
          expected_time_hours: expectedTime,
          delivery_cost: cost,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const detail =
          errorBody?.detail
            ? typeof errorBody.detail === "string"
              ? errorBody.detail
              : JSON.stringify(errorBody.detail)
            : `API returned HTTP ${response.status}`;
        throw new Error(detail);
      }

      const result = await response.json();

      setPrediction({
        probability: Number(result.failure_probability_percent),
        label: result.label,
        threshold: Number(result.threshold_percent),
      });
      setApiConnected(true);
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : "Could not connect to the ML prediction API."
      );
      setApiConnected(false);
    } finally {
      setIsPredicting(false);
    }
  }

  function resetForm() {
    setForm(initialForm);
    setSubmitted(false);
    setValidationError("");
    setApiError("");
    setPrediction(null);
    setIsPredicting(false);
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 ring-1 ring-blue-400/20">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5 text-blue-300"
                aria-hidden="true"
              >
                <path
                  d="M3 7.5h11.5a2 2 0 0 1 2 2V16H5a2 2 0 0 1-2-2V7.5Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
                <path
                  d="M16.5 11H19l2 2.4V16h-4.5M7 19h.01M18 19h.01"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="7" cy="16.8" r="2" stroke="currentColor" strokeWidth="1.7" />
                <circle cx="18" cy="16.8" r="2" stroke="currentColor" strokeWidth="1.7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide text-white">
                Delivery Risk AI
              </p>
              <p className="text-xs text-slate-500">Supervised ML inference demo</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/5 px-3 py-1.5 text-xs text-emerald-300 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Model ready
          </div>
        </header>

        <section className="grid gap-10 pb-10 pt-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-400/15 bg-blue-400/5 px-3 py-1.5 text-xs font-medium text-blue-300">
              XGBoost · Binary Classification
            </div>

            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Predict delivery failure
              <span className="block text-slate-400">before it becomes a problem.</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
              Enter the delivery conditions below to estimate the model&apos;s
              probability of failure. The final application will connect this
              interface to the trained XGBoost inference API.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#predict"
                className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
              >
                Run a prediction
              </a>
              <a
                href="#about"
                className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
              >
                About the model
              </a>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <StatCard value="96.78%" label="ROC-AUC" />
            <StatCard value="81.25%" label="Test F1" />
            <StatCard value="0.31" label="F1 threshold" />
          </div>
        </section>

        <section id="predict" className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-7">
            <div className="mb-7 flex items-start justify-between gap-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">
                  Prediction input
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Delivery information
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Use the values represented in the training data before running the prediction.
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs text-slate-500">Form complete</p>
                <p className="mt-1 text-lg font-semibold text-white">{completion}%</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-7">
              <div>
                <p className="mb-3 text-sm font-medium text-slate-300">Delivery context</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Delivery partner">
                    <select
                      value={form.deliveryPartner}
                      onChange={(e) => updateField("deliveryPartner", e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Select delivery partner</option>
                      <option value="delhivery">Delhivery</option>
                      <option value="xpressbees">Xpressbees</option>
                      <option value="shadowfax">Shadowfax</option>
                      <option value="dhl">DHL</option>
                      <option value="amazon logistics">Amazon Logistics</option>
                      <option value="blue dart">Blue Dart</option>
                      <option value="fedex">FedEx</option>
                      <option value="ecom express">Ecom Express</option>
                      <option value="ekart">Ekart</option>
                    </select>
                  </Field>

                  <Field label="Package type">
                    <select
                      value={form.packageType}
                      onChange={(e) => updateField("packageType", e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Select package type</option>
                      <option value="automobile parts">Automobile Parts</option>
                      <option value="cosmetics">Cosmetics</option>
                      <option value="groceries">Groceries</option>
                      <option value="electronics">Electronics</option>
                      <option value="clothing">Clothing</option>
                      <option value="documents">Documents</option>
                      <option value="fragile items">Fragile Items</option>
                      <option value="pharmacy">Pharmacy</option>
                      <option value="furniture">Furniture</option>
                    </select>
                  </Field>

                  <Field label="Vehicle type">
                    <select
                      value={form.vehicleType}
                      onChange={(e) => updateField("vehicleType", e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Select vehicle type</option>
                      <option value="bike">Bike</option>
                      <option value="ev van">EV Van</option>
                      <option value="truck">Truck</option>
                      <option value="van">Van</option>
                      <option value="ev bike">EV Bike</option>
                      <option value="scooter">Scooter</option>
                    </select>
                  </Field>

                  <Field label="Delivery mode">
                    <select
                      value={form.deliveryMode}
                      onChange={(e) => updateField("deliveryMode", e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Select delivery mode</option>
                      <option value="same day">Same Day</option>
                      <option value="express">Express</option>
                      <option value="two day">Two Day</option>
                      <option value="standard">Standard</option>
                    </select>
                  </Field>

                  <Field label="Region">
                    <select
                      value={form.region}
                      onChange={(e) => updateField("region", e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Select region</option>
                      <option value="east">East</option>
                      <option value="west">West</option>
                      <option value="north">North</option>
                      <option value="south">South</option>
                      <option value="central">Central</option>
                    </select>
                  </Field>

                  <Field label="Weather condition">
                    <select
                      value={form.weatherCondition}
                      onChange={(e) => updateField("weatherCondition", e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Select weather</option>
                      <option value="clear">Clear</option>
                      <option value="cold">Cold</option>
                      <option value="rainy">Rainy</option>
                      <option value="foggy">Foggy</option>
                      <option value="hot">Hot</option>
                      <option value="stormy">Stormy</option>
                    </select>
                  </Field>
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-medium text-slate-300">Delivery measurements</p>
                <p className="mb-4 text-xs leading-5 text-slate-500">Values are restricted to the ranges represented in the training dataset. This prevents extreme inputs that the model never saw during training.</p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Distance" suffix="km">
                    <input
                      type="number"
                      min={DATASET_LIMITS.distanceKm.min}
                      max={DATASET_LIMITS.distanceKm.max}
                      step="0.1"
                      value={form.distanceKm}
                      onChange={(e) => updateField("distanceKm", e.target.value)}
                      placeholder="150"
                      className={inputClass}
                    />
                    <span className="mt-1.5 block text-[11px] text-slate-600">3.6–297.1 km</span>
                  </Field>

                  <Field label="Package weight" suffix="kg">
                    <input
                      type="number"
                      min={DATASET_LIMITS.packageWeightKg.min}
                      max={DATASET_LIMITS.packageWeightKg.max}
                      step="0.01"
                      value={form.packageWeightKg}
                      onChange={(e) => updateField("packageWeightKg", e.target.value)}
                      placeholder="12.5"
                      className={inputClass}
                    />
                    <span className="mt-1.5 block text-[11px] text-slate-600">0.67–49.52 kg</span>
                  </Field>

                  <Field label="Expected delivery time" suffix="hours">
                    <select
                      value={form.expectedTimeHours}
                      onChange={(e) => updateField("expectedTimeHours", e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Select expected time</option>
                      {EXPECTED_TIME_VALUES.map((hours) => (
                        <option key={hours} value={hours}>
                          {hours} hours
                        </option>
                      ))}
                    </select>
                    <span className="mt-1.5 block text-[11px] text-slate-600">Dataset values only</span>
                  </Field>

                  <Field label="Delivery cost">
                    <input
                      type="number"
                      min={DATASET_LIMITS.deliveryCost.min}
                      max={DATASET_LIMITS.deliveryCost.max}
                      step="0.0001"
                      value={form.deliveryCost}
                      onChange={(e) => updateField("deliveryCost", e.target.value)}
                      placeholder="Enter cost"
                      className={inputClass}
                    />
                    <span className="mt-1.5 block text-[11px] text-slate-600">95.6674–1632.7206</span>
                  </Field>
                </div>
              </div>

              {validationError && (
                <div className="rounded-2xl border border-amber-300/15 bg-amber-300/5 px-4 py-3 text-sm text-amber-200">
                  {validationError}
                </div>
              )}

              {submitted && completion < 100 && (
                <div className="rounded-2xl border border-amber-300/15 bg-amber-300/5 px-4 py-3 text-sm text-amber-200">
                  Please complete all fields. The backend will later validate
                  values against the model&apos;s actual feature schema.
                </div>
              )}

              {apiError && (
                <div className="rounded-2xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-200">
                  Prediction API error: {apiError}
                </div>
              )}

              <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-blue-500 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400"
                >
                  {isPredicting ? "Running XGBoost..." : "Run prediction"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>

          <aside className="rounded-3xl border border-white/10 bg-slate-950/50 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Prediction output
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Failure probability</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs ${
                    prediction
                      ? prediction.label === "Failed"
                        ? "bg-red-400/10 text-red-300"
                        : "bg-emerald-400/10 text-emerald-300"
                      : "bg-white/5 text-slate-400"
                  }`}
                >
                  {prediction ? "Live result" : "Waiting"}
                </span>
              </div>

              <div className="mt-6">
                <p className="text-5xl font-semibold tracking-tight text-white">
                  {prediction ? `${prediction.probability.toFixed(2)}%` : "—"}
                </p>
                <p
                  className={`mt-2 text-sm font-medium ${
                    prediction?.label === "Failed"
                      ? "text-red-300"
                      : prediction?.label === "Completed"
                        ? "text-emerald-300"
                        : "text-slate-500"
                  }`}
                >
                  {prediction
                    ? prediction.label === "Failed"
                      ? "Higher failure risk"
                      : "Lower failure risk"
                    : "Waiting for the ML backend"}
                </p>
              </div>

              <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    prediction?.label === "Failed" ? "bg-red-400" : "bg-blue-400"
                  }`}
                  style={{ width: `${prediction?.probability ?? 0}%` }}
                />
              </div>

              {prediction && (
                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                  <span>Decision threshold</span>
                  <span className="font-medium text-slate-300">
                    {prediction.threshold}%
                  </span>
                </div>
              )}
            </div>

            <div className="mt-5 space-y-3">
              <InfoRow label="Model" value="XGBoost" />
              <InfoRow label="Decision threshold" value="31%" />
              <InfoRow label="Prediction type" value="Binary" />
              <InfoRow label="API status" value={apiConnected ? "Connected" : "Not connected"} muted={!apiConnected} />
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
              <p className="text-xs font-semibold text-slate-300">How it works</p>
              <div className="mt-3 space-y-2 text-xs leading-5 text-slate-500">
                <p>1. User provides delivery information.</p>
                <p>2. FastAPI applies the saved preprocessing pipeline.</p>
                <p>3. XGBoost returns a failure probability.</p>
                <p>4. Probability is compared with the 0.31 threshold.</p>
              </div>
            </div>
          </aside>
        </section>

        <section id="about" className="grid gap-5 py-10 md:grid-cols-3">
          <AboutCard
            title="Validated before testing"
            text="The final threshold was selected using validation data so the held-out test set could remain untouched for final evaluation."
          />
          <AboutCard
            title="Business-aware analysis"
            text="Threshold analysis also examined how different false-positive and false-negative costs can change operational decisions."
          />
          <AboutCard
            title="Deployment ready"
            text="The frontend now sends validated inputs to the FastAPI inference service, which loads the saved preprocessing pipeline and XGBoost model."
          />
        </section>

        <footer className="border-t border-white/10 py-6 text-xs leading-5 text-slate-600">
          Demo interface for an ML portfolio project. The delivery-failure
          target is synthetic, so predictions should not be treated as
          validated operational forecasts.
        </footer>
      </div>
    </main>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/10";

const selectClass =
  "w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-300 outline-none transition focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/10";

function Field({
  label,
  suffix,
  children,
}: {
  label: string;
  suffix?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between text-xs font-medium text-slate-400">
        <span>{label}</span>
        {suffix && <span className="text-slate-600">{suffix}</span>}
      </span>
      {children}
    </label>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xl font-semibold text-white sm:text-2xl">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}

function InfoRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-3 text-sm last:border-0 last:pb-0">
      <span className="text-slate-500">{label}</span>
      <span className={muted ? "text-slate-600" : "text-slate-300"}>{value}</span>
    </div>
  );
}

function AboutCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
    </div>
  );
}
