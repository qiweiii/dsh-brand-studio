import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_SETTINGS, decodeSettings, isStoredImage } from "../src/client/settings.ts";
import { BrandStore } from "../src/client/store.ts";

test("untrusted saved settings cannot introduce URLs, control characters, or unsupported schemas", () => {
  assert.equal(decodeSettings({ ...DEFAULT_SETTINGS, version: 2 }), null);
  assert.equal(decodeSettings({ ...DEFAULT_SETTINGS, name: "bad\nname" }), null);
  assert.equal(decodeSettings({ ...DEFAULT_SETTINGS, logo: "https://example.com/logo.png" }), null);
  assert.equal(isStoredImage("data:image/svg+xml;base64,PHN2Zz4="), false);
  assert.equal(isStoredImage("data:image/png;base64,YWJjZA=="), false);
  assert.equal(
    decodeSettings({ ...DEFAULT_SETTINGS, name: " 大肥鱼 ", badge: "" })?.name,
    "大肥鱼",
  );
});

test("a storage failure retains the prior active settings and emits no change", () => {
  const store = new BrandStore({
    getItem: () => null,
    setItem: () => {
      throw new Error("quota");
    },
  });
  let changes = 0;
  store.subscribe(() => changes++);
  const previous = store.getSnapshot();
  assert.throws(() => store.commit({ ...DEFAULT_SETTINGS, name: "DFY" }), /quota/);
  assert.equal(store.getSnapshot(), previous);
  assert.equal(changes, 0);
});

test("commit, valid external writes, corrupt writes, and storage clear behave consistently", () => {
  let stored = "";
  const store = new BrandStore({
    getItem: () => null,
    setItem: (_key, value) => {
      stored = value;
    },
  });
  store.commit({ ...DEFAULT_SETTINGS, name: "DFY" });
  assert.equal(JSON.parse(stored).name, "DFY");
  store.acceptExternal("not-json");
  assert.equal(store.getSnapshot().name, "DFY");
  store.acceptExternal(JSON.stringify({ ...DEFAULT_SETTINGS, name: "DSH" }));
  assert.equal(store.getSnapshot().name, "DSH");
  store.acceptExternal(null);
  assert.deepEqual(store.getSnapshot(), DEFAULT_SETTINGS);
});

test("malformed startup storage and unavailable storage do not break initialization", () => {
  const store = new BrandStore({ getItem: () => "{bad", setItem: () => {} });
  assert.deepEqual(store.getSnapshot(), DEFAULT_SETTINGS);
  assert.throws(
    () => new BrandStore(null).commit({ ...DEFAULT_SETTINGS, name: "DFY" }),
    /storage-unavailable/,
  );
});

test("older saved settings retain title choice and migrate image mode and logo controls", () => {
  const old = {
    version: 1,
    name: "DFY",
    badge: null,
    logo: null,
    wordmark: null,
    customizeTitle: false,
  };
  const migrated = decodeSettings(old);
  assert.equal(migrated?.customizeTitle, false);
  assert.equal(migrated?.nameMode, "text");
  assert.equal(migrated?.logoSize, 24);
  assert.equal(migrated?.logoRadius, 6);
  assert.equal(DEFAULT_SETTINGS.customizeTitle, true);
  assert.equal(decodeSettings({ ...DEFAULT_SETTINGS, logoSize: 999 }), null);
  assert.equal(decodeSettings({ ...DEFAULT_SETTINGS, logoRadius: -1 }), null);
  assert.equal(decodeSettings({ ...DEFAULT_SETTINGS, nameMode: "unknown" }), null);
});
