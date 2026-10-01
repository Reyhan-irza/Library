import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const viteCli = path.join(projectRoot, "node_modules/vite/bin/vite.js");
const browserPath = findBrowser();
const routes = [
  "/dashboard",
  "/books",
  "/borrowings",
  "/members",
  "/reports",
];

function findBrowser() {
  const candidates = [
    process.env.CHROME_BIN,
    "/repl/tools/bin/chromium",
    "chromium",
    "chromium-browser",
    "google-chrome",
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (path.isAbsolute(candidate) && existsSync(candidate)) return candidate;
    if (path.isAbsolute(candidate)) continue;

    try {
      return spawnSync("which", [candidate], { encoding: "utf8" }).stdout.trim() || null;
    } catch {
      // Try the next supported browser name.
    }
  }

  return null;
}

async function reservePort() {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address();
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return port;
}

const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function appIsAlreadyServing(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1_000) });
    if (!response.ok) return false;
    const html = await response.text();
    return html.includes('id="root"') && html.includes("/src/main.tsx");
  } catch {
    return false;
  }
}

async function waitForHttp(url, child, getLogs) {
  const deadline = Date.now() + 30_000;

  while (Date.now() < deadline) {
    if (child?.exitCode !== null && child?.exitCode !== undefined) {
      throw new Error(`Vite exited before becoming ready.\n${getLogs()}`);
    }

    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The development server is still starting.
    }

    await sleep(200);
  }

  throw new Error(`Vite did not become ready at ${url}.\n${getLogs()}`);
}

async function waitForDebugEndpoint(port, child) {
  const url = `http://127.0.0.1:${port}/json/version`;
  const deadline = Date.now() + 20_000;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error("Chromium exited before opening its debug endpoint.");

    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Chromium has not opened the port yet.
    }

    await sleep(100);
  }

  throw new Error("Chromium did not open its remote debugging endpoint.");
}

class CdpClient {
  #nextId = 0;
  #pending = new Map();

  constructor(socket) {
    this.socket = socket;
    socket.addEventListener("message", event => {
      const message = JSON.parse(String(event.data));
      if (!message.id) return;

      const pending = this.#pending.get(message.id);
      if (!pending) return;
      clearTimeout(pending.timeout);
      this.#pending.delete(message.id);

      if (message.error) {
        pending.reject(new Error(`${pending.method} failed: ${message.error.message}`));
      }
      else pending.resolve(message.result);
    });
  }

  static async connect(url) {
    const socket = new WebSocket(url);
    await new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true });
      socket.addEventListener("error", () => reject(new Error("Could not connect to Chromium DevTools.")), { once: true });
    });
    return new CdpClient(socket);
  }

  command(method, params = {}) {
    const id = ++this.#nextId;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.#pending.delete(id);
        reject(new Error(`Chromium command timed out: ${method}`));
      }, 15_000);

      this.#pending.set(id, { method, resolve, reject, timeout });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    let response;
    try {
      response = await this.command("Runtime.evaluate", {
        expression,
        awaitPromise: true,
        returnByValue: true,
      });
    } catch (error) {
      const excerpt = expression.replace(/\s+/g, " ").slice(0, 180);
      throw new Error(`${error.message} (expression: ${excerpt})`);
    }
    if (response.exceptionDetails) {
      throw new Error(response.exceptionDetails.exception?.description ?? response.exceptionDetails.text);
    }
    return response.result?.value;
  }

  close() {
    this.socket.close();
  }
}

async function waitForBrowser(cdp, expression, description, timeout = 15_000) {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    if (await cdp.evaluate(expression)) return;
    await sleep(100);
  }

  const state = await cdp.evaluate(`(() => ({
    href: location.href,
    rootClass: document.documentElement.className,
    rootMarkup: document.querySelector("#root")?.innerHTML.slice(0, 500) ?? null,
    cachedUser: localStorage.getItem("perpus_user"),
    pageErrors: window.__themeTestErrors ?? [],
  }))()`);
  throw new Error(`Timed out waiting for ${description}.\nBrowser state: ${JSON.stringify(state)}`);
}

async function stopProcess(child, wholeProcessGroup = false) {
  if (!child || child.exitCode !== null) return;

  try {
    if (wholeProcessGroup && child.pid) process.kill(-child.pid, "SIGTERM");
    else child.kill("SIGTERM");
  } catch {
    // The process may have exited during cleanup.
  }

  await Promise.race([once(child, "exit").catch(() => {}), sleep(3_000)]);

  if (child.exitCode === null) {
    try {
      if (wholeProcessGroup && child.pid) process.kill(-child.pid, "SIGKILL");
      else child.kill("SIGKILL");
    } catch {
      // The process may have exited during cleanup.
    }
  }
}

function themeSnapshot() {
  const root = document.querySelector(".vireon-workspace");
  if (!root) return null;

  const pageRoot = root.querySelector("main > div");
  const title = pageRoot?.querySelector(".vireon-page-title");
  const secondary = [...(pageRoot?.querySelectorAll(".text-muted-foreground") ?? [])]
    .find(element => element.textContent.trim());
  const sidebar = root.querySelector(".glass-sidebar");
  const header = root.querySelector("main > header");
  const card = [...(pageRoot?.querySelectorAll("*") ?? [])]
    .find(element => element.classList.contains("glass") || element.classList.contains("shadow-card"));
  const routeInputSelector = {
    "/books": 'input[placeholder*="Cari judul"]',
    "/borrowings": 'input[placeholder*="Cari kode request"]',
    "/members": '[data-testid="input-search-members"]',
  }[window.location.pathname];
  const input = (routeInputSelector && pageRoot?.querySelector(routeInputSelector))
    || root.querySelector("main > header input");
  const badge = [...root.querySelectorAll("[class]")]
    .find(element => element.classList.contains("dark:text-amber-400"));

  if (!title || !secondary || !sidebar || !header || !card || !input) return null;

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  function parseColor(cssColor) {
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = cssColor;
    context.fillRect(0, 0, 1, 1);
    return [...context.getImageData(0, 0, 1, 1).data];
  }

  function over(foreground, background) {
    const alpha = foreground[3] / 255;
    const backgroundAlpha = background[3] / 255;
    const resultAlpha = alpha + backgroundAlpha * (1 - alpha);
    if (!resultAlpha) return [0, 0, 0, 0];

    return [
      (foreground[0] * alpha + background[0] * backgroundAlpha * (1 - alpha)) / resultAlpha,
      (foreground[1] * alpha + background[1] * backgroundAlpha * (1 - alpha)) / resultAlpha,
      (foreground[2] * alpha + background[2] * backgroundAlpha * (1 - alpha)) / resultAlpha,
      resultAlpha * 255,
    ];
  }

  function effectiveBackground(element) {
    const layers = [];
    for (let current = element; current; current = current.parentElement) {
      const color = parseColor(getComputedStyle(current).backgroundColor);
      if (color[3] > 0) layers.push(color);
    }

    let background = [0, 0, 0, 0];
    for (const layer of layers.reverse()) background = over(layer, background);
    return background[3] < 255 ? over([255, 255, 255, 255], background) : background;
  }

  function contrastRatio(textColor, background) {
    const foreground = over(parseColor(textColor), background);
    const luminance = ([red, green, blue]) => {
      const linear = channel => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue);
    };
    const first = luminance(foreground);
    const second = luminance(background);
    return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
  }

  function surface(element) {
    const [red, green, blue] = effectiveBackground(element).map(Math.round);
    return `rgb(${red}, ${green}, ${blue})`;
  }

  const headingBackground = effectiveBackground(title);
  const secondaryBackground = effectiveBackground(secondary);
  const inputBackground = effectiveBackground(input);
  const badgeBackground = badge ? effectiveBackground(badge) : null;

  return {
    theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
    colorScheme: getComputedStyle(root).colorScheme,
    workspaceSurface: surface(root),
    sidebarSurface: surface(sidebar),
    headerSurface: surface(header),
    cardSurface: surface(card),
    headingColor: getComputedStyle(title).color,
    headingContrast: contrastRatio(getComputedStyle(title).color, headingBackground),
    secondaryColor: getComputedStyle(secondary).color,
    secondaryContrast: contrastRatio(getComputedStyle(secondary).color, secondaryBackground),
    inputSurface: surface(input),
    inputColor: getComputedStyle(input).color,
    inputPlaceholderColor: getComputedStyle(input, "::placeholder").color,
    inputContrast: contrastRatio(getComputedStyle(input).color, inputBackground),
    inputPlaceholderContrast: contrastRatio(getComputedStyle(input, "::placeholder").color, inputBackground),
    badgeColor: badge ? getComputedStyle(badge).color : null,
    badgeSurface: badge ? surface(badge) : null,
    badgeContrast: badge ? contrastRatio(getComputedStyle(badge).color, badgeBackground) : null,
  };
}

test("admin pages keep readable colors in light and dark themes", {
  skip: browserPath ? false : "Chromium is not installed; set CHROME_BIN to run this browser test.",
}, async t => {
  const debugPort = await reservePort();
  let baseUrl = process.env.THEME_TEST_BASE_URL
    ?? `http://127.0.0.1:${process.env.PORT || 5000}`;
  let serverLogs = "";
  let cdp;
  let profileDirectory;
  let vite;

  if (!(await appIsAlreadyServing(baseUrl))) {
    const appPort = await reservePort();
    baseUrl = `http://127.0.0.1:${appPort}`;

    const serverEnvironment = { ...process.env };
    delete serverEnvironment.REPL_ID;
    serverEnvironment.PORT = String(appPort);
    serverEnvironment.VITE_SUPABASE_URL = "https://vireon-theme-test.invalid";
    serverEnvironment.VITE_SUPABASE_ANON_KEY = "vireon-theme-browser-test-key";

    vite = spawn(process.execPath, [
      viteCli,
      "--host", "127.0.0.1",
      "--port", String(appPort),
      "--strictPort",
    ], {
      cwd: projectRoot,
      env: serverEnvironment,
      stdio: ["ignore", "pipe", "pipe"],
    });
    vite.stdout.on("data", chunk => { serverLogs = `${serverLogs}${chunk}`.slice(-12_000); });
    vite.stderr.on("data", chunk => { serverLogs = `${serverLogs}${chunk}`.slice(-12_000); });
  }

  t.after(async () => {
    cdp?.close();
    await stopProcess(vite);
    await rm(profileDirectory, { recursive: true, force: true }).catch(() => {});
  });

  await waitForHttp(baseUrl, vite, () => serverLogs);

  profileDirectory = await mkdtemp(path.join(tmpdir(), "vireon-theme-browser-"));
  const chromium = spawn(browserPath, [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--disable-background-networking",
    "--disable-extensions",
    "--no-first-run",
    "--no-default-browser-check",
    "--remote-debugging-address=127.0.0.1",
    `--remote-debugging-port=${debugPort}`,
    "--remote-allow-origins=*",
    `--user-data-dir=${profileDirectory}`,
    "about:blank",
  ], { detached: true, stdio: "ignore" });
  t.after(() => stopProcess(chromium, true));

  await waitForDebugEndpoint(debugPort, chromium);
  const tabsResponse = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
  const pageTarget = (await tabsResponse.json()).find(target => target.type === "page");
  assert.ok(pageTarget, "Chromium should expose a page target");
  cdp = await CdpClient.connect(pageTarget.webSocketDebuggerUrl);

  await cdp.command("Page.enable");
  await cdp.command("Runtime.enable");
  await cdp.command("Network.enable");
  await cdp.command("Page.addScriptToEvaluateOnNewDocument", {
    source: `window.__themeTestErrors = [];
      window.addEventListener("error", event => window.__themeTestErrors.push(event.message));
      window.addEventListener("unhandledrejection", event => window.__themeTestErrors.push(String(event.reason)));`,
  });
  await cdp.command("Network.setBlockedURLs", { urls: ["https://*"] });
  await cdp.command("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  const initialNavigation = await cdp.command("Page.navigate", { url: `${baseUrl}/login` });
  assert.equal(
    initialNavigation.errorText,
    undefined,
    `Chromium could not open the local app: ${initialNavigation.errorText ?? ""}\n${serverLogs}`,
  );
  await waitForBrowser(
    cdp,
    `document.querySelector("#root > *") && !document.querySelector('[aria-label="Memuat aplikasi"]') && document.documentElement.classList.contains("light")`,
    "the app shell to finish initializing",
  );

  // Let Supabase's initial null-session notification finish before seeding
  // the local identity used by the private-route guard.
  await sleep(700);
  const testUser = JSON.stringify({
    id: "theme-browser-test",
    username: "theme-test",
    name: "Theme Test",
    email: "theme-test@example.invalid",
    role: "admin",
  });
  await cdp.evaluate(`localStorage.setItem("perpus_user", ${JSON.stringify(testUser)})`);
  await sleep(150);
  assert.equal(
    await cdp.evaluate(`localStorage.getItem("perpus_user")`),
    testUser,
    "the test identity should remain available after auth initialization",
  );

  async function navigateTo(route) {
    await cdp.evaluate(`(() => {
      history.pushState({}, "", ${JSON.stringify(route)});
    })()`);
    await waitForBrowser(
      cdp,
      `window.location.pathname === ${JSON.stringify(route)} && Boolean(document.querySelector(".vireon-workspace .vireon-page-title"))`,
      `the ${route} admin page`,
    );
  }

  async function setTheme(theme) {
    const currentTheme = await cdp.evaluate(
      `document.documentElement.classList.contains("dark") ? "dark" : "light"`,
    );
    if (currentTheme !== theme) {
      const buttonTitle = theme === "dark" ? "Mode Gelap" : "Mode Terang";
      const buttonSelector = `.vireon-workspace main > header button[title="${buttonTitle}"]`;
      const clicked = await cdp.evaluate(`(() => {
        const button = document.querySelector(${JSON.stringify(buttonSelector)});
        if (!button) return false;
        button.click();
        return true;
      })()`);
      assert.equal(clicked, true, `the ${theme} theme toggle should be available`);
    }

    await waitForBrowser(
      cdp,
      `document.documentElement.classList.contains(${JSON.stringify(theme)}) && localStorage.getItem("perpus-theme") === ${JSON.stringify(theme)}`,
      `the ${theme} theme to apply`,
    );
    await sleep(300); // Allow workspace/input color transitions to reach their final values.
  }

  const snapshotExpression = `(${themeSnapshot.toString()})()`;
  let dashboardBadgeContrast = null;

  for (const route of routes) {
    await navigateTo(route);
    await setTheme("light");
    const light = await cdp.evaluate(snapshotExpression);

    assert.ok(light, `${route} should render the shell, title, supporting text, card, sidebar, and input`);
    assert.equal(light.theme, "light");
    assert.equal(light.colorScheme, "light");
    assert.equal(light.workspaceSurface, "rgb(245, 243, 237)", "the existing light workspace palette should be preserved");
    assert.ok(light.headingContrast >= 7, `${route} light title contrast was ${light.headingContrast}:1`);
    // The existing light palette is a fixed visual baseline; preserve it while
    // requiring dark-mode supporting text to meet the stricter 4.5:1 floor.
    assert.ok(light.secondaryContrast >= 4, `${route} light supporting-text contrast was ${light.secondaryContrast}:1`);
    assert.ok(light.inputContrast >= 4.5, `${route} light input contrast was ${light.inputContrast}:1`);

    await setTheme("dark");
    const dark = await cdp.evaluate(snapshotExpression);

    assert.ok(dark, `${route} should keep the same workspace elements in dark mode`);
    assert.equal(dark.theme, "dark");
    assert.equal(dark.colorScheme, "dark");
    assert.equal(dark.workspaceSurface, "rgb(17, 29, 26)", "the authenticated workspace should use its dark surface");
    assert.notEqual(dark.sidebarSurface, light.sidebarSurface, `${route} sidebar should follow the selected theme`);
    assert.notEqual(dark.headerSurface, light.headerSurface, `${route} header should follow the selected theme`);
    assert.notEqual(dark.cardSurface, light.cardSurface, `${route} card should follow the selected theme`);
    assert.notEqual(dark.headingColor, light.headingColor, `${route} title should follow the selected theme`);
    assert.notEqual(dark.secondaryColor, light.secondaryColor, `${route} supporting text should follow the selected theme`);
    assert.notEqual(dark.inputSurface, light.inputSurface, `${route} input surface should follow the selected theme`);
    assert.ok(dark.headingContrast >= 7, `${route} dark title contrast was ${dark.headingContrast}:1`);
    assert.ok(dark.secondaryContrast >= 4.5, `${route} dark supporting-text contrast was ${dark.secondaryContrast}:1`);
    assert.ok(
      dark.inputContrast >= 4.5,
      `${route} dark input contrast was ${dark.inputContrast}:1 (${dark.inputColor} on ${dark.inputSurface})`,
    );
    assert.ok(
      dark.inputPlaceholderContrast >= 4.5,
      `${route} dark input-placeholder contrast was ${dark.inputPlaceholderContrast}:1 (${dark.inputPlaceholderColor} on ${dark.inputSurface})`,
    );

    if (route === "/dashboard" || route === "/borrowings") {
      assert.ok(light.badgeColor && dark.badgeColor, `${route} should render an actual amber status/metric badge`);
      assert.notEqual(dark.badgeColor, light.badgeColor, `${route} status text should follow the selected theme`);
      assert.notEqual(dark.badgeSurface, light.badgeSurface, `${route} status surface should remain distinct on each theme`);
      // Keep the established light badge palette; dark badges use the stricter 4.5:1 floor below.
      assert.ok(
        light.badgeContrast >= 2.5,
        `${route} light status badge contrast was ${light.badgeContrast}:1`,
      );
      assert.ok(
        dark.badgeContrast >= 4.5,
        `${route} dark status badge contrast was ${dark.badgeContrast}:1`,
      );
      if (route === "/dashboard") dashboardBadgeContrast = dark.badgeContrast;
    }
  }

  assert.ok(dashboardBadgeContrast >= 4.5, "the dashboard status badge should remain readable in dark mode");
});