import type { Context } from "@deepseek-ai/cordis";
import type {} from "@deepseek-ai/dsh-client-locale/client";
import type {} from "@deepseek-ai/dsh-client-ui-renderer/client";
import type {} from "@deepseek-ai/dsh-client-ui-settings/client";
import type {} from "@deepseek-ai/dsh-client-ui-sidebar/client";
import { BrandMark, BrandName } from "./Brand.tsx";
import { BrandingPanel } from "./BrandingPanel.tsx";
import { en, NS, zh } from "./locales.ts";
import { browserStorage, STORAGE_KEY } from "./settings.ts";
import { BrandStore } from "./store.ts";
import { installStyles } from "./styles.ts";
import { installTitle } from "./title.ts";

export const inject = ["slots", "locale"];

export function apply(ctx: Context): void {
  const storage = browserStorage();
  const store = new BrandStore(storage);
  const face = () => ({ hooks: { settings: store } });
  ctx.effect(installStyles, "brand-studio: styles");
  ctx.effect(() => ctx.locale.register(NS, { en, zh }), "brand-studio: locale");
  ctx.effect(() => {
    const listener = (event: StorageEvent) => {
      if (event.storageArea === storage && (event.key === STORAGE_KEY || event.key === null))
        store.acceptExternal(event.key === null ? null : event.newValue);
    };
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  }, "brand-studio: storage");
  ctx.effect(() => installTitle(store), "brand-studio: title");

  for (const slot of ["sidebar.brand.mark", "conversation.hero.brand.mark"] as const)
    ctx.slots.inject(slot, () => {
      let release: (() => void) | undefined;
      const sync = () => {
        if (store.getSnapshot().logo !== null) {
          if (!release) {
            try {
              release = ctx.slots.register({ name: slot, priority: -10, inject: face }, BrandMark);
            } catch (error) {
              console.warn(
                "[dsh-brand-studio] Cannot replace the logo slot; check for a conflicting branding plugin.",
                error,
              );
            }
          }
        } else {
          release?.();
          release = undefined;
        }
      };
      sync();
      const unsubscribe = store.subscribe(sync);
      return () => {
        unsubscribe();
        release?.();
      };
    });
  ctx.slots.inject("sidebar.brand.name", () => {
    let release: (() => void) | undefined;
    const sync = () => {
      const settings = store.getSnapshot();
      if (
        settings.name !== null ||
        settings.badge !== null ||
        (settings.nameMode === "image" && settings.wordmark !== null)
      ) {
        if (!release) {
          try {
            release = ctx.slots.register(
              { name: "sidebar.brand.name", priority: -10, inject: face },
              BrandName,
            );
          } catch (error) {
            console.warn(
              "[dsh-brand-studio] Cannot replace the name slot; check for a conflicting branding plugin.",
              error,
            );
          }
        }
      } else {
        release?.();
        release = undefined;
      }
    };
    sync();
    const unsubscribe = store.subscribe(sync);
    return () => {
      unsubscribe();
      release?.();
    };
  });
  ctx.slots.inject("settings.section", () =>
    ctx.slots.register(
      {
        name: "settings.section",
        id: "dsh-brand-studio",
        order: 1000,
        label: () => ctx.locale.bind(NS)("nav"),
        locale: NS,
        inject: () => ({
          ...face(),
          save: (settings: import("./settings.ts").BrandSettings) => store.commit(settings),
        }),
      },
      BrandingPanel,
    ),
  );
}
