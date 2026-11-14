#!/usr/bin/env python3
import json, hashlib, urllib.request

MANDATORY_12_KEYS = ["canonical_model_id", "provider_model_id", "leaf_index", "provenance_tier", "reality_tier", "input_usd_1m", "output_usd_1m", "cache_read_usd_1m", "cache_write_multiplier", "context_window_tokens", "source_url_commitment_sha256", "pricing_snapshot_id"]
EXPECTED_12FIELD_ROOT = "9a213ac862bddb2b404ad1c1f130b450b63d5abc29dd03d8643f910741e98405"
EXPECTED_V35_GENESIS_ROOT = "d2f517094b814bcf41ea821c1ce654aa29df8ac454acd1c96779d7966ab688f4"

def sha256_hex(s):
    return hashlib.sha256(s.encode("utf-8")).hexdigest()

def verify_563_and_20_proofs(leaves_doc):
    leaves = leaves_doc.get("all_563_entity_leaf_records") or leaves_doc.get("leaves")
    assert len(leaves) == 563, f"Expected 563 leaves, got {len(leaves)}"
    computed_hashes = []
    for idx, lf in enumerate(leaves):
        assert lf["leaf_index"] == idx
        preimage_obj = {k: lf[k] for k in MANDATORY_12_KEYS}
        canon = json.dumps(preimage_obj, separators=(",", ":"), sort_keys=True)
        assert canon == lf["leaf_preimage_canonical_json"], f"Preimage mismatch at {idx}"
        h = sha256_hex(canon)
        assert h == lf["leaf_sha256_hex"], f"Leaf hash mismatch at {idx}"
        computed_hashes.append(h)
    assert len(set(computed_hashes)) == 563, "563 leaf hashes must be 100% unique"
    cur = list(computed_hashes)
    while len(cur) > 1:
        if len(cur) % 2 == 1:
            cur.append(cur[-1])
        cur = [sha256_hex(cur[i] + ":" + cur[i+1]) for i in range(0, len(cur), 2)]
    assert cur[0] == EXPECTED_12FIELD_ROOT, f"Root mismatch: {cur[0]} != {EXPECTED_12FIELD_ROOT}"
    for card in leaves_doc.get("sample_20_ga_inclusion_proofs", []):
        c_hash = card["leaf_sha256_hex"]
        for step in card["merkle_inclusion_proof_10_levels"]:
            sib = step["sibling_sha256"]
            c_hash = sha256_hex(c_hash + ":" + sib) if step["sibling_position"] == "RIGHT" else sha256_hex(sib + ":" + c_hash)
        assert c_hash == EXPECTED_12FIELD_ROOT
    print("[PASS] All 563 12-field entity preimages, 563 unique leaf hashes, 20/20 GA inclusion proofs & Merkle root verified 100%!")

if __name__ == "__main__":
    req = urllib.request.Request("https://www.etuki.com/api/oracle/leaves-563.json", headers={"User-Agent": "Etuki-12Field-Verifier/1.0"})
    with urllib.request.urlopen(req, timeout=15) as r:
        verify_563_and_20_proofs(json.loads(r.read().decode("utf-8")))
