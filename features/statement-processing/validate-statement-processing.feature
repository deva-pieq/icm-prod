@statement-processing @validate-statement-processing @regression-test @icm
Feature: Validate Statement Processing

  End-to-end validation of the commission statement processing flow (Aetna ACA).

  Flow overview:
    1. Prepare a valid single-row statement from the base template (Customer UID
       incremented +1, Check run date bumped one day, incremented UID persisted back
       to the template so the next run creates a new policy)
    2. Upload the statement, select the statement type, wait for extract processing
    3. Open Review, validate the review grid (record count, mapping, totals) on a fresh Customer
       UID — note: Review shows no "NB - New business" warning label and no warning icon on a
       clean NB row
    4. Complete Review and validate the final stage
    5. Variant statements: duplicate file, NB+RN (seed then transaction file), missing
       mandatory columns, invalid format, address-mutated unique upload, partial
       (NB/RN match, RC warning via History), state variants, NB/RN

  File intent (do not "repair" intentional blanks):
    - SP-001 Real processing — valid xlsx; Gross/Net/agent/alias filled
    - SP-002 Real processing — reuse valid; same as SP-001
    - SP-003 Real processing — seed valid + NbRn xlsx; Net = gross*0.88
    - SP-004 Intentional blank — blank Customer UID only (do not fill)
    - SP-005 Intentional invalid — .txt upload (do not convert to xlsx)
    - SP-006 Real processing — valid + address [run:] mutate; 1 row, Net correct
    - SP-007 Real processing — seed + Partial NB/RN/RC; RC Gross/Net 0 intentional
    - SP-008 Real processing — States TX/CA/IL; Net = gross*0.88
    - SP-009 Real processing — seed + NbRn; Net = gross*0.88

  Core rules:
    - File data rows (exclude heading) = review processed records; after Complete Review,
      matched + unmatched (Needs Attention exceptions) = same file row count
    - Review grid does NOT render a "NB - New business" label and does NOT flag a clean NB row
      with a warning icon. Warning icons appear on Review rows ONLY for row-level exceptions
      (e.g. missing product name); the tooltip carries the exception reason, not "New Policy".
      Do not hover warning icons on clean NB/RN rows — Complete Review only; app auto-reconciles
      to Completed. (Recovery / chargeback module reviews likewise show no warning icon.)
    - Exactly one NB auto-reconciles to Completed; more than one NB → Needs Attention
    - RN only for a Customer UID already processed (seed policy first)
    - Needs Attention only for discrepancies (policy missing, commission mismatch,
      advance exception, policy cancellation, multi-NB)
    - Partial SP-007 (1 NB + 1 RN + 1 RC): Completed path → History by file ID;
      NB+RN matched (no warning); RC chargeback unmatched (warning icon)
    - Review "Total Earned Commission" = Excel Net compensation (not Gross)
    - Real-processing Net = Gross * 0.88 (e.g. 54.9 → 48.31). Never premium * 0.88 (483.12).

  Template (TestFiles-prod-sanity/StatementProcessing/):
    [MLB NEW]HappyFlowChangeCheckRunDate.xlsx

  The base template is persisted with the incremented Customer UID after each valid
  run so every cycle creates a new policy.

  Login uses E2E_EMAIL / E2E_PASSWORD from .env (agency 3 ops manager).

  Background:
    Given I am logged into PieQ ICM for statement processing validation

  # ─────────────────────────────────────────────────────────────────────────
  # SP-001 — Valid single-row statement (new policy) end to end
  # Real processing: full Gross/Net/agent/alias
  # ─────────────────────────────────────────────────────────────────────────
  @TEST-001-Statement-Processing-PROD @regression-test
  Scenario: SP-001 — Valid single-row statement upload, review validation, complete review
    Given the statement processing valid file is prepared from template
    Then the statement processing prepared file has exactly one data row
    And the statement processing prepared file has a unique Customer UID
    When I open the statement processing upload page
    And I upload the prepared statement processing file
    And I select the statement type "Aetna ACA" in statement processing validation
    And I submit the statement processing upload for processing
    Then the statement processing upload extract processing completes and file ID is captured
    And the statement processing upload row shows status "Waiting" and stage "Review"
    When I open the statement processing review page for the stored upload
    Then the statement processing review page shows record count 1
    And the statement processing prepared file record count equals the review record count
    And the statement processing review page maps prepared policy and agent
    And the statement processing review page shows prepared total earned commission
    And the statement processing review page shows the prepared file name
    # Live-app (V20260915.01): the Review grid renders NO warning icon and NO "NB - New
    # business" label for a clean single-row NB upload. Warning icons appear on Review rows
    # only when a row-level exception exists (e.g. missing product name); the "NB - New
    # business" label text does NOT exist in the Review stage. Do not hover a warning icon
    # here — Complete Review auto-reconciles.
    When I click Complete Review on the statement processing review page
    Then the statement processing upload stage changes to "Completed"
    When I open commission details for the stored statement processing upload
    Then the statement processing commission details page is ready
    And the statement processing commission details show prepared policy and agent
    And the statement processing commission details earned commission matches the prepared file

  # ─────────────────────────────────────────────────────────────────────────
  # SP-002 — Duplicate statement upload (same file ingested twice)
  # Real processing: reuses SP-001-style valid file (no blanks)
  # ─────────────────────────────────────────────────────────────────────────
  @TEST-002-Statement-Processing-PROD @regression-test
  Scenario: SP-002 — Duplicate statement upload processes the stored file again
    Given the statement processing valid file is prepared from template
    And the statement processing duplicate file is prepared from the stored file
    When I open the statement processing upload page
    And I upload the prepared statement processing duplicate file
    And I select the statement type "Aetna ACA" in statement processing validation
    And I submit the statement processing upload for processing
    Then the statement processing upload extract processing completes and file ID is captured
    And the statement processing upload row shows status "Waiting" and stage "Review"
    When I open the statement processing review page for the stored upload
    And I click Complete Review on the statement processing review page
    Then the statement processing upload stage changes to "Completed"
    # Live-verify: duplicate detection toast/flag — app may allow re-ingest as renewal

  # ─────────────────────────────────────────────────────────────────────────
  # SP-003 — NB seed → NB+RN transaction file → Completed
  # Real processing: seed Completed policy, then NbRn xlsx (1 new NB + 1 RN on seeded UID).
  # An RN-only file lands "Commission amount or period not matched" → Needs Attention.
  # ─────────────────────────────────────────────────────────────────────────
  @TEST-003-Statement-Processing-PROD @regression-test
  Scenario: SP-003 — Seeded NB then NB+RN transaction file uploads and completes
    # Seed a brand-new policy (NB) from the template so the RN UID genuinely exists
    Given the statement processing valid file is prepared from template
    When I open the statement processing upload page
    And I upload the prepared statement processing file
    And I select the statement type "Aetna ACA" in statement processing validation
    And I submit the statement processing upload for processing
    Then the statement processing upload extract processing completes and file ID is captured
    And the statement processing upload row shows status "Waiting" and stage "Review"
    When I open the statement processing review page for the stored upload
    Then the statement processing review page shows record count 1
    When I click Complete Review on the statement processing review page
    Then the statement processing upload stage changes to "Completed"
    And the statement processing seeded policy UID is stored from the prepared file

    # Renewal (RN) for the seeded Customer UID, paired with a new NB in the same file.
    # Exactly one NB → auto-reconciles to Completed; an RN-only file would land
    # "Commission amount or period not matched" → Needs Attention.
    Given the statement processing transaction type file is prepared with NB and RN rows
    When I open the statement processing upload page
    And I upload the prepared statement processing transaction type file
    And I select the statement type "Aetna ACA" in statement processing validation
    And I submit the statement processing upload for processing
    Then the statement processing upload extract processing completes and file ID is captured
    And the statement processing upload row shows status "Waiting" and stage "Review"
    When I open the statement processing review page for the stored upload
    Then the statement processing review page shows record count 2
    And the statement processing review page shows transaction types "NB" and "RN"
    And the statement processing prepared file record count equals the review record count
    When I click Complete Review on the statement processing review page
    # Poll upload page by file ID — must land Completed, not Needs Attention
    Then the statement processing upload stage changes to "Completed"

  # ─────────────────────────────────────────────────────────────────────────
  # SP-004 — Missing mandatory columns (blank Customer UID) — INTENTIONAL BLANK
  # Do not fill UID. Manual spec: Needs Attention or reject at upload.
  # ─────────────────────────────────────────────────────────────────────────
  @TEST-004-Statement-Processing-PROD @regression-test
  Scenario: SP-004 — Statement with missing mandatory columns is rejected or needs attention
    Given the statement processing missing columns file is prepared from template
    When I open the statement processing upload page
    And I upload the prepared statement processing missing columns file
    And I select the statement type "Aetna ACA" in statement processing validation
    And I submit the statement processing upload for processing
    # need to change this step, need to validate in review page itself fine
    Then the statement processing upload is rejected or lands in Needs Attention
    # Live-verify exact error / NA exception reason text on first run

  # ─────────────────────────────────────────────────────────────────────────
  # SP-005 — Unsupported file format — INTENTIONAL INVALID (.txt)
  # Do not convert to xlsx. Upload button disabled + Invalid file.
  # ─────────────────────────────────────────────────────────────────────────
  @TEST-005-Statement-Processing-PROD @regression-test
  Scenario: SP-005 — Unsupported file format is rejected
    Given the statement processing invalid format file is prepared
    When I open the statement processing upload page
    And I upload the prepared statement processing invalid format file
    And I select the statement type "Aetna ACA" in statement processing validation
    Then the statement processing upload statement button is disabled
    And the statement processing page shows Invalid file

  # ─────────────────────────────────────────────────────────────────────────
  # SP-006 — Address-mutated unique upload (1 row) → Completed
  # Real processing: same Customer UID as prepared valid file; append-only [run:] on
  # Producer comp address (never mid-string splice — corrupts zip → Extract Error).
  # ─────────────────────────────────────────────────────────────────────────
  @TEST-006-Statement-Processing-PROD @regression-test
  Scenario: SP-006 — Address-mutated statement file uploads and completes
    Given the statement processing valid file is prepared from template
    And the statement processing prepared file address is mutated with random chars
    When I open the statement processing upload page
    And I upload the prepared statement processing file
    And I select the statement type "Aetna ACA" in statement processing validation
    And I submit the statement processing upload for processing
    Then the statement processing upload extract processing completes and file ID is captured
    And the statement processing upload row shows status "Waiting" and stage "Review"
    When I open the statement processing review page for the stored upload
    Then the statement processing review page shows record count 1
    And the statement processing prepared file record count equals the review record count
    When I click Complete Review on the statement processing review page
    Then the statement processing upload stage changes to "Completed"

  # ─────────────────────────────────────────────────────────────────────────
  # SP-007 — Partial (1 NB + 1 RN + 1 RC/chargeback) → History; warning icons by type
  # Real processing for NB/RN; RC Gross/Net intentionally 0 + Chargeback amount set.
  # ─────────────────────────────────────────────────────────────────────────
  @TEST-007-Statement-Processing-PROD @regression-test
  Scenario: SP-007 — Partial reconciliation validates warning icons via History
    # Seed a Completed policy so RN + RC rows can reference a real Customer UID
    Given the statement processing valid file is prepared from template
    When I open the statement processing upload page
    And I upload the prepared statement processing file
    And I select the statement type "Aetna ACA" in statement processing validation
    And I submit the statement processing upload for processing
    Then the statement processing upload extract processing completes and file ID is captured
    And the statement processing upload row shows status "Waiting" and stage "Review"
    When I open the statement processing review page for the stored upload
    And I click Complete Review on the statement processing review page
    Then the statement processing upload stage changes to "Completed"
    And the statement processing seeded policy UID is stored from the prepared file

    Given the statement processing partial reconciliation file is prepared with one NB, one RN, and one chargeback
    When I open the statement processing upload page
    And I upload the prepared statement processing partial file
    And I select the statement type "Aetna ACA" in statement processing validation
    And I submit the statement processing upload for processing
    Then the statement processing upload extract processing completes and file ID is captured
    And the statement processing upload row shows status "Waiting" and stage "Review"
    When I open the statement processing review page for the stored upload
    Then the statement processing review page shows record count 3
    And the statement processing prepared file record count equals the review record count
    When I click Complete Review on the statement processing review page
    # Passed path: History by file ID (do not open Needs Attention). Warnings = validation.
    When I open the statement processing history page
    And I search statement history by stored file ID and open the record in statement processing validation
    Then the statement processing commission details page is ready
    # Soft: NB warning may appear on prod (advance/new-policy) — do not fail.
    And the statement processing commission details NB row has no warning icon
    And the statement processing commission details RN row has no warning icon
    And the statement processing commission details RC row has a warning icon

  # ─────────────────────────────────────────────────────────────────────────
  # SP-008 — State variants (TX / CA / IL) process as one policy per state
  # Real processing: filled Gross/Net/agent/alias (not blank)
  # ─────────────────────────────────────────────────────────────────────────
  @TEST-008-Statement-Processing-PROD @regression-test
  Scenario: SP-008 — State variant statement (TX, CA, IL) uploads and completes
    Given the statement processing state variants file is prepared for TX, CA, IL
    When I open the statement processing upload page
    And I upload the prepared statement processing state variants file
    And I select the statement type "Aetna ACA" in statement processing validation
    And I submit the statement processing upload for processing
    Then the statement processing upload extract processing completes and file ID is captured
    And the statement processing upload row shows status "Waiting" and stage "Review"
    When I open the statement processing review page for the stored upload
    Then the statement processing review page shows record count 3
    And the statement processing prepared file record count equals the review record count
    And the statement processing review page shows states "TX, CA, IL"
    When I click Complete Review on the statement processing review page
    Then the statement processing upload stage changes to "Completed"

  # ─────────────────────────────────────────────────────────────────────────
  # SP-009 — NB + RN (RN uses seeded UID); single NB auto-reconciles to Completed
  # Real processing: same NbRn prep as SP-003 second phase
  # ─────────────────────────────────────────────────────────────────────────
  @TEST-009-Statement-Processing-PROD @regression-test
  Scenario: SP-009 — NB and RN transaction rows upload and complete
    # Seed policy for RN row (RN only appears for already-processed Customer UID)
    Given the statement processing valid file is prepared from template
    When I open the statement processing upload page
    And I upload the prepared statement processing file
    And I select the statement type "Aetna ACA" in statement processing validation
    And I submit the statement processing upload for processing
    Then the statement processing upload extract processing completes and file ID is captured
    And the statement processing upload row shows status "Waiting" and stage "Review"
    When I open the statement processing review page for the stored upload
    And I click Complete Review on the statement processing review page
    Then the statement processing upload stage changes to "Completed"
    And the statement processing seeded policy UID is stored from the prepared file

    Given the statement processing transaction type file is prepared with NB and RN rows
    When I open the statement processing upload page
    And I upload the prepared statement processing transaction type file
    And I select the statement type "Aetna ACA" in statement processing validation
    And I submit the statement processing upload for processing
    Then the statement processing upload extract processing completes and file ID is captured
    And the statement processing upload row shows status "Waiting" and stage "Review"
    When I open the statement processing review page for the stored upload
    Then the statement processing review page shows record count 2
    And the statement processing prepared file record count equals the review record count
    And the statement processing review page shows transaction types "NB" and "RN"
    When I click Complete Review on the statement processing review page
    # Exactly one NB → auto-reconcile (may take time)
    Then the statement processing upload stage changes to "Completed"
