@statement-upload @e2e @sanity-prod @icm @renewal
Feature: Commission statement upload — renewal happy flow

  End-to-end upload with a prepared Excel file, grid validation, review submit, and payables trace.
  Template: TestFiles/StatementUpload/[MLB NEW]HappyFlowChangeCheckRunDate.xlsx
  Requires E2E_EMAIL and E2E_PASSWORD in .env.

  Background:
    Given I am logged into PieQ ICM for statement upload tests

  @e2e @sanity-prod @renewal @scenario-1
  Scenario: T001-STM-RNW — Upload renewal statement — prepare file, upload, review, and trace payables
    Given the renewal statement upload file is prepared for upload
    When I open the commission statement upload page
    Then the upload process button is disabled

    When I upload the prepared renewal statement file
    And I remove the uploaded statement file
    Then the upload process button is disabled

    Given the renewal statement upload file is prepared for upload
    When I upload the prepared renewal statement file
    And I select statement type "Aetna ACA"
    Then the upload process button is enabled
    And the carrier and product type auto-detect fields are disabled

    When I submit the statement upload
    Then the recently uploaded statements grid shows my upload in progress

    When I refresh the recently uploaded statements grid
    Then the stored upload row shows status Waiting and stage Review

    When I open the review page for the stored upload
    Then I see the review statement file page for the stored upload
    When I submit the statement for processing
    Then I see the statement upload success notifications

    When I open payable line items from the sidebar
    Then the payable line items source trace contains the stored file id
