@validate-commission-report @e2e @sanity-prod @icm
Feature: Validate Commission Report from Statement Review

  Prepare a unique statement from the inbox (xlsx/csv payee LLC toggle), upload,
  then validate from Review: skip zero Gross Comm and non-empty Chargeback;
  for remaining lines capture review + policy Agent values, Complete Review,
  then assert against View Commission Report.

  Background:
    Given I am logged into PieQ ICM for commission report validation

  @e2e @sanity-prod
  Scenario: T001-VCR — Validate commission report against policy Agent value
    Given a commission report statement file is prepared from the inbox

    When I open the commission report upload page
    And I upload the prepared commission report statement file
    And I pick the statement type from the prepared commission report file
    And I submit the upload for processing in commission report validation

    Then the uploaded file appears in the recently uploaded grid in commission report validation
    And extract processing completes and the file ID is captured in commission report validation
    And the upload row shows status "Waiting" and stage "Review" in commission report validation

    When I open the review page for the uploaded file in commission report validation
    Then the review page URL contains "/review/" in commission report validation
    And the review page heading is "Review Statement File" in commission report validation

    # From Review: skip zero Gross Comm / non-empty Chargeback; capture rest + policy Agent
    When I capture review lines and policy Agent commission values in commission report validation
    Then the commission report CSV skeleton is written with expected amounts in commission report validation

    When I complete the review and confirm in commission report validation
    Then a success toast notification appears in commission report validation
    When I wait for 3 seconds and refresh the data grid in commission report validation
    Then the upload stage changes to "Completed" in commission report validation

    # Kebab → View Commission Report → search policy → Agent amount → fill result
    When I open view commission report from the upload kebab in commission report validation
    And I fill Agent Split Amount from the commission report into the CSV in commission report validation
    Then calculated value times members equals commission from report for every line in commission report validation
    And the commission report CSV file is finalized for this statement run
