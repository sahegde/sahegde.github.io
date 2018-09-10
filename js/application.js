'use strict';

var locations = [
	{
		name: 'Polar bear',
		latitude: 12.909161,
		longitude: 77.562682
	},
	{
		name: 'RVR fibrenet',
		latitude: 12.907571,
		longitude: 77.563773
	},
	{
		name: 'Sagar Hospitals',
		latitude: 12.908047,
		longitude: 77.565112
	},
	{
		name: 'Sagar deluxe',
		latitude: 12.907393,
		longitude: 77.565586
	},
	{
		name: 'Bangalore one',
		latitude: 12.907963,
		longitude: 77.563867
	}
];

function handleError() {
	alert("There is an error loading Google Maps. Please Try Again.");
}

var map;
var clientID;
var clientSecret;


function startApp() {
	ko.applyBindings(new ViewModel());
}

String.prototype.format = function (){
    var args = arguments;
    return this.replace(/\{\{|\}\}|\{(\d+)\}/g, function (curlyBrack, index) {
        return ((curlyBrack == "{{") ? "{" : ((curlyBrack == "}}") ? "}" : args[index]));
    });
};

var Location = function(data) {
	var self = this;
	this.name = data.name;
	this.latitude = data.latitude;
	this.longitude = data.longitude;
	this.URL = "";
	this.street = "";
	this.city = "";

	this.visible = ko.observable(true);

	var version = 20160118;
	var fourSqTemplate = 'https://api.foursquare.com/v2/venues/search?ll={0},{1}' +
	'&client_id={2}&client_secret={3}&query={4}&v={5}';

	var foursquareURL = fourSqTemplate.format(this.latitude,this.longitude,clientID,clientSecret,this.name,"20160118");
	$.getJSON(foursquareURL).done(function(data) {
		var results = data.response.venues[0];
		self.URL = results.url;
		if (typeof self.URL === 'undefined'){
			self.URL = "";
		}
		self.street = results.location.formattedAddress[0];
     	self.city = results.location.formattedAddress[1];
	}).fail(function() {
		alert("Foursquare api call error. Please refresh the page and try again later.");
	});

	this.placeInfo = '<div class="info-window-content"><div class="title"><b>' + data.name + "</b></div>" +
        '<div class="content"><a href="' + self.URL +'">' + self.URL + "</a></div>" +
        '<div class="content">' + self.street + "</div>" +
        '<div class="content">' + self.city + "</div>";

	this.infoWindow = new google.maps.InfoWindow({content: self.placeInfo});

	this.marker = new google.maps.Marker({
			position: new google.maps.LatLng(data.latitude, data.longitude),
			map: map,
			title: data.name
	});

	this.showMarker = ko.computed(function() {
		if(this.visible() === true) {
			this.marker.setMap(map);
		} else {
			this.marker.setMap(null);
		}
		return true;
	}, this);

	this.marker.addListener('click', function(){
		self.placeInfo = '<div class="info-window-content"><div class="title"><b>' + data.name + "</b></div>" +
        '<div class="content"><a href="' + self.URL +'">' + self.URL + "</a></div>" +
        '<div class="content">' + self.street + "</div>" +
        '<div class="content">' + self.city + "</div></div>";

        self.infoWindow.setContent(self.placeInfo);

		self.infoWindow.open(map, this);

		self.marker.setAnimation(google.maps.Animation.BOUNCE);
      	setTimeout(function() {
      		self.marker.setAnimation(null);
     	}, 2100);
	});

	this.bounce = function(place) {
		google.maps.event.trigger(self.marker, 'click');
	};
};

function ViewModel() {
	var self = this;

	this.searchTerm = ko.observable("");

	this.locationList = ko.observableArray([]);

	map = new google.maps.Map(document.getElementById('map'), {
			zoom: 18,
			center: {lat: 12.907761, lng: 77.564362}
	});

	// Created an app in foursquare and below are the client id and secret
	clientID = "EOKHSKKIFE22MDOXVSLZNYC1PNNYZUEO14RRL0RZGBHRI3ZH";
	clientSecret = "V43G5ZL23JSU0UAELHX2V3254Z0PCNGHMRY5P2VZE1QQHBKU";

	locations.forEach(function(locationItem){
		self.locationList.push( new Location(locationItem));
	});

	this.filteredList = ko.computed( function() {
		var filter = self.searchTerm().toLowerCase();
		if (!filter) {
			self.locationList().forEach(function(locationItem){
				locationItem.visible(true);
			});
			return self.locationList();
		} else {
			return ko.utils.arrayFilter(self.locationList(), function(locationItem) {
				var string = locationItem.name.toLowerCase();
				var result = (string.search(filter) >= 0);
				locationItem.visible(result);
				return result;
			});
		}
	}, self);

	this.mapElem = document.getElementById('map');
	this.mapElem.style.height = window.innerHeight - 50;
}
