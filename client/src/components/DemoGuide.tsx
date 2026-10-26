import { ArrowLeft, ArrowRight, Clock3, Play, Sparkles, X } from "lucide-react";
import { demoStory, type AppPage } from "../domain/demoStory";

export function DemoGuide({
  onClose,
  onNavigate,
  activeIndex,
  onActiveIndexChange,
}: {
  onClose: () => void;
  onNavigate: (page: AppPage) => void;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
}) {
  const active = demoStory[activeIndex]!;

  function openCurrentScreen() {
    onNavigate(active.destination);
    onClose();
  }

  return (
    <div
      className="demo-guide-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        className="demo-guide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-guide-title"
      >
        <header className="demo-guide-header">
          <div className="demo-guide-mark">
            <Sparkles size={17} />
          </div>
          <div>
            <span className="eyebrow">PRESENTER MODE · 4.5 MINUTES</span>
            <h2 id="demo-guide-title">CAIO demo story</h2>
          </div>
          <button
            className="icon-button"
            aria-label="Close demo guide"
            onClick={onClose}
          >
            <X size={17} />
          </button>
        </header>
        <div className="demo-guide-intro">
          Move from the portfolio challenge to an ontology-driven operating
          control plane. Each beat includes the screen, the line to deliver, and
          the proof to show.
        </div>
        <nav className="demo-guide-steps" aria-label="Story beats">
          {demoStory.map((beat, index) => (
            <button
              key={beat.title}
              className={`demo-guide-step ${activeIndex === index ? "active" : ""}`}
              aria-current={activeIndex === index ? "step" : undefined}
              onClick={() => onActiveIndexChange(index)}
            >
              <span className="demo-guide-step-number">0{index + 1}</span>
              <span className="demo-guide-step-title">{beat.title}</span>
              <small>
                <Clock3 size={11} /> {beat.duration}
              </small>
            </button>
          ))}
        </nav>
        <article className="demo-guide-beat">
          <span className="eyebrow">
            BEAT {String(activeIndex + 1).padStart(2, "0")} ·{" "}
            {active.destination.toUpperCase()}
          </span>
          <h3>{active.title}</h3>
          <div className="demo-guide-script">
            <span>Say</span>
            <p>“{active.presenterLine}”</p>
          </div>
          <div className="demo-guide-proof">
            <span>Prove</span>
            <p>{active.proofPoint}</p>
          </div>
        </article>
        <footer className="demo-guide-footer">
          <div className="demo-guide-pager">
            <button
              className="icon-button"
              aria-label="Previous story beat"
              disabled={activeIndex === 0}
              onClick={() => onActiveIndexChange(Math.max(0, activeIndex - 1))}
            >
              <ArrowLeft size={15} />
            </button>
            <span>
              {activeIndex + 1} / {demoStory.length}
            </span>
            <button
              className="icon-button"
              aria-label="Next story beat"
              disabled={activeIndex === demoStory.length - 1}
              onClick={() =>
                onActiveIndexChange(
                  Math.min(demoStory.length - 1, activeIndex + 1),
                )
              }
            >
              <ArrowRight size={15} />
            </button>
          </div>
          <button className="button-primary" onClick={openCurrentScreen}>
            <Play size={13} /> {active.actionLabel}
          </button>
        </footer>
      </aside>
    </div>
  );
}
