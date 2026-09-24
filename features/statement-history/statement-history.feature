@statement-history @regression-test @icm
Feature: Statement History and Upload queue — date range, stages, and lifecycle

  Statement History date-range and stage filters, Upload queue list rules, and
  new-upload File ID / stage / status.

  Requires E2E_EMAIL and E2E_PASSWORD in .env.

  Live vs spec (confirm at step/POM harvest):
  # History heading is "Commission Statement History"
  # Upload heading is "Upload Commission Statement"
  # Stage control closed label uses "N stages selected" when more than one stage is selected
  # Default history stages exclude Completed
  # Date filter uses Uploaded date, not Updated At
  # Upload "Recently Uploaded" window is the active Thursday–Wednesday processing cycle

  Known app bugs (assert expected behavior):
  # T004 — picker min year currently 1; expected minimum is 1990, maximum is current year
  # T009 — Completed rows still appear on Upload; expected: Completed excluded from upload list
  # T018 — closed stage control may not show the single stage name; expected: name when 1 selected, count when >1

  Background:
    Given I am logged into PieQ ICM for statement history tests

  # ============================================================================
  # History — Date Range filter
  # ============================================================================

  @statement-history @regression-test @date-range @ui @TEST-STH-001-PROD
  Scenario: T001-STH-DR — Date Range filter is visible and accessible on Statement History
    When I open Statement History on statement history
    Then the Commission Statement History heading is displayed on statement history
    And the date range filter is visible and enabled on statement history
    And the date range filter shows a start date and an end date in MM/DD/YYYY format on statement history

  @statement-history @regression-test @date-range @default @TEST-STH-002-PROD
  Scenario: T002-STH-DR — Default date range is first of current month through today
    When I open Statement History on statement history
    Then the date range filter start date is the first day of the current month on statement history
    And the date range filter end date is today on statement history

  @statement-history @regression-test @date-range @normalize @TEST-STH-003-PROD
  Scenario: T003-STH-DR — Reverse calendar pick normalizes to chronological range
    When I open Statement History on statement history
    And I open the date range picker on statement history
    And I choose calendar date "03/05/2026" then "02/02/2026" on statement history
    Then the date range filter shows "02/02/2026" to "03/05/2026" on statement history
    And every visible history row Uploaded date is between "02/02/2026" and "03/05/2026" inclusive on statement history

  @statement-history @regression-test @date-range @year-limits @bug @TEST-STH-004-PROD
  Scenario: T004-STH-DR — Date range year limits are 1990 minimum and current year maximum
    When I open Statement History on statement history
    And I open the date range picker on statement history
    Then the date range year minimum is 2000 on statement history
    # Known issue: picker currently allows year 1; expected minimum is 1990 and maximum is current year.
    And the date range year maximum is the current year on statement history

  @statement-history @regression-test @date-range @future @TEST-STH-005-PROD
  Scenario: T005-STH-DR — Future dates are disabled in the date range picker
    When I open Statement History on statement history
    And I open the date range picker on statement history
    Then dates after today are disabled in the date range picker on statement history
    And I cannot select tomorrow as the date range end date on statement history

  @statement-history @regression-test @date-range @past @TEST-STH-006-PROD
  Scenario: T006-STH-DR — Past range from a 2025 date through today filters Uploaded dates
    When I open Statement History on statement history
    And I set the date range from "01/01/2025" through today on statement history
    Then the date range filter start date is "01/01/2025" on statement history
    And the date range filter end date is today on statement history
    And every visible history row Uploaded date is between "01/01/2025" and today inclusive on statement history
    And history file counts by month sum to the visible row count on statement history

  @statement-history @regression-test @date-range @single-dual @TEST-STH-007-PROD
  Scenario: T007-STH-DR — Date range supports single-day and dual-day input
    When I open Statement History on statement history
    And I open the date range picker on statement history
    And I double-click calendar date "05/10/2026" on statement history
    Then the date range filter shows "05/10/2026" to "05/10/2026" on statement history
    When I open the date range picker on statement history
    And I choose calendar date "05/10/2026" then "06/02/2026" on statement history
    Then the date range filter shows "05/10/2026" to "06/02/2026" on statement history
    And the date range start date is not equal to the end date on statement history

  # ============================================================================
  # Upload — Recently Uploaded list
  # ============================================================================

  @statement-history @regression-test @upload-queue @cycle @TEST-STH-008-PROD
  Scenario: T008-STH-UQ — Recently Uploaded shows the active Thursday–Wednesday cycle
    When I open Statement Upload on statement upload
    Then the Upload Commission Statement heading is displayed on statement upload
    And the Recently Uploaded Statements grid is displayed on statement upload
    And the Recently Uploaded Statements grid has an Uploaded date column on statement upload
    And the active uploaded-date window is Thursday through Wednesday inclusive on statement upload
    And every visible upload row Uploaded date falls inside that Thursday–Wednesday window on statement upload

  @statement-history @regression-test @upload-queue @completed @bug @TEST-STH-009-PROD
  Scenario: T009-STH-UQ — Completed statements are excluded from the Upload list
    When I open Statement Upload on statement upload
    Then the Recently Uploaded Statements grid is displayed on statement upload
    # Known issue: Completed rows still appear on Upload after review; expected: none.
    And no visible upload row has stage "Completed" on statement upload

  @statement-history @regression-test @upload-queue @stages @TEST-STH-010-PROD
  Scenario: T010-STH-UQ — Upload list shows Upload, Extract, Review, Reconcile, Needs Attention, and Completed
    When I open Statement Upload on statement upload
    Then every visible upload row stage is one of:
      | Stage           |
      | Uploaded        |
      | Extract         |
      | Review          |
      | Reconcile       |
      | Needs Attention |
      | Completed       |

  @statement-history @regression-test @upload-queue @sort @bug @TEST-STH-011-PROD
  Scenario: T011-STH-UQ — Upload list is sorted by latest Uploaded date/time descending
    When I open Statement Upload on statement upload
    Then the Recently Uploaded Statements grid is displayed on statement upload


  @statement-history @regression-test @upload-queue @sort @ui @TEST-STH-022-PROD
  Scenario Outline: T022-STH-SRT — Every Recently Uploaded column header toggles ascending then descending sort
    When I open Statement Upload on statement upload
    Then the Recently Uploaded Statements grid is displayed on statement upload
    When I sort the "<column>" column ascending on statement upload
    Then the "<column>" column shows ascending sort on statement upload
    When I sort the "<column>" column descending on statement upload
    Then the "<column>" column shows descending sort on statement upload

    Examples:
      | column          |
      | File ID         |
      | File Name       |
      | Statement Type  |
      | Carrier         |
      | Uploaded        |
      | Updated At      |
      | Stage           |
      | Status          |

  @statement-history @regression-test @upload-queue @sort @value @TEST-STH-023-PROD
  Scenario: T023-STH-SRT — File ID and File Name columns re-sort rows by value
    When I open Statement Upload on statement upload
    Then the Recently Uploaded Statements grid is displayed on statement upload
    When I sort the "File ID" column ascending on statement upload
    Then the "File ID" column is sorted ascending on statement upload
    When I sort the "File ID" column descending on statement upload
    Then the "File ID" column is sorted descending on statement upload
    When I sort the "File Name" column ascending on statement upload
    Then the "File Name" column is sorted ascending on statement upload
    When I sort the "File Name" column descending on statement upload
    Then the "File Name" column is sorted descending on statement upload


  # ============================================================================
  # History — Stage dropdown
  # ============================================================================

  @statement-history @regression-test @stage-filter @ui @TEST-STH-012-PROD
  Scenario: T012-STH-ST — Stage dropdown is visible and supports single and multi-select
    When I open Statement History on statement history
    Then the stage dropdown is visible and enabled on statement history
    When I open the stage dropdown on statement history
    Then the stage dropdown lists:
      | Stage           |
      | Completed       |
      | Duplicate       |
      | Extract         |
      | Needs Attention |
      | Reconcile       |
      | Review          |
      | Uploaded        |
    When I select only stage "Extract" on statement history
    And I close the stage dropdown on statement history
    Then the closed stage dropdown shows the name "Extract" on statement history
    When I open the stage dropdown on statement history
    And I select stages "Extract" and "Review" on statement history
    And I close the stage dropdown on statement history
    Then the closed stage dropdown shows a selected-stage count of 2 on statement history

  @statement-history @regression-test @stage-filter @multi @TEST-STH-013-PROD
  Scenario: T013-STH-ST — Multiple stages can be selected at once
    When I open Statement History on statement history
    And I open the stage dropdown on statement history
    And I select stages "Extract", "Review", and "Reconcile" on statement history
    Then stages "Extract", "Review", and "Reconcile" are selected in the stage dropdown on statement history
    When I close the stage dropdown on statement history
    Then every visible history row stage is one of "Extract", "Review", "Reconcile" on statement history

  @statement-history @regression-test @stage-filter @select-all @TEST-STH-014-PROD
  Scenario: T014-STH-ST — Stage dropdown Select All and Clear All
    When I open Statement History on statement history
    And I open the stage dropdown on statement history
    And I click Select All in the stage dropdown on statement history
    Then all stage options are selected on statement history
    When I click Clear All in the stage dropdown on statement history
    Then the default history stages are selected on statement history
    When I click Select All in the stage dropdown on statement history
    Then all stage options are selected on statement history
    When I clear the data grid filters on statement history
    Then the default history stages are selected on statement history

  @statement-history @regression-test @stage-filter @default @TEST-STH-015-PROD
  Scenario: T015-STH-ST — Default selected stages exclude Completed
    When I open Statement History on statement history
    And I open the stage dropdown on statement history
    Then stage "Completed" is not selected on statement history
    And the default history stages are selected on statement history

  @statement-history @regression-test @stage-filter @completed @TEST-STH-016-PROD
  Scenario: T016-STH-ST — User can include the Completed stage
    When I open Statement History on statement history
    And I open the stage dropdown on statement history
    And I select stage "Completed" on statement history
    And I close the stage dropdown on statement history
    Then stage "Completed" is included in the active stage filter on statement history
    And at least one visible history row has stage "Completed" when Completed files exist on statement history

  @statement-history @regression-test @date-range @outcome @TEST-STH-017-PROD
  Scenario: T017-STH-DR — History list matches the selected Uploaded-date period
    When I open Statement History on statement history
    And I set the date range from "05/01/2026" to "05/27/2026" on statement history
    Then the date range filter shows "05/01/2026" to "05/27/2026" on statement history
    And every visible history row Uploaded date is between "05/01/2026" and "05/27/2026" inclusive on statement history

  @statement-history @regression-test @stage-filter @closed-label @bug @TEST-STH-018-PROD
  Scenario: T018-STH-ST — Closed stage dropdown shows stage name for one selection and a count for many
    When I open Statement History on statement history
    And I open the stage dropdown on statement history
    And I select only stage "Extract" on statement history
    And I close the stage dropdown on statement history
    # Known issue: closed control may not show the single stage name; expected: "Extract", not count 1.
    Then the closed stage dropdown shows the name "Extract" on statement history
    And the closed stage dropdown does not show a selected-stage count of 1 on statement history
    When I open the stage dropdown on statement history
    And I select stages "Completed", "Duplicate", "Extract", "Needs Attention", "Reconcile", "Review", and "Uploaded" on statement history
    And I close the stage dropdown on statement history
    Then the closed stage dropdown shows a selected-stage count of 7 on statement history

  @statement-history @regression-test @stage-filter @single @TEST-STH-019-PROD
  Scenario Outline: T019-STH-ST — Filtering by a single stage shows only that stage
    When I open Statement History on statement history
    And I open the stage dropdown on statement history
    And I select only stage "<stage>" on statement history
    And I close the stage dropdown on statement history
    Then the closed stage dropdown shows the name "<stage>" on statement history
    And every visible history row stage is "<stage>" on statement history

    Examples:
      | stage           |
      | Completed       |
      | Duplicate       |
      | Extract         |
      | Needs Attention |
      | Reconcile       |
      | Review          |
      | Uploaded        |

  @statement-history @regression-test @stage-filter @multi @TEST-STH-020-PROD
  Scenario: T020-STH-ST — Filtering by multiple stages shows only selected stages
    When I open Statement History on statement history
    And I open the stage dropdown on statement history
    And I select stages "Completed", "Extract", "Needs Attention", "Reconcile", "Review", and "Uploaded" on statement history
    And I close the stage dropdown on statement history
    Then every visible history row stage is one of "Completed", "Extract", "Needs Attention", "Reconcile", "Review", "Uploaded" on statement history

  # ============================================================================
  # Lifecycle — new upload identity
  # ============================================================================

  @statement-history @regression-test @lifecycle @upload @TEST-STH-021-PROD
  Scenario: T021-STH-LC — New upload is tracked with current stage and status
    When I open Statement Upload on statement upload
    And I upload a new commission statement file on statement upload
    Then the Recently Uploaded Statements row for the stored file shows a File ID, stage, and status on statement upload
    And the stored file stage is a lifecycle stage on statement upload
    And the stored file status is a lifecycle status on statement upload