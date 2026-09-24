@validate-commission-truth @e2e @sanity-prod @icm
Feature: Validate Commission Truth from Statement Inbox

  App-only commission validation: gross compensation × product commission % = agent commission.
  Drop a CSV in the inbox folder named [StatementType]filename.csv (e.g. [Oscar U65 CS]statement.csv).

  Background:
    Given I am logged into PieQ ICM for commission truth validation

  @e2e @sanity-prod @oscar-u65-cs
  Scenario: T001-VCT-Oscar — Validate commission truth from inbox statement file
    Given a commission truth statement file is prepared from the inbox drop folder

    When I open the commission split upload page
    And I upload the prepared commission truth CSV file
    And I pick the statement type from the prepared commission truth file
    And I submit the upload for processing

    Then the uploaded file appears in the recently uploaded grid in commission truth validation
    And extract processing completes and the file ID is captured in commission truth validation
    And the upload row shows status "Waiting" and stage "Review" in commission truth validation

    When I open the review page for the uploaded file in commission truth validation
    Then the review page URL contains "/review/" in commission truth validation
    And the review page heading is "Review Statement File" in commission truth validation
    When I complete the review and confirm in commission truth validation
    Then a success toast notification appears in commission truth validation
    When I wait for 3 seconds and refresh the data grid
    Then the upload stage changes to "Completed" in commission truth validation

    When I navigate to commission details for the completed upload in commission truth validation
    Then the commission details page heading is "Commission Details" in commission truth validation
    When I validate each commission line item against product structure in commission truth validation
    Then calculated commission equals captured agent commission for every validated line item in commission truth validation
    And the commission truth sheet file is written for this statement run
