# Stack Reference - Bill of Materials

> Source de verite pour les versions et configurations des dependances.
> Genere automatiquement par verification web (WebSearch/WebFetch) lors de la phase MODEL.
> **NE PAS editer manuellement** — regenerer via `/factory-spec`.

## Dependencies runtime

| Package | Version | Install command | Source |
|---------|---------|----------------|--------|
| <!-- ex: react --> | <!-- ex: 19.1.0 --> | <!-- ex: pnpm add react react-dom --> | <!-- ex: https://react.dev --> |

## Dependencies dev

| Package | Version | Install command | Source |
|---------|---------|----------------|--------|
| <!-- ex: vitest --> | <!-- ex: 3.1.0 --> | <!-- ex: pnpm add -D vitest --> | <!-- ex: https://vitest.dev --> |

## Configurations de reference

> Pour chaque dependance necessitant un fichier de configuration,
> inclure le snippet EXACT copie depuis la documentation officielle.

### <!-- Nom de la lib (ex: Tailwind CSS) -->

**Fichier** : `<!-- ex: src/index.css -->`

```
<!-- snippet de config officiel -->
```

## Compatibilite

> Notes de compatibilite inter-dependances (ex: "Tailwind v4 necessite @tailwindcss/vite, pas PostCSS").

- <!-- note -->

## Breaking changes connus

> Changements majeurs par rapport aux versions precedentes que les LLMs pourraient generer par erreur.

| Lib | Ancien (a eviter) | Nouveau (a utiliser) | Detail |
|-----|-------------------|---------------------|--------|
| <!-- ex: Tailwind CSS --> | <!-- ex: tailwind.config.js + PostCSS --> | <!-- ex: CSS-first @import + @tailwindcss/vite --> | <!-- ex: v4 n'utilise plus de fichier JS --> |
