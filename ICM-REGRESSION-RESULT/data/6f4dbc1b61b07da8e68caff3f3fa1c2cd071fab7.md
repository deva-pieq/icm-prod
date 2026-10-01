# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: features\payment-module\payment-module-ach.feature.spec.ts >> Payment Module Regression — ACH (Aetna ACA) >> T001-PAY-ACH — Create Payment enabled when selection can proceed
- Location: .features-gen\features\payment-module\payment-module-ach.feature.spec.ts:13:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "ready"
Received: "waiting:Error:Extract"

Call Log:
- Timeout 300000ms exceeded while waiting on the predicate
```

# Page snapshot

```yaml
- generic [ref=e1]:
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
        - button "Dashboard" [ref=e22] [cursor=pointer]:
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
        - generic [ref=e125]: PO
        - generic [ref=e126]:
          - paragraph [ref=e127]: Prod Owner
          - paragraph [ref=e128]: Agency Owner
      - generic [ref=e129]: V20260924.01
    - main [ref=e131]:
      - generic [ref=e133]:
        - complementary "Dashboard filters" [ref=e134]:
          - generic [ref=e135]:
            - heading "Filters" [level=2] [ref=e137]
            - generic [ref=e138]:
              - generic [ref=e139]:
                - button "Time Period" [expanded] [ref=e140] [cursor=pointer]:
                  - generic [ref=e141]: Time Period
                  - img [ref=e142]
                - group "Time period" [ref=e145]:
                  - generic [ref=e146]: Time period
                  - generic [ref=e150] [cursor=pointer]:
                    - radio "This Week" [ref=e151]
                    - generic [ref=e153]: This Week
                  - generic [ref=e157] [cursor=pointer]:
                    - radio "Last Week" [ref=e158]
                    - generic [ref=e160]: Last Week
                  - generic [ref=e164] [cursor=pointer]:
                    - radio "Last 4 Weeks" [ref=e165]
                    - generic [ref=e167]: Last 4 Weeks
                  - generic [ref=e171] [cursor=pointer]:
                    - radio "Last 12 Weeks" [ref=e172]
                    - generic [ref=e174]: Last 12 Weeks
                  - generic [ref=e178] [cursor=pointer]:
                    - radio "This Month" [ref=e179]
                    - generic [ref=e181]: This Month
                  - generic [ref=e185] [cursor=pointer]:
                    - radio "Last Month" [ref=e186]
                    - generic [ref=e188]: Last Month
                  - generic [ref=e192] [cursor=pointer]:
                    - radio "Last Quarter" [ref=e193]
                    - generic [ref=e195]: Last Quarter
                  - generic [ref=e199] [cursor=pointer]:
                    - radio "Last 6 Months" [ref=e200]
                    - generic [ref=e202]: Last 6 Months
                  - generic [ref=e206] [cursor=pointer]:
                    - radio "Year to Date" [ref=e207]
                    - generic [ref=e209]: Year to Date
                  - generic [ref=e213] [cursor=pointer]:
                    - radio "Last Year" [ref=e214]
                    - generic [ref=e216]: Last Year
                  - generic [ref=e217]:
                    - generic [ref=e220] [cursor=pointer]:
                      - radio "Custom Date Range" [checked] [active] [ref=e221]
                      - generic [ref=e224]: Custom Date Range
                    - generic [ref=e225]:
                      - generic [ref=e227]:
                        - img [ref=e229] [cursor=pointer]
                        - textbox [ref=e231] [cursor=pointer]
                        - generic [ref=e232]: Start Date
                      - generic [ref=e234]:
                        - img [ref=e236] [cursor=pointer]
                        - textbox [ref=e238] [cursor=pointer]
                        - generic [ref=e239]: End Date
              - button "Line of Business" [ref=e241] [cursor=pointer]:
                - generic [ref=e242]: Line of Business
                - img [ref=e243]
              - button "Product Type" [ref=e246] [cursor=pointer]:
                - generic [ref=e247]: Product Type
                - img [ref=e248]
              - button "Agent Level" [ref=e251] [cursor=pointer]:
                - generic [ref=e252]: Agent Level
                - img [ref=e253]
              - button "Carrier" [ref=e256] [cursor=pointer]:
                - generic [ref=e257]: Carrier
                - img [ref=e258]
          - generic [ref=e261]:
            - button "Reset" [ref=e262] [cursor=pointer]:
              - generic [ref=e264]: Reset
            - generic [ref=e265]:
              - button "Cancel" [ref=e266] [cursor=pointer]:
                - generic [ref=e268]: Cancel
              - button "Apply" [disabled]:
                - generic:
                  - generic: Apply
        - generic [ref=e269]:
          - generic [ref=e271]:
            - paragraph [ref=e272]: Viewing Period
            - paragraph [ref=e273]: Jan 1, 2026 – Sep 30, 2026
          - generic [ref=e274]:
            - region "Key Metrics" [ref=e275]:
              - heading "Key Metrics" [level=2] [ref=e276]
              - generic [ref=e277]:
                - button "View gross commission breakdown" [ref=e279] [cursor=pointer]:
                  - generic [ref=e280]:
                    - heading "Gross Commission" [level=3] [ref=e283]
                    - generic [ref=e285]: $237,449.79
                    - paragraph [ref=e286]: From carriers
                - generic [ref=e288]:
                  - heading "Agent Payouts" [level=3] [ref=e291]
                  - generic [ref=e293]: $182,984.52
                  - paragraph [ref=e294]: To agents
                - generic [ref=e296]:
                  - heading "Sub-Agent Payouts" [level=3] [ref=e299]
                  - generic [ref=e301]: $625.81
                  - paragraph [ref=e302]: To sub agents
                - generic [ref=e304]:
                  - heading "Sales Leader Override" [level=3] [ref=e307]
                  - generic [ref=e309]: $18,958.26
                  - paragraph [ref=e310]: Management
                - generic [ref=e312]:
                  - heading "Net to Agency" [level=3] [ref=e315]
                  - generic [ref=e317]: $34,881.20
                  - paragraph [ref=e318]: Owner profit
                - generic [ref=e320]:
                  - heading "Chargebacks" [level=3] [ref=e323]
                  - generic [ref=e325]: ($7,199.69)
                  - paragraph [ref=e326]: Deductions
            - generic [ref=e327]:
              - generic [ref=e328]:
                - generic [ref=e329]:
                  - heading "Revenue by Product Type" [level=2] [ref=e330]
                  - generic [ref=e331]:
                    - generic [ref=e334]:
                      - button "Product Type" [ref=e335] [cursor=pointer]:
                        - generic [ref=e336]: Product Type
                      - button "Carrier" [ref=e337] [cursor=pointer]:
                        - generic [ref=e338]: Carrier
                      - button "LOB" [ref=e339] [cursor=pointer]:
                        - generic [ref=e340]: LOB
                    - generic [ref=e341]:
                      - button "Pie chart view" [ref=e342] [cursor=pointer]:
                        - img [ref=e343]
                      - button "Bar chart view" [ref=e346] [cursor=pointer]:
                        - img [ref=e347]
                - generic [ref=e349]:
                  - generic [ref=e350]:
                    - application [ref=e353]
                    - paragraph [ref=e375]: $237,449.79
                  - list "Revenue legend" [ref=e377]:
                    - listitem [ref=e378]:
                      - generic [ref=e381]: ACA
                      - generic [ref=e382]:
                        - text: $173,788.77
                        - generic [ref=e383]: (73.19%)
                    - listitem [ref=e384]:
                      - generic [ref=e387]: Life
                      - generic [ref=e388]:
                        - text: $54,979.34
                        - generic [ref=e389]: (23.15%)
                    - listitem [ref=e390]:
                      - generic [ref=e393]: MAPD
                      - generic [ref=e394]:
                        - text: $7,743.55
                        - generic [ref=e395]: (3.26%)
                    - listitem [ref=e396]:
                      - generic [ref=e399]: Medd Supp
                      - generic [ref=e400]:
                        - text: $682.10
                        - generic [ref=e401]: (0.29%)
                    - listitem [ref=e402]:
                      - generic [ref=e405]: DEN
                      - generic [ref=e406]:
                        - text: $171.43
                        - generic [ref=e407]: (0.07%)
                    - listitem [ref=e408]:
                      - generic [ref=e411]: OVR
                      - generic [ref=e412]:
                        - text: $84.60
                        - generic [ref=e413]: (0.04%)
              - generic [ref=e414]:
                - heading "Commission Distribution by Role" [level=2] [ref=e415]
                - list [ref=e417]:
                  - listitem [ref=e418]:
                    - button "View Agent role details" [ref=e419] [cursor=pointer]:
                      - generic [ref=e420]:
                        - generic [ref=e421]:
                          - paragraph [ref=e422]: Agent
                          - paragraph [ref=e423]: 93 people
                        - generic [ref=e424]:
                          - paragraph [ref=e425]: $182,984.52
                          - paragraph [ref=e426]: 77.06%
                  - listitem [ref=e430]:
                    - button "View Agency role details" [ref=e431] [cursor=pointer]:
                      - generic [ref=e432]:
                        - generic [ref=e433]:
                          - paragraph [ref=e434]: Agency
                          - paragraph [ref=e435]: 1 person
                        - generic [ref=e436]:
                          - paragraph [ref=e437]: $34,881.20
                          - paragraph [ref=e438]: 14.69%
                  - listitem [ref=e442]:
                    - button "View Sales Leader role details" [ref=e443] [cursor=pointer]:
                      - generic [ref=e444]:
                        - generic [ref=e445]:
                          - paragraph [ref=e446]: Sales Leader
                          - paragraph [ref=e447]: 28 people
                        - generic [ref=e448]:
                          - paragraph [ref=e449]: $18,958.26
                          - paragraph [ref=e450]: 7.99%
                  - listitem [ref=e454]:
                    - button "View Sub Agent role details" [ref=e455] [cursor=pointer]:
                      - generic [ref=e456]:
                        - generic [ref=e457]:
                          - paragraph [ref=e458]: Sub Agent
                          - paragraph [ref=e459]: 3 people
                        - generic [ref=e460]:
                          - paragraph [ref=e461]: $625.81
                          - paragraph [ref=e462]: 0.26%
                - generic [ref=e466]:
                  - generic [ref=e467]: Total Commission Distributed
                  - generic [ref=e468]: $237,449.79
            - generic [ref=e469]:
              - generic [ref=e470]:
                - generic [ref=e471]:
                  - heading "Top Performers by Revenue" [level=2] [ref=e472]
                  - paragraph [ref=e473]: Ranked by total revenue earned across all roles
                - generic [ref=e474]:
                  - generic [ref=e475] [cursor=pointer]: "1"
                  - generic [ref=e476] [cursor=pointer]: CF
                  - paragraph [ref=e478] [cursor=pointer]: Carol Foley
                  - img [ref=e480] [cursor=pointer]:
                    - generic [ref=e482]: $20,816.96 (100.00%)
                  - generic [ref=e483] [cursor=pointer]: $20,816.96
                  - generic [ref=e484] [cursor=pointer]: "2"
                  - generic [ref=e485] [cursor=pointer]: JH
                  - paragraph [ref=e487] [cursor=pointer]: Jason Hoffmann
                  - img [ref=e489] [cursor=pointer]:
                    - generic [ref=e491]: $12,765.88 (79.35%)
                    - generic [ref=e493]: $3,322.49 (20.65%)
                  - generic [ref=e494] [cursor=pointer]: $16,088.37
                  - generic [ref=e495] [cursor=pointer]: "3"
                  - generic [ref=e496] [cursor=pointer]: AC
                  - paragraph [ref=e498] [cursor=pointer]: Andrew Choi
                  - img [ref=e500] [cursor=pointer]:
                    - generic [ref=e502]: $10,325.56 (92.64%)
                    - generic [ref=e504]: $819.90 (7.36%)
                  - generic [ref=e505] [cursor=pointer]: $11,145.46
                  - generic [ref=e506] [cursor=pointer]: "4"
                  - generic [ref=e507] [cursor=pointer]: TT
                  - paragraph [ref=e509] [cursor=pointer]: test-AgentX Test
                  - img [ref=e511] [cursor=pointer]:
                    - generic [ref=e513]: $10,678.17 (96.65%)
                    - generic [ref=e515]: $369.84 (3.35%)
                  - generic [ref=e516] [cursor=pointer]: $11,048.01
                  - generic [ref=e517] [cursor=pointer]: "5"
                  - generic [ref=e518] [cursor=pointer]: AR
                  - paragraph [ref=e520] [cursor=pointer]: Adam Richter
                  - img [ref=e522] [cursor=pointer]:
                    - generic [ref=e524]: $8,854.36 (84.18%)
                    - generic [ref=e526]: $1,664.48 (15.82%)
                  - generic [ref=e527] [cursor=pointer]: $10,518.84
                  - list "Role legend" [ref=e529]:
                    - listitem [ref=e530]: Agent
                    - listitem [ref=e532]: Sales Leader
              - generic [ref=e534]:
                - heading "Performance by Agent Level" [level=2] [ref=e535]
                - img "bar chart showing Revenue for 10 level categories. Y-axis represents value." [ref=e537]:
                  - application [ref=e540]:
                    - generic [ref=e572]:
                      - generic [ref=e573]:
                        - generic [ref=e575]: LVL1
                        - generic [ref=e577]: LVL2
                        - generic [ref=e579]: LVL3
                        - generic [ref=e581]: LVL4
                        - generic [ref=e583]: LVL5
                        - generic [ref=e585]: Level A
                        - generic [ref=e587]: Level B
                        - generic [ref=e589]: Level C
                        - generic [ref=e591]: Level D
                        - generic [ref=e593]: Level E
                      - generic [ref=e594]:
                        - generic [ref=e596]: $0
                        - generic [ref=e598]: $25k
                        - generic [ref=e600]: $50k
                        - generic [ref=e602]: $75k
                        - generic [ref=e604]: $100k
                - table [ref=e605]:
                  - rowgroup [ref=e606]:
                    - row "Level Agents Avg/Agent" [ref=e607]:
                      - columnheader "Level" [ref=e608]
                      - columnheader "Agents" [ref=e609]
                      - columnheader "Avg/Agent" [ref=e610]
                  - rowgroup [ref=e611]:
                    - row "LVL1 36 $942.62" [ref=e612] [cursor=pointer]:
                      - cell "LVL1" [ref=e613]
                      - cell "36" [ref=e614]
                      - cell "$942.62" [ref=e615]
                    - row "LVL2 10 $444.19" [ref=e616] [cursor=pointer]:
                      - cell "LVL2" [ref=e617]
                      - cell "10" [ref=e618]
                      - cell "$444.19" [ref=e619]
                    - row "LVL3 11 $483.01" [ref=e620] [cursor=pointer]:
                      - cell "LVL3" [ref=e621]
                      - cell "11" [ref=e622]
                      - cell "$483.01" [ref=e623]
                    - row "LVL4 12 $2,299.38" [ref=e624] [cursor=pointer]:
                      - cell "LVL4" [ref=e625]
                      - cell "12" [ref=e626]
                      - cell "$2,299.38" [ref=e627]
                    - row "LVL5 24 $3,629.55" [ref=e628] [cursor=pointer]:
                      - cell "LVL5" [ref=e629]
                      - cell "24" [ref=e630]
                      - cell "$3,629.55" [ref=e631]
                    - row "Level A 0 $0.00" [ref=e632] [cursor=pointer]:
                      - cell "Level A" [ref=e633]
                      - cell "0" [ref=e634]
                      - cell "$0.00" [ref=e635]
                    - row "Level B 0 $0.00" [ref=e636] [cursor=pointer]:
                      - cell "Level B" [ref=e637]
                      - cell "0" [ref=e638]
                      - cell "$0.00" [ref=e639]
                    - row "Level C 0 $0.00" [ref=e640] [cursor=pointer]:
                      - cell "Level C" [ref=e641]
                      - cell "0" [ref=e642]
                      - cell "$0.00" [ref=e643]
                    - row "Level D 0 $0.00" [ref=e644] [cursor=pointer]:
                      - cell "Level D" [ref=e645]
                      - cell "0" [ref=e646]
                      - cell "$0.00" [ref=e647]
                    - row "Level E 0 $0.00" [ref=e648] [cursor=pointer]:
                      - cell "Level E" [ref=e649]
                      - cell "0" [ref=e650]
                      - cell "$0.00" [ref=e651]
            - generic [ref=e652]:
              - generic [ref=e653]:
                - generic [ref=e654]:
                  - heading "ALL REVENUE BY PRODUCT TYPE × AGENT LEVEL" [level=2] [ref=e655]
                  - generic [ref=e656]:
                    - generic [ref=e658]:
                      - button "Product Type" [ref=e659] [cursor=pointer]:
                        - generic [ref=e661]: Product Type
                        - img [ref=e662]
                      - generic [ref=e664]: Rows
                    - generic [ref=e666]:
                      - button "Agent Level" [ref=e667] [cursor=pointer]:
                        - generic [ref=e669]: Agent Level
                        - img [ref=e670]
                      - generic [ref=e672]: Columns
                    - generic [ref=e674]:
                      - button "All Revenue" [ref=e675] [cursor=pointer]:
                        - generic [ref=e677]: All Revenue
                        - img [ref=e678]
                      - generic [ref=e680]: Metric
                - table "ALL REVENUE BY PRODUCT TYPE × AGENT LEVEL" [ref=e684]:
                  - rowgroup [ref=e685]:
                    - row "row LVL1 LVL2 LVL3 LVL4 LVL5 SA1 SA7 Unspecified Total" [ref=e686]:
                      - columnheader "row" [ref=e687]
                      - columnheader "LVL1" [ref=e688]
                      - columnheader "LVL2" [ref=e689]
                      - columnheader "LVL3" [ref=e690]
                      - columnheader "LVL4" [ref=e691]
                      - columnheader "LVL5" [ref=e692]
                      - columnheader "SA1" [ref=e693]
                      - columnheader "SA7" [ref=e694]
                      - columnheader "Unspecified" [ref=e695]
                      - columnheader "Total" [ref=e696]
                  - rowgroup [ref=e697]:
                    - row "OVR $0.00 $0.00 $0.00 $0.00 $0.00 $0.00 $0.00 $27.00 $27.00" [ref=e698]:
                      - rowheader "OVR" [ref=e699]
                      - cell "$0.00" [ref=e700]
                      - cell "$0.00" [ref=e701]
                      - cell "$0.00" [ref=e702]
                      - cell "$0.00" [ref=e703]
                      - cell "$0.00" [ref=e704]
                      - cell "$0.00" [ref=e705]
                      - cell "$0.00" [ref=e706]
                      - cell "$27.00" [ref=e707]
                      - cell "$27.00" [ref=e708]
                    - row "DEN $3.96 $0.00 $0.00 $0.00 $134.08 $0.00 $0.00 $2.99 $141.03" [ref=e709]:
                      - rowheader "DEN" [ref=e710]
                      - cell "$3.96" [ref=e711]
                      - cell "$0.00" [ref=e712]
                      - cell "$0.00" [ref=e713]
                      - cell "$0.00" [ref=e714]
                      - cell "$134.08" [ref=e715]
                      - cell "$0.00" [ref=e716]
                      - cell "$0.00" [ref=e717]
                      - cell "$2.99" [ref=e718]
                      - cell "$141.03" [ref=e719]
                    - row "Medd Supp $0.00 $2.25 $49.84 $0.56 $382.49 $0.00 $0.00 $66.78 $501.92" [ref=e720]:
                      - rowheader "Medd Supp" [ref=e721]
                      - cell "$0.00" [ref=e722]
                      - cell "$2.25" [ref=e723]
                      - cell "$49.84" [ref=e724]
                      - cell "$0.56" [ref=e725]
                      - cell "$382.49" [ref=e726]
                      - cell "$0.00" [ref=e727]
                      - cell "$0.00" [ref=e728]
                      - cell "$66.78" [ref=e729]
                      - cell "$501.92" [ref=e730]
                    - row "ACA $32,745.59 $1,810.84 $4,586.85 $10,291.18 $58,204.03 $25.20 $0.00 $4,232.13 $111,895.82" [ref=e731]:
                      - rowheader "ACA" [ref=e732]
                      - cell "$32,745.59" [ref=e733]
                      - cell "$1,810.84" [ref=e734]
                      - cell "$4,586.85" [ref=e735]
                      - cell "$10,291.18" [ref=e736]
                      - cell "$58,204.03" [ref=e737]
                      - cell "$25.20" [ref=e738]
                      - cell "$0.00" [ref=e739]
                      - cell "$4,232.13" [ref=e740]
                      - cell "$111,895.82" [ref=e741]
                    - row "Life $930.23 $1,735.93 $676.39 $17,275.36 $24,211.20 $15.65 $0.00 $2,076.86 $46,921.62" [ref=e742]:
                      - rowheader "Life" [ref=e743]
                      - cell "$930.23" [ref=e744]
                      - cell "$1,735.93" [ref=e745]
                      - cell "$676.39" [ref=e746]
                      - cell "$17,275.36" [ref=e747]
                      - cell "$24,211.20" [ref=e748]
                      - cell "$15.65" [ref=e749]
                      - cell "$0.00" [ref=e750]
                      - cell "$2,076.86" [ref=e751]
                      - cell "$46,921.62" [ref=e752]
                    - row "MAPD $254.41 $892.92 $0.00 $25.45 $4,177.45 $172.04 $412.92 $1,317.63 $7,252.82" [ref=e753]:
                      - rowheader "MAPD" [ref=e754]
                      - cell "$254.41" [ref=e755]
                      - cell "$892.92" [ref=e756]
                      - cell "$0.00" [ref=e757]
                      - cell "$25.45" [ref=e758]
                      - cell "$4,177.45" [ref=e759]
                      - cell "$172.04" [ref=e760]
                      - cell "$412.92" [ref=e761]
                      - cell "$1,317.63" [ref=e762]
                      - cell "$7,252.82" [ref=e763]
                    - row "Total $33,934.19 $4,441.94 $5,313.08 $27,592.55 $87,109.25 $212.89 $412.92 $7,723.39 $166,740.21" [ref=e764]:
                      - rowheader "Total" [ref=e765]
                      - cell "$33,934.19" [ref=e766]
                      - cell "$4,441.94" [ref=e767]
                      - cell "$5,313.08" [ref=e768]
                      - cell "$27,592.55" [ref=e769]
                      - cell "$87,109.25" [ref=e770]
                      - cell "$212.89" [ref=e771]
                      - cell "$412.92" [ref=e772]
                      - cell "$7,723.39" [ref=e773]
                      - cell "$166,740.21" [ref=e774]
              - generic [ref=e775]:
                - heading "12-Month Revenue Trend" [level=2] [ref=e776]
                - img "Line chart showing Total Revenue, Commission, Bonus, Overrides over 5 month points. Y-axis represents value." [ref=e778]:
                  - generic [ref=e780]:
                    - generic [ref=e782]:
                      - button "Total Revenue" [ref=e783] [cursor=pointer]:
                        - generic [ref=e785]: Total Revenue
                      - button "Commission" [ref=e786] [cursor=pointer]:
                        - generic [ref=e788]: Commission
                      - button "Bonus" [ref=e789] [cursor=pointer]:
                        - generic [ref=e791]: Bonus
                      - button "Overrides" [ref=e792] [cursor=pointer]:
                        - generic [ref=e794]: Overrides
                    - application [ref=e795]:
                      - generic [ref=e819]:
                        - generic [ref=e820]:
                          - generic [ref=e822]: May 26
                          - generic [ref=e824]: Jun 26
                          - generic [ref=e826]: Jul 26
                          - generic [ref=e828]: Aug 26
                          - generic [ref=e830]: Sep 26
                        - generic [ref=e831]:
                          - generic [ref=e833]: $0
                          - generic [ref=e835]: $35k
                          - generic [ref=e837]: $70k
                          - generic [ref=e839]: $105k
                          - generic [ref=e841]: $140k
  - generic [ref=e842]: $25k
```

# Test source

```ts
  1   | import { expect } from '@playwright/test';
  2   | import { STATEMENT_UPLOAD } from '../../test-data/commission-statements/statementUpload';
  3   | import type { PreparedStatementFile } from '../../utils/excelStatementPrep';
  4   | import { escapeRegex } from '../../utils/escapeRegex';
  5   | import { debugLogAssertion, debugLogFileIdCaptured } from '../../utils/debugSteps';
  6   | import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';
  7   | import type { StatementUploadPage, RecentlyUploadedRow } from './StatementUploadPage';
  8   | 
  9   | const T = smokeStepTimeoutMs;
  10  | 
  11  | export type UploadGridPollOptions = {
  12  |   maxAttempts?: number;
  13  |   intervalMs?: number;
  14  | };
  15  | 
  16  | export class StatementUploadAssertions {
  17  |   constructor(private readonly uploadPage: StatementUploadPage) {}
  18  | 
  19  |   private logAssertion(label: string, actual: unknown, expected: unknown, passed: boolean): void {
  20  |     debugLogAssertion(label, actual, expected, passed);
  21  |   }
  22  | 
  23  |   private async readStatusAndStage(
  24  |     fileName: string,
  25  |     fileId?: string,
  26  |   ): Promise<{
  27  |     row: Awaited<ReturnType<StatementUploadPage['resolveStoredUploadRow']>>;
  28  |     status: string;
  29  |     stage: string;
  30  |   }> {
  31  |     await this.uploadPage.ensureOnUploadPage();
  32  |     const row = await this.uploadPage.resolveStoredUploadRow({ fileId, fileName });
  33  |     const { status, stage } = await this.uploadPage.readUploadRowStatusAndStage(row);
  34  |     return { row, status, stage };
  35  |   }
  36  | 
  37  |   /**
  38  |    * Poll upload grid when status/stage is Extract + Processing.
  39  |    * Refreshes every `intervalMs` up to `maxAttempts`, then throws.
  40  |    */
  41  |   /**
  42  |    * Poll until upload grid shows the expected status + stage (e.g. Waiting / Review).
  43  |    */
  44  |   async pollUntilUploadReviewReady(
  45  |     fileName: string,
  46  |     status: string,
  47  |     stage: string,
  48  |     options: UploadGridPollOptions = {},
  49  |     fileId?: string,
  50  |   ): Promise<string> {
  51  |     const intervalMs = options.intervalMs ?? 2_000;
  52  |     const maxAttempts = options.maxAttempts ?? 30;
  53  |     const timeoutMs = Math.max(T * 3, maxAttempts * intervalMs);
  54  |     const statusPattern = new RegExp(escapeRegex(status), 'i');
  55  |     const stagePattern = new RegExp(escapeRegex(stage), 'i');
  56  | 
  57  |     let resolvedFileId = '';
  58  | 
  59  |     await expect
  60  |       .poll(
  61  |         async () => {
  62  |           try {
  63  |             await this.uploadPage.refreshRecentlyUploadedGrid();
  64  |             const { row, status: statusText, stage: stageText } = await this.readStatusAndStage(
  65  |               fileName,
  66  |               fileId,
  67  |             );
  68  | 
  69  |             if (statusPattern.test(statusText) && stagePattern.test(stageText)) {
  70  |               resolvedFileId = await this.uploadPage.readFileIdFromRow(row);
  71  |               this.logAssertion('uploadStatus', statusText, statusPattern, true);
  72  |               this.logAssertion('uploadStage', stageText, stagePattern, true);
  73  |               return 'ready';
  74  |             }
  75  | 
  76  |             return `waiting:${statusText || '(empty)'}:${stageText || '(empty)'}`;
  77  |           } catch (error) {
  78  |             return `waiting:lookup:${error instanceof Error ? error.message : 'row lookup failed'}`;
  79  |           }
  80  |         },
  81  |         { timeout: timeoutMs, intervals: [intervalMs, intervalMs, intervalMs * 2] },
  82  |       )
> 83  |       .toBe('ready');
      |        ^ Error: expect(received).toBe(expected) // Object.is equality
  84  | 
  85  |     if (!resolvedFileId) {
  86  |       const { row } = await this.readStatusAndStage(fileName, fileId);
  87  |       resolvedFileId = await this.uploadPage.readFileIdFromRow(row);
  88  |     }
  89  |     return resolvedFileId;
  90  |   }
  91  | 
  92  |   async pollPastExtractProcessing(
  93  |     fileName: string,
  94  |     options: UploadGridPollOptions = {},
  95  |     fileId?: string,
  96  |   ): Promise<string> {
  97  |     const intervalMs = options.intervalMs ?? 2_000;
  98  |     const maxAttempts = options.maxAttempts ?? 3;
  99  |     const timeoutMs = Math.max(T * 3, maxAttempts * intervalMs);
  100 | 
  101 |     let resolvedFileId = '';
  102 | 
  103 |     await expect
  104 |       .poll(
  105 |         async () => {
  106 |           await this.uploadPage.refreshRecentlyUploadedGrid();
  107 |           const { row, status, stage } = await this.readStatusAndStage(fileName, fileId);
  108 | 
  109 |           const isExtractProcessing = /extract/i.test(status) && /processing/i.test(stage);
  110 |           const isStillUploaded =
  111 |             /uploaded/i.test(stage) &&
  112 |             !/waiting|review|completed|attention|extract|processing/i.test(status);
  113 | 
  114 |           if (!isExtractProcessing && !isStillUploaded) {
  115 |             resolvedFileId = await this.uploadPage.readFileIdFromRow(row);
  116 |             return 'ready';
  117 |           }
  118 | 
  119 |           return `processing:${status || '(empty)'}:${stage}`;
  120 |         },
  121 |         { timeout: timeoutMs, intervals: [intervalMs, intervalMs, intervalMs * 2] },
  122 |       )
  123 |       .toBe('ready');
  124 | 
  125 |     if (!resolvedFileId) {
  126 |       const { row } = await this.readStatusAndStage(fileName, fileId);
  127 |       resolvedFileId = await this.uploadPage.readFileIdFromRow(row);
  128 |     }
  129 |     return resolvedFileId;
  130 |   }
  131 | 
  132 |   /**
  133 |    * Wait until upload stage is Completed, refreshing while stage still contains "processing".
  134 |    */
  135 |   async pollUntilStageCompleted(
  136 |     fileName: string,
  137 |     options: UploadGridPollOptions = {},
  138 |     fileId?: string,
  139 |   ): Promise<string> {
  140 |     const maxAttempts = options.maxAttempts ?? 15;
  141 |     const intervalMs = options.intervalMs ?? 2_000;
  142 |     const completedPattern = /completed/i;
  143 | 
  144 |     for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  145 |       await this.uploadPage.ensureOnUploadPage();
  146 |       try {
  147 |         const { row, stage } = await this.readStatusAndStage(fileName, fileId);
  148 |         if (completedPattern.test(stage)) {
  149 |           return this.uploadPage.readFileIdFromRow(row);
  150 |         }
  151 |         if (!/processing/i.test(stage) && attempt === maxAttempts) {
  152 |           throw new Error(
  153 |             `Upload "${fileName}" stage "${stage}" did not reach Completed after ${maxAttempts} attempts`,
  154 |           );
  155 |         }
  156 |       } catch (error) {
  157 |         const message = error instanceof Error ? error.message : String(error);
  158 |         // Stale AG Grid row after Complete Review refresh — re-resolve next attempt.
  159 |         if (!/not attached|not stable|detached/i.test(message) || attempt === maxAttempts) {
  160 |           throw error;
  161 |         }
  162 |       }
  163 |       await this.uploadPage.waitMs(intervalMs);
  164 |       await this.uploadPage.refreshRecentlyUploadedGrid();
  165 |     }
  166 | 
  167 |     const { row, stage } = await this.readStatusAndStage(fileName, fileId);
  168 |     if (!completedPattern.test(stage)) {
  169 |       throw new Error(`Upload "${fileName}" stage "${stage}" is not Completed`);
  170 |     }
  171 |     return this.uploadPage.readFileIdFromRow(row);
  172 |   }
  173 | 
  174 |   async expectRecentlyUploadedInProgress(
  175 |     file: PreparedStatementFile,
  176 |     uploadedByTag: string,
  177 |   ): Promise<RecentlyUploadedRow> {
  178 |     const row = await this.uploadPage.findStoredRowByFileName(file.fileName, T * 2);
  179 |     const uploadedCell = await this.uploadPage.readCellText(row, STATEMENT_UPLOAD.gridColumns.uploaded);
  180 |     const rowText = await row.innerText();
  181 |     const uploadedByMatch =
  182 |       uploadedCell.toLowerCase().includes(uploadedByTag.toLowerCase()) ||
  183 |       rowText.toLowerCase().includes(uploadedByTag.toLowerCase());
```