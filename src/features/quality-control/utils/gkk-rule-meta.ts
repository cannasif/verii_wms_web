export interface GkkRuleMeta {
  projectCode?: string;
  samplingPercent?: number | null;
}

const META_START = '[GKK_META]';
const META_END = '[/GKK_META]';

export function parseGkkRuleDescription(description?: string | null): {
  text: string;
  meta: GkkRuleMeta;
} {
  const raw = description ?? '';
  const start = raw.indexOf(META_START);
  const end = raw.indexOf(META_END);

  if (start < 0 || end < 0 || end <= start) {
    return { text: raw, meta: {} };
  }

  const jsonPart = raw.slice(start + META_START.length, end).trim();
  const text = `${raw.slice(0, start)}${raw.slice(end + META_END.length)}`.trim();

  try {
    const parsed = JSON.parse(jsonPart) as GkkRuleMeta;
    return {
      text,
      meta: {
        projectCode: typeof parsed.projectCode === 'string' ? parsed.projectCode : '',
        samplingPercent:
          typeof parsed.samplingPercent === 'number' && Number.isFinite(parsed.samplingPercent)
            ? parsed.samplingPercent
            : null,
      },
    };
  } catch {
    return { text: raw, meta: {} };
  }
}

export function buildGkkRuleDescription(text: string, meta: GkkRuleMeta): string {
  const payload: GkkRuleMeta = {
    projectCode: meta.projectCode?.trim() || undefined,
    samplingPercent:
      meta.samplingPercent !== null && meta.samplingPercent !== undefined && Number.isFinite(meta.samplingPercent)
        ? meta.samplingPercent
        : undefined,
  };

  const hasMeta = Boolean(payload.projectCode || payload.samplingPercent !== undefined);
  const cleanText = text.trim();

  if (!hasMeta) {
    return cleanText;
  }

  return `${META_START}${JSON.stringify(payload)}${META_END}${cleanText ? `\n${cleanText}` : ''}`;
}
