@advance-regression @regression-test @icm
Feature: Advance Module Regression — Setup, Overview, and Agent Eligibility

  Regression tests for Advance Setup CRUD, Advance Overview validation,
  ARF detail page sections, and Agent Advance Eligibility toggle.
  Login always uses deva.r@pieq.ai (ignores E2E_EMAIL from .env).

  Background:
    Given I am logged into PieQ ICM for advance regression tests

  # ═══════════════════════════════════════════════════════════════════════
  # ADVANCE SETUP — Add Product
  # ═══════════════════════════════════════════════════════════════════════

  @advance-regression @regression-test @advance-setup @positive @TEST-001-Advance-Setup-PROD
  Scenario: T001-ADV-SP — Verify user can add product in advance setup
    When I navigate to the Advance Setup page on advance setup regression
    And I click Add Advance Setup on advance setup regression
    Then the Add Advance Setup modal is displayed on advance setup regression
    When I select a product in the Add Advance Setup modal on advance setup regression
    And I fill the Default field with value "5" on advance setup regression
    And I click Save in the Add Advance Setup modal on advance setup regression
    Then the advance setup grid shows the saved product on advance setup regression

  # ═══════════════════════════════════════════════════════════════════════
  # ADVANCE SETUP — Field Validations
  # ═══════════════════════════════════════════════════════════════════════

  @advance-regression @regression-test @advance-setup @validation @TEST-002-Advance-Setup-PROD
  Scenario: T002-ADV-SP — Verify integer greater than 0 in Default field
    When I navigate to the Advance Setup page on advance setup regression
    And I click Add Advance Setup on advance setup regression
    And I fill the Default field with value "10" on advance setup regression
    Then the Default field value is "10" on advance setup regression

  @advance-regression @regression-test @advance-setup @validation @TEST-003-Advance-Setup-PROD
  Scenario: T003-ADV-SP — Verify value 0 is not accepted in Default field
    When I navigate to the Advance Setup page on advance setup regression
    And I click Add Advance Setup on advance setup regression
    And I fill the Default field with value "0" on advance setup regression
    And I click Save button only in the Add Advance Setup modal on advance setup regression
    Then the product dropdown shows error text "Please select a product." on advance setup regression
    And the Default field shows error text "Default value must be greater than 0." on advance setup regression
    And no confirmation popup appears on advance setup regression

  @advance-regression @regression-test @advance-setup @validation @TEST-004-Advance-Setup-PROD
  Scenario: T004-ADV-SP — Verify integer greater than 0 in Monthly field
    When I navigate to the Advance Setup page on advance setup regression
    And I click Add Advance Setup on advance setup regression
    And I fill the Monthly field with value "10" on advance setup regression
    Then the Monthly field value is "10" on advance setup regression

  @advance-regression @regression-test @advance-setup @validation @TEST-005-Advance-Setup-PROD
  Scenario: T005-ADV-SP — Verify integer greater than 0 in Quarterly field
    When I navigate to the Advance Setup page on advance setup regression
    And I click Add Advance Setup on advance setup regression
    And I fill the Quarterly field with value "10" on advance setup regression
    Then the Quarterly field value is "10" on advance setup regression

  @advance-regression @regression-test @advance-setup @validation @TEST-006-Advance-Setup-PROD
  Scenario: T006-ADV-SP — Verify integer greater than 0 in Half Yearly field
    When I navigate to the Advance Setup page on advance setup regression
    And I click Add Advance Setup on advance setup regression
    And I fill the Half Yearly field with value "10" on advance setup regression
    Then the Half Yearly field value is "10" on advance setup regression

  @advance-regression @regression-test @advance-setup @validation @TEST-007-Advance-Setup-PROD
  Scenario: T007-ADV-SP — Verify integer greater than 0 in Annual field
    When I navigate to the Advance Setup page on advance setup regression
    And I click Add Advance Setup on advance setup regression
    And I fill the Annual field with value "10" on advance setup regression
    Then the Annual field value is "10" on advance setup regression

  @advance-regression @regression-test @advance-setup @validation @TEST-008-Advance-Setup-PROD
  Scenario: T008-ADV-SP — Verify only integer accepted, not alphabets
    When I navigate to the Advance Setup page on advance setup regression
    And I click Add Advance Setup on advance setup regression
    And I fill the Default field with value "abc" on advance setup regression
    Then the Default field does not contain alphabets on advance setup regression

  # ═══════════════════════════════════════════════════════════════════════
  # ADVANCE SETUP — Save and Cancel
  # ═══════════════════════════════════════════════════════════════════════

  @advance-regression @regression-test @advance-setup @positive @TEST-009-Advance-Setup-PROD
  Scenario: T009-ADV-SP — Verify user can save changes in advance setup
    When I navigate to the Advance Setup page on advance setup regression
    And I click Add Advance Setup on advance setup regression
    And I select a product in the Add Advance Setup modal on advance setup regression
    And I fill the Default field with value "5" on advance setup regression
    And I click Save in the Add Advance Setup modal on advance setup regression
    Then the advance setup modal is closed on advance setup regression

  @advance-regression @regression-test @advance-setup @positive @TEST-010-Advance-Setup-PROD
  Scenario: T010-ADV-SP — Verify user can cancel and discard changes
    When I navigate to the Advance Setup page on advance setup regression
    And I click Add Advance Setup on advance setup regression
    And I fill the Default field with value "99" on advance setup regression
    And I click Cancel in the Add Advance Setup modal on advance setup regression
    Then the advance setup modal is closed on advance setup regression

  # ═══════════════════════════════════════════════════════════════════════
  # ADVANCE SETUP — Edit and Delete
  # ═══════════════════════════════════════════════════════════════════════

  @advance-regression @regression-test @advance-setup @positive @TEST-011-Advance-Setup-PROD
  Scenario: T011-ADV-SP — Verify user can edit records in advance setup
    When I navigate to the Advance Setup page on advance setup regression
    And I click the edit action on the first row in advance setup regression
    Then the Add Advance Setup modal is displayed on advance setup regression
    When I fill the Default field with value "15" on advance setup regression
    And I click Save in the Add Advance Setup modal on advance setup regression
    Then the advance setup modal is closed on advance setup regression

  @advance-regression @regression-test @advance-setup @positive @TEST-012-Advance-Setup-PROD
  Scenario: T012-ADV-SP — Verify user can delete records in advance setup
    When I navigate to the Advance Setup page on advance setup regression
    And I click the delete action on the first row in advance setup regression
    Then the record is deleted from advance setup grid on advance setup regression

  # ═══════════════════════════════════════════════════════════════════════
  # ADVANCE OVERVIEW — Page Title and Amount Cards
  # ═══════════════════════════════════════════════════════════════════════

  @advance-regression @regression-test @advance-overview @positive @TEST-001-Advance-Overview-PROD
  Scenario: T013-ADV-OV — Verify Advance Overview page title
    When I navigate to the Advance Overview page on advance overview regression
    Then the Advance Overview page title is displayed on advance overview regression

  @advance-regression @regression-test @advance-overview @validation @TEST-002-Advance-Overview-PROD
  Scenario: T014-ADV-OV — Verify amount cards and Total Balance calculation
    When I navigate to the Advance Overview page on advance overview regression
    Then the Total Advance Payout card is displayed on advance overview regression
    And the Recovered card is displayed on advance overview regression
    And the Total Balance card is displayed on advance overview regression
    And Total Balance equals Total Advance Payout minus Recovered on advance overview regression

  # ═══════════════════════════════════════════════════════════════════════
  # ADVANCE OVERVIEW — Grid Operations (Active & Historical)
  # ═══════════════════════════════════════════════════════════════════════

  @advance-regression @regression-test @advance-overview @grid-ops @TEST-003-Advance-Overview-PROD
  Scenario Outline: T15-ADV-OV — Verify search on grid in <tab> settlements
    When I navigate to the Advance Overview page on advance overview regression
    And I click the "<tab>" tab on advance overview regression
    And I search the advance overview grid with "AgentX Level" on advance overview regression
    Then the advance overview grid shows filtered results on advance overview regression

    Examples:
      | tab                  |
      | Active Settlements   |
      | Historical Settlements |

  @advance-regression @regression-test @advance-overview @grid-ops @TEST-004-Advance-Overview-PROD
  Scenario Outline: T16-ADV-OV — Verify filter by agent name in <tab> settlements
    When I navigate to the Advance Overview page on advance overview regression
    And I click the "<tab>" tab on advance overview regression
    And I open the agent filter dropdown on advance overview regression
    Then the agent filter dropdown displays agent options on advance overview regression

    Examples:
      | tab                  |
      | Active Settlements   |
      | Historical Settlements |

  @advance-regression @regression-test @advance-overview @grid-ops @TEST-005-Advance-Overview-PROD
  Scenario Outline: T17-ADV-OV — Verify filter by carrier in <tab> settlements
    When I navigate to the Advance Overview page on advance overview regression
    And I click the "<tab>" tab on advance overview regression
    And I open the carrier filter dropdown on advance overview regression
    Then the carrier filter dropdown displays carrier options on advance overview regression

    Examples:
      | tab                  |
      | Active Settlements   |
      | Historical Settlements |

  @advance-regression @regression-test @advance-overview @grid-ops @TEST-006-Advance-Overview-PROD
  Scenario Outline: T18-ADV-OV — Verify filter by product name in <tab> settlements
    When I navigate to the Advance Overview page on advance overview regression
    And I click the "<tab>" tab on advance overview regression
    And I open the product filter dropdown on advance overview regression
    Then the product filter dropdown displays product options on advance overview regression

    Examples:
      | tab                  |
      | Active Settlements   |
      | Historical Settlements |

  @advance-regression @regression-test @advance-overview @grid-ops @TEST-007-Advance-Overview-PROD
  Scenario Outline: T19-ADV-OV — Verify reset filter and search in <tab> settlements
    When I navigate to the Advance Overview page on advance overview regression
    And I click the "<tab>" tab on advance overview regression
    And I search the advance overview grid with "test" on advance overview regression
    And I reset the advance overview search on advance overview regression
    Then the advance overview grid shows all records on advance overview regression

    Examples:
      | tab                  |
      | Active Settlements   |
      | Historical Settlements |

  @advance-regression @regression-test @advance-overview @grid-ops @TEST-008-Advance-Overview-PROD
  Scenario Outline: T20-ADV-OV — Verify column visibility toggle in <tab> settlements
    When I navigate to the Advance Overview page on advance overview regression
    And I click the "<tab>" tab on advance overview regression
    And I click the column visibility toggle on advance overview regression
    Then the column visibility menu is displayed on advance overview regression

    Examples:
      | tab                  |
      | Active Settlements   |
      | Historical Settlements |

  @advance-regression @regression-test @advance-overview @grid-ops @TEST-009-Advance-Overview-PROD
  Scenario Outline: T21-ADV-OV — Verify column sorting in <tab> settlements
    When I navigate to the Advance Overview page on advance overview regression
    And I click the "<tab>" tab on advance overview regression
    And I click the ARF ID column header to sort on advance overview regression
    Then the advance overview grid is sorted by ARF ID on advance overview regression

    Examples:
      | tab                  |
      | Active Settlements   |
      | Historical Settlements |

  # ═══════════════════════════════════════════════════════════════════════
  # ADVANCE OVERVIEW — ARF Detail Page
  # ═══════════════════════════════════════════════════════════════════════

  @advance-regression @regression-test @advance-overview @arf-detail @TEST-010-Advance-Overview-PROD
  Scenario: T22-ADV-OV — Verify clicking record navigates to ARF detail page
    When I navigate to the Advance Overview page on advance overview regression
    And I capture the ARF ID and Agent Name from the first row on advance overview regression
    And I click the first row in the advance overview grid on advance overview regression
    Then the ARF detail page is displayed on advance overview regression
    And the ARF detail page contains Policy Information section on advance overview regression
    And the ARF detail page contains Advance Details section on advance overview regression
    And the ARF detail page contains ARF Ledger section on advance overview regression
    And the ARF detail title matches the captured ARF ID and Agent Name on advance overview regression

  @advance-regression @regression-test @advance-overview @arf-detail @TEST-011-Advance-Overview-PROD
  Scenario: T23-ADV-OV — Verify ARF detail title contains ARF ID and Agent Name
    When I navigate to the Advance Overview page on advance overview regression
    And I click the first row in the advance overview grid on advance overview regression
    Then the ARF detail page title contains the ARF ID on advance overview regression
    And the ARF detail page title contains the Agent Name on advance overview regression

  @advance-regression @regression-test @advance-overview @arf-detail @TEST-012-Advance-Overview-PROD
  Scenario: T24-ADV-OV — Verify Policy Information section fields
    When I navigate to the Advance Overview page on advance overview regression
    And I click the first row in the advance overview grid on advance overview regression
    Then the Policy Information section contains Policy Number on advance overview regression
    And the Policy Information section contains Policy Holder Name on advance overview regression
    And the Policy Information section contains Agent Name on advance overview regression
    And the Policy Information section contains Product on advance overview regression
    And the Policy Information section contains Carrier on advance overview regression
    And the Policy Information section contains Policy Effective Date on advance overview regression
    And the Policy Information section contains Premium on advance overview regression

  @advance-regression @regression-test @advance-overview @arf-detail @TEST-013-Advance-Overview-PROD
  Scenario: T25-ADV-OV — Verify Advance Details section fields
    When I navigate to the Advance Overview page on advance overview regression
    And I click the first row in the advance overview grid on advance overview regression
    Then the Advance Details section contains Commission Per Month on advance overview regression
    And the Advance Details section contains Number of Months on advance overview regression
    And the Advance Details section contains Advance Amount on advance overview regression

  @advance-regression @regression-test @advance-overview @arf-detail @TEST-014-Advance-Overview-PROD
  Scenario: T26-ADV-OV — Verify ARF Ledger section components
    When I navigate to the Advance Overview page on advance overview regression
    And I click the first row in the advance overview grid on advance overview regression
    Then the ARF Ledger section contains a search bar on advance overview regression
    And the ARF Ledger section contains a column visibility button on advance overview regression
    And the ARF Ledger section contains a data grid on advance overview regression

  # ═══════════════════════════════════════════════════════════════════════
  # AGENT ELIGIBLE FOR ADVANCE
  # ═══════════════════════════════════════════════════════════════════════

  @advance-regression @regression-test @agent-eligibility @positive @TEST-001-Agent-Advance-Eligibility-PROD
  Scenario: T27-ADV-AE — Verify user can toggle ON Advance Eligibility in agent settings
    When I navigate to the Agents page on agent advance eligibility regression
    And I search for an agent in the agents grid on agent advance eligibility regression
    And I click the first agent row on agent advance eligibility regression
    And I open agent settings tab on agent advance eligibility regression
    Then the Advance Eligibility toggle is visible on agent advance eligibility regression
    When I enable the Advance Eligibility toggle on agent advance eligibility regression
    Then the Advance Eligibility toggle is enabled on agent advance eligibility regression
