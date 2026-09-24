# HRMS — Exploratory Sanity Checklist (Quick Pass)

> Purpose: rapid sanity verification that the application is healthy and usable. Time-box: **30–45 minutes**.
> Run this before deeper testing or after any environment/data change. Do NOT test in production.
> Recording: tick ✅ / ❌ / ⚠ (issue found — log it in §6). Add date + tester + env in §1.

---

## 1. Session Info (fill in)
- Date: ____________
- Tester: ____________
- Env URL: ____________
- DB seeded? (leave types, holidays, employees, locations) ☐ Yes / ☐ No / ☐ Unknown
- SSO credentials available? ☐ Yes / ☐ No (if no users can log in, STOP — cannot sanity test)
- Known seeded credentials: admin@____ / employee@____

---

## 2. Boot & Smoke (2 min)
| # | Check | Expected | Result |
|---|-------|----------|--------|
| B1 | Home `/` loads without error | Landing page renders; no 500 | ☐ |
| B2 | Login page accessible | `/auth/signin` renders redirect UI to SSO | ☐ |
| B3 | Sign in works (SSO) | Redirect → Keycloak → back to `/dashboard`; session persists on refresh | ☐ |
| B4 | Logout works | Returns to login; protected pages redirect to `/` | ☐ |
| B5 | No fatal console errors on first load | Only expected/diagnostic logs; no uncaught exceptions | ☐ |

## 3. Core Journey — Dashboard & Profile (5 min)
| # | Check | Expected | Result |
|---|-------|----------|--------|
| C1 | `/dashboard` loads for admin | Admin dashboard renders with stats cards | ☐ |
| C2 | Period selector | Dropdown populated from payroll periods (or defaults to current month) | ☐ |
| C3 | Dashboard has no broken widgets | No NaN/undefined/blank figures; no eternal spinners | ☐ |
| C4 | `/profile` loads | Own profile visible; personal fields editable | ☐ |
| C5 | HR-controlled fields locked (self) | Dept/designation/manager/DOJ/official email NOT editable in self mode | ☐ |

## 4. Core Journey — Attendance (5 min, needs GPS-mock + assigned location)
| # | Check | Expected | Result |
|---|-------|----------|--------|
| AT1 | Check-in inside geofence | Success → status `Present` (source Web) | ☐ |
| AT2 | Check-out | Record closes; work duration > 0 | ☐ |
| AT3 | Check-in again same day | Fails "Already checked in for today" | ☐ |
| AT4 | Check-in outside geofence | Fails "You are outside the office zone" | ☐ |
| AT5 | Today's status widget / `/api/attendance/me` | Reflects the check-in record | ☐ |

## 5. Core Journey — Leave & Holiday (5 min)
| # | Check | Expected | Result |
|---|-------|----------|--------|
| L1 | Apply full-day leave | Request created; days counted exclude weekends/holidays | ☐ |
| L2 | Apply half-day leave | Half-day flag honoured | ☐ |
| L3 | Approve/reject as manager | Status changes; notifications created | ☐ |
| L4 | Withdraw request | Request disappears; notification emitted | ☐ |
| H1 | `/holidays` CRUD | Create a holiday → appears; duplicate date rejected; year ≤ 2099 | ☐ |

## 6. Core Journey — Payroll (5 min, needs sample .xlsx)
| # | Check | Expected | Result |
|---|-------|----------|--------|
| PY1 | Upload valid Excel | Rows processed; payroll record + payslip page render | ☐ |
| PY2 | Upload with a bad row | Row lands in upload `failures` with reason; batch succeeds otherwise | ☐ |
| PY3 | Upload non-Excel file | Rejected (MIME/extension) | ☐ |

## 7. CRUD Sanity — Admin Modules (5 min)
| # | Check | Expected | Result |
|---|-------|----------|--------|
| E1 | Employees list + create | List loads (no soft-deleted); create works | ☐ |
| E2 | Employee edit + sub-tabs | Addresses/bank/documents/education tab loads & saves | ☐ |
| B1 | Departments / Designations / Locations | List + create + edit work | ☐ |
| S1 | Shifts + Shift Assignments | Create shift; assign to employee; employee notified | ☐ |
| SC1 | Salary Components / Structures | List + create works | ☐ |
| M1 | Master data dropdown | At least one master list opens and creates an entry | ☐ |
| R1 | Roles / Permissions / System Roles | List + create works; permission assignment accepted | ☐ |

## 8. Notifications (3 min)
| # | Check | Expected | Result |
|---|-------|----------|--------|
| N1 | Bell/unread count | Count matches unread notifications | ☐ |
| N2 | Mark read | Count decrements | ☐ |
| N3 | Trigger cron (`/api/notifications/cron`) | Birthdays/work anniversaries emitted (if data present) | ☐ |

## 9. Bad Neighborhood — Negative & Guard Checks (5 min)
| # | Check | Expected | Result |
|---|-------|----------|--------|
| X1 | Unauthenticated deep-link | `/employees`, `/leaves`, `/payrolls` → redirect/401 (no data leak) | ☐ |
| X2 | User without permission hits API | Returns 403 with role name (not 500) | ☐ |
| X3 | Blank required field submit | Form/API shows validation error (no crash) | ☐ |
| X4 | Rapid double-click submit (apply/create/upload) | No duplicate records (idempotent or guarded) | ☐ |
| X5 | Big/unicode text in inputs | Accepted, escaped, no layout break | ☐ |

## 10. Stability Signals (whole session)
| # | Check | Result |
|---|-------|--------|
| Y1 | Zero unexpected 500s in network tab across journeys | ☐ |
| Y2 | Zero uncaught JS exceptions | ☐ |
| Y3 | Back/forward navigation doesn't break pages | ☐ |
| Y4 | Empty states render gracefully on fresh DB areas | ☐ |
| Y5 | No obvious data corruption after CRUD (list still consistent) | ☐ |

---

## 11. Issue Quick-Log (one row per finding)
| # | Severity (Blocker/Major/Minor/Polish) | Where (page/endpoint) | Steps to trigger | Expected | Actual | URL/Evidence |
|---|--------------------------------------|----------------------|------------------|----------|--------|--------------|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |
| 4 | | | | | | |

---

## 12. Verdict
- ☐ **GREEN** — all critical checks pass; application is sane for deeper testing.
- ☐ **YELLOW** — minor issues only (log §11); no blockers.
- ☐ **RED** — blocker found (login broken / 500s / data loss / money-affecting bug). Stop exploratory pass; report immediately.

> Blocker definitions: cannot log in; core journey breaks; payroll/leave/attendance data corrupted or duplicated; security/authz bypass; anything losing money or data.