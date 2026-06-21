import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const [html, css, threeSource, contentSource, appSource] = await Promise.all([
  readFile(join(root, "index.html"), "utf8"),
  readFile(join(root, "src/styles.css"), "utf8"),
  readFile(join(root, "vendor/three.module.js"), "utf8"),
  readFile(join(root, "src/content.js"), "utf8"),
  readFile(join(root, "src/app.js"), "utf8")
]);

const exportStart = threeSource.lastIndexOf("export {");
if (exportStart < 0) throw new Error("Three.js export block not found");
const exportEnd = threeSource.indexOf("};", exportStart);
if (exportEnd < 0) throw new Error("Three.js export block is incomplete");
const exportList = threeSource.slice(exportStart + 8, exportEnd).split(",").map(entry => entry.trim()).filter(Boolean);
const namespaceEntries = exportList.map(entry => {
  const match = entry.match(/^(\S+)\s+as\s+(\S+)$/);
  return match ? `${match[2]}: ${match[1]}` : entry;
});
const bundledThree = `const THREE = (() => {\n${threeSource.slice(0, exportStart)}\nreturn {\n${namespaceEntries.join(",\n")}\n};\n${threeSource.slice(exportEnd + 2)}\n})();`;
const bundledContent = contentSource.replace(/export const /g, "const ");
const bundledApp = appSource.replace(/^import .*?;\s*$/gm, "");

const output = html
  .replace('<link rel="stylesheet" href="./src/styles.css">', () => `<style>\n${css}\n</style>`)
  .replace('<script type="module" src="./src/app.js"></script>', () => `<script type="module">\n${bundledThree}\n${bundledContent}\n${bundledApp}\n</script>`);

const target = join(root, "../outputs/kindergarten-three.html");
await writeFile(target, output, "utf8");
console.log(target);
