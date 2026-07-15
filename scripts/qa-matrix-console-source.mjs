import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const frontend = resolve(root, "output/new-api-src/web/default");

function read(relativePath) {
  const absolutePath = resolve(root, relativePath);
  return existsSync(absolutePath) ? readFileSync(absolutePath, "utf8") : "";
}

function collectSourceFiles(directory) {
  if (!existsSync(directory)) return [];

  return readdirSync(directory).flatMap((entry) => {
    const absolutePath = resolve(directory, entry);
    if (statSync(absolutePath).isDirectory())
      return collectSourceFiles(absolutePath);
    return [".css", ".html", ".js", ".json", ".ts", ".tsx"].includes(
      extname(entry),
    )
      ? [absolutePath]
      : [];
  });
}

const compose = read("docker-compose.yml");
const presets = read(
  "output/new-api-src/web/default/src/styles/theme-presets.css",
);
const customization = read(
  "output/new-api-src/web/default/src/lib/theme-customization.ts",
);
const commandMenu = read(
  "output/new-api-src/web/default/src/components/command-menu.tsx",
);
const topupHook = read(
  "output/new-api-src/web/default/src/features/wallet/hooks/use-topup-info.ts",
);
const syncI18n = read("output/new-api-src/web/default/scripts/sync-i18n.mjs");
const nginx = read("nginx/nginx.conf");
const provenance = read("docs/new-api-source-provenance.md");
const upstreamNotice = read("output/new-api-src/NOTICE");
const productionEnvExample = read(".env.production.example");
const bootstrap = read("scripts/bootstrap-new-api.mjs");
const databaseBootstrap = read("scripts/bootstrap-new-api-db.sh");
const modelSyncGuide = read("docs/MODEL_SYNC_GUIDE.md");
const migrationGuide = read("docs/new-api-migration.md");
const securityReviewedFiles = [
  "README.md",
  "PROJECT_HANDOFF.md",
  "docs/MODEL_SYNC_GUIDE.md",
  "docs/new-api-migration.md",
  "scripts/bootstrap-new-api.mjs",
  "scripts/bootstrap-new-api-db.sh",
].map(read);
const referralRoute = resolve(
  frontend,
  "src/routes/_authenticated/referral/index.tsx",
);
const matrixPresetLocales = ["en", "zh", "fr", "ru", "ja", "vi"];

function trackedFilesWithSecretShape() {
  const tracked = execFileSync("git", ["ls-files", "-z"], {
    cwd: root,
    encoding: "buffer",
  })
    .toString("utf8")
    .split("\0")
    .filter(Boolean);
  const placeholderPattern =
    /(?:change-me|example|fixture|placeholder|test-|demo-|dummy|your-|xxx|abcdef|123456)/i;

  function containsSecretShape(source) {
    if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(source))
      return true;
    if (/sk-[A-Za-z0-9_-]{32,}/.test(source)) return true;

    const upstreamAssignmentPattern =
      /UPSTREAM_API_KEY\s*=\s*["'`]?([^\s"'`\\]{12,})/gi;
    return [...source.matchAll(upstreamAssignmentPattern)].some((match) => {
      const value = match[1];
      return (
        !placeholderPattern.test(value) &&
        !value.startsWith("$") &&
        !value.startsWith("<") &&
        !value.startsWith("[") &&
        !value.includes("process.env")
      );
    });
  }

  return tracked.filter((relativePath) => {
    const normalizedPath = relativePath.replaceAll("\\", "/");
    if (
      normalizedPath.startsWith(".agents/") ||
      normalizedPath.startsWith(".claude/") ||
      normalizedPath.startsWith(".claude-flow/") ||
      /(?:^|\/)(?:test|tests|fixtures)(?:\/|$)/i.test(normalizedPath) ||
      /(?:\.spec|\.test)\.[cm]?[jt]sx?$/i.test(normalizedPath)
    )
      return false;
    const absolutePath = resolve(root, relativePath);
    if (!existsSync(absolutePath) || statSync(absolutePath).size > 2_000_000)
      return false;
    try {
      return containsSecretShape(readFileSync(absolutePath, "utf8"));
    } catch {
      return false;
    }
  });
}

const trackedSecretFiles = trackedFilesWithSecretShape();

function hasTranslatedMatrixPreset(locale) {
  const localeSource = read(
    `output/new-api-src/web/default/src/i18n/locales/${locale}.json`,
  );

  try {
    const translations = JSON.parse(localeSource).translation;
    const label = translations?.["preset.matrix"];
    return label === "MatrixAPI";
  } catch {
    return false;
  }
}

function countOccurrences(source, value) {
  return source.split(value).length - 1;
}

const canonicalRoutes = [
  "/dashboard",
  "/dashboard/overview",
  "/keys",
  "/wallet",
  "/profile",
  "/channels",
  "/models/metadata",
  "/models/deployments",
  "/users",
  "/redemption-codes",
  "/subscriptions",
  "/system-info",
  "/system-settings",
];

function redirectsCanonicalRouteToConsole(route) {
  const escapedRoute = route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const locationPattern = new RegExp(
    `location\\s+=?\\s*${escapedRoute.replace(/\\\/$/, "")}\\/?\\s*\\{([\\s\\S]*?)\\}`,
    "i",
  );
  const block = nginx.match(locationPattern)?.[1] ?? "";
  return /return\s+30[1278]\s+\/console(?:\/|\s|;)/i.test(block);
}

const frontendSource = collectSourceFiles(resolve(frontend, "src"))
  .map((file) => readFileSync(file, "utf8"))
  .join("\n");

const contracts = [
  {
    name: "local new-api image build context",
    pass: /build:\s*[\s\S]*?context:\s*\.\/output\/new-api-src/.test(compose),
  },
  {
    name: "MatrixAPI remains based on attributed new-api source",
    pass:
      provenance.includes("https://github.com/QuantumNous/new-api.git") &&
      provenance.includes("All upstream copyright headers") &&
      upstreamNotice.includes("new-api Notices") &&
      upstreamNotice.includes("QuantumNous and contributors"),
  },
  {
    name: "Kukuai is the configured model upstream",
    pass:
      productionEnvExample.includes(
        "UPSTREAM_BASE_URL=https://kukuai.fyi",
      ) &&
      bootstrap.includes("https://kukuai.fyi") &&
      bootstrap.includes("kukuai-upstream") &&
      databaseBootstrap.includes("https://kukuai.fyi") &&
      databaseBootstrap.includes("kukuai-upstream") &&
      modelSyncGuide.includes("https://kukuai.fyi/v1") &&
      migrationGuide.includes("https://kukuai.fyi"),
  },
  {
    name: "Bblabu is documented only as the replica reference",
    pass:
      migrationGuide.includes("https://api.bblabu.chat/") &&
      migrationGuide.includes("replica reference") &&
      bootstrap.includes(
        "name === 'bblabu-upstream' || name === upstreamChannelName",
      ) &&
      bootstrap.includes("'https://api.bblabu.chat',") &&
      countOccurrences(bootstrap, "bblabu-upstream") === 1 &&
      countOccurrences(bootstrap, "api.bblabu.chat") === 1 &&
      databaseBootstrap.includes(
        "lower(trim(name)) in ('bblabu-upstream', 'kukuai-upstream')",
      ) &&
      databaseBootstrap.includes("'https://api.bblabu.chat',") &&
      countOccurrences(databaseBootstrap, "bblabu-upstream") === 1 &&
      countOccurrences(databaseBootstrap, "api.bblabu.chat") === 1 &&
      !productionEnvExample.includes("api.bblabu.chat") &&
      !modelSyncGuide.includes("api.bblabu.chat") &&
      ![compose, nginx, frontendSource].some((source) =>
        /api\.bblabu\.(?:chat|cn)/i.test(source),
      ),
  },
  {
    name: "Model upstream credentials stay out of tracked guides",
    pass: !/UPSTREAM_API_KEY=sk-[A-Za-z0-9_-]{12,}/.test(modelSyncGuide),
  },
  {
    name: "Runtime and formal docs contain no upstream credentials",
    pass:
      !securityReviewedFiles.some((source) =>
        /(?:sk-[A-Za-z0-9_-]{12,}|<UPSTREAM_API_KEY>\.\.\.[A-Za-z0-9_-]+)/.test(
          source,
        ),
      ) && trackedSecretFiles.length === 0,
  },
  {
    name: "Matrix theme preset",
    pass: presets.includes("[data-theme-preset='matrix']"),
  },
  {
    name: "Matrix theme is the default",
    pass: /DEFAULT_THEME_CUSTOMIZATION[\s\S]*?preset:\s*['"]matrix['"]/.test(
      customization,
    ),
  },
  {
    name: "command menu uses role-filtered sidebar view",
    pass:
      commandMenu.includes("useRoleFilteredNavGroups") &&
      !commandMenu.includes("useSidebarData") &&
      !commandMenu.includes("@/context/search-provider"),
  },
  {
    name: "referral route exists",
    pass: existsSync(referralRoute),
  },
  {
    name: "wallet applies MatrixAPI payment filtering",
    pass: topupHook.includes("filterMatrixPaymentMethods"),
  },
  {
    name: "canonical routes stay on the native frontend",
    pass: canonicalRoutes.every(
      (route) => !redirectsCanonicalRouteToConsole(route),
    ),
  },
  ...matrixPresetLocales.map((locale) => ({
    name: `Matrix theme preset is translated in ${locale}`,
    pass: hasTranslatedMatrixPreset(locale),
  })),
  {
    name: "MatrixAPI is protected as an i18n brand literal",
    pass: syncI18n.includes("  'MatrixAPI',"),
  },
  {
    name: "reference business branding is absent",
    pass: !/(?:https?:\/\/)?(?:www\.)?api\.bblabu\.chat/i.test(frontendSource),
  },
];

const failures = contracts
  .filter((contract) => !contract.pass)
  .map((contract) => contract.name);
const report = {
  pass: failures.length === 0,
  failures,
  ...(trackedSecretFiles.length > 0 ? { trackedSecretFiles } : {}),
  contracts: Object.fromEntries(
    contracts.map((contract) => [contract.name, contract.pass]),
  ),
};

const output = JSON.stringify(report, null, 2);
if (failures.length > 0) {
  console.error(output);
  process.exit(1);
}

console.log(output);
