/**
 * Route Transition System
 *
 * Provides CSS-based transitions for route changes.
 * Client-only (noop on server).
 *
 * Features:
 * - Enter/exit animations via CSS classes
 * - Configurable duration
 * - Automatic cleanup
 * - Promise-based API
 */

import type { Child } from "../types";

/**
 * Transition configuration
 */
export interface Transition {
  /**
   * CSS class applied on enter (default: "route-enter")
   */
  enterClass?: string;

  /**
   * CSS class applied on exit (default: "route-exit")
   */
  exitClass?: string;

  /**
   * Duration in milliseconds (default: 300)
   */
  duration?: number;
}

/**
 * Default transition config
 */
const DEFAULT_TRANSITION: Required<Transition> = {
  enterClass: "route-enter",
  exitClass: "route-exit",
  duration: 300,
};

/**
 * Detect server-side rendering
 * For transitions, we want them to work in tests (which have DOM via HappyDOM)
 * So we only check if window exists (not if we're in Bun test)
 */
const IS_SSR = typeof window === "undefined";

/**
 * Apply enter transition to an element
 *
 * @param element - DOM element to animate
 * @param transition - Transition configuration
 * @returns Promise that resolves when animation completes
 *
 * @example
 * ```ts
 * const element = document.querySelector('.route');
 * await applyEnterTransition(element, { enterClass: 'fade-in', duration: 500 });
 * ```
 */
export async function applyEnterTransition(
  element: Element,
  transition?: Transition,
): Promise<void> {
  // Noop on server
  if (IS_SSR) return;

  const config = { ...DEFAULT_TRANSITION, ...transition };

  // Add enter class
  element.classList.add(config.enterClass);

  // Wait for animation to complete
  await new Promise((resolve) => setTimeout(resolve, config.duration));

  // Remove enter class
  element.classList.remove(config.enterClass);
}

/**
 * Apply exit transition to an element
 *
 * @param element - DOM element to animate
 * @param transition - Transition configuration
 * @returns Promise that resolves when animation completes
 *
 * @example
 * ```ts
 * const element = document.querySelector('.route');
 * await applyExitTransition(element, { exitClass: 'fade-out', duration: 500 });
 * ```
 */
export async function applyExitTransition(
  element: Element,
  transition?: Transition,
): Promise<void> {
  // Noop on server
  if (IS_SSR) return;

  const config = { ...DEFAULT_TRANSITION, ...transition };

  // Add exit class
  element.classList.add(config.exitClass);

  // Wait for animation to complete
  await new Promise((resolve) => setTimeout(resolve, config.duration));

  // Remove exit class
  element.classList.remove(config.exitClass);
}

/**
 * Transition wrapper component
 * Automatically applies enter transition when rendered
 *
 * @param props - Component props
 * @returns Child with transition applied
 *
 * @example
 * ```tsx
 * <${Transition} config=${{ enterClass: 'fade-in', duration: 500 }}>
 *   ${() => html`<div>Content</div>`}
 * </${Transition}>
 * ```
 */
export interface TransitionProps {
  /**
   * Transition configuration
   */
  config?: Transition;

  /**
   * Child component to render
   */
  children: () => Child;
}

/**
 * Transition wrapper component (currently a passthrough)
 * Route component handles the actual transition logic
 */
export function Transition(props: TransitionProps): Child {
  // Simply render children
  // Actual transition is handled by Route component
  return props.children();
}
