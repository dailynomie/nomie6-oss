# Daily Nomie 7

An open source life tracker, mood tracker and data journal. Daily Nomie 7 is based on Nomie 6, and it keeps your data on your own device.

## What's new in version 7

- **Experiments:** test whether one change affects something you track, with a live result and a plain-language summary.
- **Starter mode:** new users see the core of the app. Switch to Full mode any time in Settings → Customize.
- **A central menu:** the middle button on the phone bar opens Goals, Experiments, Pointers and Locations.
- **Complete backups:** a backup contains everything, and restoring it twice never creates duplicates.
- **AI explanations (optional):** an optional explanation of an experiment's result. The numbers always come from the code.

## Running it on your computer

You need Node 20 (see `.nvmrc`) and npm.

```bash
git clone https://github.com/dailynomie/dailynomie7.git
cd dailynomie7
npm ci
npm run dev
```

Then open http://localhost:5001.

To run the tests:

```bash
npx vitest run
```

To build the app for a web server, the output goes to `dist/`:

```bash
npm run vbuild
```

## Self-hosting with Docker

```bash
docker build -t daily-nomie .
docker run -p 8080:80 daily-nomie
```

Then open http://localhost:8080.

## Sync

Sync is optional. You can connect Daily Nomie to a CouchDB server that you run yourself. Daily Nomie does not run a sync server for you.

## AI

AI is optional and off by default. When you turn it on, you add your own API key for Claude (Anthropic) or OpenRouter. The app sends the context needed for each request directly to that provider. Your key stays on your device. See the privacy policy in the app (More → About → Learn More) for details.

## Privacy

Your logs, trackers and settings are stored in your browser. Nothing is sent to us. Backups are files you download, and they never contain your PIN, your storage type or your AI keys.

## Credits

Daily Nomie is based on Nomie 6, which was open sourced by Happy Data, LLC after Nomie closed. Thank you to the Nomie team and to everyone who used and built on it.

## How Nomie Works

Nomie stores each record as a log - with all tracker, people and context data being stored as a string in the `log.note` field. Nomie then parses the notes to extract structured data in real time.

For example:

`Today I walked #miles(5) #mood(8)` is converted to a structure like: `{ 'miles' : 5, 'mood': 8 }`

A more complicated example would be:

`Today @em @maddy and I #walked(4) +memory`

which would be converted into something like:

```javascript
{
    people:['em','maddy'],
    trackers: { walked: 4},
    context:['memory']
}
```

## Meet the Nouns

- **Tracker** - primarily represented by a button on the "track board". Trackers are represented by their hashtag in notes - for example: #sleep(160000).
- **Board** - a board is specific group of trackers.
- **Board Tabs** - how you switch boards on the track tab
- **Log** - a record event. A lot contains a note, a note can contain unlimited numbers of tags; e.g: #mood(4) #pizza #beer(12). Logs can contain a lat and long. Tracker Objects and their values are parsed out of the logs in real time.
- **Person** - a Person that you track in Nomie. You can track individuals by using the @username format.
- **Context** - a generic categorization / group using the +context format. For example ``Went to dinner with @mom +meal`
- **Location** - a physical location that you store and use later

## Coding Rules

- **Keep it readable** - focus on writing code that new people can easily understand and follow. If the code can't do it, then do it with comments. There's no such thing as too much commenting. (yes, I should follow my own rules)
- **Keep it under 300 lines** - the goal is to keep files under 300 lines of code. Note: Sometimes that's not feasible, and I break it often
- **Keep it flexible** - think in components. If you're doing something more than once, it most likely should be a component.
- **Keep it safe** - if you're deleting something of the users, consider using `await Interact.confirm("Are you sure")` to confirm they're action
- **Keep cleaning, organizing and testing** - this project didn't start very clean, or ready for unit testing, this should be an on going objective.
- **Use what's there**
  - Tailwind CSS - is the new world

## Nomie Jingle

The Nomie Jingle was written and produced by soldilil - [see more work](https://soldilil.bandcamp.com)

## Open Source Props

- [SvelteJS](https://svelte.dev/)
- [Leaflet](https://leafletjs.com)
- [OpenStreetMap](https://openstreetmap.org)
- [PouchDB](https://pouchdb.com)
- [LocalForage](https://localforage.github.io/localForage/)
- [svelte-emoji-picker](https://github.com/joeattardi/svelte-emoji-selector)

## Trademark License

Nomie and the Blue Elephant are registered Trademarks of Happy Data, LLC. Indianapolis, IN. For a commercial use of the brand or logomark please contact support@happydata.org

## MIT License

Copyright 2019 Happy Data, LLC <support@happydata.org>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
