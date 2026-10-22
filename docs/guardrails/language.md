# Language guardrails

Every piece of text a person can read in Daily Nomie comes from the language files. The English base file is the baseline. Each other language is a translation of it.

Levels: **MUST** and **SHOULD**, as explained in the [README](README.md). Check IDs refer to [checks/lang-checks.sh](checks/lang-checks.sh) and [checks/lang-text-scan.py](checks/lang-text-scan.py).

---

## 1. The model

- **One base file:** `src/lang/base.ts`. Its keys are nested by area (`general.close`, `settings.pin-required`). Its values are English.
- **Translations:** `src/lang/<code>.ts` (`de`, `it`, `zh-cn`, `test` today; `nl` is next). A missing key falls back to English (`fallbackLng: 'en'`, `src/store/lang.ts`).
- **The function:** `Lang.t(key, default)`. The default is the English text, so a missing key still reads correctly. It is not a substitute for a key.
- **The choice:** the user picks a language in Settings. The choice is stored under the device key `n4-lang` (see `device-settings.ts`).

---

## 2. Rules

- **LANG-01 (MUST)** Visible text in a template is wrapped: `{Lang.t('area.key', 'English')}`. This covers text between tags and the attributes a person sees (`placeholder`, `title`, `aria-label`, `alt`, `label`). Check: `LANG-01`.
- **LANG-02 (MUST)** Every key the code asks for exists in `base.ts`. A key with only a default is a gap in the baseline. Check: `LANG-02`.
- **LANG-03 (MUST)** Toast and dialog text (`showToast`, `Interact.alert`, `Interact.confirm`, `Interact.prompt`) is wrapped in `Lang.t`. Check: `LANG-03`.
- **LANG-04 (MUST)** A new key goes into `base.ts` in the same commit that uses it, under the area that owns the screen (`settings`, `tracker`, `timeline`, and so on). The key names are lowercase words joined with hyphens.
- **LANG-05 (MUST)** Text built from parts uses one key with placeholders (`{{name}}`), not string joins. The placeholder names are the same in every language.
- **LANG-06 (SHOULD)** Names of things the user owns (tracker names, notes, people, places) are never translated. Brand and technical terms (Nomie, API, PIN, CSV, URL) are kept as they are, unless a language file says otherwise.
- **LANG-07 (MUST)** A language file has every key of the base file before it is shipped. Keys that are not yet translated carry the English text. Check: `LANG-07` in `lang-checks.sh`. Dutch (`nl`) is enforced; the other languages are reported until they are translated.
- **LANG-08 (MUST)** Dates and numbers are formatted with the user's settings, not with text. Check by review.

---

## 3. Baseline (measured, branch `languagecomplete`)

Run `bash docs/guardrails/checks/lang-checks.sh --all` for the full list.

- **LANG-01:** about 870 visible text hits in templates (the scan reports some false positives, such as emoji, and the first pass reviews each one).
- **LANG-02:** 164 `Lang.t` calls in the code use keys that `base.ts` does not contain. There are 22 distinct keys. They show their English text only because of the default.
- **LANG-03:** about 120 toast and dialog messages are not wrapped (43 toasts and 88 dialogs in the first count, some overlapping).
- The base file has 121 keys. The code uses about 355 keys.

Zero violations is the completion condition for this area.

---

## 4. Decisions

| ID | Decision |
| --- | --- |
| D-lang-base | English in `base.ts` is the baseline. Other languages translate it, and a missing key falls back to English. |
| D-lang-names | User content and brand names are not translated (LANG-06). |

## Known gaps

- The template scan (LANG-01) does not read text inside `{...}` expressions, and it does not read labels in script objects, such as `value: 'Weekly'` in the settings lists. Those are visible text that the check does not see. They need a scan of the script side, which is not built yet.
