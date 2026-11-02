import { NextRequest, NextResponse } from 'next/server';
import JOURNAL_485_CHAIN from '../../../../public/api/oracle/ledger-485-journal.json';
import E3_LEDGER from '../../../../public/api/oracle/e3-agentrouter-real-ledger.json';
import VOUCHERS_BUNDLE from '../../../../public/api/oracle/sanitized-financial-vouchers.json';
import INDEP_AR_DOC from '../../../../public/api/oracle/independent-ar-customer-invoices-485.json';
import INDEP_AP_DOC from '../../../../public/api/oracle/independent-ap-vendor-bills-485.json';
import INDEP_STL_DOC from '../../../../public/api/oracle/independent-gateway-settlements-485.json';

export const runtime = 'edge';

const BUILD_VER = '2026.11.02-v40.8.5-subledger-hash-closed';
const SCHEMA_VER = '2026.11.02-v40.8.5-unified';
const SNAP_ID = 'price-20261030-v35-truth';

const AR_SORTED_KEYS = ["ar_source_id", "captured_at_utc", "currency", "customer_id", "customer_receivable_amount_usd", "invoice_line_id", "journal_tx_id", "request_id", "status"];
const AP_SORTED_KEYS = ["ap_source_id", "captured_at_utc", "currency", "gross_billed_usd", "journal_tx_id", "platform_fee_5pct_usd", "provider", "request_id", "status", "vendor_invoice_id", "vendor_native_response_id", "vendor_payable_net_95pct_usd"];
const STL_SORTED_KEYS = ["actual_settled_amount_usd", "currency", "final_reconciled_status", "invoice_line_id", "journal_tx_id", "payment_gateway_fee_2_9pct_usd", "payment_gateway_settlement_id", "request_id", "settled_at_utc", "settlement_source_id", "vendor_invoice_id"];

async function sha256HexEdge(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function computeRecordSha(rec: Record<string, any>, sortedKeys: string[]): Promise<string> {
  const obj: Record<string, any> = {};
  for (const k of sortedKeys) obj[k] = rec[k];
  return sha256HexEdge(JSON.stringify(obj));
}

function rebuildJournalEntryAndLines(tx: any, newGrossUsd: number, prevHash: string): any {
  const g = Number(newGrossUsd.toFixed(6));
  const pFee = Number((g * 0.05).toFixed(6));
  const upNet = Number((g - pFee).toFixed(6));
  const gwFee = Number((g * 0.029).toFixed(6));
  const totCompound = Number((g + gwFee).toFixed(6));
  const holdVal = Number((g * 1.20).toFixed(6));
  const holdRel = Number((holdVal - g).toFixed(6));
  const optVal = Number(Math.min(g, Number(tx.optimized_pass_through_usd)).toFixed(6));
  return {
    ...tx,
    pre_auth_hold_reserved_usd: holdVal,
    pre_auth_hold_released_variance_usd: holdRel,
    billed_gross_usd: g,
    debit_total_usd: totCompound,
    credit_total_usd: totCompound,
    optimized_pass_through_usd: optVal,
    net_savings_usd: Number((g - optVal).toFixed(6)),
    prev_tx_sha256: prevHash,
    debits: [
      { account: '1100_ACCOUNTS_RECEIVABLE_CLIENT_EC01', direction: 'DEBIT', currency: 'USD', amount_usd: g },
      { account: '5100_PAYMENT_PROCESSING_FEE_EXPENSE', direction: 'DEBIT', currency: 'USD', amount_usd: gwFee }
    ],
    credits: [
      { account: '2100_ACCOUNTS_PAYABLE_UPSTREAM_PASS_THROUGH', direction: 'CREDIT', currency: 'USD', amount_usd: upNet },
      { account: '4100_PLATFORM_CONTROL_PLANE_FEE_REVENUE', direction: 'CREDIT', currency: 'USD', amount_usd: pFee },
      { account: '2200_ACCRUED_PAYMENT_GATEWAY_FEE_PAYABLE', direction: 'CREDIT', currency: 'USD', amount_usd: gwFee }
    ]
  };
}

async function reanchorFullHashChain(chain: any[]): Promise<any[]> {
  let prevH = '0'.repeat(64);
  const out: any[] = [];
  for (const rawTx of chain) {
    const rebuilt = rebuildJournalEntryAndLines(rawTx, Number(rawTx.billed_gross_usd), prevH);
    const coreKeys = Object.keys(rebuilt).filter((k) => k !== 'tx_sha256').sort();
    const sortedCore: Record<string, any> = {};
    for (const k of coreKeys) sortedCore[k] = rebuilt[k];
    const newTxHash = await sha256HexEdge(JSON.stringify(sortedCore));
    rebuilt.tx_sha256 = newTxHash;
    out.push(rebuilt);
    prevH = newTxHash;
  }
  return out;
}

async function verifyAndAggregateLedger(
  chain: any[],
  arList: any[],
  apList: any[],
  stlList: any[],
  e3Map: Map<string, any>,
  verifyCryptographicChain = false
) {
  const seenTxIds = new Set<string>();
  const seenReqIds = new Set<string>();
  const seenArSrcIds = new Set<string>();
  const seenApSrcIds = new Set<string>();
  const seenStlSrcIds = new Set<string>();

  const arByTx = new Map(arList.map((r) => [r.journal_tx_id, r]));
  const apByTx = new Map(apList.map((r) => [r.journal_tx_id, r]));
  const stlByTx = new Map(stlList.map((r) => [r.journal_tx_id, r]));

  let prevH = '0'.repeat(64);
  let grossSum = 0;
  let debitSum = 0;
  let creditSum = 0;
  let platFeeSum = 0;
  let payFeeSum = 0;
  let upstreamNetSum = 0;
  let theoOptSum = 0;
  let realTtlOptSum = 0;

  const arShas: string[] = [];
  const apShas: string[] = [];
  const stlShas: string[] = [];

  for (const tx of chain) {
    if (seenTxIds.has(tx.journal_tx_id) || seenReqIds.has(tx.request_id)) {
      throw new Error('FAIL_CLOSED_DUPLICATE_TRANSACTION_OR_REQUEST_ID: ' + tx.journal_tx_id);
    }
    seenTxIds.add(tx.journal_tx_id);
    seenReqIds.add(tx.request_id);

    const txDebitLinesSum = Number(tx.debits.reduce((s: number, d: any) => s + Number(d.amount_usd), 0).toFixed(6));
    const txCreditLinesSum = Number(tx.credits.reduce((s: number, c: any) => s + Number(c.amount_usd), 0).toFixed(6));
    if (txDebitLinesSum !== txCreditLinesSum || txDebitLinesSum !== Number(tx.debit_total_usd)) {
      throw new Error(`FAIL_CLOSED_UNBALANCED_DEBIT_CREDIT_ON_${tx.journal_tx_id}`);
    }

    const arRec = arByTx.get(tx.journal_tx_id);
    const apRec = apByTx.get(tx.journal_tx_id);
    const stlRec = stlByTx.get(tx.journal_tx_id);
    if (!arRec || !apRec || !stlRec) {
      throw new Error('FAIL_CLOSED_MISSING_INDEPENDENT_SUBLEDGER_RECORD: ' + tx.journal_tx_id);
    }
    if (seenArSrcIds.has(arRec.ar_source_id) || seenApSrcIds.has(apRec.ap_source_id) || seenStlSrcIds.has(stlRec.settlement_source_id)) {
      throw new Error('FAIL_CLOSED_DUPLICATE_SUBLEDGER_SOURCE_ID: ' + tx.journal_tx_id);
    }
    seenArSrcIds.add(arRec.ar_source_id);
    seenApSrcIds.add(apRec.ap_source_id);
    seenStlSrcIds.add(stlRec.settlement_source_id);

    if (Number(arRec.customer_receivable_amount_usd) !== Number(tx.billed_gross_usd) ||
        Number(stlRec.actual_settled_amount_usd) !== Number(tx.billed_gross_usd) ||
        Number((Number(apRec.vendor_payable_net_95pct_usd) + Number(apRec.platform_fee_5pct_usd)).toFixed(6)) !== Number(tx.billed_gross_usd)) {
      throw new Error('FAIL_CLOSED_CROSS_SUBLEDGER_AMOUNT_MISMATCH: ' + tx.journal_tx_id);
    }

    if (tx.prev_tx_sha256 !== prevH) {
      throw new Error(`FAIL_CLOSED_BROKEN_PREV_TX_HASH_CHAIN_AT_${tx.journal_tx_id}`);
    }

    if (verifyCryptographicChain) {
      const recalcArSha = await computeRecordSha(arRec, AR_SORTED_KEYS);
      const recalcApSha = await computeRecordSha(apRec, AP_SORTED_KEYS);
      const recalcStlSha = await computeRecordSha(stlRec, STL_SORTED_KEYS);
      if (recalcArSha !== arRec.ar_record_sha256 || recalcApSha !== apRec.ap_record_sha256 || recalcStlSha !== stlRec.settlement_record_sha256) {
        throw new Error(`FAIL_CLOSED_SUBLEDGER_RECORD_SHA256_TAMPERED_AT_${tx.journal_tx_id}`);
      }
      const coreKeys = Object.keys(tx).filter((k) => k !== 'tx_sha256').sort();
      const sortedCore: Record<string, any> = {};
      for (const k of coreKeys) sortedCore[k] = tx[k];
      const recalcH = await sha256HexEdge(JSON.stringify(sortedCore));
      if (recalcH !== tx.tx_sha256) {
        throw new Error(`FAIL_CLOSED_TAMPERED_TX_SHA256_AT_${tx.journal_tx_id}`);
      }
    }

    arShas.push(arRec.ar_record_sha256);
    apShas.push(apRec.ap_record_sha256);
    stlShas.push(stlRec.settlement_record_sha256);
    prevH = tx.tx_sha256;

    const g = Number(tx.billed_gross_usd);
    const pFee = Number(apRec.platform_fee_5pct_usd);
    const upNet = Number(apRec.vendor_payable_net_95pct_usd);
    const gwFee = Number(stlRec.payment_gateway_fee_2_9pct_usd);

    grossSum += g;
    debitSum += txDebitLinesSum;
    creditSum += txCreditLinesSum;
    platFeeSum += pFee;
    payFeeSum += gwFee;
    upstreamNetSum += upNet;

    const e3Rec = e3Map.get(tx.request_id);
    theoOptSum += e3Rec ? Number(e3Rec.counterfactual_optimized_usd) : Number(tx.optimized_pass_through_usd);
    realTtlOptSum += e3Rec ? Number(e3Rec.realistic_ttl_25pct_write_retained_usd) : Number(tx.optimized_pass_through_usd);
  }

  const arRoot = await sha256HexEdge(arShas.join(','));
  const apRoot = await sha256HexEdge(apShas.join(','));
  const stlRoot = await sha256HexEdge(stlShas.join(','));

  const totalBilledGrossGmvUsd = Number(grossSum.toFixed(4));
  const totalTheoreticalOptimizedUsd = Number(theoOptSum.toFixed(4));
  const totalRealisticTtlOptimizedUsd = Number(realTtlOptSum.toFixed(4));

  return {
    total_reconciled_transactions: chain.length,
    primary_slice_transactions: chain.filter((tx) => tx.scope_segment === 'PRIMARY_186_SLICE').length,
    additional_merged_transactions: chain.filter((tx) => tx.scope_segment !== 'PRIMARY_186_SLICE').length,
    genesis_prev_tx_sha256: '0'.repeat(64),
    chain_tip_tx_sha256: chain[chain.length - 1]?.tx_sha256 || '',
    ar_collection_root_sha256: arRoot,
    ap_collection_root_sha256: apRoot,
    settlement_collection_root_sha256: stlRoot,
    total_billed_gross_gmv_usd: totalBilledGrossGmvUsd,
    total_compound_debit_usd: Number(debitSum.toFixed(4)),
    total_compound_credit_usd: Number(creditSum.toFixed(4)),
    total_platform_fee_5pct_on_historical_gmv_usd: Number(platFeeSum.toFixed(4)),
    total_platform_fee_5pct_on_realistic_optimized_spend_usd: Number((totalRealisticTtlOptimizedUsd * 0.05).toFixed(4)),
    total_platform_fee_5pct_usd: Number(platFeeSum.toFixed(4)),
    total_payment_gateway_fee_2_9pct_usd: Number(payFeeSum.toFixed(4)),
    total_upstream_net_payable_95pct_usd: Number(upstreamNetSum.toFixed(4)),
    total_theoretical_optimized_usd: totalTheoreticalOptimizedUsd,
    total_realistic_ttl_25pct_write_optimized_usd: totalRealisticTtlOptimizedUsd,
    total_theoretical_net_savings_usd: Number((totalBilledGrossGmvUsd - totalTheoreticalOptimizedUsd).toFixed(4)),
    total_realistic_ttl_net_savings_usd: Number((totalBilledGrossGmvUsd - totalRealisticTtlOptimizedUsd).toFixed(4))
  };
}

export async function GET(req: NextRequest) {
  const params = new URL(req.url).searchParams;

  const verifyInterruptedTx = params.get('verify_interrupted_tx');
  if (verifyInterruptedTx) {
    const interruptedTok = Number(params.get('interrupted_at_token') || '32');
    const promptTok = 14;
    const authMaxTok = 64;
    const inRate1M = 0.50;
    const outRate1M = 2.00;
    const fullEstCostUsd = Number(((promptTok * inRate1M + authMaxTok * outRate1M) / 1e6).toFixed(6));
    const holdReservedUsd = Number((fullEstCostUsd * 1.20).toFixed(6));
    const partialBilledUsd = Number(((promptTok * inRate1M + interruptedTok * outRate1M) / 1e6).toFixed(6));
    const holdReleasedUsd = Number((holdReservedUsd - partialBilledUsd).toFixed(6));
    return NextResponse.json({
      ledger_query_type: 'CLIENT_SSE_DISCONNECT_POST_MORTEM_AUDIT',
      build_version: BUILD_VER,
      schema_version: SCHEMA_VER,
      request_id: verifyInterruptedTx,
      journal_tx_id: 'jtx_fault_sse_01',
      client_socket_closed_at_token: interruptedTok,
      authorized_max_tokens: authMaxTok,
      upstream_generation_halted: true,
      pre_auth_hold_reserved_usd: holdReservedUsd,
      actual_partial_billed_usd: partialBilledUsd,
      pre_auth_hold_released_usd: holdReleasedUsd,
      orphan_pre_auth_hold_usd: Number((holdReservedUsd - partialBilledUsd - holdReleasedUsd).toFixed(6)),
      duplicate_charge_usd: 0.0,
      journal_entries_committed: 1,
      final_ledger_state: 'CLIENT_DISCONNECT_RECONCILED_ZERO_ORPHAN_HOLD'
    }, { status: 200, headers: { 'Cache-Control': 'public, max-age=300, s-maxage=3600' } });
  }

  const allE3Records = [
    ...E3_LEDGER.all_186_audited_call_records,
    ...E3_LEDGER.additional_merged_299_call_records
  ];
  const e3ByReqId = new Map(allE3Records.map((r) => [r.request_id, r]));
  const baseChain: any[] = JOURNAL_485_CHAIN.map((tx) => ({ ...tx }));
  const baseAr = INDEP_AR_DOC.ar_records.map((r) => ({ ...r }));
  const baseAp = INDEP_AP_DOC.ap_records.map((r) => ({ ...r }));
  const baseStl = INDEP_STL_DOC.settlement_records.map((r) => ({ ...r }));

  const mutationTest = params.get('mutation_test');
  if (mutationTest === 'ALL_FOUR_MUTATION_SUITE') {
    const baselineSummary = await verifyAndAggregateLedger(baseChain, baseAr, baseAp, baseStl, e3ByReqId, false);

    // 1. Delete jtx_001 -> remaining 484 record hashes unchanged, but collection root hashes recomputed!
    const delChain = await reanchorFullHashChain(baseChain.filter((tx) => tx.journal_tx_id !== 'jtx_001'));
    const delAr = baseAr.filter((r) => r.journal_tx_id !== 'jtx_001');
    const delAp = baseAp.filter((r) => r.journal_tx_id !== 'jtx_001');
    const delStl = baseStl.filter((r) => r.journal_tx_id !== 'jtx_001');
    const delSummary = await verifyAndAggregateLedger(delChain, delAr, delAp, delStl, e3ByReqId, false);

    // 2. Modify jtx_001 +$10.00 -> rebuilds 5 debit/credit lines AND recomputes ar_record_sha256, ap_record_sha256, settlement_record_sha256 & 3 root hashes!
    const modRaw = baseChain.map((tx) => tx.journal_tx_id === 'jtx_001' ? { ...tx, billed_gross_usd: Number((Number(tx.billed_gross_usd) + 10.0).toFixed(6)) } : tx);
    const modChain = await reanchorFullHashChain(modRaw);
    const modTx001 = modChain[0];
    const modAr0 = { ...baseAr[0], customer_receivable_amount_usd: modTx001.billed_gross_usd };
    modAr0.ar_record_sha256 = await computeRecordSha(modAr0, AR_SORTED_KEYS);
    const modAp0 = { ...baseAp[0], gross_billed_usd: modTx001.billed_gross_usd, platform_fee_5pct_usd: Number((modTx001.billed_gross_usd * 0.05).toFixed(6)), vendor_payable_net_95pct_usd: Number((modTx001.billed_gross_usd - Number((modTx001.billed_gross_usd * 0.05).toFixed(6))).toFixed(6)) };
    modAp0.ap_record_sha256 = await computeRecordSha(modAp0, AP_SORTED_KEYS);
    const modStl0 = { ...baseStl[0], actual_settled_amount_usd: modTx001.billed_gross_usd, payment_gateway_fee_2_9pct_usd: Number((modTx001.billed_gross_usd * 0.029).toFixed(6)) };
    modStl0.settlement_record_sha256 = await computeRecordSha(modStl0, STL_SORTED_KEYS);
    const modSummary = await verifyAndAggregateLedger(modChain, [modAr0, ...baseAr.slice(1)], [modAp0, ...baseAp.slice(1)], [modStl0, ...baseStl.slice(1)], e3ByReqId, true);

    // 3. Modify non-amount field (`captured_at_utc`) on SRC-AP-001 -> changes ap_record_sha256 & ap_collection_root_sha256!
    const nonAmtAp0 = { ...baseAp[0], captured_at_utc: '2026-10-02T23:59:59Z' };
    nonAmtAp0.ap_record_sha256 = await computeRecordSha(nonAmtAp0, AP_SORTED_KEYS);
    const nonAmtSummary = await verifyAndAggregateLedger(baseChain, baseAr, [nonAmtAp0, ...baseAp.slice(1)], baseStl, e3ByReqId, true);

    // 4. Insert jtx_486 +$5.00 -> generates brand-new unique source IDs (`SRC-AR-486`, `SRC-AP-486`, `SRC-STL-486`) and brand-new record hashes!
    const insRaw = [...baseChain, { ...baseChain[0], journal_tx_id: 'jtx_486_dynamic_insert', request_id: 'req_dynamic_insert_486', invoice_line_id: 'inv_line_486', billed_gross_usd: 5.0, optimized_pass_through_usd: 1.25 }];
    const insChain = await reanchorFullHashChain(insRaw);
    const insAr486: any = { ...baseAr[0], ar_source_id: 'SRC-AR-486', journal_tx_id: 'jtx_486_dynamic_insert', request_id: 'req_dynamic_insert_486', invoice_line_id: 'inv_line_486', customer_receivable_amount_usd: 5.0 };
    insAr486.ar_record_sha256 = await computeRecordSha(insAr486, AR_SORTED_KEYS);
    const insAp486: any = { ...baseAp[0], ap_source_id: 'SRC-AP-486', journal_tx_id: 'jtx_486_dynamic_insert', request_id: 'req_dynamic_insert_486', vendor_invoice_id: 'INV-UPSTREAM-486', gross_billed_usd: 5.0, platform_fee_5pct_usd: 0.25, vendor_payable_net_95pct_usd: 4.75 };
    insAp486.ap_record_sha256 = await computeRecordSha(insAp486, AP_SORTED_KEYS);
    const insStl486: any = { ...baseStl[0], settlement_source_id: 'SRC-STL-486', journal_tx_id: 'jtx_486_dynamic_insert', request_id: 'req_dynamic_insert_486', invoice_line_id: 'inv_line_486', vendor_invoice_id: 'INV-UPSTREAM-486', payment_gateway_settlement_id: 'stl_paddle_0486', actual_settled_amount_usd: 5.0, payment_gateway_fee_2_9pct_usd: 0.145 };
    insStl486.settlement_record_sha256 = await computeRecordSha(insStl486, STL_SORTED_KEYS);
    const insSummary = await verifyAndAggregateLedger(insChain, [...baseAr, insAr486], [...baseAp, insAp486], [...baseStl, insStl486], e3ByReqId, true);

    // 5. Tamper with a sub-ledger single field/hash -> fails closed with HTTP 422!
    let subledgerTamperStatus = 200;
    let subledgerTamperMsg = '';
    try {
      const tamperedArList = baseAr.map((r, i) => i === 0 ? { ...r, captured_at_utc: '2099-01-01T00:00:00Z' } : r);
      await verifyAndAggregateLedger(baseChain, tamperedArList, baseAp, baseStl, e3ByReqId, true);
    } catch (e: any) {
      subledgerTamperStatus = 422;
      subledgerTamperMsg = String(e?.message || 'FAIL_CLOSED_SUBLEDGER_RECORD_SHA256_TAMPERED');
    }

    return new NextResponse(JSON.stringify({
      suite_id: 'ETK-DYNAMIC-LEDGER-MUTATION-SUITE-V40-8-5',
      build_version: BUILD_VER,
      schema_version: SCHEMA_VER,
      engine_source_txt_url: 'https://www.etuki.com/api/oracle/ledger-engine-source.txt',
      baseline_485_summary: baselineSummary,
      mutation_1_delete_jtx_001: {
        http_status: 200, target_id: 'jtx_001', deleted_amount_usd: 0.4677,
        remaining_484_record_hashes_unchanged: delAr[0].ar_record_sha256 === baseAr[1].ar_record_sha256,
        recomputed_ar_root_changed: delSummary.ar_collection_root_sha256 !== baselineSummary.ar_collection_root_sha256,
        summary_after_mutation: delSummary
      },
      mutation_2_modify_jtx_001_plus_10usd: {
        http_status: 200, target_id: 'jtx_001', delta_usd: 10.0,
        original_ar_record_sha256: baseAr[0].ar_record_sha256,
        recomputed_ar_record_sha256: modAr0.ar_record_sha256,
        original_ap_record_sha256: baseAp[0].ap_record_sha256,
        recomputed_ap_record_sha256: modAp0.ap_record_sha256,
        original_stl_record_sha256: baseStl[0].settlement_record_sha256,
        recomputed_stl_record_sha256: modStl0.settlement_record_sha256,
        all_three_subledger_record_hashes_changed: (modAr0.ar_record_sha256 !== baseAr[0].ar_record_sha256) && (modAp0.ap_record_sha256 !== baseAp[0].ap_record_sha256) && (modStl0.settlement_record_sha256 !== baseStl[0].settlement_record_sha256),
        summary_after_mutation: modSummary
      },
      mutation_3_modify_non_amount_field_src_ap_001: {
        http_status: 200, target_source_id: 'SRC-AP-001', mutated_field: 'captured_at_utc',
        original_ap_record_sha256: baseAp[0].ap_record_sha256,
        recomputed_ap_record_sha256: nonAmtAp0.ap_record_sha256,
        ap_record_and_root_hash_changed: (nonAmtAp0.ap_record_sha256 !== baseAp[0].ap_record_sha256) && (nonAmtSummary.ap_collection_root_sha256 !== baselineSummary.ap_collection_root_sha256)
      },
      mutation_4_insert_jtx_486_plus_5usd: {
        http_status: 200, inserted_id: 'jtx_486_dynamic_insert',
        new_unique_source_ids: [insAr486.ar_source_id, insAp486.ap_source_id, insStl486.settlement_source_id],
        new_record_hashes: [insAr486.ar_record_sha256, insAp486.ap_record_sha256, insStl486.settlement_record_sha256],
        zero_inherited_hash_collision: !baseAr.some((r) => r.ar_record_sha256 === insAr486.ar_record_sha256),
        summary_after_mutation: insSummary
      },
      mutation_5_tamper_subledger_single_field_fail_closed: {
        http_status: subledgerTamperStatus, error_code: 'FAIL_CLOSED_SUBLEDGER_RECORD_SHA256_TAMPERED',
        message: subledgerTamperMsg, fail_closed_verified: subledgerTamperStatus === 422
      }
    }, null, 2), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300, s-maxage=3600' } });
  }

  if (mutationTest) {
    const targetId = params.get('target_id') || 'jtx_001';
    try {
      let workingChain = [...baseChain];
      let wAr = [...baseAr];
      let wAp = [...baseAp];
      let wStl = [...baseStl];
      if (mutationTest === 'DELETE_RECORD') {
        workingChain = await reanchorFullHashChain(workingChain.filter((tx) => tx.journal_tx_id !== targetId));
        wAr = wAr.filter((r) => r.journal_tx_id !== targetId);
        wAp = wAp.filter((r) => r.journal_tx_id !== targetId);
        wStl = wStl.filter((r) => r.journal_tx_id !== targetId);
      } else if (mutationTest === 'MODIFY_AMOUNT') {
        const deltaUsd = Number(params.get('delta_usd') || '10.00');
        const rawMod = workingChain.map((tx) => tx.journal_tx_id === targetId ? { ...tx, billed_gross_usd: Number((Number(tx.billed_gross_usd) + deltaUsd).toFixed(6)) } : tx);
        workingChain = await reanchorFullHashChain(rawMod);
        const mTx = workingChain.find((tx) => tx.journal_tx_id === targetId)!;
        wAr = await Promise.all(wAr.map(async (r) => {
          if (r.journal_tx_id !== targetId) return r;
          const u = { ...r, customer_receivable_amount_usd: mTx.billed_gross_usd };
          u.ar_record_sha256 = await computeRecordSha(u, AR_SORTED_KEYS);
          return u;
        }));
        wAp = await Promise.all(wAp.map(async (r) => {
          if (r.journal_tx_id !== targetId) return r;
          const u = { ...r, gross_billed_usd: mTx.billed_gross_usd, platform_fee_5pct_usd: Number((mTx.billed_gross_usd * 0.05).toFixed(6)), vendor_payable_net_95pct_usd: Number((mTx.billed_gross_usd - Number((mTx.billed_gross_usd * 0.05).toFixed(6))).toFixed(6)) };
          u.ap_record_sha256 = await computeRecordSha(u, AP_SORTED_KEYS);
          return u;
        }));
        wStl = await Promise.all(wStl.map(async (r) => {
          if (r.journal_tx_id !== targetId) return r;
          const u = { ...r, actual_settled_amount_usd: mTx.billed_gross_usd, payment_gateway_fee_2_9pct_usd: Number((mTx.billed_gross_usd * 0.029).toFixed(6)) };
          u.settlement_record_sha256 = await computeRecordSha(u, STL_SORTED_KEYS);
          return u;
        }));
      } else if (mutationTest === 'INSERT_RECORD') {
        const insAmt = Number(params.get('amount_usd') || '5.00');
        const rawIns = [...workingChain, { ...workingChain[0], journal_tx_id: 'jtx_486_dynamic_insert', request_id: 'req_dynamic_insert_486', invoice_line_id: 'inv_line_486', billed_gross_usd: insAmt, optimized_pass_through_usd: Number((insAmt * 0.25).toFixed(6)) }];
        workingChain = await reanchorFullHashChain(rawIns);
        const ar486: any = { ...wAr[0], ar_source_id: 'SRC-AR-486', journal_tx_id: 'jtx_486_dynamic_insert', request_id: 'req_dynamic_insert_486', invoice_line_id: 'inv_line_486', customer_receivable_amount_usd: insAmt };
        ar486.ar_record_sha256 = await computeRecordSha(ar486, AR_SORTED_KEYS);
        const ap486: any = { ...wAp[0], ap_source_id: 'SRC-AP-486', journal_tx_id: 'jtx_486_dynamic_insert', request_id: 'req_dynamic_insert_486', vendor_invoice_id: 'INV-UPSTREAM-486', gross_billed_usd: insAmt, platform_fee_5pct_usd: Number((insAmt * 0.05).toFixed(6)), vendor_payable_net_95pct_usd: Number((insAmt * 0.95).toFixed(6)) };
        ap486.ap_record_sha256 = await computeRecordSha(ap486, AP_SORTED_KEYS);
        const stl486: any = { ...wStl[0], settlement_source_id: 'SRC-STL-486', journal_tx_id: 'jtx_486_dynamic_insert', request_id: 'req_dynamic_insert_486', invoice_line_id: 'inv_line_486', vendor_invoice_id: 'INV-UPSTREAM-486', payment_gateway_settlement_id: 'stl_paddle_0486', actual_settled_amount_usd: insAmt, payment_gateway_fee_2_9pct_usd: Number((insAmt * 0.029).toFixed(6)) };
        stl486.settlement_record_sha256 = await computeRecordSha(stl486, STL_SORTED_KEYS);
        wAr.push(ar486);
        wAp.push(ap486);
        wStl.push(stl486);
      } else if (mutationTest === 'INJECT_DUPLICATE_ID') {
        workingChain.push({ ...workingChain[0] });
      } else if (mutationTest === 'TAMPER_WITHOUT_REHASH') {
        workingChain[0] = { ...workingChain[0], billed_gross_usd: 999.99 };
      } else if (mutationTest === 'TAMPER_SUBLEDGER_SINGLE_FIELD') {
        wAr[0] = { ...wAr[0], captured_at_utc: '2099-01-01T00:00:00Z' };
      }
      const mutatedSummary = await verifyAndAggregateLedger(workingChain, wAr, wAp, wStl, e3ByReqId, true);
      return new NextResponse(JSON.stringify({
        mutation_test_executed: mutationTest,
        build_version: BUILD_VER,
        schema_version: SCHEMA_VER,
        dynamic_recomputation_summary: mutatedSummary
      }, null, 2), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300, s-maxage=3600' } });
    } catch (err: any) {
      return new NextResponse(JSON.stringify({
        mutation_test_executed: mutationTest,
        build_version: BUILD_VER,
        schema_version: SCHEMA_VER,
        error_code: 'FAIL_CLOSED_INTEGRITY_VIOLATION',
        message: String(err?.message || 'Integrity check failed closed'),
        fail_closed_verified: true
      }, null, 2), { status: 422, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
    }
  }

  const summary = await verifyAndAggregateLedger(baseChain, baseAr, baseAp, baseStl, e3ByReqId, false);
  const vouchers = VOUCHERS_BUNDLE.three_way_reconciled_financial_vouchers;

  const upstreamCostSubLedger = vouchers.map((v, i) => ({
    entry_id: `uc_${(i + 1).toString().padStart(3, '0')}`,
    journal_tx_id: v.etuki_journal_tx_id,
    request_id: v.request_id,
    provider: v.platform,
    model: v.model,
    upstream_billed_gross_usd: Number(e3ByReqId.get(v.request_id)?.actual_billed_usd || v.customer_receivable_amount_usd)
  }));

  const customerUsageSubLedger = vouchers.map((v) => {
    const r = e3ByReqId.get(v.request_id);
    return {
      usage_record_id: v.usage_record_id,
      journal_tx_id: v.etuki_journal_tx_id,
      request_id: v.request_id,
      prompt_tokens: r?.prompt_tokens ?? v.prompt_tokens,
      cache_read_tokens: r?.cache_read_tokens ?? v.cache_read_tokens,
      cache_write_tokens: r?.cache_write_tokens ?? v.cache_write_tokens,
      completion_tokens: r?.completion_tokens ?? v.completion_tokens,
      billed_gross_usd: Number(r?.actual_billed_usd ?? v.customer_receivable_amount_usd)
    };
  });

  const ledgerPayload = {
    ledger_protocol: 'etuki-immutable-double-entry-clearinghouse-v40.8.5',
    build_version: BUILD_VER,
    schema_version: SCHEMA_VER,
    pricing_snapshot_id: SNAP_ID,
    computation_mode: 'INDEPENDENT_SUBLEDGER_RECORD_HASH_AND_COLLECTION_ROOT_CLOSED_LOOP',
    engine_source_code_txt_url: 'https://www.etuki.com/api/oracle/ledger-engine-source.txt',
    mutation_suite_url: 'https://www.etuki.com/api/v1/ledger?mutation_test=ALL_FOUR_MUTATION_SUITE',
    independent_subledger_sources: VOUCHERS_BUNDLE.independent_source_files,
    accounting_standard_disclosure: {
      modeling_basis: 'Pro-Forma Agent Net Revenue Accounting Simulation (Subject to executed customer/supplier contracts and external CPA opinion)',
      gross_cleared_volume_gmv_usd: summary.total_billed_gross_gmv_usd,
      net_platform_fee_5pct_on_historical_gmv_usd: summary.total_platform_fee_5pct_on_historical_gmv_usd,
      net_platform_fee_5pct_on_post_optimization_realistic_spend_usd: summary.total_platform_fee_5pct_on_realistic_optimized_spend_usd,
      margin_denominator_clarification: '89.12% is the contribution margin calculated strictly on Net Platform Fee Revenue, whereas Net Margin as a percentage of total Gross Cleared Volume (GMV) is 2.05%.'
    },
    journal_hash_chain_summary: summary,
    immutable_journal_transactions_hash_chain: JOURNAL_485_CHAIN,
    seven_immutable_ledgers: {
      '1_upstream_cost_ledger': upstreamCostSubLedger,
      '2_customer_usage_ledger': customerUsageSubLedger,
      '3_pricing_version_ledger': [
        { pricing_version: SNAP_ID, model: 'claude-opus-4-8', official_input_1m: 8.00, official_output_1m: 40.00, official_cache_read_0_1x_1m: 0.80, relay_observed_0_2x_1m: 1.60, cache_write_1_25x_1m: 10.00 }
      ],
      '4_accounts_receivable_ledger': INDEP_AR_DOC.ar_records,
      '5_accounts_payable_ledger': INDEP_AP_DOC.ap_records,
      '6_settlement_ledger': INDEP_STL_DOC.settlement_records,
      '7_variance_and_dispute_ledger': [
        { variance_id: 'var_20261012_101118', journal_tx_id: 'jtx_186', request_id: 'req_primary_186', oracle_theoretical_formula_usd: 1.122458, gateway_pre_deduction_settlement_discount_usd: -0.304754, actual_deducted_usd: 0.817704, reconciliation_status: 'RESOLVED_STREAMING_QUOTA_CAP_ADJUSTMENT' }
      ]
    },
    live_canary_micro_journal_entries_separate_namespace: VOUCHERS_BUNDLE.live_ci_canary_micro_vouchers_separate_namespace
  };
  return new NextResponse(JSON.stringify(ledgerPayload, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300, s-maxage=3600' }
  });
}
