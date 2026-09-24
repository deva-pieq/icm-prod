import {
  setLastCommissionRuleName,
  setLastCommissionTemplate,
  setLastCommissionSplitSignature,
  getLastCommissionSplitSignature,
} from '../../utils/products/commissionRuleContext';
import { When, Then, After } from '../fixtures';

// Cases 21–41: commission rule edit page

After({ tags: '@commission-rule-edit' }, async ({ commissionRulePage, page, $testInfo }) => {
  if ($testInfo.status === $testInfo.expectedStatus) return;
  if (!/\/edit\//i.test(page.url())) return;
  try {
    await commissionRulePage.clickSaveDraftOnCommissionRule();
  } catch {
    // best-effort — don't mask original failure
  }
});

Then('publish rule button is disabled on the commission rule', async ({ commissionRulePage }) => {
  await commissionRulePage.expectPublishRuleButtonDisabled();
});

When('I set commission rule name to a valid unique value', async ({ commissionRulePage }) => {
  const name = await commissionRulePage.setCommissionRuleNameToValidUniqueValue();
  setLastCommissionRuleName(name);
});

When('I click save draft on the commission rule', async ({ commissionRulePage }) => {
  await commissionRulePage.clickSaveDraftOnCommissionRule();
});

When('I save the draft', async ({ commissionRulePage }) => {
  await commissionRulePage.saveTheDraft();
});

Then('the commission rule draft is saved successfully', async ({ commissionRulePage }) => {
  await commissionRulePage.expectCommissionRuleDraftSavedSuccessfully();
});

When('I set commission rule name to whitespace only', async ({ commissionRulePage }) => {
  await commissionRulePage.setCommissionRuleNameWhitespaceOnly();
});

Then('save draft button is disabled on the commission rule', async ({ commissionRulePage }) => {
  await commissionRulePage.expectSaveDraftButtonDisabled();
});

When('I set commission rule name to over max length value', async ({ commissionRulePage }) => {
  await commissionRulePage.setCommissionRuleNameOverMaxLength();
});

When(
  'I set commission rule effective start date to {string}',
  async ({ commissionRulePage }, value: string) => {
    await commissionRulePage.setCommissionRuleEffectiveStartDate(value);
  },
);

When(
  'I set commission rule effective end date to {string}',
  async ({ commissionRulePage }, value: string) => {
    await commissionRulePage.setCommissionRuleEffectiveEndDate(value);
  },
);

When('I clear commission rule effective dates', async ({ commissionRulePage }) => {
  await commissionRulePage.clearCommissionRuleEffectiveDates();
});

When('I enter commission rule name and effective start date', async ({ commissionRulePage }) => {
  await commissionRulePage.enterCommissionRuleNameAndEffectiveStartDate();
});

Then('save draft button is enabled on the commission rule', async ({ commissionRulePage }) => {
  await commissionRulePage.expectSaveDraftButtonEnabled();
});

Then('I see commission rule date validation on effective dates', async ({ commissionRulePage }) => {
  await commissionRulePage.expectCommissionRuleDateValidationOnEffectiveDates();
});

When('I enable PMPM on the commission rule', async ({ commissionRulePage }) => {
  await commissionRulePage.enablePmpmOnCommissionRule();
});

When('I disable PMPM on the commission rule', async ({ commissionRulePage }) => {
  await commissionRulePage.disablePmpmOnCommissionRule();
});

Then('PMPM is disabled on the commission rule', async ({ commissionRulePage }) => {
  await commissionRulePage.expectPmpmDisabledOnCommissionRule();
});

When('I add an IPV slab to the commission rule with no limit', async ({ commissionRulePage }) => {
  await commissionRulePage.addIpvSlabWithNoLimit();
});

When(
  'I add an IPV slab to the commission rule with limit {string}',
  async ({ commissionRulePage }, limit: string) => {
    await commissionRulePage.addIpvSlabWithLimit(limit);
  },
);

When(
  'I add an IPV slab to the commission rule from {string} to {string}',
  async ({ commissionRulePage }, from: string, to: string) => {
    await commissionRulePage.addIpvSlabWithRange(from, to);
  },
);

When(
  'I add an IPV slab to the commission rule from {string} with no limit',
  async ({ commissionRulePage }, from: string) => {
    await commissionRulePage.addIpvSlabFromWithNoLimit(from);
  },
);

When(
  'I select IPV slab index {string} on the commission rule',
  async ({ commissionRulePage }, index: string) => {
    await commissionRulePage.selectIpvSlabByIndex(Number(index));
  },
);

Then('the commission rule has multiple IPV slabs', async ({ commissionRulePage }) => {
  await commissionRulePage.expectMultipleIpvSlabs();
});

When('I disable the IPV slab on the commission rule', async ({ commissionRulePage }) => {
  await commissionRulePage.disableIpvSlabOnCommissionRule();
});

Then('the commission rule has no IPV slabs', async ({ commissionRulePage }) => {
  await commissionRulePage.expectNoIpvSlabs();
});

Then('disable IPV slab control is disabled', async ({ commissionRulePage }) => {
  await commissionRulePage.expectDisableIpvSlabControlDisabled();
});

When('I select each IPV slab on the commission rule', async ({ commissionRulePage }) => {
  await commissionRulePage.selectEachIpvSlabOnCommissionRule();
});

Then('each IPV slab shows a distinct policy period slab', async ({ commissionRulePage }) => {
  await commissionRulePage.expectEachIpvSlabShowsDistinctPolicyPeriodSlab();
});

When('I configure distinct policy period values on each IPV slab', async ({ commissionRulePage }) => {
  await commissionRulePage.configureDistinctPolicyPeriodValuesOnIpvSlabs();
});

When(
  'I set policy period month limit to {string} without value',
  async ({ commissionRulePage }, toMonths: string) => {
    await commissionRulePage.setCommissionRuleEffectiveStartDate('01/01/2021');
    await commissionRulePage.setPolicyPeriodMonthLimitWithoutValue(toMonths);
  },
);

When(
  'I configure the regular policy period with limit {string} and value {string}',
  async ({ commissionRulePage }, toMonths: string, value: string) => {
    await commissionRulePage.configureRegularPolicyPeriod(toMonths, value);
  },
);

Then('add period button is disabled on the commission rule', async ({ commissionRulePage }) => {
  await commissionRulePage.expectAddPeriodButtonDisabled();
});

Then('add period button is enabled on the commission rule', async ({ commissionRulePage }) => {
  await commissionRulePage.expectAddPeriodButtonEnabled();
});

When('I click add period button on the commission rule', async ({ commissionRulePage }) => {
  await commissionRulePage.clickAddPeriodButtonOnCommissionRule();
});

Then(
  'I receive the sliding notification to {string}',
  async ({ commissionRulePage }, message: string) => {
    await commissionRulePage.expectSlidingNotificationContaining(message);
  },
);

When('I add a renewal policy period on the commission rule', async ({ commissionRulePage }) => {
  await commissionRulePage.addPolicyPeriod();
});

Then(
  'the commission rule has {int} policy period rows',
  async ({ commissionRulePage }, count: number) => {
    await commissionRulePage.expectPolicyPeriodRowCount(count);
  },
);

When(
  'I select the {string} policy period row on the commission rule',
  async ({ commissionRulePage }, periodName: string) => {
    await commissionRulePage.selectPolicyPeriodRow(periodName);
  },
);

When(
  'I set the active policy period value to {string}',
  async ({ commissionRulePage }, value: string) => {
    await commissionRulePage.setPolicyPeriodValue(value);
    await commissionRulePage.savePolicyPeriodChanges();
  },
);

When('I delete the {string} policy period row', async ({ commissionRulePage }, periodName: string) => {
  await commissionRulePage.deletePolicyPeriodRow(periodName);
});

Then(
  'the {string} policy period row contains {string} Month and value {string}',
  async ({ commissionRulePage }, periodName: string, month: string, value: string) => {
    await commissionRulePage.expectPolicyPeriodRow(periodName, month, value);
  },
);

Then('the {string} policy period row contains {string}', async ({ commissionRulePage }, periodName: string, value: string) => {
  await commissionRulePage.expectPolicyPeriodRow(periodName, null, value);
});

When(
  'I store the current commission split signature on the commission rule',
  async ({ commissionRulePage }) => {
    setLastCommissionSplitSignature(await commissionRulePage.readCommissionSplitSignature());
  },
);

Then(
  'the commission split signature differs from the stored signature',
  async ({ commissionRulePage }) => {
    await commissionRulePage.expectCommissionSplitDiffersFromStored(getLastCommissionSplitSignature());
  },
);

Then(
  'the commission split signature matches the stored signature',
  async ({ commissionRulePage }) => {
    await commissionRulePage.expectCommissionSplitMatchesStored(getLastCommissionSplitSignature());
  },
);

When(
  'I select commission split template matching {string} on the commission rule',
  async ({ commissionRulePage }, keyword: string) => {
    await commissionRulePage.selectCommissionSplitTemplateByKeyword(keyword);
  },
);

When(
  'I select commission split template {string} on the commission rule',
  async ({ commissionRulePage }, templateName: string) => {
    await commissionRulePage.selectCommissionSplitTemplate(templateName);
  },
);

When('I fill regular and renewal policy periods with template', async ({ commissionRulePage }) => {
  await commissionRulePage.fillRegularAndRenewalPeriodsWithTemplate();
});

Then('each IPV slab has distinct regular policy period values', async ({ commissionRulePage }) => {
  await commissionRulePage.expectIpvSlabsHaveDistinctRegularValues();
});

Then('each IPV slab has distinct commission split signatures', async ({ commissionRulePage }) => {
  await commissionRulePage.expectIpvSlabsHaveDistinctCommissionSplits();
});

Then('the IPV period split matrix has distinct signatures', async ({ commissionRulePage }) => {
  await commissionRulePage.expectIpvPeriodSplitMatrixDistinct();
});

When(
  'I set commission split manually on the {string} period for agency {string} and sales leader {string}',
  async ({ commissionRulePage }, periodName: string, agency: string, salesLeader: string) => {
    await commissionRulePage.selectPolicyPeriodRow(periodName);
    await commissionRulePage.setCommissionSplitManually(agency, salesLeader);
  },
);

When(
  'I set commission split manually for agency {string} and sales leader {string}',
  async ({ commissionRulePage }, agency: string, salesLeader: string) => {
    await commissionRulePage.setCommissionSplitManually(agency, salesLeader);
  },
);

Then('commission split agent value is {string}', async ({ commissionRulePage }, value: string) => {
  await commissionRulePage.expectCommissionSplitAgentValue(value);
});

When('I select commission split template on the commission rule', async ({ commissionRulePage }) => {
  await commissionRulePage.selectCommissionSplitTemplate();
  setLastCommissionTemplate('default');
});

When(
  'I select a different commission split template on the commission rule',
  async ({ commissionRulePage }) => {
    await commissionRulePage.selectDifferentCommissionSplitTemplate();
    setLastCommissionTemplate('alternate');
  },
);

Then('commission split fields are populated from template', async ({ commissionRulePage }) => {
  await commissionRulePage.expectCommissionSplitFieldsPopulatedFromTemplate();
});

When('I enable sub-agent wise commission split', async ({ commissionRulePage }) => {
  await commissionRulePage.enableSubAgentWiseCommissionSplit();
});

Then('sub-agent commission split section is visible', async ({ commissionRulePage }) => {
  await commissionRulePage.expectSubAgentCommissionSplitSectionVisible();
});

When(
  'I set sub-agent commission split manually for agency {string} and sales leader {string}',
  async ({ commissionRulePage }, agency: string, salesLeader: string) => {
    await commissionRulePage.setSubAgentCommissionSplitManually(agency, salesLeader);
  },
);

Then(
  'sub-agent commission split agent value is {string}',
  async ({ commissionRulePage }, value: string) => {
    await commissionRulePage.expectSubAgentCommissionSplitAgentValue(value);
  },
);

Then(
  'sub-agent commission split agent value is {string} for all the fields',
  async ({ commissionRulePage }, value: string) => {
    await commissionRulePage.expectSubAgentCommissionSplitAgentValueForAllFields(value);
  },
);

When(
  'I select sub-agent commission split template on the commission rule',
  async ({ commissionRulePage }) => {
    await commissionRulePage.selectSubAgentCommissionSplitTemplate();
  },
);

Then(
  'sub-agent commission split fields are populated from template',
  async ({ commissionRulePage }) => {
    await commissionRulePage.expectSubAgentCommissionSplitFieldsPopulatedFromTemplate();
  },
);

When('I fill all mandatory commission rule fields with valid data', async ({ commissionRulePage }) => {
  const name = await commissionRulePage.fillAllMandatoryCommissionRuleFieldsWithValidData();
  setLastCommissionRuleName(name);
});

When('I click publish rule on the commission rule', async ({ commissionRulePage }) => {
  await commissionRulePage.clickPublishRuleOnCommissionRule();
});

Then('the commission rule is published successfully', async ({ commissionRulePage }) => {
  await commissionRulePage.expectCommissionRulePublishedSuccessfully();
});

When('I click create new version on the commission rule', async ({ commissionRulePage }) => {
  await commissionRulePage.clickCreateNewVersionOnCommissionRule();
});

Then(
  'a new draft version is created for commission type {string}',
  async ({ commissionRulePage }, type: string) => {
    await commissionRulePage.expectNewDraftVersionCreatedForType(type);
  },
);
