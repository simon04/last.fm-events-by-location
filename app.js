'use strict';

var lastFm = angular.module('LastFm', ['ngRoute']);

lastFm.config(['$routeProvider', function($routeProvider) {
  $routeProvider.
  when('/events/:location', {redirectTo: '/events/:location/20'}).
  when('/events/:location/:distance', {templateUrl: 'events.html', controller: LastFmCalendar}).
  otherwise({redirectTo: '/events/Innsbruck'});
}]);

lastFm.directive('miniCalendar', function() {
  'use strict';
  return {
    scope: {
      date: '=ngDate'
    },
    templateUrl: 'mini-calendar.html',
    controller: function($scope) {
      $scope.datem = moment.utc($scope.date);
      $scope.weeks = _.range(
        moment.utc($scope.date).startOf('month').startOf('week').unix(),
        moment.utc($scope.date).endOf('month').startOf('week').unix() + 1,
        86400 * 7
      ).map(function(w) {
        return _.range(w, w + 86400 * 7, 86400).map(moment.unix).map(moment.utc);
      });

      $scope.getDateClasses = function(d1, d2) {
        console.log(d1.startOf('day').format(), d2.startOf('day').format());
        return {
          'date-othermonth': d1.month() !== d2.month(),
          'date-sameday': d1.startOf('day').unix() === d2.startOf('day').unix(),
          'date-today': d1.startOf('day').unix() === moment.utc().startOf('day').unix()
        };
      };
    }
  };
});

function LastFmCalendar($scope, $routeParams, $http, $location) {

  $scope.location = $routeParams.location;
  $scope.distance = $routeParams.distance;

  $http.get('http://ws.audioscrobbler.com/2.0/', {
    headers: {
      'Accept': 'application/xml'
    },
    cache: true,
    params: {
      method: 'geo.getEvents',
      location: $scope.location,
      distance: $scope.distance,
      limit: 200,
      api_key: '6a784d8c155badb9591723ef67d17478',
      format: 'json'
    }
  }).then(function(lastfm) {
    $scope.events = lastfm.data.events.event;
  });

  $scope.path = function(path) {
    $location.path(path);
  };

  $scope.filterList = function(events) {
    _.mixin({
      pluckArray: function(obj, key) {
        return _.map(obj, function(value) {
         return _.reduce(key, function(v, k) {
          return v[k];
        }, value);
       });
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