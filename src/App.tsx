import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Heart,
  Leaf,
  LoaderCircle,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  emptyProfile,
  exampleProfile,
  type Moment,
  type Profile,
  type Progress,
} from "../shared/moment";

import { Onboarding } from "./components/Onboarding";

type Page =
  "home" | "profile" | "working" | "moment" | "saved" | "how" | "privacy";
const labels = [
  "Understanding the selected interests",
  "Looking up cultural references through Qloo",
  "Exploring related interests with Qloo Insights",
  "Preparing a suitable shared activity",
  "Checking preferences and exclusions",
];
const storageKey = "kinship.moments.v1";
const activities: { value: Profile["activity"]; label: string }[] = [
  { value: "listening", label: "Listening" },
  { value: "looking", label: "Looking" },
  { value: "conversation", label: "Conversation" },
  { value: "hands-on", label: "Hands-on" },
  { value: "quiet", label: "Quiet time" },
];
const atmospheres: Profile["atmosphere"][] = [
  "calm",
  "cheerful",
  "reflective",
  "playful",
];
function readSaved(): Moment[] {
  try {
    const data = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return Array.isArray(data)
      ? data
          .filter(
            (x) =>
              x &&
              typeof x.title === "string" &&
              typeof x.activity === "string",
          )
          .slice(0, 20)
      : [];
  } catch {
    return [];
  }
}
export function App() {
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [page, setPage] = useState<Page>("home");
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [status, setStatus] = useState<{
    qlooConfigured: boolean;
    geminiConfigured: boolean;
  } | null>(null);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [moment, setMoment] = useState<Moment | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<Moment[]>(readSaved);
  const [storageMessage, setStorageMessage] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [alternate, setAlternate] = useState(false);
  useEffect(() => {
    fetch("/api/status")
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);
  const go = (p: Page) => {
    setPage(p);
    window.scrollTo({ top: 0 });
  };
  const update = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setProfile((p) => ({ ...p, [key]: value }));
  const run = async (p: Profile, skipQloo = false, alt = false) => {
    setProfile(p);
    setProgress([]);
    setError("");
    setStorageMessage("");
    setIsSaved(false);
    setAlternate(alt);
    go("working");
    try {
      const response = await fetch("/api/moment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: p, skipQloo, alternate: alt }),
      });
      if (!response.ok || !response.body)
        throw Error("The connection could not be started. Please try again.");
      const reader = response.body.getReader(),
        decoder = new TextDecoder();
      let buffer = "",
        gotResult = false;
      const handle = (line: string) => {
        if (!line.trim()) return;
        const e = JSON.parse(line);
        if (e.type === "progress")
          setProgress((prev) => [...prev.filter((x) => x.step !== e.step), e]);
        else if (e.type === "result") {
          gotResult = true;
          setMoment(e.moment);
          go("moment");
        } else if (e.type === "error") setError(e.message);
      };
      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        lines.forEach(handle);
        if (done) break;
      }
      if (buffer.trim()) handle(buffer);
      if (!gotResult)
        setError(
          (prev) =>
            prev || "The activity could not be completed. Please try again.",
        );
    } catch {
      setError("The connection was interrupted. Please try again.");
    }
  };
  const save = () => {
    if (!moment) return;
    const next = [moment, ...saved].slice(0, 20);
    setSaved(next);
    setIsSaved(true);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setStorageMessage("Saved on this device.");
    } catch {
      setStorageMessage(
        "Device storage is unavailable. This moment is saved only for this session.",
      );
    }
  };
  const remove = (i: number) => {
    const next = saved.filter((_, index) => index !== i);
    setSaved(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      setStorageMessage(
        "Device storage is unavailable; changes apply to this session only.",
      );
    }
  };
  const clear = () => {
    setSaved([]);
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("kinship."))
        .forEach((k) => localStorage.removeItem(k));
      setStorageMessage("Kinship data on this device was cleared.");
    } catch {
      setStorageMessage(
        "Device storage is unavailable. Session data was cleared.",
      );
    }
    setProfile(emptyProfile);
    setMoment(null);
  };
  const nav = [
    { id: "profile" as Page, label: "Create a moment", icon: Plus },
    { id: "saved" as Page, label: "Saved moments", icon: Bookmark },
    { id: "how" as Page, label: "How Kinship works", icon: CircleHelp },
    { id: "privacy" as Page, label: "Privacy & settings", icon: ShieldCheck },
  ];
  if (!onboardingComplete) {
    return (
      <Onboarding
        demo={status !== null && !status.qlooConfigured}
        onContinue={() => setOnboardingComplete(true)}
      />
    );
  }
  return (
    <div className="app-shell">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <button
          className="brand"
          onClick={() => go("home")}
          aria-label="Kinship home"
        >
          <span className="brand-mark">
            <Heart size={19} fill="currentColor" />
          </span>
          <span>
            kinship<span className="brand-dot">.</span>
          </span>
        </button>
        <span className="top-tagline">A little closer together.</span>
        <button className="top-saved" onClick={() => go("saved")}>
          <Bookmark size={17} /> <span>Saved moments</span>
        </button>
      </header>
      <div className="layout">
        <aside className="sidebar">
          <div>
            <p className="side-label">YOUR SPACE</p>
            <nav aria-label="Main navigation">
              {nav.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => go(id)}
                  className={
                    page === id ||
                    (id === "profile" && ["working", "moment"].includes(page))
                      ? "nav-item active"
                      : "nav-item"
                  }
                >
                  <Icon size={19} />
                  <span>{label}</span>
                  {page === id && (
                    <ChevronRight className="nav-chevron" size={15} />
                  )}
                </button>
              ))}
            </nav>
          </div>
          <div className="side-note">
            <span className="side-note-icon">
              <Leaf size={18} />
            </span>
            <p>
              Little moments
              <br />
              <strong>matter.</strong>
            </p>
            <small>There’s no right way to connect.</small>
          </div>
        </aside>
        <main id="main" className="main" tabIndex={-1}>
          {status && !status.qlooConfigured && (
            <div className="demo-banner">
              <span className="banner-dot" />{" "}
              <strong>DEMONSTRATION MODE</strong>
              <span>
                {" "}
                — sample results; live Qloo integration is not active.
              </span>
            </div>
          )}
          {page === "home" && (
            <>
              <div className="home-heading">
                <div>
                  <div className="eyebrow">
                    <span /> A LITTLE SPACE FOR CONNECTION
                  </div>
                  <h1>
                    Make room for a <br />
                    <em>meaningful moment.</em>
                  </h1>
                  <p className="lead">
                    Discover familiar interests and turn them into simple
                    experiences you can share.
                  </p>
                  <div className="hero-actions">
                    <button
                      className="btn primary"
                      onClick={() => go("profile")}
                    >
                      Create a moment <ArrowRight size={19} />
                    </button>
                    <button
                      className="btn text-button"
                      onClick={() => {
                        setProfile(exampleProfile);
                        run(exampleProfile);
                      }}
                    >
                      Explore an example <ArrowRight size={17} />
                    </button>
                  </div>
                  <p className="reassurance">
                    <Heart size={16} /> A suggestion, not a memory test. The
                    example uses fictional interests.
                  </p>
                </div>
                <div className="hero-art">
                  <img
                    src="/moment-illustration.png"
                    alt="Illustration of two people tending leaves together"
                  />
                  <div className="art-caption">
                    <span className="art-heart">
                      <Heart size={17} fill="currentColor" />
                    </span>
                    <div>
                      <strong>Connection can be simple.</strong>
                      <small>Start with something familiar.</small>
                    </div>
                  </div>
                </div>
              </div>
              <section className="steps-section">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow muted">A GENTLER WAY TO BEGIN</p>
                    <h2>Made for moments like these.</h2>
                  </div>
                  <button className="inline-link" onClick={() => go("how")}>
                    How it works <ArrowRight size={16} />
                  </button>
                </div>
                <div className="step-grid">
                  <article>
                    <span className="step-icon peach">
                      <Leaf size={20} />
                    </span>
                    <span className="step-number">01</span>
                    <h3>Share an interest</h3>
                    <p>Start with something they enjoy, however small.</p>
                  </article>
                  <article>
                    <span className="step-icon sage">
                      <Sparkles size={20} />
                    </span>
                    <span className="step-number">02</span>
                    <h3>Find a little inspiration</h3>
                    <p>We’ll help shape it into a thoughtful idea.</p>
                  </article>
                  <article>
                    <span className="step-icon sand">
                      <Heart size={20} />
                    </span>
                    <span className="step-number">03</span>
                    <h3>Enjoy time together</h3>
                    <p>Follow their lead. There’s no right or wrong way.</p>
                  </article>
                </div>
              </section>
              <div className="home-footer">
                <span>
                  <ShieldCheck size={17} /> Your privacy matters
                </span>
                <span>Made for connection, not clinical care.</span>
              </div>
            </>
          )}
          {page === "profile" && (
            <div className="content narrow">
              <button className="back" onClick={() => go("home")}>
                <ArrowLeft size={17} /> Back to welcome
              </button>
              <p className="eyebrow muted">LET’S BEGIN</p>
              <h1>
                A little about their interests<span className="period">.</span>
              </h1>
              <p className="page-intro">
                A few details can help shape a moment. Share only what you know;
                every field is optional.
              </p>
              <div className="notice">
                <Heart size={18} />
                <span>
                  These are interests shared by a family member or caregiver,
                  never assumed from age, diagnosis or background. Please use
                  fictional information only in this prototype.
                </span>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  run(profile);
                }}
              >
                <div className="form-card">
                  <div className="field">
                    <label htmlFor="references">
                      A cultural favourite <span>optional</span>
                    </label>
                    <p>
                      A musician, artist, song, film, programme, book or other
                      cultural reference. Separate multiple references with
                      commas.
                    </p>
                    <input
                      id="references"
                      value={profile.references}
                      onChange={(e) => update("references", e.target.value)}
                      placeholder="e.g. Miriam Makeba"
                      maxLength={500}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="interests">
                      Other known interests <span>optional</span>
                    </label>
                    <p>
                      Think gardening, cooking, nature, crafts, or anything
                      else.
                    </p>
                    <input
                      id="interests"
                      value={profile.interests}
                      onChange={(e) => update("interests", e.target.value)}
                      placeholder="e.g. gardening, cooking"
                      maxLength={500}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="language">
                      Preferred language <span>optional</span>
                    </label>
                    <input
                      id="language"
                      value={profile.language}
                      onChange={(e) => update("language", e.target.value)}
                      placeholder="If known"
                      maxLength={100}
                    />
                    <p>
                      Suggestions are currently written in English. Cultural
                      matches are omitted when their language cannot be
                      verified.
                    </p>
                  </div>
                </div>
                <div className="form-card">
                  <fieldset className="field">
                    <legend>What kind of moment?</legend>
                    <p>Choose what feels right today.</p>
                    <div className="choice-row">
                      {activities.map((a) => (
                        <button
                          type="button"
                          key={a.value}
                          aria-pressed={profile.activity === a.value}
                          className={
                            "chip " +
                            (profile.activity === a.value ? "selected" : "")
                          }
                          onClick={() => update("activity", a.value)}
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <fieldset className="field">
                    <legend>How much time?</legend>
                    <div className="choice-row">
                      {([5, 10, 15] as const).map((n) => (
                        <button
                          type="button"
                          key={n}
                          aria-pressed={profile.duration === n}
                          className={
                            "chip " + (profile.duration === n ? "selected" : "")
                          }
                          onClick={() => update("duration", n)}
                        >
                          {n} minutes
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <fieldset className="field">
                    <legend>Choose an atmosphere</legend>
                    <div className="choice-row">
                      {atmospheres.map((a) => (
                        <button
                          type="button"
                          key={a}
                          aria-pressed={profile.atmosphere === a}
                          className={
                            "chip capitalize " +
                            (profile.atmosphere === a ? "selected" : "")
                          }
                          onClick={() => update("atmosphere", a)}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                </div>
                <div className="form-card">
                  <div className="field">
                    <label htmlFor="avoid">
                      Anything to avoid? <span>optional</span>
                    </label>
                    <p>
                      Topics, music, imagery or activities. Separate items with
                      commas.
                    </p>
                    <textarea
                      id="avoid"
                      value={profile.avoid}
                      onChange={(e) => update("avoid", e.target.value)}
                      placeholder="e.g. loud music, competitive games"
                      maxLength={500}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="practical">
                      Practical preferences <span>optional</span>
                    </label>
                    <textarea
                      id="practical"
                      value={profile.practical}
                      onChange={(e) => update("practical", e.target.value)}
                      placeholder="Anything else that would make this feel comfortable"
                      maxLength={500}
                    />
                  </div>
                </div>
                <p className="privacy-inline">
                  <ShieldCheck size={17} /> Your entries are sent to the server
                  to create a suggestion. If configured, cultural references go
                  to Qloo and preferences to Gemini. Do not enter personal or
                  medical details.
                </p>
                <button className="btn primary large" type="submit">
                  Create connection moment <ArrowRight size={19} />
                </button>
              </form>
            </div>
          )}
          {page === "working" && (
            <div className="content narrow">
              <button className="back" onClick={() => go("profile")}>
                <ArrowLeft size={17} /> Return to profile
              </button>
              <p className="eyebrow muted">A MOMENT IN THE MAKING</p>
              <h1>
                Thoughtfully putting
                <br />
                <em>the pieces together.</em>
              </h1>
              <p className="page-intro">
                We’re working with the details you shared. This may take a
                little while.
              </p>
              <div className="progress-card" aria-live="polite">
                {labels.map((label, i) => {
                  const p = progress.find((x) => x.step === i + 1);
                  return (
                    <div className="progress-row" key={label}>
                      <span className={"progress-icon " + (p?.status || "")}>
                        {p?.status === "done" ? (
                          <Check size={17} />
                        ) : p?.status === "working" ? (
                          <LoaderCircle size={17} />
                        ) : p?.status === "error" ? (
                          <X size={17} />
                        ) : (
                          i + 1
                        )}
                      </span>
                      <div>
                        <strong>{label}</strong>
                        <small>{p?.detail || "Waiting"}</small>
                      </div>
                      <span className="progress-status">
                        {p?.status === "done"
                          ? "Complete"
                          : p?.status === "skipped"
                            ? "Skipped"
                            : p?.status === "error"
                              ? "Unable"
                              : p?.status === "working"
                                ? "In progress"
                                : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
              {error && (
                <div className="error-box" role="alert">
                  <strong>We couldn’t complete this moment.</strong>
                  <p>{error}</p>
                  <div className="button-row">
                    <button
                      className="btn primary"
                      onClick={() => run(profile, false, alternate)}
                    >
                      Try again <RefreshCw size={16} />
                    </button>
                    <button
                      className="btn secondary"
                      onClick={() => run(profile, true, alternate)}
                    >
                      Continue without Qloo
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {page === "moment" && moment && (
            <div className="content narrow">
              <button className="back" onClick={() => go("profile")}>
                <ArrowLeft size={17} /> Return to profile
              </button>
              <p className="eyebrow muted">A MOMENT FOR THE TWO OF YOU</p>
              <h1>
                Here’s a little idea<span className="period">.</span>
              </h1>
              <p className="page-intro">
                Take what feels right, leave what doesn’t. The moment is yours
                to make.
              </p>
              <article className="moment-card">
                <div className="moment-top">
                  <span className="moment-badge">
                    <Sparkles size={16} /> YOUR CONNECTION MOMENT
                  </span>
                  <span className="duration">
                    <Clock3 size={16} /> {moment.duration} minutes
                  </span>
                </div>
                <h2>{moment.title}</h2>
                <p className="moment-why">{moment.why}</p>
                <div className="moment-divider" />
                <div className="moment-part">
                  <span>01</span>
                  <div>
                    <h3>Begin gently</h3>
                    <blockquote>“{moment.opening}”</blockquote>
                  </div>
                </div>
                <div className="moment-part">
                  <span>02</span>
                  <div>
                    <h3>Do something together</h3>
                    <p>{moment.activity}</p>
                  </div>
                </div>
                <div className="moment-part">
                  <span>03</span>
                  <div>
                    <h3>Let conversation come naturally</h3>
                    {moment.invitations.map((x) => (
                      <p key={x} className="prompt">
                        “{x}”
                      </p>
                    ))}
                  </div>
                </div>
                <div className="moment-part">
                  <span>04</span>
                  <div>
                    <h3>When you’re ready to close</h3>
                    <p>“{moment.closing}”</p>
                  </div>
                </div>
                <div className="care-note">
                  <Heart size={19} />
                  <div>
                    <strong>Follow their lead</strong>
                    <p>{moment.adaptation}</p>
                  </div>
                </div>
              </article>
              <div className="source-note">
                <strong>
                  {moment.source === "qloo"
                    ? "Qloo Insights result"
                    : moment.source === "demo"
                      ? "Demonstration mode · illustrative suggestion"
                      : "General suggestion · not Qloo-derived"}
                </strong>
                <p>{moment.note}</p>
                {moment.reference && (
                  <p>
                    Verified result: {moment.reference.name} (
                    {moment.reference.type
                      .replace("urn:entity:", "")
                      .replace("_", " ")}
                    ) · informed by {moment.reference.seedNames?.join(", ")}.{" "}
                    <a
                      href={
                        "https://www.google.com/search?q=" +
                        encodeURIComponent(moment.reference.name)
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      Search for this item ↗
                    </a>
                  </p>
                )}
                <p>
                  {moment.model} Exclusion checks match exact phrases, not
                  meaning; please review the activity and any cultural item
                  first.
                </p>
              </div>
              <div className="result-actions">
                <button
                  className="btn primary"
                  onClick={save}
                  disabled={isSaved}
                >
                  <Bookmark size={18} />
                  {isSaved ? "Saved" : "Save this moment"}
                </button>
                <button
                  className="btn secondary"
                  onClick={() => run(profile, false, !alternate)}
                >
                  <RefreshCw size={17} /> Try another suggestion
                </button>
                <button
                  className="btn text-button"
                  onClick={() => go("profile")}
                >
                  Return to profile
                </button>
              </div>
              {storageMessage && (
                <p role="status" className="storage-message">
                  {storageMessage}
                </p>
              )}
              <button className="stop-action" onClick={() => go("profile")}>
                <X size={17} /> Stop or change activity
              </button>
            </div>
          )}
          {page === "saved" && (
            <div className="content narrow">
              <p className="eyebrow muted">KEPT CLOSE BY</p>
              <h1>
                Saved moments<span className="period">.</span>
              </h1>
              <p className="page-intro">
                A little collection to return to, stored only on this device.
              </p>
              {storageMessage && (
                <p role="status" className="storage-message">
                  {storageMessage}
                </p>
              )}
              {saved.length ? (
                <div className="saved-list">
                  {saved.map((m, i) => (
                    <article className="saved-card" key={i}>
                      <span className="moment-badge">
                        <Heart size={15} /> SAVED MOMENT
                      </span>
                      <h2>{m.title}</h2>
                      <p>{m.activity}</p>
                      <div className="button-row">
                        <button
                          className="btn secondary"
                          onClick={() => {
                            setMoment(m);
                            setIsSaved(true);
                            go("moment");
                          }}
                        >
                          View moment <ArrowRight size={16} />
                        </button>
                        <button
                          className="icon-button"
                          aria-label={`Remove saved moment ${i + 1}`}
                          onClick={() => remove(i)}
                        >
                          <Trash2 size={18} /> Remove
                        </button>
                      </div>
                    </article>
                  ))}
                  <button className="stop-action" onClick={clear}>
                    <Trash2 size={17} /> Clear all Kinship data
                  </button>
                </div>
              ) : (
                <div className="empty-card">
                  <span className="step-icon sage">
                    <Bookmark size={22} />
                  </span>
                  <h2>Nothing saved just yet</h2>
                  <p>When an idea feels right, save it here for another day.</p>
                  <button className="btn primary" onClick={() => go("profile")}>
                    Create a moment <ArrowRight size={17} />
                  </button>
                </div>
              )}
            </div>
          )}
          {page === "how" && (
            <div className="content narrow">
              <p className="eyebrow muted">A LITTLE MORE ABOUT KINSHIP</p>
              <h1>
                Small moments, made together<span className="period">.</span>
              </h1>
              <div className="info-card">
                <h2>Start with what you know</h2>
                <p>
                  Share an interest and choose what feels comfortable. A little
                  information is enough; we don’t guess a person’s preferences
                  from their age or background.
                </p>
                <h2>Explore with care</h2>
                <p>
                  When configured, Kinship searches Qloo for exact, unambiguous
                  cultural references and explores related entities through its
                  Insights API. A cultural relationship isn’t proof that someone
                  likes or remembers an item.
                </p>
                <h2>Make it your own</h2>
                <p>
                  Gemini, when available, selects a validated activity template.
                  Otherwise, Kinship uses a simple built-in template. The person
                  can decline, change or stop at any time. Review all
                  suggestions and references before sharing.
                </p>
                <p>
                  Kinship is a supportive companion, not a medical device,
                  memory test or substitute for professional care.
                </p>
              </div>
              <button className="btn primary" onClick={() => go("profile")}>
                Create a moment <ArrowRight size={17} />
              </button>
            </div>
          )}
          {page === "privacy" && (
            <div className="content narrow">
              <p className="eyebrow muted">YOUR SPACE, YOUR CHOICE</p>
              <h1>
                Privacy & settings<span className="period">.</span>
              </h1>
              <div className="info-card">
                <h2>What stays on this device</h2>
                <p>
                  Saved moments are stored in this browser’s local storage, not
                  in a Kinship account or database. If storage is unavailable,
                  saves last only for this session.
                </p>
                <h2>What is sent to services</h2>
                <p>
                  Your form is sent to the Kinship server for processing. When
                  configured, cultural references are sent to Qloo; preferences
                  and verified cultural entities are sent to Gemini. Those
                  providers process requests under their own policies. Kinship
                  does not intentionally store them remotely.
                </p>
                <h2>Use fictional details only</h2>
                <p>
                  This prototype is not for real patients’ personal or medical
                  information. Please don’t include names, diagnoses, recordings
                  or location. No account or analytics is required.
                </p>
                <button className="btn secondary" onClick={clear}>
                  <Trash2 size={17} /> Clear all local Kinship data
                </button>
                {storageMessage && <p role="status">{storageMessage}</p>}
              </div>
            </div>
          )}
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {nav.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => go(id)}
            aria-current={page === id ? "page" : undefined}
          >
            <Icon size={20} />
            <span>
              {id === "profile"
                ? "Create"
                : id === "saved"
                  ? "Saved"
                  : id === "how"
                    ? "How it works"
                    : "Privacy"}
            </span>
            <span className="sr-only">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
