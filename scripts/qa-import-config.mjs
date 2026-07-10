const baseURL = process.env.MATRIXAPI_URL || 'https://matrixapi.online';

const response = await fetch(`${baseURL}/api/status`);
const status = await response.json();
if (!status.success) {
  throw new Error(`Status API failed: ${response.status}`);
}

const data = status.data || {};
const chats = data.chats || data.Chats || [];
const required = [
  'Cherry Studio',
  'AionUI',
  '流畅阅读',
  'CC Switch',
  'DeepChat',
  'Lobe Chat 官方示例',
  'AI as Workspace',
  'AMA 问天',
  'OpenCat',
];

const names = chats.flatMap((entry) => Object.keys(entry || {}));
const values = chats.flatMap((entry) => Object.values(entry || {})).join('\n');
const failures = [];

for (const name of required) {
  if (!names.includes(name)) failures.push(`Missing import client: ${name}`);
}

if (values.includes('api.bblabu.cn') || values.includes('api.bblabu.chat')) {
  failures.push('Import config still references bblabu API host');
}
if (!values.includes('{address}/v1') && !values.includes('ccswitch') && !values.includes('fluentread')) {
  failures.push('Import config does not contain OpenAI-compatible base URL templates');
}
if (data.server_address !== baseURL) {
  failures.push(`Unexpected server_address: ${data.server_address}`);
}
if (data.docs_link !== '/docs') {
  failures.push(`Unexpected docs_link: ${data.docs_link}`);
}

const report = {
  system_name: data.system_name,
  server_address: data.server_address,
  docs_link: data.docs_link,
  count: chats.length,
  names,
};

if (failures.length) {
  console.error(JSON.stringify({ failures, report }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(report, null, 2));
