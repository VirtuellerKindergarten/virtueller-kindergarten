# Virtueller Kindergarten mit Three.js

Diese Anwendung ist die WebGL-Migration des bisherigen CSS-3D-Kindergartens. Die alte Datei unter `outputs/kindergarten-3d.html` bleibt als Rückfalloption erhalten.

Die gebündelte Offline-Version liegt unter `outputs/kindergarten-three.html` und kann ohne Server direkt geöffnet werden.

## Start

```powershell
node build.mjs
node server.mjs 4173
```

Danach ist die Anwendung unter `http://127.0.0.1:4173/three-kindergarten/` erreichbar.

## Struktur

- `src/app.js`: Three.js-Szene, Steuerung, Interaktionen und Informationsoberfläche
- `src/content.js`: automatisch übernommene pädagogische Inhalte
- `src/styles.css`: responsive Benutzeroberfläche
- `vendor/three.module.js`: lokale Three.js-Laufzeit
- `server.mjs`: lokaler Entwicklungsserver

Dokumente und Referenzbilder werden weiterhin aus `outputs/assets` geladen. Dadurch bleiben beide Versionen inhaltlich synchron nutzbar.
