var { defineProperty: L, getOwnPropertyNames: l, getOwnPropertyDescriptor: a } = Object,
  t = Object.prototype.hasOwnProperty;
var S = new WeakMap(),
  e = (z) => {
    var $ = S.get(z),
      J;
    if ($) return $;
    if (
      (($ = L({}, "__esModule", { value: !0 })),
      (z && typeof z === "object") || typeof z === "function")
    )
      l(z).map(
        (F) =>
          !t.call($, F) && L($, F, { get: () => z[F], enumerable: !(J = a(z, F)) || J.enumerable }),
      );
    return S.set(z, $), $;
  };
var $0 = (z, $) => {
  for (var J in $)
    L(z, J, { get: $[J], enumerable: !0, configurable: !0, set: (F) => ($[J] = () => F) });
};
var E0 = {};
$0(E0, {
  tsx: () => B,
  toggleClass: () => _0,
  textFieldControl: () => w0,
  render: () => i,
  radioControl: () => D0,
  onSubmit: () => L0,
  onReset: () => O0,
  onButtonClick: () => I0,
  memo: () => y,
  jsx: () => B,
  html: () => B,
  h: () => R,
  getText: () => P0,
  getSelectValue: () => T0,
  getChecked: () => U0,
  formToObject: () => n,
  effect: () => E,
  destroyNode: () => w,
  delegate: () => B0,
  cx: () => V0,
  createSignalArray: () => k,
  createSignal: () => P,
  computed: () => _,
  checkboxControl: () => A0,
  SelectControl: () => K0,
  Repeat: () => C,
});
module.exports = e(E0);
var h = (z, $, J, F) => {
    var Y;
    $[0] = 0;
    for (var Q = 1; Q < $.length; Q++) {
      var Z = $[Q++],
        M = $[Q] ? (($[0] |= Z ? 1 : 2), J[$[Q++]]) : $[++Q];
      Z === 3
        ? (F[0] = M)
        : Z === 4
          ? (F[1] = Object.assign(F[1] || {}, M))
          : Z === 5
            ? ((F[1] = F[1] || {})[$[++Q]] = M)
            : Z === 6
              ? (F[1][$[++Q]] += M + "")
              : Z
                ? ((Y = z.apply(M, h(z, M, J, ["", null]))),
                  F.push(Y),
                  M[0] ? ($[0] |= 2) : (($[Q - 2] = 0), ($[Q] = Y)))
                : F.push(M);
    }
    return F;
  },
  f = new Map();
function O(z) {
  var $ = f.get(this);
  return (
    $ || (($ = new Map()), f.set(this, $)),
    ($ = h(
      this,
      $.get(z) ||
        ($.set(
          z,
          ($ = ((J) => {
            for (
              var F,
                Y,
                Q = 1,
                Z = "",
                M = "",
                q = [0],
                W = (G) => {
                  Q === 1 && (G || (Z = Z.replace(/^\s*\n\s*|\s*\n\s*$/g, "")))
                    ? q.push(0, G, Z)
                    : Q === 3 && (G || Z)
                      ? (q.push(3, G, Z), (Q = 2))
                      : Q === 2 && Z === "..." && G
                        ? q.push(4, G, 0)
                        : Q === 2 && Z && !G
                          ? q.push(5, 0, !0, Z)
                          : Q >= 5 &&
                            ((Z || (!G && Q === 5)) && (q.push(Q, 0, Z, Y), (Q = 6)),
                            G && (q.push(Q, G, 0, Y), (Q = 6))),
                    (Z = "");
                },
                X = 0;
              X < J.length;
              X++
            ) {
              X && (Q === 1 && W(), W(X));
              for (var H = 0; H < J[X].length; H++)
                (F = J[X][H]),
                  Q === 1
                    ? F === "<"
                      ? (W(), (q = [q]), (Q = 3))
                      : (Z += F)
                    : Q === 4
                      ? Z === "--" && F === ">"
                        ? ((Q = 1), (Z = ""))
                        : (Z = F + Z[0])
                      : M
                        ? F === M
                          ? (M = "")
                          : (Z += F)
                        : F === '"' || F === "'"
                          ? (M = F)
                          : F === ">"
                            ? (W(), (Q = 1))
                            : Q &&
                              (F === "="
                                ? ((Q = 5), (Y = Z), (Z = ""))
                                : F === "/" && (Q < 5 || J[X][H + 1] === ">")
                                  ? (W(),
                                    Q === 3 && (q = q[0]),
                                    (Q = q),
                                    (q = q[0]).push(2, 0, Q),
                                    (Q = 0))
                                  : F === " " ||
                                      F === "\t" ||
                                      F ===
                                        `
` ||
                                      F === "\r"
                                    ? (W(), (Q = 2))
                                    : (Z += F)),
                  Q === 3 && Z === "!--" && ((Q = 4), (q = q[0]));
            }
            return W(), q;
          })(z)),
        ),
        $),
      arguments,
      [],
    )).length > 1
      ? $
      : $[0]
  );
}
var z0 = typeof queueMicrotask === "function" ? queueMicrotask : (z) => Promise.resolve().then(z),
  K = null;
function g(z) {
  for (const $ of z.links.values())
    try {
      $();
    } catch {}
  if ((z.links.clear(), z.cleanupFn)) {
    const $ = z.cleanupFn;
    z.cleanupFn = void 0;
    try {
      $();
    } catch {}
  }
}
function F0(z) {
  const $ = K;
  if (!$ || !$.active || $.links.has(z)) return;
  const J = z.subscribe(() => {
    if ($.active) $.schedule();
  });
  $.links.set(z, J);
}
var I = null;
function u(z) {
  I = z;
}
function P(z) {
  let $ = z,
    J = new Set(),
    F = {
      get: () => {
        return F0(F), $;
      },
      set: (Y) => {
        const Q = typeof Y === "function" ? Y($) : Y;
        if (Object.is(Q, $)) return;
        ($ = Q), J.forEach((Z) => Z($));
      },
      subscribe: (Y) => {
        return J.add(Y), () => J.delete(Y);
      },
    };
  if (Array.isArray(z)) {
    const Y = new WeakMap(),
      Q = new Map(),
      Z = (q) => {
        if (q !== null && typeof q === "object") {
          const X = q;
          if ("id" in X) return X.id;
          if ("key" in X) return X.key;
          const H = q,
            G = Y.get(H);
          if (G !== void 0) return G;
          const j = Symbol("item");
          return Y.set(H, j), j;
        }
        const W = `${typeof q}:${String(q)}`;
        {
          const X = (Q.get(W) ?? 0) + 1;
          if ((Q.set(W, X), X > 1)) console.warn("[slash] map(): duplicated primitive key", q);
        }
        return W;
      },
      M = F;
    return (
      (M.map = (q) => {
        if (!I)
          throw Error(
            "[slash] list renderer not registered — ensure `hyper` is imported before using listSignal.map()",
          );
        const W = F;
        return I(W, Z, (X) => {
          const G = W.get().indexOf(X);
          return q(X, G);
        });
      }),
      M
    );
  }
  return F;
}
function k(z = []) {
  return P(z);
}
function E(z) {
  const $ = {
    active: !0,
    links: new Map(),
    scheduled: !1,
    run: () => {
      ($.scheduled = !1), g($);
      const J = K;
      K = $;
      try {
        const F = z();
        if (typeof F === "function") $.cleanupFn = F;
      } finally {
        K = J;
      }
    },
    schedule: () => {
      if ($.scheduled || !$.active) return;
      ($.scheduled = !0),
        z0(() => {
          if ($.active) $.run();
        });
    },
  };
  return (
    $.run(),
    () => {
      ($.active = !1), g($);
    }
  );
}
function _(z) {
  let $ = P(void 0),
    J = !1,
    F = E(() => {
      const Y = z();
      if (!J || !Object.is($.get(), Y)) $.set(Y), (J = !0);
    });
  return { get: $.get, subscribe: $.subscribe };
}
var y = _;
function v(z) {
  return !!z && typeof z.get === "function" && typeof z.subscribe === "function";
}
function d(z) {
  return z == null ? "" : typeof z === "string" ? z : String(z);
}
var U = new WeakMap();
function T(z, $) {
  const J = U.get(z);
  if (J) J.push($);
  else U.set(z, [$]);
}
function w(z) {
  const $ = U.get(z);
  if ($) {
    for (const J of $)
      try {
        J();
      } catch {}
    U.delete(z);
  }
  if (z instanceof Element && z.hasChildNodes()) z.childNodes.forEach((J) => w(J));
}
function J0(z, $) {
  const J = document.createComment("sig:start"),
    F = document.createComment("sig:end");
  z.appendChild(J), z.appendChild(F);
  const Y = (Z) => {
    let M = J.nextSibling;
    while (M && M !== F) {
      const W = M.nextSibling;
      w(M), z.removeChild(M), (M = W);
    }
    const q = document.createDocumentFragment();
    if (Z == null || Z === !1);
    else if (Array.isArray(Z)) for (const W of Z) V(q, W);
    else if (Z instanceof Node) N(q, Z);
    else q.appendChild(document.createTextNode(d(Z)));
    z.insertBefore(q, F);
  };
  Y($.get());
  const Q = $.subscribe(Y);
  T(J, Q);
}
function N(z, $) {
  if ($.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
    z.appendChild($.cloneNode(!0));
    return;
  }
  if ($.parentNode && $.parentNode !== z) {
    z.appendChild($.cloneNode(!0));
    return;
  }
  z.appendChild($);
}
function V(z, $) {
  if ($ == null || $ === !1) return;
  if (v($)) {
    J0(z, $);
    return;
  }
  if (Array.isArray($)) {
    for (const J of $) V(z, J);
    return;
  }
  if ($ instanceof Node) {
    N(z, $);
    return;
  }
  N(z, document.createTextNode(d($)));
}
function p(z, $) {
  if ($ == null || $ === !1) {
    z.className = "";
    return;
  }
  if (typeof $ === "string") {
    z.className = $;
    return;
  }
  if (Array.isArray($)) {
    z.className = $.filter(Boolean)
      .map((J) => String(J))
      .join(" ");
    return;
  }
  if (typeof $ === "object") {
    const J = Object.entries($)
      .filter(([, F]) => Boolean(F))
      .map(([F]) => F);
    z.className = J.join(" ");
    return;
  }
  z.className = String($);
}
function s(z) {
  return typeof z === "function" || (typeof z === "object" && z !== null && "handleEvent" in z);
}
function Q0(z) {
  return typeof z === "boolean" || (typeof z === "object" && z !== null);
}
function Y0(z) {
  if (!Array.isArray(z)) return !1;
  if (z.length === 0) return !1;
  const $ = z[0];
  if (!s($)) return !1;
  const J = z.length > 1 ? z[1] : void 0;
  if (J !== void 0 && !Q0(J)) return !1;
  return !0;
}
function Z0(z) {
  if (s(z)) return { handler: z };
  if (Y0(z)) {
    const $ = z[0],
      J = z.length > 1 ? z[1] : void 0;
    return { handler: $, options: J };
  }
  return null;
}
function q0(z, $, J) {
  const F = (Q) => {
    if ($ === "class" || $ === "className") {
      p(z, Q);
      return;
    }
    if ($ === "style" && Q && typeof Q === "object") {
      Object.assign(z.style, Q);
      return;
    }
    if ($ === "value") {
      const Z = z,
        M = Q == null ? "" : String(Q);
      if (Z.value !== M) Z.value = M;
      if ("defaultValue" in Z) {
        const q = Z;
        if (q.defaultValue !== M) q.defaultValue = M;
      }
      if (Z instanceof HTMLSelectElement)
        for (const q of Array.from(Z.options)) q.selected = q.value === M;
      return;
    }
    if ($ === "checked") {
      const Z = z,
        M = Boolean(Q);
      if (Z.checked !== M) Z.checked = M;
      if (Z.defaultChecked !== M) Z.defaultChecked = M;
      return;
    }
    if ($ in z) {
      if (!Reflect.set(z, $, Q))
        if (Q == null || Q === !1) z.removeAttribute($);
        else z.setAttribute($, String(Q));
    } else if (Q == null || Q === !1) z.removeAttribute($);
    else z.setAttribute($, String(Q));
  };
  F(J.get());
  const Y = J.subscribe(F);
  T(z, Y);
}
function M0(z, $, J) {
  if ($ === "children") return;
  if (v(J)) {
    q0(z, $, J);
    return;
  }
  if ($.startsWith("on") && $[2] === $[2]?.toUpperCase()) {
    const F = $.slice(2).toLowerCase(),
      Y = Z0(J);
    if (Y)
      z.addEventListener(F, Y.handler, Y.options),
        T(z, () => z.removeEventListener(F, Y.handler, Y.options));
    return;
  }
  if ($ === "style" && J && typeof J === "object") {
    Object.assign(z.style, J);
    return;
  }
  if ($ === "class" || $ === "className") {
    p(z, J);
    return;
  }
  if ($ === "value") {
    const F = z,
      Y = J == null ? "" : String(J);
    if (F.value !== Y) F.value = Y;
    if ("defaultValue" in F) {
      const Q = F;
      if (Q.defaultValue !== Y) Q.defaultValue = Y;
    }
    if (F instanceof HTMLSelectElement)
      for (const Q of Array.from(F.options)) Q.selected = Q.value === Y;
    return;
  }
  if ($ === "checked") {
    const F = z,
      Y = Boolean(J);
    if (F.checked !== Y) F.checked = Y;
    if (F.defaultChecked !== Y) F.defaultChecked = Y;
    return;
  }
  if ($ in z) {
    if (!Reflect.set(z, $, J))
      if (J == null || J === !1) z.removeAttribute($);
      else z.setAttribute($, String(J));
  } else if (J == null || J === !1) z.removeAttribute($);
  else z.setAttribute($, String(J));
}
var W0 = "http://www.w3.org/2000/svg",
  X0 = new Set([
    "svg",
    "path",
    "g",
    "circle",
    "rect",
    "line",
    "polyline",
    "polygon",
    "ellipse",
    "defs",
    "use",
    "clipPath",
    "mask",
    "pattern",
    "text",
  ]);
function R(z, $, ...J) {
  if (typeof z === "function") {
    const Q = z({ ...($ || {}), children: J });
    if (Q instanceof Node) return Q;
    const Z = document.createDocumentFragment();
    return V(Z, Q), Z;
  }
  const F = String(z || "div"),
    Y = X0.has(F) ? document.createElementNS(W0, F) : document.createElement(F);
  if ($) for (const [Q, Z] of Object.entries($)) M0(Y, Q, Z);
  for (const Q of J) V(Y, Q);
  return Y;
}
var B = O.bind(R),
  m = typeof process < "u" && process?.env?.NODE_ENV !== "production";
function x() {
  try {
    const z = Error()
      .stack?.split(`
`)
      .slice(3);
    if (!z?.length) return;
    const $ = z.find((F) => /\.(ts|tsx|js)/.test(F));
    if (!$) return;
    const J = $.match(/at\s+(?:.*\()?([^():]+):(\d+):\d+\)?/);
    if (!J) return;
    return `${J[1]}:${J[2]}`;
  } catch {
    return;
  }
}
function G0(z) {
  if (typeof z === "string") {
    const F = document.querySelector(z);
    if (!F) {
      const Y = m ? x() : void 0,
        Q = Y ? ` (called from ${Y})` : "";
      throw Error(
        `[slash] render(): selector "${z}" not found — ensure the element exists before calling render()${Q}`,
      );
    }
    return F;
  }
  if (z instanceof Element) return z;
  const $ = m ? x() : void 0,
    J = $ ? ` (called from ${$})` : "";
  throw Error(`[slash] render(): container Element is required (received null/undefined)${J}`);
}
function i(z, $) {
  const J = G0($),
    F = Array.from(J.childNodes);
  for (const M of F) w(M);
  J.textContent = "";
  const Y = typeof z === "function" ? z() : z,
    Q = Array.isArray(Y) ? Y : [Y];
  for (const M of Q) V(J, M);
  const Z = Array.from(J.childNodes);
  return Z.length === 1 ? Z[0] : Z;
}
function H0(z, $) {
  const J = z.parentNode;
  if (!J) return;
  let F = z;
  while (F) {
    const Y = F.nextSibling;
    if ((w(F), J.removeChild(F), F === $)) break;
    F = Y;
  }
}
function j0(z, $, J) {
  const F = z.parentNode;
  if (!F) return;
  let Y = document.createDocumentFragment(),
    Q = z;
  while (Q) {
    const Z = Q.nextSibling;
    if ((Y.appendChild(Q), Q === $)) break;
    Q = Z;
  }
  F.insertBefore(Y, J);
}
function c(z, $, J, F) {
  const Y = document.createComment("repeat:start"),
    Q = document.createComment("repeat:end"),
    Z = document.createDocumentFragment();
  Z.appendChild(Y);
  const M = J(F);
  return V(Z, M), Z.appendChild(Q), z.insertBefore(Z, $), { start: Y, end: Q };
}
function C(z, $, J) {
  const F = document.createTextNode(""),
    Y = new Map();
  function Q(q) {
    let { parentNode: W, nextSibling: X } = F;
    for (const H of q) {
      const G = $(H),
        j = c(W, X, J, H);
      Y.set(G, j), (X = j.end.nextSibling);
    }
  }
  function Z(q) {
    let W = F.parentNode,
      X = new Set(),
      H = F;
    for (const G of q) {
      const j = $(G);
      X.add(j);
      const A = Y.get(j);
      if (!A) {
        const D = c(W, H.nextSibling, J, G);
        Y.set(j, D), (H = D.end);
      } else {
        const D = H.nextSibling;
        if (A.start !== D) j0(A.start, A.end, D);
        H = A.end;
      }
    }
    for (const [G, j] of Y) if (!X.has(G)) H0(j.start, j.end), Y.delete(G);
  }
  queueMicrotask(() => Q(z.get()));
  const M = z.subscribe((q) => Z(q));
  return T(F, M), F;
}
u((z, $, J) => C(z, $, J));
function o(z) {
  return !!z && typeof z.get === "function" && typeof z.subscribe === "function";
}
function _0(z, $) {
  if (typeof $ === "boolean") return { [z]: $ };
  return _(() => ({ [z]: !!$.get() }));
}
function V0(...z) {
  const $ = r(z),
    J = $.some((Y) => o(Y)),
    F = () => b($);
  return J ? _(F) : F();
}
function r(z, $ = []) {
  for (const J of z)
    if (Array.isArray(J)) r(J, $);
    else $.push(J);
  return $;
}
function b(z) {
  const $ = [];
  for (const J of z) {
    if (!J) continue;
    if (o(J)) {
      const F = J.get();
      if (typeof F === "string") {
        $.push(F);
        continue;
      }
      if (Array.isArray(F)) {
        $.push(b(F));
        continue;
      }
      if (F && typeof F === "object") {
        for (const [Y, Q] of Object.entries(F)) if (Q) $.push(Y);
        continue;
      }
      continue;
    }
    if (typeof J === "string") {
      $.push(J);
      continue;
    }
    if (Array.isArray(J)) {
      $.push(b(J));
      continue;
    }
    if (typeof J === "object") {
      for (const [F, Y] of Object.entries(J)) if (Y) $.push(F);
    }
  }
  return $.filter(Boolean).join(" ");
}
function w0(z, $ = "input") {
  const J = { value: z };
  if ($ === "input" || $ === "both") J.onInput = (F) => z.set(F.target.value);
  if ($ === "change" || $ === "both") J.onChange = (F) => z.set(F.target.value);
  return J;
}
function A0(z) {
  return {
    checked: z,
    onChange: ($) => {
      z.set($.target.checked);
    },
  };
}
function D0(z, $) {
  return {
    checked: _(() => z.get() === $),
    onChange: (J) => {
      if (J.target.checked) z.set($);
    },
    value: $,
  };
}
function K0(z) {
  return {
    value: z,
    onChange: ($) => {
      z.set($.target.value);
    },
    onInput: ($) => {
      z.set($.target.value);
    },
  };
}
var P0 = (z) => z.target.value,
  U0 = (z) => z.target.checked,
  T0 = (z) => z.target.value;
function B0(z, $, J, F, Y) {
  const Q = (Z) => {
    const M = Z.target;
    if (!M) return;
    const q = M.closest(J);
    if (!q || !z.contains(q)) return;
    const W = Object.assign(Object.create(Object.getPrototypeOf(Z)), Z, {
      target: q,
      currentTarget: q,
    });
    F(W);
  };
  return z.addEventListener($, Q, Y), () => z.removeEventListener($, Q, Y);
}
function n(z) {
  const $ = new FormData(z),
    J = {};
  return (
    $.forEach((F, Y) => {
      const Q = J[Y];
      if (Q === void 0) J[Y] = F;
      else if (Array.isArray(Q)) Q.push(F);
      else J[Y] = [Q, F];
    }),
    J
  );
}
function L0(z) {
  return ($) => {
    $.preventDefault(), z(n($.currentTarget), $);
  };
}
function O0(z) {
  return ($) => z($);
}
function I0(z) {
  return ($) => z($);
}

//# debugId=A5C5F2DFF16427ED64756E2164756E21
//# sourceMappingURL=index.cjs.map
