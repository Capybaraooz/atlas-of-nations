import { writeFileSync, mkdirSync, cpSync } from "node:fs";
import { buildDossier } from "./vendor/makefun-frontend.ts";
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
mkdirSync(outDir, { recursive: true });
cpSync("app", outDir + "/app", { recursive: true });
cpSync("screenshots", outDir + "/screenshots", { recursive: true });
writeFileSync(outDir + "/dossier.json", buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
}));
console.log("dossier written to " + outDir + "/dossier.json");
