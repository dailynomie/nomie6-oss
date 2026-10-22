# Daily Nomie 7 guardrails

Guardrails are the rules that new and changed code must follow. They are written for people and for Claude. Each area has one document:

| Area | Document | Checks |
| --- | --- | --- |
| UI design (iOS look and feel) | [ui-design.md](ui-design.md) | `checks/ui-checks.sh` |
| Storage | [storage.md](storage.md) | `checks/code-checks.sh` (STO-) |
| Domain | [domain.md](domain.md) | manual, plus `ARC-01` |
| Components | [components.md](components.md) | `checks/code-checks.sh` (CMP-) |
| Architecture | [architecture.md](architecture.md) | `checks/code-checks.sh` (ARC-) |

Checks that enforce rules live in [checks/](checks/). Decisions that change a rule are recorded in the rule's document, with a short reason.

## How the rules are written

- **MUST** means the change is not done until the rule holds. The checks fail on it.
- **SHOULD** means follow it unless there is a stated reason not to. The checks warn on it.
- Each rule has an ID (for example UI-04). Use the ID when you report a violation or an exception.
- A rule that can be checked by a pattern has a check in `checks/`. Rules that need judgement are marked as manual review.

## Order of precedence

1. **Safety of the app and the user's data.** A visual change does not change stores, data, routes, props, handlers or experiment logic. If a visual task seems to need a logic change, stop and ask.
2. **MUST rules** in the area documents.
3. **SHOULD rules.** Where they conflict with a MUST rule, the MUST rule wins.
4. **Existing code.** Existing code that breaks a rule is not a reason to break it again. Leave legacy code alone unless the task touches it.

## Running the checks

```bash
bash docs/guardrails/checks/ui-checks.sh          # UI rules, changed files only
bash docs/guardrails/checks/ui-checks.sh --all    # UI rules, every source file
bash docs/guardrails/checks/code-checks.sh        # storage, component and architecture rules, changed files only
bash docs/guardrails/checks/code-checks.sh --all  # the same rules on every source file
```

The default run is the one to use before a commit. Each script exits with code 1 when a MUST rule fails in the checked files. The `--all` run lists the legacy items, which is useful for planning a clean-up. It does not fail the build.

Some rules cannot be checked by a pattern (for example "the domain logic has a spec" or "the entry carries the crown"). Those are marked as manual in their document and checked by review.

The checks look at patterns in the text of the files. They cannot tell whether a colour is a deliberate exception or whether a click handler is on a real control. Use a reviewer's eye on the hits.

## Exceptions

A deliberate exception is marked on the same line with `guardrail-ok:`, the rule ID and a short reason:

```svelte
<div class="fixed inset-0 bg-black bg-opacity-40" on:click={close}></div> <!-- guardrail-ok: UI-04 scrim over content (D-scrim) -->
```

Exceptions are for things the rules name as exceptions (scrims, the user's own colours, the emoji that users choose). Anything else is a violation, not an exception.

## Keeping the rules current

- When a decision changes a rule, change the rule in the same commit, and add the decision to the document's decision list.
- When you find a rule that is missing, add it. Do not work around it silently.
- The rules describe the code as it is. If a rule and the code disagree, check which one is right and fix the other.

## Notes on source material

The UI rules were written from the iOS design guide, now in `docs/design/ios-look-implementation.md`, and from its decision log. The UI document is self-contained.
