'use strict';

(function() { 

var mapViewModule =  angular.module('app.mapView', ['ngRoute', 'ngResource', 'uiGmapgoogle-maps','app']);

//routes configuration
mapViewModule.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/map', {
	  	title: 'Mapa',
		templateUrl : 'mapView/map.html'
	});
}]);

//RESTfull client for markers
mapViewModule.factory('Markers',  ['$resource',  function($resource){
	return $resource('service/cateringFacility/near', {}, {
		get: {method:'POST', isArray:true}
	});
}]);

mapViewModule.factory('CateringFacility',  ['$resource',  function($resource){
	return $resource('service/cateringFacility/:id',{id: '@id'});
}]);

//Controllers
mapViewModule.controller("MapCtrl", function($scope, Markers, CateringFacility) {
	var selected = {
		options : {visible : false},	 
	};
	
	$scope.selected = selected;
	
	var t1 = new Date();
    t1.setHours( 10 );
    t1.setMinutes( 0 );
    var t2 = new Date();
    t2.setHours( 14 );
    t2.setMinutes( 0 );
    
    /*
     * Having an empty object results in no rendering, once the data(currentPosition) arrives 
     * from the server then the object is populated with the data and the view 
     * automatically re-renders itself showing the new data.
    */
    $scope.map = {}; 
    
    // Try HTML5 geolocation
    if(navigator.geolocation) {
  	    navigator.geolocation.getCurrentPosition(function(position) {
	  	    
  	    	createMap(position.coords.latitude, position.coords.longitude);
  	    	$scope.$apply();
  	    }, function() {
  	    	handleNoGeolocation(true);
  	    });
  	} else {
  	    // Browser doesn't support Geolocation
  	    handleNoGeolocation(false);
  	}

  	function handleNoGeolocation(errorFlag) { //TODO
  	  if (errorFlag) {
  	    var content = 'Error: The Geolocation service failed.';
  	  } else {
  	    var content = 'Error: Your browser doesn\'t support geolocation.';
  	  }
  	}
	
	function createMap(latitude,longitude){
		$scope.map = {
  	    		center: { latitude: latitude, longitude: longitude}, 
				zoom: 15,
				events : {
				     bounds_changed: _.debounce(function(map){
				    	 var bounds = map.getBounds();
				    	 var ne = bounds.getNorthEast();
				    	 var sw = bounds.getSouthWest(); 
				    	 Markers.get({
				    		  latitudeTop: ne.k,
				    		  longitudeTop: ne.D,
				    		  latitudeBottom: sw.k,
				    		  longitudeBottom: sw.D
				    		}, function(markers,responseHeaders){
				    			//success callback
				    			$scope.map.markers = markers;

				    			setOnClickHandler(markers);
				    		});
				     },333, false)   
				},
				markers: []	
  	    };
	};
	
	function setOnClickHandler(markers){
		_.each(markers, function (marker) {
  		  	//move infowindow below the marker
			marker.options = {visible : false, pixelOffset: new google.maps.Size(0, -25, 'px', 'px')};
			marker.closeClick = function () {
				$scope.selected.options.visible = false;
				return $scope.$apply();	
			};
			marker.onClicked = markerClicked.bind(marker);
		});
		$scope.$apply();
	}
	
	function markerClicked() {
		var marker = this;
		
		var cateringFacility = CateringFacility.get({},marker, function(){
			marker.title =  cateringFacility.title;
			marker.category = cateringFacility.category;
			marker.tags =  cateringFacility.tags;
			marker.openingHours =  cateringFacility.openingHours;
			marker.options.visible = true;
			$scope.selected = marker;
		});
	}
	
});

mapViewModule.controller('MenuController', function($scope, $filter){
	this.menuToString = function(menu){
		if(menu == null){
			return "Restaurace nemá denní menu";
		} else{
			
			return "Od " + $filter('date')(menu.from,"HH:mm") + " Do " +  $filter('date')(menu.to,"HH:mm"); 
		}
	}	
});

})();