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

        self.analysisId = params.analysisId;
        self.sources = params.sources;
        // self.sources().push({'source':{'sourceName':'Mock Source', 'sourceKey':'mock'},'info':ko.observable({'summaryList':[]})}); // Sometimes overridden, as self.sources can be refreshed from other component
        self.dirtyFlag = params.dirtyFlag;
        self.targetCohorts = params.analysisCohorts().targetCohorts;
        self.outcomeCohorts = params.analysisCohorts().outcomeCohorts;
        self.strata = params.strata;

        self.availableModes = ["Cases","Proportion","Rate"];
        self.selectedMode = ko.observable("Cases");
        self.rateSteps = ko.observable(3);
        self.selectedSourceKey = ko.observable();
        self.strataData = ko.observableArray();

        var Target = function(id, name) {
            var self = this;
            self.id = id;
            self.targetName = name;
            self.reports = [];
            self.strata = [];
            self.doShowStrata = ko.observable(false);

            self.toggleIcon = ko.pureComputed(function() {
                if (self.strata.length === 0) {
                    return "";
                }
                if (self.doShowStrata()) {
                    return "fa fa-minus-square";
                }
                return "fa fa-plus-square";
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
        };

        var Stratum = function(id, name) {
            var self = this;
            self.id = id;
            self.stratumName = name;
            self.reports = [];

            self.add = function(report) {
                this.reports.push(report);
            };
        };

        var Report = function(master, outcomeId, targetId, stratumId) {
            var self = this;
            self.master = master;
            self.outcomeId = outcomeId;
            self.targetId = targetId;
            self.stratumId = stratumId;

            self.irData = ko.pureComputed(function() {
                // Select source
                var source = self.master.selectedSource();

                // Zeroes if no source
                if (!source) {
                    return {totalPersons: 0, cases: 0, timeAtRisk: 0};
                }

                // Note; the stratData object is updated when source is changed.
                if (self.stratumId != null) {
                    return master.strataData().find(function(item) {
                        return item.targetId === self.targetId
                            && item.outcomeId === self.outcomeId
                            && item.id === self.stratumId;
                    }) || {totalPersons: 0, cases: 0, timeAtRisk: 0};
                }

                // Get the summaryList object
                return source.info().summaryList.find(function (item) {
                    return item.targetId === self.targetId
                        && item.outcomeId === self.outcomeId;
                }) || {totalPersons: 0, cases: 0, timeAtRisk: 0};
            });

            self.value = ko.pureComputed(function() {
                var irData = self.irData();
                switch(self.master.selectedMode()) {
                    case "Cases":
                        return irData.cases;
                    case "Proportion":
                        if (irData.totalPersons > 0)
                            return (irData.cases / irData.totalPersons * self.master.rateMultiplier()).toFixed(2);
                        else
                            return "NA";
                    case "Rate":
                        if (irData.timeAtRisk > 0)
                            return (irData.cases / irData.timeAtRisk * self.master.rateMultiplier()).toFixed(2);
                        else
                            return "NA";
                    default:
                        return "-";
                }
            });
        };

        // Dynamically build table
        self.load = ko.computed(function() {
            // Create table with the given number of targets, outcomes and strata.
            self.targets = [];
            self.targetCohorts().forEach(function(targetCohort) {
                var target = new Target(targetCohort.id, targetCohort.name);

                // Create a report for each outcome
                self.outcomeCohorts().forEach(function(outcomeCohort) {
                    target.addReport(new Report(self, outcomeCohort.id, targetCohort.id, null));
                });

                // Create a report for each stratum and outcome
                for(var i = 0;i<self.strata().length;i++) {
                    var stratum = new Stratum(i, self.strata()[i].name);
                    self.outcomeCohorts().forEach(function(outcomeCohort) {
                        stratum.add(new Report(self, outcomeCohort.id, targetCohort.id, i));
                    });
                    target.addStratum(stratum);
                }

                self.targets.push(target);
            });
        });

        // Dynamically retrieve strata info
        self.strataLoaded = ko.computed(function() {
            if (self.strata().length > 0 && self.selectedSourceKey() != null && self.analysisId() > 0) {
                return iraApi.getReports(
                    self.analysisId(),
                    self.selectedSourceKey()
                ).done(function(reports) {
                    reports.forEach(function(report) {
                        report.stratifyStats.forEach(function(stratifyStat) {
                            self.strataData.push(stratifyStat);
                        });
                    });
                    return true;
                }).fail(function() {
                    // Clear all strata data on error
                    self.strataData.removeAll();
                    return false;
                });
            }
            return false;
        });

        self.selectedSource = ko.computed(function() {
            return self.sources().find(function (item) {
                return item.source.sourceKey === self.selectedSourceKey();
            });
        });

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

            switch(self.selectedMode()) {
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

        // TODO: observe when sources object updated.
        // (Re)initilize if source is available or updated
        // if (self.sources().length > 0)
        //     self.init();
        //
        // self.sources.subscribe(function() {
        //     if (self.sources().length > 0)
        //         self.init();
        // });
    }

    var component = {
        viewModel: dashboardResultsViewer,
        template: template
    };

    return component;
});