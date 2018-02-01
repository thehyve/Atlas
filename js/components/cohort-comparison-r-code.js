define(['jquery', 'knockout', 'text!./cohort-comparison-r-code.html', 'appConfig', 'cohortcomparison/ComparativeCohortAnalysis', 'vocabularyprovider', 'nvd3', 'css!./styles/nv.d3.min.css', 'prism', 'css!./styles/prism.css'],
	function ($, ko, view, config, cohortComparison, vocabularyAPI, options) {
		function cohortComparisonRCode(params) {
			var self = this;
			self.config = config;
            self.cohortComparison = params.cohortComparison;
            self.codeElementId = params.codeElementId || 'estimation-r-code-single';
		}

		var component = {
			viewModel: cohortComparisonRCode,
			template: view
		};

		ko.components.register('cohort-comparison-r-code', component);
		return component;
	});