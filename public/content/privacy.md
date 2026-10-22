# Privacy policy for Daily Nomie

Daily Nomie is an open source app. This policy explains what happens to your data, where it is kept, and what is sent to other parties when you use an optional feature. It is written in plain language, and it is not legal advice.

## The short version

- Your data stays in your browser by default. We do not receive it.
- Sync is optional. When you turn it on, your data goes to a CouchDB server that you choose. Daily Nomie does **not** encrypt the data before it is sent, so the operator of that server can read it.
- Backups are files that you download. They are not encrypted by the app.
- AI is optional and off by default. When you turn it on and add your own API key, the app sends each request straight from your browser to the AI provider you chose. We do not see those requests.
- We run no analytics or tracking.

## 1. Your data on this device

Daily Nomie stores your logs, trackers, goals, experiments, dashboards, notes and settings in the storage of your browser (IndexedDB and localStorage). Nothing is sent to us. Your data reaches a server only if you turn on sync and choose a server (section 2).

- The app does not encrypt this storage. Anyone who can use your browser profile or your device can read it.
- The PIN lock keeps the app closed until the PIN is entered. It is not encryption of your data.

## 2. Sync with a CouchDB server (optional)

You can sync your data to a CouchDB server in two ways:

- **You run the server yourself.** You enter its address in the app. You, or the company or person who runs it for you, control it. We do not have access to it.
- **You use the hosted sync service that Daily Nomie offers.** We run that server. This is not automatic: you request a user ID and password for it first, and you enter them in the app.

Sync data is **not encrypted by the app**. The operator of the server, which is us for the hosted service, can read it. Anyone who gets access to the server can read it too.

- Use an address that starts with `https://`, so the connection is encrypted in transit.
- Keep your device and your account safe.
- Deleting data on your device does not remove copies that already reached the server. Delete them on the server as well.

## 3. Backups

A backup is a file that you download to your device. It contains your data and most of your settings, in a readable format. It never contains your PIN, your storage type, your AI API keys or your server login details.

Keep backup files as private as you would keep your data. Anyone who has the file can read it.

## 4. AI features (optional, off by default)

AI features only work when you turn them on in Settings and enter your own API key for a provider. Until then, no data is sent to an AI provider.

When you use an AI feature:

- The app sends the request **directly from your browser** to the provider you chose. The request contains the context that feature needs. Depending on the feature, that can include notes, journal text, tracker names and values, and experiment results.
- The providers are **Anthropic (Claude)** and **OpenRouter**, which routes requests to other AI models. Their own privacy policies and terms apply to what they receive. OpenRouter's free models may be run by providers that keep logs of prompts.
- Your API key is kept on your device, in the browser's storage. If you set a PIN, the key is encrypted with it. A short PIN gives little protection, so use a longer one if the key matters to you. Any script that can run in the app's page can read the key while the app is open.
- You can turn AI off at any time in Settings. Turning it off stops the requests; it does not delete the key until you clear it.

Results that come from your data are calculated on your device. The AI only explains them.

## 5. Analytics and tracking

Daily Nomie does not load any analytics, advertising or tracking scripts.

## 6. What we do not do

- We do not sell your data, and we do not share it with advertisers.
- We do not receive your logs, trackers or notes, unless you send them to us yourself, for example by email.

## 7. Your choices

- You can export your data at any time with a backup.
- You can delete your data in the app with "Destroy all Data" in Settings. This removes the data on your device. It does not remove copies on a sync server or on a provider's side.

## 8. Changes to this policy

When this policy changes, we update the date below, and we announce the change in the What's New section of the app.

## 9. Contact

[dailynomie@gmail.com](mailto:dailynomie@gmail.com)

Last updated: 22 October 2026
