import type { SnapshotSelectorHook } from "@deepseek-ai/dsh-client-store";
import { BrandWordmark } from "@deepseek-ai/dsh-client-ui-primitives";
import type { BrandSettings } from "./settings.ts";

export interface BrandSourceProps {
  useSettings: SnapshotSelectorHook<BrandSettings>;
}

/** Verified against the DSH 0.2.0-rc.2 conversation package; no runtime import needed. */
declare module "@deepseek-ai/dsh-client-ui-slots" {
  interface SlotMap {
    "conversation.hero.brand.mark": {
      kind: "single";
      scope: "root";
      owner: { size: number; className?: string };
    };
  }
}

export function LogoImage({
  settings,
  size,
  className = "",
}: {
  settings: BrandSettings;
  size: number;
  className?: string;
}) {
  const edge = (size * settings.logoSize) / 24;
  return settings.logo ? (
    <img
      className={`dbs-mark ${className}`}
      src={settings.logo}
      width={edge}
      height={edge}
      style={{ width: edge, height: edge, borderRadius: (size * settings.logoRadius) / 24 }}
      alt={settings.name ?? "Logo"}
      draggable={false}
    />
  ) : null;
}

export function BrandMark({
  size,
  className,
  useSettings,
}: BrandSourceProps & { size: number; className?: string }) {
  return (
    <LogoImage
      settings={useSettings((settings) => settings)}
      size={size}
      {...(className ? { className } : {})}
    />
  );
}

/** Crop the public artwork component, preserving its exact vector typography. */
function OfficialArtwork({ part }: { part: "name" | "badge" }) {
  return (
    <span className={`dbs-official-${part}`}>
      <BrandWordmark includeMark={false} />
    </span>
  );
}

export function BrandLabel({ settings }: { settings: BrandSettings }) {
  const name = settings.name ?? "DeepSeek";
  const badge = settings.badge ?? "HARNESS";
  return (
    <span className="dbs-name">
      {settings.nameMode === "image" && settings.wordmark ? (
        <img className="dbs-wordmark" src={settings.wordmark} alt={name} draggable={false} />
      ) : settings.name === null ? (
        <OfficialArtwork part="name" />
      ) : (
        <span className="dbs-name-text">{name}</span>
      )}
      {badge &&
        (badge === "HARNESS" ? (
          <OfficialArtwork part="badge" />
        ) : (
          <span className="dbs-badge">{badge}</span>
        ))}
    </span>
  );
}

export function BrandName({ useSettings }: BrandSourceProps) {
  return <BrandLabel settings={useSettings((settings) => settings)} />;
}
