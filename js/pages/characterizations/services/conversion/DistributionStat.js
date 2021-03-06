define([
	'./PrevalenceStat'
], function (PrevalenceStat) {

    class DistributionStat extends PrevalenceStat {

		constructor(stat) {
			super(stat);
			this.strataId = stat.strataId;
			this.strataName = stat.strataName;
			this.avg = [];
			this.stdDev = [];
			this.median = [];
			this.max = [];
			this.min = [];
			this.p10 = [];
			this.p25 = [];
			this.p75 = [];
			this.p90 = [];
		}
    }

    return DistributionStat;
});
