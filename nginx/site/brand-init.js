(function () {
  const MATRIX = {
    name: 'Matrix API',
    origin: 'https://matrixapi.online',
    docs: '/docs',
    logo: '/matrix-assets/matrixapi-logo.png?v=2026071419',
    favicon: '/matrix-assets/matrixapi-favicon.png?v=2026071421',
  };

  const NATIVE_APP_ROUTE_PATTERN = /^(?:\/$|\/(?:pricing|sign-up|dashboard|keys|usage-logs|wallet|referral|profile|channels|models|users|redemption-codes|subscriptions|system-info|system-settings|console|playground)(?:\/|$))/;
  const COLD_START_TIMEOUT_MS = 15000;

  function isNativeReactRoute() {
    return NATIVE_APP_ROUTE_PATTERN.test(location.pathname);
  }

  function installColdStartStyle() {
    if (!document.head || document.querySelector('style[data-matrix-cold-start-style]')) return;
    const style = document.createElement('style');
    style.dataset.matrixColdStartStyle = 'true';
    style.textContent = [
      '.matrix-cold-start-shell{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:24px;background:linear-gradient(135deg,#fff4f9 0%,#f7f3ff 48%,#eef7ff 100%);color:#31283e;font-family:"Public Sans",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}',
      '.matrix-cold-start-card{width:min(420px,100%);padding:28px;border:1px solid rgba(176,133,185,.24);border-radius:22px;background:rgba(255,255,255,.86);box-shadow:0 18px 54px rgba(113,78,132,.14);backdrop-filter:blur(20px)}',
      '.matrix-cold-start-brand{font-size:18px;font-weight:800;margin-bottom:10px}',
      '.matrix-cold-start-text{margin:0;color:#71667f;font-size:14px;line-height:1.7}',
      '.matrix-cold-start-bar{height:4px;margin-top:22px;overflow:hidden;border-radius:999px;background:rgba(137,111,154,.12)}',
      '.matrix-cold-start-bar::before{content:"";display:block;width:42%;height:100%;background:linear-gradient(90deg,#f074bd,#b65bce,#6aa9ef);animation:matrixColdStart 1.4s ease-in-out infinite}',
      '@keyframes matrixColdStart{0%{transform:translateX(-110%)}100%{transform:translateX(260%)}}',
      '@media(prefers-reduced-motion:reduce){.matrix-cold-start-bar::before{animation:none;width:100%}}',
      '.matrix-import-overlay{position:fixed;inset:0;z-index:1000000;display:grid;place-items:center;padding:20px;background:rgba(30,20,38,.5);backdrop-filter:blur(10px)}',
      '.matrix-import-modal{width:min(920px,100%);max-height:min(760px,calc(100svh - 40px));overflow:auto;border:1px solid rgba(177,137,190,.3);border-radius:22px;background:#fff;padding:22px;box-shadow:0 28px 80px rgba(45,25,58,.28);color:#30263a}',
      '.matrix-import-modal>header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px}',
      '.matrix-import-modal h2,.matrix-import-modal p{margin:0}.matrix-import-modal header p{color:#9a4f83;font-size:12px;font-weight:700;text-transform:uppercase}',
      '.matrix-import-close{display:grid;place-items:center;width:34px;height:34px;border:1px solid #e8dbe9;border-radius:10px;background:#fff;color:#5d5067;font-size:20px}',
      '.matrix-token-field{display:grid;gap:7px;margin-bottom:12px;color:#65586f;font-size:13px;font-weight:600}',
      '.matrix-token-field input{width:100%;height:42px;border:1px solid #ddcfe0;border-radius:12px;padding:0 12px;background:#fffafd;color:#30263a;font:inherit}',
      '.matrix-import-note{margin-bottom:16px;color:#776b80;font-size:13px;line-height:1.6}',
      '.matrix-import-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}',
      '.matrix-import-card{display:grid;gap:5px;min-width:0;border:1px solid #eadfea;border-radius:14px;padding:14px;background:linear-gradient(135deg,#fffafd,#f7f5ff);color:#3c3046;text-decoration:none;transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease}',
      '.matrix-import-card:hover{transform:translateY(-1px);border-color:#d496bf;box-shadow:0 8px 22px rgba(132,82,128,.12)}',
      '.matrix-import-card span{color:#796d82;font-size:12px;line-height:1.45}',
      '.matrix-fallback-guide{display:grid;gap:16px;max-width:1120px;margin:24px auto;padding:22px;border:1px solid rgba(177,137,190,.28);border-radius:22px;background:rgba(255,255,255,.88);box-shadow:0 16px 42px rgba(90,58,108,.1);font-family:"Public Sans",system-ui,sans-serif}',
      '.matrix-fallback-guide h1,.matrix-fallback-guide p{margin:0}.matrix-fallback-guide p{color:#71667b;line-height:1.65}',
      '.matrix-fallback-links{display:flex;flex-wrap:wrap;gap:10px}.matrix-fallback-links a{border:1px solid #e4d4e4;border-radius:999px;padding:9px 14px;background:#fff;color:#6f3763;text-decoration:none;font-weight:650}',
      '.matrix-brand-logo{object-fit:contain!important;background:transparent!important;max-width:none!important}',
      '.home-brand .matrix-brand-logo{width:46px!important;height:46px!important}',
      '.auth-gate-brand .matrix-brand-logo{width:38px!important;height:38px!important}',
      '.brand .matrix-brand-logo{width:46px!important;height:46px!important}',
      '.matrix-app-header .matrix-brand-logo{width:23px!important;height:23px!important}',
      '[data-slot="sidebar-menu-button"] .matrix-brand-logo{width:34px!important;height:34px!important}',
      '@media(max-width:720px){.matrix-import-grid{grid-template-columns:1fr}.matrix-import-modal{padding:18px}.matrix-cold-start-card{padding:22px}}',
      '@media(prefers-color-scheme:dark){.matrix-cold-start-shell{background:linear-gradient(135deg,#241b2c,#1c1b2d 52%,#172433);color:#f8effa}.matrix-cold-start-card,.matrix-import-modal,.matrix-fallback-guide{border-color:rgba(222,169,215,.18);background:rgba(38,29,47,.94);color:#f5ebf7}.matrix-cold-start-text,.matrix-import-note,.matrix-import-card span,.matrix-fallback-guide p{color:#c0b2c7}.matrix-token-field input,.matrix-import-close{border-color:#57455f;background:#2c2234;color:#f5ebf7}.matrix-import-card{border-color:#55425e;background:linear-gradient(135deg,#302438,#28273d);color:#f5ebf7}.matrix-fallback-links a{border-color:#59445f;background:#302438;color:#f3b8df}}',
    ].join('');
    document.head.appendChild(style);
  }

  function installColdStartShell() {
    if (!isNativeReactRoute()) return;
    installColdStartStyle();

    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      const root = document.querySelector('#root');
      const shell = document.querySelector('[data-matrix-cold-start-shell]');
      if (!document.body || !root) {
        return;
      }

      const hasAppContent = root.children.length > 0 || (root.textContent || '').trim().length > 0;
      if (hasAppContent) {
        shell?.remove();
        window.clearInterval(interval);
        return;
      }

      if (!shell) {
        const node = document.createElement('div');
        node.className = 'matrix-cold-start-shell';
        node.dataset.matrixColdStartShell = 'true';
        node.setAttribute('role', 'status');
        node.setAttribute('aria-live', 'polite');
        node.innerHTML = `
          <div class="matrix-cold-start-card">
            <div class="matrix-cold-start-brand">Matrix API</div>
            <p class="matrix-cold-start-text">Loading console assets. The first visit can take longer while static files warm up.</p>
            <div class="matrix-cold-start-bar" aria-hidden="true"></div>
          </div>
        `;
        root.insertAdjacentElement('afterend', node);
        if (Date.now() - startedAt >= COLD_START_TIMEOUT_MS) {
          node.dataset.matrixColdStartTimeout = 'true';
          node.setAttribute('role', 'alert');
          node.innerHTML = `
            <div class="matrix-cold-start-card">
              <div class="matrix-cold-start-brand">Matrix API</div>
              <p class="matrix-cold-start-text">Console assets are taking too long to load. Reload the page to try again.</p>
              <button type="button" class="matrix-import-close" data-matrix-cold-start-reload>Reload</button>
            </div>
          `;
          node.querySelector('[data-matrix-cold-start-reload]')?.addEventListener('click', () => window.location.reload());
        }
        return;
      }

      if (Date.now() - startedAt >= COLD_START_TIMEOUT_MS) {
        shell.dataset.matrixColdStartTimeout = 'true';
        shell.setAttribute('role', 'alert');
        shell.innerHTML = `
          <div class="matrix-cold-start-card">
            <div class="matrix-cold-start-brand">Matrix API</div>
            <p class="matrix-cold-start-text">Console assets are taking too long to load. Reload the page to try again.</p>
            <button type="button" class="matrix-import-close" data-matrix-cold-start-reload>Reload</button>
          </div>
        `;
        shell.querySelector('[data-matrix-cold-start-reload]')?.addEventListener('click', () => window.location.reload());
      }

    }, 120);
  }

  function mergeCachedBrand() {
    const brandPatch = {
      system_name: MATRIX.name,
      server_address: MATRIX.origin,
      docs_link: MATRIX.docs,
      logo: MATRIX.logo,
    };

    try {
      const current = JSON.parse(localStorage.getItem('status') || '{}');
      localStorage.setItem('status', JSON.stringify(Object.assign({}, current, brandPatch)));
    } catch (_) {
      localStorage.setItem('status', JSON.stringify(brandPatch));
    }

    localStorage.setItem('system_name', MATRIX.name);
    localStorage.setItem('server_address', MATRIX.origin);
    localStorage.setItem('docs_link', MATRIX.docs);
    localStorage.setItem('logo', MATRIX.logo);
  }

  function applyBrandSafety() {
    if (document.title) {
      document.title = document.title
        .replace(/\bNew API\b/gi, MATRIX.name)
        .replace(/\bnew-api\b/gi, MATRIX.name);
      if (!document.title.includes(MATRIX.name)) {
        document.title = `${MATRIX.name} | ${document.title}`;
      }
    }

    document.querySelectorAll('link[rel~="icon"]').forEach((link) => {
      link.href = MATRIX.favicon;
    });

    if (!document.querySelector('link[rel~="icon"]') && document.head) {
      const icon = document.createElement('link');
      icon.rel = 'icon';
      icon.type = 'image/png';
      icon.href = MATRIX.favicon;
      document.head.appendChild(icon);
    }

    document.querySelectorAll('img[alt="logo" i],img[alt="New API" i],img[alt="MatrixAPI" i],img[alt="Matrix API" i]').forEach((image) => {
      image.src = MATRIX.logo;
      image.alt = MATRIX.name;
      image.classList.add('matrix-brand-logo');
    });

    document.querySelectorAll('link[rel="manifest"]').forEach((link) => {
      link.href = '/site.webmanifest?v=2026071421';
    });
    document.querySelectorAll('link[rel~="apple-touch-icon"]').forEach((link) => {
      link.href = MATRIX.favicon;
    });

    // Native React owns everything below #root. Do not rewrite its text nodes,
    // images, or children from this script; React may reconcile concurrently.
    // Static pages continue through the branding pass below.
    if (isNativeReactRoute()) return;

    if (document.body) {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        const parent = node.parentElement;
        if (!parent || /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA)$/i.test(parent.tagName)) continue;
        if (/\bNew API\b|\bnew-api\b|MatrixAPI/.test(node.nodeValue || '')) {
          node.nodeValue = (node.nodeValue || '')
            .replace(/\bNew API\b/gi, MATRIX.name)
            .replace(/\bnew-api\b/gi, MATRIX.name)
            .replace(/MatrixAPI/g, MATRIX.name);
        }
      }
    }
  }

  function encodeJson(value) {
    return encodeURIComponent(JSON.stringify(value));
  }

  function makeImportTargets(apiKey) {
    const baseV1 = `${MATRIX.origin}/v1`;
    const safeKey = apiKey || '';
    const ccswitch = (app) => {
      const params = new URLSearchParams({
        resource: 'provider',
        app,
        name: MATRIX.name,
        endpoint: baseV1,
        apiKey: safeKey,
        model: 'gpt-5.4',
        homepage: MATRIX.origin,
        enabled: 'true',
      });
      return `ccswitch://v1/import?${params.toString()}`;
    };
    const provider = {
      id: 'matrixapi',
      name: MATRIX.name,
      type: 'openai',
      provider: 'openai',
      apiKey: safeKey,
      apiHost: baseV1,
      baseURL: baseV1,
      model: 'gpt-5.4',
      models: ['gpt-5.4', 'gpt-5.5', 'gpt-5.4-openai-compact', 'gpt-5.5-openai-compact', 'gpt-image2'],
    };

    return [
      { name: 'CC Switch - Codex', hint: 'Provider import deep link', href: ccswitch('codex') },
      { name: 'CC Switch - Claude', hint: 'Provider import deep link', href: ccswitch('claude') },
      { name: 'CC Switch - Gemini', hint: 'Provider import deep link', href: ccswitch('gemini') },
      { name: 'Cherry Studio', hint: 'OpenAI-compatible provider import', href: `cherrystudio://providers/api-keys?v=1&data=${encodeJson({ providers: [provider] })}` },
      { name: 'AionUI', hint: 'Provider add link', href: `aionui://provider/add?v=1&data=${encodeJson(provider)}` },
      { name: 'DeepChat', hint: 'Provider install link', href: `deepchat://provider/install?v=1&data=${encodeJson(provider)}` },
      { name: 'Lobe Chat', hint: 'Open the local setup guide and copy the key manually', href: `${MATRIX.docs}#clients` },
      { name: 'AI as Workspace', hint: 'Open the local setup guide and copy the key manually', href: `${MATRIX.docs}#clients` },
      { name: 'AMA', hint: 'Desktop import link', href: `ama://set-api-key?server=${encodeURIComponent(MATRIX.origin)}&key=${encodeURIComponent(safeKey)}` },
      { name: 'OpenCat', hint: 'Team/provider join link', href: `opencat://team/join?domain=${encodeURIComponent(MATRIX.origin)}&token=${encodeURIComponent(safeKey)}` },
      { name: 'Fluent Read', hint: 'Open import guide', href: MATRIX.docs },
    ];
  }

  function createImportModal() {
    document.querySelector('[data-matrix-import-modal]')?.remove();
    installColdStartStyle();

    const overlay = document.createElement('div');
    overlay.className = 'matrix-import-overlay';
    overlay.dataset.matrixImportModal = 'true';
    overlay.innerHTML = `
      <section class="matrix-import-modal" role="dialog" aria-modal="true" aria-labelledby="matrix-import-title">
        <header>
          <div><p>Matrix API Client Import</p><h2 id="matrix-import-title">Import client configuration</h2></div>
          <button type="button" class="matrix-import-close" aria-label="Close">x</button>
        </header>
        <label class="matrix-token-field"><span>Full API key</span><input type="password" autocomplete="off" placeholder="Paste the full API key" /></label>
        <div class="matrix-import-note">Base URL: <strong>${MATRIX.origin}/v1</strong>. MatrixAPI does not send your key to external websites; local app deep links are generated only after you choose an import target.</div>
        <div class="matrix-import-grid"></div>
      </section>
    `;

    const input = overlay.querySelector('input');
    const grid = overlay.querySelector('.matrix-import-grid');
    const render = () => {
      grid.innerHTML = makeImportTargets(input.value.trim()).map((target) => `
        <a class="matrix-import-card" href="${target.href}" target="_blank" rel="noreferrer">
          <strong>${target.name}</strong><span>${target.hint}</span>
        </a>
      `).join('');
    };

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay || event.target.closest('.matrix-import-close')) overlay.remove();
    });
    overlay.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') overlay.remove();
    });
    input.addEventListener('input', render);
    document.body.appendChild(overlay);
    render();
    window.setTimeout(() => input.focus(), 0);
  }

  function ensureTokenImportButton() {
    if (!/^\/(?:keys|console\/token)\/?$/.test(location.pathname)) return;
    const createButton = [...document.querySelectorAll('button')].find((button) =>
      /^(Create API Key|Add token|Add Token|Create token|New token|创建 API 密钥|创建令牌|添加令牌)$/i.test((button.innerText || '').trim())
    );
    const toolbar = createButton?.parentElement;
    if (!toolbar || toolbar.querySelector('[data-matrix-token-import-all]')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = createButton.className;
    button.dataset.matrixTokenImportAll = 'true';
    button.dataset.slot = 'button';
    button.dataset.variant = 'outline';
    button.textContent = 'Import config';
    button.addEventListener('click', createImportModal);
    toolbar.insertBefore(button, createButton);
  }

  function injectFallbackGuide() {
    const isDeployment = /^\/(?:models\/deployments|console\/deployment)(?:-|\/|$)/.test(location.pathname);
    const isModels = /^\/(?:models\/metadata|console\/models)(?:-|\/|$)/.test(location.pathname);
    if (!isDeployment && !isModels) return;

    const selector = isDeployment ? '[data-matrix-deployment-guide]' : '[data-matrix-models-guide]';
    if (document.querySelector(selector)) return;
    const bodyText = (document.body?.innerText || '').replace(/\s+/g, ' ').trim();
    const root = document.querySelector('#root');
    const hasRenderedApp = root && (root.children.length > 0 || (root.textContent || '').trim().length > 0);
    if (hasRenderedApp || bodyText.length > 120) return;

    installColdStartStyle();
    const guide = document.createElement('section');
    guide.className = 'matrix-fallback-guide';
    if (isDeployment) {
      guide.dataset.matrixDeploymentGuide = 'true';
      guide.innerHTML = `
        <p>Matrix API Routing</p>
        <h1>Upstream models are connected through channel management</h1>
        <p>Configure upstream credentials, verify model metadata, then create a user API key for OpenAI-compatible requests.</p>
        <div class="matrix-fallback-links"><a href="/channels">Channels</a><a href="/models/metadata">Models</a><a href="/keys">API Keys</a></div>
      `;
    } else {
      guide.dataset.matrixModelsGuide = 'true';
      guide.innerHTML = `
        <p>Matrix API Models</p>
        <h1>Model metadata and routing</h1>
        <p>Review public pricing and connect available models to healthy upstream channels.</p>
        <div class="matrix-fallback-links"><a href="/pricing">Pricing</a><a href="/channels">Channels</a></div>
      `;
    }

    (document.querySelector('main') || root || document.body).appendChild(guide);
  }

  let patchQueued = false;
  function queueSafetyPatch() {
    if (patchQueued) return;
    patchQueued = true;
    window.requestAnimationFrame(() => {
      patchQueued = false;
      applyBrandSafety();
      ensureTokenImportButton();
      injectFallbackGuide();
    });
  }

  function boot() {
    mergeCachedBrand();
    installColdStartStyle();
    queueSafetyPatch();
    const observer = new MutationObserver(queueSafetyPatch);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  installColdStartShell();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
