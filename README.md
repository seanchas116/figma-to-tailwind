# figma-to-tailwind

Figma plugin to convert layers to Tailwind HTML/JSX (utilizing JIT and custom configs)

## Development

### Setup and build/watch

```bash
npm install
npm run dev
```

### Open in Figma

- Run `npm run dev`
- Open Figma
- Click **Menu** > **Plugins** > **Development** > **Import plugin from manifest...**
  - Select `figma-to-tailwind/manifest.json`
- Click **Menu** > **Plugins** > **Development** > **Figma to Tailwind**

## To-do list

- [x] JIT-only output
- [ ] Custom configs
- [x] Un-JIT values
- [ ] Generate multiple spans for text node
- [ ] More CSS properties
  - [ ] Shadows
  - [ ] Gradients
  - [ ] Text transform
  - etc
- [ ] Publish to Figma Community
