export const PARAMETER_QUERY_KEYS = {
  ALL: 'parameters',
  LIST: (type: string) => `parameters.${type}.list`,
  DETAIL: (type: string, id: number) => `parameters.${type}.detail.${id}`,
} as const;

