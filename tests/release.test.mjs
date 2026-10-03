import assert from "node:assert/strict";
import test from "node:test";
import { checkPackageFiles, releaseVersion } from "../scripts/release.mjs";

test("beta versions cannot update the stable channel or accept injected version text", () => {
  assert.equal(releaseVersion("0.0.1", "beta", "12"), "0.0.1-beta.12");
  assert.throws(() => releaseVersion("0.0.1", "beta", "12; echo bad"));
  assert.throws(() => releaseVersion("01.0.0", "beta", "12"));
  assert.throws(() => releaseVersion("0.0.1-beta.1", "beta", "12"));
});

test("stable publication requires the exact intended version", () => {
  assert.equal(releaseVersion("0.1.0", "stable", undefined, "0.1.0"), "0.1.0");
  assert.throws(() => releaseVersion("0.1.0", "stable", undefined, "0.2.0"));
  assert.throws(() => releaseVersion("0.1.0", "stable", undefined, undefined));
});

test("the release archive excludes development files and private notes", () => {
  const paths = [
    "package.json",
    "cordis.patch.yml",
    "README.md",
    "README.zh-CN.md",
    "lib/index.js",
    "lib/client.js",
    "lib/client.js.map",
  ];
  checkPackageFiles(paths.map((path) => ({ path })));
  assert.throws(() => checkPackageFiles([...paths, ".env"].map((path) => ({ path }))));
  assert.throws(() => checkPackageFiles(paths.slice(1).map((path) => ({ path }))));
});
