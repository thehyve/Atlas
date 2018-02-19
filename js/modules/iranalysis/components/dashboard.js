define(['knockout',
    'jquery',
    'text!./dashboard.html',
    'webapi/IRAnalysisAPI',
    'databindings'
], function (
    ko,
    $,
    template,
    iraAPI) {

    function dashboardResultsViewer(params) {
        var self = this;

        self.sources = params.sources;
        self.dirtyFlag = params.dirtyFlag;
        self.analysisCohorts = params.analysisCohorts;
        self.selectedSource = ko.observable();
        self.selectedReport = ko.observable();
        self.rateMultiplier = ko.observable(1000);
        self.selectedTarget = ko.observable();
        self.selectedOutcome = ko.observable();
        self.isLoading = ko.observable();

    }

    var component = {
        viewModel: dashboardResultsViewer,
        template: template
    };

    return component;
});