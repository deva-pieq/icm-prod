@product-management @regression-test @icm
Feature: Product Management — add, edit product and field validation

  Add and edit product form validation and positive save flows.
  Requires E2E_EMAIL and E2E_PASSWORD in .env.

  Background:
    Given I am logged into PieQ ICM for product management tests

  @product-management @regression-test @product-create-page @positive @TEST-001-Product-Create-Page-PROD
  Scenario: T001-PRD-PCP — Save product with all valid mandatory fields
    When I open the Products dashboard
    And I open the add product form
    And I fill all mandatory product fields with valid unique data
    And I click save product
    Then the product is saved and I am on the Products dashboard

  @product-management @regression-test @product-create-page @validation @TEST-002-Product-Create-Page-PROD
  Scenario: T002-PRD-PCP — Save button is disabled when all mandatory fields are empty
    When I open the Products dashboard
    And I open the add product form
    And I leave all mandatory fields empty
    Then I see save button is disabled

  @product-management @regression-test @product-create-page @validation @TEST-003-Product-Create-Page-PROD
  Scenario Outline: T003-PRD-PCP — Save button is disabled when mandatory field is missing — <field>
    When I open the Products dashboard
    And I open the add product form
    And I fill all mandatory product fields except "<field>"
    Then I see save button is disabled

    Examples:
      | field            |
      | carrier          |
      | line of business |
      | product type     |
      | product name     |
      | product code     |

  @product-management @regression-test @product-create-page @validation @TEST-004-Product-Create-Page-PROD
  Scenario: T004-PRD-PCP — Save button is disabled when product name contains only spaces
    When I open the Products dashboard
    And I open the add product form
    And I fill mandatory product fields with valid defaults
    And I set product name to spaces only
    Then I see save button is disabled

  @product-management @regression-test @product-create-page @negative @TEST-005-Product-Create-Page-PROD
  Scenario: T005-PRD-PCP — Save product with special characters in product name
    When I open the Products dashboard
    And I open the add product form
    And I fill mandatory product fields with valid defaults
    And I set product name to special characters
    And I click save product
    Then the product is saved and I am on the Products dashboard

  @product-management @regression-test @product-create-page @negative @TEST-006-Product-Create-Page-PROD
  Scenario: T006-PRD-PCP — Duplicate product name shows inline error
    When I open the Products dashboard
    And I open the add product form
    And I fill mandatory product fields with valid defaults
    And I set product name to the duplicate product name
    And I set product code to a new unique code
    And I click save product
    Then I see duplicate product name error

  @product-management @regression-test @product-create-page @negative @TEST-007-Product-Create-Page-PROD
  Scenario: T007-PRD-PCP — Duplicate product code shows inline error
    When I open the Products dashboard
    And I open the add product form
    And I fill mandatory product fields with valid defaults
    And I set product code to the seeded duplicate code
    And I click save product
    Then I see duplicate product code error

  @product-management @regression-test @product-create-page @carrier-product-name @validation @TEST-008-Product-Create-Page-PROD
  Scenario: T008-PRD-PCP — Duplicate carrier product name shows inline error
    When I open the Products dashboard
    And I open the add product form
    And I fill mandatory product fields with valid defaults
    And I add the same carrier product name
    Then I see duplicate carrier product name error

  @product-management @regression-test @product-create-page @positive @TEST-009-Product-Create-Page-PROD
  Scenario: T009-PRD-PCP — Save product with product name at max length of 225 characters
    When I open the Products dashboard
    And I open the add product form
    And I fill mandatory product fields with valid defaults
    And I set product name to max length value
    And I click save product
    Then the product is saved and I am on the Products dashboard

  @product-management @regression-test @product-create-page @carrier-product-name @positive @TEST-010-Product-Create-Page-PROD
  Scenario: T010-PRD-PCP — Save product with valid carrier product name
    When I open the Products dashboard
    And I open the add product form
    And I fill mandatory product fields with valid defaults
    And I add a unique carrier product name
    And I click save product
    Then I am on the Products dashboard and view the saved product

  @product-management @regression-test @product-create-page @positive @TEST-011-Product-Create-Page-PROD
  Scenario: T011-PRD-PCP — Save product with valid description
    When I open the Products dashboard
    And I open the add product form
    And I fill all mandatory product fields with valid unique data
    And I set product description to "Valid e2e product description"
    And I click save product
    Then the product is saved and I am on the Products dashboard

  @product-management @regression-test @product-create-page @validation @TEST-012-Product-Create-Page-PROD
  Scenario: T012-PRD-PCP — Product description exceeding 255 characters blocks save
    When I open the Products dashboard
    And I open the add product form
    And I fill mandatory product fields with valid defaults
    And I set product description to over max length value
    And I click save product
    Then I see validation errors and remain on add product form

  @product-management @regression-test @product-create-page @dates @positive @TEST-013-Product-Create-Page-PROD
  Scenario: T013-PRD-PCP — Save with valid effective date
    When I open the Products dashboard
    And I open the add product form
    And I fill all mandatory product fields with valid unique data
    And I set effective date to "01/01/2021"
    And I click save product
    Then the product is saved and I am on the Products dashboard

  @product-management @regression-test @product-create-page @dates @positive @TEST-014-Product-Create-Page-PROD
  Scenario: T014-PRD-PCP — Save with expiry date after effective date
    When I open the Products dashboard
    And I open the add product form
    And I fill all mandatory product fields with valid unique data
    And I set effective date to "01/01/2021"
    And I set expiry date to "01/01/2026"
    And I click save product
    Then the product is saved and I am on the Products dashboard

  @product-management @regression-test @product-create-page @dates @validation @TEST-015-Product-Create-Page-PROD
  Scenario: T015-PRD-PCP — Expiry date before effective date shows inline error on save
    When I open the Products dashboard
    And I open the add product form
    And I fill mandatory product fields with valid defaults
    And I set effective date to "01/01/2026"
    And I set expiry date to "01/01/2021"
    And I click save product
    Then I see date validation error on save

  @product-management @regression-test @product-create-page @positive @TEST-016-Product-Create-Page-PROD
  Scenario: T016-PRD-PCP — Save product with default states coverage
    When I open the Products dashboard
    And I open the add product form
    And I fill all mandatory product fields with valid unique data
    And I click save product
    Then the product is saved and I am on the Products dashboard

  @product-management @regression-test @product-edit-page @positive @TEST-001-Product-Edit-Page-PROD
  Scenario Outline: T001-PRD-PEP — Navigate to edit product page via <entry>
    When I open the Products dashboard
    And I open edit product via "<entry>"
    Then I am on the edit product page

    Examples:
      | entry      |
      | grid row   |
      | kebab menu |

  @product-management @regression-test @product-edit-page @validation @TEST-002-Product-Edit-Page-PROD
  Scenario: T002-PRD-PEP — Carrier and product type are not editable on edit product page
    When I open the Products dashboard
    And I open edit product via "kebab menu"
    Then carrier and product type fields are not editable

  @product-management @regression-test @product-edit-page @positive @TEST-003-Product-Edit-Page-PROD
  Scenario: T003-PRD-PEP — Edit line of business and status on edit product page
    When I open the seeded product edit page
    And I set line of business to a different value
    And I toggle status between active and inactive
    And I click save product
    Then the edited product is saved and I am on the Products dashboard

  @product-management @regression-test @product-edit-page @positive @TEST-004-Product-Edit-Page-PROD
  Scenario: T004-PRD-PEP — Enable apply latest commission on renewal toggle on edit product page
    When I open the seeded product edit page
    And I enable apply latest commission on renewal toggle
    And I click save product
    Then the edited product is saved and I am on the Products dashboard

  @product-management @regression-test @product-edit-page @positive @TEST-005-Product-Edit-Page-PROD
  Scenario Outline: T005-PRD-PEP — Edit product <field> with valid unique input on edit page
    When I open the seeded product edit page
    And I edit product "<field>" field with valid unique data on edit
    And I click save product
    Then the edited product is saved and I am on the Products dashboard

    Examples:
      | field                |
      | product name         |
      | product code         |
      | carrier product name |
      | description          |

  @product-management @regression-test @product-edit-page @validation @TEST-006-Product-Edit-Page-PROD
  Scenario Outline: T006-PRD-PEP — Cannot save product when <field> exceeds max length on edit page
    When I open the seeded product edit page
    And I edit product "<field>" field with over max length value on edit
    And I click save product
    Then I see over max length blocks save for "<field>" on edit

    Examples:
      | field                |
      | product name         |
      | product code         |
      | carrier product name |
      | description          |

  @product-management @regression-test @product-edit-page @negative @TEST-007-Product-Edit-Page-PROD
  Scenario Outline: T007-PRD-PEP — Cannot save product with duplicate <field> on edit page
    When I open the Products dashboard
    And I open the add product form
    And I fill all mandatory product fields with valid unique data
    And I click save product
    And I open edit for the last saved product
    And I edit product "<field>" field with duplicate seeded value on edit
    And I click save product
    Then I see duplicate field error on edit for "<field>"

    Examples:
      | field                |
      | product name         |
      | product code         |
      | carrier product name |

  @product-management @regression-test @product-edit-page @validation @TEST-008-Product-Edit-Page-PROD
  Scenario Outline: T008-PRD-PEP — Cannot save product when <field> is whitespace only on edit page
    When I open the seeded product edit page
    And I edit product "<field>" field with spaces only on edit
    Then I see the save button got disabled

    Examples:
      | field                |
      | product name         |
      | product code         |
      | carrier product name |

  @product-management @regression-test @product-edit-page @dates @positive @TEST-009-Product-Edit-Page-PROD
  Scenario: T009-PRD-PEP — Edit effective and expiry dates with valid range on edit page
    When I open the seeded product edit page
    And I set effective date to "01/01/2021"
    And I set expiry date to "01/01/2026"
    And I click save product
    Then the edited product is saved and I am on the Products dashboard

  @product-management @regression-test @product-edit-page @dates @positive @TEST-010-Product-Edit-Page-PROD
  Scenario: T010-PRD-PEP — Remove effective and expiry dates on edit page
    When I open the seeded product edit page
    And I clear effective date
    And I clear expiry date
    And I click save product
    Then the edited product is saved and I am on the Products dashboard

  @product-management @regression-test @product-edit-page @dates @validation @TEST-011-Product-Edit-Page-PROD
  Scenario: T011-PRD-PEP — Cannot set expiry date before effective date on edit page
    When I open the seeded product edit page
    And I set effective date to "01/01/2026"
    And I set expiry date to "01/01/2021"
    And I click save product
    Then I see date validation error on edit save

  @product-management @regression-test @product-edit-page @positive @TEST-012-Product-Edit-Page-PROD
  Scenario: T012-PRD-PEP — Add and remove states in coverage on edit product page
    When I open the seeded product edit page
    And I toggle states in coverage on edit
    And I click save product
    Then the edited product is saved and I am on the Products dashboard

  # --- Commission Structure (manual cases 16–20) ---
  # Explored flow (preprod): Add Rule dialog → select type → Save → edit page
  # (/product/commission-structure/{id}/edit/{TYPE}). Leave via Cancel (no Back button);
  # unsaved dialog offers Cancel / Keep Editing — confirm leave returns to structure grid
  # with Draft chip. Added types are removed from Add Rule dropdown.

  @product-management @regression-test @commission-structure @positive @TEST-001-Product-Commission-Structure-PROD
  Scenario Outline: T001-PRD-PCS — Navigate to commission structure page via <entry>
    When I open the Products dashboard
    And I open edit product via "<entry>"
    And I open commission structure for the product
    Then I am on the commission structure page

    Examples:
      | entry      |
      | grid row   |
      | kebab menu |

  @product-management @regression-test @commission-structure @positive @needs-fresh-product @TEST-002-Product-Commission-Structure-PROD
  Scenario: T002-PRD-PCS — Add Rule dropdown shows all commission types when no rules exist
    When I open the seeded product commission structure page
    And I click add commission rule
    Then the add rule dropdown shows commission types "Commission, Bonus, Override"

  @product-management @regression-test @commission-structure @positive @TEST-003-Product-Commission-Structure-PROD
  Scenario Outline: T003-PRD-PCS — Draft chip appears after starting <type> rule and leaving edit
    When I open the seeded product commission structure page
    And I click add commission rule
    And I select commission rule type "<type>" in the add rule dialog
    And I confirm the add commission rule dialog
    And I cancel commission rule edit
    And I confirm leaving commission rule edit
    Then I see draft chip for commission type "<type>" on the structure grid

    Examples:
      | type       |
      | Commission |
      | Bonus      |
      | Override   |

  @product-management @regression-test @commission-structure @positive @TEST-004-Product-Commission-Structure-PROD
  Scenario Outline: T004-PRD-PCS — Clicking draft record opens <type> commission rule edit page
    When I open the commission rule draft for "<type>"
    Then I am on the edit commission rule page for "<type>"

    Examples:
      | type       |
      | Commission |
      | Bonus      |
      | Override   |

  @product-management @regression-test @commission-structure @positive @needs-fresh-product @TEST-005-Product-Commission-Structure-PROD
  Scenario Outline: T005-PRD-PCS — Added <type> rule is removed from Add Rule dropdown
    When I open the seeded product commission structure page
    And I ensure a commission rule draft exists for "<type>"
    And I click add commission rule
    Then the add rule dropdown does not show commission type "<type>"

    Examples:
      | type       |
      | Commission |
      | Bonus      |
      | Override   |

  # --- Commission Rule Edit (manual cases 21–41) ---

  @product-management @regression-test @commission-rule-edit @validation @TEST-001-Product-Commission-Rule-PROD
  Scenario Outline: T001-PRD-PCR — Cannot publish draft <type> rule without mandatory fields
    When I open the commission rule draft for "<type>"
    Then publish rule button is disabled on the commission rule

    Examples:
      | type       |
      | Commission |
      | Bonus      |
      | Override   |

  @product-management @regression-test @commission-rule-edit @positive @TEST-002-Product-Commission-Rule-PROD
  Scenario Outline: T002-PRD-PCR — Edit draft <type> rule name with valid value and save
    When I open the commission rule draft for "<type>"
    And I set commission rule name to a valid unique value
    And I click save draft on the commission rule
    Then the commission rule draft is saved successfully

    Examples:
      | type       |
      | Commission |
      | Bonus      |
      | Override   |

  @product-management @regression-test @commission-rule-edit @validation @TEST-003-Product-Commission-Rule-PROD
  Scenario Outline: T003-PRD-PCR — Save draft disabled when <type> rule name is whitespace only
    When I open the commission rule draft for "<type>"
    And I set commission rule name to whitespace only
    Then save draft button is disabled on the commission rule

    Examples:
      | type       |
      | Commission |
      | Bonus      |
      | Override   |

  @product-management @regression-test @commission-rule-edit @validation @known-gap @TEST-004-Product-Commission-Rule-PROD
  Scenario Outline: T004-PRD-PCR — Save draft disabled when <type> rule name exceeds max length
    When I open the commission rule draft for "<type>"
    And I set commission rule name to over max length value
    Then save draft button is disabled on the commission rule

    Examples:
      | type       |
      | Commission |
      | Bonus      |
      | Override   |

  @product-management @regression-test @commission-rule-edit @dates @positive @TEST-005-Product-Commission-Rule-PROD
  Scenario Outline: T005-PRD-PCR — Set <type> rule effective dates via calendar, manual entry, and clear
    When I open the commission rule draft for "<type>"
    And I set commission rule effective start date to "01/01/2021"
    And I set commission rule effective end date to "01/01/2026"
    And I clear commission rule effective dates
    Then save draft button is enabled on the commission rule

    Examples:
      | type       |
      | Commission |
      | Bonus      |
      | Override   |

  @product-management @regression-test @commission-rule-edit @dates @validation @TEST-006-Product-Commission-Rule-PROD
  Scenario Outline: T006-PRD-PCR — Save draft disabled when <type> effective start is after effective end
    When I open the commission rule draft for "<type>"
    And I set commission rule effective start date to "01/01/2026"
    And I set commission rule effective end date to "01/01/2021"
    Then save draft button is disabled on the commission rule
    And I see commission rule date validation on effective dates

    Examples:
      | type       |
      | Commission |
      | Bonus      |
      | Override   |

  @product-management @regression-test @commission-rule-edit @positive @TEST-007-Product-Commission-Rule-PROD
  Scenario Outline: T007-PRD-PCR — Enable and disable PMPM toggle on <type> commission rule
    When I open the commission rule draft for "<type>"
    And I enable PMPM on the commission rule
    And I disable PMPM on the commission rule
    Then PMPM is disabled on the commission rule

    Examples:
      | type       |
      | Commission |
      | Bonus      |
      | Override   |

  @product-management @regression-test @commission-rule-edit @positive @TEST-009-Product-Commission-Rule-PROD
  Scenario Outline: T009-PRD-PCR — Disable IPV slab when only one slab exists on <type> rule
    When I open the commission rule draft for "<type>"
    And I add an IPV slab to the commission rule with no limit
    And I disable the IPV slab on the commission rule
    Then the commission rule has no IPV slabs

    Examples:
      | type       |
      | Commission |
      | Bonus      |
      | Override   |

  @product-management @regression-test @commission-rule-edit @positive @TEST-008-Product-Commission-Rule-PROD
  Scenario Outline: T008-PRD-PCR — Add IPV slab with limit or no limit on <type> commission rule
    When I open the commission rule draft for "<type>"
    And I add an IPV slab to the commission rule with no limit
    And I add an IPV slab to the commission rule with limit "24"
    Then the commission rule has multiple IPV slabs

    Examples:
      | type       |
      | Commission |
      | Bonus      |
      | Override   |

  @product-management @regression-test @commission-rule-edit @validation @TEST-010-Product-Commission-Rule-PROD
  Scenario Outline: T010-PRD-PCR — Disable IPV slab control is disabled after adding second slab on <type> rule
    When I open the commission rule draft for "<type>"
    And I add an IPV slab to the commission rule with no limit
    And I add an IPV slab to the commission rule with limit "24"
    Then disable IPV slab control is disabled

    Examples:
      | type       |
      | Commission |
      | Bonus      |
      | Override   |

  @product-management @regression-test @commission-rule-edit @positive @ipv-slab @policy-period @TEST-011-Product-Commission-Rule-PROD
  Scenario Outline: T011-PRD-PCR — Each IPV slab has its own policy period slab on <type> rule
    When I open the commission rule draft for "<type>"
    And I add an IPV slab to the commission rule with no limit
    And I add an IPV slab to the commission rule with limit "24"
    And I configure distinct policy period values on each IPV slab
    Then each IPV slab shows a distinct policy period slab

    Examples:
      | type       |
      | Commission |
      | Bonus      |
      | Override   |

  @product-management @regression-test @commission-rule-edit @positive @TEST-012-Product-Commission-Rule-PROD
  Scenario Outline: T012-PRD-PCR — Manual commission split updates Agent when Agency and Sales Leader are set on <type> rule
    When I open the commission rule draft for "<type>"
    And I set commission split manually for agency "40" and sales leader "30"
    Then commission split agent value is "30"

    Examples:
      | type       |
      | Commission |
      | Bonus      |
      | Override   |

  @product-management @regression-test @commission-rule-edit @positive @TEST-013-Product-Commission-Rule-PROD
  Scenario Outline: T013-PRD-PCR — Fill commission split using template on <type> rule
    When I open the commission rule draft for "<type>"
    And I select commission split template on the commission rule
    Then commission split fields are populated from template

    Examples:
      | type       |
      | Commission |
      | Bonus      |
      | Override   |

  @product-management @regression-test @commission-rule-edit @positive @TEST-014-Product-Commission-Rule-PROD
  Scenario Outline: T014-PRD-PCR — Selecting another template overwrites manual commission split on <type> rule
    When I open the commission rule draft for "<type>"
    And I set commission split manually for agency "40" and sales leader "30"
    And I select a different commission split template on the commission rule
    Then commission split fields are populated from template

    Examples:
      | type       |
      | Commission |
      | Bonus      |
      | Override   |

  @product-management @regression-test @commission-rule-edit @positive @TEST-015-Product-Commission-Rule-PROD
  Scenario Outline: T015-PRD-PCR — Enable sub-agent wise commission split on <type> rule
    When I open the commission rule draft for "<type>"
    And I enable sub-agent wise commission split
    Then sub-agent commission split section is visible

    Examples:
      | type       |
      | Commission |
      | Bonus      |
      | Override   |

  @product-management @regression-test @commission-rule-edit @positive @TEST-016-Product-Commission-Rule-PROD
  Scenario Outline: T016-PRD-PCR — Edit sub-agent commission split manually on <type> rule
    When I open the commission rule draft for "<type>"
    And I enable sub-agent wise commission split
    And I set commission split manually for agency "50" and sales leader "25"
    Then sub-agent commission split agent value is "25" for all the fields
    And I click save draft on the commission rule

    Examples:
      | type       |
      | Commission |
      | Bonus      |
      | Override   |

  @product-management @regression-test @commission-rule-edit @positive @TEST-017-Product-Commission-Rule-PROD
  Scenario Outline: T017-PRD-PCR — Fill sub-agent commission split using template on <type> rule
    When I open the commission rule draft for "<type>"
    And I enable sub-agent wise commission split
    And I select sub-agent commission split template on the commission rule
    Then sub-agent commission split fields are populated from template

    Examples:
      | type       |
      | Commission |
      | Bonus      |
      | Override   |

  @product-management @regression-test @commission-rule-edit @positive @TEST-018-Product-Commission-Rule-PROD
  Scenario Outline: T018-PRD-PCR — Cancel discards unsaved changes on <type> commission rule edit page
    When I open the commission rule draft for "<type>"
    And I enter commission rule name and effective start date
    And I cancel commission rule edit
    And I confirm leaving commission rule edit
    Then I am on the commission structure page

    Examples:
      | type       |
      | Commission |
      | Bonus      |
      | Override   |

  @product-management @regression-test @commission-rule-edit @positive @TEST-019-Product-Commission-Rule-PROD
  Scenario Outline: T019-PRD-PCR — Save draft persists changes on <type> commission rule
    When I open the commission rule draft for "<type>"
    And I fill all mandatory commission rule fields with valid data
    And I click save draft on the commission rule
    Then the commission rule draft is saved successfully

    Examples:
      | type       |
      | Commission |
      | Bonus      |
      | Override   |

  @product-management @regression-test @commission-rule-edit @positive @TEST-020-Product-Commission-Rule-PROD
  Scenario Outline: T020-PRD-PCR — Publish <type> commission rule when all mandatory fields are complete
    When I open the commission rule draft for "<type>"
    And I fill all mandatory commission rule fields with valid data
    And I click save draft on the commission rule
    And I click publish rule on the commission rule
    Then the commission rule is published successfully

    Examples:
      | type       |
      | Commission |
      | Bonus      |
      | Override   |

  @product-management @regression-test @commission-rule-edit @positive @TEST-021-Product-Commission-Rule-PROD
  Scenario Outline: T021-PRD-PCR — Create new version from published <type> commission rule
    When I open the commission rule draft for "<type>"
    And I fill all mandatory commission rule fields with valid data
    And I click save draft on the commission rule
    And I click publish rule on the commission rule
    And I click create new version on the commission rule
    Then a new draft version is created for commission type "<type>"

    Examples:
      | type       |
      | Commission |
      | Bonus      |
      | Override   |

  # --- Policy period hierarchy (PP / CS / IPV matrix) ---

  @product-management @regression-test @commission-rule-edit @policy-period @validation @TEST-022-Product-Commission-Rule-PROD
  Scenario Outline: T022-PRD-PCR — Policy period value required before save on <type> rule
    When I open the commission rule draft for "<type>"
    And I set policy period month limit to "12" without value
    Then save draft button is disabled on the commission rule

    Examples:
      | type       |
      | Commission |
      | Bonus      |
      | Override   |

  @product-management @regression-test @commission-rule-edit @policy-period @positive @TEST-023-Product-Commission-Rule-PROD
  Scenario Outline: T023-PRD-PCR — Set month limit and value on regular policy period on <type> rule
    When I open the commission rule draft for "<type>"
    And I configure the regular policy period with limit "12" and value "10.00"
    Then the "Regular" policy period row contains "12" Month and value "10.00"

    Examples:
      | type       |
      | Commission |
      | Bonus      |
      | Override   |

  @product-management @regression-test @commission-rule-edit @policy-period @validation @TEST-024-Product-Commission-Rule-PROD
  Scenario Outline: T024-PRD-PCR — Add period shows validation when regular value is missing on <type> rule
    When I open the commission rule draft for "<type>"
    When I click add period button on the commission rule
    Then I receive the sliding notification to "Enter a Value for the current period"

    Examples:
      | type       |
      | Commission |
      | Bonus      |
      | Override   |

  @product-management @regression-test @commission-rule-edit @policy-period @positive @TEST-025-Product-Commission-Rule-PROD
  Scenario Outline: T025-PRD-PCR — Add renewal policy period after regular is capped on <type> rule
    When I open the commission rule draft for "<type>"
    And I configure the regular policy period with limit "12" and value "10.00"
    Then add period button is enabled on the commission rule
    When I add a renewal policy period on the commission rule
    Then the commission rule has 2 policy period rows

    Examples:
      | type       |
      | Commission |
      | Bonus      |
      | Override   |

  @product-management @regression-test @commission-rule-edit @policy-period @positive @TEST-026-Product-Commission-Rule-PROD
  Scenario Outline: T026-PRD-PCR — Fill value on renewal policy period on <type> rule
    When I open the commission rule draft for "<type>"
    And I configure the regular policy period with limit "12" and value "10.00"
    And I add a renewal policy period on the commission rule
    And I set the active policy period value to "5.00"
    Then the "Renewal" policy period row contains "5"

    Examples:
      | type       |
      | Commission |
      | Bonus      |
      | Override   |

  @product-management @regression-test @commission-rule-edit @policy-period @positive @TEST-027-Product-Commission-Rule-PROD
  Scenario Outline: T027-PRD-PCR — Delete renewal policy period row on <type> rule
    When I open the commission rule draft for "<type>"
    And I configure the regular policy period with limit "12" and value "10.00"
    And I add a renewal policy period on the commission rule
    And I delete the "Renewal" policy period row
    Then the commission rule has 1 policy period rows

    Examples:
      | type       |
      | Commission |
      | Bonus      |
      | Override   |

  @product-management @regression-test @commission-rule-edit @ipv-slab @commission-split @policy-period @TEST-028-Product-Commission-Rule-PROD
  Scenario: T028-PRD-PCR — Commission split is isolated per policy period and IPV slab on Commission rule
    When I open the commission rule draft for "Commission"
    And I add an IPV slab to the commission rule from "1" to "100"
    And I configure the regular policy period with limit "12" and value "10.00"
    And I select the "Regular" policy period row on the commission rule
    And I select commission split template matching "Aetna" on the commission rule
    And I store the current commission split signature on the commission rule
    And I add a renewal policy period on the commission rule
    And I select the "Renewal" policy period row on the commission rule
    And I set the active policy period value to "7.00"
    And I select commission split template matching "ACA" on the commission rule
    Then the commission split signature differs from the stored signature
    When I select the "Regular" policy period row on the commission rule
    Then the commission split signature matches the stored signature
    When I add an IPV slab to the commission rule from "101" with no limit
    And I select IPV slab index "1" on the commission rule
    And I configure the regular policy period with limit "12" and value "10.00"
    And I select the "Regular" policy period row on the commission rule
    And I select a different commission split template on the commission rule
    Then the commission split signature differs from the stored signature
    And I store the current commission split signature on the commission rule
    And I add a renewal policy period on the commission rule
    And I select the "Renewal" policy period row on the commission rule
    And I set the active policy period value to "7.00"
    And I select commission split template matching "ACA" on the commission rule
    Then the commission split signature differs from the stored signature
    When I select IPV slab index "0" on the commission rule
    And I select the "Regular" policy period row on the commission rule
    Then the commission split signature differs from the stored signature
    And I save the draft

  @product-management @regression-test @commission-rule-edit @commission-split @policy-period @TEST-029-Product-Commission-Rule-PROD
  Scenario Outline: T029-PRD-PCR — Manual commission split on regular period updates agent on <type> rule
    When I open the commission rule draft for "<type>"
    And I configure the regular policy period with limit "12" and value "10.00"
    And I set commission split manually on the "Regular" period for agency "40" and sales leader "30"
    Then commission split agent value is "30"

    Examples:
      | type       |
      | Commission |
      | Bonus      |
      | Override   |

  @product-management @regression-test @commission-rule-edit @commission-split @policy-period @positive @TEST-030-Product-Commission-Rule-PROD
  Scenario Outline: T030-PRD-PCR — Publish rule with regular and renewal periods on <type> rule
    When I open the commission rule draft for "<type>"
    And I set commission rule name to a valid unique value
    And I set commission rule effective start date to "01/01/2021"
    And I fill regular and renewal policy periods with template
    And I click save draft on the commission rule
    And I click publish rule on the commission rule
    Then the commission rule is published successfully

    Examples:
      | type       |
      | Commission |
      | Bonus      |
      | Override   |

  @product-management @regression-test @commission-rule-edit @ipv-slab @policy-period @TEST-031-Product-Commission-Rule-PROD
  Scenario: T031-PRD-PCR — Two IPV slabs retain distinct regular policy period values
    When I open the commission rule draft for "Commission"
    And I add an IPV slab to the commission rule with no limit
    And I add an IPV slab to the commission rule with limit "24"
    And I configure distinct policy period values on each IPV slab
    Then each IPV slab has distinct regular policy period values

  @product-management @regression-test @commission-rule-edit @ipv-slab @commission-split @TEST-032-Product-Commission-Rule-PROD
  Scenario: T032-PRD-PCR — Two IPV slabs retain distinct commission split signatures
    When I open the commission rule draft for "Commission"
    And I add an IPV slab to the commission rule with no limit
    And I add an IPV slab to the commission rule with limit "24"
    And I configure distinct policy period values on each IPV slab
    Then each IPV slab has distinct commission split signatures

  @product-management @regression-test @commission-rule-edit @ipv-slab @commission-split @policy-period @TEST-033-Product-Commission-Rule-PROD
  Scenario: T033-PRD-PCR — IPV slab and policy period matrix produces distinct split signatures
    When I open the commission rule draft for "Commission"
    And I add an IPV slab to the commission rule with no limit
    And I add an IPV slab to the commission rule with limit "24"
    Then the IPV period split matrix has distinct signatures
