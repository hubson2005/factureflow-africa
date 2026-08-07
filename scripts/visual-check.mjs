// scripts/visual-check.mjs
//
// Capture des screenshots de tes pages principales sur plusieurs navigateurs
// (Chromium, WebKit=moteur Safari, Firefox) et plusieurs tailles d'écran
// (mobile iOS/Android, tablette, desktop).
//
// Installation (une fois) :
//   npm install -D playwright
//   npx playwright install
//
// Configuration (crée un fichier .env.visual-test à la racine, JAMAIS commité) :
//   VISUAL_TEST_EMAIL=ton_email_de_test@exemple.com
//   VISUAL_TEST_PASSWORD=ton_mot_de_passe
//   VISUAL_TEST_BASE_URL=http://localhost:5173   (optionnel, valeur par défaut)
//
// Lancement :
//   node scripts/visual-check.mjs
//
// Résultat : dossier visual-test-output/<navigateur>/<taille>/<page>.png

import { chromium, webkit, firefox } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Charge .env.visual-test si présent (sans dépendance externe)
const envPath = path.join(ROOT, ".env.visual-test");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2].trim();
  }
}

const BASE_URL = process.env.VISUAL_TEST_BASE_URL || "http://localhost:5173";
const EMAIL = process.env.VISUAL_TEST_EMAIL;
const PASSWORD = process.env.VISUAL_TEST_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error(
    "Erreur : VISUAL_TEST_EMAIL et VISUAL_TEST_PASSWORD requis.\n" +
    "Crée un fichier .env.visual-test à la racine du projet avec :\n" +
    "  VISUAL_TEST_EMAIL=...\n  VISUAL_TEST_PASSWORD=..."
  );
  process.exit(1);
}

const OUTPUT_DIR = path.join(ROOT, "visual-test-output");
const DEBUG_DIR = path.join(ROOT, "visual-test-debug");

// Tailles d'écran à tester (largeur x hauteur en px)
const VIEWPORTS = [
  { name: "mobile-iphone-se", width: 375, height: 667 },
  { name: "mobile-iphone-14", width: 390, height: 844 },
  { name: "mobile-android", width: 412, height: 915 },
  { name: "tablet-portrait", width: 768, height: 1024 },
  { name: "tablet-landscape", width: 1024, height: 768 },
  { name: "desktop", width: 1440, height: 900 },
];

// Navigateurs (webkit = moteur de Safari, utile même sans Mac)
const BROWSERS = [
  { name: "chromium", launcher: chromium },
  { name: "webkit", launcher: webkit },
  { name: "firefox", launcher: firefox },
];

// Pages à capturer (routes protégées, testées après connexion)
const ROUTES = [
  { name: "dashboard", path: "/dashboard" },
  { name: "invoices", path: "/invoices" },
  { name: "cashflow", path: "/cashflow" },
  { name: "invoice-templates", path: "/invoice-templates" },
  { name: "settings", path: "/settings" },
  { name: "clients", path: "/clients" },
  { name: "quotes", path: "/quotes" },
  { name: "automation", path: "/automation" },
];

// Sélecteurs des éléments position: fixed / sticky à masquer avant une
// capture fullPage. En fullPage, Playwright redimensionne le viewport à la
// hauteur totale du document puis prend une seule capture : un élément fixed
// reste alors ancré à la position qu'il aurait sur un viewport de la hauteur
// d'origine, et se retrouve donc "flottant" au milieu de l'image au lieu de
// rester collé en bas de l'écran comme le verrait un vrai utilisateur qui
// scrolle. On les cache le temps de la capture pour éviter cet artefact.
const FIXED_ELEMENTS_SELECTOR = ".ff-bottomnav, .ff-sidebar";

async function hideFixedElements(page) {
  await page.evaluate((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
      el.dataset.__visualCheckPrevDisplay = el.style.display;
      el.style.display = "none";
    });
  }, FIXED_ELEMENTS_SELECTOR);
}

async function restoreFixedElements(page) {
  await page.evaluate((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
      el.style.display = el.dataset.__visualCheckPrevDisplay || "";
      delete el.dataset.__visualCheckPrevDisplay;
    });
  }, FIXED_ELEMENTS_SELECTOR);
}

async function login(page, debugTag) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });

  // Remplissage compatible React : dispatch les events que React écoute réellement
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);

  const submitBtn = page.locator('button[type="submit"], button:has-text("Se connecter")').first();

  // Vérifie que le bouton n'est pas désactivé avant de cliquer
  const isDisabled = await submitBtn.isDisabled().catch(() => false);
  if (isDisabled) {
    fs.mkdirSync(DEBUG_DIR, { recursive: true });
    await page.screenshot({ path: path.join(DEBUG_DIR, `${debugTag}-button-disabled.png`) });
    throw new Error(
      "Le bouton 'Se connecter' est resté désactivé après remplissage du formulaire. " +
      "Vérifie que fill() déclenche bien les events onChange attendus par React, " +
      "ou que le formulaire n'attend pas un champ supplémentaire (captcha, case à cocher, etc.)."
    );
  }

  await submitBtn.click();

  try {
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    // DIAGNOSTIC TEMPORAIRE : vérifie si la session Supabase est bien écrite en localStorage
    const storageDump = await page.evaluate(() => {
      const out = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.includes("supabase") || k.includes("sb-"))) {
          out[k] = (localStorage.getItem(k) || "").slice(0, 100) + "...";
        }
      }
      return out;
    });
    console.log(`  [DEBUG] localStorage après login (${debugTag}) :`, JSON.stringify(storageDump, null, 2));
  } catch {
    fs.mkdirSync(DEBUG_DIR, { recursive: true });
    const shotPath = path.join(DEBUG_DIR, `${debugTag}-login-failed.png`);
    await page.screenshot({ path: shotPath });
    // Essaie de capturer un message d'erreur affiché à l'écran, si présent
    const errorText = await page
      .locator('[role="alert"], .error, .text-red-500, .text-danger')
      .first()
      .innerText()
      .catch(() => null);
    throw new Error(
      `Connexion échouée : toujours sur ${page.url()} après soumission. ` +
      (errorText ? `Message affiché : "${errorText}". ` : "Aucun message d'erreur visible détecté. ") +
      `Capture de debug : ${shotPath}`
    );
  }
}

async function run() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const results = { ok: 0, failed: [] };

  for (const browserDef of BROWSERS) {
    console.log(`\n=== Navigateur : ${browserDef.name} ===`);
    let browser;
    try {
      browser = await browserDef.launcher.launch();
    } catch (err) {
      console.error(`  Impossible de lancer ${browserDef.name} (pas installé ?) : ${err.message}`);
      console.error(`  Lance : npx playwright install ${browserDef.name}`);
      continue;
    }

    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
      });
      const page = await context.newPage();
      const debugTag = `${browserDef.name}-${viewport.name}`;

      try {
        await login(page, debugTag);
      } catch (err) {
        console.error(`  Échec de connexion (${browserDef.name}/${viewport.name}) : ${err.message}`);
        results.failed.push(`${browserDef.name}/${viewport.name}/LOGIN`);
        await context.close();
        continue;
      }

      const dir = path.join(OUTPUT_DIR, browserDef.name, viewport.name);
      fs.mkdirSync(dir, { recursive: true });

      for (const route of ROUTES) {
        try {
          await page.goto(`${BASE_URL}${route.path}`, { waitUntil: "networkidle", timeout: 15000 });
          await page.waitForTimeout(500); // laisse les animations/chargements finir

          // Garde-fou : si on a été redirigé vers /login, la session a expiré ou n'existait pas
          if (/\/login/.test(page.url())) {
            const storageDump = await page.evaluate(() => {
              const out = {};
              for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && (k.includes("supabase") || k.includes("sb-"))) {
                  out[k] = (localStorage.getItem(k) || "").slice(0, 100) + "...";
                }
              }
              return out;
            });
            console.log(`  [DEBUG] localStorage au moment de l'échec (${route.name}) :`, JSON.stringify(storageDump, null, 2));
            throw new Error(`Redirigé vers /login au lieu de ${route.path} — session non valide.`);
          }

          const filePath = path.join(dir, `${route.name}.png`);
          await hideFixedElements(page);
          await page.screenshot({ path: filePath, fullPage: true });
          await restoreFixedElements(page);
          console.log(`  ✓ ${browserDef.name}/${viewport.name}/${route.name}`);
          results.ok++;
        } catch (err) {
          console.error(`  ✗ ${browserDef.name}/${viewport.name}/${route.name} : ${err.message}`);
          results.failed.push(`${browserDef.name}/${viewport.name}/${route.name}`);
        }
      }

      await context.close();
    }

    await browser.close();
  }

  console.log(`\n=== Résumé ===`);
  console.log(`Réussies : ${results.ok}`);
  console.log(`Échouées : ${results.failed.length}`);
  if (results.failed.length > 0) {
    console.log("Détail des échecs :");
    results.failed.forEach((f) => console.log(`  - ${f}`));
    console.log(`\nCaptures de debug (si échec de login) : ${DEBUG_DIR}`);
  }
  console.log(`\nScreenshots dans : ${OUTPUT_DIR}`);
}

run();
