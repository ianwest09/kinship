import React from "react";
import { ArrowRight, Heart, Leaf, ShieldCheck } from "lucide-react";

/** The optional fictional details stay in the form only and are discarded on exit. */
export function Onboarding({
  onContinue,
  demo,
}: {
  onContinue: () => void;
  demo: boolean;
}) {
  return (
    <div className="onboarding">
      <a className="skip" href="#onboarding-main">
        Skip to content
      </a>
      <header className="onboarding-header">
        <span className="onboarding-brand">
          <span className="brand-mark">
            <Heart size={19} fill="currentColor" aria-hidden="true" />
          </span>
          <span>
            kinship<span className="brand-dot">.</span>
          </span>
        </span>
        <span className="onboarding-header-note">
          A little closer together.
        </span>
      </header>
      {demo && (
        <div className="onboarding-demo demo-banner" role="status">
          <span className="banner-dot" /> <strong>DEMONSTRATION MODE</strong> —
          sample results; live Qloo integration is not active.
        </div>
      )}
      <main id="onboarding-main" className="onboarding-main">
        <div className="onboarding-intro">
          <div className="eyebrow">
            <span /> A GENTLE PLACE TO BEGIN
          </div>
          <h1>
            Every connection
            <br />
            <em>starts somewhere.</em>
          </h1>
          <p className="lead">
            Welcome to Kinship. Let’s make a little space for meaningful
            moments, together.
          </p>
          <div className="onboarding-art">
            <img
              src="/moment-illustration.png"
              alt="Illustration of two people tending leaves together"
            />
            <div className="onboarding-art-note">
              <Leaf size={18} aria-hidden="true" /> There’s no right way to
              connect.
            </div>
          </div>
        </div>
        <section className="onboarding-card" aria-labelledby="onboarding-title">
          <p className="eyebrow muted">BEFORE WE BEGIN</p>
          <h2 id="onboarding-title">
            A little introduction<span className="period">.</span>
          </h2>
          <p className="onboarding-description">
            For this prototype, use fictional details only. All fields are
            optional, and you can skip this step.
          </p>
          <form
            autoComplete="off"
            onSubmit={(event) => {
              event.preventDefault();
              onContinue();
            }}
          >
            <div className="onboarding-fields">
              <div className="field">
                <label htmlFor="onboarding-name">Name</label>
                <input
                  id="onboarding-name"
                  name="name"
                  type="text"
                  maxLength={100}
                  placeholder="e.g. Alex"
                />
              </div>
              <div className="field">
                <label htmlFor="onboarding-surname">Surname</label>
                <input
                  id="onboarding-surname"
                  name="surname"
                  type="text"
                  maxLength={100}
                  placeholder="e.g. Smith"
                />
              </div>
              <div className="field">
                <label htmlFor="onboarding-age">Age</label>
                <input
                  id="onboarding-age"
                  name="age"
                  type="number"
                  min="0"
                  max="120"
                  step="1"
                  inputMode="numeric"
                  placeholder="e.g. 72"
                />
              </div>
              <div className="field">
                <label htmlFor="onboarding-birth-country">
                  Country of birth
                </label>
                <input
                  id="onboarding-birth-country"
                  name="birthCountry"
                  type="text"
                  maxLength={100}
                  placeholder="e.g. South Africa"
                />
              </div>
              <div className="field onboarding-field-wide">
                <label htmlFor="onboarding-residence-country">
                  Country of residence
                </label>
                <input
                  id="onboarding-residence-country"
                  name="residenceCountry"
                  type="text"
                  maxLength={100}
                  placeholder="e.g. South Africa"
                />
              </div>
            </div>
            <div className="onboarding-privacy">
              <ShieldCheck size={19} aria-hidden="true" />
              <p>
                These details stay in this form and are discarded when you
                continue. They aren’t saved, sent to services, or used to
                suggest activities.
              </p>
            </div>
            <button className="btn primary onboarding-continue" type="submit">
              Continue to Kinship <ArrowRight size={19} aria-hidden="true" />
            </button>
            <button
              className="btn text-button onboarding-skip"
              type="button"
              onClick={onContinue}
            >
              Skip for now
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
