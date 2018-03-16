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
define(['knockout', 'text!./dashboard.html', 'databindings'], function (ko, template) {
    function dashboardResultsViewer(params) {
        var self = this;

        self.sources = params.sources;
        // self.sources().push({'source':{'sourceName':'Mock Source', 'sourceKey':'mock'},'info':ko.observable({'summaryList':[]})}); // Sometimes overridden, as self.sources can be refreshed from other component
        self.dirtyFlag = params.dirtyFlag;
        self.analysisCohorts = params.analysisCohorts;
        self.selectedSourceKey = ko.observable();
        self.cohortMatrix = ko.observableArray();
        self.availableModes = ko.observableArray(["Cases","Proportion","Rate"]);
        self.activeMode = ko.observable("Cases");
        self.rateSteps = ko.observable(3);

        self.sources.subscribe(function() {
            if (self.sources().length > 0)
                self.loadCohortMatrix()
        });

        self.loadCohortMatrix = function() {
            // For each target and outcome pair, add a cell containing the cases, proportion or rate.
            self.cohortMatrix = ko.observableArray();
            self.analysisCohorts().targetCohorts().forEach(function(targetCohort) {
                var outcomeCells = ko.observableArray();
                self.analysisCohorts().outcomeCohorts().forEach(function(outcomeCohort) {
                    var cell = ko.computed(function() {
                        var irData = self.getIRdata(self.selectedSourceKey(), targetCohort.id, outcomeCohort.id);
                        return self.cellValue(irData);
                    });
                    outcomeCells.push(cell);
                });

                self.cohortMatrix.push({
                    'targetCohortName':targetCohort.name,
                    'outcomeCells':outcomeCells
                });
            });
        };

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

        self.cellValue = function(irData) {
            switch(self.activeMode()) {
                case "Cases":
                    return irData.cases;
                case "Proportion":
                    if (irData.totalPersons > 0)
                        return (irData.cases / irData.totalPersons * self.rateMultiplier()).toFixed(2);
                    else
                        return "NA";
                case "Rate":
                    if (irData.timeAtRisk > 0)
                        return (irData.cases / irData.timeAtRisk * self.rateMultiplier()).toFixed(2);
                    else
                        return "NA";
                default:
                    return "-";
            }
        };

        self.getIRdata = function (sourceKey, targetId, outcomeId) {
            var source = self.sources().filter(function (item) {
                return (item.source.sourceKey === sourceKey);
            })[0];
            if (!source) {
                return {totalPersons: 0, cases: 0, timeAtRisk: 0};
            }

            return source.info().summaryList.filter(function (item) {
                return (item.targetId === targetId && item.outcomeId === outcomeId);
            })[0] || {totalPersons: 0, cases: 0, timeAtRisk: 0};
        };

        if (self.sources().length > 0)
            self.loadCohortMatrix();
    }

    var component = {
        viewModel: dashboardResultsViewer,
        template: template
    };

    return component;
});