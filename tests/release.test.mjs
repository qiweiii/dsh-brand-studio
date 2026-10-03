import assert from "node:assert/strict";
import test from "node:test";
import { checkPackageFiles, parsePackOutput, releaseVersion } from "../scripts/release.mjs";

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
    "README.en.md",
    "lib/index.js",
    "lib/client.js",
    "lib/client.js.map",
  ];
  checkPackageFiles(paths.map((path) => ({ path })));
  assert.throws(() => checkPackageFiles([...paths, ".env"].map((path) => ({ path }))));
  assert.throws(() => checkPackageFiles(paths.slice(1).map((path) => ({ path }))));
});

test("npm pack output supports older arrays and npm 12 package-keyed objects", () => {
  const packed = {
    name: "dsh-brand-studio",
    version: "0.0.1-beta.0",
    filename: "dsh-brand-studio-0.0.1-beta.0.tgz",
    files: [
      "package.json",
      "cordis.patch.yml",
      "README.md",
      "README.en.md",
      "lib/index.js",
      "lib/client.js",
      "lib/client.js.map",
    ].map((path) => ({ path })),
  };
  const parse = (value) => parsePackOutput(JSON.stringify(value), packed.name, packed.version);
  assert.deepEqual(parse([packed]), packed);
  assert.deepEqual(parse({ [packed.name]: packed }), packed);
  assert.throws(() => parse(null));
  assert.throws(() => parse([]));
  assert.throws(() => parse([packed, packed]));
  assert.throws(() => parse([{ ...packed, version: "0.0.2" }]));
  assert.throws(() => parse([{ ...packed, filename: "../unexpected.tgz" }]));
  assert.throws(() => parse([{ ...packed, files: [...packed.files, { path: ".env" }] }]));
});
