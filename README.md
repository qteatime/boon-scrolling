# Boon-scrolling

A small simulation about doom-scrolling—except all content is cute and positive.

## Running

You can play the game by just going to https://boon-scrolling.qteati.me.

## Developing, Remixing, Etc.

The game is written in [Crochet][], a small engine and programming language
for building turn-based story games with a focus on independent AIs.

You can install Crochet through [npm](https://nodejs.org/en/), which comes with
Node.js. Currently Crochet requires you to use the command line
(e.g.: `cmd.exe` or Power Shell on Windows).

The following command will install Crochet for this game and launch a local
server, if you run it from the root of this project:

```shell
npm install
npm start
```

You can then play the game by opening http://localhost:8080 in your browser.
Any changes you make to `main.crochet` will take effect when you reload the
page.

You can generate a static website with all needed resources by running:

```shell
npm build
```

The generated website will be in the `packages/me.qteati.boon-scrolling` folder.

## Licence


<a rel="license" href="http://creativecommons.org/licenses/by/4.0/">
<img alt="Creative Commons Licence" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a>

Boon-scrolling itself is released under a
<a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International Licence</a>.

[Crochet][], the engine in which
Boon-scrolling is written, is however released under a MIT licence.

[Crochet]: https://github.com/qteatime/crochet
