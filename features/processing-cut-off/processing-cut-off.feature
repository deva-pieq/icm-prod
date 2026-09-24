@processing-cut-off @regression-test @icm
Feature: Agency Configuration — Processing Cut Off Day

  Validate Processing Cut Off Day under Agency Configuration → Agency Settings →
  Payment Processing Window. Cut-off day is the end of the weekly payment cycle;
  the cycle starts the following calendar day.

  After save, Ops Manager Dashboard Viewing Period must show a clear seven-day
  range (e.g. "Jun 1, 2026 - Jun 7, 2026") whose weekday bounds match the cycle.

  Example dates in the source cases are illustrative only — assert weekday bounds
  and format, not fixed calendar dates.

  Requires E2E_EMAIL and E2E_PASSWORD in .env (role with Agency Settings access).

  Known app gap (Sunday case):
  # Changing cut-off to Sunday should make Upload "Recently Uploaded" follow
  # Monday→Sunday, but the app still shows Thursday→Wednesday files only.

  Background:
    Given I am logged into PieQ ICM for processing cut off tests

  @processing-cut-off @regression-test @cutoff-day @TEST-PCO-001-PROD
  Scenario Outline: T001-PCO — Processing Cut Off Day <CutOffDay> sets weekly cycle <StartDay> through <EndDay>
    When I open Agency Settings payment processing window for processing cut off
    And I select Processing Cut Off Day "<CutOffDay>" for processing cut off
    And I save agency settings for processing cut off
    Then the Processing Cut Off Day shows "<CutOffDay>" for processing cut off
    When I open the operations manager dashboard for processing cut off
    Then the viewing period weekly cycle runs from <StartDay> through <EndDay> for processing cut off
    And the viewing period date range is clearly displayed for processing cut off

    Examples:
      | CutOffDay | StartDay  | EndDay    |
      | Sunday    | Monday    | Sunday    |
      | Monday    | Tuesday   | Monday    |
      | Tuesday   | Wednesday | Tuesday   |
      | Wednesday | Thursday  | Wednesday |
      | Thursday  | Friday    | Thursday  |
      | Friday    | Saturday  | Friday    |
      | Saturday  | Sunday    | Saturday  |

  @processing-cut-off @regression-test @cutoff-day @upload @bug @TEST-PCO-002-PROD
  Scenario: T002-PCO — Sunday cut-off should drive Upload Recently Uploaded Monday through Sunday
    # Known issue: Upload still shows only Thursday–Wednesday files after Sunday cut-off save.
    When I open Agency Settings payment processing window for processing cut off
    And I select Processing Cut Off Day "Sunday" for processing cut off
    And I save agency settings for processing cut off
    Then the Processing Cut Off Day shows "Sunday" for processing cut off
    When I open Statement Upload for processing cut off
    Then the Recently Uploaded active window is Monday through Sunday for processing cut off
    And every visible upload row Uploaded date falls inside that Monday through Sunday window for processing cut off
