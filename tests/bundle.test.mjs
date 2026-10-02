import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { SlotCore } from "@deepseek-ai/dsh-client-ui-slots";

test("built client preserves official slots, applies branding, and releases its resources", () => {
  const core = new SlotCore();
  const official = () => null;
  const cleanup = [];
  let styleCount = 0;
  let storageListenerCount = 0;
  let stored = null;
  const storage = {
    getItem: () => stored,
    setItem: (_key, value) => {
      stored = value;
    },
  };
  core.register(
    {
      name: "root",
      children: {
        "sidebar.brand.mark": { kind: "single", scope: "root" },
        "sidebar.brand.name": { kind: "single", scope: "root" },
        "conversation.hero.brand.mark": { kind: "single", scope: "root" },
        "settings.section": { kind: "list", scope: "root" },
      },
    },
    official,
  );
  for (const name of ["sidebar.brand.mark", "sidebar.brand.name"])
    core.register({ name }, official);

  let registration;
  const window = {
    localStorage: storage,
    __ModuleLoader__: {
      load: (value) => {
        registration = value;
      },
    },
    addEventListener: () => storageListenerCount++,
    removeEventListener: () => storageListenerCount--,
  };
  const document = {
    title: "DeepSeek Harness",
    head: { append: () => styleCount++ },
    createElement: () => ({ dataset: {}, remove: () => styleCount-- }),
  };
  runInNewContext(readFileSync(new URL("../lib/client.js", import.meta.url), "utf8"), {
    window,
    document,
    console,
    atob,
    MutationObserver: class {
      observe() {}
      disconnect() {}
    },
  });
  assert.equal(registration.id, "dsh-brand-studio");
  const require = createRequire(import.meta.url);
  const client = registration.factory((id) => {
    assert.ok(
      ["react", "react/jsx-runtime", "@deepseek-ai/dsh-client-ui-primitives"].includes(id),
      `Unexpected runtime import: ${id}`,
    );
    // The browser supplies these components; this test exercises registration, not rendering.
    if (id === "@deepseek-ai/dsh-client-ui-primitives") {
      const component = () => null;
      return {
        BrandWordmark: component,
        FishLogo: component,
        Button: component,
        Checkbox: component,
        Input: component,
        SegmentedTabs: component,
      };
    }
    return require(id);
  });
  client.apply({
    effect: (callback) => cleanup.push(callback()),
    locale: { register: () => () => {}, bind: () => (key) => key },
    slots: {
      inject: (_name, callback) => cleanup.push(callback()),
      register: (options, component) => core.register(options, component),
    },
  });
  assert.equal(styleCount, 1);
  assert.equal(storageListenerCount, 1);
  assert.equal(core.entriesOfSlot("sidebar.brand.name")[0].component, official);
  const panel = core.entriesOfSlot("settings.section")[0];
  const { hooks, save } = panel.inject();
  const defaults = hooks.settings.getSnapshot();
  save({ ...defaults, name: "大肥鱼", badge: "" });
  const replacement = core.entriesOfSlot("sidebar.brand.name")[0];
  assert.equal(replacement.options.priority, -10);
  assert.notEqual(replacement.component, official);
  assert.equal(core.entriesOfSlot("sidebar.brand.mark")[0].component, official);
  assert.equal(JSON.parse(stored).name, "大肥鱼");
  save({ ...defaults, name: "DFY" });
  assert.equal(core.entriesOfSlot("sidebar.brand.name")[0], replacement);
  const logo =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aKx8AAAAASUVORK5CYII=";
  save({ ...defaults, logo });
  assert.equal(core.entriesOfSlot("sidebar.brand.mark")[0].options.priority, -10);
  assert.equal(core.entriesOfSlot("conversation.hero.brand.mark")[0].options.priority, -10);
  save(defaults);
  assert.equal(core.entriesOfSlot("conversation.hero.brand.mark").length, 0);
  assert.equal(core.entriesOfSlot("sidebar.brand.mark")[0].component, official);
  assert.equal(core.entriesOfSlot("sidebar.brand.name")[0].component, official);
  save({ ...defaults, name: "DSH" });
  for (const dispose of cleanup.reverse()) dispose?.();
  assert.equal(styleCount, 0);
  assert.equal(storageListenerCount, 0);
  assert.equal(core.entriesOfSlot("settings.section").length, 0);
  assert.equal(core.entriesOfSlot("sidebar.brand.name")[0].component, official);
});
