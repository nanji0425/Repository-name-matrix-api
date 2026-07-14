#!/usr/bin/env bash
set -euo pipefail

for required in ZPAY_GATEWAY ZPAY_PID ZPAY_KEY UPSTREAM_API_KEY; do
  if [ -z "${!required:-}" ]; then
    echo "$required is required"
    exit 1
  fi
done

ZPAY_GATEWAY="$(python3 - "$ZPAY_GATEWAY" <<'PY'
import sys
from urllib.parse import urlsplit

value = sys.argv[1].strip()
parsed = urlsplit(value)
if parsed.scheme.lower() not in {"http", "https"} or not parsed.hostname:
    raise SystemExit("ZPAY_GATEWAY must be a valid http(s) URL")
if parsed.username is not None or parsed.password is not None:
    raise SystemExit("ZPAY_GATEWAY must not contain credentials")
if parsed.query or parsed.fragment:
    raise SystemExit("ZPAY_GATEWAY must not contain query or fragment")

scheme = parsed.scheme.lower()
host = parsed.hostname.encode("idna").decode("ascii").lower()
if ":" in host:
    host = f"[{host}]"
try:
    port = parsed.port
except ValueError as error:
    raise SystemExit(f"ZPAY_GATEWAY is invalid: {error}") from error
if port is not None and not (
    (scheme == "http" and port == 80) or (scheme == "https" and port == 443)
):
    host = f"{host}:{port}"

path = parsed.path.rstrip("/")
if path.lower().endswith("/submit.php"):
    path = path[: -len("/submit.php")].rstrip("/")
print(f"{scheme}://{host}{path}/")
PY
)"

NEW_API_QUOTA_FOR_NEW_USER="${NEW_API_QUOTA_FOR_NEW_USER:-500000}"
if ! [[ "$NEW_API_QUOTA_FOR_NEW_USER" =~ ^[0-9]+$ ]]; then
  echo "NEW_API_QUOTA_FOR_NEW_USER must be a non-negative integer"
  exit 1
fi

UPSTREAM_BASE_URL="$(python3 - "${UPSTREAM_BASE_URL:-https://www.kukuai.fyi/api-proxy/china}" <<'PY'
import sys
from urllib.parse import urlsplit

value = sys.argv[1].strip()
parsed = urlsplit(value)
if parsed.scheme.lower() not in {"http", "https"} or not parsed.hostname:
    raise SystemExit("UPSTREAM_BASE_URL must be a valid http(s) URL")
if parsed.username is not None or parsed.password is not None:
    raise SystemExit("UPSTREAM_BASE_URL must not contain credentials")

scheme = parsed.scheme.lower()
host = parsed.hostname.encode("idna").decode("ascii").lower()
if ":" in host:
    host = f"[{host}]"
try:
    port = parsed.port
except ValueError as error:
    raise SystemExit(f"UPSTREAM_BASE_URL is invalid: {error}") from error
if port is not None and not (
    (scheme == "http" and port == 80) or (scheme == "https" and port == 443)
):
    host = f"{host}:{port}"

path = parsed.path.rstrip("/")
if path.lower().endswith("/v1"):
    path = path[:-3].rstrip("/")
print(f"{scheme}://{host}{path}")
PY
)"
NEW_API_GROUP_RATIO="${NEW_API_GROUP_RATIO:-}"
NEW_API_TOPUP_GROUP_RATIO="${NEW_API_TOPUP_GROUP_RATIO:-}"
NEW_API_MIN_TOPUP="${NEW_API_MIN_TOPUP:-1}"
NEW_API_DEFAULT_MODELS="${NEW_API_DEFAULT_MODELS:-gpt-5.5,gpt-5.4,gpt-5.4-openai-compact,gpt-5.5-openai-compact,gpt-image2}"
NEW_API_GROUP_RATIO="${NEW_API_GROUP_RATIO%\'}"
NEW_API_GROUP_RATIO="${NEW_API_GROUP_RATIO#\'}"
NEW_API_TOPUP_GROUP_RATIO="${NEW_API_TOPUP_GROUP_RATIO%\'}"
NEW_API_TOPUP_GROUP_RATIO="${NEW_API_TOPUP_GROUP_RATIO#\'}"

if ! python3 -c 'import json,sys; json.loads(sys.argv[1])' "$NEW_API_GROUP_RATIO" >/dev/null 2>&1; then
  NEW_API_GROUP_RATIO='{"default":1}'
fi

if ! python3 -c 'import json,sys; json.loads(sys.argv[1])' "$NEW_API_TOPUP_GROUP_RATIO" >/dev/null 2>&1; then
  NEW_API_TOPUP_GROUP_RATIO='{"default":1}'
fi

tmp_sql="$(mktemp)"
trap 'rm -f "$tmp_sql"' EXIT

cat > "$tmp_sql" <<SQL
begin;
insert into options (key, value) values
  ('SystemName', 'Matrix API'),
  ('general_setting.system_name', 'Matrix API'),
  ('ServerAddress', 'https://matrixapi.online'),
  ('Logo', '/matrix-assets/matrixapi-logo.png?v=2026071419'),
  ('general_setting.logo', '/matrix-assets/matrixapi-logo.png?v=2026071419'),
  ('DocsLink', '/docs'),
  ('About', '## 鍏充簬 MatrixAPI

MatrixAPI 鏄潰鍚戝紑鍙戣€呭拰浼佷笟鍥㈤槦鐨?OpenAI 鍏煎 AI 妯″瀷鑱氬悎缃戝叧銆傚綋鍓嶇敓浜х幆澧冨凡鎺ュ叆 kukuai 涓婃父鍙敤妯″瀷锛屽寘鎷?gpt-5.4銆乬pt-5.5銆乧ompact 鍙樹綋鍜?gpt-image2锛屽苟閫氳繃缁熶竴鐨?/v1 鎺ュ彛鎻愪緵妯″瀷鍒楄〃銆佽亰澶╄ˉ鍏ㄣ€佸浘鐗囩敓鎴愮瓑鑳藉姏銆?
### 鏍稿績鑳藉姏

- 缁熶竴 API 鍏ュ彛锛歨ttps://matrixapi.online/v1
- 浠ょ墝绠＄悊锛氬垱寤恒€佸鍒躲€佺鐢ㄣ€侀搴﹂檺鍒躲€佹ā鍨嬮檺鍒跺拰 IP 闄愬埗
- 浠锋牸涓績锛氬熀浜庝笂娓稿叕寮€浠锋牸澧炲姞 40%锛屽湪椤甸潰涓寜妯″瀷灞曠ず
- 璇锋眰鏃ュ織锛氭煡鐪嬫ā鍨嬨€佷护鐗屻€佺姸鎬併€佽€楁椂銆乼oken 鍜岃垂鐢?- 浣欓鍏呭€硷細褰撳墠浠呭惎鐢?ZPay 鏀粯瀹濇笭閬?- 瀹㈡埛绔鍏ワ細鏀寔 Cherry Studio銆丆C Switch銆丩obe Chat銆丏eepChat銆丱penCat 绛?OpenAI 鍏煎瀹㈡埛绔?
### 鑱旂郴鏂瑰紡

濡傞渶浼佷笟棰濆害銆佷唬鐞嗙粨绠椼€佺櫧鏍囨垨妯″瀷娓犻亾閰嶇疆锛岃鍙戦€侀偖浠跺埌 3315419516@qq.com銆傝涓嶈鍦ㄩ偖浠朵腑鍙戦€佸畬鏁?API Key銆佸瘑鐮佹垨鍏朵粬鏁忔劅鍑瘉銆?
### 寮€婧愯鏄?
MatrixAPI 缃戝叧鎺у埗鍙板熀浜?New API 鏋勫缓锛屽苟淇濈暀 AGPLv3 寮€婧愬綊灞炶鏄庛€?'),
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

MatrixAPI 鍙牴鎹笟鍔°€佸悎瑙勬垨涓婃父鏀跨瓥鍙樺寲鏇存柊鏈崗璁€傛洿鏂板悗缁х画浣跨敤鏈嶅姟瑙嗕负鎺ュ彈鏂扮殑鏉℃銆?'),
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

鏈斂绛栧彲鑳介殢鏈嶅姟銆佹硶寰嬫硶瑙勬垨涓婃父瑕佹眰鍙樺寲鑰屾洿鏂般€傜户缁娇鐢?MatrixAPI 琛ㄧず浣犵悊瑙ｅ苟鎺ュ彈鏇存柊鍚庣殑鏀跨瓥銆?'),
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
  ('console_setting.api_info', '[{"id":1,"url":"https://matrixapi.online/v1","route":"OpenAI 兼容接口","description":"用于对话、模型列表、向量、图片和音频等兼容请求的统一入口。","color":"cyan"},{"id":2,"url":"https://matrixapi.online/docs","route":"教程文档","description":"查看快速开始、客户端配置、模型价格、充值余额和常见问题。","color":"purple"},{"id":3,"url":"mailto:3315419516@qq.com","route":"联系支持","description":"遇到账号、支付或接口问题时，可发邮件 3315419516@qq.com，或加入 QQ 群 1050365180。","color":"green"},{"id":4,"url":"https://matrixapi.online/console/token","route":"API Key 管理","description":"创建、复制、限制、停用和轮换你的 API Key。","color":"blue"},{"id":5,"url":"https://matrixapi.online/pricing","route":"价格中心","description":"查看 Matrix API 当前对外模型价格、上下文和能力标签。","color":"amber"}]'),
  ('console_setting.faq', '[{"id":1,"question":"如何创建 API Key？","answer":"进入控制台的 API Key 管理页面，点击创建，按需设置额度、模型权限和有效期，然后复制生成的 Key。请妥善保存，不要公开发送给他人。"},{"id":2,"question":"如何在客户端里使用 Matrix API？","answer":"选择 OpenAI 兼容或自定义服务商，Base URL 填写 https://matrixapi.online/v1，API Key 填写控制台创建的 Key，模型名使用模型广场显示的名称。"},{"id":3,"question":"当前支持哪些充值方式？","answer":"在线充值当前支持支付宝。支付完成后余额会根据支付结果自动入账；如长时间未到账，请联系支持并提供支付时间和订单信息。"},{"id":4,"question":"模型价格如何计算？","answer":"模型广场展示的价格为 Matrix API 当前对外价格。实际费用会根据所选模型、输入 Token、输出 Token、任务类型和计费单位自动计算。"},{"id":5,"question":"在哪里查看使用日志？","answer":"进入控制台的使用日志页面，可以查看每次请求的时间、模型、状态、Token 数量、消耗金额和 API Key 信息。"},{"id":6,"question":"请求提示余额不足怎么办？","answer":"请先进入钱包页充值余额，到账后重新发起请求。建议在批量调用前确认余额充足。"},{"id":7,"question":"模型不存在或无法调用怎么办？","answer":"请确认使用的是模型广场或 /v1/models 返回的完整模型名，并检查 API Key 是否允许调用该模型。"},{"id":8,"question":"如何联系支持？","answer":"可发送邮件到 3315419516@qq.com，或加入 QQ 群 1050365180。请附上问题发生时间、页面路径、状态码、模型名或订单时间，不要发送完整 API Key 或支付密码。"}]'),
  ('console_setting.announcements', '[{"id":1,"type":"success","content":"Matrix API 接口已开放：请使用 https://matrixapi.online/v1 作为 OpenAI 兼容 Base URL。","publishDate":"2026-07-07T00:00:00+08:00","enabled":true},{"id":2,"type":"warning","content":"在线充值当前支持支付宝。支付完成后余额会根据支付结果自动入账。","publishDate":"2026-07-07T00:10:00+08:00","enabled":true},{"id":3,"type":"ongoing","content":"教程文档已上线：快速开始、客户端配置、模型价格、充值余额和常见问题均可在 /docs 查看。","publishDate":"2026-07-07T00:20:00+08:00","enabled":true}]'),
  ('MinTopUp', :'min_topup'),
  ('QuotaForNewUser', :'quota_for_new_user'), -- default 500000 quota units (USD 1)
  ('GroupRatio', :'group_ratio'),
  ('UserUsableGroups', '{"default":"Default 1.0x group"}'),
  ('TopupGroupRatio', :'topup_group_ratio'),
  ('ModelRatio', '{"gpt-5.5":2.5,"gpt-5.4":1.25,"gpt-5.4-openai-compact":1.25,"gpt-5.5-openai-compact":2.5}'),
  ('ModelPrice', '{"gpt-image2":0.04}'),
  ('Price', '1.0'),
  ('DisplayInCurrencyEnabled', 'true'),
  ('QuotaDisplayType', 'USD'),
  ('payment_setting.compliance_confirmed', 'true'),
  ('payment_setting.compliance_confirmed_at', extract(epoch from now())::bigint::text),
  ('payment_setting.compliance_confirmed_by', '1'),
  ('payment_setting.compliance_terms_version', 'v1')
on conflict (key) do update set value = excluded.value;

update options
set value = '[{"id":1,"question":"如何创建 API Key？","answer":"进入控制台的 API Key 管理页面，点击创建，按需设置额度、模型权限和有效期，然后复制生成的 Key。请妥善保存，不要公开发送给他人。"},{"id":2,"question":"如何在客户端里使用 Matrix API？","answer":"选择 OpenAI 兼容或自定义服务商，Base URL 填写 https://matrixapi.online/v1，API Key 填写控制台创建的 Key，模型名使用模型广场显示的名称。"},{"id":3,"question":"当前支持哪些充值方式？","answer":"在线充值当前支持支付宝。支付完成后余额会根据支付结果自动入账；如长时间未到账，请联系支持并提供支付时间和订单信息。"},{"id":4,"question":"模型价格如何计算？","answer":"模型广场展示的价格为 Matrix API 当前对外价格。实际费用会根据所选模型、输入 Token、输出 Token、任务类型和计费单位自动计算。"},{"id":5,"question":"在哪里查看使用日志？","answer":"进入控制台的使用日志页面，可以查看每次请求的时间、模型、状态、Token 数量、消耗金额和 API Key 信息。"},{"id":6,"question":"请求提示余额不足怎么办？","answer":"请先进入钱包页充值余额，到账后重新发起请求。建议在批量调用前确认余额充足。"},{"id":7,"question":"模型不存在或无法调用怎么办？","answer":"请确认使用的是模型广场或 /v1/models 返回的完整模型名，并检查 API Key 是否允许调用该模型。"},{"id":8,"question":"如何联系支持？","answer":"可发送邮件到 3315419516@qq.com，或加入 QQ 群 1050365180。请附上问题发生时间、页面路径、状态码、模型名或订单时间，不要发送完整 API Key 或支付密码。"}]'
where key = 'console_setting.faq';

-- Keep the bootstrap copy UTF-8 and readable even when this script is viewed in a
-- locale that cannot decode the legacy seed text above.
update options set value = \$\$## 关于 MatrixAPI

MatrixAPI 是面向开发者和企业团队的 OpenAI 兼容 AI 模型接口服务，通过统一的 /v1 接口提供模型列表、聊天补全、图像生成等功能。

### 核心能力

- OpenAI 兼容接口：https://matrixapi.online/v1
- 控制台 API Key 管理、模型限制、IP 白名单和用量日志
- 钱包充值与订单查询，仅启用支付宝支付
- MatrixAPI 站内文档：https://matrixapi.online/docs

### 联系支持

如需账号、支付、接口调用或企业使用支持，请联系邮箱 3315419516@qq.com，或加入 QQ 群 1050365180。请勿在邮件或群聊中发送完整 API Key、密码或其他敏感凭证。

### 开源说明

MatrixAPI 网关控制台基于 New API 构建，并保留 AGPLv3 开源归属说明。\$\$ where key = 'About';

update options set value = \$\$## MatrixAPI 用户协议

欢迎使用 MatrixAPI。MatrixAPI 提供 OpenAI 兼容的 AI 模型网关、API Key 管理、用量统计、充值与账单能力。注册或使用本服务即表示你同意遵守本协议。

### 账户与安全

- 仅使用真实、合法且可控制的用户名注册账户，并妥善保管密码。
- API Key 仅限本人或获得授权的应用使用，不得公开、转售或提交到公共代码仓库。
- 发现异常登录、密钥泄露或未授权调用时，应立即修改密码并撤销相关 API Key。

### 合法使用

不得使用本服务从事违法、侵权、欺诈、恶意攻击、绕过安全控制或侵犯他人隐私的活动。你对使用账户发起的请求、生成的内容以及由此造成的后果负责。

### 计费与充值

价格、模型倍率和余额以控制台显示为准。充值订单由 ZPay 支付网关处理，仅启用支付宝。支付成功并收到回调后，余额才会记入账户；未完成或被取消的订单不会扣除余额。

### 服务变更

我们可能因模型可用性、网络、维护或安全原因调整模型、价格和限流策略。重大变更会在站内公告中说明。

### 联系方式

服务问题请联系邮箱 3315419516@qq.com，或加入 QQ 群 1050365180。提交工单、邮件或群聊消息时请勿发送完整 API Key 或密码。\$\$ where key = 'legal.user_agreement';

update options set value = \$\$## MatrixAPI 隐私政策

本隐私政策说明 MatrixAPI 如何处理你在注册、调用 API、充值和使用控制台时产生的信息。

### 收集的信息

- 账户信息：用户名、密码哈希、注册时间和账户状态。
- 调用信息：请求时间、模型、状态、用量、费用、延迟和必要的错误信息。
- 交易信息：订单号、金额、支付状态和回调结果。支付敏感信息由 ZPay 处理，MatrixAPI 不保存支付宝登录密码或支付密码。

### 使用目的

这些信息用于提供和保护服务、计算用量和余额、处理充值订单、排查故障、改进模型路由以及遵守适用法律法规。我们不会出售你的个人信息。

### API Key 与内容

请自行保护 API Key。我们不会要求你通过邮件或聊天发送完整密钥。请勿提交不应被处理的敏感个人信息。

### 保存与删除

我们会在实现上述目的所需的期限内保存账户、调用和订单记录。你可以联系邮箱 3315419516@qq.com，或加入 QQ 群 1050365180 申请账户相关信息的查询或删除；法律要求保留的记录除外。

### 联系方式

隐私问题请联系邮箱 3315419516@qq.com，或加入 QQ 群 1050365180。我们会在核验账户归属后处理相关请求。\$\$ where key = 'legal.privacy_policy';

update options set value = \$\$## 关于 Matrix API

Matrix API 是面向开发者和团队的 AI 模型接口服务，提供 OpenAI 兼容接口、API Key 管理、模型广场、余额充值、使用日志和教程文档。

### 核心能力

- OpenAI 兼容接口：https://matrixapi.online/v1
- 控制台 API Key 管理、模型权限、额度限制和使用日志
- 钱包充值、余额查询和消费记录
- Matrix API 站内教程文档：https://matrixapi.online/docs

### 联系支持

如需账号、支付、接口调用或企业使用支持，请联系邮箱 3315419516@qq.com，或加入 QQ 群 1050365180。请勿在邮件或群聊中发送完整 API Key、密码或其他敏感凭证。

### 开源说明

Matrix API 控制台基于 New API 构建，并保留相关开源归属说明。\$\$ where key = 'About';

update options set value = \$\$## Matrix API 用户协议

欢迎使用 Matrix API。Matrix API 提供 OpenAI 兼容接口、API Key 管理、用量统计、充值与账单能力。注册或使用本服务即表示你同意遵守本协议。

### 账户与安全

- 请使用真实、合法且可控制的账号信息注册账户，并妥善保管密码。
- API Key 仅限本人或获得授权的应用使用，不得公开、转售或提交到公共代码仓库。
- 发现异常登录、密钥泄露或未授权调用时，应立即修改密码并停用相关 API Key。

### 合法使用

不得使用本服务从事违法、侵权、欺诈、恶意攻击、绕过安全控制或侵犯他人隐私的活动。你对使用账户发起的请求、生成的内容以及由此造成的后果负责。

### 计费与充值

模型广场展示的价格为 Matrix API 当前对外价格。实际费用会根据所选模型、输入 Token、输出 Token、任务类型和计费单位自动计算。充值订单由支付服务处理，支付成功并收到结果后余额会记入账户。

### 服务变更

我们可能因模型可用性、网络、维护或安全原因调整模型、价格和限流策略。重大变更会在站内公告中说明。

### 联系方式

服务问题请联系邮箱 3315419516@qq.com，或加入 QQ 群 1050365180。提交工单、邮件或群聊消息时请勿发送完整 API Key 或密码。\$\$ where key = 'legal.user_agreement';

update options set value = \$\$## Matrix API 隐私政策

本隐私政策说明 Matrix API 如何处理你在注册、调用 API、充值和使用控制台时产生的信息。

### 收集的信息

- 账户信息：用户名、密码哈希、注册时间和账户状态。
- 调用信息：请求时间、模型、状态、用量、费用、延迟和必要的错误信息。
- 交易信息：订单号、金额、支付状态和结果信息。Matrix API 不保存支付宝登录密码或支付密码。

### 使用目的

这些信息用于提供和保护服务、计算用量和余额、处理充值订单、排查故障、改进服务质量以及遵守适用法律法规。我们不会出售你的个人信息。

### API Key 与内容

请自行保护 API Key。我们不会要求你通过邮件或聊天发送完整密钥。请勿提交不应被处理的敏感个人信息。

### 保存与删除

我们会在实现上述目的所需的期限内保存账户、调用和订单记录。你可以联系邮箱 3315419516@qq.com，或加入 QQ 群 1050365180 申请账户相关信息的查询或删除；法律要求保留的记录除外。

### 联系方式

隐私问题请联系邮箱 3315419516@qq.com，或加入 QQ 群 1050365180。我们会在核验账户归属后处理相关请求。\$\$ where key = 'legal.privacy_policy';

update options
set value = \$\$[{"Cherry Studio":"cherrystudio://providers/api-keys?v=1&data={cherryConfig}"},{"AionUI":"aionui://provider/add?v=1&data={aionuiConfig}"},{"流畅阅读":"fluentread"},{"CC Switch":"ccswitch"},{"DeepChat":"deepchat://provider/install?v=1&data={deepchatConfig}"},{"AMA 问天":"ama://set-api-key?server={address}&key={key}"},{"OpenCat":"opencat://team/join?domain={address}&token={key}"}]\$\$
where key in ('chats', 'Chats', 'console_setting.chats');

create temporary table matrix_upstream_candidates (
  id integer primary key
);

insert into matrix_upstream_candidates (id)
select id
from channels
where lower(trim(name)) in ('bblabu-upstream', 'kukuai-upstream')
  or lower(regexp_replace(
    regexp_replace(
      split_part(split_part(trim(base_url), '?', 1), '#', 1),
      '/+$',
      '',
      'g'
    ),
    '/v1$',
    '',
    'i'
  )) in (
    lower(:'upstream_base_url'),
    'https://api.bblabu.chat',
    'https://ozlzs.kukuai.fyi',
    'https://kukuai.fyi',
    'https://www.kukuai.fyi',
    'https://www.kukuai.fyi/api-proxy/china'
  );

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
  'kukuai-upstream',
  100,
  extract(epoch from now())::bigint,
  :'upstream_base_url',
  :'default_models',
  'default',
  0,
  0,
  1,
  'kukuai',
  'Matrix API model service. Pricing follows configured Matrix API rules.',
  '{}',
  null
where not exists (
  select 1 from matrix_upstream_candidates
);

insert into matrix_upstream_candidates (id)
select id
from channels
where name = 'kukuai-upstream'
  and base_url = :'upstream_base_url'
on conflict (id) do nothing;

update channels set
  type = 1,
  key = :'upstream_key',
  test_model = coalesce(nullif(test_model, ''), split_part(coalesce(nullif(models, ''), :'default_models'), ',', 1)),
  status = 1,
  name = 'kukuai-upstream',
  weight = 100,
  base_url = :'upstream_base_url',
  models = coalesce(nullif(models, ''), :'default_models'),
  "group" = 'default',
  priority = 0,
  auto_ban = 1,
  tag = 'kukuai',
  remark = 'Matrix API model service. Pricing follows configured Matrix API rules.',
  settings = '{}',
  channel_info = null
where id = (
  select min(id) from matrix_upstream_candidates
);

delete from abilities
where channel_id in (
  select id from matrix_upstream_candidates
  where id <> (select min(id) from matrix_upstream_candidates)
);

delete from channels
where id in (
  select id from matrix_upstream_candidates
  where id <> (select min(id) from matrix_upstream_candidates)
);

delete from abilities
where channel_id in (
  select min(id) from matrix_upstream_candidates
);

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
where c.id = (select min(id) from matrix_upstream_candidates)
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
    ('gpt-5.5', 'kukuai upstream flagship chat model exposed through the MatrixAPI OpenAI-compatible gateway.', 'chat,reasoning,kukuai', '[1]', 1, 0, 0),
    ('gpt-5.5-openai-compact', 'Compact gpt-5.5 variant for lower-latency OpenAI-compatible chat calls.', 'chat,compact,kukuai', '[1]', 1, 0, 0),
    ('gpt-5.4', 'kukuai upstream general chat model exposed through the MatrixAPI OpenAI-compatible gateway.', 'chat,kukuai', '[1]', 1, 0, 0),
    ('gpt-5.4-openai-compact', 'Compact gpt-5.4 variant for efficient OpenAI-compatible chat calls.', 'chat,compact,kukuai', '[1]', 1, 0, 0),
    ('gpt-image2', 'kukuai upstream image generation model billed per request.', 'image,generation,kukuai', '[3]', 1, 0, 0)
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

-- Ensure every model currently exposed by the canonical Matrix API model service also
-- has an editable metadata row, including models not yet present in the public
-- metadata repository.
with channel_model_names as (
  select distinct trim(channel_model) as model_name
  from channels c
  cross join regexp_split_to_table(c.models, ',') as channel_model
  where c.id = (select min(id) from matrix_upstream_candidates)
    and trim(channel_model) <> ''
), missing_channel_models as (
  select cm.model_name
  from channel_model_names cm
  where not exists (
    select 1
    from models existing
    where existing.model_name = cm.model_name
      and existing.deleted_at is null
  )
)
insert into models (
  model_name, description, icon, tags, vendor_id, endpoints, status,
  sync_official, created_time, updated_time, name_rule
)
select
  missing.model_name,
  'Synced from the kukuai upstream catalog and available through the MatrixAPI OpenAI-compatible gateway.',
  case
    when lower(missing.model_name) like 'gemini%' then 'Google'
    when lower(missing.model_name) like 'grok%' then 'xAI'
    else 'OpenAI'
  end,
  case
    when lower(missing.model_name) like '%video%' then 'video,kukuai'
    when lower(missing.model_name) like '%image%' or lower(missing.model_name) like '%banana%' then 'image,kukuai'
    else 'chat,kukuai'
  end,
  case
    when lower(missing.model_name) like 'gemini%' then coalesce((select id from vendors where name = 'Google' and deleted_at is null order by id limit 1), 1)
    when lower(missing.model_name) like 'grok%' then coalesce((select id from vendors where name = 'xAI' and deleted_at is null order by id limit 1), 1)
    else coalesce((select id from vendors where name = 'OpenAI' and deleted_at is null order by id limit 1), 1)
  end,
  '',
  1,
  0,
  extract(epoch from now())::bigint,
  extract(epoch from now())::bigint,
  0
from missing_channel_models missing;
commit;
SQL

docker cp "$tmp_sql" matrixapi-db:/tmp/bootstrap-new-api-db.sql
docker exec \
  -e ZPAY_GATEWAY="$ZPAY_GATEWAY" \
  -e ZPAY_PID="$ZPAY_PID" \
  -e ZPAY_KEY="$ZPAY_KEY" \
  -e NEW_API_QUOTA_FOR_NEW_USER="$NEW_API_QUOTA_FOR_NEW_USER" \
  -e UPSTREAM_API_KEY="$UPSTREAM_API_KEY" \
  -e UPSTREAM_BASE_URL="$UPSTREAM_BASE_URL" \
  -e NEW_API_GROUP_RATIO="$NEW_API_GROUP_RATIO" \
  -e NEW_API_TOPUP_GROUP_RATIO="$NEW_API_TOPUP_GROUP_RATIO" \
  -e NEW_API_MIN_TOPUP="$NEW_API_MIN_TOPUP" \
  -e NEW_API_DEFAULT_MODELS="$NEW_API_DEFAULT_MODELS" \
  matrixapi-db sh -lc '
    psql -v ON_ERROR_STOP=1 -U matrixapi -d new_api \
      -v zpay_gateway="$ZPAY_GATEWAY" \
      -v zpay_pid="$ZPAY_PID" \
      -v zpay_key="$ZPAY_KEY" \
      -v quota_for_new_user="$NEW_API_QUOTA_FOR_NEW_USER" \
      -v upstream_key="$UPSTREAM_API_KEY" \
      -v upstream_base_url="$UPSTREAM_BASE_URL" \
      -v group_ratio="$NEW_API_GROUP_RATIO" \
      -v topup_group_ratio="$NEW_API_TOPUP_GROUP_RATIO" \
      -v min_topup="$NEW_API_MIN_TOPUP" \
      -v default_models="$NEW_API_DEFAULT_MODELS" \
      -f /tmp/bootstrap-new-api-db.sql
  '

echo "Matrix API database bootstrap finished."
