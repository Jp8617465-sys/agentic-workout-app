/**
 * Route reachability.
 *
 * Catches two distinct failures that both present as "the screen exists but users
 * never see it":
 *
 *   UNREACHABLE — a screen is registered in the navigator but nothing anywhere calls
 *   navigate() with its name. The code is finished, tested, and dead.
 *
 *   CROSS-BRANCH — a screen registered only inside a conditional branch of
 *   RootNavigator (the unauthenticated tree, the onboarding tree) is navigated to from
 *   the main authenticated tree. React Navigation cannot resolve that route because it
 *   is not mounted in the active branch, so the call throws or silently no-ops.
 */
import { read, sourceFiles, matchAll, lineOf, finding, RESULT } from "./lib.mjs";

const NAV_FILES = ["src/navigation/RootNavigator.tsx", "src/navigation/TabNavigator.tsx"];

export function collect() {
  const findings = [];
  const registered = new Map(); // name -> "main" | "conditional" | "tab"

  for (const nf of NAV_FILES) {
    const src = read(nf);
    if (!src) continue;

    // Tab screens are reached by tapping a tab, not by a navigate() call, so an absent
    // navigate() target says nothing about them. Classify them separately rather than
    // reporting all five tabs as unreachable every single run — a probe that cries wolf
    // on its own happy path gets ignored, and then it catches nothing.
    const isTabNav = /Tab\.Screen/.test(src);

    // The authenticated tree is wrapped in a fragment: `<> ... </>`. Screens outside it
    // live in a ternary branch (Auth / Onboarding) mounted only when that branch is
    // active.
    const frag = src.match(/<>([\s\S]*?)<\/>/);
    const mainRegion = frag ? frag[1] : src;

    for (const m of src.matchAll(/<(Stack|Tab)\.Screen[\s\S]{0,80}?name="([A-Za-z]+)"/g)) {
      const [, kind, name] = m;
      if (kind === "Tab" || isTabNav) {
        if (!registered.has(name)) registered.set(name, "tab");
        continue;
      }
      const inMain = mainRegion.includes(`name="${name}"`);
      if (inMain || registered.get(name) === "main") registered.set(name, "main");
      else if (!registered.has(name)) registered.set(name, "conditional");
    }
  }

  // Every navigate("X") / navigate("X" as never) target, with the file that makes it.
  const navigatedFrom = new Map(); // name -> [files]
  for (const f of sourceFiles()) {
    const src = read(f);
    if (!src) continue;
    const targets = matchAll(
      src,
      /(?:navigate|replace|push)\(\s*["']([A-Za-z]+)["']/g,
    );
    for (const t of targets) {
      if (!navigatedFrom.has(t)) navigatedFrom.set(t, []);
      navigatedFrom.get(t).push(f);
    }
  }

  for (const [name, branch] of registered) {
    const inbound = navigatedFrom.get(name) ?? [];

    if (branch === "main" && inbound.length === 0 && name !== "MainTabs") {
      findings.push(
        finding(
          "defect",
          `Screen "${name}" is registered but unreachable`,
          "Nothing anywhere calls navigate() with this route name, so a user cannot get to it. Either wire an entry point or remove the registration.",
          "src/navigation/RootNavigator.tsx",
        ),
      );
    }

    if (branch === "conditional" && inbound.length > 0) {
      findings.push(
        finding(
          "defect",
          `Screen "${name}" is navigated to but is not in the active branch`,
          `Registered only inside a conditional branch of RootNavigator, yet navigated to from: ${inbound.join(", ")}. React Navigation cannot resolve a route that is not mounted in the active tree.`,
          inbound[0],
        ),
      );
    }
  }

  // navigate("X" as never) casts bypass the typed param list, which is how these bugs
  // stay invisible to tsc.
  const casts = [];
  for (const f of sourceFiles()) {
    const src = read(f);
    if (!src) continue;
    const m = [...src.matchAll(/navigate\(\s*["']([A-Za-z]+)["']\s+as\s+never/g)];
    for (const hit of m) casts.push({ file: f, route: hit[1], line: lineOf(src, hit[0]) });
  }
  if (casts.length) {
    findings.push(
      finding(
        "drift",
        `${casts.length} navigate() calls bypass the typed param list with "as never"`,
        `The RootStackParamList in src/navigation/types.ts is fully typed, but these casts opt out of it — which is precisely why the unreachable and cross-branch routes above compile cleanly: ${casts.map((c) => `${c.file}:${c.line} -> ${c.route}`).join("; ")}`,
        "src/navigation/types.ts",
      ),
    );
  }

  return RESULT(
    "reachability",
    findings,
    `${registered.size} routes registered, ${navigatedFrom.size} navigated to, ${casts.length} untyped casts`,
    {
      registered: Object.fromEntries(registered),
      navigated: [...navigatedFrom.keys()].sort(),
    },
  );
}
