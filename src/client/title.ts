import type { BrandStore } from "./store.ts";

const OFFICIAL_TITLE = "DeepSeek Harness";
const SUFFIX = ` — ${OFFICIAL_TITLE}`;

export function brandTitle(upstream: string, name: string): string | null {
  if (upstream === OFFICIAL_TITLE) return name;
  if (upstream.endsWith(SUFFIX)) return upstream.slice(0, -OFFICIAL_TITLE.length) + name;
  return null;
}

/** Own only known upstream title formats. No body observation or interval polling. */
export function installTitle(store: BrandStore): () => void {
  let original: string | null = null;
  let written: string | null = null;
  let observer: MutationObserver | null = null;
  let windowStart = 0;
  let writes = 0;
  let blocked = false;

  const restore = () => {
    if (written !== null && original !== null && document.title === written)
      document.title = original;
    original = null;
    written = null;
  };
  const update = () => {
    const settings = store.getSnapshot();
    if (!settings.customizeTitle || blocked) return;
    const current = document.title;
    const source = current === written && original !== null ? original : current;
    const next = brandTitle(source, settings.name ?? OFFICIAL_TITLE);
    if (next === null) {
      original = null;
      written = null;
      return;
    }
    original = source;
    if (current === next) return;
    const now = Date.now();
    if (now - windowStart > 100) {
      windowStart = now;
      writes = 0;
    }
    if (++writes > 8) {
      blocked = true;
      observer?.disconnect();
      restore();
      console.warn(
        "[dsh-brand-studio] Title customization stopped: another title writer may be active.",
      );
      return;
    }
    written = next;
    document.title = next;
  };
  const synchronize = () => {
    if (!store.getSnapshot().customizeTitle) {
      observer?.disconnect();
      observer = null;
      restore();
      blocked = false;
      return;
    }
    if (!observer && !blocked) {
      observer = new MutationObserver(() => {
        if (document.title !== written) update();
      });
      observer.observe(document.head, { childList: true, characterData: true, subtree: true });
    }
    update();
  };
  const unsubscribe = store.subscribe(synchronize);
  synchronize();
  return () => {
    unsubscribe();
    observer?.disconnect();
    restore();
  };
}
