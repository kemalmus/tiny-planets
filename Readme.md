# tiny planets

procedurally generated tiny planets in three.js.
fork of [flo-bit/tiny-planets](https://github.com/flo-bit/tiny-planets).

## gpu displacement

the viewer in `src/script.ts` no longer bakes the mesh in a worker.
one shared icosahedron is displaced in a TSL shader (`src/planets/mount.ts`) on `WebGPURenderer`, which falls back to WebGL2.
the same height function places instanced trees, so a new seed is a uniform update.

presets: beach, forest, snow, dune, ember.
keys: `1`–`5` presets, `space` spin, `r` or the button for a new world.

the original worker generator is still in `src/worlds/` for reference.

## license

MIT
