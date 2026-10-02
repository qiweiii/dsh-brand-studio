const CSS = `
.dbs-mark { object-fit: contain; flex-shrink: 0; }
.dbs-name { display: inline-flex; align-items: center; gap: 8px; max-width: 100%; min-width: 0; height: 24px; overflow: hidden; }
.dbs-name-text { font-weight: 600; font-size: 16px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.dbs-wordmark { max-width: 135px; max-height: 24px; object-fit: contain; }
.dbs-official-name { position: relative; display: inline-block; width: 96px; height: 24px; flex-shrink: 0; overflow: hidden; }
.dbs-official-name svg, .dbs-official-badge svg { width: 156px; height: 24px; flex-shrink: 0; }
.dbs-official-name svg { position: absolute; left: 0; top: 0; max-width: none; }
.dbs-official-badge { position: relative; display: inline-block; width: 52px; height: 14px; border-radius: 3px; corner-shape: round; flex-shrink: 0; overflow: hidden; transform: translateY(.5px); }
.dbs-official-badge svg { position: absolute; left: -103.348px; top: -5.5px; max-width: none; }
.dbs-badge { display: inline-flex; align-items: center; height: 14px; box-sizing: border-box; padding: 0 3.5px; border-radius: 3px; corner-shape: round; font-family: var(--dsw-font-family, sans-serif); font-size: 10px; font-weight: 600; line-height: 14px; letter-spacing: 0; background: var(--dsw-alias-label-primary, #222); color: var(--dsw-alias-label-primary-inverted, #fff); white-space: nowrap; max-width: 100px; overflow: hidden; text-overflow: ellipsis; transform: translateY(.5px); }
.dbs-panel { color: var(--dsw-alias-label-primary); width: 100%; max-width: 640px; display: flex; flex-direction: column; gap: 24px; font-size: 13px; line-height: 20px; }
.dbs-panel h2, .dbs-panel h3, .dbs-panel p { margin: 0; }
.dbs-panel h2 { font-size: 18px; font-weight: 500; line-height: 26px; }
.dbs-panel h3 { font-size: 14px; font-weight: 500; }
.dbs-group { display: flex; flex-direction: column; gap: 12px; }
.dbs-group + .dbs-group { padding-top: 20px; border-top: .5px solid var(--dsw-alias-border-l3); }
.dbs-muted { color: var(--dsw-alias-label-tertiary); font-size: 12px; line-height: 18px; }
.dbs-preview { display: flex; align-items: center; gap: 8px; min-height: 32px; }
.dbs-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.dbs-row { display: flex; align-items: center; gap: 8px; }
.dbs-row > span { min-width: 0; flex: 1; }
.dbs-row > button { flex-shrink: 0; }
.dbs-upload { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.dbs-upload .dbs-muted { flex-basis: 100%; }
.dbs-image-preview { width: 40px; height: 40px; object-fit: contain; border-radius: var(--dsw-radius-sm); }
.dbs-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
.dbs-field output { color: var(--dsw-alias-label-tertiary); margin-left: 6px; font-variant-numeric: tabular-nums; }
.dbs-field input[type=range] { width: 100%; margin: 0; accent-color: var(--dsw-alias-brand-primary); }
.dbs-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.dbs-panel [role=alert] { color: var(--dsw-alias-state-error-primary); }
@media (max-width: 440px) { .dbs-grid { grid-template-columns: 1fr; gap: 12px; } }
`;

export function installStyles(): () => void {
  const tag = document.createElement("style");
  tag.dataset.plugin = "dsh-brand-studio";
  tag.textContent = CSS;
  document.head.append(tag);
  return () => tag.remove();
}
