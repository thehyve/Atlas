## Developer notes

### JS object structure
In results.js/dashboard.js:
- `self.analysisCohorts`
  Created in ir-manager.js, line 65
  * `outcomeCohorts`
    * `id`
    * `name`
  * `targetCohorts`
    * `id`
    * `name`
    
- `self.sources`
  Created in ir-manager.js line 225 and ir info loaded on 20
  * `source`[] For every data source
    * `source`
      * `sourceId`
      * `sourceName`
      * `sourceKey`
      * `sourceDialect`
      * `daimons`[]
    * `info`
    Retrieved from WebApi: [http://localhost:8080/WebAPI/ir/15/info]()
      * `summaryList`[] For every target/outcome pair
        * `targetId`
        * `outcomeId`
        * `totalPersons`
        * `timeAtRisk`
        * `cases`
      * `executionInfo`
        * `id.analysisId`, `id.sourceId`, `startTime`, `executionDuration`, `status`, `isValid`, `message`
- Stratification `report` per target & outcome (and data source)
 As returned from `iraApi.getReport(irId, sourceKey, targetId, outcomeId)`
 [http://localhost:8080/WebAPI/ir/15/report/SYN?targetId=5&outcomeId=2]()
  * `summary`
    * `targetId`
    * `outcomeId`
    * `totalPersons`
    * `timeAtRisk`
    * `cases`
  * `stratifyStats`[] For every stratify rule
    * `targetId`
    * `outcomeId`
    * `id` stratify id (starts at 0)
    * `name` stratfiy name
    * `totalPersons`
    * `timeAtRisk`
    * `cases`
- PROPOSED summary `report` per data source
 [http://localhost:8080/WebAPI/ir/15/reports/SYN]()
  * []
    * `summary`
        * `targetId`
        * `outcomeId`
        * `totalPersons`
        * `timeAtRisk`
        * `cases`
    * `stratifyStats`[]
        * `targetId`
        * `outcomeId`
        * `id` stratify id (starts at 0)
        * `name` stratify name
        * `totalPersons`
        * `timeAtRisk`
        * `cases`
    * `treemapData`