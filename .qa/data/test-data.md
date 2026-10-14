# Test Data

## Accounts
| Variable | Source | Synthetic? | Notes |
|---|---|---|---|---|
| E2E_EMAIL | .env | yes | |
| E2E_PASSWORD | .env | yes | |

Values are never recorded here — names and sources only.

## Factories
| Entity | Factory | Uniqueness strategy |
|---|---|---|

## Seed requirements
- <what must exist before a run>

## Isolation strategy
- auth: storageState per worker
- data: unique per run
- parallel-safe: yes / no — <why>
