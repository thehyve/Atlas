define(['knockout',
    'jquery',
    'text!./dashboard.html',
    'databindings'
], function (
    ko,
    $,
    template) {

    function dashboardResultsViewer(params) {
        var self = this;

        self.sources = params.sources;
        self.dirtyFlag = params.dirtyFlag;
        self.analysisCohorts = params.analysisCohorts;
        self.dashboardData = ko.observableArray();
        self.availableModes = ko.observableArray(["Cases","Proportion","Rate"]);
        self.activeMode = ko.observable("Cases");
        self.rateSteps = ko.observable(3);

        self.rateMultiplier = ko.pureComputed(function() {
            return Math.pow(10,self.rateSteps());
        });

        self.rateCaption = ko.pureComputed(function() {
            var multiplier = self.rateMultiplier();
            if (multiplier >= 1000)
                multiplier = (multiplier / 1000) + "k";

            switch(self.activeMode()) {
                case "Proportion":
                    return "per " + multiplier  + " persons";
                case "Rate":
                    return "per " + multiplier  + " years at risk";
                default:
                    return "";
            }
        });

        self.getInfo = function (sourceId, targetId, outcomeId) {
            var summaryList = self.sources()[sourceId].info().summaryList;
            return summaryList.filter(function (item) {
                return (item.targetId == targetId && item.outcomeId == outcomeId);
            })[0] || {totalPersons: 0, cases: 0, timeAtRisk: 0};
        };

        self.loadDashboardData = function(sourceId) {
            self.analysisCohorts().targetCohorts().forEach(function(targetCohort) {
                var outcomes = ko.observableArray();
                self.analysisCohorts().outcomeCohorts().forEach(function(outcomeCohort) {
                    var info = self.getInfo(sourceId, targetCohort.id, outcomeCohort.id);

                    var cell = ko.computed(function() {
                        switch(self.activeMode()) {
                            case "Cases":
                                return info.cases;
                            case "Proportion":
                                if (info.totalPersons > 0)
                                    return (info.cases / info.totalPersons * self.rateMultiplier()).toFixed(2);
                                else
                                    return "NA";
                            case "Rate":
                                if (info.timeAtRisk > 0)
                                    return (info.cases / info.timeAtRisk * self.rateMultiplier()).toFixed(2);
                                else
                                    return "NA";
                            default:
                                return "-";
                        }
                    });

                    outcomes.push(cell);
                });

                self.dashboardData.push({
                    'targetCohortName':targetCohort.name,
                    'outcomes':outcomes
                });
            })
        };

        if (self.sources().length > 0) {
            // Load the results of the first source
            self.loadDashboardData(0);
        }

    }

    var component = {
        viewModel: dashboardResultsViewer,
        template: template
    };

    return component;
});