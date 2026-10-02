import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_SETTINGS } from "../src/client/settings.ts";
import { BrandStore } from "../src/client/store.ts";
import { brandTitle, installTitle } from "../src/client/title.ts";

test("only the official title or its final product suffix is replaced", () => {
  assert.equal(brandTitle("DeepSeek Harness", "DFY"), "DFY");
  assert.equal(
    brandTitle("DeepSeek Harness notes — DeepSeek Harness", "大肥鱼"),
    "DeepSeek Harness notes — 大肥鱼",
  );
  assert.equal(brandTitle("Another plugin's title", "DFY"), null);
});

test("session changes, brand edits, disable, and disposal retain title ownership", () => {
  const documentDescriptor = Object.getOwnPropertyDescriptor(globalThis, "document");
  const observerDescriptor = Object.getOwnPropertyDescriptor(globalThis, "MutationObserver");
  const doc = { head: {}, title: "First — DeepSeek Harness" };
  let notify = () => {};
  class Observer {
    constructor(callback: () => void) {
      notify = callback;
    }
    observe() {}
    disconnect() {}
  }
  Object.defineProperty(globalThis, "document", { configurable: true, value: doc });
  Object.defineProperty(globalThis, "MutationObserver", { configurable: true, value: Observer });
  let dispose = () => {};
  try {
    const store = new BrandStore({ getItem: () => null, setItem: () => {} });
    dispose = installTitle(store);
    store.commit({ ...DEFAULT_SETTINGS, name: "DFY", customizeTitle: true });
    assert.equal(doc.title, "First — DFY");
    doc.title = "Second — DeepSeek Harness";
    notify();
    assert.equal(doc.title, "Second — DFY");
    store.commit({ ...DEFAULT_SETTINGS, name: "DSH", customizeTitle: true });
    assert.equal(doc.title, "Second — DSH");
    store.commit({ ...DEFAULT_SETTINGS, name: "DSH", customizeTitle: false });
    assert.equal(doc.title, "Second — DeepSeek Harness");
    store.commit({ ...DEFAULT_SETTINGS, name: "DSH", customizeTitle: true });
    doc.title = "Another plugin's title";
    dispose();
    assert.equal(doc.title, "Another plugin's title");
  } finally {
    dispose();
    if (documentDescriptor) Object.defineProperty(globalThis, "document", documentDescriptor);
    else Reflect.deleteProperty(globalThis, "document");
    if (observerDescriptor)
      Object.defineProperty(globalThis, "MutationObserver", observerDescriptor);
    else Reflect.deleteProperty(globalThis, "MutationObserver");
  }
});
