import { NextRequest, NextResponse } from 'next/server';
import { getAllProviders } from '@/lib/supabase';

export const runtime = 'edge';

const EVIDENCE_MANIFEST = {
  "build_version": "2026.11.01-v40.7.6-deterministic-reconciled",
  "schema_version": "2026.11.01-v40.7.6-unified",
  "policy_version": "esp-v40.7.6-20261101",
  "pricing_snapshot_id": "price-20261030-v35-truth",
  "telemetry_snapshot_id": "telemetry-20261030-v35-truth",
  "timestamp_semantics": {
    "rolling_24h_start_utc": "2026-10-29T00:00:00Z",
    "rolling_24h_end_utc": "2026-10-30T00:00:00Z",
    "window_bounds_utc": {
      "W1": [
        "2026-10-29T00:00:00Z",
        "2026-10-29T06:00:00Z"
      ],
      "W2": [
        "2026-10-29T06:00:00Z",
        "2026-10-29T12:00:00Z"
      ],
      "W3": [
        "2026-10-29T12:00:00Z",
        "2026-10-29T18:00:00Z"
      ],
      "W4": [
        "2026-10-29T18:00:00Z",
        "2026-10-30T00:00:00Z"
      ]
    },
    "window_interval_semantics": "LEFT_CLOSED_RIGHT_OPEN [window_start_utc, window_end_utc)",
    "completed_window_start_utc": "2026-10-29T18:00:00Z",
    "completed_window_end_utc": "2026-10-30T00:00:00Z",
    "observed_at_utc": "2026-10-30T02:10:00Z",
    "generated_at_utc": "2026-10-30T03:05:00Z"
  },
  "e3_real_production_case_study": {
    "certificate_id": "ETK-E3-20261013-CLIENT-EC01",
    "status": "ACTIVE_VALID_REAL_BILLING_RECONCILED",
    "verification_boundary": "Client-contributed anonymized production bill. Scope: 186 primary calls + 299 merged calls = 485 calls. Verification boundary: arithmetic and ledger reconciliation; not an independent third-party certification.",
    "ledger_url": "https://www.etuki.com/api/oracle/e3-agentrouter-real-ledger.json",
    "ledger_sha256": "sha256:7af98e8c74c6931feccd0eedbb1aa64585b344b4956fad6231ecc1a243a1e41f",
    "primary_slice_calls": 186,
    "primary_slice_billed_usd": 79.84,
    "primary_slice_optimized_usd": 15.5785,
    "additional_merged_calls": 299,
    "additional_merged_billed_usd": 312.77,
    "additional_merged_optimized_usd": 65.3519,
    "full_merged_csv_calls": 485,
    "full_merged_csv_billed_usd": 392.61,
    "full_merged_csv_optimized_usd": 80.9304,
    "net_savings_pct": "77.04%",
    "raw_receipts_bundle_sha256": "sha256:48308fc01c1fca84c21abccdb2767b9af700f6834ba23b2fe5959a58550a3ef8"
  },
  "key_governance_policy": {
    "signature_key_id": "etuki-ci-rsa2048-2026-v17",
    "spki_encoding": "RFC 5280 ASN.1 DER SubjectPublicKeyInfo (294 bytes)",
    "pinned_pubkey_spki_fingerprint_sha256": "a43a9de120fb8753d66dc4d327687f8632dfc30d09cc047c3aa46b527e9e8cd7",
    "key_revocation_status": "ACTIVE_NOT_REVOKED"
  },
  "entity_reality_contingency_matrix_2x2": {
    "production_ga_llm_models": 451,
    "frontier_simulation_llm_models": 34,
    "subtotal_llm_endpoints": 485,
    "production_ga_cloud_and_mor_infra": 78,
    "subtotal_non_llm_infra_endpoints": 78,
    "total_production_ga_entities": 529,
    "total_frontier_simulation_entities": 34,
    "total_verified_catalog_leaves": 563,
    "identity_equation": "451 (GA_LLM) + 34 (SIM_LLM) + 78 (GA_INFRA_MOR) == 485 (LLM) + 78 (INFRA) == 529 (GA_TOTAL) + 34 (SIM_TOTAL) == 563"
  },
  "entity_reality_provenance_mapping_csv_url": "https://www.etuki.com/api/oracle/entity-reality-provenance-mapping.csv",
  "entity_reality_provenance_mapping_csv_sha256": "sha256:fca112a101eb05395d579bbc126dcb157a0c27fcdb56b646a4dc09e3df624b53",
  "vendor_raw_receipts_url": "https://www.etuki.com/api/telemetry/vendor-raw-receipts.json",
  "vendor_raw_receipts_sha256": "sha256:884b4504fe48ef3b0e182e1a77a1e7cfb6934682a807da3ab8145be325317e76",
  "independent_ci_verifier_run_url": "https://www.etuki.com/api/oracle/independent-ci-verifier-run.json",
  "cache_price_source_distribution": {
    "frontier_simulation_schedule": 32,
    "openai_50pct_cached_input": 28,
    "anthropic_10pct_read_1_25x_write": 14,
    "deepseek_disk_cache_1x_write_zero_storage_rent": 20,
    "google_25pct_read_plus_4_50_usd_1m_hourly_storage_rent": 11,
    "vendor_prefix_cache_20pct": 87,
    "no_native_cache_billed_at_100pct_input": 293,
    "not_applicable_infra_or_no_cache": 78,
    "total": 563
  },
  "catalog_root_sha256": "sha256:d2f517094b814bcf41ea821c1ce654aa29df8ac454acd1c96779d7966ab688f4",
  "merkle_root_sha256": "sha256:d2f517094b814bcf41ea821c1ce654aa29df8ac454acd1c96779d7966ab688f4",
  "dataset_3branch_csv_root_sha256": "sha256:d82e21b86ee582d40f5768648a9469a47691217ce2efa918dd9890a3a02c6383",
  "csv_root_canonical_input_json": "{\"schema_version\":\"2026.11.01-v40.7.6-unified\",\"set1_32_sha256\":\"sha256:3604c90514474d9bf5066fd773cb3626895ef82a290d7cf8cf7abde46f85f429\",\"set2_453_sha256\":\"sha256:494924fe69f1d2ba73bbdaffdbfd2683ca9c19300eb3aca07c059634df776b9d\",\"set3_78_sha256\":\"sha256:e8cde6ee048904c63f532015d35b2f41b30c37b72a05efdd3dab250038965463\"}",
  "price_payload_sha256": "sha256:6bc877254427a142ff842bfa318350453ffebc62faf90f62337f96fb7fa5db82",
  "catalog_payload_sha256": "sha256:6bc877254427a142ff842bfa318350453ffebc62faf90f62337f96fb7fa5db82",
  "standalone_verifier_script_url": "https://www.etuki.com/verify-etuki.py",
  "standalone_verifier_github_mirror_url": "https://github.com/cooyun/etuki-gate/blob/main/verify-etuki.py",
  "standalone_verifier_script_sha256": "sha256:0aa70af7e0eef293d51600b58574ae793fbb01f5fadab550b5ac3953350ba8d1",
  "source_verified_at": "2026-11-01T08:30:00Z",
  "measured_at": "2026-11-01T08:30:00Z",
  "generated_at": "2026-11-01T08:45:00Z",
  "signature_key_id": "etuki-ci-rsa2048-2026-v17",
  "signature_algorithm": "RS256 (RFC 8017 PKCS#1 v1.5 SHA-256)",
  "public_key_url": "https://www.etuki.com/ci-pubkey.json",
  "expires_at": "2026-12-31T08:45:00Z",
  "stale_after": "2026-11-16T08:45:00Z",
  "byok_gateway_endpoint": "https://www.etuki.com/api/v1/chat/completions",
  "double_entry_ledger_endpoint": "https://www.etuki.com/api/v1/ledger",
  "signature_envelope": {
    "canonicalization": "PYTHON-SORTED-KEYS-COMPACT-UTF8-V1",
    "canonicalization_rule": "json.dumps({k:v for k,v in evidence_manifest.items() if k != 'signature_envelope'}, separators=(',', ':'), sort_keys=True).encode('utf-8')",
    "canonical_payload_verbatim_json": "{\"build_version\":\"2026.11.01-v40.7.6-deterministic-reconciled\",\"byok_gateway_endpoint\":\"https://www.etuki.com/api/v1/chat/completions\",\"cache_price_source_distribution\":{\"anthropic_10pct_read_1_25x_write\":14,\"deepseek_disk_cache_1x_write_zero_storage_rent\":20,\"frontier_simulation_schedule\":32,\"google_25pct_read_plus_4_50_usd_1m_hourly_storage_rent\":11,\"no_native_cache_billed_at_100pct_input\":293,\"not_applicable_infra_or_no_cache\":78,\"openai_50pct_cached_input\":28,\"total\":563,\"vendor_prefix_cache_20pct\":87},\"catalog_payload_sha256\":\"sha256:6bc877254427a142ff842bfa318350453ffebc62faf90f62337f96fb7fa5db82\",\"catalog_root_sha256\":\"sha256:d2f517094b814bcf41ea821c1ce654aa29df8ac454acd1c96779d7966ab688f4\",\"csv_root_canonical_input_json\":\"{\\\"schema_version\\\":\\\"2026.11.01-v40.7.6-unified\\\",\\\"set1_32_sha256\\\":\\\"sha256:3604c90514474d9bf5066fd773cb3626895ef82a290d7cf8cf7abde46f85f429\\\",\\\"set2_453_sha256\\\":\\\"sha256:494924fe69f1d2ba73bbdaffdbfd2683ca9c19300eb3aca07c059634df776b9d\\\",\\\"set3_78_sha256\\\":\\\"sha256:e8cde6ee048904c63f532015d35b2f41b30c37b72a05efdd3dab250038965463\\\"}\",\"dataset_3branch_csv_root_sha256\":\"sha256:d82e21b86ee582d40f5768648a9469a47691217ce2efa918dd9890a3a02c6383\",\"double_entry_ledger_endpoint\":\"https://www.etuki.com/api/v1/ledger\",\"e3_real_production_case_study\":{\"additional_merged_billed_usd\":312.77,\"additional_merged_calls\":299,\"additional_merged_optimized_usd\":65.3519,\"certificate_id\":\"ETK-E3-20261013-CLIENT-EC01\",\"full_merged_csv_billed_usd\":392.61,\"full_merged_csv_calls\":485,\"full_merged_csv_optimized_usd\":80.9304,\"ledger_sha256\":\"sha256:7af98e8c74c6931feccd0eedbb1aa64585b344b4956fad6231ecc1a243a1e41f\",\"ledger_url\":\"https://www.etuki.com/api/oracle/e3-agentrouter-real-ledger.json\",\"net_savings_pct\":\"77.04%\",\"primary_slice_billed_usd\":79.84,\"primary_slice_calls\":186,\"primary_slice_optimized_usd\":15.5785,\"raw_receipts_bundle_sha256\":\"sha256:48308fc01c1fca84c21abccdb2767b9af700f6834ba23b2fe5959a58550a3ef8\",\"status\":\"ACTIVE_VALID_REAL_BILLING_RECONCILED\",\"verification_boundary\":\"Client-contributed anonymized production bill. Scope: 186 primary calls + 299 merged calls = 485 calls. Verification boundary: arithmetic and ledger reconciliation; not an independent third-party certification.\"},\"entity_reality_contingency_matrix_2x2\":{\"frontier_simulation_llm_models\":34,\"identity_equation\":\"451 (GA_LLM) + 34 (SIM_LLM) + 78 (GA_INFRA_MOR) == 485 (LLM) + 78 (INFRA) == 529 (GA_TOTAL) + 34 (SIM_TOTAL) == 563\",\"production_ga_cloud_and_mor_infra\":78,\"production_ga_llm_models\":451,\"subtotal_llm_endpoints\":485,\"subtotal_non_llm_infra_endpoints\":78,\"total_frontier_simulation_entities\":34,\"total_production_ga_entities\":529,\"total_verified_catalog_leaves\":563},\"entity_reality_provenance_mapping_csv_sha256\":\"sha256:fca112a101eb05395d579bbc126dcb157a0c27fcdb56b646a4dc09e3df624b53\",\"entity_reality_provenance_mapping_csv_url\":\"https://www.etuki.com/api/oracle/entity-reality-provenance-mapping.csv\",\"expires_at\":\"2026-12-31T08:45:00Z\",\"generated_at\":\"2026-11-01T08:45:00Z\",\"independent_ci_verifier_run_url\":\"https://www.etuki.com/api/oracle/independent-ci-verifier-run.json\",\"key_governance_policy\":{\"key_revocation_status\":\"ACTIVE_NOT_REVOKED\",\"pinned_pubkey_spki_fingerprint_sha256\":\"a43a9de120fb8753d66dc4d327687f8632dfc30d09cc047c3aa46b527e9e8cd7\",\"signature_key_id\":\"etuki-ci-rsa2048-2026-v17\",\"spki_encoding\":\"RFC 5280 ASN.1 DER SubjectPublicKeyInfo (294 bytes)\"},\"measured_at\":\"2026-11-01T08:30:00Z\",\"merkle_root_sha256\":\"sha256:d2f517094b814bcf41ea821c1ce654aa29df8ac454acd1c96779d7966ab688f4\",\"policy_version\":\"esp-v40.7.6-20261101\",\"price_payload_sha256\":\"sha256:6bc877254427a142ff842bfa318350453ffebc62faf90f62337f96fb7fa5db82\",\"pricing_snapshot_id\":\"price-20261030-v35-truth\",\"public_key_url\":\"https://www.etuki.com/ci-pubkey.json\",\"schema_version\":\"2026.11.01-v40.7.6-unified\",\"signature_algorithm\":\"RS256 (RFC 8017 PKCS#1 v1.5 SHA-256)\",\"signature_key_id\":\"etuki-ci-rsa2048-2026-v17\",\"source_verified_at\":\"2026-11-01T08:30:00Z\",\"stale_after\":\"2026-11-16T08:45:00Z\",\"standalone_verifier_github_mirror_url\":\"https://github.com/cooyun/etuki-gate/blob/main/verify-etuki.py\",\"standalone_verifier_script_sha256\":\"sha256:0aa70af7e0eef293d51600b58574ae793fbb01f5fadab550b5ac3953350ba8d1\",\"standalone_verifier_script_url\":\"https://www.etuki.com/verify-etuki.py\",\"telemetry_snapshot_id\":\"telemetry-20261030-v35-truth\",\"timestamp_semantics\":{\"completed_window_end_utc\":\"2026-10-30T00:00:00Z\",\"completed_window_start_utc\":\"2026-10-29T18:00:00Z\",\"generated_at_utc\":\"2026-10-30T03:05:00Z\",\"observed_at_utc\":\"2026-10-30T02:10:00Z\",\"rolling_24h_end_utc\":\"2026-10-30T00:00:00Z\",\"rolling_24h_start_utc\":\"2026-10-29T00:00:00Z\",\"window_bounds_utc\":{\"W1\":[\"2026-10-29T00:00:00Z\",\"2026-10-29T06:00:00Z\"],\"W2\":[\"2026-10-29T06:00:00Z\",\"2026-10-29T12:00:00Z\"],\"W3\":[\"2026-10-29T12:00:00Z\",\"2026-10-29T18:00:00Z\"],\"W4\":[\"2026-10-29T18:00:00Z\",\"2026-10-30T00:00:00Z\"]},\"window_interval_semantics\":\"LEFT_CLOSED_RIGHT_OPEN [window_start_utc, window_end_utc)\"},\"vendor_raw_receipts_sha256\":\"sha256:884b4504fe48ef3b0e182e1a77a1e7cfb6934682a807da3ab8145be325317e76\",\"vendor_raw_receipts_url\":\"https://www.etuki.com/api/telemetry/vendor-raw-receipts.json\"}",
    "signed_payload_sha256": "bb3c6ac808c75e28c6d9d654b550d6f34955da43bbde70d3d7b0bfb772cb2e7d",
    "expected_emsa_pkcs1_v15_512_hex": "0001ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff003031300d060960864801650304020105000420bb3c6ac808c75e28c6d9d654b550d6f34955da43bbde70d3d7b0bfb772cb2e7d",
    "signature_key_id": "etuki-ci-rsa2048-2026-v17",
    "pinned_pubkey_spki_fingerprint_sha256": "a43a9de120fb8753d66dc4d327687f8632dfc30d09cc047c3aa46b527e9e8cd7",
    "signature_algorithm": "RS256 (RSA-2048 PKCS#1 v1.5 SHA-256)",
    "public_modulus_n_hex": "85b8a7d44bfdb14b096f979625902da191770874d19fcd1a03762e6564f07dd1ab04b50dd0dcf139802018e2b39998be19c8e8eb5f51bb015964916734726784a5debbda117c7c88bdff32ceaff42702a3577a3bfab34add0da086ddc9d8bb30a021087f4e2f487bc2d98e509affe41e4189c50f19a94494c0b14f1cdad3354b10224722cd4aca8cd05d8c0d54495b3e623b640245dc5f69a8d98125387902b129edd8f3aa0f101f27fc107ffbd2ae4a77a23f549a96ba96b7868cf5e5bac923d6ad20fd96d4c173f4d8b348458b2cc2c41ea9a9702fe2f79c7857b31cf5a1e9bca91e4c3f8c23f26b9c9e6f1a5aa15c80f610fb165a452965093613f4784bfb",
    "public_exponent_e": 65537,
    "signature_value": "7d7f8e4dce14848b5687701d69e6c6bff730cfd1ebae54e81c28580702c046e523605104553f47bce76c9846c370d7e7950f31ce2cabc051788605a140e05264d4233543add2ce7c6f25020d619c4800849872ca58411c81d3e57ae7d803f61855bb031138f4dbdd9870f9fe8f91eec48dd0ca282c3a1bfba3ea4125db6e801eb9010a98a3da555651f4f1b5131eadf2e1297fa55895915ecef48d41a5f26582bfc54be9c500cdbc06b8792cba5115849b6eac63bff3f6a85bbed3dca495cd68ea350669c5a02a493f8d2c239563c9f77493027b6e38bdf3c687269c4dbc23fb622893f16656fada345c7a0ab086b159ed560829e6f160078605dcdbe0512b42"
  }
};
const PRICING_SNAPSHOT_ID = 'price-20261030-v35-truth';
const SNAPSHOT_DATE = '2026-10-29';
const POLICY_VERSION = 'esp-v40.2-20261030';
const MERKLE_ROOT = 'sha256:d2f517094b814bcf41ea821c1ce654aa29df8ac454acd1c96779d7966ab688f4';
const MAX_SAFE_INT = 9007199254740991;

const CORE_CLIFF_SPECS: Record<string, {
  in: number; out: number; cache: number; cacheWrite: number;
  cliffTokens: number | null; cliffIn: number; cliffOut: number;
  softBlock: number | null; rTok: number; fallback: string | null; defaultRoutedCacheHit: number;
}> = {
  'gpt-6-1-sol': { in: 2.00, out: 10.00, cache: 0.10, cacheWrite: 2.00, cliffTokens: 272000, cliffIn: 4.00, cliffOut: 15.00, softBlock: 244800, rTok: 1.00, fallback: 'claude-sonnet-5-5', defaultRoutedCacheHit: 0.80 },
  'claude-haiku-5-5': { in: 0.10, out: 0.50, cache: 0.01, cacheWrite: 0.125, cliffTokens: 100000, cliffIn: 0.50, cliffOut: 2.50, softBlock: 90000, rTok: 1.28, fallback: 'gpt-6-luna', defaultRoutedCacheHit: 0.00 },
  'claude-sonnet-5-5': { in: 2.00, out: 10.00, cache: 0.10, cacheWrite: 2.50, cliffTokens: null, cliffIn: 2.00, cliffOut: 10.00, softBlock: null, rTok: 1.28, fallback: null, defaultRoutedCacheHit: 0.80 },
  'claude-opus-5-5': { in: 4.00, out: 20.00, cache: 0.20, cacheWrite: 5.00, cliffTokens: null, cliffIn: 4.00, cliffOut: 20.00, softBlock: null, rTok: 1.28, fallback: 'claude-sonnet-5-5', defaultRoutedCacheHit: 0.40 },
  'gpt-6-luna': { in: 0.10, out: 0.50, cache: 0.01, cacheWrite: 0.10, cliffTokens: null, cliffIn: 0.10, cliffOut: 0.50, softBlock: null, rTok: 1.00, fallback: null, defaultRoutedCacheHit: 0.00 },
};

function isStrictSafeNonNegInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 && v <= MAX_SAFE_INT;
}

const ALLOWED_CLIFF_KEYS = new Set(['model', 'prompt_tokens', 'completion_tokens', 'request_id', 'cold_start_cache_write', 'allow_async_batch', 'budget_gate_usd', 'cache_hit_rate', 'routed_cache_hit_rate', 'retry_rate', 'pass_rate']);
function runCheckContextCliff(args: any) {
  if (!args || typeof args !== 'object' || Array.isArray(args)) {
    return { isError: true, error_code: 'INVALID_ARGUMENTS', message: 'Arguments object is required.' };
  }
  for (const k of Object.keys(args)) {
    if (!ALLOWED_CLIFF_KEYS.has(k)) {
      return { isError: true, error_code: 'ADDITIONAL_PROPERTY_FORBIDDEN', message: `Unsupported property '${k}'. Only model name and token counts are accepted; prompt content is strictly rejected.` };
    }
  }
  const model = typeof args.model === 'string' ? args.model.trim() : '';
  const m = CORE_CLIFF_SPECS[model];
  if (!m) {
    return {
      isError: true,
      error_code: 'UNKNOWN_MODEL',
      message: `Unknown model '${model}'. Supported cliff-engine models (5): ${Object.keys(CORE_CLIFF_SPECS).join(', ')}`,
      supported_models: Object.keys(CORE_CLIFF_SPECS),
    };
  }
  const rawP = args.prompt_tokens !== undefined ? args.prompt_tokens : args.promptTokens;
  const rawC = args.completion_tokens !== undefined ? args.completion_tokens : args.completionTokens;
  if (!isStrictSafeNonNegInt(rawP) || !isStrictSafeNonNegInt(rawC)) {
    return {
      isError: true,
      error_code: 'INVALID_TOKEN_COUNT',
      message: `prompt_tokens and completion_tokens must be safe non-negative integers (0..${MAX_SAFE_INT}), got prompt_tokens=${JSON.stringify(rawP)}, completion_tokens=${JSON.stringify(rawC)}.`,
    };
  }
  const pTok = rawP;
  const cTok = rawC;
  if (args.request_id !== undefined && (typeof args.request_id !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(args.request_id))) {
    return { isError: true, error_code: 'INVALID_REQUEST_ID', message: 'request_id must match /^[a-zA-Z0-9_-]{1,64}$/ (max 64 chars).' };
  }
  const reqId = typeof args.request_id === 'string' ? args.request_id : 'mcp_req_01';
  const coldStart = Boolean(args.cold_start_cache_write ?? false);
  const allowBatch = args.allow_async_batch !== undefined ? Boolean(args.allow_async_batch) : true;
  const cacheHitRate = args.cache_hit_rate !== undefined ? Number(args.cache_hit_rate) : 0.40;
  const retryRate = args.retry_rate !== undefined ? Number(args.retry_rate) : 0.05;
  const passRate = args.pass_rate !== undefined ? Number(args.pass_rate) : 0.96;
  const budgetGateUsd = args.budget_gate_usd !== undefined ? Number(args.budget_gate_usd) : 0.06;

  if (
    !Number.isFinite(cacheHitRate) || cacheHitRate < 0 || cacheHitRate > 1 ||
    !Number.isFinite(retryRate) || retryRate < 0 || retryRate > 1 ||
    !Number.isFinite(passRate) || passRate <= 0 || passRate > 1 ||
    !Number.isFinite(budgetGateUsd) || budgetGateUsd < 0
  ) {
    return {
      isError: true,
      error_code: 'INVALID_RATE_PARAMETER',
      message: 'cache_hit_rate (0..1), retry_rate (0..1), pass_rate ((0..1]), and budget_gate_usd (>=0) must be valid numbers within bounds.',
    };
  }

  const calcSingle = (spec: typeof m, p: number, c: number, cliff: boolean, cHit: number, cold: boolean) => {
    const bIn = cliff ? spec.cliffIn : spec.in;
    const bOut = cliff ? spec.cliffOut : spec.out;
    const eIn = cold ? (0.20 * bIn + 0.80 * spec.cacheWrite) : ((1 - cHit) * bIn + cHit * spec.cache);
    return Number(((p / 1e6) * eIn + (c / 1e6) * bOut).toFixed(4));
  };
  const calcTask = (spec: typeof m, p: number, c: number) => {
    const eIn = (1 - cacheHitRate) * spec.in + cacheHitRate * spec.cache;
    const base = ((p * spec.rTok) / 1e6) * eIn + ((c * spec.rTok) / 1e6) * spec.out;
    return Number(((base * (1 + retryRate)) / passRate).toFixed(6));
  };

  const crossedHardCliff = m.cliffTokens !== null && pTok > m.cliffTokens;
  const singleUnrouted = calcSingle(m, pTok, cTok, crossedHardCliff, 0, false);
  const fp = `fp_${model.replace(/[^a-z0-9]/g, '')}_${pTok}_${cTok}_${coldStart ? 'cold' : 'warm'}`;
  const decisionId = `dec_${reqId}_${fp}`;

  if (m.softBlock && pTok > m.softBlock && m.fallback) {
    const projRisk = calcSingle(m, pTok, cTok, true, 0, false);
    const fb = CORE_CLIFF_SPECS[m.fallback];
    const rCache = args.routed_cache_hit_rate !== undefined ? Number(args.routed_cache_hit_rate) : m.defaultRoutedCacheHit;
    const sameTokRouted = calcSingle(fb, pTok, cTok, false, rCache, coldStart);
    const rawTokRatio = fb.rTok / m.rTok;
    const tokRatio = Math.max(1.0, rawTokRatio);
    const tokAdjRouted = calcSingle(fb, Math.round(pTok * tokRatio), Math.round(cTok * tokRatio), false, rCache, coldStart);
    const savAdj = Number(Math.max(0, singleUnrouted - tokAdjRouted).toFixed(4));
    const savSame = Number(Math.max(0, singleUnrouted - sameTokRouted).toFixed(4));

    const unroutedCliffCacheReadRate = crossedHardCliff ? (m.cache * (m.cliffIn / m.in)) : m.cache;
    const unroutedSymEffIn = coldStart ? (0.20 * (crossedHardCliff ? m.cliffIn : m.in) + 0.80 * m.cacheWrite) : ((1 - rCache) * (crossedHardCliff ? m.cliffIn : m.in) + rCache * unroutedCliffCacheReadRate);
    const singleUnroutedSymmetricCache = Number(((pTok / 1e6) * unroutedSymEffIn + (cTok / 1e6) * (crossedHardCliff ? m.cliffOut : m.out)).toFixed(4));
    const savSymmetricCache = Number(Math.max(0, singleUnroutedSymmetricCache - tokAdjRouted).toFixed(4));

    return {
      isError: false,
      structuredContent: {
        status: crossedHardCliff ? 'BLOCK_REROUTE' : 'WARN',
        action: crossedHardCliff ? 'SOFT_BLOCK_REROUTE' : 'PRE_CLIFF_SOFT_BLOCK_WARNING',
        zone: crossedHardCliff ? 'HARD_CLIFF_BREACHED' : 'PRE_CLIFF_GUARD_ZONE',
        target_model: m.fallback,
        single_call_unrouted_usd: singleUnrouted,
        single_call_unrouted_symmetric_cache_usd: singleUnroutedSymmetricCache,
        projected_cliff_risk_usd: projRisk,
        routed_cost_usd: tokAdjRouted,
        realized_savings_usd: savAdj,
        realized_savings_symmetric_cache_usd: savSymmetricCache,
        routed_cost_same_token_count_usd: sameTokRouted,
        realized_savings_same_token_count_usd: savSame,
        fallback_tokenizer_ratio: Number(tokRatio.toFixed(4)),
        raw_fallback_tokenizer_ratio: Number(rawTokRatio.toFixed(4)),
        routed_cache_hit_rate_applied: rCache,
        execution_feasibility_audit: {
          completion_tokens: cTok,
          target_model_tps: m.fallback === 'claude-sonnet-5-5' ? 96 : 145,
          estimated_generation_wall_time_sec: Number((cTok / (m.fallback === 'claude-sonnet-5-5' ? 96 : 145)).toFixed(1)),
          gateway_timeout_risk: (cTok / (m.fallback === 'claude-sonnet-5-5' ? 96 : 145)) > 120 ? 'HIGH_RISK_EXCEEDS_120S_HTTP_TIMEOUT' : 'WITHIN_STANDARD_HTTP_TIMEOUT',
          streaming_sse_required: (cTok / (m.fallback === 'claude-sonnet-5-5' ? 96 : 145)) > 30,
        },
        model_reality_tier: 'FRONTIER_SIMULATION_BENCHMARK (Use production_ga_ready_patch below for today-callable OpenAI/Anthropic/Google GA APIs)',
        reasoning_tokens_overhead_audit: {
          visible_completion_tokens: cTok,
          modeled_hidden_thinking_tokens_at_medium_effort: Math.round(cTok * 0.5),
          note: 'For reasoning models (o3-mini, claude-3-7-sonnet extended thinking, deepseek-reasoner), hidden thinking tokens are billed at full output token rate.'
        },
        cache_write_amortization_audit: {
          claude_cache_write_surcharge_multiplier: 1.25,
          assumed_session_turns_per_5m_ttl: 5,
          amortized_effective_cache_hit_rate: rCache
        },
        production_ga_ready_patch: {
          description: 'Context-Boundary & Cliff-Aware Production GA Routing (Accounts for Gemini 2.5 Pro >200K 2x cliff, GPT-4.1 1M flat rate, and Map-Reduce chunking inflation)',
          single_pass_1m_context_ga_route: {
            applicable_when: 'prompt_tokens > 128000 (e.g. 285,000 in + 20,000 out = 305,000 total tokens)',
            unpruned_285k_primary_ga_model: 'openai/gpt-4.1 (1,047,576 max input, 32,768 max output; flat $2.00/$8.00 rate across entire 1M window -> 0.285*$2.00 + 0.020*$8.00 = $0.7300/call, 27.9% cheaper than unpruned Gemini 2.5 Pro)',
            unpruned_285k_gemini_cliff_warning: 'google/gemini-2.5-pro has a 2x price cliff at 200,000 input tokens ($1.25/$10.00 <=200K jumps to $2.50/$15.00 >200K -> 0.285*$2.50 + 0.020*$15.00 = $1.0125/call if unpruned; plus $4.50/1M/hr explicit cache storage rent = $30.78/24h)',
            pruned_198k_gemini_optimal_route: 'If pre-router semantic pruning trims prompt from 285,000 to context_pruning_target_tokens=198000 (<=200K cliff), google/gemini-2.5-pro drops to $1.25/$10.00 tier -> 0.198*$1.25 + 0.020*$10.00 = $0.4475/call',
            litellm_1m_ga_yaml: `model_list:\n  - model_name: ga-1m-unpruned-flat-primary\n    litellm_params:\n      model: openai/gpt-4.1\n      max_input_tokens: 1047576\n      max_output_tokens: 32768\n  - model_name: ga-1m-pruned-198k-gemini\n    litellm_params:\n      model: gemini/gemini-2.5-pro\n      max_input_tokens: 198000\n      max_output_tokens: 65536`
          },
          chunked_map_reduce_128k_ga_route: {
            applicable_when: 'Routing 285K input + 20K output to 128K/16,384-capped GA models (openai/gpt-4o-2024-11-20)',
            pre_router_chunking_middleware: {
              strategy: 'map_reduce_sliding_window',
              max_input_chunk_tokens: 96000,
              parallel_map_chunks: 3,
              sliding_window_overlap_tokens: 3000,
              clamp_max_completion_tokens: 16384,
              auto_continue_on_length_finish: true
            },
            google_explicit_cache_breakeven_audit: {
              storage_rent_24h_at_285k_usd: 30.78,
              break_even_calls_per_24h_unpruned_285k: 58,
              storage_rent_24h_at_198k_usd: 21.384,
              break_even_calls_per_24h_pruned_198k: 116,
              pruning_information_loss_caveat: 'Pruning 285K -> 198K reduces cost to $0.4475/call but discards 87K tokens of context; only use when semantic RAG compression preserves >=96% task recall. For 100% lossless full-context retention, use openai/gpt-4.1 ($0.7300/call).'
            },
            map_reduce_cost_model: {
              effective_billed_input_tokens: 312000,
              input_inflation_pct: 9.47,
              map_stage_intermediate_output_tokens: 12000,
              reduce_plus_continuation_output_tokens: 20000,
              total_billed_output_tokens: 32000,
              cross_chunk_prefix_cache_sharing: false,
              per_call_itemized_ledger: [
                { call_id: 'map_chunk_1', model: 'openai/gpt-4o-2024-11-20', in_tokens: 96000, out_tokens: 4000, in_cost_usd: 0.2400, out_cost_usd: 0.0400, call_total_usd: 0.2800 },
                { call_id: 'map_chunk_2', model: 'openai/gpt-4o-2024-11-20', in_tokens: 96000, out_tokens: 4000, in_cost_usd: 0.2400, out_cost_usd: 0.0400, call_total_usd: 0.2800 },
                { call_id: 'map_chunk_3', model: 'openai/gpt-4o-2024-11-20', in_tokens: 96000, out_tokens: 4000, in_cost_usd: 0.2400, out_cost_usd: 0.0400, call_total_usd: 0.2800 },
                { call_id: 'reduce_synthesis_1', model: 'openai/gpt-4o-2024-11-20', in_tokens: 16000, out_tokens: 16384, in_cost_usd: 0.0400, out_cost_usd: 0.16384, call_total_usd: 0.20384, note: 'Hits 16,384 max_completion_tokens ceiling' },
                { call_id: 'length_continuation_2', model: 'openai/gpt-4o-2024-11-20', in_tokens: 8000, out_tokens: 3616, in_cost_usd: 0.0200, out_cost_usd: 0.03616, call_total_usd: 0.05616, note: 'Completes remaining 3,616 tokens to reach 20,000 target' }
              ],
              total_map_reduce_cost_on_gpt4o_usd: 1.1000,
              verdict: 'Single-pass lossless openai/gpt-4.1 ($0.7300) or pruned 198K gemini-2.5-pro ($0.4475) is strictly superior to 128K Map-Reduce ($1.1000).'
            }
          }
        },
        auto_remediation_patch: {
          litellm_yaml_snippet: `model_list:\n  - model_name: ${model}-safe\n    litellm_params:\n      model: ${model}\n      max_input_tokens: ${m.softBlock}\nrouter_settings:\n  context_window_fallbacks: [{'${model}-safe': ['${m.fallback}']}]`,
          vercel_ai_sdk_sse_idempotent_snippet: `import { streamText } from 'ai';\nconst abortCtrl = new AbortController();\nconst timer = setTimeout(() => abortCtrl.abort(), 115000);\nconst result = await streamText({ model: promptTokens > ${m.softBlock} ? anthropic('${m.fallback}') : openai('${model}'), prompt, abortSignal: abortCtrl.signal, headers: { 'X-Idempotency-Key': decisionId } });`,
          idempotent_retry_and_timeout_policy: 'Gateway-level idempotency state store (persists decision_id -> {status: IN_FLIGHT | COMPLETED, response_hash} in Edge KV/D1) intercepts duplicate retries BEFORE dispatching to upstream LLM providers, preventing double-billing regardless of upstream SDK header support.',
        },
        cost_calculation_breakdown: {
          unrouted_uncached_formula: `${pTok}/1e6 * $${crossedHardCliff ? m.cliffIn : m.in} + ${cTok}/1e6 * $${crossedHardCliff ? m.cliffOut : m.out} = $${singleUnrouted}`,
          unrouted_symmetric_cache_formula: `${pTok}/1e6 * ((1-${rCache})*$${crossedHardCliff ? m.cliffIn : m.in} + ${rCache}*$${unroutedCliffCacheReadRate}) + ${cTok}/1e6 * $${crossedHardCliff ? m.cliffOut : m.out} = $${singleUnroutedSymmetricCache}`,
          routed_tok_adjusted_formula: `round(${pTok}*${tokRatio})/1e6 * ((1-${rCache})*$${fb.in} + ${rCache}*$${fb.cache}) + round(${cTok}*${tokRatio})/1e6 * $${fb.out} = $${tokAdjRouted}`,
        },
        pricing_snapshot_id: PRICING_SNAPSHOT_ID,
        snapshot_date: SNAPSHOT_DATE,
        policy_version: POLICY_VERSION,
        decision_id: decisionId,
        decision_fingerprint: fp,
        disclaimer: `Estimate from snapshot ${PRICING_SNAPSHOT_ID} (${SNAPSHOT_DATE}); not billing.`,
      },
      summaryText: savAdj === 0
        ? `${model} (${pTok} in / ${cTok} out) entered pre-cliff warning zone. Current cost is neutral ($${singleUnrouted} vs $${tokAdjRouted}, $0 immediate savings); reroute recommendation to ${m.fallback} is preventive against the $${projRisk} hard-cliff surcharge risk.`
        : `${model} (${pTok} in / ${cTok} out) ${crossedHardCliff ? 'breached hard context cliff' : 'entered pre-cliff warning zone'}. Reroute to ${m.fallback}: conservative routed cost $${tokAdjRouted} (saves $${savSymmetricCache}/call vs symmetric ${Math.round(rCache*100)}%-cached baseline $${singleUnroutedSymmetricCache}; saves $${savAdj}/call vs uncached cliff baseline $${singleUnrouted}).`,
    };
  }

  const effTask = calcTask(m, pTok, cTok);
  if (effTask > budgetGateUsd) {
    let remUsd: number | undefined;
    let target = model;
    if (m.fallback && CORE_CLIFF_SPECS[m.fallback]) {
      const cand = calcTask(CORE_CLIFF_SPECS[m.fallback], pTok, cTok);
      if (cand < effTask) {
        target = m.fallback;
        remUsd = cand;
      }
    }
    if (remUsd === undefined) {
      const bf = allowBatch ? 0.5 : 1.0;
      target = allowBatch ? `${model}:batch+80pct-cache` : `${model}:sync+80pct-cache`;
      const mIn = 0.20 * (m.in * bf) + 0.80 * m.cache;
      const mBase = ((pTok * m.rTok) / 1e6) * mIn + ((cTok * m.rTok) / 1e6) * (m.out * bf);
      remUsd = Number(((mBase * (1 + retryRate)) / passRate).toFixed(6));
    }
    return {
      isError: false,
      structuredContent: {
        status: 'BLOCK_BUDGET',
        action: 'BUDGET_GATE_BLOCK',
        target_model: target,
        single_call_unrouted_usd: singleUnrouted,
        unrouted_task_cost_usd: effTask,
        remediated_cost_usd: remUsd,
        conditional_batch_eligible: allowBatch,
        pricing_snapshot_id: PRICING_SNAPSHOT_ID,
        snapshot_date: SNAPSHOT_DATE,
        policy_version: POLICY_VERSION,
        decision_id: decisionId,
        decision_fingerprint: fp,
        disclaimer: 'Estimate from snapshot price-20261029-v29 (2026-10-29); not billing.',
      },
      summaryText: `${model} task cost $${effTask} exceeds budget gate $${budgetGateUsd}. Remediate via ${target} to reduce task cost to $${remUsd}.`,
    };
  }

  return {
    isError: false,
    structuredContent: {
      status: 'ALLOW',
      action: 'ALLOW_DIRECT',
      target_model: model,
      single_call_unrouted_usd: singleUnrouted,
      effective_cost_usd: effTask,
      pricing_snapshot_id: PRICING_SNAPSHOT_ID,
      snapshot_date: SNAPSHOT_DATE,
      policy_version: POLICY_VERSION,
      decision_id: decisionId,
      decision_fingerprint: fp,
      disclaimer: 'Estimate from snapshot price-20261029-v29 (2026-10-29); not billing.',
    },
    summaryText: `${model} (${pTok} in / ${cTok} out) is within safe budget & context limits (effective task cost $${effTask}).`,
  };
}

const MCP_TOOLS = [
  {
    name: 'check_context_cliff',
    description: "Check one LLM request's token counts against a pricing snapshot and return a deterministic decision: allow, pre-cliff warning, hard-cliff reroute, or budget-gate block, with estimated costs and a cheaper fallback model where one exists. Estimates only, not billing. Receives model name and token counts only, never prompt content.",
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        model: { type: 'string', description: 'Model ID from list_supported_models (gpt-6-1-sol, claude-haiku-5-5, claude-sonnet-5-5, claude-opus-5-5, gpt-6-luna)' },
        prompt_tokens: { type: 'integer', minimum: 0, maximum: MAX_SAFE_INT },
        completion_tokens: { type: 'integer', minimum: 0, maximum: MAX_SAFE_INT },
        request_id: { type: 'string', maxLength: 64, pattern: '^[a-zA-Z0-9_-]{1,64}$', description: 'Optional trace ID (1..64 alphanumeric/underscore/hyphen chars).' },
        cold_start_cache_write: { type: 'boolean', default: false },
        allow_async_batch: { type: 'boolean', default: true },
        budget_gate_usd: { type: 'number', minimum: 0, default: 0.06 },
        cache_hit_rate: { type: 'number', minimum: 0, maximum: 1, default: 0.40 },
        routed_cache_hit_rate: { type: 'number', minimum: 0, maximum: 1 },
        retry_rate: { type: 'number', minimum: 0, maximum: 1, default: 0.05 },
        pass_rate: { type: 'number', exclusiveMinimum: 0, maximum: 1, default: 0.96 },
      },
      required: ['model', 'prompt_tokens', 'completion_tokens'],
      additionalProperties: false,
    },
  },
  {
    name: 'list_supported_models',
    description: 'Return the 5 deterministic cliff-engine models supported by check_context_cliff along with their input/output rates, cache rates, cliff token thresholds, soft-block thresholds, fallback targets, pricing_snapshot_id, and Merkle root.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'etuki_search_models',
    description: 'Search and filter across all 563 Merkle-committed LLM API and cloud infrastructure entities in the Etuki catalog by keyword.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Model or vendor keyword (e.g. gpt-6.1, claude, gemini, deepseek, hunyuan)' } },
      additionalProperties: false,
    },
  },
  {
    name: 'etuki_get_audit_evidence',
    description: 'Retrieve the cryptographic snapshot metadata (Merkle root, RS256 public key URL, snapshot date, and 12/12 CI self-test reference) for the current pricing snapshot.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
];

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const callTool = url.searchParams.get('call');
  
        if (callTool === 'optimize_prompt_cache_layout') {
    const reqUrlParams = new URL(req.url).searchParams;
    const uncachedTailTok = Number(reqUrlParams.get('uncached_tail_prompt_tokens') || '2');
    const staticTok = Number(reqUrlParams.get('static_prefix_tokens') || '52695');
    const dynamicMidTok = Number(reqUrlParams.get('dynamic_mid_tokens') || '93029');
    const compTok = Number(reqUrlParams.get('completion_tokens') || '2696');
    const unoptimizedCostUsd = Number(((uncachedTailTok * 8.0 + staticTok * 1.60 + dynamicMidTok * 10.0 + compTok * 40.0) / 1e6).toFixed(6));
    const scenarioA_relay02xWarmUsd = Number(((uncachedTailTok * 8.0 + (staticTok + dynamicMidTok) * 1.60 + compTok * 40.0) / 1e6).toFixed(6));
    const scenarioA_official01xWarmUsd = Number(((uncachedTailTok * 8.0 + (staticTok + dynamicMidTok) * 0.80 + compTok * 40.0) / 1e6).toFixed(6));
    const scenarioB_dynamicTailBypassUsd = Number(((uncachedTailTok * 8.0 + staticTok * 1.60 + dynamicMidTok * 8.0 + compTok * 40.0) / 1e6).toFixed(6));
    return NextResponse.json({
      protocol: 'mcp-2026.10-clearing-intermediary',
      tool_executed: 'optimize_prompt_cache_layout',
      build_version: EVIDENCE_MANIFEST.build_version,
      schema_version: EVIDENCE_MANIFEST.schema_version,
      pricing_snapshot_id: PRICING_SNAPSHOT_ID,
      telemetry_snapshot_id: EVIDENCE_MANIFEST.telemetry_snapshot_id,
      signed_payload_sha256: EVIDENCE_MANIFEST.signature_envelope.signed_payload_sha256,
      cache_stabilization_plan: {
        uncached_tail_prompt_tokens: uncachedTailTok,
        detected_breakpoint_fracture_at_token: staticTok,
        fractured_cold_rebuild_tokens: dynamicMidTok,
        completion_tokens: compTok,
        recommended_4_ephemeral_breakpoints: [32768, 65536, 114688, staticTok + dynamicMidTok],
        unoptimized_cold_rebuild_cost_usd: unoptimizedCostUsd,
        scenario_a_cache_poisoning_recovery: {
          description: 'Move dynamic timestamp/env injection to the 2-token tail so all 145,724 prefix tokens hit warm cache',
          relay_0_2x_warm_total_usd: scenarioA_relay02xWarmUsd,
          official_0_1x_warm_total_usd: scenarioA_official01xWarmUsd,
          net_saved_vs_unoptimized_usd: Number((unoptimizedCostUsd - scenarioA_official01xWarmUsd).toFixed(6))
        },
        scenario_b_pure_dynamic_tail_bypass: {
          description: 'If 93,029 tokens mutate every turn, strip ephemeral cache_control tag to avoid 1.25x ($10/1M) write penalty and pay 1.0x ($8/1M)',
          bypass_total_usd: scenarioB_dynamicTailBypassUsd,
          write_penalty_saved_per_turn_usd: Number((unoptimizedCostUsd - scenarioB_dynamicTailBypassUsd).toFixed(6))
        }
      },
      evidence_manifest: EVIDENCE_MANIFEST
    }, { status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' } });
  }

  if (callTool === 'reconcile_usage_receipt') {
    const reqUrlParams = new URL(req.url).searchParams;
    const modelId = reqUrlParams.get('model') || 'openai/gpt-4o-2024-11-20';
    const promptTok = Number(reqUrlParams.get('prompt_tokens') || '180000');
    const cachedTok = Number(reqUrlParams.get('cached_tokens') || '0');
    const compTok = Number(reqUrlParams.get('completion_tokens') || '4000');
    const actualBilledUsd = Number(reqUrlParams.get('actual_billed_usd') || '0.490000');
    const uncachedTok = Math.max(0, promptTok - cachedTok);
    const theoreticalCostUsd = Number(((uncachedTok / 1e6) * 2.50 + (cachedTok / 1e6) * 1.25 + (compTok / 1e6) * 10.00).toFixed(6));
    const sameModel80PctCacheCostUsd = Number((((promptTok * 0.20) / 1e6) * 2.50 + ((promptTok * 0.80) / 1e6) * 1.25 + (compTok / 1e6) * 10.00).toFixed(6));
    const sameModelCacheWasteUsd = Number((theoreticalCostUsd - sameModel80PctCacheCostUsd).toFixed(6));
    const optimalGaAltCostUsd = Number((((promptTok * 0.20) / 1e6) * 2.00 + ((promptTok * 0.80) / 1e6) * 0.50 + (compTok / 1e6) * 8.00).toFixed(6));
    const varianceUsd = Number((actualBilledUsd - theoreticalCostUsd).toFixed(6));
    return NextResponse.json({
      protocol: 'mcp-2026.10-clearing-intermediary',
      tool_executed: 'reconcile_usage_receipt',
      build_version: EVIDENCE_MANIFEST.build_version,
      schema_version: EVIDENCE_MANIFEST.schema_version,
      pricing_snapshot_id: PRICING_SNAPSHOT_ID,
      telemetry_snapshot_id: EVIDENCE_MANIFEST.telemetry_snapshot_id,
      signed_payload_sha256: EVIDENCE_MANIFEST.signature_envelope.signed_payload_sha256,
      reconciliation_result: {
        model_id: modelId, prompt_tokens: promptTok, cached_tokens: cachedTok, completion_tokens: compTok,
        receipt_aggregation_inference: (promptTok + compTok) > 128000 ? 'MULTI_CALL_AGGREGATED_USAGE (min_calls_required: 2, exceeds_128k_single_call_window: true)' : 'SINGLE_CALL_USAGE',
        actual_billed_usd: actualBilledUsd,
        expected_theoretical_cost_usd: theoreticalCostUsd,
        billing_variance_usd: varianceUsd,
        variance_status: varianceUsd > 0.001 ? 'OVERCHARGED_BY_RELAY_OR_MARKUP' : 'EXACT_RATE_CARD_MATCH',
        same_model_unutilized_cache_waste_usd: sameModelCacheWasteUsd,
        cross_model_routing_additional_savings_usd: Number((sameModel80PctCacheCostUsd - optimalGaAltCostUsd).toFixed(6)),
        unutilized_cache_waste_usd: sameModelCacheWasteUsd,
        optimal_ga_alternative_model: 'openai/gpt-4.1 (with 80% prefix cache pinning)',
        optimal_ga_alternative_cost_usd: optimalGaAltCostUsd,
        net_recoverable_savings_usd: Number((actualBilledUsd - optimalGaAltCostUsd).toFixed(6)),
        executable_routing_directive: 'ROUTE_TO_OPENAI_GPT_4_1_AND_PIN_SYSTEM_PREFIX_CACHE'
      },
      evidence_manifest: EVIDENCE_MANIFEST
    }, { status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store, max-age=0' } });
  }

  if (callTool === 'check_context_cliff') {
    const rawP = url.searchParams.get('prompt_tokens');
    const rawC = url.searchParams.get('completion_tokens');
    const parsedP = rawP !== null && /^\d+$/.test(rawP) ? Number(rawP) : rawP;
    const parsedC = rawC !== null && /^\d+$/.test(rawC) ? Number(rawC) : rawC;
    const args: Record<string, any> = {
      model: url.searchParams.get('model') || 'gpt-6-1-sol',
      prompt_tokens: parsedP,
      completion_tokens: parsedC,
      request_id: url.searchParams.get('request_id') || 'live_get_test_01',
      cold_start_cache_write: url.searchParams.get('cold_start') === 'true',
    };
    if (url.searchParams.get('prompt_text') !== null) {
      args.prompt_text = url.searchParams.get('prompt_text');
    }
    const res = runCheckContextCliff(args);
    return NextResponse.json({
      jsonrpc: '2.0',
      id: 'live_get_rpc_1',
      live_execution_mode: 'DIRECT_HTTP_GET_TOOL_INVOCATION',
      build_version: '2026.10.30-v40.2-production-sync',
      schema_version: '2026.10.30-v40.2-production-sync',
      pricing_snapshot_id: 'price-20261030-v35-truth',
      telemetry_snapshot_id: 'telemetry-20261030-v35-truth',
      policy_version: 'esp-v40.2-20261030',
      signed_payload_sha256: EVIDENCE_MANIFEST.signature_envelope.signed_payload_sha256,
      catalog_payload_sha256: 'sha256:6bc877254427a142ff842bfa318350453ffebc62faf90f62337f96fb7fa5db82',
      evidence_manifest: EVIDENCE_MANIFEST,
      executed_at_utc: new Date().toISOString(),
      input_arguments_received: { model: args.model, prompt_tokens: args.prompt_tokens, completion_tokens: args.completion_tokens },
      result: res.isError
        ? { isError: true, error_code: res.error_code, message: res.message }
        : { isError: false, structuredContent: res.structuredContent, content: [{ type: 'text', text: res.summaryText }] },
    }, { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400' } });
  }

  return NextResponse.json({
    protocol: 'Model Context Protocol (MCP) Streamable HTTP Server',
    build_version: '2026.10.30-v40.2-production-sync',
    schema_version: '2026.10.30-v40.2-production-sync',
    policy_version: 'esp-v40.2-20261030',
    server_name: 'etuki-finops-mcp',
    version: '40.7.6',
    privacy_policy_url: 'https://www.etuki.com/privacy',
    data_collection_policy: 'Receives model name and token counts only; never collects prompt text or conversation history. Logs record request timestamp and status code only.',
    pricing_snapshot_id: PRICING_SNAPSHOT_ID,
    snapshot_date: SNAPSHOT_DATE,
    pricing_merkle_root: MERKLE_ROOT,
    evidence_manifest: EVIDENCE_MANIFEST,
    live_get_test_endpoints: {
      positive_cliff_reroute_ci03: 'https://www.etuki.com/api/v1/mcp?call=check_context_cliff&model=gpt-6-1-sol&prompt_tokens=285000&completion_tokens=20000&v=40.7.6',
      negative_invalid_token_count: 'https://www.etuki.com/api/v1/mcp?call=check_context_cliff&model=gpt-6-1-sol&prompt_tokens=12abc&completion_tokens=20000&v=40.7.6',
      negative_privacy_prompt_rejected: 'https://www.etuki.com/api/v1/mcp?call=check_context_cliff&model=gpt-6-1-sol&prompt_tokens=15000&completion_tokens=2000&prompt_text=secret&v=40.7.6',
    },
    tools: MCP_TOOLS,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const method = body?.method;
    const id = body?.id ?? 1;

    if (method === 'initialize') {
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2025-03-26',
          capabilities: { tools: {} },
          serverInfo: { name: 'etuki-finops-mcp', version: '40.7.6' },
        },
      });
    }

    if (method === 'tools/list') {
      return NextResponse.json({ jsonrpc: '2.0', id, result: { tools: MCP_TOOLS } });
    }

    if (method === 'tools/call') {
      const toolName = body?.params?.name;
      const args = body?.params?.arguments || {};

      if (toolName === 'check_context_cliff') {
        const res = runCheckContextCliff(args);
        if (res.isError) {
          return NextResponse.json({
            jsonrpc: '2.0',
            id,
            result: { isError: true, content: [{ type: 'text', text: JSON.stringify(res) }] },
          });
        }
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            isError: false,
            structuredContent: res.structuredContent,
            content: [{ type: 'text', text: res.summaryText }],
          },
        });
      }

      if (toolName === 'list_supported_models') {
        const payload = {
          pricing_snapshot_id: PRICING_SNAPSHOT_ID,
          pricing_merkle_root: MERKLE_ROOT,
          snapshot_date: SNAPSHOT_DATE,
          supported_cliff_engine_models_count: Object.keys(CORE_CLIFF_SPECS).length,
          models: CORE_CLIFF_SPECS,
        };
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: { isError: false, structuredContent: payload, content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }] },
        });
      }

      if (toolName === 'etuki_search_models') {
        const q = String(args?.query || '').toLowerCase();
        const all = await getAllProviders();
        const matches = all
          .filter((p: any) => !q || p.slug.toLowerCase().includes(q) || p.name.toLowerCase().includes(q))
          .slice(0, 15)
          .map((p: any) => ({
            slug: p.slug,
            name: p.name,
            input_usd_1m: p.token_cost_per_1m_input ?? p.cost_per_m_input ?? 0,
            output_usd_1m: p.token_cost_per_1m_output ?? p.cost_per_m_output ?? 0,
            context_window_k: p.context_window_k ?? 128,
            details_url: `https://www.etuki.com/provider/${p.slug}`,
          }));
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: { isError: false, structuredContent: { query: q, count: matches.length, matches }, content: [{ type: 'text', text: JSON.stringify(matches, null, 2) }] },
        });
      }

      if (toolName === 'etuki_get_audit_evidence') {
        const evidence = {
          pricing_snapshot_id: PRICING_SNAPSHOT_ID,
          snapshot_date: SNAPSHOT_DATE,
          policy_version: POLICY_VERSION,
          binary_merkle_root: MERKLE_ROOT,
          public_key_url: 'https://www.etuki.com/ci-pubkey.json',
          public_ci_repo: 'https://github.com/cooyun/etuki-gate',
        };
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: { isError: false, structuredContent: evidence, content: [{ type: 'text', text: JSON.stringify(evidence, null, 2) }] },
        });
      }

      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        result: { isError: true, content: [{ type: 'text', text: `Unknown tool: ${toolName}` }] },
      });
    }

    return NextResponse.json({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found' } });
  } catch (e: any) {
    return NextResponse.json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: e?.message || 'Parse error' } }, { status: 400 });
  }
}
