# Boon-scrolling

A small simulation about doom-scrolling—except all content is cute and positive.

## Running

You can play the game by just going to [https://boon-scrolling.qteati.me].

## Developing, Remixing, Etc.

The game is written in [Crochet][], a small engine and programming language
for building turn-based story games with a focus on independent AIs.

You can install Crochet through [npm](https://nodejs.org/en/), which comes with
Node.js. Currently Crochet requires you to use the command line
(e.g.: `cmd.exe` or Power Shell on Windows). The following commands will install
Crochet's version 0.5.0 and run this game:

```shell
npm install -g @origamitower/crochet@0.5.0
crochet run-web "path/to/this/folder/game"
```

Where you replace `"path/to/this/folder/game"` with the full path to the `game`
folder inside of this directory.
E.g.: `crochet run-web "C:\Users\You\Documents\boon-scrolling\game"`.

You can then play the game by opening http://localhost:8080 in your browser.
Any changes you make to `main.crochet` will take effect when you reload the
page.

## Licence


<a rel="license" href="http://creativecommons.org/licenses/by/4.0/">
<img alt="Creative Commons Licence" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a>

Boon-scrolling itself is released under a
<a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International Licence</a>.

[Crochet][], the engine in which
Boon-scrolling is written, is however released under a MIT licence.

[Crochet]: https://github.com/qteatime/crochet