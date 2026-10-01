@tmp-discovery
Feature: TEMP discovery — Agent Level & Hierarchy add-level dropdown option labels

  @tmp-discovery @agent-master
  Scenario: Dump exact Add Agent Level dropdown option labels
    Given I am logged into PieQ ICM for agent master tests
    When I dump add agent level dropdown options for discovery