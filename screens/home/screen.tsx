const steps = [
  "브라우저 툴바에서 peek를 켭니다.",
  "확인하고 싶은 UI 요소 위에 마우스를 올립니다.",
  "가장 신뢰도 높은 식별자를 클릭하거나 숫자 키로 복사합니다.",
];

const signals = [
  { label: "우선순위", value: "data-testid -> id -> component class" },
  { label: "출력", value: "바로 복사 가능한 selector 후보" },
  { label: "대상", value: "QA, 디버깅, DOM 탐색" },
];

export function HomeScreen() {
  return (
    <main className="grain min-h-screen px-5 py-8 text-foreground sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="panel overflow-hidden rounded-[32px]">
          <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:px-12 lg:py-12">
            <div className="space-y-8">
              <div className="flex items-center justify-between gap-4">
                <div className="rounded-full border border-[var(--line)] bg-white/70 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-[var(--muted)]">
                  Browser Extension Prototype
                </div>
                <a
                  href="#load"
                  className="rounded-full border border-[var(--line)] px-4 py-2 text-sm transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  Load Unpacked
                </a>
              </div>

              <div className="space-y-4">
                <p className="font-mono text-sm uppercase tracking-[0.3em] text-[var(--accent-strong)]">
                  peek
                </p>
                <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.05em] text-balance sm:text-6xl">
                  Hover any element and copy the identifier you actually need.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
                  peek ranks likely selectors in place so you can move from eyeballing the DOM to copying a useful target in one move.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href="#how"
                  className="rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-medium text-white transition hover:bg-[var(--accent)]"
                >
                  See Workflow
                </a>
                <a
                  href="chrome://extensions"
                  className="rounded-full border border-[var(--line)] bg-white/70 px-6 py-3 text-sm font-medium transition hover:border-[var(--accent-strong)] hover:text-[var(--accent-strong)]"
                >
                  Open Extensions
                </a>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="rounded-[28px] border border-[var(--line)] bg-[#111827] p-5 text-[#f8fafc] shadow-2xl shadow-black/10">
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#93c5fd]">
                    Live Tooltip
                  </p>
                  <p className="text-xs text-[#9ca3af]">press 1-5</p>
                </div>
                <div className="space-y-3">
                  {[
                    { confidence: "95%", label: 'data-testid="submit-button"', tone: "bg-[#1d4ed8]" },
                    { confidence: "90%", label: 'id="checkout-submit"', tone: "bg-[#2563eb]" },
                    { confidence: "70%", label: 'className="primaryButton"', tone: "bg-[#475569]" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-white/10 bg-white/5 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`rounded-full px-2 py-1 font-mono text-[11px] ${item.tone}`}>
                          {item.confidence}
                        </span>
                        <span className="font-mono text-sm text-[#e5e7eb]">{item.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {signals.map((signal) => (
                  <div key={signal.label} className="rounded-[24px] border border-[var(--line)] bg-white/75 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                      {signal.label}
                    </p>
                    <p className="mt-2 text-sm font-medium leading-6">{signal.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="panel rounded-[28px] p-6 sm:p-8">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--accent)]">
              How It Works
            </p>
            <div className="mt-6 space-y-5">
              {steps.map((step, index) => (
                <div key={step} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--foreground)] text-sm font-semibold text-white">
                    {index + 1}
                  </div>
                  <p className="pt-2 text-sm leading-6 text-[var(--muted)] sm:text-base">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div id="load" className="panel rounded-[28px] p-6 sm:p-8">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--accent-strong)]">
              Load Unpacked
            </p>
            <div className="mt-6 rounded-[24px] border border-[var(--line)] bg-white/80 p-5">
              <ol className="space-y-3 text-sm leading-6 text-[var(--muted)] sm:text-base">
                <li>1. Open Chrome and navigate to `chrome://extensions`.</li>
                <li>2. Turn on developer mode.</li>
                <li>3. Click `Load unpacked`.</li>
                <li>4. Select the `extension/` folder in this project.</li>
              </ol>
            </div>
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              The current build is intentionally small: content script tooltip, ranking heuristics, and click-to-copy flow are in place; packaging polish and icon assets are still pending.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
