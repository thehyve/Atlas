define(['knockout', './FieldOffset'], function (ko, FieldOffset) {

	function TimeAtRisk(data) {
		var self = this;
		data = data || {};

		// Default from 0 to 365 days from start
		self.start = new FieldOffset(data.start, 0);
		self.end = new FieldOffset(data.end, 365);

	}
	
	return TimeAtRisk;
});
