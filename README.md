# Peglight Party

An original browser arcade game inspired by Peggle 2. Aim and bounce through three boards, clearing all 25 orange pegs before your ten balls run out. Blue pegs add points and purple pegs are worth more. The normal guide shows the ball’s trajectory through its first bounce; green pegs give a two-shot Super Guide that traces several impacts. Hit several pegs per shot for a bigger score and catch the moving bucket to earn a free ball. Your score carries between stages.

## Play locally

Run a web server from this directory:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Visit <http://127.0.0.1:8000/>. No build step or package installation is needed.

Move the mouse to aim and click to shoot; on touch screens, tap the board to aim and fire. Alternatively use left/right arrow keys and Space. Restart resets the run. The sound button mutes effects.

This is a small single-player interpretation, not a reproduction of the original game's levels, art, characters, full selection of powers, multiplayer, or exact physics and scoring. It uses original procedural artwork and synthesized sound. Peggle 2 is a trademark of its respective owner; this project is not affiliated with or endorsed by EA or PopCap.

## References

- [Peggle 2 official game page](https://www.ea.com/games/peggle/peggle-2)
- [Peggle 2 game manual](https://dlassets-ssl.xboxlive.com/public/content/efd011ea-47b6-4b61-9e86-08063a3e1cfa/GameManual/2968fc9a-311b-4beb-8ee6-3903d1bc8643/en-GB/index.html)
- `.gitignore` combines GitHub's `Global/Linux.gitignore`, `Global/Windows.gitignore`, and `Global/macOS.gitignore` templates.

## Tests

Run `node --test tests/guide.test.cjs` to check both guides against shot physics, bounces, aiming at different sizes, and the Super Guide’s two-shot duration.

## License

MIT; see [LICENSE](LICENSE).
