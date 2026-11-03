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

## Arcade metadata

See [docs/arcade-metadata.md](docs/arcade-metadata.md) for the game-owned manifest and screenshot provenance.

## Scoring correction

Shot points now equal the sum of the lit peg values multiplied by the number of unique pegs hit. Repeated contact does not score again. Reaching 25,000, 75,000 and 125,000 points in one shot awards a ball at each threshold; a bucket catch can add another. The purple bonus relocates among surviving blue pegs between shots, preserving orange and green roles. These changes follow [EA’s Peggle 2 help](https://dlassets-ssl.xboxlive.com/public/content/efd011ea-47b6-4b61-9e86-08063a3e1cfa/GameManual/2968fc9a-311b-4beb-8ee6-3903d1bc8643/en-GB/index.html). Existing orange-count multiplier thresholds remain authored values; style-shot awards, no-hit coin flips, Fever buckets and remaining-ball bonuses are not implemented.
