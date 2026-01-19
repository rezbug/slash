import { addCleanup } from "../lifecycle/cleanup";
import type { Elementish, Props, Reactive } from "../types";
import { isReactive } from "../utils/guards";
import { processClassValue } from "../utils/helpers";
import { parseEventProp } from "./events";

export function applyClass(element: Element, val: unknown): void {
  if (element instanceof HTMLElement) {
    const className = processClassValue(val);
    if (val == null || val === false) {
      element.className = "";
    } else {
      element.className = className;
    }
  }
}

export function setPropReactive(element: Element, key: string, sig: Reactive<unknown>): void {
  const apply = (val: unknown) => {
    if (key === "class" || key === "className") {
      applyClass(element, val);
      return;
    }

    if (key === "style" && val && typeof val === "object") {
      Object.assign((element as HTMLElement).style, val as Record<string, unknown>);
      return;
    }

    if (key === "value") {
      const ctl = element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      const next = val == null ? "" : String(val);

      if (ctl.value !== next) ctl.value = next;

      if ("defaultValue" in ctl) {
        const t = ctl as HTMLInputElement | HTMLTextAreaElement;
        if (t.defaultValue !== next) t.defaultValue = next;
      }

      if (ctl instanceof HTMLSelectElement) {
        for (const opt of Array.from(ctl.options)) {
          opt.selected = opt.value === next;
        }
      }
      return;
    }

    if (key === "checked") {
      const box = element as HTMLInputElement;
      const next = Boolean(val);
      if (box.checked !== next) box.checked = next;
      if (box.defaultChecked !== next) box.defaultChecked = next;
      return;
    }

    // propriedade direta se existir; senão atributo
    if (key in element) {
      const ok = Reflect.set(element as object, key, val);
      if (!ok) {
        if (val == null || val === false) element.removeAttribute(key);
        else element.setAttribute(key, String(val));
      }
    } else {
      if (val == null || val === false) element.removeAttribute(key);
      else element.setAttribute(key, String(val));
    }
  };

  apply(sig.get());
  const unsub = sig.subscribe(apply);
  addCleanup(element, unsub);
}

export function setProp(element: Elementish, key: string, val: unknown): void {
  if (key === "children") return;

  // 1) Signals primeiro: converte para prop reativo
  if (isReactive(val)) {
    setPropReactive(element, key, val);
    return;
  }

  // 2) Eventos: onClick / onInput / onChange / ...
  if (key.startsWith("on") && key[2] === key[2]?.toUpperCase()) {
    const type = key.slice(2).toLowerCase();
    const parsed = parseEventProp(val);
    if (parsed) {
      element.addEventListener(type, parsed.handler, parsed.options);
      addCleanup(element, () => element.removeEventListener(type, parsed.handler, parsed.options));
    }
    return;
  }

  // 3) Estilo por objeto
  if (key === "style" && val && typeof val === "object") {
    Object.assign((element as HTMLElement).style, val as Record<string, unknown>);
    return;
  }

  // 4) Classes
  if (key === "class" || key === "className") {
    applyClass(element, val);
    return;
  }

  // 5) Inputs/textarea/select controlados (setup inicial mesmo sem signal)
  if (key === "value") {
    const ctl = element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const next = val == null ? "" : String(val);

    if (ctl.value !== next) ctl.value = next;
    if ("defaultValue" in ctl) {
      const t = ctl as HTMLInputElement | HTMLTextAreaElement;
      if (t.defaultValue !== next) t.defaultValue = next;
    }
    if (ctl instanceof HTMLSelectElement) {
      for (const opt of Array.from(ctl.options)) {
        opt.selected = opt.value === next;
      }
    }
    return;
  }

  if (key === "checked") {
    const box = element as HTMLInputElement;
    const next = Boolean(val);
    if (box.checked !== next) box.checked = next;
    if (box.defaultChecked !== next) box.defaultChecked = next;
    return;
  }

  // 6) Propriedade direta ou atributo
  if (key in element) {
    const ok = Reflect.set(element as object, key, val);
    if (!ok) {
      if (val == null || val === false) element.removeAttribute(key);
      else element.setAttribute(key, String(val));
    }
  } else {
    if (val == null || val === false) element.removeAttribute(key);
    else element.setAttribute(key, String(val));
  }
}
