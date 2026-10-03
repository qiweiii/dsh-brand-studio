import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const REPOSITORY = "qiweiii/dsh-brand-studio";
const REGISTRY = "https://registry.npmjs.org/";
const DIRECTORY = ".local/release";
const METADATA = join(DIRECTORY, "metadata.json");
const FILES = [
  "package.json",
  "cordis.patch.yml",
  "README.md",
  "README.zh-CN.md",
  "lib/index.js",
  "lib/client.js",
  "lib/client.js.map",
];

export function releaseVersion(base, channel, number, confirmation) {
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(base)) {
    throw new Error("package.json must contain a stable x.y.z version.");
  }
  if (channel === "stable") {
    if (confirmation !== base) throw new Error("Confirm the exact package.json version.");
    return base;
  }
  if (channel !== "beta" || !/^(0|[1-9]\d*)$/.test(String(number))) {
    throw new Error("Choose beta with a non-negative integer release number, or stable.");
  }
  return `${base}-beta.${number}`;
}

export function checkPackageFiles(files) {
  const paths = files.map((file) => file.path).sort();
  if (JSON.stringify(paths) !== JSON.stringify([...FILES].sort())) {
    throw new Error(`Unexpected package contents: ${paths.join(", ")}`);
  }
}

function command(binary, args, allowFailure = false) {
  const result = spawnSync(binary, args, { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0 && !allowFailure) {
    throw new Error(`${binary} failed: ${result.stderr || result.stdout}`);
  }
  return result;
}

function integrity(path) {
  return `sha512-${createHash("sha512").update(readFileSync(path)).digest("base64")}`;
}

function readMetadata() {
  const metadata = JSON.parse(readFileSync(METADATA, "utf8"));
  if (metadata.name !== "dsh-brand-studio" || integrity(metadata.tarball) !== metadata.integrity) {
    throw new Error("Release tarball changed after preparation.");
  }
  return metadata;
}

function prepare() {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  if (
    pkg.name !== "dsh-brand-studio" ||
    pkg.repository?.url !== `git+https://github.com/${REPOSITORY}.git`
  ) {
    throw new Error("Package identity does not match the publishing repository.");
  }
  const channel = process.env.RELEASE_CHANNEL;
  const version = releaseVersion(
    pkg.version,
    channel,
    process.env.RELEASE_NUMBER,
    process.env.EXPECTED_VERSION,
  );
  const source = process.env.GITHUB_SHA ?? command("git", ["rev-parse", "HEAD"]).stdout.trim();
  if (!/^[a-f0-9]{40}$/.test(source)) throw new Error("Invalid source commit.");
  mkdirSync(DIRECTORY, { recursive: true });
  const original = readFileSync("package.json", "utf8");
  try {
    pkg.version = version;
    delete pkg.private;
    writeFileSync("package.json", `${JSON.stringify(pkg, null, 2)}\n`);
    const [packed] = JSON.parse(
      command("npm", ["pack", "--json", "--ignore-scripts", "--pack-destination", DIRECTORY]).stdout,
    );
    checkPackageFiles(packed.files);
    const tarball = join(DIRECTORY, packed.filename);
    const metadata = {
      name: pkg.name,
      version,
      channel,
      tag: channel === "beta" ? "beta" : "latest",
      source,
      tarball,
      integrity: integrity(tarball),
    };
    writeFileSync(METADATA, `${JSON.stringify(metadata, null, 2)}\n`);
    console.log(`Prepared ${pkg.name}@${version}: ${tarball}`);
  } finally {
    writeFileSync("package.json", original);
  }
}

function publish() {
  const metadata = readMetadata();
  const [major, minor, patch] = command("npm", ["--version"]).stdout.trim().split(".").map(Number);
  const supported = major > 11 || (major === 11 && (minor > 5 || (minor === 5 && patch >= 1)));
  if (!supported) {
    throw new Error("Trusted publishing needs npm 11.5.1 or newer.");
  }
  const existing = command(
    "npm",
    [
      "view",
      `${metadata.name}@${metadata.version}`,
      "dist.integrity",
      "--json",
      "--registry",
      REGISTRY,
    ],
    true,
  );
  if (existing.status === 0) {
    if (JSON.parse(existing.stdout) !== metadata.integrity) {
      throw new Error("This npm version already contains a different tarball; choose a new version.");
    }
    console.log("Identical npm version already published; continuing the release.");
    return;
  }
  let error;
  try {
    error = JSON.parse(existing.stdout).error;
  } catch {
    // Report non-JSON failures below.
  }
  if (error?.code !== "E404") {
    throw new Error(existing.stderr || existing.stdout || "Could not check the npm version.");
  }
  const result = command("npm", [
    "publish",
    metadata.tarball,
    "--tag",
    metadata.tag,
    "--access",
    "public",
    "--ignore-scripts",
    "--registry",
    REGISTRY,
  ]);
  console.log(result.stdout);
}

function github() {
  const metadata = readMetadata();
  const tag = `v${metadata.version}`;
  const existing = command("gh", ["api", `repos/${REPOSITORY}/releases/tags/${tag}`], true);
  if (existing.status === 0) {
    const release = JSON.parse(existing.stdout);
    if (
      release.target_commitish !== metadata.source ||
      release.prerelease !== (metadata.channel === "beta")
    ) {
      throw new Error("Existing GitHub release does not match this source and channel.");
    }
    command("gh", ["release", "upload", tag, metadata.tarball, "--repo", REPOSITORY, "--clobber"]);
    console.log(`Completed existing GitHub release ${tag}.`);
    return;
  }
  if (!existing.stderr.includes("HTTP 404")) throw new Error(existing.stderr || existing.stdout);
  // --target does not move an existing tag; reject a tag pointing at different code.
  const tagRef = command("gh", ["api", `repos/${REPOSITORY}/git/ref/tags/${tag}`], true);
  if (tagRef.status === 0) {
    let object = JSON.parse(tagRef.stdout).object;
    for (let depth = 0; object.type === "tag" && depth < 5; depth++) {
      object = JSON.parse(
        command("gh", ["api", `repos/${REPOSITORY}/git/tags/${object.sha}`]).stdout,
      ).object;
    }
    if (object.type !== "commit" || object.sha !== metadata.source) {
      throw new Error("Existing GitHub tag points at different source code.");
    }
  } else if (!tagRef.stderr.includes("HTTP 404")) {
    throw new Error(tagRef.stderr || tagRef.stdout);
  }
  const args = [
    "release",
    "create",
    tag,
    metadata.tarball,
    "--repo",
    REPOSITORY,
    "--target",
    metadata.source,
    "--title",
    tag,
    "--generate-notes",
  ];
  args.push(...(metadata.channel === "beta" ? ["--prerelease", "--latest=false"] : ["--latest"]));
  console.log(command("gh", args).stdout);
}

function main() {
  if (process.env.GITHUB_REPOSITORY && process.env.GITHUB_REPOSITORY !== REPOSITORY) {
    throw new Error("Publishing from a different repository is disabled.");
  }
  const action = process.argv[2];
  if (action === "prepare") prepare();
  else if (action === "publish") publish();
  else if (action === "github") github();
  else throw new Error("Usage: node scripts/release.mjs prepare|publish|github");
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
