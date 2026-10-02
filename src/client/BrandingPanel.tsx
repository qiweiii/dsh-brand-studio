import {
  Button,
  Checkbox,
  FishLogo,
  Input,
  SegmentedTabs,
} from "@deepseek-ai/dsh-client-ui-primitives";
import type { PropsLocale } from "@deepseek-ai/dsh-client-ui-slots";
import { useEffect, useId, useRef, useState } from "react";
import { BrandLabel, type BrandSourceProps, LogoImage } from "./Brand.tsx";
import { normalizeImage } from "./images.ts";
import type { BrandKey, NS } from "./locales.ts";
import { type BrandSettings, DEFAULT_SETTINGS, equalSettings } from "./settings.ts";

export interface PanelProps extends BrandSourceProps, PropsLocale<typeof NS> {
  save: (settings: BrandSettings) => BrandSettings;
}

export function BrandingPanel({ useSettings, save, t }: PanelProps) {
  const saved = useSettings((settings) => settings);
  const [draft, setDraft] = useState(saved);
  const [error, setError] = useState<BrandKey | null>(null);
  const [message, setMessage] = useState(false);
  const [busy, setBusy] = useState(false);
  const base = useRef(saved);
  const generation = useRef(0);
  const id = useId();
  const logoInput = useRef<HTMLInputElement>(null);
  const wordmarkInput = useRef<HTMLInputElement>(null);
  const dirty = !equalSettings(draft, saved);
  const conflict = saved !== base.current;

  useEffect(
    () => () => {
      generation.current++;
    },
    [],
  );
  const edit = (patch: Partial<BrandSettings>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setError(null);
    setMessage(false);
  };
  const cancel = () => {
    generation.current++;
    base.current = saved;
    setDraft(saved);
    setBusy(false);
    setError(null);
    setMessage(false);
  };
  const choose = async (file: File, key: "logo" | "wordmark") => {
    const ticket = ++generation.current;
    setBusy(true);
    setError(null);
    try {
      const image = await normalizeImage(file);
      if (ticket === generation.current) edit({ [key]: image });
    } catch (reason) {
      if (ticket === generation.current) {
        const code = reason instanceof Error ? reason.message : "image-invalid";
        setError(Object.hasOwn(imageErrors, code) ? (code as BrandKey) : "image-invalid");
      }
    } finally {
      if (ticket === generation.current) setBusy(false);
    }
  };
  const apply = () => {
    try {
      const next = save(draft);
      base.current = next;
      setDraft(next);
      setError(null);
      setMessage(true);
    } catch {
      setError("storageError");
      setMessage(false);
    }
  };
  const imageControl = (key: "logo" | "wordmark") => (
    <div className="dbs-upload">
      {draft[key] && <img className="dbs-image-preview" src={draft[key]} alt={t(key)} />}
      <input
        ref={key === "logo" ? logoInput : wordmarkInput}
        hidden
        type="file"
        accept="image/png,image/jpeg,image/webp"
        disabled={busy}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (file) void choose(file, key);
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => (key === "logo" ? logoInput : wordmarkInput).current?.click()}
      >
        {t("choose")}
      </Button>
      <Button
        type="button"
        size="sm"
        disabled={busy || draft[key] === null}
        onClick={() => edit({ [key]: null })}
      >
        {t("reset")}
      </Button>
      <small className="dbs-muted">{t("imageHint")}</small>
    </div>
  );
  return (
    <section className="dbs-panel" aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`}>{t("nav")}</h2>
      <section className="dbs-group" aria-labelledby={`${id}-preview`}>
        <h3 id={`${id}-preview`}>{t("preview")}</h3>
        <div className="dbs-preview">
          {draft.logo ? <LogoImage settings={draft} size={24} /> : <FishLogo size={24} />}
          <BrandLabel settings={draft} />
        </div>
      </section>
      <section className="dbs-group" aria-labelledby={`${id}-logo`}>
        <h3 id={`${id}-logo`}>{t("logo")}</h3>
        {imageControl("logo")}
        <div className="dbs-grid">
          <label className="dbs-field" htmlFor={`${id}-logo-size`}>
            <span>
              {t("logoSize")} <output>{draft.logoSize} px</output>
            </span>
            <input
              id={`${id}-logo-size`}
              type="range"
              min={18}
              max={24}
              step={1}
              disabled={!draft.logo}
              value={draft.logoSize}
              onChange={(event) => edit({ logoSize: Number(event.currentTarget.value) })}
            />
          </label>
          <label className="dbs-field" htmlFor={`${id}-logo-radius`}>
            <span>
              {t("logoRadius")} <output>{draft.logoRadius} px</output>
            </span>
            <input
              id={`${id}-logo-radius`}
              type="range"
              min={0}
              max={12}
              step={1}
              disabled={!draft.logo}
              value={draft.logoRadius}
              onChange={(event) => edit({ logoRadius: Number(event.currentTarget.value) })}
            />
          </label>
        </div>
      </section>
      <section className="dbs-group" aria-labelledby={`${id}-label`}>
        <h3 id={`${id}-label`}>{t("brandLabel")}</h3>
        <SegmentedTabs
          label={t("nameMode")}
          value={draft.nameMode}
          onChange={(nameMode) => edit({ nameMode })}
          items={[
            {
              value: "text",
              label: t("textMode"),
              id: `${id}-text-tab`,
              panelId: `${id}-text-panel`,
            },
            {
              value: "image",
              label: t("imageMode"),
              id: `${id}-image-tab`,
              panelId: `${id}-image-panel`,
            },
          ]}
        />
        {draft.nameMode === "text" ? (
          <div role="tabpanel" id={`${id}-text-panel`} aria-labelledby={`${id}-text-tab`}>
            <label className="dbs-field" htmlFor={`${id}-name`}>
              <span>{t("name")}</span>
              <Input
                id={`${id}-name`}
                maxLength={64}
                value={draft.name ?? ""}
                placeholder="DeepSeek"
                onChange={(event) =>
                  edit({
                    name: event.currentTarget.value.trim() ? event.currentTarget.value : null,
                  })
                }
              />
            </label>
          </div>
        ) : (
          <div role="tabpanel" id={`${id}-image-panel`} aria-labelledby={`${id}-image-tab`}>
            {imageControl("wordmark")}
          </div>
        )}
        <div className="dbs-field">
          <label htmlFor={`${id}-badge`}>{t("badge")}</label>
          <div className="dbs-row">
            <Input
              id={`${id}-badge`}
              maxLength={24}
              value={draft.badge ?? "HARNESS"}
              onChange={(event) => edit({ badge: event.currentTarget.value })}
            />
            <Button
              type="button"
              size="sm"
              disabled={draft.badge === null}
              onClick={() => edit({ badge: null })}
            >
              {t("reset")}
            </Button>
          </div>
          <small className="dbs-muted">{t("badgeHint")}</small>
        </div>
      </section>
      <section className="dbs-group" aria-labelledby={`${id}-title`}>
        <h3 id={`${id}-title`}>{t("pageTitle")}</h3>
        <Checkbox
          checked={draft.customizeTitle}
          onChange={(customizeTitle) => edit({ customizeTitle })}
          label={t("title")}
        />
      </section>
      {busy && <p role="status">{t("processing")}</p>}
      {conflict && <p role="alert">{t("conflict")}</p>}
      {error && <p role="alert">{t(error)}</p>}
      {message && <p role="status">{t("saved")}</p>}
      <div className="dbs-actions">
        <Button
          variant="primary"
          type="button"
          disabled={!dirty || busy || conflict}
          onClick={apply}
        >
          {t("apply")}
        </Button>
        <Button type="button" onClick={cancel}>
          {t("cancel")}
        </Button>
        <Button type="button" disabled={busy} onClick={() => edit({ ...DEFAULT_SETTINGS })}>
          {t("resetAll")}
        </Button>
      </div>
    </section>
  );
}

const imageErrors = {
  "image-format": true,
  "image-size": true,
  "image-dimensions": true,
  "image-invalid": true,
};
