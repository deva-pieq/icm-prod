@validate-commission-report-all @e2e @sanity-prod @icm
Feature: Validate Commission Report All Roles from Statement Review

  Prepare a unique statement from the inbox (xlsx/csv payee LLC toggle), upload,
  then validate from Review: skip zero Gross Comm and non-empty Chargeback;
  for remaining lines capture review + policy Agency / Sales Leader / Agent %,
  Complete Review, then assert each role against View Commission Report.
  Output: commission-report-all-{timestamp}.csv (3 Role rows per line item).

  Background:
    Given I am logged into PieQ ICM for commission report all validation

  @e2e @sanity-prod
  Scenario: T001-VCR-ALL — Validate Agency, Sales Leader, and Agent against commission report
    Given a commission report all statement file is prepared from the inbox

    When I open the commission report all upload page
    And I upload the prepared commission report all statement file
    And I pick the statement type from the prepared commission report all file
    And I submit the upload for processing in commission report all validation

    Then the uploaded file appears in the recently uploaded grid in commission report all validation
    And extract processing completes and the file ID is captured in commission report all validation
    And the upload row shows status "Waiting" and stage "Review" in commission report all validation

    When I open the review page for the uploaded file in commission report all validation
    Then the review page URL contains "/review/" in commission report all validation
    And the review page heading is "Review Statement File" in commission report all validation

    # From Review: skip zero Gross Comm / non-empty Chargeback; capture Agency + SL + Agent %
    When I capture review lines and policy Agency Sales Leader Agent commission values in commission report all validation
    Then the commission report all CSV skeleton is written with expected amounts in commission report all validation

    When I complete the review and confirm in commission report all validation
    Then a success toast notification appears in commission report all validation
    When I wait for 3 seconds and refresh the data grid in commission report all validation
    Then the upload stage changes to "Completed" in commission report all validation

    # Kebab → View Commission Report → search policy → each Role Split Amount → fill result
    When I open view commission report from the upload kebab in commission report all validation
    And I fill Agency Sales Leader Agent Split Amounts from the commission report into the CSV in commission report all validation
    Then calculated value times members equals commission from report for every role line in commission report all validation
    And the commission report all CSV file is finalized for this statement run
