'use strict';

var lastFm = angular.module('LastFm', ['ngRoute']);

lastFm.config(['$routeProvider', function($routeProvider) {
  $routeProvider.
  when('/events/:location', {
    redirectTo: '/events/:location/20'
  }).when('/events/:location/:distance', {
    templateUrl: 'events.html',
    controller: 'LastFmCalendarController',
    resolve: {
      events: function(eventsService, $route) {
        return eventsService.getEvents($route.current.params.location, $route.current.params.distance);
      }
    }
  }).otherwise({redirectTo: '/events/Innsbruck'});
}]);

lastFm.directive('miniCalendar', function() {
  'use strict';
  return {
    scope: {
      date: '=ngDate'
    },
    templateUrl: 'mini-calendar.html',
    controller: function($scope) {
      var date = moment($scope.date);
      $scope.month = date.format('MMMM YYYY');
      $scope.weeks = _.range(
        moment($scope.date).startOf('month').startOf('week').unix(),
        moment($scope.date).endOf('month').startOf('week').unix() + 1,
        86400 * 7
      ).map(function(w) {
        return _.range(w, w + 86400 * 7, 86400).map(moment.unix).map(function(d) {
          var r = {
            date: d.format('dddd, LL'),
            day: d.format('D'),
            weekday: d.format('dd'),
            classes: {
              'date-othermonth': d.month() !== date.month(),
              'date-sameday': d.startOf('day').unix() === date.startOf('day').unix(),
              'date-today': d.startOf('day').unix() === moment().startOf('day').unix()
            }
          };
          return r;
        });
      });
    }
  };
});

lastFm.factory('eventsService', ['$http', function($http) {
  return {
    getEvents: function(location, distance) {
      return $http.get('http://ws.audioscrobbler.com/2.0/', {
        headers: {
          'Accept': 'application/json'
        },
        cache: true,
        params: {
          method: 'geo.getEvents',
          location: location,
          distance: distance,
          limit: 200,
          api_key: '6a784d8c155badb9591723ef67d17478',
          format: 'json'
        }
      }).then(function(lastfm) {
        return lastfm.data.events.event;
      });
    }
  };
}]);

lastFm.controller('LastFmCalendarController', ['$scope', '$routeParams', 'events', '$location', 'filterFilter', function($scope, $routeParams, events, $location, filterFilter) {

  $scope.location = $routeParams.location;
  $scope.distance = parseInt($routeParams.distance);

  $scope.events = _.map(events, function(e) {
    var a = e.artists.artist;
    e.artistArray = Array.isArray(a) ? a : [a];
    var mom = moment(e.startDate);
    e.startDateFormatted = mom.format();
    e.startDateHumanized = mom.format('ddd, YYYY-MM-DD');
    e.startDateInDays = mom.diff(undefined, 'days');
    e.thumb = e.image[2]['#text'];
    return e;
  });
  $scope.eventKeywords = $scope.filterList($scope.events);

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

  moment.locale('en', {
    calendar : {
      lastWeek : '[last] dddd [at] LT',
      lastDay : '[Yesterday at] LT',
      sameDay : '[Today]',
      nextDay : '[Tomorrow]',
      nextWeek : 'ddd, YYYY-MM-DD',
      sameElse : 'ddd, YYYY-MM-DD'
    }
  });

}]);
