#!/usr/bin/env bash
set -euo pipefail

for required in ZPAY_GATEWAY ZPAY_PID ZPAY_KEY UPSTREAM_API_KEY; do
  if [ -z "${!required:-}" ]; then
    echo "$required is required"
    exit 1
  fi
done

UPSTREAM_BASE_URL="${UPSTREAM_BASE_URL:-https://api.bblabu.chat}"
UPSTREAM_BASE_URL="${UPSTREAM_BASE_URL%/v1}"
UPSTREAM_BASE_URL="${UPSTREAM_BASE_URL%/}"
NEW_API_GROUP_RATIO="${NEW_API_GROUP_RATIO:-}"
NEW_API_TOPUP_GROUP_RATIO="${NEW_API_TOPUP_GROUP_RATIO:-}"
NEW_API_MIN_TOPUP="${NEW_API_MIN_TOPUP:-1}"
NEW_API_DEFAULT_MODELS="${NEW_API_DEFAULT_MODELS:-gpt-5.5,gpt-5.4,gpt-5.4-openai-compact,gpt-5.5-openai-compact,gpt-image2}"
NEW_API_GROUP_RATIO="${NEW_API_GROUP_RATIO%\'}"
NEW_API_GROUP_RATIO="${NEW_API_GROUP_RATIO#\'}"
NEW_API_TOPUP_GROUP_RATIO="${NEW_API_TOPUP_GROUP_RATIO%\'}"
NEW_API_TOPUP_GROUP_RATIO="${NEW_API_TOPUP_GROUP_RATIO#\'}"

if ! python3 -c 'import json,sys; json.loads(sys.argv[1])' "$NEW_API_GROUP_RATIO" >/dev/null 2>&1; then
  NEW_API_GROUP_RATIO='{"default":1.4}'
fi

if ! python3 -c 'import json,sys; json.loads(sys.argv[1])' "$NEW_API_TOPUP_GROUP_RATIO" >/dev/null 2>&1; then
  NEW_API_TOPUP_GROUP_RATIO='{"default":1}'
fi

tmp_sql="$(mktemp)"
trap 'rm -f "$tmp_sql"' EXIT

cat > "$tmp_sql" <<SQL
insert into options (key, value) values
  ('SystemName', 'MatrixAPI'),
  ('ServerAddress', 'https://matrixapi.online'),
  ('Logo', '/matrix-assets/matrixapi-logo.png'),
  ('general_setting.logo', '/matrix-assets/matrixapi-logo.png'),
  ('DocsLink', '/docs'),
  ('About', '## 鍏充簬 MatrixAPI

MatrixAPI 鏄潰鍚戝紑鍙戣€呭拰浼佷笟鍥㈤槦鐨?OpenAI 鍏煎 AI 妯″瀷鑱氬悎缃戝叧銆傚綋鍓嶇敓浜х幆澧冨凡鎺ュ叆 bblabu 涓婃父鍙敤妯″瀷锛屽寘鎷?gpt-5.4銆乬pt-5.5銆乧ompact 鍙樹綋鍜?gpt-image2锛屽苟閫氳繃缁熶竴鐨?/v1 鎺ュ彛鎻愪緵妯″瀷鍒楄〃銆佽亰澶╄ˉ鍏ㄣ€佸浘鐗囩敓鎴愮瓑鑳藉姏銆?
### 鏍稿績鑳藉姏

- 缁熶竴 API 鍏ュ彛锛歨ttps://matrixapi.online/v1
- 浠ょ墝绠＄悊锛氬垱寤恒€佸鍒躲€佺鐢ㄣ€侀搴﹂檺鍒躲€佹ā鍨嬮檺鍒跺拰 IP 闄愬埗
- 浠锋牸涓績锛氬熀浜庝笂娓稿叕寮€浠锋牸澧炲姞 40%锛屽湪椤甸潰涓寜妯″瀷灞曠ず
- 璇锋眰鏃ュ織锛氭煡鐪嬫ā鍨嬨€佷护鐗屻€佺姸鎬併€佽€楁椂銆乼oken 鍜岃垂鐢?- 浣欓鍏呭€硷細褰撳墠浠呭惎鐢?ZPay 鏀粯瀹濇笭閬?- 瀹㈡埛绔鍏ワ細鏀寔 Cherry Studio銆丆C Switch銆丩obe Chat銆丏eepChat銆丱penCat 绛?OpenAI 鍏煎瀹㈡埛绔?
### 鑱旂郴鏂瑰紡

濡傞渶浼佷笟棰濆害銆佷唬鐞嗙粨绠椼€佺櫧鏍囨垨妯″瀷娓犻亾閰嶇疆锛岃鍙戦€侀偖浠跺埌 3315419516@qq.com銆傝涓嶈鍦ㄩ偖浠朵腑鍙戦€佸畬鏁?API Key銆佸瘑鐮佹垨鍏朵粬鏁忔劅鍑瘉銆?
### 寮€婧愯鏄?
MatrixAPI 缃戝叧鎺у埗鍙板熀浜?New API 鏋勫缓锛屽苟淇濈暀 AGPLv3 寮€婧愬綊灞炶鏄庛€?),
  ('general_setting.docs_link', '/docs'),
  ('general_setting.quota_display_type', 'USD'),
  ('legal.user_agreement', '## MatrixAPI 鐢ㄦ埛鍗忚

娆㈣繋浣跨敤 MatrixAPI銆侻atrixAPI 鎻愪緵 OpenAI 鍏煎鐨?AI 妯″瀷鑱氬悎缃戝叧銆佷护鐗岀鐞嗐€佺敤閲忕粺璁°€佸厖鍊间笌璐﹀崟鑳藉姏銆備娇鐢ㄦ湰鏈嶅姟鍗宠〃绀轰綘鍚屾剰閬靛畧鏈崗璁€?
### 璐︽埛涓庝护鐗?
浣犲簲濡ュ杽淇濈璐﹀彿銆佸瘑鐮佸拰 API Key銆傚洜璐﹀彿鎴?API Key 娉勯湶銆佸叡浜€佽浆鍞€佸祵鍏ュ叕寮€瀹㈡埛绔瓑琛屼负閫犳垚鐨勮皟鐢ㄣ€佽垂鐢ㄦ垨鎹熷け锛岀敱璐﹀彿鎸佹湁浜鸿嚜琛屾壙鎷呫€傚彂鐜板紓甯稿簲绔嬪嵆绂佺敤浠ょ墝骞惰仈绯?3315419516@qq.com銆?
### 鍚堣浣跨敤

浣犱笉寰椾娇鐢?MatrixAPI 浠庝簨杩濇硶杩濊銆佷镜鐘粬浜烘潈鐩娿€佺粫杩囧畨鍏ㄩ檺鍒躲€佹敾鍑荤綉缁滅郴缁熴€佺敓鎴愭伓鎰忎唬鐮併€佹壒閲忓瀮鍦惧唴瀹广€佹璇堛€佷镜鏉冩垨杩濆弽涓婃父妯″瀷渚涘簲鍟嗘斂绛栫殑琛屼负銆傚钩鍙版湁鏉冨寮傚父璇锋眰銆佹互鐢ㄨ姹傛垨楂橀闄╄处鍙疯繘琛岄檺閫熴€佹殏鍋溿€佺鐢ㄦ垨瀹¤銆?
### 璁¤垂涓庡厖鍊?
MatrixAPI 閲囩敤浣欓鎵ｈ垂妯″紡锛屾寜妯″瀷銆佽緭鍏?杈撳嚭 token銆佹寜娆′换鍔℃垨骞冲彴鍏竷鐨勮璐硅鍒欐墸璐广€備环鏍间腑蹇冨睍绀虹殑浠锋牸涓哄綋鍓嶈璐瑰弬鑰冿紝榛樿鍩轰簬涓婃父鍏紑鎴愭湰澧炲姞 40%銆傚厖鍊奸€氳繃宸插惎鐢ㄧ殑鏀粯娓犻亾瀹屾垚锛岀洰鍓嶄粎鍚敤鏀粯瀹濄€傛敮浠樻垚鍔熷悗浣欓閫氬父鑷姩鍏ヨ处锛屽鍙戠敓寤惰繜璇锋彁渚涜鍗曞彿鑱旂郴鏀寔銆?
### 鏈嶅姟鍙敤鎬?
AI 妯″瀷璋冪敤渚濊禆涓婃父渚涘簲鍟嗐€佺綉缁溿€侀鎺с€侀搴﹀拰绯荤粺缁存姢鐘舵€併€侻atrixAPI 浼氬敖鍔涙彁渚涚ǔ瀹氭湇鍔★紝浣嗕笉鎵胯鎵€鏈夋ā鍨嬪湪浠讳綍鏃跺埢鍧囧彲鐢ㄣ€傚洜涓婃父鏁呴殰銆佷笉鍙姉鍔涖€佺綉缁滃紓甯告垨绗笁鏂规湇鍔″彉鍖栧鑷寸殑涓嶅彲鐢紝骞冲彴灏嗗敖鍔涙仮澶嶃€?
### 鍗忚鏇存柊

MatrixAPI 鍙牴鎹笟鍔°€佸悎瑙勬垨涓婃父鏀跨瓥鍙樺寲鏇存柊鏈崗璁€傛洿鏂板悗缁х画浣跨敤鏈嶅姟瑙嗕负鎺ュ彈鏂扮殑鏉℃銆?),
  ('legal.privacy_policy', '## MatrixAPI 闅愮鏀跨瓥

MatrixAPI 灏婇噸骞朵繚鎶ょ敤鎴烽殣绉併€傛湰鏀跨瓥璇存槑鎴戜滑鍦ㄦ彁渚?AI 妯″瀷鑱氬悎缃戝叧銆佽处鎴枫€佸厖鍊笺€佹棩蹇楀拰鎺у埗鍙版湇鍔℃椂濡備綍澶勭悊淇℃伅銆?
### 鎴戜滑鏀堕泦鐨勪俊鎭?
涓烘彁渚涙湇鍔★紝鎴戜滑鍙兘澶勭悊璐﹀彿淇℃伅銆佺櫥褰曠姸鎬併€佸厖鍊艰鍗曘€佷綑棰濇祦姘淬€丄PI Key 鍏冩暟鎹€佽姹傛椂闂淬€佹ā鍨嬪悕绉般€乼oken 鐢ㄩ噺銆佽垂鐢ㄣ€佺姸鎬佺爜銆佸欢杩熴€両P銆佺敤鎴蜂唬鐞嗕互鍙婂繀瑕佺殑閿欒鏃ュ織銆傛垜浠笉浼氫富鍔ㄥ叕寮€浣犵殑瀹屾暣 API Key銆?
### 淇℃伅鐢ㄩ€?
鐩稿叧淇℃伅鐢ㄤ簬韬唤璁よ瘉銆佷綑棰濇墸璐广€佽处鍗曟牳瀵广€佽姹傝矾鐢便€佹晠闅滄帓鏌ャ€侀鎺ч檺閫熴€佸弽婊ョ敤銆佺郴缁熷畨鍏ㄣ€佸鏈嶆敮鎸佸拰鍚堣瀹¤銆傝姹傚唴瀹逛細琚彂閫佸埌浣犻€夋嫨鎴栫郴缁熻矾鐢辩殑涓婃父妯″瀷渚涘簲鍟嗕互瀹屾垚妯″瀷鎺ㄧ悊銆?
### 绗笁鏂瑰鐞?
鏀粯浼氶€氳繃 ZPay 鏀粯瀹濇笭閬撳畬鎴愶紱妯″瀷璋冪敤浼氳浆鍙戣嚦閰嶇疆鐨勪笂娓?API 鏈嶅姟銆傜涓夋柟浼氭寜鐓у叾鑷韩瑙勫垯澶勭悊蹇呰淇℃伅銆傝涓嶈鍦?Prompt銆佹枃浠舵垨璇锋眰涓彁浜や笉蹇呰鐨勬晱鎰熶釜浜轰俊鎭€佸瘑閽ャ€佸瘑鐮佹垨鍟嗕笟鏈哄瘑銆?
### 瀹夊叏涓庝繚鐣?
MatrixAPI 閫氳繃 HTTPS銆佹潈闄愭帶鍒躲€佹棩蹇楀璁″拰浠ょ墝闅旂绛夋柟寮忎繚鎶ゆ暟鎹€傛棩蹇楀拰璁㈠崟浼氬湪婊¤冻璐﹀姟銆侀鎺у拰鎺掗殰闇€瑕佺殑鏈熼檺鍐呬繚鐣欍€備綘鍙互閫氳繃鎺у埗鍙扮鐞嗕护鐗岋紝鎴栭€氳繃 3315419516@qq.com 鑱旂郴鎴戜滑澶勭悊璐﹀彿涓庨殣绉侀棶棰樸€?
### 鏀跨瓥鏇存柊

鏈斂绛栧彲鑳介殢鏈嶅姟銆佹硶寰嬫硶瑙勬垨涓婃父瑕佹眰鍙樺寲鑰屾洿鏂般€傜户缁娇鐢?MatrixAPI 琛ㄧず浣犵悊瑙ｅ苟鎺ュ彈鏇存柊鍚庣殑鏀跨瓥銆?),
  ('PayAddress', :'zpay_gateway'),
  ('EpayId', :'zpay_pid'),
  ('EpayKey', :'zpay_key'),
  ('PayMethods', '[{"name":"Alipay","icon":"SiAlipay","type":"alipay"}]'),
  ('chats', '[{"Cherry Studio":"cherrystudio://providers/api-keys?v=1&data={cherryConfig}"},{"AionUI":"aionui://provider/add?v=1&data={aionuiConfig}"},{"娴佺晠闃呰":"fluentread"},{"CC Switch":"ccswitch"},{"DeepChat":"deepchat://provider/install?v=1&data={deepchatConfig}"},{"Lobe Chat 瀹樻柟绀轰緥":"https://chat-preview.lobehub.com/?settings={\"keyVaults\":{\"openai\":{\"apiKey\":\"{key}\",\"baseURL\":\"{address}/v1\"}}}"},{"AI as Workspace":"https://aiaw.app/set-provider?provider={\"type\":\"openai\",\"settings\":{\"apiKey\":\"{key}\",\"baseURL\":\"{address}/v1\",\"compatibility\":\"strict\"}}"},{"AMA 闂ぉ":"ama://set-api-key?server={address}&key={key}"},{"OpenCat":"opencat://team/join?domain={address}&token={key}"}]'),
  ('Chats', '[{"Cherry Studio":"cherrystudio://providers/api-keys?v=1&data={cherryConfig}"},{"AionUI":"aionui://provider/add?v=1&data={aionuiConfig}"},{"娴佺晠闃呰":"fluentread"},{"CC Switch":"ccswitch"},{"DeepChat":"deepchat://provider/install?v=1&data={deepchatConfig}"},{"Lobe Chat 瀹樻柟绀轰緥":"https://chat-preview.lobehub.com/?settings={\"keyVaults\":{\"openai\":{\"apiKey\":\"{key}\",\"baseURL\":\"{address}/v1\"}}}"},{"AI as Workspace":"https://aiaw.app/set-provider?provider={\"type\":\"openai\",\"settings\":{\"apiKey\":\"{key}\",\"baseURL\":\"{address}/v1\",\"compatibility\":\"strict\"}}"},{"AMA 闂ぉ":"ama://set-api-key?server={address}&key={key}"},{"OpenCat":"opencat://team/join?domain={address}&token={key}"}]'),
  ('console_setting.chats', '[{"Cherry Studio":"cherrystudio://providers/api-keys?v=1&data={cherryConfig}"},{"AionUI":"aionui://provider/add?v=1&data={aionuiConfig}"},{"娴佺晠闃呰":"fluentread"},{"CC Switch":"ccswitch"},{"DeepChat":"deepchat://provider/install?v=1&data={deepchatConfig}"},{"Lobe Chat 瀹樻柟绀轰緥":"https://chat-preview.lobehub.com/?settings={\"keyVaults\":{\"openai\":{\"apiKey\":\"{key}\",\"baseURL\":\"{address}/v1\"}}}"},{"AI as Workspace":"https://aiaw.app/set-provider?provider={\"type\":\"openai\",\"settings\":{\"apiKey\":\"{key}\",\"baseURL\":\"{address}/v1\",\"compatibility\":\"strict\"}}"},{"AMA 闂ぉ":"ama://set-api-key?server={address}&key={key}"},{"OpenCat":"opencat://team/join?domain={address}&token={key}"}]'),
  ('HeaderNavModules', '{"home":true,"console":true,"pricing":{"enabled":true,"requireAuth":false},"docs":true,"about":false}'),
  ('SidebarModulesAdmin', '{"chat":{"enabled":true,"playground":true,"chat":false},"console":{"enabled":true,"detail":true,"token":true,"log":true,"midjourney":false,"task":true},"personal":{"enabled":true,"topup":true,"personal":true},"admin":{"enabled":true,"channel":true,"models":true,"deployment":true,"redemption":true,"user":true,"subscription":true,"setting":true}}'),
  ('console_setting.api_info_enabled', 'true'),
  ('console_setting.faq_enabled', 'true'),
  ('console_setting.announcements_enabled', 'true'),
  ('console_setting.api_info', '[{"id":1,"url":"https://matrixapi.online/v1","route":"OpenAI Compatible API","description":"Primary endpoint for chat completions, embeddings, images, audio, and model listing.","color":"cyan"},{"id":2,"url":"https://matrixapi.online/docs","route":"MatrixAPI Docs","description":"MatrixAPI-owned integration docs for tokens, endpoints, billing, and client import.","color":"purple"},{"id":3,"url":"mailto:3315419516@qq.com","route":"Support Email","description":"Contact MatrixAPI support by QQ email for account, payment, or enterprise questions.","color":"green"},{"id":4,"url":"https://matrixapi.online/console/token","route":"Token Console","description":"Create, copy, batch export, limit, and rotate API tokens from the console.","color":"blue"},{"id":5,"url":"https://matrixapi.online/pricing","route":"Pricing Center","description":"Prices are displayed with the configured MatrixAPI retail group ratio.","color":"amber"}]'),
  ('console_setting.faq', '[{"id":1,"question":"How do I create an API token?","answer":"Open Console > Tokens, click Add Token, choose quota and model limits, then copy the generated key. The key is shown masked in the list and can be copied again from the token actions."},{"id":2,"question":"How do I import MatrixAPI into a client app?","answer":"Open the Docs link and choose your client, such as Cherry Studio, CC Switch, Lobe Chat, DeepChat, OpenCat, AMA, or AI as Workspace. Use https://matrixapi.online/v1 as the base URL and your MatrixAPI token as the API key."},{"id":3,"question":"Which payment methods are enabled?","answer":"Only Alipay is enabled for online top-up. Payments are initiated through ZPay and balance is credited after the payment callback succeeds."},{"id":4,"question":"How is pricing calculated?","answer":"MatrixAPI uses New API model pricing with the default group ratio set to 1.4, so retail pricing is 40% above the upstream base configuration."},{"id":5,"question":"Can I restrict a token to specific models or IPs?","answer":"Yes. Token settings support model limits, IP allow lists, expiration time, quota limits, and cross-group retry configuration."},{"id":6,"question":"Is the API OpenAI compatible?","answer":"Yes. Use /v1/chat/completions, /v1/embeddings, /v1/images/generations, /v1/audio/transcriptions, and /v1/models with Bearer token authentication."},{"id":7,"question":"Where can I see request logs?","answer":"Open Console > Logs to review model, status, token usage, cost, latency, and request time."},{"id":8,"question":"How do I contact support?","answer":"Send email to 3315419516@qq.com. Include your username and a short description of the issue; do not include full API keys in support messages."}]'),
  ('console_setting.announcements', '[{"id":1,"type":"success","content":"MatrixAPI is connected to the bblabu upstream channel and OpenAI-compatible gateway routes are available.","publishDate":"2026-07-07T00:00:00+08:00"},{"id":2,"type":"warning","content":"Only Alipay top-up is currently enabled. Do not use WeChat wording on the recharge page.","publishDate":"2026-07-07T00:10:00+08:00"},{"id":3,"type":"ongoing","content":"MatrixAPI documentation is available on /docs and will continue to be expanded.","publishDate":"2026-07-07T00:20:00+08:00"}]'),
  ('MinTopUp', :'min_topup'),
  ('GroupRatio', :'group_ratio'),
  ('UserUsableGroups', '{"default":"Default 1.4x retail group"}'),
  ('TopupGroupRatio', :'topup_group_ratio'),
  ('ModelRatio', '{"gpt-5.5":2.5,"gpt-5.4":1.25,"gpt-5.4-openai-compact":1.25,"gpt-5.5-openai-compact":2.5}'),
  ('ModelPrice', '{"gpt-image2":0.04}'),
  ('Price', '0.1'),
  ('DisplayInCurrencyEnabled', 'true'),
  ('QuotaDisplayType', 'USD'),
  ('payment_setting.compliance_confirmed', 'true'),
  ('payment_setting.compliance_confirmed_at', extract(epoch from now())::bigint::text),
  ('payment_setting.compliance_confirmed_by', '1'),
  ('payment_setting.compliance_terms_version', 'v1')
on conflict (key) do update set value = excluded.value;

insert into channels (
  type, key, test_model, status, name, weight, created_time, base_url,
  models, "group", used_quota, priority, auto_ban, tag, remark, settings,
  channel_info
)
select
  1,
  :'upstream_key',
  split_part(:'default_models', ',', 1),
  1,
  'bblabu-upstream',
  100,
  extract(epoch from now())::bigint,
  :'upstream_base_url',
  :'default_models',
  'default',
  0,
  0,
  1,
  'bblabu',
  'MatrixAPI upstream channel. Retail pricing includes 40% markup through GroupRatio.',
  '{}',
  null
where not exists (
  select 1 from channels where name = 'bblabu-upstream' or base_url = :'upstream_base_url'
);

update channels set
  key = :'upstream_key',
  test_model = split_part(:'default_models', ',', 1),
  status = 1,
  weight = 100,
  base_url = :'upstream_base_url',
  models = :'default_models',
  "group" = 'default',
  priority = 0,
  auto_ban = 1,
  tag = 'bblabu',
  remark = 'MatrixAPI upstream channel. Retail pricing includes 40% markup through GroupRatio.'
where name = 'bblabu-upstream' or base_url = :'upstream_base_url';

delete from abilities
where channel_id in (
  select id from channels
  where (name = 'bblabu-upstream' or base_url = :'upstream_base_url')
    and id <> (select min(id) from channels where name = 'bblabu-upstream' or base_url = :'upstream_base_url')
);

delete from channels
where (name = 'bblabu-upstream' or base_url = :'upstream_base_url')
  and id <> (select min(id) from channels where name = 'bblabu-upstream' or base_url = :'upstream_base_url');

delete from abilities
where channel_id in (select id from channels where name = 'bblabu-upstream' or base_url = :'upstream_base_url');

insert into abilities ("group", model, channel_id, enabled, priority, weight, tag)
select
  trim(ch_group),
  trim(ch_model),
  c.id,
  c.status = 1,
  c.priority,
  c.weight,
  c.tag
from channels c
cross join regexp_split_to_table(c."group", ',') as ch_group
cross join regexp_split_to_table(c.models, ',') as ch_model
where c.name = 'bblabu-upstream'
  and trim(ch_group) <> ''
  and trim(ch_model) <> ''
on conflict ("group", model, channel_id) do update set
  enabled = excluded.enabled,
  priority = excluded.priority,
  weight = excluded.weight,
  tag = excluded.tag;

with openai_vendor as (
  select id from vendors where name = 'OpenAI' and deleted_at is null order by id limit 1
),
matrix_models(model_name, description, tags, endpoints, status, sync_official, name_rule) as (
  values
    ('gpt-5.5', 'bblabu upstream flagship chat model exposed through the MatrixAPI OpenAI-compatible gateway.', 'chat,reasoning,bblabu', '[1]', 1, 0, 0),
    ('gpt-5.5-openai-compact', 'Compact gpt-5.5 variant for lower-latency OpenAI-compatible chat calls.', 'chat,compact,bblabu', '[1]', 1, 0, 0),
    ('gpt-5.4', 'bblabu upstream general chat model exposed through the MatrixAPI OpenAI-compatible gateway.', 'chat,bblabu', '[1]', 1, 0, 0),
    ('gpt-5.4-openai-compact', 'Compact gpt-5.4 variant for efficient OpenAI-compatible chat calls.', 'chat,compact,bblabu', '[1]', 1, 0, 0),
    ('gpt-image2', 'bblabu upstream image generation model billed per request.', 'image,generation,bblabu', '[3]', 1, 0, 0)
)
insert into models (
  model_name, description, icon, tags, vendor_id, endpoints, status,
  sync_official, created_time, updated_time, name_rule
)
select
  mm.model_name,
  mm.description,
  'OpenAI',
  mm.tags,
  coalesce((select id from openai_vendor), 1),
  mm.endpoints,
  mm.status,
  mm.sync_official,
  extract(epoch from now())::bigint,
  extract(epoch from now())::bigint,
  mm.name_rule
from matrix_models mm
on conflict (model_name, deleted_at) do update set
  description = excluded.description,
  icon = excluded.icon,
  tags = excluded.tags,
  vendor_id = excluded.vendor_id,
  endpoints = excluded.endpoints,
  status = excluded.status,
  sync_official = excluded.sync_official,
  updated_time = excluded.updated_time,
  name_rule = excluded.name_rule;
SQL

docker cp "$tmp_sql" matrixapi-db:/tmp/bootstrap-new-api-db.sql
docker exec \
  -e ZPAY_GATEWAY="$ZPAY_GATEWAY" \
  -e ZPAY_PID="$ZPAY_PID" \
  -e ZPAY_KEY="$ZPAY_KEY" \
  -e UPSTREAM_API_KEY="$UPSTREAM_API_KEY" \
  -e UPSTREAM_BASE_URL="$UPSTREAM_BASE_URL" \
  -e NEW_API_GROUP_RATIO="$NEW_API_GROUP_RATIO" \
  -e NEW_API_TOPUP_GROUP_RATIO="$NEW_API_TOPUP_GROUP_RATIO" \
  -e NEW_API_MIN_TOPUP="$NEW_API_MIN_TOPUP" \
  -e NEW_API_DEFAULT_MODELS="$NEW_API_DEFAULT_MODELS" \
  matrixapi-db sh -lc '
    psql -U matrixapi -d new_api \
      -v zpay_gateway="$ZPAY_GATEWAY" \
      -v zpay_pid="$ZPAY_PID" \
      -v zpay_key="$ZPAY_KEY" \
      -v upstream_key="$UPSTREAM_API_KEY" \
      -v upstream_base_url="$UPSTREAM_BASE_URL" \
      -v group_ratio="$NEW_API_GROUP_RATIO" \
      -v topup_group_ratio="$NEW_API_TOPUP_GROUP_RATIO" \
      -v min_topup="$NEW_API_MIN_TOPUP" \
      -v default_models="$NEW_API_DEFAULT_MODELS" \
      -f /tmp/bootstrap-new-api-db.sql
  '

echo "MatrixAPI New API database bootstrap finished."
