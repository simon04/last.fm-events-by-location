"use strict";

angular.module('LastFm', []).config(['$routeProvider', function($routeProvider) {
  $routeProvider.
  when('/events/:location', {redirectTo: '/events/:location/20'}).
  when('/events/:location/:distance', {templateUrl: 'events.html', controller: LastFmCalendar}).
  otherwise({redirectTo: '/events/Innsbruck'});
}]);


function LastFmCalendar($scope, $routeParams, $http, $location) {

  $scope.location = $routeParams.location;
  $scope.distance = $routeParams.distance;

  $scope.events = $http.get('http://ws.audioscrobbler.com/2.0/', {
    headers: {
      'Accept': 'application/xml'
    },
    params: {
      method: 'geo.getEvents',
      location: $scope.location,
      distance: $scope.distance,
      limit: 200,
      api_key: '6a784d8c155badb9591723ef67d17478',
      format: 'json',
      cache: true
    }
  }).then(function(lastfm) {
    return lastfm.data.events.event;
  });

  $scope.path = function(path) {
    $location.path(path);
  };

  $scope.filterList = function(events) {
    _.mixin({
      pluckArray: function(obj, key) {
        return _.map(obj, function(value){
         return _.reduce(key, function(v, k){
          return v[k]; 
        }, value)
       })
      }
    });

    var venues = _.chain(events).pluckArray(['venue', 'name']).value();
    var artists = _.chain(events).pluckArray(['artists', 'artist']).flatten().value();
    var titles = _.chain(events).pluckArray(['title']).flatten().value();
    return _.unique(_.union(venues, artists, titles));
  };

  $scope.humanize = function(date) {
    moment.lang('en', {
      calendar : {
        lastWeek : '[last] dddd [at] LT',
        lastDay : '[Yesterday at] LT',
        sameDay : '[Today]',
        nextDay : '[Tomorrow]',
        nextWeek : 'dddd',
        sameElse : 'LL'
      }
    });
    return moment(date).calendar();
  };

  $scope.asArray = function(x) {
    return Array.isArray(x) ? x : [x];
  };

  $scope.moment = moment;
}