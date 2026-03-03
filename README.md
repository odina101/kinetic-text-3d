# kinetic-text-3d

3D kinetic typography React component powered by Three.js. Features extruded text with WebGL shaders, bloom glow, film grain, mouse-reactive distortion, and a GSAP entrance animation.

![kinetic-text-3d demo](https://raw.githubusercontent.com/odina101/kinetic-text-3d/main/demo.gif)

## Install

```bash
npm install kinetic-text-3d
```

**Peer dependencies:** `react` >= 18, `react-dom` >= 18

## Quick Start

```tsx
import { KineticText } from 'kinetic-text-3d';

function App() {
  return (
    <KineticText
      text="Hello World"
      width="100%"
      height="100vh"
    />
  );
}
```

## Examples

### Georgian text (uses bundled font)

```tsx
<KineticText
  text="კოდი ხელოვნებაა"
  color="#ffffff"
  glowColor="#22d3ee"
  backgroundColor="#050505"
  glowIntensity={0.6}
  fontSize={1.67}
  width="100%"
  height="100vh"
/>
```

### Custom font

```tsx
<KineticText
  text="THE CODE IS THE CRAFT"
  fontUrl="/fonts/Helvetiker-Bold.ttf"
  fontSize={2.5}
  width="100%"
  height="100vh"
/>
```

### Warm color theme

```tsx
<KineticText
  text="FIRE"
  color="#fff5e6"
  glowColor="#ff6b2b"
  backgroundColor="#1a0a00"
  glowIntensity={1.2}
  fontSize={3}
  width="100%"
  height={500}
/>
```

### Subtle / minimal

```tsx
<KineticText
  text="minimal"
  color="#888888"
  glowColor="#aaaaaa"
  backgroundColor="#000000"
  glowIntensity={0.2}
  fontSize={1.2}
  width={600}
  height={300}
  style={{ borderRadius: 12 }}
/>
```

### Embedded in a card

```tsx
<div style={{ width: 400, height: 200, overflow: 'hidden', borderRadius: 16 }}>
  <KineticText
    text="CARD"
    glowColor="#a855f7"
    backgroundColor="#0f0520"
    glowIntensity={0.8}
    fontSize={2}
    width="100%"
    height="100%"
  />
</div>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `text` | `string` | **(required)** | The text to render in 3D |
| `fontUrl` | `string` | Bundled Georgian font | URL to a `.ttf` or `.otf` font file. Supports any font with the characters in your text |
| `color` | `string` | `"#ffffff"` | Base text color (any CSS hex) |
| `glowColor` | `string` | `"#22d3ee"` | Rim lighting and mouse interaction glow color |
| `backgroundColor` | `string` | `"#050505"` | Scene background color |
| `glowIntensity` | `number` | `0.6` | Bloom glow strength. `0` = no bloom, `2` = very intense |
| `fontSize` | `number` | `1.67` | Size of the 3D text in scene units. Larger = bigger letters |
| `width` | `string \| number` | `"100%"` | Width of the canvas container. Number = pixels, string = CSS value |
| `height` | `string \| number` | `"100%"` | Height of the canvas container. Number = pixels, string = CSS value |
| `className` | `string` | — | CSS class applied to the wrapper `<div>` |
| `style` | `CSSProperties` | — | Inline styles applied to the wrapper `<div>` |

## Features

- **3D extruded text** — each letter is an individual Three.js mesh with bevel
- **Kinetic vertex shader** — simplex noise distortion that reacts to mouse proximity
- **Rim lighting** — edge glow in the fragment shader
- **Mouse interaction** — letters attract toward cursor with liquid-melt distortion, and rotate to "look at" the mouse
- **Bloom post-processing** — UnrealBloomPass for cinematic glow (adjustable via `glowIntensity`)
- **Film grain** — subtle FilmPass for texture
- **GSAP entrance** — letters fly in from random positions with staggered timing
- **Camera float** — subtle sine-wave camera drift
- **Responsive** — uses ResizeObserver, works in any container size
- **Custom fonts** — load any TTF/OTF via `fontUrl` prop (converted at runtime via opentype.js)
- **Bundled Georgian font** — NotoSansGeorgian-Bold included, works out of the box
- **Cleanup** — properly disposes all Three.js resources on unmount

## How It Works

The component creates a full Three.js scene inside a canvas element:

1. **Font loading** — loads a TTF/OTF font via `opentype.js` and converts it to Three.js typeface format at runtime
2. **Text geometry** — each character becomes a separate `TextGeometry` mesh for individual animation
3. **Custom shader** — a `ShaderMaterial` with simplex noise in the vertex shader creates the distortion effect; the fragment shader adds rim lighting and mouse-proximity glow
4. **Post-processing** — `EffectComposer` applies `UnrealBloomPass` (glow) and `FilmPass` (grain)
5. **Animation loop** — `requestAnimationFrame` updates shader uniforms, letter rotations, and camera position every frame
6. **Mouse raycasting** — mouse position is projected onto a 3D plane to drive shader distortion and letter rotation

## Browser Support

Works in all browsers that support WebGL 2 (Chrome, Firefox, Safari 15+, Edge).

## License

MIT
