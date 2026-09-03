# Texture Provenance (ASSET-01)

All files in this directory are downscaled/recompressed (JPEG, ~512–1024px wide
equirectangular maps; PNG for the Saturn ring density strip) from the sources
below, to keep static-site payload small. No textures are generated at request
time; all processing happened once, offline, before committing.

| File | Source | License | Notes |
|---|---|---|---|
| `sun.jpg`, `mercury.jpg`, `venus.jpg`, `mars.jpg`, `jupiter.jpg`, `saturn.jpg`, `uranus.jpg`, `neptune.jpg` | [Solar System Scope textures](https://www.solarsystemscope.com/textures/) | CC BY 4.0 | Original 2K JPEGs downscaled to 512–1024px wide and recompressed. |
| `earth.jpg` | [Solar System Scope textures](https://www.solarsystemscope.com/textures/) — day map | CC BY 4.0 | Downscaled to 768×384. |
| `saturn_ring.png` | [Solar System Scope textures](https://www.solarsystemscope.com/textures/) — ring alpha strip | CC BY 4.0 | Downscaled to 1024×63, alpha preserved. |
| `pluto.jpg` | [Wikimedia Commons: Pluto_color_mapmosaic.jpg](https://commons.wikimedia.org/wiki/File:Pluto_color_mapmosaic.jpg) (NASA/JHUAPL/SwRI, New Horizons) | Public domain (PD-USGov) | Downscaled to 512×256; the mission's unimaged far-side gap (a hard black band in the source) was fuzz-filled to a muted average tone and softened so it reads as unlit/unmapped terrain rather than a rendering error. |

Attribution is surfaced in-page at the closing card (`#closing-credit` in
`index.html`), satisfying the CC BY 4.0 attribution requirement.
