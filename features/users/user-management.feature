@user-management @regression-test @icm
Feature: User Management

  User management operations: add, validate, edit, search, filter, sort, KPIs, and column visibility.
  Requires E2E_EMAIL and E2E_PASSWORD in .env.

  Background:
    Given I am logged into PieQ ICM for user management tests

  @user-management @regression-test @positive
  Scenario: T001-USR-ADD — Add user with valid mandatory fields
    When I open the User Management dashboard
    And I click add user
    And I fill mandatory fields only
    And I select role "Operations Manager"
    And I click save button
    Then the user is saved and I am on the User Management dashboard

  @user-management @regression-test @validation
  Scenario: T002-USR-VAL — Validate error messages with invalid email
    When I open the User Management dashboard
    And I click add user
    And I fill email with invalid value
    And I fill valid firstname and lastname
    And I select role "Operations Manager"
    And I click save button
    Then I see email validation error

  @user-management @regression-test @validation
  Scenario: T003-USR-VAL — Validate error messages with invalid name
    When I open the User Management dashboard
    And I click add user
    And I fill name with special characters
    And I fill valid email
    And I select role "Operations Manager"
    And I click save button
    Then I see name validation errors

  @user-management @regression-test @validation
  Scenario: T004-USR-VAL — Validate error messages with long email on save
    When I open the User Management dashboard
    And I click add user
    And I fill email with long valid format
    And I fill valid firstname and lastname
    And I select role "Operations Manager"
    And I click save button
    Then I see validation errors
    And I capture a screenshot of the add user validation errors

  @user-management @regression-test @negative
  Scenario: T005-USR-NEG — Validate duplicate email error
    When I open the User Management dashboard
    And I click add user
    And I fill mandatory fields with duplicate email
    And I select role "Operations Manager"
    And I click save button
    Then I see duplicate email error

  @user-management @regression-test @grid @search
  Scenario Outline: T006-USR-GSR — Search grid and validate response
    When I open the User Management dashboard
    And I search the grid for "<query>"
    Then the grid search response is "<result>"

    Examples:
      | query                    | result      |
      | deva                       | has matches |
      | zzz-invalid-no-match-xyz | no matches  |

  @user-management @regression-test @grid @filter @status
  Scenario Outline: T007-USR-GST — Filter grid by status and validate all rows
    When I open the User Management dashboard
    And I filter the grid by "Status" with value "<status>"
    Then all visible grid rows have status "<status>"

    Examples:
      | status   |
      | Active   |
      | Inactive |

  @user-management @regression-test @grid @filter @role
  Scenario Outline: T008-USR-GRL — Filter grid by role and validate all rows
    When I open the User Management dashboard
    And I filter the grid by "Role" with value "<role>"
    Then all visible grid rows have role "<role>"

    Examples:
      | role               |
      | Operations Manager |
      | Agency Owner   |
      | Operations Team   |

  @user-management @regression-test @grid @filter @clear
  Scenario: T009-USR-GCL — Clear all filters and verify the grid
    When I open the User Management dashboard
    And I filter the grid by "Status" with value "Active"
    And I clear all grid filters
    Then the grid has records displayed
    And grid filters are cleared

  @user-management @regression-test @grid @kpi
  Scenario: T010-USR-KPI — Validate KPI counts match total records
    When I open the User Management dashboard
    Then registered users KPI matches total records count
    And active users KPI is consistent with registered users

  @user-management @regression-test @grid @empty
  Scenario: T011-USR-GEP — Zero search results show no records found
    When I open the User Management dashboard
    And I search the grid for "zzz-invalid-no-match-xyz"
    Then the grid shows zero total records
    And the grid displays no records found

  @user-management @regression-test @grid @columns
  Scenario Outline: T012-USR-GCO — Toggle off grid column and validate it is hidden
    When I open the User Management dashboard
    And I toggle off grid column "<column>"
    Then grid column "<column>" is not visible
    And Reset the column

    Examples:
      | column    |
      | User Info |
      | Name      |
      | Status    |
      | Role      |

  @user-management @regression-test @sort
  Scenario Outline: T013-USR-SRT — Sort user grid by column ascending and descending
    When I open the User Management dashboard
    Then the grid has records displayed
    When I sort column "<column>" ascending
    Then the grid is sorted by "<column>" ascending
    When I sort column "<column>" descending
    Then the grid is sorted by "<column>" descending

    Examples:
      | column    |
      | User Info |
      | Status    |
      | Name      |
      | Role      |

  @user-management @regression-test @positive
  Scenario: T014-USR-ADD — Edit user with valid changes
    When I open the User Management dashboard
    And I search for user to edit
    And I open edit for the first user from active search
    And I apply conditional edit form updates
    And I save edited user
    Then the user is saved and I am on the User Management dashboard

  @user-management @regression-test @screenshot
  Scenario: T015-USR-SCR — Capture screenshot of user management dashboard
    When I open the User Management dashboard
    Then I capture a screenshot of the user management page
