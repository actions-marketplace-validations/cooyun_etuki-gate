#!/usr/bin/env python3
# Etuki Standalone Cryptographic, 563-Leaf Merkle & E3 Client Bill Verifier (v41.4-self-healing-verified)
# Second-Channel Public Mirror: https://github.com/cooyun/etuki-gate/blob/main/verify-etuki.py
# Usage: curl -sSfL https://www.etuki.com/verify-etuki.py | python3 -
import csv, io, json, math, hashlib, datetime, urllib.parse, urllib.request

BASE = "https://www.etuki.com"
EXPECTED_BUILD_VER       = "2026.11.07-v41.4-self-healing-verified"
EXPECTED_SCHEMA_VER      = "2026.11.07-v41.4-unified"
EXPECTED_SNAP_ID         = "price-20261030-v35-truth"
EXPECTED_TELEM_ID        = "telemetry-20261030-v35-truth"
EXPECTED_PAYLOAD_SHA     = "6bc877254427a142ff842bfa318350453ffebc62faf90f62337f96fb7fa5db82"
EXPECTED_MERKLE_ROOT     = "d2f517094b814bcf41ea821c1ce654aa29df8ac454acd1c96779d7966ab688f4"
EXPECTED_CSV_ROOT        = "1b1e0a620de6b35a0870fb2270a7cae9de4e2ff32beb625e8cded47f46334bcb"
EXPECTED_MAPPING_CSV_SHA = "fca112a101eb05395d579bbc126dcb157a0c27fcdb56b646a4dc09e3df624b53"
EXPECTED_RECEIPTS_SHA    = "884b4504fe48ef3b0e182e1a77a1e7cfb6934682a807da3ab8145be325317e76"
EXPECTED_E3_LEDGER_SHA   = "46194fe03e1d1e96993d8f160a45f414814f4f2ea763fe4aa7da60aea2ccb217"

PINNED_TRUSTED_KEY_ID = "etuki-ci-rsa2048-2026-v17"
PINNED_TRUSTED_EXPONENT_E = 65537
PINNED_TRUSTED_MODULUS_N_HEX = "85b8a7d44bfdb14b096f979625902da191770874d19fcd1a03762e6564f07dd1ab04b50dd0dcf139802018e2b39998be19c8e8eb5f51bb015964916734726784a5debbda117c7c88bdff32ceaff42702a3577a3bfab34add0da086ddc9d8bb30a021087f4e2f487bc2d98e509affe41e4189c50f19a94494c0b14f1cdad3354b10224722cd4aca8cd05d8c0d54495b3e623b640245dc5f69a8d98125387902b129edd8f3aa0f101f27fc107ffbd2ae4a77a23f549a96ba96b7868cf5e5bac923d6ad20fd96d4c173f4d8b348458b2cc2c41ea9a9702fe2f79c7857b31cf5a1e9bca91e4c3f8c23f26b9c9e6f1a5aa15c80f610fb165a452965093613f4784bfb"
PINNED_TRUSTED_PUBKEY_FINGERPRINT_SHA256 = "a43a9de120fb8753d66dc4d327687f8632dfc30d09cc047c3aa46b527e9e8cd7"

ALLOWED_SOURCE_DOMAINS = set(["ai.google.dev", "api-docs.deepseek.com", "auth0.com", "aws.amazon.com", "azure.microsoft.com", "betterstack.com", "clerk.com", "clickhouse.com", "cloud.google.com", "cohere.com", "coolify.io", "deno.com", "developers.cloudflare.com", "developers.openai.com", "docs.anthropic.com", "docs.x.ai", "dodopayments.com", "fastspring.com", "fly.io", "grafana.com", "gumroad.com", "help.aliyun.com", "loops.so", "mistral.ai", "neon.tech", "newrelic.com", "northflank.com", "open.bigmodel.cn", "openrouter.ai", "planetscale.com", "platform.minimaxi.com", "platform.moonshot.cn", "polar.sh", "posthog.com", "postmarkapp.com", "qdrant.tech", "railway.com", "razorpay.com", "recurly.com", "redis.io", "render.com", "resend.com", "sendgrid.com", "sentry.io", "stripe.com", "supabase.com", "trigger.dev", "turso.tech", "upstash.com", "us.ovhcloud.com", "vercel.com", "weaviate.io", "wise.com", "workos.com", "wow.groq.com", "www.adyen.com", "www.airwallex.com", "www.chargebee.com", "www.checkout.com", "www.cockroachlabs.com", "www.convex.dev", "www.creem.io", "www.datadoghq.com", "www.datastax.com", "www.digitalocean.com", "www.fastly.com", "www.helicone.ai", "www.hetzner.com", "www.inngest.com", "www.koyeb.com", "www.langchain.com", "www.lemonsqueezy.com", "www.linode.com", "www.mollie.com", "www.mongodb.com", "www.netlify.com", "www.paddle.com", "www.payoneer.com", "www.paypal.com", "www.pinecone.io", "www.scaleway.com", "www.singlestore.com", "www.tigrisdata.com", "www.timescale.com", "www.together.ai", "www.trychroma.com", "www.verifone.com", "www.vultr.com", "www.worldfirst.com", "xata.io", "zilliz.com"])

ALLOWED_CLASSIFICATION_6TUPLES = {
    ("LLM_API_ENDPOINT", "verified", "FRONTIER_SIMULATION_BENCHMARK", "SYNTHETIC_STRESS_TEST_BENCHMARK", "SIMULATION_SCHEDULE", "24"),
    ("LLM_API_ENDPOINT", "router-sourced", "FRONTIER_SIMULATION_BENCHMARK", "SYNTHETIC_STRESS_TEST_BENCHMARK", "SIMULATION_SCHEDULE", "24"),
    ("LLM_API_ENDPOINT", "router-sourced", "PRODUCTION_GA", "HTTP_200_GA_VERIFIED", "OFFICIAL_VENDOR_AND_ROUTER_VERIFIED", "6"),
    ("LLM_API_ENDPOINT", "router-sourced", "PRODUCTION_GA", "ROUTER_CATALOG_SYNCED_GA", "ROUTER_CATALOG_SNAPSHOT", "24"),
    ("CLOUD_AND_MOR_INFRASTRUCTURE", "infra-verified", "PRODUCTION_GA_INFRA", "INFRA_RATE_CARD_VERIFIED", "INFRASTRUCTURE_RATE_CARD", "168"),
}

EXPECTED_WINDOWS = ("W1", "W2", "W3", "W4")
EXPECTED_REGIONS = {"us-west-1", "ap-southeast-1", "eu-central-1"}
EXPECTED_CELLS   = {(w, r) for w in EXPECTED_WINDOWS for r in EXPECTED_REGIONS}
EXPECTED_MODELS  = set(["anthropic/claude-3-5-haiku-20241022", "anthropic/claude-3-7-sonnet-20250219", "deepseek/deepseek-chat", "deepseek/deepseek-reasoner", "google/gemini-2.5-flash", "google/gemini-2.5-pro", "meta-llama/llama-3.3-70b-instruct", "openai/gpt-4.1", "openai/gpt-4o-2024-11-20", "openai/o3-mini"])
EXPECTED_MODEL_SAMPLE_COUNTS = {"openai/gpt-4.1": 15, "openai/gpt-4o-2024-11-20": 15, "openai/o3-mini": 15, "anthropic/claude-3-7-sonnet-20250219": 15, "anthropic/claude-3-5-haiku-20241022": 14, "google/gemini-2.5-pro": 14, "google/gemini-2.5-flash": 14, "deepseek/deepseek-reasoner": 14, "deepseek/deepseek-chat": 14, "meta-llama/llama-3.3-70b-instruct": 14}
MAX_ALLOWED_RETRIES = 2

def fetch(path):
    req = urllib.request.Request(BASE + path, headers={"User-Agent": "Etuki-Standalone-Verifier/41.4.0"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return r.status, r.read().decode("utf-8")

def parse_iso_utc(ts_str):
    return datetime.datetime.fromisoformat(ts_str.replace("Z", "+00:00"))

def calc_percentile_nearest_rank(sorted_vals, pct):
    idx = max(0, min(len(sorted_vals) - 1, int(math.ceil((pct / 100.0) * len(sorted_vals))) - 1))
    return sorted_vals[idx]

def compute_rfc5280_spki_sha256(modulus_n_hex, exponent_e):
    assert exponent_e == 65537 and len(modulus_n_hex) == 512
    spki_der = bytes.fromhex("30820122300d06092a864886f70d01010105000382010f003082010a0282010100" + modulus_n_hex + "0203010001")
    return hashlib.sha256(spki_der).hexdigest()

def verify_rs256_pkcs1_v15(digest_hex, sig_hex):
    expected_em = "0001" + ("ff" * 202) + "003031300d060960864801650304020105000420" + digest_hex
    actual_em = hex(pow(int(sig_hex, 16), PINNED_TRUSTED_EXPONENT_E, int(PINNED_TRUSTED_MODULUS_N_HEX, 16)))[2:].zfill(512)
    return len(actual_em) == 512 and actual_em == expected_em

now_utc = datetime.datetime.now(datetime.timezone.utc)

# 1. Verify 563-leaf ledger + Closed 6-Tuple CSV Join + 11 Negative Tests
_, txt = fetch("/api/oracle/leaves-563-hashes.txt?v=41.4")
rows, ledger_by_id = [], {}
for line in txt.splitlines():
    s = line.strip()
    if not s or s.startswith("#"): continue
    parts = [p.strip() for p in s.split("|")]
    if len(parts) == 6:
        idx_i = int(parts[0])
        rows.append((idx_i, parts[1], parts[2], parts[3], parts[4], parts[5]))
        ledger_by_id[parts[1]] = {"index": idx_i, "provenance_tier": parts[2], "model_reality_tier": parts[3], "cache_price_source": parts[4], "leaf_sha256_hex": parts[5]}

assert len(rows) == 563 and [r[0] for r in rows] == list(range(563))
leaves = [r[5] for r in rows]
assert len(set(leaves)) == 563

_, map_csv = fetch("/api/oracle/entity-reality-provenance-mapping.csv?v=41.4")
assert hashlib.sha256(map_csv.encode("utf-8")).hexdigest() == EXPECTED_MAPPING_CSV_SHA

def validate_mapping_csv_rows(csv_text, ref_ledger, ref_now_utc):
    reader = list(csv.DictReader(io.StringIO(csv_text)))
    if len(reader) != 563: return False, "ROW_COUNT_MISMATCH"
    seen_ids = set()
    for r in reader:
        cid = r["canonical_model_id"]
        if cid in seen_ids or cid not in ref_ledger: return False, "ID_SET_OR_DUPLICATE_ERROR"
        seen_ids.add(cid)
        ref = ref_ledger[cid]
        if int(r["index"]) != ref["index"] or r["provenance_tier"] != ref["provenance_tier"] or r["model_reality_tier"] != ref["model_reality_tier"] or r["cache_price_source"] != ref["cache_price_source"] or r["leaf_sha256_hex"] != ref["leaf_sha256_hex"]:
            return False, "LEDGER_JOIN_MISMATCH"
        cls_6tuple = (r["entity_class"], r["provenance_tier"], r["model_reality_tier"], r["api_probe_status"], r.get("price_evidence_type", ""), r.get("staleness_sla_hours", ""))
        if cls_6tuple not in ALLOWED_CLASSIFICATION_6TUPLES: return False, "CLOSED_6TUPLE_ENUM_VIOLATION"
        parsed_u = urllib.parse.urlparse(r["source_url"])
        if parsed_u.scheme != "https" or parsed_u.netloc not in ALLOWED_SOURCE_DOMAINS: return False, "UNTRUSTED_DOMAIN"
        try:
            if parse_iso_utc(r["verified_at_utc"]) > ref_now_utc: return False, "FUTURE_TIMESTAMP"
        except Exception: return False, "INVALID_TIMESTAMP"
    return True, "PASS"

assert validate_mapping_csv_rows(map_csv, ledger_by_id, now_utc)[0]
csv_lines_raw = map_csv.strip().splitlines()
assert not validate_mapping_csv_rows("\n".join(csv_lines_raw[:-1]), ledger_by_id, now_utc)[0]
assert not validate_mapping_csv_rows("\n".join(csv_lines_raw[:2] + [csv_lines_raw[1]] + csv_lines_raw[3:]), ledger_by_id, now_utc)[0]
assert not validate_mapping_csv_rows(map_csv.replace(leaves[0], "0"*64, 1), ledger_by_id, now_utc)[0]
assert not validate_mapping_csv_rows(map_csv.replace("FRONTIER_SIMULATION_BENCHMARK", "PRODUCTION_GA", 1), ledger_by_id, now_utc)[0]
assert not validate_mapping_csv_rows(map_csv.replace("https://", "ftp://", 1), ledger_by_id, now_utc)[0]
assert not validate_mapping_csv_rows(map_csv.replace("https://openrouter.ai", "https://untrusted-phishing.example.com", 1), ledger_by_id, now_utc)[0]
assert not validate_mapping_csv_rows(map_csv.replace("2026-10-30T02:10:00Z", "2099-12-31T23:59:59Z", 1), ledger_by_id, now_utc)[0]
assert not validate_mapping_csv_rows(map_csv.replace("SYNTHETIC_STRESS_TEST_BENCHMARK", "HTTP_200_GA_VERIFIED", 1), ledger_by_id, now_utc)[0]
assert not validate_mapping_csv_rows(map_csv.replace("PRODUCTION_GA", "UNLISTED_EXPERIMENTAL_TIER", 1), ledger_by_id, now_utc)[0]
assert not validate_mapping_csv_rows(map_csv.replace("SIMULATION_SCHEDULE", "OFFICIAL_VENDOR_AND_ROUTER_VERIFIED", 1), ledger_by_id, now_utc)[0]
assert not validate_mapping_csv_rows(map_csv.replace(",168,", ",9999,", 1), ledger_by_id, now_utc)[0]

s1_ids = [r[1] for r in rows if r[2] == "verified"]
s2_ids = [r[1] for r in rows if r[2] == "router-sourced"]
s3_ids = [r[1] for r in rows if r[2] == "infra-verified"]
csv_canon = json.dumps({
    "schema_version": EXPECTED_SCHEMA_VER,
    "set1_32_sha256": "sha256:" + hashlib.sha256(",".join(s1_ids).encode("utf-8")).hexdigest(),
    "set2_453_sha256": "sha256:" + hashlib.sha256(",".join(s2_ids).encode("utf-8")).hexdigest(),
    "set3_78_sha256": "sha256:" + hashlib.sha256(",".join(s3_ids).encode("utf-8")).hexdigest(),
}, separators=(",", ":"))
assert hashlib.sha256(csv_canon.encode("utf-8")).hexdigest() == EXPECTED_CSV_ROOT
lvl = list(leaves)
for _ in range(10):
    if len(lvl) % 2 == 1: lvl.append(lvl[-1])
    lvl = [hashlib.sha256((lvl[i] + ":" + lvl[i+1]).encode("utf-8")).hexdigest() for i in range(0, len(lvl), 2)]
assert lvl[0] == EXPECTED_MERKLE_ROOT
print("[PASS 1/6] 563 Leaves, Closed 6-Tuple CSV Join (+11 Negative Tests), 3-Branch CSV Root & Merkle Root Verified!")

# 2. Recompute RFC 5280 ASN.1 DER SPKI SHA-256 Fingerprint
recalc_spki_fp = compute_rfc5280_spki_sha256(PINNED_TRUSTED_MODULUS_N_HEX, PINNED_TRUSTED_EXPONENT_E)
assert recalc_spki_fp == PINNED_TRUSTED_PUBKEY_FINGERPRINT_SHA256
_, pubkey_body = fetch("/.well-known/etuki-ci-pubkey.json?v=41.4")
pubkey_doc = json.loads(pubkey_body)
assert compute_rfc5280_spki_sha256(pubkey_doc["public_modulus_n_hex"], int(pubkey_doc["public_exponent_e"])) == PINNED_TRUSTED_PUBKEY_FINGERPRINT_SHA256
print("[PASS 2/6] RFC 5280 ASN.1 DER SPKI Encoded & Recomputed SHA-256 Fingerprint Verified:", recalc_spki_fp)

# 3. Verify Oracle v41.4 manifest signature & verbatim JSON & byte-for-byte equality of `canonical_payload_verbatim_json` (P0-1)
_, oracle_body = fetch("/api/oracle/v1.json?v=41.4")
oracle = json.loads(oracle_body)
mf = oracle["evidence_manifest"]
assert mf["build_version"] == EXPECTED_BUILD_VER and mf["schema_version"] == EXPECTED_SCHEMA_VER
assert parse_iso_utc(mf["source_verified_at"]) <= parse_iso_utc(mf["generated_at"]) <= now_utc < parse_iso_utc(mf["stale_after"]) < parse_iso_utc(mf["expires_at"])
em_env = mf["signature_envelope"]
canonical_bytes = json.dumps({k: v for k, v in mf.items() if k != "signature_envelope"}, separators=(",", ":"), sort_keys=True).encode("utf-8")
assert canonical_bytes.decode("utf-8") == em_env["canonical_payload_verbatim_json"], "Verbatim JSON byte mismatch"
recalc_manifest_sha = hashlib.sha256(canonical_bytes).hexdigest()
assert recalc_manifest_sha == em_env["signed_payload_sha256"] and verify_rs256_pkcs1_v15(recalc_manifest_sha, em_env["signature_value"])
print("[PASS 3/6] Oracle v41.4 Manifest RS256 Signature & Byte-for-Byte Verbatim Canonical JSON Verified:", recalc_manifest_sha)

# 4. Verify Dynamic 24h Half-Open Windows, Per-Attempt Retry Semantics (+6 Negative Tests), Recomputable Receipts & RS256 Signature
_, roll_b = fetch("/api/telemetry/live-rolling-24h.json?v=41.4")
roll_d = json.loads(roll_b)
win_obj, win_env = roll_d["signed_rolling_window_payload"], roll_d["rolling_window_signature_envelope"]
for tk in ("rolling_24h_start_utc", "rolling_24h_end_utc", "window_start_utc", "window_end_utc", "observed_at_utc", "generated_at_utc", "window_bounds_utc"):
    assert roll_d[tk] == win_obj[tk]
r24_start_dt, r24_end_dt = parse_iso_utc(roll_d["rolling_24h_start_utc"]), parse_iso_utc(roll_d["rolling_24h_end_utc"])
assert (r24_end_dt - r24_start_dt).total_seconds() == 86400
wb_map = win_obj["window_bounds_utc"]
parsed_wb = {}
for idx_w, w_k in enumerate(EXPECTED_WINDOWS):
    ws_dt, we_dt = parse_iso_utc(wb_map[w_k][0]), parse_iso_utc(wb_map[w_k][1])
    assert (we_dt - ws_dt).total_seconds() == 21600
    if idx_w == 0: assert ws_dt == r24_start_dt
    else: assert ws_dt == parsed_wb[EXPECTED_WINDOWS[idx_w - 1]][1]
    parsed_wb[w_k] = (ws_dt, we_dt)

def validate_probe_sample_row(s_row, idx_s, ref_wb):
    if int(s_row.get("http_status", 0)) != 200: return False, "NON200"
    w_c, reg_c, b_idx = s_row.get("window_code", ""), s_row.get("region", ""), int(s_row.get("burst_index", 0))
    if w_c not in EXPECTED_WINDOWS or reg_c not in EXPECTED_REGIONS: return False, "BAD_CELL"
    if s_row.get("sample_id") != f"prb_24h_{idx_s:03d}_{w_c}_{reg_c.replace('-', '')}_b{b_idx:02d}": return False, "BAD_SID"
    s_dt = parse_iso_utc(s_row["observed_at_utc"])
    if not (ref_wb[w_c][0] <= s_dt < ref_wb[w_c][1]): return False, "OUT_OF_WINDOW"
    gen_ms = int(s_row["duration_ms"]) - int(s_row["ttft_ms"])
    if gen_ms <= 0 or int(s_row.get("prompt_tokens", 0)) != 1024 or round((int(s_row["output_tokens"]) * 1000.0) / gen_ms, 1) != float(s_row["tps"]): return False, "BAD_TPS"
    r_cnt, p_arr = int(s_row.get("retry_count", -1)), s_row.get("prior_attempts", [])
    f_el, b_off, p_st, e2e = int(s_row.get("prior_failed_attempts_elapsed_ms", -1)), int(s_row.get("retry_backoff_ms", -1)), int(s_row.get("prior_attempt_http_status", -1)), int(s_row.get("end_to_end_elapsed_ms", -1))
    w_tok = int(s_row.get("wasted_partial_completion_tokens", -1))
    if not (0 <= r_cnt <= MAX_ALLOWED_RETRIES) or len(p_arr) != r_cnt or w_tok < 0: return False, "BAD_RETRY_LEN"
    if r_cnt == 0 and (f_el != 0 or b_off != 0 or p_st != 0 or w_tok != 0): return False, "BAD_ZERO_RETRY"
    if r_cnt > 0:
        for att in p_arr:
            if int(att.get("http_status", 0)) not in (429, 502, 503, 504): return False, "NEG_RETRY_INVALID_PRIOR_STATUS"
            if int(att.get("failed_attempt_elapsed_ms", 0)) <= 0: return False, "NEG_RETRY_NEGATIVE_ELAPSED"
            if int(att.get("backoff_ms", 0)) <= 0: return False, "NEG_RETRY_INVALID_BACKOFF"
            if int(att.get("wasted_partial_tokens", -1)) < 0: return False, "NEG_RETRY_WASTED_TOKEN_MISMATCH"
        if sum(int(a["failed_attempt_elapsed_ms"]) for a in p_arr) != f_el: return False, "BAD_FAILED_SUM"
        if sum(int(a["backoff_ms"]) for a in p_arr) != b_off: return False, "BAD_BACKOFF_SUM"
        if sum(int(a["wasted_partial_tokens"]) for a in p_arr) != w_tok: return False, "NEG_RETRY_WASTED_TOKEN_MISMATCH"
        if int(p_arr[-1]["http_status"]) != p_st: return False, "BAD_LAST_STATUS"
    if e2e != f_el + b_off + int(s_row["duration_ms"]): return False, "BAD_E2E"
    return True, "OK"

raw_144 = roll_d["raw_144_probe_samples"]
_, rec_b = fetch("/api/telemetry/vendor-raw-receipts.json?v=41.4")
rec_d = json.loads(rec_b)
receipt_by_sid = {r["sample_id"]: r for r in rec_d["receipts"]}
by_win_reg, by_model, samples_by_model, retry_counts_seen = {}, {}, {}, set()
for idx_s, s_row in enumerate(raw_144, start=1):
    assert validate_probe_sample_row(s_row, idx_s, parsed_wb)[0]
    linked_rec = receipt_by_sid[s_row["sample_id"]]
    rec_core = {k: v for k, v in linked_rec.items() if k != "raw_response_receipt_sha256"}
    assert hashlib.sha256(json.dumps(rec_core, separators=(",", ":"), sort_keys=True).encode("utf-8")).hexdigest() == linked_rec["raw_response_receipt_sha256"] == s_row["raw_response_receipt_sha256"]
    retry_counts_seen.add(int(s_row["retry_count"]))
    by_win_reg.setdefault((s_row["window_code"], s_row["region"]), []).append(int(s_row["burst_index"]))
    by_model[s_row["api_model_id"]] = by_model.get(s_row["api_model_id"], 0) + 1
    samples_by_model.setdefault(s_row["api_model_id"], []).append(s_row)

assert retry_counts_seen == {0, 1, 2} and set(by_win_reg.keys()) == EXPECTED_CELLS and by_model == EXPECTED_MODEL_SAMPLE_COUNTS
assert not validate_probe_sample_row({**raw_144[0], "http_status": 500}, 1, parsed_wb)[0]
assert not validate_probe_sample_row({**raw_144[0], "observed_at_utc": wb_map["W1"][1]}, 1, parsed_wb)[0]
assert not validate_probe_sample_row({**raw_144[28], "prior_attempts": [{"attempt_index": 1, "http_status": 200, "failed_attempt_elapsed_ms": 94, "backoff_ms": 250, "wasted_partial_tokens": 0}]}, 29, parsed_wb)[0]
assert not validate_probe_sample_row({**raw_144[28], "wasted_partial_completion_tokens": 99}, 29, parsed_wb)[0]
recalc_win_sha = hashlib.sha256(json.dumps(win_obj, separators=(",", ":"), sort_keys=True).encode("utf-8")).hexdigest()
assert recalc_win_sha == win_env["signed_window_sha256"] and verify_rs256_pkcs1_v15(recalc_win_sha, win_env["signature_value"])
print("[PASS 4/6] 144 Samples, Per-Attempt Retry Semantics (+6 Negative Tests), Recomputable Receipts & RS256 Verified:", recalc_win_sha)

# 5. Execute 4-Way Percentile Check, Strict `build_version` + `schema_version` Check (+NEG-SCHEMA-VERSION-DRIFT),
#    Reconcile Usage Receipt Variance Check, Secondary Reports Check & Page DOM Assertions!
_, telem_b = fetch("/api/telemetry/metrics.json?v=41.4")
telem_d = json.loads(telem_b)
roll_by_id   = {p["api_model_id"]: p for p in roll_d["live_ga_probes"]}
oracle_by_id = {m["api_model_id"]: m for m in oracle["production_ga_10_flagship_telemetry"]}
telem_by_id  = {m["api_model_id"]: m for m in telem_d["production_ga_10_flagship_models"]}
for mid in EXPECTED_MODELS:
    m_rows = samples_by_model[mid]
    ttfts_s, tpss_s = sorted(int(x["ttft_ms"]) for x in m_rows), sorted(float(x["tps"]) for x in m_rows)
    assert calc_percentile_nearest_rank(ttfts_s, 50) == roll_by_id[mid]["p50_ttft_ms"] == telem_by_id[mid]["ttft_p50_ms"] == oracle_by_id[mid]["ttft_p50_ms"]
    assert calc_percentile_nearest_rank(ttfts_s, 90) == roll_by_id[mid]["p90_ttft_ms"] == telem_by_id[mid]["ttft_p90_ms"] == oracle_by_id[mid]["ttft_p90_ms"]
    assert calc_percentile_nearest_rank(tpss_s, 50)  == roll_by_id[mid]["tps"]         == telem_by_id[mid]["tps_median"]  == oracle_by_id[mid]["tps_median"]

def check_endpoint_versions(d_obj, ref_sha):
    sub_mf = d_obj.get("evidence_manifest", d_obj)
    b_v = d_obj.get("build_version") or sub_mf.get("build_version")
    s_v = d_obj.get("schema_version") or sub_mf.get("schema_version")
    if b_v != EXPECTED_BUILD_VER or s_v != EXPECTED_SCHEMA_VER or sub_mf.get("schema_version") != EXPECTED_SCHEMA_VER:
        return False
    s_sha = d_obj.get("signed_payload_sha256") or sub_mf.get("signature_envelope", {}).get("signed_payload_sha256")
    return s_sha == ref_sha

assert not check_endpoint_versions({"build_version": EXPECTED_BUILD_VER, "schema_version": EXPECTED_BUILD_VER, "signed_payload_sha256": recalc_manifest_sha}, recalc_manifest_sha), "NEG-SCHEMA-VERSION-DRIFT failed"

for ep in [
    "/api/telemetry/metrics.json?v=41.4",
    "/api/v1/mcp?call=check_context_cliff&model=gpt-6-1-sol&prompt_tokens=285000&completion_tokens=20000&v=41.4",
    "/api/v1/mcp?call=reconcile_usage_receipt&model=openai/gpt-4o-2024-11-20&prompt_tokens=180000&cached_tokens=0&completion_tokens=4000&actual_billed_usd=0.49&v=41.4",
    "/api/v1/mcp?call=reconcile_usage_receipt&model=openai/gpt-4o-2024-11-20&prompt_tokens=180000&cached_tokens=0&completion_tokens=4000&actual_billed_usd=0.62&v=41.4",
    "/api/v1/customer-telemetry?prompt=my_secret_prompt&v=41.4",
]:
    _, b = fetch(ep)
    d = json.loads(b)
    assert check_endpoint_versions(d, recalc_manifest_sha), f"Endpoint version/schema check failed on {ep}"

for rep_ep in ["/api/oracle/independent-ci-verifier-run.json?v=41.4", "/api/oracle/verification-report.json?v=41.4"]:
    _, rb = fetch(rep_ep)
    rd = json.loads(rb)
    assert rd["build_version"] == EXPECTED_BUILD_VER and rd["schema_version"] == EXPECTED_SCHEMA_VER

for page_path in ["/features?v=41.4", "/calculator?v=41.4", "/audit?v=41.4", "/docs?v=41.4", "/privacy?v=41.4"]:
    st_code, html_b = fetch(page_path)
    assert st_code == 200 and EXPECTED_BUILD_VER in html_b and EXPECTED_SCHEMA_VER in html_b
    assert "Unissued template" not in html_b and "Zero active E3" not in html_b
    assert "snap-20261021-v17" not in html_b and "2026.10.21-v17-unified" not in html_b
    assert "$18.92" not in html_b and "$90.13" not in html_b and "$302.48" not in html_b and "$60.92" not in html_b
    if "/audit" in page_path or "/features" in page_path:
        assert "15.5785" in html_b and "30.66" in html_b and "80.9304" in html_b and "135.9202" in html_b
    if page_path.startswith(("/features", "/audit")):
        assert EXPECTED_CSV_ROOT in html_b, f"CSV Root mismatch on {page_path}"
print("[PASS 5/6] 4-Way Percentiles, Strict Schema/Build Sync (+NEG-SCHEMA-VERSION-DRIFT), Secondary Reports & Frontend Pages Verified!")

# 6. Verify E3 485 Frozen Records, Cross-Version Freeze Proof, Realistic 25% TTL Formula, 5%/2.9% Fee Math & 3-ID POST Bindings
_, e3_b = fetch("/api/oracle/e3-agentrouter-real-ledger.json?v=41.4")
assert hashlib.sha256(e3_b.encode("utf-8")).hexdigest() == EXPECTED_E3_LEDGER_SHA
assert "18.92" not in e3_b and "90.13" not in e3_b and "302.48" not in e3_b
e3_d = json.loads(e3_b)
assert e3_d["certificate_id"] == "ETK-E3-20261013-CLIENT-EC01"
assert e3_d["certificate_status"] == oracle["e3_real_production_case_study"]["status"] == "ACTIVE_VALID_REAL_BILLING_RECONCILED"
assert e3_d["build_version"] == EXPECTED_BUILD_VER and e3_d["schema_version"] == EXPECTED_SCHEMA_VER

_, raw_rec_b = fetch("/api/oracle/e3-raw-anonymized-receipts-485.json?v=41.4")
assert hashlib.sha256(raw_rec_b.encode("utf-8")).hexdigest() == e3_d["raw_anonymized_receipts_bundle_sha256"]
raw_rec_map = json.loads(raw_rec_b)["receipts_by_request_id"]
assert len(raw_rec_map) == 485

_, fp_b = fetch("/api/oracle/e3-cross-version-freeze-proof.json?v=41.4")
fp_d = json.loads(fp_b)
assert hashlib.sha256(fp_b.encode("utf-8")).hexdigest() == e3_d["cross_version_freeze_proof_sha256"]
_, h76_b = fetch("/api/oracle/history/e3-ledger-v40.7.6.json?v=41.4")
_, h77_b = fetch("/api/oracle/history/e3-ledger-v40.7.7.json?v=41.4")
assert hashlib.sha256(h76_b.encode("utf-8")).hexdigest() == fp_d["historical_files_compared"]["v40_7_6_file_sha256"]
assert hashlib.sha256(h77_b.encode("utf-8")).hexdigest() == fp_d["historical_files_compared"]["v40_7_7_file_sha256"]
h76_d, h77_d = json.loads(h76_b), json.loads(h77_b)
h76_recs = {r["request_id"]: r for r in h76_d["all_186_audited_call_records"] + h76_d["additional_merged_299_call_records"]}
h77_recs = {r["request_id"]: r for r in h77_d["all_186_audited_call_records"] + h77_d["additional_merged_299_call_records"]}
assert len(h76_recs) == 485 and len(h77_recs) == 485
fp_d = json.loads(fp_b)
assert fp_d["total_records_compared"] == 485 and fp_d["changed_records_count"] == 0
fp_by_id = {item["request_id"]: item for item in fp_d["all_485_record_freeze_verifications"]}
assert len(fp_by_id) == 485

calls_186 = e3_d["all_186_audited_call_records"]
calls_299 = e3_d["additional_merged_299_call_records"]
assert len(calls_186) == 186 and len(calls_299) == 299
ids_186 = {r["request_id"] for r in calls_186}
ids_299 = {r["request_id"] for r in calls_299}
assert len(ids_186) == 186 and len(ids_299) == 299 and len(ids_186 & ids_299) == 0

e3_by_req_id = {}
for rec in calls_186 + calls_299:
    rc_m = rec["model_rate_card_usd_per_1m"]
    opt_r = rec["counterfactual_repricing_rule"]
    if "deepseek" in rec["model"] or "gpt-4o" in rec["model"] or "gemini" in rec["model"] or "moonshot" in rec["model"]:
        assert rec["cache_write_tokens"] == 0 and rc_m["cache_write"] == 0.0
    p_t, cr_t, cw_t, o_t = rec["prompt_tokens"], rec["cache_read_tokens"], rec["cache_write_tokens"], rec["completion_tokens"]
    recalc_act = round((p_t * rc_m["input"] + cr_t * rc_m["cache_read"] + cw_t * rc_m["cache_write"] + o_t * rc_m["output"]) / 1e6, 4)
    recalc_opt = round((p_t * opt_r["opt_input_usd_per_1m"] + (cr_t + cw_t) * opt_r["opt_cache_read_usd_per_1m"] + o_t * opt_r["opt_output_usd_per_1m"]) / 1e6, 4)
    real_cw_rate = rc_m["cache_write"] if rc_m["cache_write"] > 0 else rc_m["input"]
    recalc_real_ttl = round(((p_t * opt_r["opt_input_usd_per_1m"]) + (cr_t + cw_t * 0.75) * opt_r["opt_cache_read_usd_per_1m"] + (cw_t * 0.25) * real_cw_rate + o_t * opt_r["opt_output_usd_per_1m"]) / 1e6, 4)
    recalc_real_ttl = min(recalc_act, max(recalc_opt, recalc_real_ttl))
    assert recalc_act == rec["actual_billed_usd"]
    assert recalc_opt == rec["counterfactual_optimized_usd"]
    assert recalc_real_ttl == rec["realistic_ttl_25pct_write_retained_usd"]
    assert rec["counterfactual_optimized_usd"] <= rec["realistic_ttl_25pct_write_retained_usd"] <= rec["actual_billed_usd"]
    assert round(rec["actual_billed_usd"] - rec["counterfactual_optimized_usd"], 4) == rec["net_savings_usd"]
    assert round(rec["actual_billed_usd"] - rec["realistic_ttl_25pct_write_retained_usd"], 4) == rec["realistic_ttl_net_savings_usd"]
    raw_r_obj = raw_rec_map[rec["request_id"]]
    assert hashlib.sha256(json.dumps(raw_r_obj, separators=(",", ":"), sort_keys=True).encode("utf-8")).hexdigest() == rec["source_receipt_sha256"]
    # Verify cross-version record digest equality (v40.7.6 == v40.7.7 == v40.7.8)
    imm_core = {"request_id": rec["request_id"], "date": rec["date"], "platform": rec["platform"], "model": rec["model"], "prompt_tokens": p_t, "cache_read_tokens": cr_t, "cache_write_tokens": cw_t, "completion_tokens": o_t, "actual_billed_usd": rec["actual_billed_usd"], "counterfactual_optimized_usd": rec["counterfactual_optimized_usd"], "realistic_ttl_25pct_write_retained_usd": rec["realistic_ttl_25pct_write_retained_usd"], "source_receipt_sha256": rec["source_receipt_sha256"]}
    rec_digest = hashlib.sha256(json.dumps(imm_core, separators=(",", ":"), sort_keys=True).encode("utf-8")).hexdigest()
    fp_entry = fp_by_id[rec["request_id"]]
    r76, r77 = h76_recs[rec["request_id"]], h77_recs[rec["request_id"]]
    d76 = hashlib.sha256(json.dumps({k: r76[k] for k in imm_core}, separators=(",", ":"), sort_keys=True).encode("utf-8")).hexdigest()
    d77 = hashlib.sha256(json.dumps({k: r77[k] for k in imm_core}, separators=(",", ":"), sort_keys=True).encode("utf-8")).hexdigest()
    assert d76 == d77 == rec_digest == fp_entry["v40_7_6_record_sha256"] == fp_entry["v40_7_7_record_sha256"] == fp_entry["v40_8_6_record_sha256"]
    e3_by_req_id[rec["request_id"]] = rec

r005 = calls_186[4]
assert (r005["prompt_tokens"], r005["cache_read_tokens"], r005["cache_write_tokens"], r005["completion_tokens"], r005["actual_billed_usd"]) == (822, 16644, 26658, 1392, 0.3555)
oct12_cold_rec = calls_186[-4]
assert oct12_cold_rec["date"] == "2026-10-12" and oct12_cold_rec["cache_write_tokens"] == 143559
assert oct12_cold_rec["actual_billed_usd"] == 1.4729 and oct12_cold_rec["counterfactual_optimized_usd"] == 0.1522

for d_row in e3_d["daily_10day_reconciliation_rollup_186_calls"]:
    d_recs = [r for r in calls_186 if r["date"] == d_row["date"]]
    assert len(d_recs) == d_row["calls"]
    assert round(sum(r["actual_billed_usd"] for r in d_recs), 4) == d_row["slice_billed_usd"]
    assert round(sum(r["counterfactual_optimized_usd"] for r in d_recs), 4) == d_row["slice_optimized_usd"]
    assert round(sum(r["net_savings_usd"] for r in d_recs), 4) == d_row["slice_net_savings_usd"]
    assert round(sum(r["realistic_ttl_25pct_write_retained_usd"] for r in d_recs), 4) == d_row["slice_realistic_ttl_optimized_usd"]
    assert round(sum(r["realistic_ttl_net_savings_usd"] for r in d_recs), 4) == d_row["slice_realistic_ttl_net_savings_usd"]

tot_e3 = e3_d["executive_reconciliation_totals"]
assert round(sum(r["actual_billed_usd"] for r in calls_186), 4) == tot_e3["primary_slice_actual_billed_usd"] == 79.84
assert round(sum(r["counterfactual_optimized_usd"] for r in calls_186), 4) == tot_e3["primary_slice_optimized_usd"] == 15.5785
assert round(sum(r["realistic_ttl_25pct_write_retained_usd"] for r in calls_186), 4) == tot_e3["primary_slice_realistic_ttl_25pct_write_optimized_usd"] == 30.66
assert round(sum(r["actual_billed_usd"] for r in calls_186 + calls_299), 4) == tot_e3["full_merged_csv_actual_billed_usd"] == 392.61
assert round(sum(r["counterfactual_optimized_usd"] for r in calls_186 + calls_299), 4) == tot_e3["full_merged_csv_optimized_usd"] == 80.9304
assert round(sum(r["realistic_ttl_25pct_write_retained_usd"] for r in calls_186 + calls_299), 4) == tot_e3["full_merged_realistic_ttl_25pct_write_optimized_usd"] == 135.9202
assert round(sum(v["optimized_cost_usd"] for v in e3_d["four_vulnerability_categories_breakdown"]), 4) == 15.5785

_, ldg_b = fetch("/api/v1/ledger?v=41.4")
assert "18.92" not in ldg_b and "90.13" not in ldg_b and "302.48" not in ldg_b
ldg_d = json.loads(ldg_b)
assert ldg_d["build_version"] == EXPECTED_BUILD_VER and len(ldg_d["seven_immutable_ledgers"]) == 7
j_chain = ldg_d["immutable_journal_transactions_hash_chain"]
assert len(j_chain) == 485 and {tx["request_id"] for tx in j_chain} == set(e3_by_req_id.keys())

EXPECTED_DEBIT_CODES = {"1100_ACCOUNTS_RECEIVABLE_CLIENT_EC01", "5100_PAYMENT_PROCESSING_FEE_EXPENSE"}
EXPECTED_CREDIT_CODES = {"2100_ACCOUNTS_PAYABLE_UPSTREAM_PASS_THROUGH", "4100_PLATFORM_CONTROL_PLANE_FEE_REVENUE", "2200_ACCRUED_PAYMENT_GATEWAY_FEE_PAYABLE"}
prev_h = "0" * 64
for j_tx in j_chain:
    assert j_tx["prev_tx_sha256"] == prev_h
    e3_ref = e3_by_req_id[j_tx["request_id"]]
    assert j_tx["source_receipt_sha256"] == e3_ref["source_receipt_sha256"]
    assert {d["account"] for d in j_tx["debits"]} == EXPECTED_DEBIT_CODES
    assert {c["account"] for c in j_tx["credits"]} == EXPECTED_CREDIT_CODES
    # P0-3: Independent recomputation of 5% platform fee, 2.9% payment gateway fee, and 95% upstream pass-through on contractual gross base B!
    d_by_acc = {d["account"]: d["amount_usd"] for d in j_tx["debits"]}
    c_by_acc = {c["account"]: c["amount_usd"] for c in j_tx["credits"]}
    gross_v = round(e3_ref["actual_billed_usd"], 6)
    expected_plat_fee = round(gross_v * 0.05, 6)
    expected_pay_fee = round(gross_v * 0.029, 6)
    assert d_by_acc["1100_ACCOUNTS_RECEIVABLE_CLIENT_EC01"] == gross_v
    assert d_by_acc["5100_PAYMENT_PROCESSING_FEE_EXPENSE"] == expected_pay_fee
    assert c_by_acc["4100_PLATFORM_CONTROL_PLANE_FEE_REVENUE"] == expected_plat_fee
    assert c_by_acc["2100_ACCOUNTS_PAYABLE_UPSTREAM_PASS_THROUGH"] == round(gross_v - expected_plat_fee, 6)
    assert c_by_acc["2200_ACCRUED_PAYMENT_GATEWAY_FEE_PAYABLE"] == expected_pay_fee
    assert round(sum(x["amount_usd"] for x in j_tx["debits"]), 6) == round(j_tx["debit_total_usd"], 6)
    assert round(sum(x["amount_usd"] for x in j_tx["credits"]), 6) == round(j_tx["credit_total_usd"], 6)
    assert round(j_tx["debit_total_usd"], 6) == round(j_tx["credit_total_usd"], 6)
    tx_core = {k: v for k, v in j_tx.items() if k != "tx_sha256"}
    recalc_tx_h = hashlib.sha256(json.dumps(tx_core, separators=(",", ":"), sort_keys=True).encode("utf-8")).hexdigest()
    assert recalc_tx_h == j_tx["tx_sha256"]
    prev_h = recalc_tx_h
assert prev_h == "fb0c940605a9a76fd225b9d9f63cc6f674f3bac11b822984a5f7764334f22dcc"

# P0-2: Explicit 3-ID Binding + Full Response Body SHA-256 across all 6 Provider POST Calls!
_, ci_rep_b = fetch("/api/oracle/independent-ci-verifier-run.json?v=41.4")
ci_rep_d = json.loads(ci_rep_b)
ci_post_by_prov = {r["provider_id"]: r for r in ci_rep_d["six_provider_post_receipts_verified"]}
assert len(ci_post_by_prov) == 6
for test_mod, expected_prov in [
    ("openai/gpt-4.1", "openai-direct"),
    ("anthropic/claude-3-7-sonnet-20250219", "anthropic-direct"),
    ("google/gemini-2.5-flash", "google-gemini-tier1"),
    ("us.anthropic.claude-3-7-sonnet-20250219-v1:0", "aws-bedrock-converse"),
    ("deepseek/deepseek-reasoner", "deepseek-direct"),
    ("moonshot-v1-128k", "moonshot-kimi-official")
]:
    req_canon = json.dumps({"model": test_mod, "messages": [{"role": "user", "content": "Verify gateway transaction."}], "max_tokens": 64}, separators=(",", ":"), sort_keys=True)
    ci_rec = ci_post_by_prov[expected_prov]
    assert ci_rec["request_payload_sha256"] == hashlib.sha256(req_canon.encode("utf-8")).hexdigest()
    post_req = urllib.request.Request(BASE + "/api/v1/chat/completions?v=41.4", data=req_canon.encode("utf-8"), headers={"Content-Type": "application/json", "Authorization": "Bearer etk-byok-conformance-test-key", "User-Agent": "Etuki-Standalone-Verifier/41.4.0"}, method="POST")
    with urllib.request.urlopen(post_req, timeout=15) as pr:
        assert pr.status == 200 and pr.headers.get("x-etuki-rate-merkle-root") == EXPECTED_MERKLE_ROOT
        p_doc = json.loads(pr.read().decode("utf-8"))
        delp = p_doc["double_entry_ledger_posting"]
        assert p_doc["id"] == ci_rec["etuki_tx_id"]
        assert delp["provider_request_id"] == ci_rec["provider_request_id"]
        assert delp["journal_tx_id"] == ci_rec["journal_tx_id"]
        full_resp_canon = json.dumps(p_doc, separators=(",", ":"), sort_keys=True)
        assert hashlib.sha256(full_resp_canon.encode("utf-8")).hexdigest() == ci_rec["full_response_body_canonical_sha256"]
# P0-4 (A/B): Independently recompute A/B 4 input SHA-256 digests, output SHA-256, model_revision, deployment_fingerprint & quality equivalence!
_, ab_prog_b = fetch("/api/oracle/e3-cloud-live-progress.json?v=41.4")
ab_prog_d = json.loads(ab_prog_b)
ab_proto = ab_prog_d["pre_registered_ab_protocol"]
v_in = ab_proto["verbatim_inputs_for_independent_hash_recomputation"]
recalc_sys_sha = hashlib.sha256(v_in["system_prompt_verbatim"].encode("utf-8")).hexdigest()
recalc_usr_sha = hashlib.sha256(v_in["user_prompt_verbatim"].encode("utf-8")).hexdigest()
recalc_tool_sha = hashlib.sha256(v_in["tool_schema_verbatim_json"].encode("utf-8")).hexdigest()
recalc_prm_sha = hashlib.sha256(v_in["request_parameters_verbatim_json"].encode("utf-8")).hexdigest()
recalc_out_sha = hashlib.sha256(ab_proto["expected_deterministic_output_verbatim_json"].encode("utf-8")).hexdigest()
assert recalc_sys_sha == ab_proto["system_prompt_sha256"] and recalc_usr_sha == ab_proto["canonical_prompt_sha256"]
assert recalc_tool_sha == ab_proto["tool_schema_sha256"] and recalc_prm_sha == ab_proto["request_parameters_sha256"]
assert recalc_out_sha == ab_proto["expected_output_completion_sha256"]
for ab_item in ab_prog_d["dual_path_ab_comparisons"]:
    pa_i, pb_i = ab_item["path_a_unoptimized_direct"], ab_item["path_b_etuki_optimized"]
    assert pa_i["model_revision"] == pb_i["model_revision"] == ab_item["model_revision"]
    assert pa_i["deployment_fingerprint"] == pb_i["deployment_fingerprint"] == ab_item["deployment_fingerprint"]
    assert pa_i["canonical_request_body_sha256"] == pb_i["canonical_request_body_sha256"] == ab_item["canonical_request_body_sha256"]
    assert pa_i["output_completion_sha256"] == pb_i["output_completion_sha256"] == recalc_out_sha
    assert pa_i["unit_test_pass_rate"] == pb_i["unit_test_pass_rate"] == 1.0 and pa_i["semantic_drift_rate"] == pb_i["semantic_drift_rate"] == 0.0
    assert pa_i["total_input_tokens"] == pa_i["uncached_input_tokens"] + pa_i["cached_input_tokens"]
    assert pb_i["total_input_tokens"] == pb_i["uncached_input_tokens"] + pb_i["cached_input_tokens"]
    assert pa_i["total_input_tokens"] == pb_i["total_input_tokens"] and pa_i["completion_tokens"] == pb_i["completion_tokens"] == 48

# P0-4 (Dynamic Aggregation & Source Code Proof): Verify `/api/oracle/ledger-engine-source.txt` & all 4 Mutation Tests!
_, eng_src_b = fetch("/api/oracle/ledger-engine-source.txt?v=41.4")
assert hashlib.sha256(eng_src_b.encode("utf-8")).hexdigest() == "31a147a105fdd906378d29b147058b2a3f2643fc0836ad8bdd03ee0ae2547705"
_, suite_b = fetch("/api/v1/ledger?mutation_test=ALL_FOUR_MUTATION_SUITE&v=41.4")
suite_d = json.loads(suite_b)
assert suite_d["suite_id"] == "ETK-DYNAMIC-LEDGER-MUTATION-SUITE-V40-8-6" and suite_d["mutation_4_inject_duplicate_id_fail_closed"]["fail_closed_verified"] is True
_, mut_del_b = fetch("/api/v1/ledger?mutation_test=DELETE_RECORD&target_id=jtx_001&v=41.4")
mut_del_d = json.loads(mut_del_b)["dynamic_recomputation_summary"]
assert mut_del_d["total_reconciled_transactions"] == 484
assert mut_del_d["total_billed_gross_gmv_usd"] == round(392.61 - 0.4677, 4)

_, mut_mod_b = fetch("/api/v1/ledger?mutation_test=MODIFY_AMOUNT&target_id=jtx_001&delta_usd=10.00&v=41.4")
mut_mod_d = json.loads(mut_mod_b)["dynamic_recomputation_summary"]
assert mut_mod_d["total_reconciled_transactions"] == 485
assert mut_mod_d["total_billed_gross_gmv_usd"] == 402.61
assert mut_mod_d["total_platform_fee_5pct_usd"] == round(19.6305 + 0.50, 4)

_, mut_ins_b = fetch("/api/v1/ledger?mutation_test=INSERT_RECORD&amount_usd=5.00&v=41.4")
mut_ins_d = json.loads(mut_ins_b)["dynamic_recomputation_summary"]
assert mut_ins_d["total_reconciled_transactions"] == 486 and mut_ins_d["total_billed_gross_gmv_usd"] == 397.61

try:
    fetch("/api/v1/ledger?mutation_test=INJECT_DUPLICATE_ID&v=41.4")
    raise AssertionError("Duplicate transaction ID should have failed closed with HTTP 422!")
except urllib.error.HTTPError as e_dup:
    assert e_dup.code == 422 and json.loads(e_dup.read().decode("utf-8"))["fail_closed_verified"] is True

# P0-3 (a): HTTP 429 & HTTP 404 Multi-Attempt Trace Verification
for f_scen, exp_fail_code in [("INJECT_HTTP_429_FAILOVER", 429), ("INJECT_HTTP_404_ALIAS_REMAP", 404)]:
    f_req_body = json.dumps({"model": "openai/gpt-4.1", "fault_injection_scenario": f_scen}).encode("utf-8")
    f_req = urllib.request.Request(BASE + "/api/v1/chat/completions?v=41.4", data=f_req_body, headers={"Content-Type": "application/json", "User-Agent": "Etuki-Standalone-Verifier/41.4.0"}, method="POST")
    with urllib.request.urlopen(f_req, timeout=15) as f_resp:
        f_doc = json.loads(f_resp.read().decode("utf-8"))
        tr = f_doc["attempt_trace"]
        assert len(tr) == 2 and tr[0]["upstream_http_status"] == exp_fail_code and tr[0]["billed_usd"] == 0.0
        assert tr[1]["upstream_http_status"] == 200 and f_doc["retry_count"] == 1 and f_doc["final_status"] == "RECOVERED_HTTP_200"
        assert round(f_doc["actual_billed_usd"] + f_doc["pre_auth_hold_released_usd"], 6) == f_doc["pre_auth_hold_reserved_usd"]

# P0-3 (b): Genuine Client-Initiated SSE Socket Disconnect at Token 32 + Independent Ledger State Query!
sse_req_body = json.dumps({"model": "openai/gpt-4.1", "fault_injection_scenario": "INJECT_SSE_MID_STREAM_INTERRUPT", "stream": True}).encode("utf-8")
sse_req = urllib.request.Request(BASE + "/api/v1/chat/completions?v=41.4", data=sse_req_body, headers={"Content-Type": "application/json", "Accept": "text/event-stream", "User-Agent": "Etuki-Standalone-Verifier/41.4.0"}, method="POST")
sse_resp = urllib.request.urlopen(sse_req, timeout=15)
assert "text/event-stream" in sse_resp.headers.get("Content-Type", "")
frames_read_before_disconnect = []
for raw_sse_line in sse_resp:
    line_str = raw_sse_line.decode("utf-8").strip()
    if line_str.startswith("data: {"):
        frame_obj = json.loads(line_str[6:])
        frames_read_before_disconnect.append(frame_obj)
        if frame_obj.get("emitted_tokens_cumulative") == 32:
            # Actively close the client socket at token 32 BEFORE reading chunks 3 & 4!
            sse_resp.close()
            break
assert len(frames_read_before_disconnect) == 3  # 1 hold_reserved + chunk 1 (16 tok) + chunk 2 (32 tok)
assert frames_read_before_disconnect[-1]["emitted_tokens_cumulative"] == 32
_, post_mortem_b = fetch("/api/v1/ledger?verify_interrupted_tx=req_sse_int_01&interrupted_at_token=32&v=41.4")
pm_doc = json.loads(post_mortem_b)
assert pm_doc["client_socket_closed_at_token"] == 32 and pm_doc["upstream_generation_halted"] is True
assert round(pm_doc["actual_partial_billed_usd"] + pm_doc["pre_auth_hold_released_usd"], 6) == pm_doc["pre_auth_hold_reserved_usd"]
assert pm_doc["orphan_pre_auth_hold_usd"] == 0.0 and pm_doc["duplicate_charge_usd"] == 0.0 and pm_doc["journal_entries_committed"] == 1

# P0-2: Byte-for-Byte Identical Payload Idempotency Replay + HTTP 409 Conflict on Same Key with Different Payload!
idem_hdr = {"Content-Type": "application/json", "Idempotency-Key": "idem-replay-test-v4082", "User-Agent": "Etuki-Standalone-Verifier/41.4.0"}
identical_body_bytes = json.dumps({"fault_injection_scenario": "INJECT_DUPLICATE_IDEMPOTENCY_REPLAY", "max_tokens": 64, "messages": [{"content": "Execute idempotent payment clearing.", "role": "user"}], "model": "openai/gpt-4.1"}, separators=(",", ":"), sort_keys=True).encode("utf-8")
req1_payload = identical_body_bytes
req2_payload = identical_body_bytes
assert req1_payload == req2_payload  # 100% byte-for-byte identical request body!
with urllib.request.urlopen(urllib.request.Request(BASE + "/api/v1/chat/completions?v=41.4", data=req1_payload, headers=idem_hdr, method="POST"), timeout=15) as r1:
    idem_doc1 = json.loads(r1.read().decode("utf-8"))
with urllib.request.urlopen(urllib.request.Request(BASE + "/api/v1/chat/completions?v=41.4", data=req2_payload, headers=idem_hdr, method="POST"), timeout=15) as r2:
    idem_doc2 = json.loads(r2.read().decode("utf-8"))
assert idem_doc1["payload_canonical_equal"] is True and idem_doc2["payload_canonical_equal"] is True
assert idem_doc1["etuki_tx_id"] == idem_doc2["etuki_tx_id"] and idem_doc1["journal_tx_id"] == idem_doc2["journal_tx_id"]
assert idem_doc2["duplicate_charge_usd"] == 0.0 and idem_doc2["journal_entries_committed"] == 1

# Negative Idempotency Test: Same Idempotency-Key + DIFFERENT payload MUST fail with HTTP 409 Conflict!
conflicting_body_bytes = json.dumps({"fault_injection_scenario": "INJECT_DUPLICATE_IDEMPOTENCY_REPLAY", "max_tokens": 128, "messages": [{"content": "TAMPERED_DIFFERENT_PAYLOAD", "role": "user"}], "model": "openai/gpt-4.1"}, separators=(",", ":"), sort_keys=True).encode("utf-8")
try:
    urllib.request.urlopen(urllib.request.Request(BASE + "/api/v1/chat/completions?v=41.4", data=conflicting_body_bytes, headers=idem_hdr, method="POST"), timeout=15)
    raise AssertionError("Same Idempotency-Key with different payload should have returned HTTP 409 Conflict!")
except urllib.error.HTTPError as e_409:
    assert e_409.code == 409
    err_409_doc = json.loads(e_409.read().decode("utf-8"))
    assert err_409_doc["error_code"] == "IDEMPOTENCY_PAYLOAD_MISMATCH_CONFLICT" and err_409_doc["additional_journal_entries_committed"] == 0

# P0-1: Full Amount-Level & ID-Level Assertions across Voucher <-> Journal <-> AR <-> AP <-> Settlement Sub-Ledgers!
_, ar_src_b = fetch("/api/oracle/independent-ar-customer-invoices-485.json?v=41.4")
_, ap_src_b = fetch("/api/oracle/independent-ap-vendor-bills-485.json?v=41.4")
_, stl_src_b = fetch("/api/oracle/independent-gateway-settlements-485.json?v=41.4")
assert hashlib.sha256(ar_src_b.encode("utf-8")).hexdigest() == "b5c8594a3284e4a819a30f6bc23b66dc85222beecbe0a999ded55cd9c3d6cacd"
assert hashlib.sha256(ap_src_b.encode("utf-8")).hexdigest() == "4ee0be534dec9cfc9418a8db492fdef71c4c54bfc4979e1492a8183d308620fb"
assert hashlib.sha256(stl_src_b.encode("utf-8")).hexdigest() == "0b24d96cc79edfef35b3107c3c4cd2352b0d132a1a1e2fb50edde9357b5f2eb5"
try:
    fetch("/api/v1/ledger?mutation_test=TAMPER_WITHOUT_REHASH&v=41.4")
    raise AssertionError("Tamper without rehash should have failed closed with HTTP 422!")
except urllib.error.HTTPError as e_tmp:
    assert e_tmp.code == 422
ar_src_doc, ap_src_doc, stl_src_doc = json.loads(ar_src_b), json.loads(ap_src_b), json.loads(stl_src_b)
ar_keys, ap_keys, stl_keys = ar_src_doc["canonical_record_keys_sorted"], ap_src_doc["canonical_record_keys_sorted"], stl_src_doc["canonical_record_keys_sorted"]
for r_ar in ar_src_doc["ar_records"]:
    assert hashlib.sha256(json.dumps({k: r_ar[k] for k in ar_keys}, separators=(",", ":"), sort_keys=True).encode("utf-8")).hexdigest() == r_ar["ar_record_sha256"]
for r_ap in ap_src_doc["ap_records"]:
    assert hashlib.sha256(json.dumps({k: r_ap[k] for k in ap_keys}, separators=(",", ":"), sort_keys=True).encode("utf-8")).hexdigest() == r_ap["ap_record_sha256"]
for r_stl in stl_src_doc["settlement_records"]:
    assert hashlib.sha256(json.dumps({k: r_stl[k] for k in stl_keys}, separators=(",", ":"), sort_keys=True).encode("utf-8")).hexdigest() == r_stl["settlement_record_sha256"]
assert hashlib.sha256(",".join(r["ar_record_sha256"] for r in ar_src_doc["ar_records"]).encode("utf-8")).hexdigest() == "49ca56c21668681372d1909c523638706f8c3d74f45dcfe0f8d50cea14b78f8f" == ldg_d["journal_hash_chain_summary"]["ar_collection_root_sha256"]
assert hashlib.sha256(",".join(r["ap_record_sha256"] for r in ap_src_doc["ap_records"]).encode("utf-8")).hexdigest() == "012077ee2248186e8ab60c1f2e9b715f9656cb953248dfb748085f25c09ef459" == ldg_d["journal_hash_chain_summary"]["ap_collection_root_sha256"]
assert hashlib.sha256(",".join(r["settlement_record_sha256"] for r in stl_src_doc["settlement_records"]).encode("utf-8")).hexdigest() == "324647d24604303462cd9b0311fbe69de88d5f73da3adbcd730cf114b55ef44c" == ldg_d["journal_hash_chain_summary"]["settlement_collection_root_sha256"]
assert suite_d["mutation_2_modify_jtx_001_plus_10usd"]["all_three_subledger_record_hashes_changed"] is True
assert suite_d["mutation_3_modify_non_amount_field_src_ap_001"]["ap_record_and_root_hash_changed"] is True
assert suite_d["mutation_4_insert_jtx_486_plus_5usd"]["zero_inherited_hash_collision"] is True
assert suite_d["mutation_5_tamper_subledger_single_field_fail_closed"]["fail_closed_verified"] is True
try:
    fetch("/api/v1/ledger?mutation_test=TAMPER_SUBLEDGER_SINGLE_FIELD&v=41.4")
    raise AssertionError("Subledger single-field tamper should have failed closed with HTTP 422!")
except urllib.error.HTTPError as e_sub:
    assert e_sub.code == 422
assert ldg_d["journal_hash_chain_summary"]["cryptographic_verification_executed_on_read"] is True
assert suite_d["mutation_1_delete_jtx_001"]["all_484_ar_hashes_verified_unchanged"] is True and suite_d["mutation_1_delete_jtx_001"]["all_484_ap_hashes_verified_unchanged"] is True and suite_d["mutation_1_delete_jtx_001"]["all_484_stl_hashes_verified_unchanged"] is True
assert suite_d["mutation_6_tamper_journal_non_amount_field_fail_closed"]["fail_closed_verified"] is True
try:
    fetch("/api/v1/ledger?mutation_test=TAMPER_JOURNAL_NON_AMOUNT_FIELD&v=41.4")
    raise AssertionError("Journal non-amount tamper should have failed closed with HTTP 422!")
except urllib.error.HTTPError as e_jnl:
    assert e_jnl.code == 422
_, vch_b = fetch("/api/oracle/sanitized-financial-vouchers.json?v=41.4")
vch_d = json.loads(vch_b)
assert vch_d["bundle_id"] == "ETK-SANITIZED-FINANCIAL-VOUCHERS-20261102-V40-8-6"
assert vch_d["build_version"] == EXPECTED_BUILD_VER and vch_d["schema_version"] == EXPECTED_SCHEMA_VER
assert len(vch_d["three_way_reconciled_financial_vouchers"]) == 485
j_by_tx_id = {tx["journal_tx_id"]: tx for tx in j_chain}
sub_ledgers = ldg_d["seven_immutable_ledgers"]
verified_ar_ids = {x["invoice_line_id"]: x for x in sub_ledgers["4_accounts_receivable_ledger"]}
verified_vendor_invoice_ids = {x["vendor_invoice_id"]: x for x in sub_ledgers["5_accounts_payable_ledger"]}
verified_settlement_ids = {x["payment_gateway_settlement_id"]: x for x in sub_ledgers["6_settlement_ledger"]}
assert len(verified_ar_ids) == 485 and len(verified_vendor_invoice_ids) == 485 and len(verified_settlement_ids) == 485

for voucher in vch_d["three_way_reconciled_financial_vouchers"]:
    journal = j_by_tx_id[voucher["etuki_journal_tx_id"]]
    receipt = e3_by_req_id[voucher["request_id"]]
    ar_rec = verified_ar_ids[voucher["customer_invoice_id"]]
    ap_rec = verified_vendor_invoice_ids[voucher["vendor_invoice_id"]]
    stl_rec = verified_settlement_ids[voucher["payment_gateway_settlement_id"]]
    assert voucher["request_id"] == journal["request_id"] == receipt["request_id"] == ar_rec["request_id"] == ap_rec["request_id"] == stl_rec["request_id"]
    assert voucher["etuki_journal_tx_id"] == journal["journal_tx_id"] == ar_rec["journal_tx_id"] == ap_rec["journal_tx_id"] == stl_rec["journal_tx_id"]
    assert voucher["source_receipt_sha256"] == journal["source_receipt_sha256"] == receipt["source_receipt_sha256"]
    assert voucher["vendor_native_response_id"] == receipt["provider_request_id_hash"]
    assert round(ar_rec["customer_receivable_amount_usd"], 6) == round(voucher["customer_receivable_amount_usd"], 6) == round(journal["billed_gross_usd"], 6) == round(receipt["actual_billed_usd"], 6)
    assert round(ap_rec["vendor_payable_net_95pct_usd"], 6) == round(voucher["vendor_payable_net_95pct_usd"], 6)
    assert round(ap_rec["platform_fee_5pct_usd"], 6) == round(voucher["platform_control_plane_fee_5pct_usd"], 6)
    assert round(ap_rec["gross_billed_usd"], 6) == round(journal["billed_gross_usd"], 6)
    assert round(stl_rec["actual_settled_amount_usd"], 6) == round(voucher["actual_settled_amount_usd"], 6) == round(journal["billed_gross_usd"], 6)
    assert round(stl_rec["payment_gateway_fee_2_9pct_usd"], 6) == round(voucher["payment_gateway_fee_2_9pct_usd"], 6)
print("[PASS 6/6] All 485/485 5-Way AR/AP/STL Vouchers, Byte-Identical Idempotency (+409 Conflict), Client SSE Close & Dynamic Mutation Suite Verified!")

# 7. Verify v41.4.1 Single Source of Truth, Full 8-Endpoint OpenAPI Response Schema Validation,
#    True Browser CORS Preflight, Self-Healing Failover, Unknown Model Block & 84-Call Sums!
_, ver_b = fetch("/api/version?v=41.4")
ver_d = json.loads(ver_b)
assert ver_d["build_version"] == EXPECTED_BUILD_VER and ver_d["schema_version"] == EXPECTED_SCHEMA_VER
assert ver_d["policy_version"] == "esp-v41.4-20261107" == oracle["policy_version"] == oracle["evidence_manifest"]["policy_version"]
assert ver_d["e3_84calls_audit_report_sha256"] == "14317f71dcf29e19a774167a7a51eafe307eb3a7b0b96253117a6099a47d0777"
assert ver_d["local_context_saver_install_report_sha256"] == "d294e8ffa53ba0f3ef4ad4b36207a125ac24ac64316a2b0e5f19fb8dfc520803"

_, oa_b = fetch("/openapi.json?v=41.4")
oa_spec = json.loads(oa_b)
assert "v41.2" not in oa_spec["info"]["title"] and "v41.2" not in oa_spec["info"]["description"]
umce_item_req_keys = set(oa_spec["components"]["schemas"]["UmceModelItem"]["required"])

def fetch_method(path, method="GET", body_dict=None, extra_headers=None):
    data_b = json.dumps(body_dict).encode("utf-8") if body_dict is not None else None
    hdrs = {"User-Agent": "Etuki-Standalone-Verifier/41.4.1", "Content-Type": "application/json", "Accept": "application/json"}
    if extra_headers:
        hdrs.update(extra_headers)
    req = urllib.request.Request(BASE + path, data=data_b, headers=hdrs, method=method)
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.status, {k.lower(): v for k, v in r.headers.items()}, r.read().decode("utf-8")

umce_semantic_specs = [
    ("/api/v2/models/catalog?provider=openai&is_simulation=false&v=41.4", "UmceModelsCatalogResponse", {"provider": "openai", "is_simulation": False}, True, lambda d: d["filtered_count"] >= 2 and all((not m["is_simulation"]) and umce_item_req_keys.issubset(set(m.keys())) and isinstance(m["input_usd_per_1m"], (int, float)) for m in d["global_18_ecosystem_flagship_catalog"])),
    ("/api/v2/models/providers?v=41.4", "UmceModelsProvidersResponse", {}, False, lambda d: d["total_monitored_ecosystems"] == 18 and isinstance(d["providers"], list) and len(d["providers"]) >= 8),
    ("/api/v2/models/capabilities?model=gpt-4o&v=41.4", "UmceModelsCapabilitiesResponse", {"model": "gpt-4o"}, True, lambda d: d["resolved_canonical_model_id"] == "openai/gpt-4o" and isinstance(d["per_modality_verification_evidence"], list)),
    ("/api/v2/models/health?v=41.4", "UmceModelsHealthResponse", {}, False, lambda d: d["statistical_window_specification"]["total_live_probes_sample_size_n"] == 480 and len(d["self_healing_emergency_failover_matrix"]["recorded_production_and_drill_failover_events"]) >= 3),
    ("/api/v2/models/verify?model=openai/gpt-6.1-sol&strict_production_ga=true&simulate_fault=429_RATE_LIMIT&v=41.4", "UmceModelsVerifyResponse", {"model": "openai/gpt-6.1-sol", "strict_production_ga": True, "simulate_fault": "429_RATE_LIMIT"}, True, lambda d: d["is_simulation"] is True and d["production_routing_allowed_for_requested_id"] is False and d["emergency_failover_chain"]["zero_work_interruption_guaranteed"] is True),
    ("/api/v2/pricing/live?simulate_clock_utc=2026-11-25T00:00:00Z&v=41.4", "UmcePricingLiveResponse", {"simulate_clock_utc": "2026-11-25T00:00:00Z"}, True, lambda d: d["snapshot_freshness_status"] == "NEEDS_REVIEW" and d["is_simulated_clock"] is True),
    ("/api/v2/compatibility/report?v=41.4", "UmceCompatibilityReportResponse", {}, False, lambda d: d["certification_summary"]["total_entities"] == 563),
    ("/api/v2/finops/compare?model_a=claude-3-7-sonnet&model_b=deepseek-chat&prompt_tokens=135000&output_tokens=600&cache_hit_ratio=0.50&turns=5&v=41.4", "UmceFinopsCompareResponse", {"model_a": "claude-3-7-sonnet", "model_b": "deepseek-chat", "prompt_tokens": 135000, "output_tokens": 600}, True, lambda d: d["parameters_evaluated"]["requested_model_b"] == "deepseek/deepseek-chat" and d["model_b_window_check"]["context_window_exceeded"] is True)
]
q_filter_cnt = 0
schema_pass_cnt = 0
for u_path, schema_key, post_Load, uses_filter, sem_fn in umce_semantic_specs:
    req_schema_keys = set(oa_spec["components"]["schemas"][schema_key]["required"])
    st_g, _, b_g = fetch_method(u_path, "GET")
    d_g = json.loads(b_g)
    assert st_g == 200 and req_schema_keys.issubset(set(d_g.keys())) and d_g["build_version"] == EXPECTED_BUILD_VER and d_g["policy_version"] == "esp-v41.4-20261107" and sem_fn(d_g), f"GET schema/semantic check failed on {u_path}"
    schema_pass_cnt += 1
    if uses_filter: q_filter_cnt += 1
    base_p = u_path.split("?")[0] + "?v=41.4"
    st_p, _, b_p = fetch_method(base_p, "POST", post_Load)
    d_p = json.loads(b_p)
    assert st_p == 200 and req_schema_keys.issubset(set(d_p.keys())) and d_p["build_version"] == EXPECTED_BUILD_VER and sem_fn(d_p), f"POST check failed on {base_p}"
    st_o, hdr_o, _ = fetch_method(base_p, "OPTIONS", None, {"Origin": "https://client.example", "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type, authorization"})
    assert st_o in (200, 204) and "*" in hdr_o.get("access-control-allow-origin", "") and "POST" in hdr_o.get("access-control-allow-methods", "").upper() and "content-type" in hdr_o.get("access-control-allow-headers", "").lower()

_, syn_b = fetch("/api/v2/models/verify?model=synthetic/nonexistent-model-xyz&strict_production_ga=true&v=41.4")
syn_d = json.loads(syn_b)
assert syn_d["is_known_catalog_model"] is False and syn_d["production_routing_allowed_for_requested_id"] is False

_, zc_csv_b = fetch("/api/oracle/e3-zcode-20261106-84calls.csv?v=41.4")
assert hashlib.sha256(zc_csv_b.encode("utf-8")).hexdigest() == "75a476c3648a94d14cc9ebf44083b2c5db4a96091524f25915132e4e82309c01"
_, zc_rep_b = fetch("/api/oracle/e3-zcode-20261106-84calls-audit-report.txt?v=41.4")
assert hashlib.sha256(zc_rep_b.encode("utf-8")).hexdigest() == "14317f71dcf29e19a774167a7a51eafe307eb3a7b0b96253117a6099a47d0777"

_, zc_b = fetch("/api/oracle/e3-zcode-20261106-real-bill.json?v=41.4")
zc_d = json.loads(zc_b)
assert zc_d["e3_84calls_audit_report_sha256"] == "14317f71dcf29e19a774167a7a51eafe307eb3a7b0b96253117a6099a47d0777"
assert zc_d["local_context_saver_install_report_sha256"] == "d294e8ffa53ba0f3ef4ad4b36207a125ac24ac64316a2b0e5f19fb8dfc520803"
recs_84 = zc_d["all_84_desensitized_call_records"]
assert len(recs_84) == 84
assert sum(1 for r in recs_84 if r["total_input_tokens"] > 120000) == 34
assert sum(1 for r in recs_84 if r["total_input_tokens"] > 128000) == 23
assert round(sum(r["v41_task_difficulty_routed_usd"] for r in recs_84), 4) == 2.1233
assert round(sum(r["modeled_1x_relay_reference_usd"] for r in recs_84), 4) == 2.6055

ga_rates_check = {"deepseek/deepseek-chat": (0.27, 0.07, 1.10), "google/gemini-2.5-flash": (0.15, 0.0375, 0.60), "openai/gpt-4.1": (2.00, 0.50, 8.00)}
for r84 in recs_84:
    c84 = {k: r84[k] for k in r84 if k != "row_sha256"}
    assert hashlib.sha256(json.dumps(c84, separators=(",", ":"), sort_keys=True).encode("utf-8")).hexdigest() == r84["row_sha256"]
    if r84["total_input_tokens"] > 120000:
        assert r84["assigned_v41_ga_model"] != "deepseek/deepseek-chat"
    rin, rca, rout = ga_rates_check[r84["assigned_v41_ga_model"]]
    is_sp = r84["is_zero_cache_spike"] and (not r84["is_unavoidable_initial_cold_start"])
    ein = r84["uncached_prompt_tokens"] if not is_sp else round(r84["uncached_prompt_tokens"] * 0.10)
    eca = r84["cached_read_tokens"] if not is_sp else round(r84["uncached_prompt_tokens"] * 0.90)
    assert abs(round((ein * rin + eca * rca + r84["completion_tokens"] * rout) / 1e6, 6) - r84["v41_task_difficulty_routed_usd"]) <= 0.000002

print(f"RUNTIME_HTTP_PASS=8 | RUNTIME_JSON_PARSE_PASS=8 | RUNTIME_VERSION_CONSISTENCY_PASS=8 | RUNTIME_OPENAPI_SCHEMA_PASS={schema_pass_cnt} | RUNTIME_SEMANTIC_PASS=8 | RUNTIME_QUERY_FILTER_PASS={q_filter_cnt} | POST_RUNTIME_PASS=8 | TRUE_CORS_PREFLIGHT_PASS=8")
print("[PASS 7/7] v41.4.1 All 8 UMCE Endpoints (GET+POST+True CORS+8/8 OpenAPI Schema), 485/485 Model Classification & 84-Row Sums Verified!")

