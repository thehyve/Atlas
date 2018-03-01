define(['knockout',
    'jquery',
    'text!./dashboard.html',
    'databindings'
], function (
    ko,
    $,
    template) {

    // TODO: reuse methods from component in results.js
    function dashboardResultsViewer(params) {
        var self = this;

        self.sources = params.sources;
        self.dirtyFlag = params.dirtyFlag;
        self.analysisCohorts = params.analysisCohorts;

        self.mode = ko.observable("case");
        self.rateMultiplier = ko.observable(1000);
        self.results = ko.observableArray();

        self.getResults = function (source, targetId, outcomeId) {
            var summaryList = source.info().summaryList;
            return summaryList.filter(function (item) {
                return (item.targetId == targetId && item.outcomeId == outcomeId);
            })[0] || {totalPersons: 0, cases: 0, timeAtRisk: 0};
        };

        self.loadResults = function(source) {
            var summaryList = source.info().summaryList;
            self.analysisCohorts().targetCohorts().forEach(function(targetCohort) {
                var row = ko.observableArray();
                self.analysisCohorts().outcomeCohorts().forEach(function(outcomeCohort) {
                    var info = summaryList.filter(function (item) {
                        return (item.targetId == targetCohort.id && item.outcomeId == outcomeCohort.id);
                    })[0] || {totalPersons: 0, cases: 0, timeAtRisk: 0};

                    var column = ko.computed(function() {
                        switch(self.mode()) {
                            case "case":
                                return info.cases;
                            case "proportion":
                                if (info.totalPersons > 0)
                                    return (info.cases / info.totalPersons * self.rateMultiplier()).toFixed(2);
                                else
                                    return "NA";
                            case "rate":
                                if (info.timeAtRisk > 0)
                                    return (info.cases / (info.timeAtRisk)* self.rateMultiplier()).toFixed(2);
                                else
                                    return "NA";
                            default:
                                return "-";
                        }
                    });

                   row.push({'column':column});
                });
                self.results.push({'name':targetCohort.name, 'data':row});
            })
        };

        if (self.sources().length > 0) {
            self.loadResults(self.sources()[0]);
        }

    }

    var component = {
        viewModel: dashboardResultsViewer,
        template: template
    };

    return component;
});