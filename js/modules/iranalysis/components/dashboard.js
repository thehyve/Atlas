/*
 * Copyright (c) 2018 The Hyve B.V.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
define(['knockout', 'text!./dashboard.html', 'webapi/IRAnalysisAPI', 'databindings'], function (ko, template, iraApi) {
    function dashboardResultsViewer(params) {
        var self = this;

        self.sources = params.sources;
        // self.sources().push({'source':{'sourceName':'Mock Source', 'sourceKey':'mock'},'info':ko.observable({'summaryList':[]})}); // Sometimes overridden, as self.sources can be refreshed from other component
        self.dirtyFlag = params.dirtyFlag;
        self.targetCohorts = params.analysisCohorts().targetCohorts;
        self.outcomeCohorts = params.analysisCohorts().outcomeCohorts;
        self.strata = params.strata;
        self.selectedSourceKey = ko.observable();
        self.cohortMatrix = ko.observableArray();
        self.availableModes = ko.observableArray(["Cases","Proportion","Rate"]);
        self.activeMode = ko.observable("Cases");
        self.rateSteps = ko.observable(3);

        var Target = function(id, name) {
            var self = this;
            self.id = id;
            self.targetName = name;
            self.reports = ko.observableArray();
            self.strata = ko.observableArray();
            self.doShowStrata = ko.observable(false);

            self.targetNameHtml = ko.pureComputed(function() {
                if (self.strata().length === 0) {
                    return self.targetName;
                }
                if (self.doShowStrata()) {
                    return "<i class=\"fa fa-minus-square\"></i> " + self.targetName;
                }
                return "<i class=\"fa fa-plus-square\"></i> " + self.targetName;
            });

            self.toggleStrata = function() {
                self.doShowStrata(!self.doShowStrata());
            };

            self.addReport = function(report) {
                this.reports.push(report);
            };

            self.addStratum = function(stratum) {
                this.strata.push(stratum);
            };

            self.getReport = function(index) {
                return this.reports()[index];
            };

            self.getStratum = function(index) {
                return this.strata()[index];
            };
        };

        var Stratum = function(id, name) {
            var self = this;
            self.id = id;
            self.stratumName = name;
            self.reports = ko.observableArray();

            self.add = function(report) {
                this.reports.push(report);
            };

            self.getReport = function(index) {
                return this.reports()[index];
            };
        };

        var Report = function(master, id) {
            var self = this;
            self.master = master;
            self.outcomeId = id;
            // TODO: fetch real numbers
            // Steps: 1. make this object aware of its target, outcome and stratum id. 2. create an observable object in the master 3. update this data object whenever data becomes available.
            self.cases = (Math.random()*10).toFixed(0);
            self.totalPersons = self.cases * 3;
            self.timeAtRisk = self.cases * 6;

            self.value = ko.pureComputed(function() {
                switch(self.master.activeMode()) {
                    case "Cases":
                        return self.cases;
                    case "Proportion":
                        if (self.totalPersons > 0)
                            return (self.cases / self.totalPersons * self.master.rateMultiplier()).toFixed(2);
                        else
                            return "NA";
                    case "Rate":
                        if (self.timeAtRisk > 0)
                            return (self.cases / self.timeAtRisk * self.master.rateMultiplier()).toFixed(2);
                        else
                            return "NA";
                    default:
                        return "-";
                }
            });
        };

        self.init = function() {
            // Create table with the given number of targets, outcomes and strata.
            self.targets = ko.observableArray();
            self.targetCohorts().forEach(function(targetCohort) {
                var target = new Target(targetCohort.id, targetCohort.name);

                // Create a report for each outcome
                self.outcomeCohorts().forEach(function(outcomeCohort) {
                    target.addReport(new Report(self, outcomeCohort.id));
                });

                // Create a report for each stratum and outcome
                for(var i = 0;i<self.strata().length;i++) {
                    var stratum = new Stratum(i, self.strata()[i].name);
                    self.outcomeCohorts().forEach(function(outcomeCohort) {
                        stratum.add(new Report(self, outcomeCohort.id));
                    });
                    target.addStratum(stratum);
                }

                self.targets.push(target);
            });
        };

        // self.sources.subscribe(function() {
        //     if (self.sources().length > 0)
        //         self.loadCohortMatrix()
        // });
        //
        // self.loadCohortMatrix = function() {
        //     // For each target and outcome pair, add a cell containing the cases, proportion or rate.
        //     self.cohortMatrix = ko.observableArray();
        //     self.analysisCohorts().targetCohorts().forEach(function(targetCohort) {
        //         var summaryRow = ko.observableArray();
        //         self.analysisCohorts().outcomeCohorts().forEach(function(outcomeCohort) {
        //             var cell = ko.computed(function() {
        //                 var irData = self.getIRdata(self.selectedSourceKey(), targetCohort.id, outcomeCohort.id);
        //                 return self.cellValue(irData);
        //             });
        //             summaryRow.push(cell);
        //         });
        //
        //         self.cohortMatrix.push({
        //             'targetCohortName': targetCohort.name,
        //             'stratumName': null,
        //             'outcomeCells': summaryRow
        //         });
        //
        //         for(var stratumId = 0;stratumId<self.strata().length;stratumId++) {
        //             var stratum = self.strata()[stratumId];
        //             var stratumRow = ko.observableArray();
        //             self.analysisCohorts().outcomeCohorts().forEach(function(outcomeCohort) {
        //                 var strataObject = self.strataObjects[targetCohort.id][outcomeCohort.id][stratumId];
        //
        //                 iraApi.getReport(
        //                     self.sources()[0].info().executionInfo.id.analysisId,
        //                     "CDM5", //self.selectedSourceKey()
        //                     targetCohort.id,
        //                     outcomeCohort.id
        //                 ).then(function(report) {
        //                     var stratumStat = report.stratifyStats.find(function(stat){return stat.id === stratumId});
        //                     strataObject(stratumStat);
        //                 });
        //
        //                 var cell = ko.computed(function() {
        //                     if (stratumId >= self.strata().length) {
        //                         console.log("Huh, this is strange");
        //                         return "";
        //                     }
        //                     // console.log(targetCohort.id);
        //                     // console.log(outcomeCohort.id);
        //                     // console.log(stratumId);
        //                     // console.log(self.strataObjects);
        //                     return self.cellValue(strataObject());
        //                 });
        //
        //                 stratumRow.push(cell);
        //             });
        //
        //             self.cohortMatrix.push({
        //                 'targetCohortName': null,
        //                 'stratumName': stratum.name(),
        //                 'outcomeCells': stratumRow
        //             });
        //         }
        //
        //     });
        // };

        // Table may only be produced when sources are available
        self.sourcesAvailable = ko.pureComputed(function() {
           return self.sources().filter(function(source) { return source.info() != null; }).length > 0;
        });

        self.rateMultiplier = ko.pureComputed(function() {
            return Math.pow(10,self.rateSteps());
        });

        self.rateCaption = ko.pureComputed(function() {
            var multiplier = self.rateMultiplier();
            if (multiplier >= 1000)
                multiplier = (multiplier / 1000) + "k";

            switch(self.activeMode()) {
                case "Cases":
                    return "";
                case "Proportion":
                    return "per " + multiplier  + " persons";
                case "Rate":
                    return "per " + multiplier  + " years at risk";
                default:
                    return "";
            }
        });

        // self.getIRdata = function (sourceKey, targetId, outcomeId) {
        //     var source = self.sources().filter(function (item) {
        //         return (item.source.sourceKey === sourceKey);
        //     })[0];
        //     if (!source) {
        //         return {totalPersons: 0, cases: 0, timeAtRisk: 0};
        //     }
        //
        //     return source.info().summaryList.filter(function (item) {
        //         return (item.targetId === targetId && item.outcomeId === outcomeId);
        //     })[0] || {totalPersons: 0, cases: 0, timeAtRisk: 0};
        // };

        // if (self.sources().length > 0)
        //     self.loadCohortMatrix();

        self.init();
    }

    var component = {
        viewModel: dashboardResultsViewer,
        template: template
    };

    return component;
});