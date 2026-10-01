# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: features\payment-module\payment-module-ach.feature.spec.ts >> Payment Module Regression — ACH (Aetna ACA) >> T004-PAY-ACH — Create Payment disabled when selected amount is below $25
- Location: .features-gen\features\payment-module\payment-module-ach.feature.spec.ts:45:7

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
          - img [ref=e23]
          - generic [ref=e28]: Dashboard
        - button "User Management" [ref=e30] [cursor=pointer]:
          - img [ref=e31]
          - generic [ref=e35]: User Management
        - button "Carriers" [ref=e37] [cursor=pointer]:
          - img [ref=e38]
          - generic [ref=e40]: Carriers
        - button "Agents" [ref=e42] [cursor=pointer]:
          - img [ref=e43]
          - generic [ref=e48]: Agents
        - button "Products" [ref=e50] [cursor=pointer]:
          - img [ref=e51]
          - generic [ref=e55]: Products
        - button "Policies" [ref=e57] [cursor=pointer]:
          - img [ref=e58]
          - generic [ref=e61]: Policies
        - button "Commissions" [ref=e63] [cursor=pointer]:
          - img [ref=e64]
          - generic [ref=e66]: Commissions
          - img [ref=e68]
        - button "Advance" [ref=e71] [cursor=pointer]:
          - img [ref=e72]
          - generic [ref=e78]: Advance
          - img [ref=e80]
        - generic [ref=e82]:
          - button "Statements" [ref=e83] [cursor=pointer]:
            - img [ref=e84]
            - generic [ref=e87]: Statements
            - img [ref=e89]
          - generic [ref=e91]:
            - button "Upload" [ref=e93] [cursor=pointer]:
              - generic [ref=e95]: Upload
            - button "History" [ref=e97] [cursor=pointer]:
              - generic [ref=e98]: History
            - button "Needs Attention" [ref=e100] [cursor=pointer]:
              - generic [ref=e101]: Needs Attention
        - button "Payment Processing" [ref=e103] [cursor=pointer]:
          - img [ref=e104]
          - generic [ref=e106]: Payment Processing
          - img [ref=e108]
        - button "Settings" [ref=e111] [cursor=pointer]:
          - img [ref=e112]
          - generic [ref=e115]: Settings
          - img [ref=e117]
        - button "Agency Configuration" [ref=e120] [cursor=pointer]:
          - img [ref=e121]
          - generic [ref=e124]: Agency Configuration
          - img [ref=e126]
      - button "Open user menu" [ref=e132] [cursor=pointer]:
        - generic [ref=e135]: DO
        - generic [ref=e136]:
          - paragraph [ref=e137]: Deva Prod Ops
          - paragraph [ref=e138]: Operations Manager
      - generic [ref=e139]: V20260924.01
    - main [ref=e141]:
      - generic [ref=e144]:
        - generic [ref=e145]:
          - heading "Upload Commission Statement" [level=1] [ref=e146]
          - paragraph [ref=e147]: Upload carrier commission files in CSV or Excel format.
        - generic [ref=e149]:
          - generic [ref=e152]:
            - generic [ref=e153]: Statement File*
            - generic [ref=e154]:
              - img [ref=e156]
              - paragraph [ref=e159]: Drag and drop file here
              - button "Browse" [ref=e161] [cursor=pointer]:
                - generic [ref=e163]: Browse
              - paragraph
          - generic [ref=e164]:
            - generic [ref=e165]:
              - generic [ref=e167]:
                - button "Select type..." [ref=e168] [cursor=pointer]:
                  - generic [ref=e170]: Select type...
                  - img [ref=e171]
                - generic [ref=e173]: Statement Type*
              - generic [ref=e175]:
                - textbox "Auto-detect" [disabled] [ref=e176]
                - generic [ref=e177]:
                  - text: Product Type
                  - img [ref=e178]
              - generic [ref=e182]:
                - textbox "Auto-detect" [disabled] [ref=e183]
                - generic [ref=e184]:
                  - text: Carrier
                  - img [ref=e185]
              - generic [ref=e190]:
                - img [ref=e192] [cursor=pointer]
                - textbox "MM/DD/YYYY" [ref=e194] [cursor=pointer]: 10/06/2026
                - img [ref=e196] [cursor=pointer]
                - generic [ref=e199]: Processing Date*
              - generic [ref=e202]:
                - img [ref=e204] [cursor=pointer]
                - textbox "MM/DD/YYYY" [ref=e206] [cursor=pointer]
                - generic [ref=e207]: Statement Date
            - generic [ref=e208]:
              - button "Cancel" [ref=e209] [cursor=pointer]:
                - generic [ref=e211]: Cancel
              - button "Upload Statement" [disabled]:
                - generic:
                  - generic: Upload Statement
        - generic [ref=e212]:
          - grid "Data grid" [ref=e214]:
            - status [ref=e215]: 51 rows loaded
            - generic [ref=e216]:
              - generic [ref=e217]:
                - generic [ref=e219]:
                  - heading "Recently Uploaded Statements" [level=2] [ref=e220]
                  - button "No Refresh" [ref=e224] [cursor=pointer]:
                    - generic [ref=e226]: No Refresh
                    - img [ref=e227]
                - generic [ref=e229]:
                  - button "Export grid data to Excel" [ref=e230] [cursor=pointer]:
                    - img [ref=e233]
                  - button "Refresh grid data" [active] [ref=e236] [cursor=pointer]:
                    - img [ref=e239]
              - grid [ref=e252]:
                - rowgroup [ref=e253]:
                  - row "File Name Statement Type Line Items Carrier Uploaded Updated At Stage Status Actions" [ref=e254]:
                    - columnheader "File Name" [ref=e255]:
                      - generic [ref=e257] [cursor=pointer]: File Name
                      - text: 
                      - img [ref=e260] [cursor=pointer]
                    - columnheader "Statement Type" [ref=e265]:
                      - generic [ref=e267] [cursor=pointer]: Statement Type
                      - text: 
                      - img [ref=e270] [cursor=pointer]
                    - columnheader "Line Items" [ref=e275]:
                      - generic [ref=e277] [cursor=pointer]: Line Items
                      - text: 
                      - img [ref=e280] [cursor=pointer]
                    - columnheader "Carrier" [ref=e285]:
                      - generic [ref=e287] [cursor=pointer]: Carrier
                      - text: 
                      - img [ref=e290] [cursor=pointer]
                    - columnheader "Uploaded" [ref=e295]:
                      - generic [ref=e297] [cursor=pointer]: Uploaded
                      - text: 
                      - img [ref=e300] [cursor=pointer]
                    - columnheader "Updated At" [ref=e305]:
                      - generic [ref=e307] [cursor=pointer]: Updated At
                      - text: 
                      - img [ref=e310] [cursor=pointer]
                    - columnheader "Stage" [ref=e315]:
                      - generic [ref=e317] [cursor=pointer]: Stage
                      - text: 
                      - img [ref=e320] [cursor=pointer]
                    - columnheader "Status" [ref=e325]:
                      - generic [ref=e327] [cursor=pointer]: Status
                      - text: 
                      - img [ref=e330] [cursor=pointer]
                    - columnheader "Actions" [ref=e335]:
                      - generic [ref=e337]: Actions
                      - text: 
                - rowgroup [ref=e338]:
                  - row "[MLB]PaymentModule-ACH-NB-1790777094731.xlsx Aetna ACA 0 Aetna 09/30/2026 19:35:01 Deva Prod Ops 09/30/2026 19:35:15 Extract Error" [ref=e339] [cursor=pointer]:
                    - gridcell "[MLB]PaymentModule-ACH-NB-1790777094731.xlsx" [ref=e340]:
                      - generic [ref=e343]: "[MLB]PaymentModule-ACH-NB-1790777094731.xlsx"
                    - gridcell "Aetna ACA" [ref=e344]:
                      - generic [ref=e346]: Aetna ACA
                    - gridcell "0" [ref=e347]:
                      - generic [ref=e349]: "0"
                    - gridcell "Aetna" [ref=e350]:
                      - generic [ref=e352]: Aetna
                    - gridcell "09/30/2026 19:35:01 Deva Prod Ops" [ref=e353]:
                      - generic [ref=e355]:
                        - generic [ref=e356]: 09/30/2026 19:35:01
                        - generic [ref=e357]: Deva Prod Ops
                    - gridcell "09/30/2026 19:35:15" [ref=e358]:
                      - generic [ref=e360]: 09/30/2026 19:35:15
                    - gridcell "Extract" [ref=e361]:
                      - generic [ref=e364]: Extract
                    - gridcell "Error" [ref=e365]:
                      - generic [ref=e369]: Error
                    - gridcell [ref=e370]
                  - row "[MLB]PaymentModule-CHK-NB-1790776923713.xlsx Aetna ACA 0 Aetna 09/30/2026 19:32:11 Deva Prod Ops 09/30/2026 19:32:24 Extract Error" [ref=e373] [cursor=pointer]:
                    - gridcell "[MLB]PaymentModule-CHK-NB-1790776923713.xlsx" [ref=e374]:
                      - generic [ref=e377]: "[MLB]PaymentModule-CHK-NB-1790776923713.xlsx"
                    - gridcell "Aetna ACA" [ref=e378]:
                      - generic [ref=e380]: Aetna ACA
                    - gridcell "0" [ref=e381]:
                      - generic [ref=e383]: "0"
                    - gridcell "Aetna" [ref=e384]:
                      - generic [ref=e386]: Aetna
                    - gridcell "09/30/2026 19:32:11 Deva Prod Ops" [ref=e387]:
                      - generic [ref=e389]:
                        - generic [ref=e390]: 09/30/2026 19:32:11
                        - generic [ref=e391]: Deva Prod Ops
                    - gridcell "09/30/2026 19:32:24" [ref=e392]:
                      - generic [ref=e394]: 09/30/2026 19:32:24
                    - gridcell "Extract" [ref=e395]:
                      - generic [ref=e398]: Extract
                    - gridcell "Error" [ref=e399]:
                      - generic [ref=e403]: Error
                    - gridcell [ref=e404]
                  - row "[MLB]PaymentModule-ACH-NB-1790776820399.xlsx Aetna ACA 0 Aetna 09/30/2026 19:30:26 Deva Prod Ops 09/30/2026 19:30:37 Extract Error" [ref=e407] [cursor=pointer]:
                    - gridcell "[MLB]PaymentModule-ACH-NB-1790776820399.xlsx" [ref=e408]:
                      - generic [ref=e411]: "[MLB]PaymentModule-ACH-NB-1790776820399.xlsx"
                    - gridcell "Aetna ACA" [ref=e412]:
                      - generic [ref=e414]: Aetna ACA
                    - gridcell "0" [ref=e415]:
                      - generic [ref=e417]: "0"
                    - gridcell "Aetna" [ref=e418]:
                      - generic [ref=e420]: Aetna
                    - gridcell "09/30/2026 19:30:26 Deva Prod Ops" [ref=e421]:
                      - generic [ref=e423]:
                        - generic [ref=e424]: 09/30/2026 19:30:26
                        - generic [ref=e425]: Deva Prod Ops
                    - gridcell "09/30/2026 19:30:37" [ref=e426]:
                      - generic [ref=e428]: 09/30/2026 19:30:37
                    - gridcell "Extract" [ref=e429]:
                      - generic [ref=e432]: Extract
                    - gridcell "Error" [ref=e433]:
                      - generic [ref=e437]: Error
                    - gridcell [ref=e438]
                  - row "[MLB]PaymentModule-ACH-NB-1790776742904.xlsx Aetna ACA 0 Aetna 09/30/2026 19:29:08 Deva Prod Ops 09/30/2026 19:29:20 Extract Error" [ref=e441] [cursor=pointer]:
                    - gridcell "[MLB]PaymentModule-ACH-NB-1790776742904.xlsx" [ref=e442]:
                      - generic [ref=e445]: "[MLB]PaymentModule-ACH-NB-1790776742904.xlsx"
                    - gridcell "Aetna ACA" [ref=e446]:
                      - generic [ref=e448]: Aetna ACA
                    - gridcell "0" [ref=e449]:
                      - generic [ref=e451]: "0"
                    - gridcell "Aetna" [ref=e452]:
                      - generic [ref=e454]: Aetna
                    - gridcell "09/30/2026 19:29:08 Deva Prod Ops" [ref=e455]:
                      - generic [ref=e457]:
                        - generic [ref=e458]: 09/30/2026 19:29:08
                        - generic [ref=e459]: Deva Prod Ops
                    - gridcell "09/30/2026 19:29:20" [ref=e460]:
                      - generic [ref=e462]: 09/30/2026 19:29:20
                    - gridcell "Extract" [ref=e463]:
                      - generic [ref=e466]: Extract
                    - gridcell "Error" [ref=e467]:
                      - generic [ref=e471]: Error
                    - gridcell [ref=e472]
                  - row "[MLB]PaymentModule-CHK-NB-1790776577328.xlsx Aetna ACA 0 Aetna 09/30/2026 19:26:29 Deva Prod Ops 09/30/2026 19:26:40 Extract Error" [ref=e475] [cursor=pointer]:
                    - gridcell "[MLB]PaymentModule-CHK-NB-1790776577328.xlsx" [ref=e476]:
                      - generic [ref=e479]: "[MLB]PaymentModule-CHK-NB-1790776577328.xlsx"
                    - gridcell "Aetna ACA" [ref=e480]:
                      - generic [ref=e482]: Aetna ACA
                    - gridcell "0" [ref=e483]:
                      - generic [ref=e485]: "0"
                    - gridcell "Aetna" [ref=e486]:
                      - generic [ref=e488]: Aetna
                    - gridcell "09/30/2026 19:26:29 Deva Prod Ops" [ref=e489]:
                      - generic [ref=e491]:
                        - generic [ref=e492]: 09/30/2026 19:26:29
                        - generic [ref=e493]: Deva Prod Ops
                    - gridcell "09/30/2026 19:26:40" [ref=e494]:
                      - generic [ref=e496]: 09/30/2026 19:26:40
                    - gridcell "Extract" [ref=e497]:
                      - generic [ref=e500]: Extract
                    - gridcell "Error" [ref=e501]:
                      - generic [ref=e505]: Error
                    - gridcell [ref=e506]
                  - row "[MLB]PaymentModule-ACH-NB-1790776488378.xlsx Aetna ACA 0 Aetna 09/30/2026 19:24:54 Deva Prod Ops 09/30/2026 19:25:05 Extract Error" [ref=e509] [cursor=pointer]:
                    - gridcell "[MLB]PaymentModule-ACH-NB-1790776488378.xlsx" [ref=e510]:
                      - generic [ref=e513]: "[MLB]PaymentModule-ACH-NB-1790776488378.xlsx"
                    - gridcell "Aetna ACA" [ref=e514]:
                      - generic [ref=e516]: Aetna ACA
                    - gridcell "0" [ref=e517]:
                      - generic [ref=e519]: "0"
                    - gridcell "Aetna" [ref=e520]:
                      - generic [ref=e522]: Aetna
                    - gridcell "09/30/2026 19:24:54 Deva Prod Ops" [ref=e523]:
                      - generic [ref=e525]:
                        - generic [ref=e526]: 09/30/2026 19:24:54
                        - generic [ref=e527]: Deva Prod Ops
                    - gridcell "09/30/2026 19:25:05" [ref=e528]:
                      - generic [ref=e530]: 09/30/2026 19:25:05
                    - gridcell "Extract" [ref=e531]:
                      - generic [ref=e534]: Extract
                    - gridcell "Error" [ref=e535]:
                      - generic [ref=e539]: Error
                    - gridcell [ref=e540]
                  - row "[MLB]PaymentModule-ACH-NB-1790776408435.xlsx Aetna ACA 0 Aetna 09/30/2026 19:23:33 Deva Prod Ops 09/30/2026 19:23:45 Extract Error" [ref=e543] [cursor=pointer]:
                    - gridcell "[MLB]PaymentModule-ACH-NB-1790776408435.xlsx" [ref=e544]:
                      - generic [ref=e547]: "[MLB]PaymentModule-ACH-NB-1790776408435.xlsx"
                    - gridcell "Aetna ACA" [ref=e548]:
                      - generic [ref=e550]: Aetna ACA
                    - gridcell "0" [ref=e551]:
                      - generic [ref=e553]: "0"
                    - gridcell "Aetna" [ref=e554]:
                      - generic [ref=e556]: Aetna
                    - gridcell "09/30/2026 19:23:33 Deva Prod Ops" [ref=e557]:
                      - generic [ref=e559]:
                        - generic [ref=e560]: 09/30/2026 19:23:33
                        - generic [ref=e561]: Deva Prod Ops
                    - gridcell "09/30/2026 19:23:45" [ref=e562]:
                      - generic [ref=e564]: 09/30/2026 19:23:45
                    - gridcell "Extract" [ref=e565]:
                      - generic [ref=e568]: Extract
                    - gridcell "Error" [ref=e569]:
                      - generic [ref=e573]: Error
                    - gridcell [ref=e574]
                  - row "[MLB]PaymentModule-CHK-NB-1790776241725.xlsx Aetna ACA 0 Aetna 09/30/2026 19:20:47 Deva Prod Ops 09/30/2026 19:20:59 Extract Error" [ref=e577] [cursor=pointer]:
                    - gridcell "[MLB]PaymentModule-CHK-NB-1790776241725.xlsx" [ref=e578]:
                      - generic [ref=e581]: "[MLB]PaymentModule-CHK-NB-1790776241725.xlsx"
                    - gridcell "Aetna ACA" [ref=e582]:
                      - generic [ref=e584]: Aetna ACA
                    - gridcell "0" [ref=e585]:
                      - generic [ref=e587]: "0"
                    - gridcell "Aetna" [ref=e588]:
                      - generic [ref=e590]: Aetna
                    - gridcell "09/30/2026 19:20:47 Deva Prod Ops" [ref=e591]:
                      - generic [ref=e593]:
                        - generic [ref=e594]: 09/30/2026 19:20:47
                        - generic [ref=e595]: Deva Prod Ops
                    - gridcell "09/30/2026 19:20:59" [ref=e596]:
                      - generic [ref=e598]: 09/30/2026 19:20:59
                    - gridcell "Extract" [ref=e599]:
                      - generic [ref=e602]: Extract
                    - gridcell "Error" [ref=e603]:
                      - generic [ref=e607]: Error
                    - gridcell [ref=e608]
                  - row "[MLB]PaymentModule-ACH-NB-1790776149051.xlsx Aetna ACA 0 Aetna 09/30/2026 19:19:16 Deva Prod Ops 09/30/2026 19:19:27 Extract Error" [ref=e611] [cursor=pointer]:
                    - gridcell "[MLB]PaymentModule-ACH-NB-1790776149051.xlsx" [ref=e612]:
                      - generic [ref=e615]: "[MLB]PaymentModule-ACH-NB-1790776149051.xlsx"
                    - gridcell "Aetna ACA" [ref=e616]:
                      - generic [ref=e618]: Aetna ACA
                    - gridcell "0" [ref=e619]:
                      - generic [ref=e621]: "0"
                    - gridcell "Aetna" [ref=e622]:
                      - generic [ref=e624]: Aetna
                    - gridcell "09/30/2026 19:19:16 Deva Prod Ops" [ref=e625]:
                      - generic [ref=e627]:
                        - generic [ref=e628]: 09/30/2026 19:19:16
                        - generic [ref=e629]: Deva Prod Ops
                    - gridcell "09/30/2026 19:19:27" [ref=e630]:
                      - generic [ref=e632]: 09/30/2026 19:19:27
                    - gridcell "Extract" [ref=e633]:
                      - generic [ref=e636]: Extract
                    - gridcell "Error" [ref=e637]:
                      - generic [ref=e641]: Error
                    - gridcell [ref=e642]
                  - row "[MLB]PaymentModule-ACH-NB-1790776070571.xlsx Aetna ACA 0 Aetna 09/30/2026 19:17:56 Deva Prod Ops 09/30/2026 19:18:08 Extract Error" [ref=e645] [cursor=pointer]:
                    - gridcell "[MLB]PaymentModule-ACH-NB-1790776070571.xlsx" [ref=e646]:
                      - generic [ref=e649]: "[MLB]PaymentModule-ACH-NB-1790776070571.xlsx"
                    - gridcell "Aetna ACA" [ref=e650]:
                      - generic [ref=e652]: Aetna ACA
                    - gridcell "0" [ref=e653]:
                      - generic [ref=e655]: "0"
                    - gridcell "Aetna" [ref=e656]:
                      - generic [ref=e658]: Aetna
                    - gridcell "09/30/2026 19:17:56 Deva Prod Ops" [ref=e659]:
                      - generic [ref=e661]:
                        - generic [ref=e662]: 09/30/2026 19:17:56
                        - generic [ref=e663]: Deva Prod Ops
                    - gridcell "09/30/2026 19:18:08" [ref=e664]:
                      - generic [ref=e666]: 09/30/2026 19:18:08
                    - gridcell "Extract" [ref=e667]:
                      - generic [ref=e670]: Extract
                    - gridcell "Error" [ref=e671]:
                      - generic [ref=e675]: Error
                    - gridcell [ref=e676]
                  - row "[MLB]PaymentModule-CHK-NB-1790775903836.xlsx Aetna ACA 0 Aetna 09/30/2026 19:15:09 Deva Prod Ops 09/30/2026 19:15:21 Extract Error" [ref=e679] [cursor=pointer]:
                    - gridcell "[MLB]PaymentModule-CHK-NB-1790775903836.xlsx" [ref=e680]:
                      - generic [ref=e683]: "[MLB]PaymentModule-CHK-NB-1790775903836.xlsx"
                    - gridcell "Aetna ACA" [ref=e684]:
                      - generic [ref=e686]: Aetna ACA
                    - gridcell "0" [ref=e687]:
                      - generic [ref=e689]: "0"
                    - gridcell "Aetna" [ref=e690]:
                      - generic [ref=e692]: Aetna
                    - gridcell "09/30/2026 19:15:09 Deva Prod Ops" [ref=e693]:
                      - generic [ref=e695]:
                        - generic [ref=e696]: 09/30/2026 19:15:09
                        - generic [ref=e697]: Deva Prod Ops
                    - gridcell "09/30/2026 19:15:21" [ref=e698]:
                      - generic [ref=e700]: 09/30/2026 19:15:21
                    - gridcell "Extract" [ref=e701]:
                      - generic [ref=e704]: Extract
                    - gridcell "Error" [ref=e705]:
                      - generic [ref=e709]: Error
                    - gridcell [ref=e710]
                  - row "[MLB]PaymentModule-ACH-NB-1790775811594.xlsx Aetna ACA 0 Aetna 09/30/2026 19:13:38 Deva Prod Ops 09/30/2026 19:13:51 Extract Error" [ref=e713] [cursor=pointer]:
                    - gridcell "[MLB]PaymentModule-ACH-NB-1790775811594.xlsx" [ref=e714]:
                      - generic [ref=e717]: "[MLB]PaymentModule-ACH-NB-1790775811594.xlsx"
                    - gridcell "Aetna ACA" [ref=e718]:
                      - generic [ref=e720]: Aetna ACA
                    - gridcell "0" [ref=e721]:
                      - generic [ref=e723]: "0"
                    - gridcell "Aetna" [ref=e724]:
                      - generic [ref=e726]: Aetna
                    - gridcell "09/30/2026 19:13:38 Deva Prod Ops" [ref=e727]:
                      - generic [ref=e729]:
                        - generic [ref=e730]: 09/30/2026 19:13:38
                        - generic [ref=e731]: Deva Prod Ops
                    - gridcell "09/30/2026 19:13:51" [ref=e732]:
                      - generic [ref=e734]: 09/30/2026 19:13:51
                    - gridcell "Extract" [ref=e735]:
                      - generic [ref=e738]: Extract
                    - gridcell "Error" [ref=e739]:
                      - generic [ref=e743]: Error
                    - gridcell [ref=e744]
                  - row "[MLB]PaymentModule-ACH-NB-1790775731470.xlsx Aetna ACA 0 Aetna 09/30/2026 19:12:17 Deva Prod Ops 09/30/2026 19:12:35 Extract Error" [ref=e747] [cursor=pointer]:
                    - gridcell "[MLB]PaymentModule-ACH-NB-1790775731470.xlsx" [ref=e748]:
                      - generic [ref=e751]: "[MLB]PaymentModule-ACH-NB-1790775731470.xlsx"
                    - gridcell "Aetna ACA" [ref=e752]:
                      - generic [ref=e754]: Aetna ACA
                    - gridcell "0" [ref=e755]:
                      - generic [ref=e757]: "0"
                    - gridcell "Aetna" [ref=e758]:
                      - generic [ref=e760]: Aetna
                    - gridcell "09/30/2026 19:12:17 Deva Prod Ops" [ref=e761]:
                      - generic [ref=e763]:
                        - generic [ref=e764]: 09/30/2026 19:12:17
                        - generic [ref=e765]: Deva Prod Ops
                    - gridcell "09/30/2026 19:12:35" [ref=e766]:
                      - generic [ref=e768]: 09/30/2026 19:12:35
                    - gridcell "Extract" [ref=e769]:
                      - generic [ref=e772]: Extract
                    - gridcell "Error" [ref=e773]:
                      - generic [ref=e777]: Error
                    - gridcell [ref=e778]
                  - row "TransferAgent-Renewal-1790775482544.xlsx Aetna ACA 2 Aetna 09/30/2026 19:08:13 Deva Prod Ops 09/30/2026 19:08:37 Completed" [ref=e781] [cursor=pointer]:
                    - gridcell "TransferAgent-Renewal-1790775482544.xlsx" [ref=e782]:
                      - generic [ref=e785]: TransferAgent-Renewal-1790775482544.xlsx
                    - gridcell "Aetna ACA" [ref=e786]:
                      - generic [ref=e788]: Aetna ACA
                    - gridcell "2" [ref=e789]:
                      - generic [ref=e791]: "2"
                    - gridcell "Aetna" [ref=e792]:
                      - generic [ref=e794]: Aetna
                    - gridcell "09/30/2026 19:08:13 Deva Prod Ops" [ref=e795]:
                      - generic [ref=e797]:
                        - generic [ref=e798]: 09/30/2026 19:08:13
                        - generic [ref=e799]: Deva Prod Ops
                    - gridcell "09/30/2026 19:08:37" [ref=e800]:
                      - generic [ref=e802]: 09/30/2026 19:08:37
                    - gridcell "Completed" [ref=e803]:
                      - generic [ref=e806]: Completed
                    - gridcell [ref=e807]
                    - gridcell [ref=e808]
                - rowgroup
                - rowgroup
                - rowgroup
          - generic [ref=e248]: Showing all 51 records
  - tooltip "Refresh" [ref=e249]:
    - generic [ref=e251]: Refresh
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