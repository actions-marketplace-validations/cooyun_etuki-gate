#!/usr/bin/env python3
import copy, json, hashlib, urllib.request

MANDATORY_12_KEYS = ["canonical_model_id", "provider_model_id", "leaf_index", "provenance_tier", "reality_tier", "input_usd_1m", "output_usd_1m", "cache_read_usd_1m", "cache_write_multiplier", "context_window_tokens", "source_url_commitment_sha256", "pricing_snapshot_id"]
EXPECTED_12FIELD_ROOT = "9a213ac862bddb2b404ad1c1f130b450b63d5abc29dd03d8643f910741e98405"
EXPECTED_V35_GENESIS_ROOT = "d2f517094b814bcf41ea821c1ce654aa29df8ac454acd1c96779d7966ab688f4"

def sha256_hex(s):
    return hashlib.sha256(s.encode("utf-8")).hexdigest()

def reduce_odd_dup_merkle_root(hashes_list):
    cur = list(hashes_list)
    while len(cur) > 1:
        if len(cur) % 2 == 1:
            cur.append(cur[-1])
        cur = [sha256_hex(cur[i] + ":" + cur[i+1]) for i in range(0, len(cur), 2)]
    return cur[0]


def verify_jwks_der_spki_sha256(jwks_doc):
    import base64
    der_b64 = jwks_doc.get("der_subject_public_key_info_base64", "")
    der_bytes = base64.b64decode(der_b64)
    recomputed_spki_sha = hashlib.sha256(der_bytes).hexdigest()
    assert recomputed_spki_sha == "a43a9de120fb8753d66dc4d327687f8632dfc30d09cc047c3aa46b527e9e8cd7", f"SPKI mismatch: {recomputed_spki_sha}"
    return True

def verify_563_and_20_proofs(leaves_doc, standalone_proofs_doc=None):
    leaves = leaves_doc.get("all_563_entity_leaf_records") or leaves_doc.get("leaves")
    assert isinstance(leaves, list) and len(leaves) == 563, f"Expected 563 leaves, got {len(leaves) if isinstance(leaves, list) else type(leaves)}"

    computed_hashes = []
    for idx, lf in enumerate(leaves):
        assert lf.get("leaf_index") == idx, f"Discontinuous leaf_index at {idx}: {lf.get('leaf_index')}"
        for req_k in MANDATORY_12_KEYS:
            assert req_k in lf and lf[req_k] is not None, f"Missing mandatory key {req_k} at leaf {idx}"
        preimage_obj = {k: lf[k] for k in MANDATORY_12_KEYS}
        canon = json.dumps(preimage_obj, separators=(",", ":"), sort_keys=True)
        assert canon == lf.get("leaf_preimage_canonical_json"), f"Preimage mismatch at leaf {idx}"
        h = sha256_hex(canon)
        assert h == lf.get("leaf_sha256_hex"), f"Leaf hash mismatch at leaf {idx}"
        computed_hashes.append(h)

    assert len(set(computed_hashes)) == 563, "All 563 leaf hashes must be 100% unique"
    recomputed_root = reduce_odd_dup_merkle_root(computed_hashes)
    assert recomputed_root == EXPECTED_12FIELD_ROOT, f"Root mismatch: {recomputed_root} != {EXPECTED_12FIELD_ROOT}"
    assert leaves_doc.get("merkle_tree_specification", {}).get("recomputed_563_unique_leaf_records_root_sha256_hex") == EXPECTED_12FIELD_ROOT

    # Strict 20-Proof Preimage & Entity Identity Binding Verification:
    proofs = leaves_doc.get("sample_20_ga_inclusion_proofs")
    assert isinstance(proofs, list) and len(proofs) == 20, f"Expected exactly 20 proofs, got {len(proofs) if isinstance(proofs, list) else 'None'}"

    seen_indices = set()
    for card in proofs:
        idx = card.get("leaf_index")
        assert isinstance(idx, int) and 0 <= idx < 563, f"Invalid leaf_index {idx}"
        assert idx not in seen_indices, f"Duplicate proof leaf_index {idx}"
        seen_indices.add(idx)

        target_leaf = leaves[idx]
        assert card.get("reality_tier") == "PRODUCTION_GA_LIVE", f"Proof at {idx} is not PRODUCTION_GA_LIVE"
        assert card.get("canonical_model_id") == target_leaf["canonical_model_id"], f"Model ID mismatch at {idx}"
        assert card.get("provider_model_id") == target_leaf["provider_model_id"], f"Provider model ID mismatch at {idx}"

        # Rebuild preimage directly from the proof card's own 12 fields and bind to leaf[idx]
        card_preimage_obj = {k: card[k] for k in MANDATORY_12_KEYS}
        card_preimage_canon = json.dumps(card_preimage_obj, separators=(",", ":"), sort_keys=True)
        assert card_preimage_canon == card.get("leaf_preimage_canonical_json"), f"Card preimage string mismatch at {idx}"
        assert card_preimage_canon == target_leaf["leaf_preimage_canonical_json"], f"Card preimage does not match leaf[{idx}] preimage"
        assert sha256_hex(card_preimage_canon) == card.get("leaf_sha256_hex"), f"Card preimage SHA-256 mismatch at {idx}"
        assert card.get("leaf_sha256_hex") == computed_hashes[idx], f"Card leaf_sha256_hex detached from computed_hashes[{idx}]"

        steps = card.get("merkle_inclusion_proof_10_levels")
        assert isinstance(steps, list) and len(steps) == 10, f"Expected 10 proof levels at {idx}"
        c_hash = card["leaf_sha256_hex"]
        for step in steps:
            sib = step["sibling_sha256"]
            c_hash = sha256_hex(c_hash + ":" + sib) if step["sibling_position"] == "RIGHT" else sha256_hex(sib + ":" + c_hash)
        assert c_hash == EXPECTED_12FIELD_ROOT, f"Inclusion path failed at {idx}: {c_hash} != {EXPECTED_12FIELD_ROOT}"
        assert card.get("target_563_unique_leaves_merkle_root_sha256") == EXPECTED_12FIELD_ROOT

    if standalone_proofs_doc is not None:
        assert standalone_proofs_doc.get("target_563_unique_leaves_merkle_root_sha256") == EXPECTED_12FIELD_ROOT
        ext_proofs = standalone_proofs_doc.get("all_20_preimages_and_10_level_proofs")
        assert isinstance(ext_proofs, list) and len(ext_proofs) == 20
        canon_embedded = json.dumps(proofs, separators=(",", ":"), sort_keys=True)
        canon_standalone = json.dumps(ext_proofs, separators=(",", ":"), sort_keys=True)
        assert sha256_hex(canon_embedded) == sha256_hex(canon_standalone), "Standalone 20-proof endpoint drifted from embedded leaves-563.json proofs!"

    return True

def run_negative_tamper_self_tests(leaves_doc):
    # 1. Missing/empty proofs array MUST fail
    d1 = copy.deepcopy(leaves_doc); d1["sample_20_ga_inclusion_proofs"] = []
    try: verify_563_and_20_proofs(d1); raise RuntimeError("NEG-1 failed to reject empty proofs")
    except AssertionError: pass

    # 2. 19 proofs instead of 20 MUST fail
    d2 = copy.deepcopy(leaves_doc); d2["sample_20_ga_inclusion_proofs"] = d2["sample_20_ga_inclusion_proofs"][:19]
    try: verify_563_and_20_proofs(d2); raise RuntimeError("NEG-2 failed to reject 19 proofs")
    except AssertionError: pass

    # 3. Duplicate leaf_index in proofs MUST fail
    d3 = copy.deepcopy(leaves_doc); d3["sample_20_ga_inclusion_proofs"][1] = copy.deepcopy(d3["sample_20_ga_inclusion_proofs"][0])
    try: verify_563_and_20_proofs(d3); raise RuntimeError("NEG-3 failed to reject duplicate index")
    except AssertionError: pass

    # 4. Identity substitution (wrong canonical_model_id on proof card) MUST fail
    d4 = copy.deepcopy(leaves_doc); d4["sample_20_ga_inclusion_proofs"][0]["canonical_model_id"] = "spoofed/model-id"
    try: verify_563_and_20_proofs(d4); raise RuntimeError("NEG-4 failed to reject spoofed model_id")
    except AssertionError: pass

    # 5. Tampered input_usd_1m in preimage MUST fail
    d5 = copy.deepcopy(leaves_doc); d5["sample_20_ga_inclusion_proofs"][0]["input_usd_1m"] = 999.99
    try: verify_563_and_20_proofs(d5); raise RuntimeError("NEG-5 failed to reject tampered price")
    except AssertionError: pass

    # 6. Wrong target root MUST fail
    d6 = copy.deepcopy(leaves_doc); d6["sample_20_ga_inclusion_proofs"][0]["target_563_unique_leaves_merkle_root_sha256"] = "0" * 64
    try: verify_563_and_20_proofs(d6); raise RuntimeError("NEG-6 failed to reject wrong root")
    except AssertionError: pass

    return True

if __name__ == "__main__":
    req1 = urllib.request.Request("https://www.etuki.com/api/oracle/leaves-563.json", headers={"User-Agent": "Etuki-12Field-Verifier/2.0"})
    req2 = urllib.request.Request("https://www.etuki.com/api/oracle/merkle-20-ga-inclusion-proofs.json", headers={"User-Agent": "Etuki-12Field-Verifier/2.0"})
    with urllib.request.urlopen(req1, timeout=15) as r1, urllib.request.urlopen(req2, timeout=15) as r2:
        l_doc = json.loads(r1.read().decode("utf-8"))
        p_doc = json.loads(r2.read().decode("utf-8"))
        verify_563_and_20_proofs(l_doc, p_doc)
        run_negative_tamper_self_tests(l_doc)
        print("[PASS] All 563 12-field preimages, 20/20 bound GA proofs, cross-endpoint hash parity, and 6/6 negative tamper assertions verified 100%!")
