var hasApp = angular.module('hasApp', ['angular-md5', 'ui.bootstrap', 'ngStorage']);

hasApp.controller("hasController", function ($scope, $http, $window, $uibModal, $localStorage) {
    function init() {
        $scope.synagogue_list = [];
        $scope.user = {};
        $scope.message = '';
        $scope.$storage = $localStorage.$default({});
        if ($scope.$storage.user) {
            $scope.user = $scope.$storage.user;
        }
        $http.get('/SynagogueList')
                .success(function (data, status, headers, config) {
                    console.log(data);
                    for (var i = 0; i < data.length; i++) {
                        $scope.synagogue_list.push(data[i].f_name);
                        //console.log(data[i].f_name);
                    }
                })
                .error(function (data, status, header, config) {
                    console.log("not working");
                });
    }


    init();




//    $scope.submit = function () {
//        $http.post('/authenticate', $scope.user)
//                .success(function (data, status, headers, config) {
//                    console.log(data.message);
//                    $window.sessionStorage.token = data.token;
//                    $scope.message = 'Welcome';
//                })
//                .error(function (data, status, headers, config) {
//                    console.log(data.message);
//                    // Erase the token if the user fails to log in
//                    delete $window.sessionStorage.token;
//
//                    // Handle login errors here
//                    $scope.message = 'Error: Invalid user or password';
//                });
//    };
    $scope.openLogin = function () {
        modalInstance = $uibModal.open({
            templateUrl: 'LoginTemplate.html',
            controller: 'loginCtrl'
        });
        modalInstance.result.then(function (user) {
            if (user) {
                $scope.user = user;
                if (user.save) {
                    $scope.$storage.user = user;
                }
            }
        }, function () {
            console.log('Modal dismissed at: ' + new Date());
        });
    }
    $scope.logout = function () {
        $scope.$storage.$reset();
        $scope.user = {};
    }

});
hasApp.controller('loginCtrl', function ($scope, $http, md5, $uibModalInstance) {
    $scope.logging = 0;
    function encrypt(pass, email) {
        return md5.createHash(pass + email);
    }
    function authenticateUser(user) {
        $http.post('/getlogin', user).then(
                function (data) {
                    console.log(data);
                    if (data.data == "success") {
                        $scope.logging = 2;
                    } else {
                        $scope.logging = 3
                    }

                }, function (err) {
            console.log("err: " + err);
        }
        );
    }

    $scope.cancelLogin = function () {
        $uibModalInstance.dismiss('cancel');
    };
    $scope.pressLogin = function (user)
    {
        user.pass = encrypt(user.pass, user.email);
        $scope.logging = 1;
        authenticateUser(user);
//                    console.log(user);
    }
    $scope.ok = function (user) {
        user.pass = "";
        $uibModalInstance.close(user);
    };


});

hasApp.factory('authInterceptor', function ($rootScope, $q, $window) {
    return {
        request: function (config) {
            config.headers = config.headers || {};
            if ($window.sessionStorage.token) {
                config.headers.Authorization = 'Bearer ' + $window.sessionStorage.token;
            }
            return config;
        },
        response: function (response) {
            if (response.status === 401) {
                // handle the case where the user is not authenticated
            }
            return response || $q.when(response);
        }
    };
});

hasApp.config(function ($httpProvider) {
    $httpProvider.interceptors.push('authInterceptor');
});





//var routerApp = angular.module('routerApp', ['ui.router']);

//routerApp.config(function($stateProvider, $urlRouterProvider) {
//    
//    $urlRouterProvider.otherwise('/home');
//    
//    $stateProvider
//        
//        // HOME STATES AND NESTED VIEWS ========================================
//        .state('home', {
////            url: '/home',
//            templateUrl: 'partial-home.html'
//        })
//        
//        // nested list with custom controller
//        .state('home.list', {
////            url: '/list',
//            templateUrl: 'partial-home-list.html',
//            controller: function($scope) {
//                $scope.dogs = ['Bernese', 'Husky', 'Goldendoodle'];
//            }
//        })
//        
//        // nested list with just some random string data
//        .state('home.paragraph', {
////            url: '/paragraph',
//            template: 'I could sure use a drink right now.'
//        })
//        
//        // ABOUT PAGE AND MULTIPLE NAMED VIEWS =================================
//        .state('about', {
////            url: '/about',
//            views: {
//                '': { templateUrl: 'partial-about.html' },
//                'columnOne@about': { template: 'Look I am a column!' },
//                'columnTwo@about': { 
//                    templateUrl: 'table-data.html',
//                    controller: 'scotchController'
//                }
//            }
//            
//        });
//        
//});
//
//routerApp.controller('scotchController', function($scope) {
//    
//    $scope.message = 'test';
//   
//    $scope.scotches = [
//        {
//            name: 'Macallan 12',
//            price: 50
//        },
//        {
//            name: 'Chivas Regal Royal Salute',
//            price: 10000
//        },
//        {
//            name: 'Glenfiddich 1937',
//            price: 20000
//        }
//    ];
//    
//});