'use client';

import { create } from 'zustand';

export type Locale = 'zh' | 'en';

type Dictionary = Record<string, { zh: string; en: string }>;

export const dictionary = {
  home: { zh: '首页', en: 'Home' },
  models: { zh: '模型广场', en: 'Models' },
  apiGateway: { zh: 'API 中转平台', en: 'API Gateway' },
  tools: { zh: '在线创作', en: 'Tools' },
  solutions: { zh: '解决方案', en: 'Solutions' },
  news: { zh: '资讯', en: 'News' },
  docs: { zh: '文档', en: 'Docs' },
  about: { zh: '关于', en: 'About' },
  console: { zh: '控制台', en: 'Console' },
  enterConsole: { zh: '进入控制台', en: 'Open Console' },
  admin: { zh: '管理后台', en: 'Admin' },
  login: { zh: '登录', en: 'Sign In' },
  register: { zh: '注册', en: 'Register' },
  loginRegister: { zh: '登录 / 注册', en: 'Sign In / Sign Up' },
  getApiKey: { zh: '获取 API Key', en: 'Get API Key' },
  logout: { zh: '退出登录', en: 'Sign Out' },
  accountMenu: { zh: '账户菜单', en: 'Account Menu' },
  themeLight: { zh: '切换到明亮模式', en: 'Switch to light mode' },
  themeDark: { zh: '切换到暗黑模式', en: 'Switch to dark mode' },
  language: { zh: '语言', en: 'Language' },
  switchEnglish: { zh: '切换到英文', en: 'Switch to English' },
  switchChinese: { zh: '切换到中文', en: 'Switch to Chinese' },
  overview: { zh: '总览', en: 'Overview' },
  apiKeys: { zh: 'API 密钥', en: 'API Keys' },
  usageLogs: { zh: '消费日志', en: 'Usage Logs' },
  taskLogs: { zh: '任务日志', en: 'Task Logs' },
  recharge: { zh: '充值', en: 'Recharge' },
  activity: { zh: '活动', en: 'Activity' },
  apiCopied: { zh: 'API 地址已复制', en: 'API URL copied' },
  copyFailed: { zh: '复制失败', en: 'Copy failed' },
  apiAddress: { zh: 'API 地址：', en: 'API URL:' },
  platformServices: { zh: '平台服务', en: 'Platform' },
  developerSupport: { zh: '开发者支持', en: 'Developers' },
  contactEmail: { zh: '联系邮箱：', en: 'Email:' },
  footerDesc: {
    zh: '企业级 AI 网关底座。一处接入，即可调用主流大模型、统一计费并集中管理密钥。',
    en: 'Enterprise-grade AI gateway infrastructure for accessing leading models through one unified API.',
  },
  pricing: { zh: '模型与定价', en: 'Models & Pricing' },
  apiRelay: { zh: 'API 中转服务', en: 'API Relay' },
  docsOfficial: { zh: 'API 官方文档', en: 'API Docs' },
  aboutUs: { zh: '关于我们', en: 'About Us' },
  latestNews: { zh: '最新资讯', en: 'Latest News' },
  privacy: { zh: '隐私政策', en: 'Privacy' },
  terms: { zh: '服务条款', en: 'Terms' },
  authLoginTitle: { zh: '欢迎回来', en: 'Welcome Back' },
  authRegisterTitle: { zh: '创建账户', en: 'Create Account' },
  authLoginDesc: { zh: '登录到你的 API 平台账户', en: 'Sign in to your API platform account' },
  authRegisterDesc: { zh: '注册 API 平台账户，立即获取 API Key', en: 'Create an API platform account and get an API key' },
  username: { zh: '用户名', en: 'Username' },
  password: { zh: '密码', en: 'Password' },
  confirmPassword: { zh: '确认密码', en: 'Confirm Password' },
  inviteCode: { zh: '邀请码（可选）', en: 'Invite Code (optional)' },
  rememberMe: { zh: '记住我', en: 'Remember me' },
  submitting: { zh: '正在提交...', en: 'Submitting...' },
  createAccount: { zh: '注册账号', en: 'Create Account' },
  hasAccount: { zh: '已有账号？', en: 'Already have an account?' },
  noAccount: { zh: '没有账户？', en: 'No account?' },
  usernamePlaceholder: { zh: '请输入用户名', en: 'Enter username' },
  passwordPlaceholder: { zh: '请输入密码', en: 'Enter password' },
  confirmPasswordPlaceholder: { zh: '请再次输入密码', en: 'Enter password again' },
  invitePlaceholder: { zh: '请输入邀请码（可选）', en: 'Enter invite code (optional)' },
  passwordMismatch: { zh: '两次输入的密码不一致', en: 'Passwords do not match' },
  registerSuccess: { zh: '注册成功', en: 'Registered successfully' },
  loginSuccess: { zh: '登录成功', en: 'Signed in successfully' },
  registerFailed: { zh: '注册失败', en: 'Registration failed' },
  loginFailed: { zh: '登录失败', en: 'Sign in failed' },
  adminOverview: { zh: '运营总览', en: 'Operations' },
  userManagement: { zh: '用户管理', en: 'Users' },
  keyAudit: { zh: '密钥审计', en: 'Key Audit' },
  modelManagement: { zh: '模型管理', en: 'Models' },
  providerChannels: { zh: '上游通道', en: 'Providers' },
  financeStats: { zh: '财务统计', en: 'Finance' },
  orderManagement: { zh: '订单管理', en: 'Orders' },
  commissionManagement: { zh: '佣金管理', en: 'Commissions' },
  announcementManagement: { zh: '公告管理', en: 'Announcements' },
  systemParams: { zh: '系统参数', en: 'System' },
  adminConsole: { zh: '管理员控制台', en: 'Admin Console' },
  validatingAdmin: { zh: '正在校验管理员权限...', en: 'Validating administrator access...' },
  backToDashboard: { zh: '返回用户控制台', en: 'Back to User Console' },
  adminCenter: { zh: 'MatrixAPI 管理中心', en: 'MatrixAPI Admin Center' },
  adminSubtitle: { zh: '统一管理运营、计费、上游通道与模型参数', en: 'Unified operations, billing, providers, and model settings' },
} satisfies Dictionary;

export type TranslationKey = keyof typeof dictionary;

interface LocaleState {
  locale: Locale;
  hasHydrated: boolean;
  hydrateLocale: () => void;
  toggleLocale: () => void;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

function readBrowserLocale(): Locale {
  if (typeof window === 'undefined') return 'zh';
  return localStorage.getItem('matrix_locale') === 'en' ? 'en' : 'zh';
}

function applyBrowserLocale(locale: Locale) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('matrix_locale', locale);
  document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
}

export const useLocaleStore = create<LocaleState>((set, get) => ({
  locale: 'zh',
  hasHydrated: false,
  hydrateLocale: () => {
    const locale = readBrowserLocale();
    applyBrowserLocale(locale);
    set({ locale, hasHydrated: true });
  },
  toggleLocale: () => {
    const next: Locale = get().locale === 'zh' ? 'en' : 'zh';
    applyBrowserLocale(next);
    set({ locale: next, hasHydrated: true });
  },
  setLocale: (locale) => {
    applyBrowserLocale(locale);
    set({ locale, hasHydrated: true });
  },
  t: (key) => dictionary[key][get().locale],
}));
