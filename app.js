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
      $scope.today = moment.utc().startOf('day');
      $scope.weeks = _.range(
        moment.utc($scope.date).startOf('month').startOf('week').unix(),
        moment.utc($scope.date).endOf('month').startOf('week').unix() + 1,
        86400 * 7
      ).map(function(w) {
        return _.range(w, w + 86400 * 7, 86400).map(moment.unix).map(moment.utc);
      });

      $scope.getDateClasses = function(d1, d2) {
        return {
          'date-othermonth': d1.month() !== d2.month(),
          'date-sameday': d1.startOf('day').unix() === d2.startOf('day').unix(),
          'date-today': d1.startOf('day').unix() === $scope.today.unix()
        };
      };
    }
  };
});

function LastFmCalendar($scope, $routeParams, $http, $location, filterFilter) {

  $scope.location = $routeParams.location;
  $scope.distance = $routeParams.distance;

  $http.get('http://ws.audioscrobbler.com/2.0/', {
    headers: {
      'Accept': 'application/json'
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
    return lastfm.data.events.event;
  }).then(function(events) {
    return _.map(events, function(e) {
      var a = e.artists.artist;
      e.artistArray = Array.isArray(a) ? a : [a];
      e.startDateFormatted = moment(e.startDate).format();
      e.startDateHumanized = moment(e.startDate).calendar();
      e.thumb = e.image[2]['#text'];
      return e;
    });
  }).then(function(events) {
    $scope.events = events;
    $scope.eventKeywords = $scope.filterList(events);
  });

  $scope.path = function(path) {
    $location.path(path);
  };

  $scope.$watch('events + filter', function() {
    $scope.filteredEvents = filterFilter($scope.events, $scope.filter);
  });

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

}
