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

        self.getResults = function (source, targetId, outcomeId) {
            var summaryList = source.info().summaryList;
            return summaryList.filter(function (item) {
                return (item.targetId == targetId && item.outcomeId == outcomeId);
            })[0] || {totalPersons: 0, cases: 0, timeAtRisk: 0};
        };

    }

    var component = {
        viewModel: dashboardResultsViewer,
        template: template
    };

    return component;
});