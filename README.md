# SkiFree reborn

This is a fork of [skifree.js](https://github.com/basicallydan/skifree.js) with some major changes:

- Hand-drawn sprites by [Moriz Oberberger](https://www.instagram.com/morizoberberger/)
- Simple 2D physics simulation for skier acceleration and velocity
- Very simple skier psyche simulation to build speed with confidence
- Compatibility with the Dividat Play platform to control the skier with a Dividat Senso

Big thanks to Daniel Hough and contributors for making skifree.js and to Chris Pirih for making the original SkiFree.

## Development

To test it with Play[dev], enter `nix develop`, then run `bin/dev-server`.

Finally, go to https://play.dividat.com/playDev.html and use `http://127.0.0.1:8000` as URL.

## Builds

You can create a complete build in `bundle/` using

    make bundle

Copy this directory anywhere you want to deploy it.

## License

See [license.md](blob/master/license.md)
