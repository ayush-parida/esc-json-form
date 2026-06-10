# Publishing

## NPM Publish

This monorepo uses Changesets.

```bash
npm run build
npm run changeset
npm run version-packages
npm run release
```

You must be authenticated to npm:

```bash
npm login
npm whoami
```

## GitHub Pages Docs

Build docs locally:

```bash
npm run docs:build
```

Deploy docs to `gh-pages` branch:

```bash
npm run docs:deploy
```

Ensure repository settings:

1. `Settings -> Pages -> Source: Deploy from a branch`
2. Select branch `gh-pages` and folder `/ (root)`.
