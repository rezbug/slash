import type { RouteMatch } from "./types";

/**
 * Converte um padrão de rota em uma regex
 * Exemplos:
 * - "/users/:id" -> /^\/users\/([^/]+)$/
 * - "/posts/:slug?" -> /^\/posts(?:\/([^/]+))?$/
 * - "/files/*" -> /^\/files\/(.*)$/
 */
function patternToRegex(pattern: string): { regex: RegExp; paramNames: string[] } {
  const paramNames: string[] = [];

  // Escapar caracteres especiais (exceto :, *, ?)
  let regexStr = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");

  // Substituir :param? por grupo de captura opcional
  // Match /segment/:param? -> /segment(?:/([^/]+))?
  regexStr = regexStr.replace(/\/:(\w+)\?/g, (_, name) => {
    paramNames.push(name);
    return "(?:\\/([^/]+))?";
  });

  // Substituir :param por grupo de captura obrigatório
  regexStr = regexStr.replace(/:(\w+)/g, (_, name) => {
    paramNames.push(name);
    return "([^/]+)";
  });

  // Substituir * por grupo de captura wildcard
  regexStr = regexStr.replace(/\*/g, () => {
    paramNames.push("*");
    return "(.*)";
  });

  const regex = new RegExp(`^${regexStr}$`);

  return { regex, paramNames };
}

/**
 * Calcula a pontuação de uma rota para priorização
 * Rotas mais específicas têm pontuação maior
 */
function calculateScore(pattern: string): number {
  let score = 0;

  // Segmentos estáticos valem mais
  const segments = pattern.split("/");
  for (const segment of segments) {
    if (segment && !segment.startsWith(":") && segment !== "*") {
      score += 4;
    } else if (segment.startsWith(":") && !segment.endsWith("?")) {
      score += 2;
    } else if (segment.startsWith(":") && segment.endsWith("?")) {
      score += 1;
    }
  }

  return score;
}

/**
 * Tenta fazer match de um pathname com um padrão de rota
 */
export function matchRoute(pattern: string, pathname: string): RouteMatch | null {
  const { regex, paramNames } = patternToRegex(pattern);
  const match = pathname.match(regex);

  if (!match) {
    return null;
  }

  const params: Record<string, string> = {};

  // Extrair parâmetros dos grupos de captura
  for (let i = 0; i < paramNames.length; i++) {
    const value = match[i + 1];
    if (value !== undefined) {
      const paramName = paramNames[i];
      params[paramName] = decodeURIComponent(value);
    }
  }

  return {
    path: pattern,
    params,
    score: calculateScore(pattern),
  };
}

/**
 * Extrai parâmetros de um pathname dado um padrão
 */
export function parseParams(pattern: string, pathname: string): Record<string, string> | null {
  const match = matchRoute(pattern, pathname);
  return match ? match.params : null;
}

/**
 * Parseia query string
 */
export function parseQuery(search: string): URLSearchParams {
  // Remove o '?' inicial se presente
  const cleanSearch = search.startsWith("?") ? search.slice(1) : search;
  return new URLSearchParams(cleanSearch);
}

/**
 * Serializa objeto para query string
 */
export function stringifyQuery(params: Record<string, string | number | boolean>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    searchParams.set(key, String(value));
  }

  const str = searchParams.toString();
  return str ? `?${str}` : "";
}

/**
 * Ordena rotas por especificidade (score)
 */
export function rankRoutes(routes: RouteMatch[]): RouteMatch[] {
  return [...routes].sort((a, b) => b.score - a.score);
}
