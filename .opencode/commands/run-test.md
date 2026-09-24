---
description: Run a Playwright BDD test module by tag. Usage: /run-test <module-tag> [--headed]
agent: build
---

Run `yarn test -g @<module-tag>` from the projects/icm directory. Append extra args after `-g`:

```
yarn test -g @<module-tag>           # module suite
yarn test -g @<module-tag> --headed  # headed mode
yarn test -g @<single-test-id>       # single scenario
```

Valid module tags: smoke, user-management, product-management, happy-flow, statement-upload, transfer-sheet, validate-commission-truth, policy-cancellation-agency-advance.
