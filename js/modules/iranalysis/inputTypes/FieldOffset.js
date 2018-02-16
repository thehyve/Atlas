define(['knockout'], function (ko) {

	function FieldOffset(data, defaultOffset = 0) {
		var self = this;
		data = data || {};

		self.DateField = ko.observable(data.DateField || "StartDate");
		self.Offset = ko.observable(data.Offset || defaultOffset);
	}

	FieldOffset.prototype.toJSON = function () {
		return this;
	}
	
	return FieldOffset;
	
});