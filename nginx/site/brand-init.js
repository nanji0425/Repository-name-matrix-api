(function () {
  const MATRIX = {
    name: 'MatrixAPI',
    origin: 'https://matrixapi.online',
    docs: '/docs',
    logo: '/matrix-assets/matrixapi-logo.png',
    favicon: '/matrix-assets/matrixapi-favicon.png',
    contact: '3315419516@qq.com',
    footer: 'MatrixAPI (c) 2026 | OpenAI Compatible Gateway | MatrixAPI-owned gateway | Contact: 3315419516@qq.com',
  };

  const statusPatch = {
    system_name: MATRIX.name,
    server_address: MATRIX.origin,
    docs_link: MATRIX.docs,
    logo: MATRIX.logo,
    footer_html: MATRIX.footer,
    quota_display_type: 'USD',
    display_in_currency: true,
    price: 0.1,
  };

  function mergeStatus() {
    try {
      const current = JSON.parse(localStorage.getItem('status') || '{}');
      localStorage.setItem('status', JSON.stringify(Object.assign({}, current, statusPatch)));
    } catch (_) {
      localStorage.setItem('status', JSON.stringify(statusPatch));
    }

    localStorage.setItem('system_name', statusPatch.system_name);
    localStorage.setItem('server_address', statusPatch.server_address);
    localStorage.setItem('docs_link', statusPatch.docs_link);
    localStorage.setItem('logo', statusPatch.logo);
    localStorage.setItem('footer_html', statusPatch.footer_html);
    localStorage.setItem('quota_display_type', statusPatch.quota_display_type);
    localStorage.setItem('display_in_currency', 'true');

    if (!localStorage.getItem('matrix-lang')) localStorage.setItem('matrix-lang', localStorage.getItem('locale') || 'zh');
    localStorage.setItem('locale', localStorage.getItem('matrix-lang') || 'zh');
    if (!localStorage.getItem('theme-mode')) localStorage.setItem('theme-mode', 'light');
  }

  function handleLoginPayload(payload) {
    const user = payload?.data || payload?.user || payload;
    if (!user || Number(user.role) < 100) return false;
    try {
      localStorage.setItem('uid', String(user.id || ''));
      localStorage.setItem('user', JSON.stringify(user));
      sessionStorage.setItem('matrix-admin-login-redirected', 'true');
    } catch (_) {}
    window.setTimeout(() => {
      if (!/\/console\b/.test(location.pathname)) window.location.replace('/console');
    }, 80);
    return true;
  }

  function installAdminLoginRedirectHook() {
    if (window.__matrixAdminLoginHookInstalled) return;
    window.__matrixAdminLoginHookInstalled = true;

    const nativeFetch = window.fetch;
    if (typeof nativeFetch === 'function') {
      window.fetch = async function matrixFetch(input, init) {
        const response = await nativeFetch.apply(this, arguments);
        const url = typeof input === 'string' ? input : input?.url || '';
        if (/\/api\/user\/login\b/.test(url)) {
          response.clone().json().then((json) => {
            if (json?.success) handleLoginPayload(json);
          }).catch(() => {});
        }
        return response;
      };
    }

    const NativeXHR = window.XMLHttpRequest;
    if (NativeXHR && NativeXHR.prototype) {
      const nativeOpen = NativeXHR.prototype.open;
      const nativeSend = NativeXHR.prototype.send;
      NativeXHR.prototype.open = function matrixXhrOpen(method, url) {
        this.__matrixLoginRequest = /\/api\/user\/login\b/.test(String(url || ''));
        return nativeOpen.apply(this, arguments);
      };
      NativeXHR.prototype.send = function matrixXhrSend() {
        if (this.__matrixLoginRequest) {
          this.addEventListener('load', () => {
            try {
              const json = JSON.parse(this.responseText || '{}');
              if (json?.success) handleLoginPayload(json);
            } catch (_) {}
          });
        }
        return nativeSend.apply(this, arguments);
      };
    }
  }

  function injectStyles() {
    document.querySelectorAll('link[rel~="icon"],link[rel="apple-touch-icon"]').forEach((link) => {
      if (link.dataset.matrixFavicon !== 'true') link.remove();
    });
    let icon = document.querySelector('link[data-matrix-favicon][rel~="icon"]');
    if (!icon) {
      icon = document.createElement('link');
      icon.rel = 'icon';
      icon.dataset.matrixFavicon = 'true';
      document.head.appendChild(icon);
    }
    icon.type = 'image/png';
    icon.href = MATRIX.favicon;

    let apple = document.querySelector('link[data-matrix-favicon][rel="apple-touch-icon"]');
    if (!apple) {
      apple = document.createElement('link');
      apple.rel = 'apple-touch-icon';
      apple.dataset.matrixFavicon = 'true';
      document.head.appendChild(apple);
    }
    apple.href = '/matrix-assets/apple-touch-icon.png';

    const needsConsoleTheme = /\/console\b/.test(location.pathname);
    document.querySelectorAll('link[data-matrix-console-theme]').forEach((link) => {
      if (!needsConsoleTheme) link.remove();
    });
    if (needsConsoleTheme && !document.querySelector('link[data-matrix-console-theme]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/matrix-assets/matrix-console.css?v=2026070809';
      link.dataset.matrixConsoleTheme = 'true';
      document.head.appendChild(link);
    }

    if (!document.querySelector('style[data-matrix-hotfix]')) {
      const style = document.createElement('style');
      style.dataset.matrixHotfix = 'true';
      style.textContent = [
        '.classic-frontend-deprecation-banner{display:none!important}',
        '.semi-dropdown,.semi-popover,.semi-modal,.semi-portal{z-index:99999!important}',
        '.semi-dropdown-wrapper,.semi-popover-wrapper{overflow:visible!important}',
      ].join('');
      document.head.appendChild(style);
    }
  }

  function injectColdStartStyle() {
    if (!document.head || document.querySelector('style[data-matrix-cold-start-style]')) return;
    const style = document.createElement('style');
    style.dataset.matrixColdStartStyle = 'true';
    style.textContent = [
      '.matrix-cold-start-shell{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;background:linear-gradient(180deg,#070b14,#0b1120);color:#f4f7ff;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}',
      '.matrix-cold-start-card{width:min(420px,calc(100vw - 48px));padding:28px;border:1px solid rgba(255,255,255,.09);border-radius:8px;background:rgba(13,20,34,.9);box-shadow:0 24px 64px rgba(0,0,0,.45);backdrop-filter:blur(18px)}',
      '.matrix-cold-start-brand{font-size:18px;font-weight:900;letter-spacing:0;margin-bottom:10px}',
      '.matrix-cold-start-text{margin:0;color:#a7b2cf;font-size:14px;line-height:1.7}',
      '.matrix-cold-start-bar{height:3px;margin-top:22px;overflow:hidden;border-radius:999px;background:rgba(255,255,255,.08)}',
      '.matrix-cold-start-bar::before{content:"";display:block;width:42%;height:100%;background:linear-gradient(90deg,#55d6ff,#9a7cff,#ee72d0);animation:matrixColdStart 1.4s ease-in-out infinite}',
      '@keyframes matrixColdStart{0%{transform:translateX(-110%)}100%{transform:translateX(260%)}}',
    ].join('');
    document.head.appendChild(style);
  }

  function installColdStartShell() {
    if (!/(?:\/console|\/pricing)\b/.test(location.pathname)) return;
    injectColdStartStyle();

    const start = Date.now();
    const interval = window.setInterval(() => {
      const root = document.querySelector('#root');
      const shell = document.querySelector('[data-matrix-cold-start-shell]');
      if (!document.body || !root) {
        if (Date.now() - start > 15000) window.clearInterval(interval);
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
            <div class="matrix-cold-start-brand">MatrixAPI</div>
            <p class="matrix-cold-start-text">Loading dashboard assets. The first visit can take longer while static files warm up.</p>
            <div class="matrix-cold-start-bar" aria-hidden="true"></div>
          </div>
        `;
        root.insertAdjacentElement('afterend', node);
      }

      if (Date.now() - start > 45000) window.clearInterval(interval);
    }, 120);
  }

  function syncThemeAttributes() {
    const theme = localStorage.getItem('theme-mode') || localStorage.getItem('matrix-theme') || 'light';
    document.documentElement.setAttribute('theme-mode', theme);
    document.body.setAttribute('theme-mode', theme);
    document.body.classList.toggle('light', theme === 'light');
    document.documentElement.style.colorScheme = theme === 'light' ? 'light' : 'dark';
  }

  function patchVisibleText(root) {
    const walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT);
    const replacements = [
      [/\u74ba\u5ba0\u6d46\u9352\u7668s*ZPay\s*\u93c0\ue219\u7caf\u7039\u6fc7\u6579\u95be\u8dfa\u5f74/g, 'Open Alipay cashier'],
      [/ZPay\s*\u93c0\ue219\u7caf\u7039\u6fc7\u6579\u95be\u8dfa\u5f74/g, 'Alipay cashier'],
      [/Stripe\/Creem[^\n]*/g, 'Alipay capacity packs are opened by MatrixAPI operations. No third-party product ID is required.'],
      [/Stripe|Creem/g, 'Alipay'],
      [/New API(?! \(AGPLv3\))/g, 'MatrixAPI'],
    ];

    while (walker.nextNode()) {
      const node = walker.currentNode;
      let text = node.nodeValue;
      const original = text;
      replacements.forEach(([pattern, value]) => {
        text = text.replace(pattern, value);
      });
      if (text !== original) node.nodeValue = text;
    }
  }

  function patchLinks() {
    document.querySelectorAll('button,[role="button"]').forEach((element) => {
      element.classList.add('matrix-clickable');
    });
    document.querySelectorAll('a[href]').forEach((link) => {
      link.classList.add('matrix-clickable');
      if (link.getAttribute('role') === 'button' && link.getAttribute('href') !== '#') {
        link.removeAttribute('role');
      }
    });

    document.querySelectorAll('a[href*="docx.kkkliao.cn"]').forEach((link) => {
      link.setAttribute('href', MATRIX.docs);
      link.removeAttribute('target');
      link.removeAttribute('rel');
    });

    document.querySelectorAll('a[href="/docs"],a[href="/docs/"]').forEach((link) => {
      link.removeAttribute('target');
      link.removeAttribute('rel');
    });

    document.querySelectorAll('a[href="/user-agreement"],a[href="/privacy-policy"]').forEach((link) => {
      link.removeAttribute('target');
      link.removeAttribute('rel');
    });

    document.querySelectorAll('a[href="/about"],a[href="/about/"]').forEach((link) => {
      link.remove();
    });

    document.querySelectorAll('a[href="/"]').forEach((link) => {
      if ((link.innerText || link.textContent || '').trim() || link.getAttribute('aria-label')) return;
      link.setAttribute('aria-label', 'MatrixAPI home');
      link.setAttribute('title', 'MatrixAPI home');
    });

    document.querySelectorAll('a[href="/"],a[href=""]').forEach((link) => {
      if (/Console/i.test(link.textContent || '')) link.setAttribute('href', '/console');
    });
  }

  function patchBrandImages() {
    document.querySelectorAll('img').forEach((image) => {
      const alt = image.getAttribute('alt') || '';
      const src = image.getAttribute('src') || '';
      const nearby = image.closest('a,header,.semi-navigation-header')?.textContent || '';
      if (/new-api|New API/i.test(alt) || /logo|favicon|icon/i.test(src) || /MatrixAPI|New API/i.test(nearby)) {
        image.src = MATRIX.logo;
        image.alt = 'MatrixAPI';
      }
    });
  }

  function labelIconButtons() {
    document.querySelectorAll('button').forEach((button) => {
      if (button.getAttribute('aria-label') || button.getAttribute('title')) return;
      const text = (button.innerText || button.textContent || '').trim();
      if (text && text !== 'common.changeLanguage') return;

      let label = '';
      if (button.querySelector('.lucide-search')) label = 'Search';
      if (button.querySelector('.lucide-copy')) label = 'Copy';
      if (button.querySelector('svg')) label = 'Action';
      if (button.querySelector('[aria-label="chevron_left"]')) label = 'Scroll left';
      if (button.querySelector('[aria-label="chevron_right"]')) label = 'Scroll right';
      if (button.querySelector('.lucide-refresh-cw,.lucide-rotate-cw,[data-icon="spin"]')) label = 'Refresh';
      if (button.getAttribute('aria-haspopup') === 'true' || button.querySelector('[aria-label="tree_triangle_down"]')) label = 'More actions';
      if (button.querySelector('.lucide-sun,.lucide-moon') || /theme/i.test(text)) label = 'Switch theme';
      if (text === 'common.changeLanguage') {
        button.hidden = true;
        button.setAttribute('aria-hidden', 'true');
        button.setAttribute('tabindex', '-1');
        return;
      }
      if (!label) return;
      button.setAttribute('aria-label', label);
      button.setAttribute('title', label);
    });
  }

  function patchLanguageButton() {
    const buttons = [...document.querySelectorAll('button')];
    buttons.forEach((button) => {
      const text = (button.innerText || button.textContent || '').trim();
      if (text !== 'common.changeLanguage' && button.dataset.matrixLangPatched !== 'true') return;
      button.dataset.matrixLangPatched = 'true';
      button.hidden = true;
      button.setAttribute('aria-hidden', 'true');
      button.setAttribute('tabindex', '-1');
    });
  }

  function labelCopyActions() {
    document.querySelectorAll('.semi-typography-action-copy-icon').forEach((element) => {
      element.setAttribute('role', 'button');
      element.setAttribute('aria-label', 'Copy');
      element.setAttribute('title', 'Copy');
      element.classList.add('matrix-clickable');
    });
  }

  function applyLocaleText() {
    const locale = localStorage.getItem('matrix-lang') || localStorage.getItem('locale') || 'zh';
    localStorage.setItem('locale', locale);
    document.documentElement.lang = locale.startsWith('zh') ? 'zh-CN' : 'en';
    document.querySelectorAll('[data-matrix-locale]').forEach((element) => {
      const zh = element.getAttribute('data-zh') || '';
      const en = element.getAttribute('data-en') || zh;
      element.textContent = locale.startsWith('zh') ? zh : en;
    });
  }

  function injectConsoleSwitches() {
    if (!/\/console\b/.test(location.pathname)) return;
    document.querySelector('[data-matrix-console-switches]')?.remove();
    applyLocaleText();
  }

  function currentUser() {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}') || {};
    } catch (_) {
      return {};
    }
  }

  function isAdminUser() {
    const user = currentUser();
    return Number(user.role) >= 100 || user.role === 'ADMIN' || user.is_admin === true || user.isAdmin === true;
  }

  function redirectAdminAfterLogin() {
    if (!/^\/(login|signin|sign-in)\/?$/i.test(location.pathname)) return;
    if (!isAdminUser()) return;
    if (sessionStorage.getItem('matrix-admin-login-redirected') === 'true') return;
    sessionStorage.setItem('matrix-admin-login-redirected', 'true');
    window.location.replace('/console');
  }

  function injectAdminCenter() {
    if (!/\/console\b/.test(location.pathname) || !isAdminUser()) return;
    const compact = !/^\/console\/?$/i.test(location.pathname);
    const existing = document.querySelector('[data-matrix-admin-center]');
    if (existing && existing.dataset.matrixAdminCompact === String(compact)) {
      keepAdminCenterFirst(existing);
      return;
    }
    existing?.remove();

    const main = document.querySelector('main,.semi-layout-content,#root > div') || document.body;
    const panel = document.createElement('section');
    panel.className = `matrix-subscription-guide matrix-admin-center${compact ? ' matrix-admin-center-compact' : ''}`;
    panel.dataset.matrixAdminCenter = 'true';
    panel.dataset.matrixAdminCompact = String(compact);
    panel.innerHTML = `
      <div class="matrix-admin-brand">
        <img src="${MATRIX.logo}" alt="MatrixAPI" />
        <div>
          <strong>MatrixAPI</strong>
          <span>${compact ? 'Admin shortcuts for this console page' : 'Admin operations console'}</span>
        </div>
      </div>
      <div class="matrix-subscription-hero">
        <p>MatrixAPI Admin Center</p>
        <h2>Operations, users, routing, models, billing, and site settings</h2>
        <span>Admin accounts can review all users, inspect gateway status, manage upstream channels and models, issue redemption codes, check subscriptions, and update website configuration from the console.</span>
      </div>
      <div class="matrix-subscription-grid">
        <article>
          <strong>Users</strong>
          <span>View user accounts, status, quota, request counts, groups, and administrative access.</span>
          <a href="/console/user" data-matrix-admin-link="users">Open users</a>
        </article>
        <article>
          <strong>Site status</strong>
          <span>Review logs, task status, token traffic, model availability, and the OpenAI-compatible /v1 gateway.</span>
          <a href="/console/log" data-matrix-admin-link="logs">Open logs</a>
        </article>
        <article>
          <strong>Channels</strong>
          <span>Manage upstream base URLs, keys, priorities, weights, health checks, and model routing.</span>
          <a href="/console/channel" data-matrix-admin-link="channels">Open channels</a>
        </article>
        <article>
          <strong>Models</strong>
          <span>Maintain model names, endpoint families, tags, prices, and public model gallery visibility.</span>
          <a href="/console/models" data-matrix-admin-link="models">Open models</a>
        </article>
        <article>
          <strong>Billing</strong>
          <span>Control top-up settings, redemption codes, subscriptions, and Alipay-only payment behavior.</span>
          <a href="/console/redemption" data-matrix-admin-link="billing">Open billing tools</a>
        </article>
        <article>
          <strong>Website settings</strong>
          <span>Update brand, docs route, navigation modules, announcements, FAQ, and system options.</span>
          <a href="/console/setting" data-matrix-admin-link="settings">Open settings</a>
        </article>
      </div>
    `;
    const adminCenter = main.querySelector('[data-matrix-admin-center]');
    if (adminCenter) adminCenter.insertAdjacentElement('afterend', panel);
    else main.prepend(panel);
  }

  function encodeJson(value) {
    return encodeURIComponent(JSON.stringify(value));
  }

  function makeImportTargets(apiKey) {
    const base = MATRIX.origin;
    const baseV1 = `${base}/v1`;
    const safeKey = apiKey || '';
    const ccswitch = (app) => {
      const params = new URLSearchParams({
        resource: 'provider',
        app,
        name: MATRIX.name,
        endpoint: baseV1,
        apiKey: safeKey,
        model: 'gpt-5.4',
        homepage: base,
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
      { name: 'CC Switch - Codex', hint: 'Official provider import deep link', href: ccswitch('codex') },
      { name: 'CC Switch - Claude', hint: 'Official provider import deep link', href: ccswitch('claude') },
      { name: 'CC Switch - Gemini', hint: 'Official provider import deep link', href: ccswitch('gemini') },
      { name: 'Cherry Studio', hint: 'OpenAI-compatible provider import', href: `cherrystudio://providers/api-keys?v=1&data=${encodeJson({ providers: [provider] })}` },
      { name: 'AionUI', hint: 'Provider add link', href: `aionui://provider/add?v=1&data=${encodeJson(provider)}` },
      { name: 'DeepChat', hint: 'Provider install link', href: `deepchat://provider/install?v=1&data=${encodeJson(provider)}` },
      { name: 'Lobe Chat', hint: 'Hosted example with MatrixAPI settings', href: `https://chat-preview.lobehub.com/?settings=${encodeJson({ keyVaults: { openai: { apiKey: safeKey, baseURL: baseV1 } } })}` },
      { name: 'AI as Workspace', hint: 'OpenAI-compatible provider setup', href: `https://aiaw.app/set-provider?provider=${encodeJson({ type: 'openai', settings: { apiKey: safeKey, baseURL: baseV1, compatibility: 'strict' } })}` },
      { name: 'AMA', hint: 'Desktop import link', href: `ama://set-api-key?server=${encodeURIComponent(base)}&key=${encodeURIComponent(safeKey)}` },
      { name: 'OpenCat', hint: 'Team/provider join link', href: `opencat://team/join?domain=${encodeURIComponent(base)}&token=${encodeURIComponent(safeKey)}` },
      { name: 'Fluent Read', hint: 'Open import guide', href: MATRIX.docs },
    ];
  }

  function createImportModal(initialKey) {
    document.querySelector('[data-matrix-import-modal]')?.remove();

    const overlay = document.createElement('div');
    overlay.className = 'matrix-import-overlay';
    overlay.dataset.matrixImportModal = 'true';
    overlay.innerHTML = `
      <section class="matrix-import-modal" role="dialog" aria-modal="true" aria-labelledby="matrix-import-title">
        <header>
          <div>
            <p>MatrixAPI Client Import</p>
            <h2 id="matrix-import-title">Import client configuration</h2>
          </div>
          <button type="button" class="matrix-import-close" aria-label="Close">x</button>
        </header>
        <label class="matrix-token-field">
          <span>Full API key</span>
          <input type="password" autocomplete="off" placeholder="Paste sk-... or the full token. Masked token rows cannot be imported directly." />
        </label>
        <div class="matrix-import-note">Base URL: <strong>${MATRIX.origin}/v1</strong>. If the token list only shows a masked value, copy the full token from the token action or the new-token dialog, then paste it here.</div>
        <div class="matrix-import-grid"></div>
      </section>
    `;

    const input = overlay.querySelector('input');
    const grid = overlay.querySelector('.matrix-import-grid');
    input.value = initialKey && !initialKey.includes('*') ? initialKey : '';

    function render() {
      grid.innerHTML = makeImportTargets(input.value.trim()).map((target) => `
        <a class="matrix-import-card" href="${target.href}" target="_blank" rel="noreferrer">
          <strong>${target.name}</strong>
          <span>${target.hint}</span>
        </a>
      `).join('');
    }

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay || event.target.closest('.matrix-import-close')) overlay.remove();
    });
    input.addEventListener('input', render);
    document.body.appendChild(overlay);
    render();
    setTimeout(() => input.focus(), 0);
  }

  function findTokenFromRow(button) {
    const row = button.closest('tr,.semi-table-row');
    if (!row) return '';
    const match = (row.innerText || '').match(/[A-Za-z0-9_-]{4,}\*{3,}[A-Za-z0-9_-]{3,}|sk-[A-Za-z0-9_-]{12,}/);
    return match ? match[0] : '';
  }

  function injectTokenImportButtons() {
    if (!/\/console\/token\b/.test(location.pathname)) return;

    const addButton = [...document.querySelectorAll('button')].find((button) => /^(�������|Add token|Add Token|Create token|New token|Token)$/i.test((button.innerText || '').trim()));
    const toolbar = addButton?.parentElement;
    if (toolbar && !toolbar.querySelector('[data-matrix-token-import-all]')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'semi-button semi-button-tertiary semi-button-size-small semi-button-light matrix-clickable matrix-token-import-button';
      button.dataset.matrixTokenImportAll = 'true';
      button.textContent = 'Import config';
      button.addEventListener('click', () => createImportModal(''));
      toolbar.appendChild(button);
    }

    document.querySelectorAll('tr,.semi-table-row').forEach((row) => {
      const rowText = row.innerText || '';
      const hasEdit = /�༭|Edit/i.test(rowText);
      const hasDelete = /ɾ��|Delete/i.test(rowText);
      if (!hasEdit || !hasDelete || row.querySelector('[data-matrix-token-import-row]')) return;
      const editButton = [...row.querySelectorAll('button')].find((button) => /^(�༭|Edit)$/i.test((button.innerText || '').trim()));
      if (!editButton || !editButton.parentElement) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `${editButton.className} matrix-token-import-button`;
      button.dataset.matrixTokenImportRow = 'true';
      button.textContent = 'Import';
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        createImportModal(findTokenFromRow(button));
      });
      editButton.parentElement.insertBefore(button, editButton);
    });
  }



  function ensureTokenImportButtons() {
    if (!/\/console\/token\b/.test(location.pathname)) return;
    try {
      injectTokenImportButtons();
    } catch (_) {}

    const addButton = [...document.querySelectorAll('button')].find((button) => {
      const text = (button.innerText || button.textContent || '').trim();
      return text === '\u6dfb\u52a0\u4ee4\u724c' || /^(Add token|Add Token|Create token|New token|Token)$/i.test(text);
    });
    const toolbar = addButton?.parentElement;
    if (toolbar && !toolbar.querySelector('[data-matrix-token-import-all]')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'semi-button semi-button-tertiary semi-button-size-small semi-button-light matrix-clickable matrix-token-import-button';
      button.dataset.matrixTokenImportAll = 'true';
      button.textContent = 'Import config';
      button.addEventListener('click', () => createImportModal(''));
      toolbar.appendChild(button);
    }

    document.querySelectorAll('tr,.semi-table-row').forEach((row) => {
      const rowText = row.innerText || '';
      if (!/\u7f16\u8f91|Edit/i.test(rowText) || !/\u5220\u9664|Delete/i.test(rowText)) return;
      if (row.querySelector('[data-matrix-token-import-row]')) return;
      const editButton = [...row.querySelectorAll('button')].find((candidate) => {
        const text = (candidate.innerText || candidate.textContent || '').trim();
        return text === '\u7f16\u8f91' || /^Edit$/i.test(text);
      });
      if (!editButton || !editButton.parentElement) return;
      const rowButton = document.createElement('button');
      rowButton.type = 'button';
      rowButton.className = editButton.className + ' matrix-token-import-button';
      rowButton.dataset.matrixTokenImportRow = 'true';
      rowButton.textContent = 'Import';
      rowButton.addEventListener('click', (event) => {
        event.stopPropagation();
        createImportModal(findTokenFromRow(rowButton));
      });
      editButton.parentElement.insertBefore(rowButton, editButton);
    });
  }
  function injectSubscriptionGuide() {
    if (!/\/console\/subscription\b/.test(location.pathname)) return;
    if (document.querySelector('[data-matrix-subscription-guide]')) return;

    const main = document.querySelector('main,.semi-layout-content') || document.body;
    const panel = document.createElement('section');
    panel.className = 'matrix-subscription-guide';
    panel.dataset.matrixSubscriptionGuide = 'true';
    panel.innerHTML = `
      <div class="matrix-subscription-hero">
        <p>MatrixAPI Capacity Packs</p>
        <h2>Capacity plans</h2>
        <span>Only Alipay top-up is enabled. Capacity plans are opened by MatrixAPI operations after confirmation.</span>
      </div>
      <div class="matrix-subscription-grid">
        <article>
          <strong>Starter 50</strong>
          <span>Default 50 concurrency and RPM 3000 for personal development, client setup, and small-team testing.</span>
          <a href="/wallet">Alipay top-up</a>
        </article>
        <article>
          <strong>Scale 200</strong>
          <span>For stable business integration, batch tasks, and team token sharing. Email support after top-up.</span>
          <a href="mailto:3315419516@qq.com?subject=MatrixAPI%20Scale%20200%20capacity%20plan">Contact support</a>
        </article>
        <article>
          <strong>Enterprise</strong>
          <span>Custom routing, white-label setup, dedicated upstream pools, team settlement, and higher concurrency.</span>
          <a href="mailto:3315419516@qq.com?subject=MatrixAPI%20Enterprise%20capacity%20plan">Enterprise support</a>
        </article>
      </div>
    `;

    const firstCard = [...document.querySelectorAll('.semi-card,.semi-table-container')]
      .find((element) => /Stripe|Creem|\u6682\u65e0\u8ba2\u9605\u5957\u9910/.test(element.innerText || ''));
    if (firstCard) firstCard.classList.add('matrix-subscription-native');
    main.prepend(panel);
    keepAdminCenterFirst(panel);
  }

  function keepAdminCenterFirst(adminCenter) {
    if (!adminCenter || adminCenter.dataset.matrixAdminCompact !== 'true') return;
    const guide = document.querySelector('[data-matrix-models-guide],[data-matrix-subscription-guide],[data-matrix-deployment-guide]');
    if (!guide) return;
    const position = guide.compareDocumentPosition(adminCenter);
    if ((position & Node.DOCUMENT_POSITION_FOLLOWING) === 0) return;
    guide.parentElement?.insertBefore(adminCenter, guide);
  }

  function syncTopupAmount() {
    if (!/\/console\/topup\b/.test(location.pathname)) return;
    const input = [...document.querySelectorAll('input')]
      .find((item) => /��ֵ����|amount|topup|recharge|quantity/i.test(`${item.placeholder || ''} ${item.name || ''} ${item.getAttribute('aria-label') || ''}`)
        || item.closest('label,.semi-form-field,.semi-input-wrapper')?.innerText?.includes('��ֵ����'));
    if (!input) return;

    const quantity = Number(input.value || 0);
    const price = Number(statusPatch.price || JSON.parse(localStorage.getItem('status') || '{}')?.price || 0.1);
    const amount = Number.isFinite(quantity * price) ? quantity * price : 0;
    const display = Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(/\.?0+$/, '');

    const host = input.closest('.semi-form-field,.semi-space,.semi-card,section,div') || input.parentElement;
    if (!host) return;
    let indicator = host.querySelector('[data-matrix-topup-amount]');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.dataset.matrixTopupAmount = 'true';
      indicator.className = 'matrix-topup-amount';
      input.closest('.semi-input-wrapper')?.insertAdjacentElement('afterend', indicator) || input.insertAdjacentElement('afterend', indicator);
    }
    indicator.textContent = `Actual payment: ${display} CNY`;
  }

  function injectDeploymentGuide() {
    if (!/\/console\/deployment\b/.test(location.pathname)) return;
    if (document.querySelector('[data-matrix-deployment-guide]')) return;

    const main = document.querySelector('main,.semi-layout-content') || document.body;
    const panel = document.createElement('section');
    panel.className = 'matrix-subscription-guide matrix-deployment-guide';
    panel.dataset.matrixDeploymentGuide = 'true';
    panel.innerHTML = `
      <div class="matrix-subscription-hero">
        <p>MatrixAPI Routing</p>
        <h2>Upstream models are connected through channel management</h2>
        <span>This site uses the kukuai upstream channel and the OpenAI-compatible gateway. The deployment page is reserved for self-hosted model hosting; daily API traffic should use channels, models, and tokens.</span>
      </div>
      <div class="matrix-subscription-grid">
        <article>
          <strong>Channel management</strong>
          <span>Review kukuai-upstream, priority, weight, available groups, and channel health.</span>
          <a href="/console/channel">Open channels</a>
        </article>
        <article>
          <strong>Model management</strong>
          <span>Maintain model gallery content, billing types, tags, endpoints, and available groups.</span>
          <a href="/console/models">Open models</a>
        </article>
        <article>
          <strong>Token calls</strong>
          <span>Create an API key, then call gpt-5.4, gpt-5.5, and image models through https://matrixapi.online/v1.</span>
          <a href="/console/token">Create token</a>
        </article>
      </div>
    `;
    main.prepend(panel);
  }

  function injectModelsGuide() {
    if (!/\/console\/models\b/.test(location.pathname)) return;
    if (document.querySelector('[data-matrix-models-guide]')) return;

    const main = document.querySelector('main,.semi-layout-content') || document.body;
    const panel = document.createElement('section');
    panel.className = 'matrix-subscription-guide matrix-models-guide';
    panel.dataset.matrixModelsGuide = 'true';
    panel.innerHTML = `
      <div class="matrix-subscription-hero">
        <p>MatrixAPI Models</p>
        <h2>Model gallery content and real routing are managed separately</h2>
        <span>This page maintains user-facing model descriptions, tags, ratios, and groups. Real API calls go through channel management, token management, and the /v1 OpenAI-compatible endpoint.</span>
      </div>
      <div class="matrix-subscription-grid">
        <article>
          <strong>Model gallery</strong>
          <span>Review public models, input/output pricing, tags, endpoint types, and available groups.</span>
          <a href="/pricing">Open model gallery</a>
        </article>
        <article>
          <strong>Channel routing</strong>
          <span>The kukuai-upstream channel handles real calls. Priority, weight, and health are maintained in channel management.</span>
          <a href="/console/channel">Open channel management</a>
        </article>
        <article>
          <strong>Call tokens</strong>
          <span>Tokens control quota, available models, groups, and client import configuration.</span>
          <a href="/console/token">Open token management</a>
        </article>
      </div>
    `;
    main.prepend(panel);
  }

  function injectDeploymentGuideFallback() {
    if (!/\/console\/deployment\b/.test(location.pathname)) return false;
    const bodyText = (document.body?.innerText || '').replace(/\s+/g, ' ');
    if (!/页面未找到|page not found|not found/i.test(bodyText)) return false;
    if (document.querySelector('[data-matrix-deployment-fallback]')) return true;

    document.title = 'MatrixAPI Deployment';
    document.body.innerHTML = `
      <header class="shell nav is-app-shell">
        <a class="brand" href="/" aria-label="MatrixAPI home">
          <img src="${MATRIX.logo}" alt="MatrixAPI" />
          <span>MatrixAPI Center</span>
        </a>
        <nav class="nav-links" aria-label="Main navigation">
          <a href="/">Home</a>
          <a href="/console" aria-current="page">Console</a>
          <a href="/pricing">Model Plaza</a>
          <a href="/rankings">Rankings</a>
          <a href="/docs">Docs</a>
        </nav>
        <div class="nav-tools">
          <span class="avatar-badge" aria-label="Account ${(currentUser().username || 'Guest').slice(0, 1).toUpperCase()}">${(currentUser().username || 'G').slice(0, 1).toUpperCase()}</span>
        </div>
      </header>
      <main class="shell" data-matrix-deployment-fallback>
        <section class="matrix-subscription-guide matrix-deployment-guide" style="margin-top:24px;">
          <div class="matrix-subscription-hero">
            <p>MatrixAPI Routing</p>
            <h2>Upstream models are connected through channel management</h2>
            <span>This site uses the kukuai upstream channel and the OpenAI-compatible gateway. The deployment page is reserved for self-hosted model hosting; daily API traffic should use channels, models, and tokens.</span>
          </div>
          <div class="matrix-subscription-grid">
            <article>
              <strong>Channel management</strong>
              <span>Review kukuai-upstream, priority, weight, available groups, and channel health.</span>
              <a href="/console/channel">Open channels</a>
            </article>
            <article>
              <strong>Model management</strong>
              <span>Maintain model gallery content, billing types, tags, endpoints, and available groups.</span>
              <a href="/console/models">Open models</a>
            </article>
            <article>
              <strong>Token calls</strong>
              <span>Create an API key, then call gpt-5.4, gpt-5.5, and image models through https://matrixapi.online/v1.</span>
              <a href="/console/token">Create token</a>
            </article>
          </div>
        </section>
      </main>
    `;
    return true;
  }

  function toast(message) {
    const old = document.querySelector('[data-matrix-toast]');
    if (old) old.remove();
    const node = document.createElement('div');
    node.className = 'matrix-toast';
    node.dataset.matrixToast = 'true';
    node.textContent = message;
    document.body.appendChild(node);
    setTimeout(() => node.classList.add('is-visible'), 20);
    setTimeout(() => {
      node.classList.remove('is-visible');
      setTimeout(() => node.remove(), 260);
    }, 2600);
  }

  function noticeState() {
    try {
      return JSON.parse(localStorage.getItem('matrix-notice-state') || '{}') || {};
    } catch (_) {
      return {};
    }
  }

  function saveNoticeState(state) {
    try {
      localStorage.setItem('matrix-notice-state', JSON.stringify(state || {}));
    } catch (_) {}
  }

  function shouldShowNotice() {
    return false;
  }

  function closeNoticeModal(action) {
    const overlay = document.querySelector('[data-matrix-notice-modal]');
    if (!overlay) return;
    overlay.remove();
    document.body.classList.remove('matrix-notice-open');
    if (!action) return;
    const state = noticeState();
    if (action === 'today') {
      const until = new Date();
      until.setHours(23, 59, 59, 999);
      state.until = until.getTime();
      state.hidden = false;
    } else if (action === 'forever') {
      state.hidden = true;
      state.until = 0;
    }
    saveNoticeState(state);
  }

  function injectAnnouncementModal() {
    return;
  }

  function suppressAnnouncementSurfaces() {
    document.querySelectorAll('[data-matrix-notice-modal],.matrix-notice-overlay').forEach((node) => node.remove());
    document.body?.classList.remove('matrix-notice-open');

    document.querySelectorAll('[role="dialog"],.semi-modal,.semi-modal-content,.semi-portal').forEach((node) => {
      const text = (node.innerText || node.textContent || '').replace(/\s+/g, ' ').trim();
      const isAnnouncement =
        /系统公告|公告|announcement|announcements|system notice|system update/i.test(text) &&
        !/import|导入|token|API key|apikey|redeem|payment|充值|login|登录|register|注册/i.test(text);
      if (isAnnouncement) {
        const root = node.closest('.semi-portal,.semi-modal-root,.semi-modal,.semi-modal-wrap') || node;
        root.remove();
      }
    });
  }

  function injectDashboardOverviewFallback() {
    if (!/^\/console\/overview\/?$/i.test(location.pathname)) return false;
    const bodyText = (document.body?.innerText || '').replace(/\s+/g, ' ');
    if (!/页面未找到|page not found|not found/i.test(bodyText)) return false;
    if (document.querySelector('[data-matrix-dashboard-overview]')) return true;

    const user = currentUser();
    const name = user.username || user.display_name || 'Guest';
    const role = Number(user.role) >= 100 ? 'Administrator' : 'User';
    document.title = 'MatrixAPI Dashboard Overview';
    const nav = `
      <header class="shell nav is-app-shell">
        <a class="brand" href="/" aria-label="MatrixAPI home">
          <img src="${MATRIX.logo}" alt="MatrixAPI" />
          <span>MatrixAPI Center</span>
        </a>
        <nav class="nav-links" aria-label="Main navigation">
          <a href="/">Home</a>
          <a href="/console" aria-current="page">Console</a>
          <a href="/pricing">Model Plaza</a>
          <a href="/rankings">Rankings</a>
          <a href="/docs">Docs</a>
        </nav>
        <div class="nav-tools">
          <label class="nav-search" aria-label="Search">
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="7"></circle>
              <path d="M21 21l-4.3-4.3"></path>
            </svg>
            <input type="search" placeholder="Search" />
            <span class="nav-shortcut">⌘ K</span>
          </label>
          <span class="avatar-badge" aria-label="Account ${name}">${name.charAt(0).toUpperCase()}</span>
        </div>
      </header>`;

    const overview = `
      <main class="shell dashboard-shell" data-matrix-dashboard-overview>
        <aside class="dashboard-side" aria-label="Sidebar">
          <h4>General</h4>
          <a href="/console/overview" aria-current="page">Overview</a>
          <a href="/console/token">API Keys</a>
          <a href="/console/log">Usage Logs</a>
          <a href="/console/task">Task Logs</a>
          <h4>Console</h4>
          <a href="/console/user">Users</a>
          <a href="/console/channel">Channels</a>
          <a href="/console/models">Models</a>
          <a href="/console/setting">Settings</a>
        </aside>
        <section class="dashboard-main" style="display:grid; gap:18px; min-width:0;">
          <article class="hero" style="margin-top:0;">
            <div>
              <div class="hero-badges">
                <span class="pill">MatrixAPI dashboard</span>
                <span class="pill">${role}</span>
                <span class="pill">${name}</span>
              </div>
              <p class="eyebrow" style="margin-top:20px;">DASHBOARD OVERVIEW</p>
              <h1>MatrixAPI console overview</h1>
              <p>Review tokens, usage, models, billing, and routing from one place before you continue deeper into the console.</p>
              <div class="hero-actions">
                <a class="button primary" href="/console/token">Open tokens</a>
                <a class="button" href="/console/log">View logs</a>
                <a class="button" href="/wallet">Open wallet</a>
              </div>
            </div>
          </article>
          <div class="grid-4">
            <article class="feature"><strong>Tokens</strong><p>Create and manage API keys for clients and agents.</p></article>
            <article class="feature"><strong>Usage</strong><p>See request logs, cost, latency, and model mix.</p></article>
            <article class="feature"><strong>Routing</strong><p>Inspect channels, upstream health, and model mapping.</p></article>
            <article class="feature"><strong>Billing</strong><p>Open the wallet, check balance, and recharge with Alipay.</p></article>
          </div>
          <div class="grid-2">
            <article class="card">
              <h3>Quick links</h3>
              <div class="pill-row" style="margin-top:12px;">
                <a class="pill" href="/console/user">Users</a>
                <a class="pill" href="/console/channel">Channels</a>
                <a class="pill" href="/console/models">Models</a>
                <a class="pill" href="/console/setting">Settings</a>
              </div>
            </article>
            <article class="card">
              <h3>Next steps</h3>
              <p>Continue into the token, log, or channel pages once the overview is visible.</p>
            </article>
          </div>
        </section>
      </main>
      <footer class="shell">MatrixAPI (c) 2026 | OpenAI Compatible Gateway | MatrixAPI-owned gateway</footer>`;

    document.body.innerHTML = nav + overview;
    document.body.classList.add('matrix-dashboard-overview');
    window.setTimeout(() => {
      document.title = 'MatrixAPI Dashboard Overview';
    }, 0);
    return true;
  }

  function injectDashboardRouteFallback() {
    if (!/^\/console\/(token|log|subscription|personal|models|channel|redemption|setting|user|task)\/?$/i.test(location.pathname)) return false;
    const bodyText = (document.body?.innerText || '').replace(/\s+/g, ' ');
    if (!/页面未找到|page not found|not found|旧版前端即将停止维护|you need to enable javascript/i.test(bodyText)) return false;
    if (document.querySelector('[data-matrix-dashboard-route-fallback]')) return true;

    const user = currentUser();
    const name = user.username || user.display_name || 'Guest';
    const role = Number(user.role) >= 100 ? 'Administrator' : 'User';
    const route = location.pathname.split('/').pop() || 'dashboard';
    const titleMap = {
      token: ['Token management', 'Create and manage API keys for clients and agents.'],
      log: ['Usage logs', 'Review request records, cost, latency, and model mix.'],
      subscription: ['Subscription plans', 'Review capacity packs and payment options.'],
      personal: ['Personal center', 'Review account bindings and security settings.'],
      models: ['Model management', 'Inspect model routing, groups, tags, and billing.'],
      channel: ['Channel management', 'Inspect upstream health, weights, priorities, and groups.'],
      redemption: ['Redemption codes', 'Manage codes, quotas, and account credit grants.'],
      setting: ['Website settings', 'Adjust site options, routing notes, and billing labels.'],
      user: ['User management', 'Inspect user state, quota, and administrative access.'],
      task: ['Task logs', 'Review async task execution and job status.'],
    };
    const [heading, description] = titleMap[route] || ['Dashboard', 'MatrixAPI dashboard tools.'];

    document.title = `MatrixAPI ${heading}`;
    document.body.innerHTML = `
      <header class="shell nav is-app-shell">
        <a class="brand" href="/" aria-label="MatrixAPI home">
          <img src="${MATRIX.logo}" alt="MatrixAPI" />
          <span>MatrixAPI Center</span>
        </a>
        <nav class="nav-links" aria-label="Main navigation">
          <a href="/">Home</a>
          <a href="/console" aria-current="page">Console</a>
          <a href="/pricing">Model Plaza</a>
          <a href="/rankings">Rankings</a>
          <a href="/docs">Docs</a>
        </nav>
        <div class="nav-tools">
          <span class="avatar-badge" aria-label="Account ${name}">${name.charAt(0).toUpperCase()}</span>
        </div>
      </header>
      <main class="shell dashboard-shell" data-matrix-dashboard-route-fallback>
        <aside class="dashboard-side" aria-label="Sidebar">
          <h4>General</h4>
          <a href="/console/overview">Overview</a>
          <a href="/console/token"${route === 'token' ? ' aria-current="page"' : ''}>API Keys</a>
          <a href="/console/log"${route === 'log' ? ' aria-current="page"' : ''}>Usage Logs</a>
          <a href="/console/task"${route === 'task' ? ' aria-current="page"' : ''}>Task Logs</a>
          <h4>Console</h4>
          <a href="/console/user"${route === 'user' ? ' aria-current="page"' : ''}>Users</a>
          <a href="/console/channel"${route === 'channel' ? ' aria-current="page"' : ''}>Channels</a>
          <a href="/console/models"${route === 'models' ? ' aria-current="page"' : ''}>Models</a>
          <a href="/console/setting"${route === 'setting' ? ' aria-current="page"' : ''}>Settings</a>
          <a href="/console/deployment"${route === 'deployment' ? ' aria-current="page"' : ''}>Deployment</a>
        </aside>
        <section class="dashboard-main" style="display:grid; gap:18px; min-width:0;">
          <article class="hero" style="margin-top:0;">
            <div>
              <div class="hero-badges">
                <span class="pill">MatrixAPI dashboard</span>
                <span class="pill">${role}</span>
                <span class="pill">${name}</span>
              </div>
              <p class="eyebrow" style="margin-top:20px;">${heading.toUpperCase()}</p>
              <h1>${heading}</h1>
              <p>${description}</p>
              <div class="hero-actions">
                <a class="button primary" href="/sign-in">Sign in</a>
                <a class="button" href="/console/overview">Open overview</a>
                <a class="button" href="/wallet">Open wallet</a>
              </div>
            </div>
          </article>
          <div class="grid-3">
            <article class="feature"><strong>Access</strong><p>Use the admin account to unlock the full console experience.</p></article>
            <article class="feature"><strong>Routing</strong><p>Exact dashboard routes stay inside MatrixAPI-owned pages.</p></article>
            <article class="feature"><strong>Billing</strong><p>Wallet top-up remains on the same domain and same tab.</p></article>
          </div>
        </section>
      </main>
    `;
    return true;
  }

  function apiInfoCardFor(element) {
    let current = element;
    for (let depth = 0; current && depth < 12; depth += 1) {
      const text = current.innerText || '';
      if (text.length > 900) return null;
      if ((text.includes('mailto:') || text.includes(MATRIX.contact) || text.includes('Support Email')) && text.includes(MATRIX.contact)) return current;
      if (text.includes('OpenAI Compatible API') || text.includes('Import Guides') || text.includes('Token Console') || text.includes('Pricing Center')) return null;
      current = current.parentElement;
    }
    return null;
  }

  async function copyText(value) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (_) {
      const input = document.createElement('input');
      input.value = value;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      const ok = document.execCommand('copy');
      input.remove();
      return ok;
    }
  }

  function handleNativeSwitchClick(event) {
    const button = event.target.closest?.('button');
    if (!button) return;

    if (button.dataset.matrixThemeButton === 'true') {
      const current = localStorage.getItem('theme-mode') || localStorage.getItem('matrix-theme') || 'light';
      const next = current === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme-mode', next);
      localStorage.setItem('matrix-theme', next);
      syncThemeAttributes();
      toast(next === 'light' ? 'Light theme enabled' : 'Dark theme enabled');
      return;
    }

    if (button.dataset.matrixNoticeButton === 'true') {
      event.preventDefault();
      event.stopPropagation();
      toast('No new notifications.');
      return;
    }

    if (button.dataset.matrixLanguageButton === 'true') {
      event.preventDefault();
      event.stopPropagation();
      const current = localStorage.getItem('matrix-lang') || localStorage.getItem('locale') || 'zh';
      const next = current.startsWith('zh') ? 'en' : 'zh';
      localStorage.setItem('locale', next);
      localStorage.setItem('matrix-lang', next);
      button.textContent = next.startsWith('zh') ? 'EN' : 'ZH';
      button.setAttribute('aria-label', next.startsWith('zh') ? 'Switch to English' : 'Switch to Chinese');
      button.setAttribute('title', button.getAttribute('aria-label'));
      applyLocaleText();
      toast(next === 'zh' ? 'Language switched to Chinese' : 'Language switched to English');
    }
  }

  function patchApiInfoActions() {
    if (!/\/console\b/.test(location.pathname)) return;
    const actionPattern = /jump|open|copy|test|\u8df3\u8f6c|\u6253\u5f00|\u590d\u5236|\u6d4b\u8bd5|\u6d4b\u901f|\u6aa2\u6e2c|\u68c0\u6d4b|\u5a34\u5b2e/i;
    const containers = [...document.querySelectorAll('.semi-card,.semi-list-item,.semi-descriptions,.semi-row,.semi-col,section,div')]
      .filter((element) => {
        const text = element.innerText || '';
        return text.includes(MATRIX.contact) || text.includes(`mailto:${MATRIX.contact}`) || text.includes('Support Email');
      })
      .filter((element) => (element.innerText || '').length < 900)
      .sort((a, b) => (a.innerText || '').length - (b.innerText || '').length);

    containers.slice(0, 4).forEach((container) => {
      [...container.querySelectorAll('a,button,.semi-tag,[role="button"]')].forEach((element) => {
        const text = (element.innerText || element.textContent || element.getAttribute('aria-label') || element.getAttribute('title') || '').trim();
        if (!/^(\u6d4b\u901f|\u8df3\u8f6c|\u6d4b\u8bd5|\u590d\u5236|\u6253\u5f00|Speed test|Jump|Open|Copy)$/i.test(text) && !actionPattern.test(text)) return;
        if (text.length > 24) return;
        const isOpenAction = /jump|open|\u8df3\u8f6c|\u6253\u5f00/i.test(text);
        element.setAttribute('role', element.getAttribute('role') || 'button');
        element.setAttribute('tabindex', element.getAttribute('tabindex') || '0');
        element.dataset.matrixMailAction = isOpenAction ? 'open' : 'copy';
        if (element.tagName === 'A') element.setAttribute('href', isOpenAction ? `mailto:${MATRIX.contact}` : '#');
      });
    });

    document.querySelectorAll('a,button,.semi-tag,[role="button"]').forEach((element) => {
      const text = (element.innerText || element.textContent || '').trim();
      if (text.length > 24) return;
      const isOpenAction = /jump|open|\u8df3\u8f6c|\u6253\u5f00|\u74ba\u5ba0\u6d46/i.test(text);
      const isCopyAction = /copy|test|\u590d\u5236|\u6d4b\u8bd5|\u6d4b\u901f|\u5a34\u5b2e/i.test(text);
      if (!isOpenAction && !isCopyAction) return;
      const card = apiInfoCardFor(element);
      if (!card) return;
      element.setAttribute('role', element.getAttribute('role') || 'button');
      element.setAttribute('tabindex', element.getAttribute('tabindex') || '0');
      element.dataset.matrixMailAction = isOpenAction ? 'open' : 'copy';
    });
  }

  function isThemeButton(button) {
    const text = (button.innerText || button.textContent || '').trim();
    const label = `${text} ${button.getAttribute('aria-label') || ''} ${button.getAttribute('title') || ''}`;
    return /�л�����|switch theme|theme/i.test(label) || Boolean(button.querySelector('.lucide-sun,.lucide-moon'));
  }

  function isLanguageButton(button) {
    const text = (button.innerText || button.textContent || '').trim();
    const label = `${text} ${button.getAttribute('aria-label') || ''} ${button.getAttribute('title') || ''}`;
    return /common\.changeLanguage|switch language|�л�����/i.test(label);
  }

  function patchNativeSwitchButtons() {
    document.querySelectorAll('button').forEach((button) => {
      const text = (button.innerText || button.textContent || '').trim();
      if (text === 'common.changeLanguage') {
        button.hidden = true;
        button.setAttribute('aria-hidden', 'true');
        button.setAttribute('tabindex', '-1');
        return;
      }
      const label = `${text} ${button.getAttribute('aria-label') || ''} ${button.getAttribute('title') || ''}`.trim();
      if (isThemeButton(button)) {
        button.dataset.matrixThemeButton = 'true';
        button.setAttribute('aria-label', 'Switch theme');
        button.setAttribute('title', 'Switch theme');
        button.classList.add('matrix-clickable');
      }
      if (/^(Notifications|通知)$/i.test(text) || /\bNotifications\b/i.test(label)) {
        button.hidden = true;
        button.setAttribute('aria-hidden', 'true');
        button.setAttribute('tabindex', '-1');
      }
      if (/^(Display|显示器)$/i.test(text) || /\bDisplay\b/i.test(label)) {
        button.dataset.matrixThemeButton = 'true';
        button.setAttribute('aria-label', 'Switch theme');
        button.setAttribute('title', 'Switch theme');
        button.classList.add('matrix-clickable');
      }
      if (isLanguageButton(button)) {
        button.hidden = true;
        button.setAttribute('aria-hidden', 'true');
        button.setAttribute('tabindex', '-1');
      }
    });
  }

  function patchAccountMenuButtons() {
    document.querySelectorAll('button').forEach((button) => {
      const text = (button.innerText || button.textContent || '').trim().replace(/\s+/g, ' ');
      if (!/^[A-Z]\s+[A-Za-z0-9_-]{2,32}$/.test(text)) return;
      button.dataset.matrixAccountMenuButton = 'true';
      button.setAttribute('aria-haspopup', 'menu');
      button.setAttribute('aria-label', 'Open account menu');
      button.setAttribute('title', 'Open account menu');
      button.classList.add('matrix-clickable');
    });
  }

  function closeAccountMenu() {
    document.querySelector('[data-matrix-account-menu]')?.remove();
  }

  function openAccountMenu(button) {
    closeAccountMenu();
    const user = currentUser();
    const name = user.username || user.display_name || (button.innerText || button.textContent || '').trim().replace(/^[A-Z]\s+/, '') || 'Account';
    const role = Number(user.role) >= 100 ? 'Administrator' : 'User';
    const menu = document.createElement('div');
    menu.className = 'matrix-account-menu';
    menu.dataset.matrixAccountMenu = 'true';
    menu.setAttribute('role', 'menu');
    menu.innerHTML = `
      <div class="matrix-account-menu-head">
        <strong>${name}</strong>
        <span>${role}</span>
      </div>
      <a role="menuitem" href="/console/personal">Personal settings</a>
      <a role="menuitem" href="/console/log">Usage logs</a>
      ${Number(user.role) >= 100 ? '<a role="menuitem" href="/console/user">User management</a><a role="menuitem" href="/console/setting">Website settings</a>' : ''}
      <button type="button" role="menuitem" data-matrix-logout>Sign out</button>
    `;
    document.body.appendChild(menu);
    const rect = button.getBoundingClientRect();
    const width = 240;
    menu.style.left = `${Math.max(12, Math.min(window.innerWidth - width - 12, rect.right - width))}px`;
    menu.style.top = `${Math.min(window.innerHeight - 12, rect.bottom + 10)}px`;
  }

  function handleApiInfoAction(event) {
    const target = event.target.closest?.('[data-matrix-mail-action]');
    if (!target) return;
    event.preventDefault();
    event.stopPropagation();

    const action = target.dataset.matrixMailAction;
    if (action === 'open') {
      window.location.href = `mailto:${MATRIX.contact}`;
      toast(`Opening email: ${MATRIX.contact}`);
      return;
    }

    copyText(MATRIX.contact).then((ok) => {
      toast(ok ? `Copied email: ${MATRIX.contact}` : `Email: ${MATRIX.contact}`);
    });
  }

  function handleAccountMenuClick(event) {
    const logout = event.target.closest?.('[data-matrix-logout]');
    if (logout) {
      event.preventDefault();
      event.stopPropagation();
      localStorage.removeItem('uid');
      localStorage.removeItem('user');
      localStorage.removeItem('status');
      closeAccountMenu();
      toast('Signed out');
      window.setTimeout(() => {
        window.location.href = '/sign-in';
      }, 350);
      return;
    }

    const button = event.target.closest?.('[data-matrix-account-menu-button]');
    if (button) {
      event.preventDefault();
      event.stopPropagation();
      if (document.querySelector('[data-matrix-account-menu]')) {
        closeAccountMenu();
      } else {
        openAccountMenu(button);
      }
      return;
    }

    if (!event.target.closest?.('[data-matrix-account-menu]')) closeAccountMenu();
  }

  function boot() {
    mergeStatus();
    installAdminLoginRedirectHook();
    injectStyles();
    syncThemeAttributes();
    patchVisibleText(document.body);
    patchLinks();
    patchBrandImages();
    labelIconButtons();
    patchNativeSwitchButtons();
    patchAccountMenuButtons();
    labelCopyActions();
    patchLanguageButton();
    injectConsoleSwitches();
    injectDashboardOverviewFallback();
    injectDashboardRouteFallback();
    redirectAdminAfterLogin();
    injectAdminCenter();
    ensureTokenImportButtons();
    injectSubscriptionGuide();
    syncTopupAmount();
    injectDeploymentGuide();
    injectDeploymentGuideFallback();
    injectModelsGuide();
    patchApiInfoActions();
    suppressAnnouncementSurfaces();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            patchVisibleText(node);
            patchLinks();
            patchBrandImages();
            labelIconButtons();
            patchNativeSwitchButtons();
            patchAccountMenuButtons();
            labelCopyActions();
            patchLanguageButton();
            injectConsoleSwitches();
            injectDashboardOverviewFallback();
            injectDashboardRouteFallback();
            redirectAdminAfterLogin();
            injectAdminCenter();
            ensureTokenImportButtons();
            injectSubscriptionGuide();
            syncTopupAmount();
            injectDeploymentGuide();
            injectDeploymentGuideFallback();
            injectModelsGuide();
            patchApiInfoActions();
            suppressAnnouncementSurfaces();
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('click', handleApiInfoAction, true);
    document.addEventListener('click', handleNativeSwitchClick, true);
    document.addEventListener('click', handleAccountMenuClick, true);
    window.addEventListener('storage', syncThemeAttributes);
    window.setInterval(injectStyles, 1600);
    window.setInterval(syncThemeAttributes, 1200);
    window.setInterval(() => patchVisibleText(document.body), 1600);
    window.setInterval(patchBrandImages, 1600);
    window.setInterval(labelIconButtons, 1600);
    window.setInterval(patchNativeSwitchButtons, 1600);
    window.setInterval(patchAccountMenuButtons, 1600);
    window.setInterval(labelCopyActions, 1600);
    window.setInterval(patchLanguageButton, 1600);
    window.setInterval(injectConsoleSwitches, 1600);
    window.setInterval(injectDashboardOverviewFallback, 1600);
    window.setInterval(injectDashboardRouteFallback, 1600);
    window.setInterval(redirectAdminAfterLogin, 1200);
    window.setInterval(injectAdminCenter, 1600);
    window.setInterval(ensureTokenImportButtons, 1600);
    window.setInterval(injectSubscriptionGuide, 1600);
    window.setInterval(syncTopupAmount, 600);
    window.setInterval(injectDeploymentGuide, 1600);
    window.setInterval(injectDeploymentGuideFallback, 1600);
    window.setInterval(injectModelsGuide, 1600);
    window.setInterval(patchApiInfoActions, 1600);
    window.setInterval(suppressAnnouncementSurfaces, 800);
  }

  if (document.readyState === 'loading') {
    installColdStartShell();
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    installColdStartShell();
    boot();
  }
})();

