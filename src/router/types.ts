import type { Child } from "../types";

export type NavigateOptions = {
  replace?: boolean;
  state?: unknown;
};

export type RouterProps = {
  location?: string;
  children: Child;
};

export type RouterState = {
  pathname: string;
  params: Record<string, string>;
  search: string;
  isNavigating: boolean;
};

export type RouteMatch = {
  path: string;
  params: Record<string, string>;
  score: number;
};

export type RoutePattern = string;

export type ParseParams<Path extends string> =
  Path extends `${infer _Start}:${infer Param}/${infer Rest}`
    ? { [K in Param | keyof ParseParams<Rest>]: string }
    : Path extends `${infer _Start}:${infer Param}`
      ? { [K in Param]: string }
      : Record<string, never>;

export type RouteLoader<
  Params extends Record<string, string> = Record<string, string>,
  Data = unknown,
> = (params: Params, query: URLSearchParams) => Promise<Data> | Data;

export type LoaderState<T = unknown> = {
  loading: boolean;
  data: T | null;
  error: Error | null;
};

export type LoaderResult<T = unknown> = LoaderState<T>;

export type RouteGuard<Params extends Record<string, string> = Record<string, string>> = (
  params: Params,
  query: URLSearchParams,
) => Promise<boolean | string> | boolean | string;

export type GuardResult = boolean | string;

export type RouteConfig<Path extends string = string, Data = unknown> = {
  path: Path;
  component: (props: {
    params: ParseParams<Path>;
    loaderState?: LoaderState<Data>;
    outlet?: Child;
  }) => Child;
  loader?: RouteLoader<ParseParams<Path>, Data>;
  guard?: RouteGuard<ParseParams<Path>>;
  children?: RouteConfig[];
};

export type OutletProps = {
  routes?: RouteConfig[];
  parentPath?: string;
  parentParams?: Record<string, string>;
};
