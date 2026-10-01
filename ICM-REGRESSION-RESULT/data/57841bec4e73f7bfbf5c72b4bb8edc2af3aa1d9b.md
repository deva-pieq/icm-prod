# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: features\dashboard\dashboard.feature.spec.ts >> Dashboard — widgets, viewing period, and operational metrics >> T002-DASH-SB — Statement Stage Breakdown calculation matches total counts
- Location: .features-gen\features\dashboard\dashboard.feature.spec.ts:118:7

# Error details

```
Error: Sum of stage counts (37) should equal total (38)

expect(received).toBe(expected) // Object.is equality

Expected: 38
Received: 37
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - img [ref=e9]
        - generic [ref=e13]:
          - heading "MLB" [level=1] [ref=e14]
          - paragraph [ref=e15]: Insurance Operations
      - button "Collapse sidebar" [ref=e16] [cursor=pointer]:
        - img [ref=e17]
    - navigation "Sidebar navigation" [ref=e20]:
      - button "Dashboard" [active] [ref=e22] [cursor=pointer]:
        - img [ref=e24]
        - generic [ref=e29]: Dashboard
      - button "User Management" [ref=e31] [cursor=pointer]:
        - img [ref=e32]
        - generic [ref=e36]: User Management
      - button "Carriers" [ref=e38] [cursor=pointer]:
        - img [ref=e39]
        - generic [ref=e41]: Carriers
      - button "Agents" [ref=e43] [cursor=pointer]:
        - img [ref=e44]
        - generic [ref=e49]: Agents
      - button "Products" [ref=e51] [cursor=pointer]:
        - img [ref=e52]
        - generic [ref=e56]: Products
      - button "Policies" [ref=e58] [cursor=pointer]:
        - img [ref=e59]
        - generic [ref=e62]: Policies
      - button "Commissions" [ref=e64] [cursor=pointer]:
        - img [ref=e65]
        - generic [ref=e67]: Commissions
        - img [ref=e69]
      - button "Advance" [ref=e72] [cursor=pointer]:
        - img [ref=e73]
        - generic [ref=e79]: Advance
        - img [ref=e81]
      - button "Statements" [ref=e84] [cursor=pointer]:
        - img [ref=e85]
        - generic [ref=e88]: Statements
        - img [ref=e90]
      - button "Payment Processing" [ref=e93] [cursor=pointer]:
        - img [ref=e94]
        - generic [ref=e96]: Payment Processing
        - img [ref=e98]
      - button "Settings" [ref=e101] [cursor=pointer]:
        - img [ref=e102]
        - generic [ref=e105]: Settings
        - img [ref=e107]
      - button "Agency Configuration" [ref=e110] [cursor=pointer]:
        - img [ref=e111]
        - generic [ref=e114]: Agency Configuration
        - img [ref=e116]
    - button "Open user menu" [ref=e122] [cursor=pointer]:
      - generic [ref=e125]: DO
      - generic [ref=e126]:
        - paragraph [ref=e127]: Deva Prod Ops
        - paragraph [ref=e128]: Operations Manager
    - generic [ref=e129]: V20260924.01
  - main [ref=e131]:
    - generic [ref=e133]:
      - generic [ref=e136]:
        - paragraph [ref=e137]: Viewing Period
        - generic [ref=e138]:
          - button "Previous payment week" [ref=e139] [cursor=pointer]:
            - img [ref=e140]
          - button "Viewing period, payment week Sep 30, 2026 - Oct 6, 2026. Select a Tuesday to change week." [ref=e143] [cursor=pointer]:
            - img [ref=e144]
            - generic [ref=e146]: Sep 30, 2026 - Oct 6, 2026
          - button "Next payment week" [disabled] [ref=e147]:
            - img [ref=e148]
      - generic [ref=e150]:
        - generic [ref=e153]:
          - button "Overview" [ref=e154] [cursor=pointer]:
            - generic [ref=e155]: Overview
          - button "Pending Payment" [ref=e156] [cursor=pointer]:
            - generic [ref=e157]: Pending Payment
        - region "Weekly Statement Processing Cycle" [ref=e158]:
          - heading "Weekly Statement Processing Cycle" [level=2] [ref=e159]
          - generic [ref=e160]:
            - generic [ref=e162]:
              - heading "Total Received" [level=3] [ref=e165]
              - generic [ref=e167]: "38"
              - paragraph [ref=e168]: $31,716.60 this week
            - button "View Completed statements" [ref=e170] [cursor=pointer]:
              - generic [ref=e171]:
                - heading "Completed" [level=3] [ref=e174]
                - generic [ref=e176]: "25"
                - paragraph [ref=e177]: $30,418.60 paid
            - button "View Processing statements" [ref=e179] [cursor=pointer]:
              - generic [ref=e180]:
                - heading "Processing" [level=3] [ref=e183]
                - generic [ref=e185]: "13"
                - paragraph [ref=e186]: $1,298.00 pending
            - button "View Exceptions statements" [ref=e188] [cursor=pointer]:
              - generic [ref=e189]:
                - heading "Exceptions" [level=3] [ref=e192]
                - generic [ref=e194]: "11"
                - paragraph [ref=e195]: $1,298.00 blocked
            - generic [ref=e197]:
              - heading "Avg Process Time" [level=3] [ref=e200]
              - generic [ref=e202]: 2m
            - button "View agent-wise MMP contribution details" [ref=e204] [cursor=pointer]:
              - generic [ref=e205]:
                - heading "Total MMP Contributed" [level=3] [ref=e208]
                - generic [ref=e210]: $16,120.00
                - paragraph [ref=e211]: 11 agents
        - generic [ref=e213]:
          - heading "Statement Stage Breakdown" [level=2] [ref=e214]
          - generic [ref=e215]:
            - generic [ref=e216]:
              - application [ref=e219]
              - paragraph [ref=e235]: "38"
              - paragraph [ref=e236]: Total Statements
            - list "Statement status legend" [ref=e238]:
              - listitem [ref=e239]:
                - generic [ref=e242]: Completed
                - generic [ref=e243]:
                  - text: "25"
                  - generic [ref=e244]: (65.80%)
              - listitem [ref=e245]:
                - generic [ref=e248]: Review
                - generic [ref=e249]:
                  - text: "1"
                  - generic [ref=e250]: (2.60%)
              - listitem [ref=e251]:
                - generic [ref=e254]: Needs Attention
                - generic [ref=e255]:
                  - text: "11"
                  - generic [ref=e256]: (28.90%)
              - listitem [ref=e257]:
                - generic [ref=e260]: Uploaded
                - generic [ref=e261]:
                  - text: "1"
                  - generic [ref=e262]: (2.60%)
        - generic [ref=e264]:
          - heading "Carrier Ageing Detail - Pending Statements" [level=2] [ref=e265]
          - grid "Data grid" [ref=e266]:
            - status [ref=e267]: 69 rows loaded
            - generic [ref=e268]:
              - generic [ref=e269]:
                - generic [ref=e270]:
                  - generic [ref=e272]:
                    - img [ref=e274]
                    - textbox "Search data grid" [ref=e277]:
                      - /placeholder: Search carriers...
                  - generic [ref=e278]: Use this search box to filter the data grid. Results will update as you type.
                - generic [ref=e279]:
                  - button "Export grid data to Excel" [ref=e280] [cursor=pointer]:
                    - img [ref=e283]
                  - button "Refresh grid data" [ref=e286] [cursor=pointer]:
                    - img [ref=e289]
              - grid [ref=e298]:
                - rowgroup [ref=e299]:
                  - row "Carrier 0-7d 8-15d 16-30d 30d+ Total $" [ref=e300]:
                    - columnheader "Carrier" [ref=e301]:
                      - generic [ref=e303] [cursor=pointer]: Carrier
                      - text: 
                      - img [ref=e306] [cursor=pointer]
                    - columnheader "0-7d" [ref=e311]:
                      - generic [ref=e313] [cursor=pointer]: 0-7d
                      - text: 
                      - img [ref=e316] [cursor=pointer]
                    - columnheader "8-15d" [ref=e321]:
                      - generic [ref=e323] [cursor=pointer]: 8-15d
                      - text: 
                      - img [ref=e326] [cursor=pointer]
                    - columnheader "16-30d" [ref=e331]:
                      - generic [ref=e333] [cursor=pointer]: 16-30d
                      - text: 
                      - img [ref=e336] [cursor=pointer]
                    - columnheader "30d+" [ref=e341]:
                      - generic [ref=e343] [cursor=pointer]: 30d+
                      - text: 
                      - img [ref=e346] [cursor=pointer]
                    - columnheader "Total $" [ref=e351]:
                      - generic [ref=e353] [cursor=pointer]: Total $
                      - text: 
                      - img [ref=e356] [cursor=pointer]
                - rowgroup [ref=e361]:
                  - row "Aetna View 115 statements View 7 statements View 31 statements $57,068.01" [ref=e362]:
                    - gridcell "Aetna" [ref=e363]:
                      - generic [ref=e364]: Aetna
                    - gridcell "View 115 statements" [ref=e365]:
                      - button "View 115 statements" [ref=e368] [cursor=pointer]:
                        - generic [ref=e369]: "115"
                    - gridcell "View 7 statements" [ref=e370]:
                      - button "View 7 statements" [ref=e373] [cursor=pointer]:
                        - generic [ref=e374]: "7"
                    - gridcell [ref=e375]
                    - gridcell "View 31 statements" [ref=e376]:
                      - button "View 31 statements" [ref=e379] [cursor=pointer]:
                        - generic [ref=e380]: "31"
                    - gridcell "$57,068.01" [ref=e381]:
                      - generic [ref=e382]: $57,068.01
                  - row "BCBS of OK New View 13 statements $49,500.05" [ref=e383]:
                    - gridcell "BCBS of OK New" [ref=e384]:
                      - generic [ref=e385]: BCBS of OK New
                    - gridcell [ref=e386]
                    - gridcell [ref=e387]
                    - gridcell [ref=e388]
                    - gridcell "View 13 statements" [ref=e389]:
                      - button "View 13 statements" [ref=e392] [cursor=pointer]:
                        - generic [ref=e393]: "13"
                    - gridcell "$49,500.05" [ref=e394]:
                      - generic [ref=e395]: $49,500.05
                  - row "Ambetter View 3 statements View 8 statements View 5 statements $43,162.00" [ref=e396]:
                    - gridcell "Ambetter" [ref=e397]:
                      - generic [ref=e398]: Ambetter
                    - gridcell [ref=e399]
                    - gridcell "View 3 statements" [ref=e400]:
                      - button "View 3 statements" [ref=e403] [cursor=pointer]:
                        - generic [ref=e404]: "3"
                    - gridcell "View 8 statements" [ref=e405]:
                      - button "View 8 statements" [ref=e408] [cursor=pointer]:
                        - generic [ref=e409]: "8"
                    - gridcell "View 5 statements" [ref=e410]:
                      - button "View 5 statements" [ref=e413] [cursor=pointer]:
                        - generic [ref=e414]: "5"
                    - gridcell "$43,162.00" [ref=e415]:
                      - generic [ref=e416]: $43,162.00
                  - row "Corebridge View 8 statements $27,045.40" [ref=e417]:
                    - gridcell "Corebridge" [ref=e418]:
                      - generic [ref=e419]: Corebridge
                    - gridcell [ref=e420]
                    - gridcell [ref=e421]
                    - gridcell [ref=e422]
                    - gridcell "View 8 statements" [ref=e423]:
                      - button "View 8 statements" [ref=e426] [cursor=pointer]:
                        - generic [ref=e427]: "8"
                    - gridcell "$27,045.40" [ref=e428]:
                      - generic [ref=e429]: $27,045.40
                  - row "IBC View 10 statements $22,122.89" [ref=e430]:
                    - gridcell "IBC" [ref=e431]:
                      - generic [ref=e432]: IBC
                    - gridcell [ref=e433]
                    - gridcell [ref=e434]
                    - gridcell [ref=e435]
                    - gridcell "View 10 statements" [ref=e436]:
                      - button "View 10 statements" [ref=e439] [cursor=pointer]:
                        - generic [ref=e440]: "10"
                    - gridcell "$22,122.89" [ref=e441]:
                      - generic [ref=e442]: $22,122.89
                  - row "Jefferson View 7 statements $21,076.00" [ref=e443]:
                    - gridcell "Jefferson" [ref=e444]:
                      - generic [ref=e445]: Jefferson
                    - gridcell [ref=e446]
                    - gridcell [ref=e447]
                    - gridcell [ref=e448]
                    - gridcell "View 7 statements" [ref=e449]:
                      - button "View 7 statements" [ref=e452] [cursor=pointer]:
                        - generic [ref=e453]: "7"
                    - gridcell "$21,076.00" [ref=e454]:
                      - generic [ref=e455]: $21,076.00
                  - row "Health Alliance View 3 statements $18,474.00" [ref=e456]:
                    - gridcell "Health Alliance" [ref=e457]:
                      - generic [ref=e458]: Health Alliance
                    - gridcell [ref=e459]
                    - gridcell [ref=e460]
                    - gridcell [ref=e461]
                    - gridcell "View 3 statements" [ref=e462]:
                      - button "View 3 statements" [ref=e465] [cursor=pointer]:
                        - generic [ref=e466]: "3"
                    - gridcell "$18,474.00" [ref=e467]:
                      - generic [ref=e468]: $18,474.00
                  - row "Transamerica View 4 statements $15,450.60" [ref=e469]:
                    - gridcell "Transamerica" [ref=e470]:
                      - generic [ref=e471]: Transamerica
                    - gridcell [ref=e472]
                    - gridcell [ref=e473]
                    - gridcell [ref=e474]
                    - gridcell "View 4 statements" [ref=e475]:
                      - button "View 4 statements" [ref=e478] [cursor=pointer]:
                        - generic [ref=e479]: "4"
                    - gridcell "$15,450.60" [ref=e480]:
                      - generic [ref=e481]: $15,450.60
                  - row "BCBS of TX View 11 statements $13,444.56" [ref=e482]:
                    - gridcell "BCBS of TX" [ref=e483]:
                      - generic [ref=e484]: BCBS of TX
                    - gridcell [ref=e485]
                    - gridcell [ref=e486]
                    - gridcell [ref=e487]
                    - gridcell "View 11 statements" [ref=e488]:
                      - button "View 11 statements" [ref=e491] [cursor=pointer]:
                        - generic [ref=e492]: "11"
                    - gridcell "$13,444.56" [ref=e493]:
                      - generic [ref=e494]: $13,444.56
                  - row "Minn Life View 5 statements $10,104.24" [ref=e495]:
                    - gridcell "Minn Life" [ref=e496]:
                      - generic [ref=e497]: Minn Life
                    - gridcell [ref=e498]
                    - gridcell [ref=e499]
                    - gridcell [ref=e500]
                    - gridcell "View 5 statements" [ref=e501]:
                      - button "View 5 statements" [ref=e504] [cursor=pointer]:
                        - generic [ref=e505]: "5"
                    - gridcell "$10,104.24" [ref=e506]:
                      - generic [ref=e507]: $10,104.24
                  - row "CareFirst View 4 statements $9,855.82" [ref=e508]:
                    - gridcell "CareFirst" [ref=e509]:
                      - generic [ref=e510]: CareFirst
                    - gridcell [ref=e511]
                    - gridcell [ref=e512]
                    - gridcell [ref=e513]
                    - gridcell "View 4 statements" [ref=e514]:
                      - button "View 4 statements" [ref=e517] [cursor=pointer]:
                        - generic [ref=e518]: "4"
                    - gridcell "$9,855.82" [ref=e519]:
                      - generic [ref=e520]: $9,855.82
                  - row "United Healthcare View 8 statements $9,527.00" [ref=e521]:
                    - gridcell "United Healthcare" [ref=e522]:
                      - generic [ref=e523]: United Healthcare
                    - gridcell [ref=e524]
                    - gridcell [ref=e525]
                    - gridcell [ref=e526]
                    - gridcell "View 8 statements" [ref=e527]:
                      - button "View 8 statements" [ref=e530] [cursor=pointer]:
                        - generic [ref=e531]: "8"
                    - gridcell "$9,527.00" [ref=e532]:
                      - generic [ref=e533]: $9,527.00
                  - row "Premera Blue Cross View 7 statements $9,316.00" [ref=e534]:
                    - gridcell "Premera Blue Cross" [ref=e535]:
                      - generic [ref=e536]: Premera Blue Cross
                    - gridcell [ref=e537]
                    - gridcell [ref=e538]
                    - gridcell [ref=e539]
                    - gridcell "View 7 statements" [ref=e540]:
                      - button "View 7 statements" [ref=e543] [cursor=pointer]:
                        - generic [ref=e544]: "7"
                    - gridcell "$9,316.00" [ref=e545]:
                      - generic [ref=e546]: $9,316.00
                  - row "Devoted Health View 4 statements $7,824.80" [ref=e547]:
                    - gridcell "Devoted Health" [ref=e548]:
                      - generic [ref=e549]: Devoted Health
                    - gridcell [ref=e550]
                    - gridcell [ref=e551]
                    - gridcell [ref=e552]
                    - gridcell "View 4 statements" [ref=e553]:
                      - button "View 4 statements" [ref=e556] [cursor=pointer]:
                        - generic [ref=e557]: "4"
                    - gridcell "$7,824.80" [ref=e558]:
                      - generic [ref=e559]: $7,824.80
                  - row "Capital BC View 7 statements $7,658.85" [ref=e560]:
                    - gridcell "Capital BC" [ref=e561]:
                      - generic [ref=e562]: Capital BC
                    - gridcell [ref=e563]
                    - gridcell [ref=e564]
                    - gridcell [ref=e565]
                    - gridcell "View 7 statements" [ref=e566]:
                      - button "View 7 statements" [ref=e569] [cursor=pointer]:
                        - generic [ref=e570]: "7"
                    - gridcell "$7,658.85" [ref=e571]:
                      - generic [ref=e572]: $7,658.85
                  - row "Allstate View 3 statements $4,896.63" [ref=e573]:
                    - gridcell "Allstate" [ref=e574]:
                      - generic [ref=e575]: Allstate
                    - gridcell [ref=e576]
                    - gridcell [ref=e577]
                    - gridcell [ref=e578]
                    - gridcell "View 3 statements" [ref=e579]:
                      - button "View 3 statements" [ref=e582] [cursor=pointer]:
                        - generic [ref=e583]: "3"
                    - gridcell "$4,896.63" [ref=e584]:
                      - generic [ref=e585]: $4,896.63
                  - row "Cigna View 10 statements $3,850.81" [ref=e586]:
                    - gridcell "Cigna" [ref=e587]:
                      - generic [ref=e588]: Cigna
                    - gridcell [ref=e589]
                    - gridcell [ref=e590]
                    - gridcell [ref=e591]
                    - gridcell "View 10 statements" [ref=e592]:
                      - button "View 10 statements" [ref=e595] [cursor=pointer]:
                        - generic [ref=e596]: "10"
                    - gridcell "$3,850.81" [ref=e597]:
                      - generic [ref=e598]: $3,850.81
                  - row "BCBS View 10 statements $3,746.00" [ref=e599]:
                    - gridcell "BCBS" [ref=e600]:
                      - generic [ref=e601]: BCBS
                    - gridcell [ref=e602]
                    - gridcell [ref=e603]
                    - gridcell [ref=e604]
                    - gridcell "View 10 statements" [ref=e605]:
                      - button "View 10 statements" [ref=e608] [cursor=pointer]:
                        - generic [ref=e609]: "10"
                    - gridcell "$3,746.00" [ref=e610]:
                      - generic [ref=e611]: $3,746.00
                - rowgroup
                - rowgroup
                - rowgroup
              - generic [ref=e615]: Showing all 69 records
        - generic [ref=e617]:
          - heading "Exception Tracking" [level=2] [ref=e618]
          - grid "Data grid" [ref=e619]:
            - status [ref=e620]: 2 rows loaded
            - generic [ref=e621]:
              - generic [ref=e622]:
                - generic [ref=e623]:
                  - generic [ref=e625]:
                    - img [ref=e627]
                    - textbox "Search data grid" [ref=e630]:
                      - /placeholder: Search exceptions by type...
                  - generic [ref=e631]: Use this search box to filter the data grid. Results will update as you type.
                - generic [ref=e632]:
                  - button "Export grid data to Excel" [ref=e633] [cursor=pointer]:
                    - img [ref=e636]
                  - button "Refresh grid data" [ref=e639] [cursor=pointer]:
                    - img [ref=e642]
              - grid [ref=e651]:
                - rowgroup [ref=e652]:
                  - row "Exception Type Count Total Amount Action" [ref=e653]:
                    - columnheader "Exception Type" [ref=e654]:
                      - generic [ref=e656] [cursor=pointer]: Exception Type
                      - text: 
                      - img [ref=e659] [cursor=pointer]
                    - columnheader "Count" [ref=e664]:
                      - generic [ref=e666] [cursor=pointer]: Count
                      - text: 
                      - img [ref=e669] [cursor=pointer]
                    - columnheader "Total Amount" [ref=e674]:
                      - generic [ref=e676] [cursor=pointer]: Total Amount
                      - text: 
                      - img [ref=e679] [cursor=pointer]
                    - columnheader "Action" [ref=e684]:
                      - generic [ref=e686]: Action
                      - text: 
                - rowgroup [ref=e687]:
                  - row "Commission Mismatch 1 $200.00" [ref=e688] [cursor=pointer]:
                    - gridcell "Commission Mismatch" [ref=e689]:
                      - generic [ref=e690]: Commission Mismatch
                    - gridcell "1" [ref=e691]:
                      - generic [ref=e694]: "1"
                    - gridcell "$200.00" [ref=e695]:
                      - generic [ref=e696]: $200.00
                    - gridcell [ref=e697]:
                      - button [ref=e700]:
                        - img [ref=e704]
                  - row "Policy Transfer 20 $1,098.00" [ref=e708] [cursor=pointer]:
                    - gridcell "Policy Transfer" [ref=e709]:
                      - generic [ref=e710]: Policy Transfer
                    - gridcell "20" [ref=e711]:
                      - generic [ref=e714]: "20"
                    - gridcell "$1,098.00" [ref=e715]:
                      - generic [ref=e716]: $1,098.00
                    - gridcell [ref=e717]:
                      - button [ref=e720]:
                        - img [ref=e724]
                - rowgroup
                - rowgroup
                - rowgroup
              - generic [ref=e728]: Showing all 2 records
```

# Test source

```ts
  476 |   /**
  477 |    * Verifies the widget re-renders a valid value across two different weeks
  478 |    * (dynamic update) without asserting volatile data values.
  479 |    */
  480 |   async expectMetricUpdatesOnWeekChange(key: MetricKey) {
  481 |     await this.returnToActiveWeek();
  482 |     const currentWeekText = await this.metricText(key);
  483 |     expect(currentWeekText.length, `${key} widget empty on current week`).toBeGreaterThan(0);
  484 | 
  485 |     await this.clickPrevWeek();
  486 |     await expect(this.loc.metric(key)).toBeVisible({ timeout: T });
  487 |     const pastWeekText = await this.metricText(key);
  488 |     expect(pastWeekText.length, `${key} widget empty on past week`).toBeGreaterThan(0);
  489 |     await this.returnToActiveWeek();
  490 |   }
  491 | 
  492 |   async clickCompletedWidget() {
  493 |     await this.expectMetricClickable('completed');
  494 |     await this.loc.metric('completed').click();
  495 |     await expect(this.loc.completedModal()).toBeVisible({ timeout: T });
  496 |   }
  497 | 
  498 |   async expectCompletedPanel() {
  499 |     await expect(this.loc.completedModal()).toBeVisible({ timeout: T });
  500 |     await expect(
  501 |       this.page.getByRole('heading', { name: /completed statements/i }),
  502 |     ).toBeVisible({ timeout: T });
  503 |   }
  504 | 
  505 |   async expectCompletedPanelColumns(columns: string[]) {
  506 |     await this.expectGridColumns(this.loc.completedModalGrid(), columns);
  507 |     await this.loc.completedModalClose().click().catch(() => undefined);
  508 |   }
  509 | 
  510 |   // ======================================================================
  511 |   // Statement Stage Breakdown
  512 |   // ======================================================================
  513 | 
  514 |   private static readonly KNOWN_STAGES = ['Review', 'Extract', 'Needs Attention', 'Completed'];
  515 | 
  516 |   async expectStageBreakdownWidget() {
  517 |     await expect(this.loc.stageCard()).toBeVisible({ timeout: T });
  518 |     await expect(this.loc.stageDonut()).toBeVisible({ timeout: T });
  519 |   }
  520 | 
  521 |   private async readStageEntries(): Promise<Array<{ label: string; count: number; pct: number }>> {
  522 |     const text = (await this.loc.stageCard().innerText()).replace(/\s+/g, ' ');
  523 |     const re = /(Review|Extract|Needs Attention|Completed)\s*(\d+)\s*\(([\d.]+)%\)/g;
  524 |     const out: Array<{ label: string; count: number; pct: number }> = [];
  525 |     let m: RegExpExecArray | null;
  526 |     while ((m = re.exec(text))) {
  527 |       out.push({ label: m[1], count: Number(m[2]), pct: Number(m[3]) });
  528 |     }
  529 |     return out;
  530 |   }
  531 | 
  532 |   /** Zero-count stages are hidden, so assert every visible stage is a known operational stage. */
  533 |   async expectOperationalStages() {
  534 |     const entries = await this.readStageEntries();
  535 |     expect(entries.length, 'No operational stages rendered in stage breakdown').toBeGreaterThan(0);
  536 |     for (const e of entries) {
  537 |       expect(
  538 |         OpsManagerDashboardPage.KNOWN_STAGES.includes(e.label),
  539 |         `Unexpected stage "${e.label}"`,
  540 |       ).toBe(true);
  541 |     }
  542 |   }
  543 | 
  544 |   /** Charts re-render for the selected week without breaking. */
  545 |   async expectChartsUpdateOnWeekChange() {
  546 |     await this.returnToActiveWeek();
  547 |     await expect(this.loc.stageDonut()).toBeVisible({ timeout: T });
  548 |     await this.clickPrevWeek();
  549 |     await expect(this.loc.stageDonut()).toBeVisible({ timeout: T });
  550 |     await this.returnToActiveWeek();
  551 |   }
  552 | 
  553 |   async readStageTotal(): Promise<number> {
  554 |     await expect(this.loc.stageTotal()).toBeVisible({ timeout: T });
  555 |     return Number.parseInt((await this.loc.stageTotal().innerText()).replace(/\D/g, ''), 10) || 0;
  556 |   }
  557 | 
  558 |   async expectStageTotalDisplayed() {
  559 |     const total = await this.readStageTotal();
  560 |     expect(Number.isFinite(total), 'Stage breakdown should display a total count').toBe(true);
  561 |   }
  562 | 
  563 |   async expectEachStageShowsCountAndPercentage() {
  564 |     const entries = await this.readStageEntries();
  565 |     expect(entries.length, 'No stage entries with count + percentage').toBeGreaterThan(0);
  566 |     for (const e of entries) {
  567 |       expect(Number.isFinite(e.count), `${e.label} missing count`).toBe(true);
  568 |       expect(Number.isFinite(e.pct), `${e.label} missing percentage`).toBe(true);
  569 |     }
  570 |   }
  571 | 
  572 |   async expectStageCountsSumToTotal() {
  573 |     const entries = await this.readStageEntries();
  574 |     const sum = entries.reduce((acc, e) => acc + e.count, 0);
  575 |     const total = await this.readStageTotal();
> 576 |     expect(sum, `Sum of stage counts (${sum}) should equal total (${total})`).toBe(total);
      |                                                                               ^ Error: Sum of stage counts (37) should equal total (38)
  577 |   }
  578 | 
  579 |   // ======================================================================
  580 |   // Carrier Ageing Detail
  581 |   // ======================================================================
  582 | 
  583 |   async expectCarrierAgeingTable() {
  584 |     await expect(this.loc.ageingCard()).toBeVisible({ timeout: T });
  585 |     await expect(this.loc.ageingGrid()).toBeVisible({ timeout: T });
  586 |   }
  587 | 
  588 |   async expectCarrierAgeingFunctional() {
  589 |     await expect(this.loc.ageingGrid()).toBeVisible({ timeout: T });
  590 |     await expect(
  591 |       this.loc.ageingCard().getByTestId('data-grid-record-count-footer'),
  592 |     ).toBeVisible({ timeout: T });
  593 |   }
  594 | 
  595 |   async expectCarrierSearchBar() {
  596 |     await expect(this.loc.ageingSearch()).toBeVisible({ timeout: T });
  597 |   }
  598 | 
  599 |   private async firstCarrierName(): Promise<string> {
  600 |     const row = this.loc.ageingGrid().locator('.ag-center-cols-container .ag-row, .ag-row').first();
  601 |     const cell = row.locator('[col-id="carrier"], [col-id*="carrier"], .ag-cell').first();
  602 |     return ((await cell.textContent()) || '').replace(/\s+/g, ' ').trim();
  603 |   }
  604 | 
  605 |   /** Search using a carrier name read live from the grid (data-independent). */
  606 |   async searchForCarrierByName(): Promise<string> {
  607 |     const name = await this.firstCarrierName();
  608 |     expect(name, 'Could not read a carrier name from the ageing grid').toBeTruthy();
  609 |     await this.loc.ageingSearch().fill(name);
  610 |     await waitForAppSettled(this.page);
  611 |     return name;
  612 |   }
  613 | 
  614 |   private lastSearchedCarrier = '';
  615 | 
  616 |   async searchCarrierAndRemember() {
  617 |     this.lastSearchedCarrier = await this.searchForCarrierByName();
  618 |   }
  619 | 
  620 |   async expectSearchedCarrierInResults() {
  621 |     const name = this.lastSearchedCarrier;
  622 |     expect(name, 'No carrier was searched').toBeTruthy();
  623 |     await expect(
  624 |       this.loc.ageingGrid().getByText(name, { exact: false }).first(),
  625 |     ).toBeVisible({ timeout: T });
  626 |   }
  627 | 
  628 |   async expectAgeingBucketColumns(buckets: string[]) {
  629 |     await this.expectGridColumns(this.loc.ageingGrid(), buckets);
  630 |   }
  631 | 
  632 |   /** Historical pending data older than a month exists when 16-30d / 30d+ buckets carry counts. */
  633 |   async expectHistoricalAgeingData() {
  634 |     const hasOldData = await this.loc.ageingCountCells().count();
  635 |     expect(hasOldData, 'Ageing buckets should display historical pending counts').toBeGreaterThan(0);
  636 |   }
  637 | 
  638 |   async expectCarrierPendingCountsAndTotalColumn() {
  639 |     expect(await this.loc.ageingCountCells().count(), 'No carrier pending counts').toBeGreaterThan(0);
  640 |     await this.expectGridColumns(this.loc.ageingGrid(), ['Total $']);
  641 |   }
  642 | 
  643 |   /** 16-30d and 30d+ counts are rendered in red to flag ageing severity.
  644 |    *  Live-verified: the red (rgb(220,38,38)) sits on the inner `button > span` of the
  645 |    *  `days16to30` and `days30plus` columns ONLY — younger buckets (0-7d / 8-15d) are dark
  646 |    *  slate (rgb(17,24,39)) or black. The red is NOT on the ag-cell or the button itself.
  647 |    *  Only *populated* severity buckets are red (an empty bucket has no count), so we assert:
  648 |    *  populated severity buckets => red, populated younger buckets => not red. */
  649 |   async expectAgeingSeverityHighlightedRed() {
  650 |     const grid = this.loc.ageingGrid();
  651 |     const severityCols = ['days16to30', 'days30plus'];
  652 |     const youngCols = ['days0to7', 'days8to15'];
  653 | 
  654 |     // Grid data-ready precondition: shell-visible ≠ rows loaded. AG Grid streams/re-renders rows
  655 |     // asynchronously, so a `.nth(i).evaluate` after `count()` races attachment (row attaches, then
  656 |     // detaches mid-read → 30s timeout on `nth(1)`). Wait for at least one real row first.
  657 |     const rows = grid.locator('.ag-row');
  658 |     await expect(rows.first()).toBeVisible({ timeout: T });
  659 |     await expect
  660 |       .poll(async () => rows.count(), { timeout: T, intervals: [500, 1000, 2000, 3000] })
  661 |       .toBeGreaterThan(0);
  662 | 
  663 |     // Batch-read ALL rendered bucket cells in ONE `grid.evaluate` — this avoids the per-cell
  664 |     // attach race entirely (the grid wrapper testid is stable; only row cells re-virtualize).
  665 |     type AgeingBucketCell = { col: string; hasCount: boolean; red: boolean };
  666 |     // Generic is the *return* type of evaluate, not the page-function signature.
  667 |     const cells = await grid.evaluate<AgeingBucketCell[]>((el) => {
  668 |       const cols = ['days16to30', 'days30plus', 'days0to7', 'days8to15'];
  669 |       return cols.flatMap((col) =>
  670 |         [...el.querySelectorAll(`.ag-cell[col-id="${col}"]`)].map((cell) => {
  671 |           const span = cell.querySelector('button span') ?? cell.querySelector('span') ?? cell;
  672 |           const text = (span.textContent ?? '').trim();
  673 |           const hasCount = /\d/.test(text) && text !== '$0.00' && text !== '$0';
  674 |           const red = getComputedStyle(span).color === 'rgb(220, 38, 38)';
  675 |           return { col, hasCount, red };
  676 |         }),
```