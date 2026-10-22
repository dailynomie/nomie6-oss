# Daily Nomie 7: notes for Claude

Daily Nomie 7 is a Svelte 5 (runes) app built with Vite. Tailwind is 2.2 without JIT. Tests run with Vitest.

## Guardrails

Read [docs/guardrails/README.md](docs/guardrails/README.md) before you change code. For UI work, also read [docs/guardrails/ui-design.md](docs/guardrails/ui-design.md).

- A visual change does not change stores, data, routes, props, handlers or experiment logic. If a visual task seems to need one, stop and ask.
- Use the iOS tokens and components described in the UI guardrails. No Tailwind palette colours, no arbitrary Tailwind values, no browser dialogs, no native select or date inputs.
- Before a commit, run `bash docs/guardrails/checks/ui-checks.sh`. Fix the MUST items in the files you changed.

## Commands

- Tests: `npx vitest run` (must exit 0).
- Build: `npm run vbuild`.
- Dev server: `npm run dev` on port 5001. Do not restart it unless it is the last resort: restarts are slow, and the hot reload picks up most changes.

## Working rules

- Commit one logical change at a time, with a short message and the `Co-Authored-By` trailer the session asks for.
- Do not push or open a pull request without an explicit go-ahead.
- `planning/` is local and not committed. Do not rely on it for rules that must survive, such as the guardrails.
