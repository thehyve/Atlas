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
    Retrieved from WebApi: [http://localhost:8080/WebAPI/ir/3/info]()
      * `summaryList`[] For every target/outcome pair
        * `targetId`
        * `outcomeId`
        * `totalPersons`
        * `timeAtRisk`
        * `cases`
      * `executionInfo`
        * `id.analysisId`, `id.sourceId`, `startTime`, `executionDuration`, `status`, `isValid`, `message`
    