#!/usr/bin/env bash
# Q2: the TypeScript error count must not grow. The baseline is in ts-baseline.txt.
# Lower the baseline when the count falls; never raise it to pass.
set -u

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT" || exit 1

BASELINE=$(tr -d '[:space:]' < docs/guardrails/checks/ts-baseline.txt)
COUNT=$(npx tsc --noEmit 2>&1 | grep -c "error TS")

echo "TypeScript errors: $COUNT (baseline $BASELINE)"
if [ "$COUNT" -gt "$BASELINE" ]; then
  echo "Result: FAIL (the count grew by $((COUNT - BASELINE)); fix the new errors, do not raise the baseline)"
  exit 1
fi
if [ "$COUNT" -lt "$BASELINE" ]; then
  echo "Result: pass. The count fell: set docs/guardrails/checks/ts-baseline.txt to $COUNT"
  exit 0
fi
echo "Result: pass"
exit 0
