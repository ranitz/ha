var app = angular.module('ui', ['angular-md5', 'ui.bootstrap', 'ngStorage', 'ui.router', 'toastr', 'sticky', 'ngSanitize', 'facebook', 'vcRecaptcha']);
app.config(function (FacebookProvider) {
    // Set your appId through the setAppId method or
    // use the shortcut in the initialize method directly.
    FacebookProvider.init('1731338010478589');
});
app.config(function (toastrConfig) {
    angular.extend(toastrConfig, {
        positionClass: 'toast-top-center',
        preventOpenDuplicates: true,
        autoDismiss: true
    });
});
app.config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise("home"); //send other routes home
    $stateProvider                          //ui router config
            .state('profile', {
                url: "/profile?view",
                templateUrl: "templates/profile.html",
                controller: 'mainCtrl'
            })
            .state('home', {
                url: "/home",
                templateUrl: "templates/home.html",
                controller: 'mainCtrl'
            })
            .state('about', {
                url: "/about",
                templateUrl: "templates/about.html",
                controller: 'mainCtrl'
            })
            .state('contact', {
                url: "/contact?gabay",
                templateUrl: "templates/contact.html",
                controller: 'mainCtrl'
            })
            .state('terms', {
                url: "/terms",
                templateUrl: "templates/terms.html",
                controller: 'mainCtrl'
            })
            .state('donate', {
                url: "/donate?synagogue&sum", //params for email donate request
                templateUrl: "templates/donate.html",
                controller: 'donateCtrl'
            })
            .state('restore', {
                url: "/restore?string&email", //params for email donate request
                templateUrl: "templates/restore.html",
                controller: 'restoreCtrl'
            })
            .state('changemail', {
                url: "/changemail?string&email", //params for email donate request
                templateUrl: "templates/changeMail.html",
                controller: 'changeMailCtrl'
            })
            .state('register', {
                url: "/register",
                templateUrl: "templates/register.html",
                controller: 'loginCtrl'
            })
            .state('login', {
                url: "/login",
                templateUrl: "templates/login.html",
                controller: 'loginCtrl'
            })
            .state('success', {
                url: "/success",
                templateUrl: "templates/success.html",
                controller: 'mainCtrl'
            })
            .state('verify', {
                url: "/verify?string",
                templateUrl: "templates/verify.html",
                controller: 'verifyCtrl'
            })
            .state('regsuccess', {
                url: "/regsuccess",
                templateUrl: "templates/regsuccess.html",
                controller: 'mainCtrl'
            })
            .state('synagogues', {
                url: "/synagogues?syn",
                templateUrl: "templates/synagogues.html",
                controller: 'mainCtrl'
            })
            .state('gabay', {
                url: "/gabay?view",
                templateUrl: "templates/gabay.html",
                controller: 'gabayCtrl'
            })
            .state('admin', {
                url: "/admin?view",
                templateUrl: "templates/admin.html",
                controller: 'adminCtrl'
            })
            .state('receipt', {
                url: "/receipt?tempref",
                templateUrl: "templates/receipt.html",
                controller: 'receiptCtrl'
            })
            .state('failure', {
                url: "/failure",
                templateUrl: "templates/failure.html",
                controller: 'mainCtrl'
            })
            .state('policy', {
                url: "/policy",
                templateUrl: "templates/policy.html",
                controller: 'mainCtrl'
            });

});
app.factory('api', function ($http, $q) {
    return {////handler for our requests to the server - using promise to handle success and failure using http statuses
        request: function (path, data) {
            var def = $q.defer();
            if (data) {
                $http.post(path, data).then(function (res) {
                    def.resolve(res);
                }, function (err) {
                    if (err.data) {
                        def.reject(err.data);
                    } else {
                        def.reject(err.statusText);
                    }
                });
            } else {
                $http.get(path).then(function (res) {
                    def.resolve(res);
                }, function (err) {
                    if (err.data) {

                        def.reject(err.data);

                    } else {

                        def.reject(err.statusText);
                    }
                });
            }

            return def.promise;
        }
    };
});
app.directive('fileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;
            
            element.bind('change', function(){
                scope.$apply(function(){
                    modelSetter(scope, element[0].files[0]);
                });
            });
        }
    };
}]);
app.service('fileUpload', ['$http', function ($http) {
	this.uploadFileToUrl = function(file, uploadUrl, cb) {
		var fd = new FormData();
		fd.append('file', file);
		$http.post(uploadUrl, fd, {
			transformRequest: angular.identity,
			headers: {'Content-Type': undefined}
			})
		    .success(function(){
				cb();
		    })
		    .error(function(error){
				cb(error);
		    });
	}
}]);
app.controller('uiController', function ($scope, $http, $localStorage, md5, api, toastr, $state, $stateParams) {
    //main controller - general methods and site init method
    //all $scope variables in this controller are accessible from all controllers and used as globals    
    function initTabs() {
        $scope.tabs = [
            {title: $scope.langObj.home, view: 'home', show: 0, icon: 'fa-home'},
            {title: $scope.langObj.donate, view: 'donate', show: 0, icon: 'fa-heart'},
            {title: $scope.langObj.myprofile, view: 'profile', show: 1, icon: 'fa-user', subTabs: [
                    {name: 'donations', title: $scope.langObj.mydonations},
                    {name: 'synagogues', title: $scope.langObj.mysynagogues},
                    {name: 'edit', title: $scope.langObj.editmyprofile}
                ]},
            {title: $scope.langObj.mysynagogue, view: 'gabay', show: 2, icon: 'fa-university', subTabs: [
                    {name: 'main', title: $scope.langObj.main},
                    {name: 'update', title: $scope.langObj.editsynagogue},
                    {name: 'donations', title: $scope.langObj.donations},
                    {name: 'news', title: $scope.langObj.editnews},
                    {name: 'followers', title: $scope.langObj.followers}
//                    {name: 'managers', title: $scope.langObj.managers}
                ]},
            {title: $scope.langObj.admin, view: 'admin', show: 3, icon: 'fa-cogs', subTabs: [
                    {name: 'users', title: $scope.langObj.users},
                    {name: 'synagogues', title: $scope.langObj.synagogues},
                    {name: 'donations', title: $scope.langObj.donations},
                    {name: 'mailUsers', title: $scope.langObj.mailinglist},
                    {name: 'addSyn', title: $scope.langObj.addsyn},
                    {name: 'panel', title: $scope.langObj.managesite}
                ]},
            {title: $scope.langObj.synagogues, view: 'synagogues', show: 0, icon: 'fa-th-list'}
        ];
    }
    $scope.months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    $scope.years = [2016, 2017, 2018, 2019, 2020, 2021, 2022];
    $scope.hours = [];
    for (var i = 0; i < 24; i++) {
        $scope.hours.push(i);
    }
    $scope.mins = [];
    for (var i = 0; i < 60; i++) {
        $scope.mins.push(i + 1);
    }
    $scope.data = [];
    $scope.fors = [
        "תרומה",
		"דמי חבר",
        "עליית כהן",
        "עלית לוי",
        "עליית שלישי",
        "עליית רביעי",
        "עליית חמישי",
        "עליית שישי",
        "עליית מפטיר",
        "עלית משלים",
        "הגבהת ספר תורה",
		"הקמת ספר תורה",
        "פתיחת ההיכל",
        "אחר"
    ];
    $scope.banks = [
        {name: 'בנק הפועלים', number: 12},
        {name: 'בנק לאומי', number: 10},
        {name: 'בנק דיסקונט', number: 11},
        {name: 'בנק מזרחי טפחות', number: 20},
        {name: 'הבנק הבינלאומי הראשון', number: 31},
        {name: 'בנק אוצר החייל', number: 14},
        {name: 'בנק מרכנתיל דיסקונט', number: 17},
		{name: 'בנק לאומי', number: 10},
		{name: 'בנק ירושלים', number: 54},
        {name: 'אחר', number: 0}
    ];
    $scope.initUserDonations = function (cb) {
        $scope.user.view = 'donations';
        api.request('/b/initUserDonations')
                .then(function (data) {
//                    //console.log(data);
                    cb(data.data);
                }, function (err) {
                    toastr.error('Error', err.data);
//                    //console.log(err);
                });
    };
//    function verify(string) { //verify registration token from mailed link 
//        api.request('/login/verify', {verify: string})
//                .then(function (data) {
////                    //console.log(data);
//                    if (data.data === "success") {
//                        $state.go("regsuccess");
//                    } else {
//                        toastr.error("Token not valid!!");
//                        $state.go("home");
//                    }
//                }, function (err) {
//                    toastr.error('Error', err.data);
////                    //console.log(err);
//                });
//    }
//    ;
    function init() {
//        var language = window.navigator.userLanguage || window.navigator.language;
//        if (language === 'he') {
//        if ($state.includes('verify')) {
//            if ($stateParams.string) {
//                verify($stateParams.string);
//            }
//        }
        $scope.langObj = document.langObj.he;
        api.request('/b/getContent')
                .then(function (res) {
                    $scope.panel = res.data;
//                    //console.log($scope.panel);
                }, function (err) {
//                    //console.log("error: " + err);
                    toastr.error('Error', err.data);
                });
//        } else {
//            $scope.langObj = document.langObj.en;
//        }
        initTabs();
        $scope.statuses = [
            $scope.langObj.anonymous,
            $scope.langObj.user,
            $scope.langObj.manager,
            $scope.langObj.admin
        ];
        $scope.filteredLimit = 6;
//        $scope.maxPay = 1;
        $scope.adStartDate = new Date();
        $scope.adEndDate = new Date();
        $scope.donation = {};
        $scope.donation.view = 1;
        $scope.synagogue_list = {};
        $scope.user = {};
        $scope.user.f_status = 0;
//        $scope.showSyn = 0;
        $scope.message = '';
        $scope.view = 'spinner';
        //check local storage and initialize
        $scope.$storage = $localStorage.$default({});
        if ($scope.$storage.user) {
            $scope.user = $scope.$storage.user;
            $scope.myDonations = $scope.$storage.donations;
            $scope.initUserDonations(function (data) {
                $scope.$storage.donations = data.donations;
                $scope.$storage.user = data.user[0];
                $scope.myDonations = $scope.$storage.donations;
                $scope.user = $scope.$storage.user;

//                //console.log('USER:' + $scope.user);
            });

        }
        // get list of synagogues from server
        api.request('/b/SynagogueList')
                .then(function (data) {
//                  //console.log(data);
                    $scope.synagogue_list = data.data;
                    if ($scope.user.f_synagogue_list && $scope.user.f_synagogue_list !== [] && (!$scope.donation.synagogue || $scope.donation.synagogue === '')) {
                        $scope.donation.synagogue = $scope.getSynById($scope.user.f_synagogue_list[0]);
                    }
                    // if url parameters are sent it is added to controller, checks for sum and synagogue (for donation request links from emails)
                    $scope.viewReceipt = false;
                    if ($stateParams.synagogue) {
                        $scope.donation.synagogue = $scope.getSynById(parseInt($stateParams.synagogue));
                    }
                    if ($stateParams.sum) {
                        $scope.donation.sum = parseInt($stateParams.sum);
                    } else {
                        $scope.donation.sum = "";
                    }
                    $scope.view = '';
                }, function (err) {
//                    //console.log("error: " + err);
                    toastr.error('Error', err.data);
                });
    }


    init();
    $scope.showNav = function (tab) {
        if ($scope.user.f_name && $scope.user.f_name !== '') {
            if (tab.view === 'profile') {
                return true;
            } else {
                if (parseInt($scope.user.f_status) === tab.show) {
                    return true;
                } else {
                    return false;
                }
            }
        } else {
            return false;
        }
    };
    $scope.bBarClick = function (where) {
        window.scrollTo(0, 0);
        $state.go(where);
    };
    $scope.goToTab = function (r, v) {
//        //console.log(r + "/" + v);
        $scope.navLoc = r;
        $state.go(r, {view: v}, {reload: true});
    };
    $scope.parseDate = function (date) {
        var dateArr = date.slice(0, 10).split('-');
        return dateArr[2] + '.' + dateArr[1] + '.' + dateArr[0];
    };
    $scope.changeLang = function () {
        if ($scope.langObj.lang === 'en') {
            $scope.langObj = document.langObj.he;
        } else {
            $scope.langObj = document.langObj.en;
        }
        initTabs();
    };

    $scope.getSynRowById = function (id) { //get index in synagogue_list
        var i = $scope.synagogue_list.rows.length;
        if (id && id !== '') {
            while (i--) {
                if ($scope.synagogue_list.rows[i].f_id === parseInt(id)) {
                    return i;
                }
            }
        }
    };
    $scope.getSynById = function (id) { //get all object
        if (typeof id != 'number') {
            id = parseInt(id);
        }
        var i = $scope.synagogue_list.rows.length;
        if (id && id !== '') {
            while (i--) {
                if ($scope.synagogue_list.rows[i].f_id === id) {
                    return $scope.synagogue_list.rows[i];
                }
            }
        }
    };

    $scope.saveUser = function (user) {
        //console.log(user);
        if (user && user.save) {
            $scope.$storage.user = user;
        } else {

            if ($scope.$storage.user) {
                $scope.$storage.user = user;
            }
        }
    };

    $scope.clickSynWin = function (i) {
        $scope.showSyn = i;
        $state.go('synagogues');
    };
    $scope.isActive = function (state) {
        return $state.includes(state); //true if you are in the current state from ui-state
    };

    $scope.logout = function () {
        $state.go('home');
        $scope.$storage.$reset();
        $scope.user = {};
        $scope.user.f_status = 0;
        api.request('/login/logout')
                .then(function (data) {
//                    //console.log(data);
                }, function (err) {
                    toastr.error('Error', err.data);
//                    //console.log(err);
                });
    };
    $scope.getDonations = function (user) {
        $scope.user = user;
        api.request('/b/getDonations', user)
                .then(function (data) {
//                    //console.log(data);
                    $scope.myDonations = data.data.rows;
                    if (user.save) {
                        $scope.$storage.user = user;
                        $scope.$storage.donations = data.data;
                    }
                }, function (err) {
                    toastr.error('Error', err.data);
//                    //console.log(err);
                });
    };


//    $scope.printUser = function() {
//        //console.log($scope.user);
//    }
    $scope.getLocation = function (val) {
        return $http.get('//maps.googleapis.com/maps/api/geocode/json', {
            params: {
                address: val,
                sensor: false
            }
        }).then(function (response) {
            return response.data.results.map(function (item) {
                return item.formatted_address;
            });
        });
    };

});
app.controller('mainCtrl', function ($scope, $window, api, $state, toastr, md5, $localStorage, $stateParams) { // general methods for public tabs
	//console.log("MAIN CTRL");
    function refreshUser() {
        //console.log($scope.user);
        api.request('b/refreshUser')
                .then(function (data) {
                    $scope.getDonations(data.data);
                }, function (err) {
                    //console.log(err);
                });
    }

    if ($state.includes("regsuccess")) {
        refreshUser();
    }
    $scope.profileSpinner = true;
    $scope.showSyn = 0;
    $scope.synagoguesView = false;
    if ($stateParams.syn && $stateParams.syn !== '') {
        $scope.synagoguesView = true;
        $scope.showSyn = parseInt($stateParams.syn);
    }
    function encrypt(pass, email) {
        return md5.createHash(pass + email);
    }
    if ($stateParams.view) {
//        //console.log($stateParams.view);
        if ($state.includes('profile')) {
            api.request('b/initUserDonations')
                    .then(function (data) {
                        $scope.myDonations = data.data.donations;
                        $scope.profileSpinner = false;
                        $scope.user.view = $stateParams.view;
                    }, function (err) {
                        //console.log(err);
                    });
        } else {
            $scope.profileSpinner = false;
            $scope.user.view = $stateParams.view;
        }
    }
    $scope.clickSyn = function (i) {
        $scope.synagoguesView = true;
        $scope.showSyn = i;
    };
    $scope.clickBack = function () {
        $scope.synagoguesView = false;
        if ($stateParams.syn && $stateParams.syn !== '') {
            window.history.back();
        }
    };
    $scope.contactus = {};
    if ($scope.user.f_name) {
        $scope.contactus.email = $scope.user.f_name;
    }
    if ($stateParams.gabay && $stateParams.gabay === 'true') {
        $scope.contactus.subject = $scope.langObj.gabayconttitle;
        $scope.contactus.content = $scope.langObj.gabaycontcont;
    }
//    $scope.submit = function () {
//     //   $scope.view = "spinner";
//        $scope.donation.name = $scope.user.f_name;
//        if (!$scope.donation.name || $scope.donation.name === "") {
//            $scope.donation.name = "Anonymous";
//        }
//        
//        api.request('b/postform',$scope.donation).then(function(data) {
//            //console.log(data);
//            //console.log('done');
//        });
////        var postString = "https://secure5.tranzila.com/cgi-bin/tranzila71u.cgi?supplier=ttxyoniyaatok&tranmode=A&ccno=12312312&expdate=0917&sum=15&currency=1&cred_type=1&myid=123456789&mycvv=123";
////        var postString="https://secure5.tranzila.com/cgi-bin/tranzila71u.cgi?supplier=ttxyoniyaatok&tranmode=A&ccno="+$scope.donation.ccno+"&expmonth="+$scope.donation.expmonth+"&expyear="+$scope.donation.expyear+"&sum="+$scope.donation.sum+"currency=1&cred_type=1";
////        //console.log("donation:" + $scope.donation);
////        $http.post(postString)
////                .then(function (data) {
////                    //console.log(data);
////
////                       $scope.data = data.data;
////                    //console.log("data:" + $scope.data);
////                    if ($scope.data.action === "success") {
////                        $scope.view = 'success';
////                        $scope.insertDonation($scope.donation);
////                    }
////                }, function (err) {
////
////                    //console.log(err);
////                });
//    };

//    $scope.insertDonation = function (donation) {
//        api.request('/b/pushDonation', {'user': donation.name, 'sum': donation.sum, 'synagogue': donation.synagogue})
//                .then(function (data) {
//                    //console.log(data);
//                }, function (err) {
//                    toastr.error(err, 'Error');
//                    //console.log(err);
//                });
//    };
    $scope.contact = function (obj) {
        if (obj.subject && obj.email && obj.content) {
            $scope.sendContactSpinner = true;
            api.request('/b/contact', obj)
                    .then(function (data) {
//                    //console.log(data);
                        toastr.success($scope.langObj.sentsuccess);
                        $scope.sendContactSpinner = false;
                        $state.go('home');
                    }, function (err) {
                        $scope.sendContactSpinner = false;
                        toastr.error('Error', err.data);
//                    //console.log(err);
                    });
        } else {
            toastr.error($scope.langObj.fillall);
        }
    };
    $scope.addResults = function () {
        $scope.filteredLimit += 6;
    };
    $scope.removeToken = function () {
        $scope.user.f_token = "";
        $scope.saveUser();
        api.request('/b/removeToken')
                .then(function (data) {
                    toastr.success($scope.langObj.tokenremoved);
                }, function (err) {
                    toastr.error('Error', err.data);
//                    //console.log(err);
                });
    };
    $scope.initUser = function () {
        api.request('/b/initUserDonations')
                .then(function (data) {
//                    //console.log(data);
                    $scope.myDonations = data.data;
                }, function (err) {
                    toastr.error('Error', err.data);
//                    //console.log(err);
                });
    };
    $scope.getExcel = function (arr) {
        $scope.excelwait = true;
        api.request('b/excel', arr)
                .then(function (data) {
//                    //console.log(data);
                    toastr.success($scope.langObj.excelsent);
                    $scope.excelwait = false;

                }, function (err) {
                    $scope.excelwait = false;

                    toastr.error('Error', err.data);
                });
    };

    $scope.changeMailPerfrences = function () {
        api.request('b/mailPref', {allow: $scope.user.f_accept_mail})
                .then(function (data) {
//                    //console.log('success');

                }, function (err) {
                    toastr.error('Error', err.data);
//                    //console.log(err);
                });
    };
    $scope.refSyn = function (id) { //id is int f_id of synagogue, refers to donation tab
        $scope.donation.synagogue = $scope.getSynById(id);
//        //console.log($scope.donation.synagogue);
        $state.go('donate');
    };
    $scope.follow = function (synId) { //follow a synagogue
        $scope.followSpinner = true;
        api.request('/b/follow', {user: $scope.user.f_id, syn: synId})
                .then(function (data) {
//                    //console.log(data);
                    if ($scope.user.f_synagogue_list) {
                        $scope.user.f_synagogue_list.push(synId);
                    } else {
                        $scope.user.f_synagogue_list = [];
                        $scope.user.f_synagogue_list.push(synId);
                    }
                    $scope.followSpinner = false;
                }, function (err) {
                    toastr.error('Error', err.data);
//                    //console.log(err);
                    $scope.followSpinner = false;
                });
    };
    $scope.updateUser = function () { //update user information
        $scope.inProgress = true;
        function changePass(obj, done) {
//                    .user for user id .oldPass .newPass

            api.request('/b/changePass', obj)
                    .then(function (data) {
                        toastr.success("Changes saved successfully");
//                        //console.log(data);
                        done();
                    }, function (err) {
                        toastr.error('Error', err.data);
//                        //console.log(err);
                        done();
                    });
        }
        function changeName(done) {
            api.request('/b/updateUser', $scope.user)
                    .then(function (data) {
                        $scope.saveUser($scope.user);
                        toastr.success("Changes saved successfully");
//                        //console.log(data);
                        done();
                    }, function (err) {
                        toastr.error('Error', err.data);
//                        //console.log(err);
                        done();
                    });
        }
        function changeEmail(newEmail, done) {
            api.request('b/changeEmail', {id: $scope.user.f_id, oldEmail: $scope.user.f_name, newEmail: newEmail})
                    .then(function (data) {
                        toastr.success($scope.langObj.verimailsent);
                        $scope.user.f_pending_email = newEmail;
//                        //console.log(data);
                        done();
                    }, function (err) {
                        toastr.error('Error', err.data);
//                        //console.log(err);
                        done();
                    });
        }
        function verifyInput(changeObj) {
            async.parallel([
                function (done) {
                    if (typeof changeObj != 'undefined') {
//                //console.log(changeObj);
                        if (!changeObj.newPass || !changeObj.pass || !changeObj.verify) {
                            toastr.error($scope.langObj.missingdata);
                            done();
                        } else {
                            if (changeObj.newPass !== changeObj.verify) {
                                toastr.error($scope.langObj.passdontmatch);
                                done();
                            } else {
                                changePass({id: $scope.user.f_id, oldPass: encrypt(changeObj.pass, $scope.user.f_name), newPass: encrypt(changeObj.newPass, $scope.user.f_name)}, done);
                                $scope.changePass = {};
                            }
                        }
                    } else {
                        done();
                    }
                }, function (done) {
                    if ($scope.newUserName && $scope.newUserName !== $scope.user.f_full_name) {
                        $scope.user.f_full_name = $scope.newUserName;
                        changeName(done);
                    } else {
                        done();
                    }
                }, function (done) {
                    if ($scope.newUserEmail && $scope.newUserEmail !== $scope.user.f_name) {
                        changeEmail($scope.newUserEmail, done);
                        $scope.newUserEmail = $scope.user.f_name;
                    } else {
                        done();
                    }
                }], function (err, result) {
                $scope.inProgress = false;
            });
        }
        $scope.inProgress = true;
        verifyInput($scope.changePass);


    };
    $scope.unfollow = function (synId) { //unfollow synagogue by ID
        $scope.followSpinner = true;
        api.request('/b/unfollow', {user: $scope.user.f_id, syn: synId})
                .then(function (data) {
//                    //console.log(data);
                    var i = $scope.user.f_synagogue_list.length;
                    while (i--) {
                        if ($scope.user.f_synagogue_list[i] === synId) {
                            $scope.user.f_synagogue_list.splice(i, i + 1);
                        }
                    }
                    $scope.followSpinner = false;
                }, function (err) {
                    $scope.followSpinner = false;
                    toastr.error('Error', err.data);
//                    //console.log(err);
                });
    };
    $scope.makeDefault = function (synId) { //make synagogue your default synagogue by moving it to f_synagogue_list[0] and update database
        for (var i = 0; i < $scope.user.f_synagogue_list.length; i++) {
            if ($scope.user.f_synagogue_list[0] === synId) {
//                //console.log($scope.user.f_synagogue_list);
                api.request('/b/updateSynList', {user: $scope.user.f_id, synList: $scope.user.f_synagogue_list})
                        .then(function (data) {
//                            //console.log(data);
                        }, function (err) {
                            toastr.error('Error', err.data);
//                            //console.log(err);
                        });
                return;
            } else {
                $scope.user.f_synagogue_list.push($scope.user.f_synagogue_list[0]);
                $scope.user.f_synagogue_list.shift();
            }
        }
    };
	
    $scope.contains = function (arr, obj) { //check if obj is contained in arr
        if (arr === null || obj === null) {
            return false;
        }

        var i = arr.length;
        while (i--) {
            if (arr[i] === obj) {
                return true;
            }
        }
        return false;
    };  
	
    $scope.deleteUser = function () {
        api.request('b/deleteUser')
                .then(function (data) {
                    toastr.success('User deleted successfully');
                    $scope.user = {};
                    $state.go('home');
                }, function (err) {
                });
    };
    $scope.dateFilter = function (stDate, endDate, synId) { //filter dates for user donations
		//console.log("DATE FILTER");
        if (synId) {
            synId = parseInt(synId);
        } else {
            synId = '';
        }
        $scope.filterUser = false;
        var p = 'b/dateFilter';
        api.request(p, {startDate: stDate, endDate: endDate, user: $scope.user.f_name, synagogue: synId})
                .then(function (data) {
                    $scope.myDonations = data.data.rows;
                }, function (err) {
                });

    };

	$scope.goHome = function(){
		$state.go('home');
	};
    //facebook login for register page

    //facebook login
//    $scope.loginFB = function () {
//        // From now on you can use the Facebook service just as Facebook api says
//        Facebook.login(function (response) {
////            //console.log(response);
//            $scope.getFBLoginStatus();
//            ////console.log(response.authResponse.accessToken);
//            $scope.accessToken = response.authResponse.accessToken;
//            // Do something with response.
//        }, {return_scopes: true, scope: 'email'});
//    };
//    $scope.getFBLoginStatus = function () {
//        Facebook.getLoginStatus(function (response) {
//            if (response.status === 'connected') {
//                $scope.loggedIn = true;
//                $scope.loginStatus = 'connected';
//                $scope.api();
//            } else {
////                //console.log('NOT CONNECTED');
//                $scope.loggedIn = false;
//            }
//        });
//    };
//    $scope.api = function () {
//        Facebook.api('/me', {fields: 'email,name'}, function (response) {
////            $scope.user = response.email;
////            //console.log(response);
//            $http.post('/b/FaceBookLogin', {shortToken: $scope.accessToken})
//                    .then(function (data) {
////                        //console.log(data.data);
//                        $scope.user = data.data;
//                        $scope.user.save = true;
//                        $scope.getDonations($scope.user);
//                        $state.go('home');
//                    }, function (err) {
////                        //console.log("err: " + err);
//                        toastr.error('Error');
//                    });
//        });
//    };
//    $scope.$watch(function () {
//        return Facebook.isReady();
//    }, function (newVal) {
//        if (newVal) {
//            $scope.facebookIsReady = true;
//        }
//    });
});
app.controller('donateCtrl', function ($scope, $window, api, toastr, $state, $sce, $uibModal, $stateParams, $http) { //controller for donation page
	//console.log("DONATE CTRLR");
    var init = function () {
//        $scope.maxPay = 5;
        /* var link = '';
        if ($scope.langObj.lang === 'he') {
            //link = "https://direct.tranzila.com/ttxyoniyaa/iframe.php?buttonLabel=תרום&tranmode=AK&trButtonColor=5cb85c&lang=il&trBgColor=fff&trTextColor=3F3F3F";
			link = "https://direct.tranzila.com/yoniyaa/iframe.php?buttonLabel=תרום&tranmode=AK&trButtonColor=5cb85c&lang=il&trBgColor=fff&trTextColor=3F3F3F";
		} else {
            //link = "https://direct.tranzila.com/ttxyoniyaa/iframe.php?buttonLabel=Donate&tranmode=AK&trButtonColor=5cb85c&lang=us&trBgColor=fff&trTextColor=3F3F3F";
			link = "https://direct.tranzila.com/yoniyaa/iframe.php?buttonLabel=Donate&tranmode=AK&trButtonColor=5cb85c&lang=us&trBgColor=fff&trTextColor=3F3F3F";
		} */
        // $scope.formAction = $sce.trustAsResourceUrl(link); //check if link is safe before inserting
        if ($scope.user.f_name && $scope.user.f_name !== '') {
            $scope.donation.email = $scope.user.f_name;
            $scope.donation.full_name = $scope.user.f_full_name;
        } else {
            $scope.donation.email = '';
        }
        $scope.donation.save = false;
        $scope.donation.for = $scope.langObj.donation;
        $scope.viewDonation = 0;
        $scope.cred_type = 1;
        $scope.donation.view = 1;
//        //console.log($scope.donation.synagogue);
		if ($stateParams.sum && $stateParams.sum !== '') {
			$scope.donation.sum = parseInt($stateParams.sum);
		}
		if ($stateParams.synagogue && $stateParams.synagogue !== '') {
			$scope.donation.synagogue = $scope.getSynById(parseInt($stateParams.synagogue));
		}
    };
    init();
    //Function for donation using token
    var verifyDonation = function () { //client side verification of data before opening iframe
        if (isNaN($scope.donation.sum) || $scope.donation.sum < 10) {
            toastr.error($scope.langObj.sumnotvalid);
            return false;
        } else if (typeof ($scope.donation.email) !== 'string' || $scope.donation.email === "") {
            toastr.error($scope.langObj.emailnotvalid);
            return false;
        } else if ($scope.donation.email.split('@').length !== 2 || $scope.donation.email.split('@')[1].split('.').length < 2) {
            toastr.error($scope.langObj.emailnotvalid);
            return false;
        } else if (!$scope.donation.synagogue || $scope.donation.synagogue === "") {
            toastr.error($scope.langObj.choosenotvalid);
            return false;
        } else {
            return true;
        }
    };
	
    $scope.openModal = function () {
        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: 'templates/termsModal.html',
            controller: 'modalCtrl',
            size: 'lg',
            resolve: {
                langObj: function () {
                    return $scope.langObj;
                },
                panel: function () {
                    return $scope.panel;
                }
            }
        });
    };
	
    $scope.donateToken = function () { //donate using saved token
        if (verifyDonation()) {
            $scope.donateClicked = true;
            api.request('/b/donateToken', $scope.donation)
                    .then(function (data) {
                        $scope.donateClicked = false;
						////console.log(data);
                        if (data.data.Response === "000") {
                            $scope.donation.view = 3;
                        } else {
                            $scope.donation.view = 4;
                        }
                    }, function (err) {
                        $scope.donation.view = 4;
                        $scope.donateClicked = false;
                        toastr.error('Error', err.data);
                    });
        }
    };
	
    $scope.changed = function (sum) { //define max payments for tranzile according to sum
        $scope.cred_type = 8;
        $scope.maxPay = Math.round(sum / 150);
        if ($scope.maxPay > 12) {
            $scope.maxPay = 12;
        }
        if ($scope.maxPay <= 1) {
            $scope.maxPay = 1;
            $scope.cred_type = 1;
        }
    };
	
    $scope.changeDonationFor = function (donationFor) {
        $scope.donation.for = donationFor;
        if ($scope.donation.for === 'אחר') {
            $scope.donation.for = '';
        }
    };
	
	$scope.post_payme_token = function() {
		$scope.donateClicked = true;
		api.request('/b/getPaymeToken',{"user":$scope.donation.email})
                .then(function (data) {
					if (data.data.status === 1) {
						toastr.error('Error', "No token found");
						return;
					} else {
						//console.log("GOT TOKEN:");
						var price = $scope.donation.sum;
						var mshekel_processing_fee = 0.04;
						var sale_processing_fee = 0.025;
						var sale_fix_fee = 1.3;
						var sale_vat = 0.17;
						var mshekel_fix_fee = 1.2;
						//var mshekel_fix_fee = 0;
						//var resultMH= price * (mshekel_processing_fee * (1 + sale_vat)) + mshekel_fix_fee;
						var resultMH= (price * mshekel_processing_fee) + mshekel_fix_fee;
						var resultPM = price * (sale_processing_fee * (1+ sale_vat)) + sale_fix_fee;
						var roundedMH = (resultMH.toFixed(2) * 100) / price;
						var roundedPM = (resultPM.toFixed(2) * 100) / price;
						var finalFee = (roundedMH - roundedPM).toFixed(3);
						qs = {
							"seller_payme_id": $scope.donation.synagogue.f_seller_payme_id,
							"sale_price": 100 * $scope.donation.sum,
							"currency": "ILS",
							"product_name": $scope.donation.for,
							"installments": 1,
							"layout": "dynamic",
							"sale_callback_url": "https://has-raniz.rhcloud.com/b/payme",
							"sale_return_url": "",
							"sale_error_url": "",
							"sale_cancel_url": "",
							"market_fee": finalFee
						};
						//console.log(data.data.payme_token);
						qs["buyer_key"] = data.data.payme_token;
						$http.post('https://ng.paymeservice.com/api/generate-sale', qs)
							.then(function (data) {
								//console.log("GENERATE SALE DATA TOKEN:");
								$scope.donation.view = 2;
								//console.log(data);
								//console.log(data.data.sale_url);
								$scope.iframe_url = $sce.trustAsResourceUrl(data.data.sale_url);
							}, function (err) {
								//console.log("err: " + err);
								toastr.error('Error');
								//document.getElementById("donationForm").submit();
							});
					}					
                }, function (err) {
                    toastr.error('Error', err.data);
					return;
                });
		
		//qs["buyer_key"]  = "14744014-49VHY9NT-WPTPXH2Z-S2ZXGQSX";
	};
	
	$scope.submit = function () { //submit form to open iframe
		//console.log("IN SUBMIT");
        if (verifyDonation()) {
            if ($scope.donation.useToken === true) { //donate with token
				////console.log('token donation');
				//donateToken();
                //$scope.donation.view = 2;
				$scope.donation.view = 5;
            } else { //donate without token
				////console.log('non token donation');
				var price = $scope.donation.sum;
				var mshekel_processing_fee = 0.04;
				var sale_processing_fee = 0.025;
				var sale_fix_fee = 1.3;
				var sale_vat = 0.17;
				var mshekel_fix_fee = 1.2;
				//var mshekel_fix_fee = 0;
				//var resultMH= price * (mshekel_processing_fee * (1+sale_vat)) + mshekel_fix_fee;
				var resultMH= (price * mshekel_processing_fee) + mshekel_fix_fee;
				var resultPM = price * (sale_processing_fee * (1+sale_vat)) + sale_fix_fee;
				var roundedMH = (resultMH.toFixed(2) * 100) /price;
				var roundedPM = (resultPM.toFixed(2) * 100) / price;
				var finalFee = (roundedMH - roundedPM).toFixed(3);
				qs = {
					"seller_payme_id": $scope.donation.synagogue.f_seller_payme_id,
					"sale_price": 100 * $scope.donation.sum,
					"currency": "ILS",
					"product_name": $scope.donation.for,
					"installments": 112,
					"layout": "dynamic",
					"sale_callback_url": "https://has-raniz.rhcloud.com/b/payme",
					"sale_return_url": "",
					"sale_error_url": "",
					"sale_cancel_url": "",
					"market_fee": finalFee
				};
                $scope.donation.view = 2;
				if ($scope.user.f_name && !$scope.user.f_token && $scope.donation.save && $scope.donation.save === true) { //save token if (user is logged and he wants to save token)
					//console.log("SAVE TOKEN!");
					qs["capture_buyer"]  = 1;
				} else { //dont save token
					qs["capture_buyer"]  = 0;
				}
				$http.post('https://ng.paymeservice.com/api/generate-sale', qs)
                    .then(function (data) {
						//console.log("GENERATE SALE DATA:");
                        //console.log(data);
						//console.log(data.data.sale_url);
						var url = data.data.sale_url + "?email=" + $scope.donation.email;
						$scope.iframe_url = $sce.trustAsResourceUrl(url);
                    }, function (err) {
                        //console.log("err: " + err);
                        toastr.error('Error');
						//document.getElementById("donationForm").submit();
					});
			}
		}
	};
	
    $window.addEventListener('message', function (msg) { //create a listener to let app know iframe donation is successfull
        $scope.$evalAsync(function () {
            if (msg.data[0] !== '_') { //to filter facebook message when page loads
			////console.log('Got message!' + msg.data);
                if (msg.data === '000') {
					//toastr.success("Donation completed successfully! An email was sent to " + $scope.donation.email);
                    $scope.donation.view = 3;
                } else {
                    $scope.donation.view = 4;
					////console.log("action failed");
                }
            }
        });
    });
});

app.controller('adminCtrl', function ($scope, api, toastr, $state, $stateParams, md5) { //controller for admin
	//console.log("ADMINCTRL");
    $scope.getUserById = function (users, id) { //find id in users
        if (users && id) {
            var i = users.length;
            while (i--) {
                if (users[i].f_id === id) {
                    return users[i];
                }
            }
            toastr.error('no such user');
        }
    };
	
    var init = function () {
		//console.log("INIT");
        $scope.users = {};
        $scope.adminDcounter = 0;
        $scope.acc = {};
        $scope.newSyn = {};
		$scope.newSeller= {};
        $scope.users.view = 'spinner';
		
        api.request('/admin/initSyns')
                .then(function (data) {
                    $scope.synagogue_list = data.data;
                }, function (err) {
                    toastr.error('Error', err.data);
                });
				
        api.request('/admin/init')
                .then(function (data) {
                    $scope.users = data.data;
                    $scope.mail = {};
                    $scope.mail.group = '1';
                    $scope.editSyn = {};
                    $scope.synagogue_list.view = 1;
                    $scope.users.donations.view = 1;
                    $scope.users.view = $stateParams.view || 'synagogues';
                }, function (err) {
                    toastr.error('Error', err.data);
                });
    };
	
    init();
	
    $scope.editContent = function (panel) {
        var tempView = $scope.users.view;
        $scope.users.view = 'spinner';
        api.request('admin/updatePanel', panel)
                .then(function (data) {
                    toastr.success($scope.langObj.actionsuccess);
                    $scope.users.view = tempView;
                }, function (err) {
                    toastr.error('Error', err.data);
                    $scope.users.view = tempView;
                });
    };
	
    $scope.updateStatus = function (i) { //i is index of user in $scope.users.rows (created in init), changes are already done in html directly to $scope.users
        var tempView = $scope.users.view;
        $scope.users.view = 'spinner';
        api.request('admin/updateStatus', $scope.users.rows[i])
                .then(function (data) {
                    toastr.success($scope.langObj.actionsuccess);
                    $scope.users.view = tempView;
                }, function (err) {
                    toastr.error('Error', err.data);
                    $scope.users.view = tempView;
                });
    };

    $scope.updateSyn = function (syn) { //syn is an updated synagogue object, recognized by syn.f_id
		syn.f_img = '';
        $scope.users.view = 'spinner';
        api.request('gabay/updateSyn', syn)
                .then(function (data) {
                    toastr.success($scope.langObj.actionsuccess);
                    init('synagogues');
                }, function (err) {
                    toastr.error('Error', err.data);
                    $scope.users.view = 'synagogues';
                });
    };
	
    $scope.editSynagogue = function (index) { //initialize $scope.synagogue_list.rows[index] into an object later sent to server to update a synagogue
        $scope.users.view = 'spinner';

        api.request('admin/getSyn', {syn: $scope.synagogue_list.rows[index].f_id})
                .then(function (data) {
                    $scope.editSyn = data.data;
                    $scope.editSyn.f_bank_account = $scope.editSyn.f_bank_account.split('-');
                    //console.log($scope.editSyn);
                    $scope.editSyn.manager = $scope.getUserById($scope.users.rows, $scope.editSyn.f_manager_list[0]).f_name;
                    $scope.users.view = 'editSyn';
                }, function (err) {
                    toastr.error('Error', err.data);
                    $scope.users.view = 'synagogues';
                });

    };
	
    $scope.deleteSynagogue = function (synagogue) {
        synagogue.verifySynDel = false;
        api.request('admin/deleteSyn', {'f_id': synagogue.f_id})
                .then(function (data) {
                    toastr.success($scope.langObj.actionsuccess);
                    init('synagogues');
                }, function (err) {
                    toastr.error('Error', err.data);
                    $scope.users.view = 'synagogues';
                });
    };
	
    $scope.deleteUser = function (user) {
        api.request('admin/deleteUser', user)
                .then(function (data) {
                    toastr.success($scope.langObj.actionsuccess);
                    init();
                }, function (err) {
                    toastr.error('Error', err.data);
                    $scope.users.view = 'users';
                });
    };
	
    $scope.promote = function (user) {
        api.request('admin/promote', user)
                .then(function (data) {
                    toastr.success($scope.langObj.actionsuccess);
                    init();
                }, function (err) {
                    toastr.error('Error', err.data);
//                    //console.log(err);
                    $scope.users.view = 'users';
                });
    };
	
    $scope.demote = function (user) {
        api.request('admin/demote', user)
                .then(function (data) {
                    toastr.success($scope.langObj.actionsuccess);
                    init();
                }, function (err) {
                    toastr.error('Error', err.data);
//                    //console.log(err);
                    $scope.users.view = 'users';
                });
    };
	
    $scope.mailList = function () {
        var list = [];
        if ($scope.mail.group === '1') { //$scope.mail.group defines if mail will be sent to all users or just managers
            for (var i = 0; i < $scope.users.rows.length; i++) {
                if ($scope.users.rows[i].f_accept_mail === true) {
                    list.push($scope.users.rows[i]);
                }
            }
            list = $scope.users.rows;
        } else {
            for (var i = 0; i < $scope.users.rows.length; i++) {
                if ($scope.users.rows[i].f_status === '2') {
                    list.push($scope.users.rows[i]);
                }
            }
        }

        api.request('admin/mailList', {mail: $scope.mail, list: list})
                .then(function (data) {
                    toastr.success("Mail sent successfully!");
                }, function (err) {
                    toastr.error('Error', err.data);
//                    //console.log(err);
                });
    };
	
    $scope.checkBank = function () { //ui function to show hidden input for bank number
        if ($scope.acc.bank === '0') {
            $scope.otherbank = 1;
        } else {
            $scope.otherbank = 0;
        }
    };
	
    $scope.dateFilter = function (stDate, endDate) { //datefilter for all donations
        $scope.users.view = 'spinner';
        $scope.filterAdmin = false;
        api.request('admin/dateFilter', {startDate: stDate, endDate: endDate})
                .then(function (data) {
//                    //console.log(data);
                    $scope.users.donations = data.data;
                    $scope.users.view = 'donations';
                }, function (err) {
//                    //console.log(err);
                    $scope.users.view = 'donations';
                });
    };
	
    $scope.getAllDonations = function () {
        api.request('admin/getAllDonations')
                .then(function (data) {
//                    //console.log(data.data);
                    $scope.users.donations.rows = data.data;
                }, function (err) {
                    toastr.error('Error', err.data);
//                    //console.log(err);
                });
    };
    $scope.updateManager = function (user, syn, main) { //update a syn(int - f_id) manager list adding user(int - f_id). main(bool) will add him in syn.f_manager_list[0] while pushing previous main manager
        api.request('gabay/updateManager', {manager: user, synagogue: syn, main: main})
                .then(function (data) {
                    toastr.success($scope.langObj.actionsuccess);
//                    //console.log(data.data);
                    $scope.editSyn.f_manager_list = data.data[0].f_manager_list;
                }, function (err) {
                    toastr.error('Error', err);
//                    //console.log(err);
                });
    };
    $scope.removeManager = function (synId, userId) { //remove userId from synId.f_manager_list
        api.request('gabay/removeManager', {manager: userId, synagogue: synId})
                .then(function (data) {
                    toastr.success($scope.langObj.actionsuccess);
//                    //console.log(data.data);
                    $scope.editSyn.f_manager_list = data.data[0].f_manager_list; //apply to ui
                }, function (err) {
                    toastr.error('Error', err.data);
//                    //console.log(err);
                });
    };
    $scope.addSyn = function () { //add a synagogue to table from object $scope.newSyn
		if ($scope.newSyn.name == null || $scope.newSyn.name == "") {
			toastr.error("חסר שם בית כנסת");
			return;
		}
		if ($scope.newSyn.associationName == null || $scope.newSyn.associationName == "") {
			toastr.error("חסר שם עמותה");
			return false;
		}
		if ($scope.newSyn.association == null || $scope.newSyn.association == "") {
			toastr.error("חסר מספר עמותה");
			return false;
		}
		if ($scope.newSeller.first_name == null || $scope.newSeller.first_name == "") {
			toastr.error("חסר שם פרטי - גבאי");
			return false;
		}
		if ($scope.newSeller.first_name == null || $scope.newSeller.first_name == "") {
			toastr.error("חסר שם פרטי - גבאי");
			return false;
		}
		if ($scope.newSeller.social_id == null || $scope.newSeller.social_id == "") {
			toastr.error("חסר מספר תעודת זהות - גבאי");
			return false;
		}
		if ($scope.newSeller.social_id_issued == null || $scope.newSeller.social_id_issued == "") {
			toastr.error("חסר תאריך הנפקת תעודת זהות - גבאי");
			return false;
		}
		if ($scope.newSeller.birthdate == null || $scope.newSeller.birthdate == "") {
			toastr.error("חסר תאריך לידה - גבאי");
			return false;
		}
		if ($scope.newSeller.phone_number == null || $scope.newSeller.phone_number == "") {
			toastr.error("חסר מספר פלאפון - גבאי");
			return false;
		}
		if ($scope.newSeller.city == null || $scope.newSeller.city == "") {
			toastr.error("חסר עיר");
			return false;
		}
		if ($scope.newSeller.street == null || $scope.newSeller.street == "") {
			toastr.error("חסר שם רחוב");
			return false;
		}
		if ($scope.newSeller.street_number == null || $scope.newSeller.street_number == "") {
			toastr.error("חסר מספר רחוב");
			return false;
		}
		if ($scope.newSeller.market_fee == null || $scope.newSeller.market_fee == "") {
			toastr.error("חסר עמלה");
			return false;
		}
		if ($scope.newSeller.file_social_id == null || $scope.newSeller.file_social_id == "") {
			toastr.error("חסר קישור לתעודת זהות");
			return false;
		}
		if ($scope.newSeller.file_cheque == null || $scope.newSeller.file_cheque == "") {
			toastr.error("חסר קישור לצ'ק");
			return false;
		}
		if ($scope.newSeller.file_corporate == null || $scope.newSeller.file_corporate == "") {
			toastr.error("חסר קישור לקובץ תאגיד");
			return false;
		}
		if ($scope.acc.number == null || $scope.acc.number == "") {
			toastr.error("חסר מספר חשבון בנק");
			return false;
		}
		if ($scope.acc.branch == null || $scope.acc.branch == "") {
			toastr.error("חסר מספר סניף");
			return false;
		}
		if ($scope.acc.bank == null || $scope.acc.bank == "") {
			toastr.error("חסר מספר בנק");
			return false;
		}
        $scope.newSyn.acc = $scope.acc.number + '-' + $scope.acc.branch + '-' + $scope.acc.bank;
        if (!$scope.newSyn.section46) {
            $scope.newSyn.section46 = false;
        }
        $scope.acc = {};
		//console.log($scope.newSeller);
		$scope.users.view = 'spinner';
        api.request('admin/addSyn', {"newSyn": $scope.newSyn, "newSeller": $scope.newSeller})
                .then(function (data) {
                    toastr.success($scope.langObj.actionsuccess);
                    $scope.synagogue_list.rows.push(data.data[0]);
                    $scope.newSyn = {};
                    $scope.users.view = 'synagogues';
                }, function (err) {
                    toastr.error('Error', err.data);
                    $scope.users.view = 'synagogues';
                });
    };
});

app.controller('gabayCtrl', function ($scope, api, toastr, $state, $stateParams, fileUpload) { //controller for manager tab
//    //console.log($stateParams.view);
	$scope.uploadSpinner = false;
		$scope.getDatetime = function() {
		var a = new Date();
		var n = a.getSeconds();
		return n;
	};
	$scope.uploadFile = function(){
		$scope.uploadSpinner = true;
		var file = $scope.myFile;
		////console.log('file is ' );
		//console.dir(file);
		if (!file) {
			toastr.error("Couldn't find the fileinput element.");
			return false;
		}
		//alert("File " + file.name + " is " + file.size + " bytes in size");
		if (file.size > 2 * 1024 * 1024) {
			toastr.error("File size is bigger than 2MB");
			$scope.uploadSpinner = false;
			return false;
		}
		var uploadUrl = "/gabay/fileupload";
		fileUpload.uploadFileToUrl(file, uploadUrl, function (err) {
            if (err) {
				$scope.uploadSpinner = false;
				toastr.error("Failed uploading file, check file size is smaller than 2MB");
                
            } else {
				$scope.uploadSpinner = false;
                toastr.success("File uploaded successfully");
            }
        });
		/* if (stat === true) {
			toastr.success("File uploaded successfully");
		} else {
			toastr.error("Failed uploading file, check file size is smaller than 2MB");
		} */
    };
    var getTotal = function (synId) { //get a total of all donations and all donations today
        date = new Date();
        $scope.mySyn.dailyTotal = 0;
        api.request('gabay/getTotal', {synagogue: synId})
                .then(function (data) {
                    $scope.mySyn.total = data.data;
                }, function (err) {
                    toastr.error('Error', err.data);
//                    //console.log(err);
                });
        api.request('gabay/dateFilter', {startDate: date, endDate: date, synagogue: $scope.mySyn.data.f_id})
                .then(function (data) {
                    for (var i = 0; i < data.data.rows.length; i++) {
                        $scope.mySyn.dailyTotal += parseInt(data.data.rows[i].f_sum);
                    }
                }, function (err) {
//                    //console.log(err);
                    toastr.error('Error', err.data);
                });
    };
    var init = function (tabActive) {
        $scope.timesWeek = [
            {time: $scope.langObj.morning, loc: 0},
            {time: $scope.langObj.noon, loc: 1},
            {time: $scope.langObj.evening, loc: 2},
        ];
        $scope.timesShabat = [
            {time: $scope.langObj.morning, loc: 3},
            {time: $scope.langObj.noon, loc: 4},
            {time: $scope.langObj.evening, loc: 5},
        ];
        $scope.mytimePicker = new Date();
		////console.log('init');
        $scope.gabayDcounter = 0;
        $scope.mySyn = {};
        $scope.mySyn.data = {};
        $scope.mySyn.data.f_times = [];
        $scope.messageRemoveSpinner = [];
        $scope.mail = {};
        $scope.popover = "templates/popover.html";
        $scope.checkMailList = false;
        $scope.mySyn.view = 'spinner';
        $scope.excelwait = false;
        $scope.user.synagogue = $scope.user.f_synagogue;
		
/* 		api.request('/b/getImage/', $scope.mySyn.data.f_id)
                .then(function (data) {
                    $scope.imgURL = "https://www.mh2.co.il/b/getImage/" + $scope.mySyn.data.f_id;
                }, function (err) {
                    
                }); */
		//$scope.imgUrl = "https://www.mh2.co.il/b/getImage/3";
		
        api.request('/gabay/init', $scope.user)
                .then(function (data) {
                       ////console.log(data);
                    $scope.mySyn = data.data;
//                    //console.log($stateParams.view);
                    $scope.mySyn.view = $stateParams.view || 'main';
                    getTotal($scope.mySyn.data.f_id);
                    if (tabActive) {
                        $scope.mySyn.view = tabActive;
                    }
                    $scope.mySyn.data.f_bank_account = $scope.mySyn.data.f_bank_account.split('-');
                },
                        function (err) {
                            toastr.error('Error', err.data);
//                            //console.log(err);
                        });
    };
    init();
    $scope.updateSyn = function (syn) {
        var arr = [];
        for (var i = 0; i < 6; i++) {
            arr.push(syn.f_times[i]);
        }
		syn.f_img = '';
        syn.f_times = arr;
        syn.f_bank_account = syn.f_bank_account[0] + '-' + syn.f_bank_account[1] + '-' + syn.f_bank_account[2];
//        //console.log(syn.f_bank_account);
        syn.synagogue = syn.f_id;
        $scope.mySyn.view = 'spinner';
        api.request('gabay/updateSyn', syn)
                .then(function (data) {
                    toastr.success($scope.langObj.actionsuccess);
                    init();
                }, function (err) {
                    toastr.error('Error', err.data);
//                    //console.log(err);
                    $scope.mySyn.view = 'main';
                });
    };
    $scope.getExcel = function (arr) {
        $scope.excelwait = true;
        api.request('b/excel', arr)
                .then(function (data) {
//                    //console.log(data);
                    toastr.success($scope.langObj.excelsent);
                    $scope.excelwait = false;
                }, function (err) {
                    $scope.excelwait = false;
                    toastr.error('Error', err.data);
                });
    };
    $scope.closeTime = function (t) {
        t.open = false;
    };
    $scope.changeTime = function (a, b) {
//        //console.log(a);
//        var c=new Date(a);
//        //console.log(a);
        var mins = b.getMinutes().toString();
        var hrs = b.getHours().toString();
        if (mins.length < 2) {
            mins = "0" + mins;
        }
        if (hrs.length < 2) {
            hrs = "0" + hrs;
        }
        var newtime = hrs + ':' + mins;
//        var c= +":"+ ;
//        //console.log(c.getHours());
//        //console.log(c.getMinutes());
//        //console.log(newtime);
        if (!$scope.mySyn.data.f_times) {
            $scope.mySyn.data.f_times = [];
        }
        $scope.mySyn.data.f_times[a.loc] = newtime;
        a.open = false;
//        //console.log(typeof a);
    };
    $scope.dateFilter = function (stDate, endDate) {
        $scope.filterGabay = false;
        $scope.mySyn.view = 'spinner';
        api.request('gabay/dateFilter', {startDate: stDate, endDate: endDate, synagogue: $scope.mySyn.data.f_id})
                .then(function (data) {
//                    //console.log(data);
                    $scope.mySyn.donations = data.data.rows;
                    $scope.mySyn.view = 'donations';
                }, function (err) {
//                    //console.log(err);
                });
    };
    $scope.listChanger = function (val) {
//        //console.log($scope.checkMailList);
        var i = $scope.mySyn.followers.length;
        while (i--) {
            $scope.mySyn.followers[i].mailto = val;
//            //console.log($scope.mySyn.followers[i].mailto);
        }
    };
    $scope.mailList = function () {
        $scope.mailListSpinner = true;
//        $scope.mail = {};
        var list = [];
        var i = $scope.mySyn.followers.length;
        while (i--) {
            if ($scope.mySyn.followers[i].mailto) {
                list.push($scope.mySyn.followers[i]);
            }
        }
        if (list.length === 0) {
            toastr.error("Mailing list is empty");
            return;
        }
        $scope.mail.syn = $scope.mySyn.data.f_name;
        $scope.mail.synid = $scope.mySyn.data.f_id;
        api.request('gabay/mailList', {mail: $scope.mail, followers: list, synagogue: $scope.mySyn.data.f_id})
                .then(function (data) {
                    toastr.success("Mail sent successfully!");
                    $scope.mailListSpinner = false;
                }, function (err) {
                    toastr.error('Error', err.data);
                    $scope.mailListSpinner = false;
//                    //console.log(err);
                });
    };
    $scope.gabayGetAll = function () {
//        //console.log($scope.mySyn.data.f_id);
        api.request('/gabay/getAllDonations', {syn: $scope.mySyn.data.f_id})
                .then(function (data) {
                    $scope.mySyn.donations = data.data;
//                    //console.log(data);
                }, function (err) {
                    toastr.error('Error', err.data);
//                    //console.log(err);
                });
    };
    $scope.addMessage = function (synId, message) {
        $scope.messageSpinner = true;

        if (typeof message !== 'string') {
            message = message.toString();
        }
        if ($scope.mySyn.data.f_messages && $scope.mySyn.data.f_messages.includes(message)) {
            toastr.error($scope.langObj.messageexists);
            $scope.messageSpinner = false;
        } else {
            api.request('gabay/addMessage', {synagogue: synId, message: message})
                    .then(function (data) {
                        if ($scope.mySyn.data.f_messages && $scope.mySyn.data.f_messages.length > 0) {
                            $scope.mySyn.data.f_messages.push(message);

                        } else {
                            $scope.mySyn.data.f_messages = [];
                            $scope.mySyn.data.f_messages.push(message);
                        }
                        $scope.mySyn.newMessage = '';
//                        //console.log(data);
                        $scope.messageSpinner = false;
                    }, function (err) {
                        $scope.messageSpinner = false;
                        toastr.error('Error', err.data);
//                        //console.log(err);
                    });
        }
    };
    $scope.updateManager = function (user, syn, main) {
        api.request('gabay/updateManager', {manager: user, synagogue: syn, main: main})
                .then(function (data) {
                    toastr.success($scope.langObj.manageradded);
//                    //console.log(data.data);
                    $scope.mySyn.data.f_manager_list = data.data[0].f_manager_list;
                    init('managers');
                }, function (err) {
                    toastr.error('Error', err.data);
//                    //console.log(err);
                });
    };
    $scope.removeMessage = function (synId, message, index) {
        $scope.messageRemoveSpinner[index] = true;
        api.request('gabay/removeMessage', {synagogue: synId, message: message})
                .then(function (data) {
                    var i = $scope.mySyn.data.f_messages.length;
                    while (i--) {
                        if ($scope.mySyn.data.f_messages[i] === message) {
                            $scope.mySyn.data.f_messages.splice(i, i + 1);
                        }
                    }
//                    //console.log(data);
                    $scope.messageRemoveSpinner[index] = false;
                }, function (err) {
                    toastr.error('Error', err.data);
//                    //console.log(err);
                    $scope.messageRemoveSpinner[index] = false;
                });
    };
    $scope.removeManager = function (synId, userId) {
        api.request('gabay/removeManager', {manager: userId, synagogue: synId})
                .then(function (data) {
                    toastr.success($scope.langObj.managerremoved);
//                    //console.log(data.data);
                    $scope.mySyn.f_manager_list = data.data[0].f_manager_list;
                    var i = $scope.mySyn.managers.length;
                    while (i--) {
                        if ($scope.mySyn.managers[i].f_id === userId) {
                            $scope.mySyn.managers.splice(i, 1);
                        }
                    }
                }, function (err) {
                    toastr.error('Error', err.data);
//                    //console.log(err);
                });
    };
});
app.controller('loginCtrl', function ($scope, $http, md5, $state, toastr, Facebook, api, vcRecaptchaService) {
    //recaptcha settings, functions and vars
    $scope.response = null;
    $scope.widgetId = null;

    $scope.model = {
        key: '6LdvNSQTAAAAAO2eLNaBRTVvdLX1viPvSWSill6W'
    };

    $scope.setResponse = function (response) {
        console.info('Response available');
        $scope.gotArecap = true;
        $scope.response = response;
    };

    $scope.setWidgetId = function (widgetId) {
        //console.info('Created widget ID: %s', widgetId);

        $scope.widgetId = widgetId;
    };

    $scope.cbExpiration = function () {
        console.info('Captcha expired. Resetting response object');

        $scope.gotArecap = false;

        vcRecaptchaService.reload($scope.widgetId);

        $scope.response = null;
    };

//    $scope.submit = function () {
//        var valid;
//
//        /**
//         * SERVER SIDE VALIDATION
//         *
//         * You need to implement your server side validation here.
//         * Send the reCaptcha response to the server and use some of the server side APIs to validate it
//         * See https://developers.google.com/recaptcha/docs/verify
//         */
//        //console.log('sending the captcha response to the server', $scope.response);
//
//        if (valid) {
//            //console.log('Success');
//        } else {
//            //console.log('Failed validation');
//
//            // In case of a failed validation you need to reload the captcha
//            // because each response can be checked just once
//            vcRecaptchaService.reload($scope.widgetId);
//        }
//    };

//    end of recaptcha
    $scope.reg = {};
    $scope.logging = 0;
    $scope.loginStatus = 'disconnected';
    $scope.facebookIsReady = false;
//    $scope.user = null;
    $scope.accessToken = null;
    function encrypt(pass, email) {
        return md5.createHash(pass + email);
    }
    function authenticateUser(user, cb) {
        var save = user.save;
        $http.post('/login/getlogin', user)
                .then(function (data) {
//                    //console.log(data);
                    if (data.data.action === "success") {
                        $scope.logging = 2;
                        $scope.user = data.data;
                        $scope.getDonations($scope.user);
                        if (save) {
                            $scope.$storage.user = $scope.user;
                        }
//                        //console.log("status:" + $scope.user.f_status);
                        cb();
                    } else {
                        $scope.logging = 3;
                    }

                }, function (err) {
//                    //console.log("err: " + err);
                    $scope.logging = 3;
                });
    }

    $scope.cancelLogin = function () {
        //$uibModalInstance.dismiss('cancel');
        //alert('cancel');
    };
    $scope.regSubmit = function () {  //submit registration
        if ($scope.reg.email.split('@').length !== 2 || $scope.reg.email.split('@')[1].split('.').length < 2) {
            toastr.error($scope.langObj.emailnotvalid);
        } else {
            if (!$scope.reg.first_name || $scope.reg.first_name === '' || !$scope.reg.last_name || $scope.reg.last_name === ''){
                toastr.error($scope.langObj.fillall);
            } else {
                window.scrollTo(0, 0);
                $scope.reg.view = 'spinner';
                function encrypt(pass, email) {
                    return md5.createHash(pass + email);
                }

                $http.post('/login/validateRecaptcha', {response: $scope.response})
                        .then(function (res) {
                            //console.log(res.data);
                            var obj = res.data.split('true');
//                    //console.log(res.data['success']);
//                    //console.log(obj.success);
                            //console.log(obj.length);
                            if (obj.length > 1) {
                                if ($scope.reg.password !== $scope.reg.passwordVerify || !$scope.reg.password) {
                                    toastr.error('Password verification does not match');
                                    $scope.reg.view = '';
                                } else {
                                    $scope.reg.passwordVerify = '';
                                    $scope.reg.password = encrypt($scope.reg.password, $scope.reg.email);
//                            //console.log($scope.reg);
                                    api.request('/login/regMail', $scope.reg)
                                            .then(function (data) {
                                                $scope.reg.password = '';
//                        //console.log("submitted successfully");
//                        //console.log(data.data);
                                                if (data.data === "Email already registered") {
                                                    toastr.error("Email already registered!");
                                                    $scope.reg.view = '';
                                                } else {
                                                    $state.go('verify');
                                                    $scope.reg.view = '';
                                                }
                                            }, function (err) {
                                                toastr.error('Error', err.data);
                                                $scope.reg.view = '';
                                                $state.go('register');
//                        //console.log(err);
                                            });
                                }
                            } else {
                                $scope.reg.view = '';
                                toastr.error('reCaptcha failure! Please try again!');
                                vcRecaptchaService.reload($scope.widgetId);
                            }
                        }, function (err) {
                            $scope.reg.view = '';
                            toastr.error('reCaptcha error! Please try again!');
                            vcRecaptchaService.reload($scope.widgetId);
                        });


            }
        }


    };
    $scope.initUser = function () {
        api.request('/b/initUserDonations')
                .then(function (data) {
//                    //console.log(data);
                    $scope.myDonations = data.data;
                }, function (err) {
                    toastr.error('Error', err.data);
//                    //console.log(err);
                });

    };
    $scope.pressLogin = function (user) {
        if (user && (user.email && user.email != '') && (user.pass && user.pass != '')) {
            user.pass = encrypt(user.pass, user.email);
            $scope.logging = 1;
            authenticateUser(user, function () {
                $state.go('home');
            });
        } else {
            toastr.error("Error");
        }

//                    //console.log(user);
    };
    $scope.resPass = function (email) { //restore
        $http.post('/login/resPass', {email: email}).then(
                function (data) {
					if (data.data.msg === 1){
						toastr.error($scope.langObj.mail_not_found);
					} else{
						toastr.success($scope.langObj.actionsuccess);  
					}
                },
                function (err) {
                    alert(err);
                });
    };
    $scope.ok = function (user) {
//        $uibModalInstance.close(user);
        alert(user);
    };
    //facebook login
    $scope.loginFB = function () {
        // From now on you can use the Facebook service just as Facebook api says
        Facebook.login(function (response) {
//            //console.log(response);
            $scope.getFBLoginStatus();
            ////console.log(response.authResponse.accessToken);
            $scope.accessToken = response.authResponse.accessToken;
            // Do something with response.
        }, {return_scopes: true, scope: 'email'});
    };
    $scope.getFBLoginStatus = function () {
        Facebook.getLoginStatus(function (response) {
            if (response.status === 'connected') {
                $scope.loggedIn = true;
                $scope.loginStatus = 'connected';
                $scope.api();
            } else {
//                //console.log('NOT CONNECTED');
                $scope.loggedIn = false;
            }
        });
    };
    $scope.api = function () {
        Facebook.api('/me', {fields: 'email,name'}, function (response) {
//            $scope.user = response.email;
//            //console.log(response);
            $http.post('/b/FaceBookLogin', {shortToken: $scope.accessToken})
                    .then(function (data) {
//                        //console.log(data.data);
                        $scope.user = data.data;
                        $scope.user.save = true;
                        $scope.getDonations($scope.user);
                        $scope.initUser();
                        $state.go('home');
                    }, function (err) {
//                        //console.log("err: " + err);
                        toastr.error('Error');
                    });
        });
    };
    $scope.$watch(function () {
        return Facebook.isReady();
    }, function (newVal) {
        if (newVal) {
            $scope.facebookIsReady = true;
        }
    });
});
app.controller('restoreCtrl', function ($scope, $state, $stateParams, md5, toastr, api) {
    var string = $stateParams.string;
    var email = $stateParams.email;
//    //console.log(string);
    $scope.verifyRestore = function () {
//        //console.log($scope.newPass);
        if ($scope.newPass.pass !== $scope.newPass.passVerify) {
            toastr.error("Passwords don't match!");
        } else {
            api.request('/login/changePass', {string: string, email: email, pass: md5.createHash($scope.newPass.pass + email)})
                    .then(function (data) {
//                        //console.log(data);
                        toastr.success(data.data);
                        $state.go('home');
                    }, function (err) {
//                        //console.log(err);
                        toastr.error('Error', err.data);
                    });
        }
    };
});
app.controller('verifyCtrl', function ($scope, $state, $stateParams, md5, toastr, api) {
    function verify(string) { //verify registration token from mailed link 
        api.request('/login/verify', {verify: string})
                .then(function (data) {
//                    //console.log(data);
                    if (data.data.status === "success") {
                        data.data.save = true;
                        data.data.f_status = 1;
                        $scope.saveUser(data.data);
                        $state.go("regsuccess");
                    } else {
                        toastr.error("Token not valid!!");
                        $state.go("home");
                    }
                }, function (err) {
                    toastr.error('Error', err.data);
//                    //console.log(err);
                });
    }
//    $scope.string = false;
    if ($stateParams.string && $scope.string !== true) {
        $scope.string = true;
    }
    $scope.activate = function () {
        $scope.actMod = 'working';
        verify($stateParams.string);
    };

});
app.controller('changeMailCtrl', function ($scope, $state, $stateParams, md5, toastr, api) {
    var string = $stateParams.string;
    var email = $stateParams.email;
//    //console.log(string + email);
    api.request('b/insertNewMail', {string: string, email: email})
            .then(function (data) {
//                //console.log(data);
                toastr.success($scope.langObj.emailschangesuccess);
                if ($scope.user && $scope.user.f_pending_email) {
                    $scope.user.f_name = $scope.user.f_pending_email;
                    $scope.user.f_pending_email = null;
                    $scope.saveUser($scope.user);
                }
                $state.go('home');
            }, function (err) {
                toastr.error('Error', err.data);
//                //console.log(err);
            });
});
app.controller('modalCtrl', function ($scope, $uibModalInstance, langObj, panel) {
    $scope.panel = panel;
    $scope.langObj = langObj;
    $scope.close = function () {
        $uibModalInstance.dismiss('cancel');
    };
    $scope.ok = function () {
        $uibModalInstance.close();
    };
});
app.filter('startFrom', function () {
    return function (input, start) {
        start = +start; //parse to int
        return input.slice(start);
    };
});
