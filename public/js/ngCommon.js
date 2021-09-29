let commonApp = angular.module("commonApp" , []);

commonApp.directive("navbar" , ['$rootScope' , function () {
    let pathItem = [
        {
            path: "/tokenIssuer",
            class: "link-token-issuer"
        },
        {
            path: "/tokenManager",
            class: "link-token-manager"
        }
    ]
    return {
        replace : false , 
        restrict : 'EA' , 
        templateUrl : "/html/navbar.html",
        link: function($scope) {
            let checkItemInterval = setInterval(function() {
                if ($('.active').length > 0 ) {
                    $('.active').removeClass('active');
                    clearInterval(checkItemInterval);
                    let currentPathObj = pathItem.find(
                        v=> v.path == window.location.pathname
                    );
                    if (currentPathObj) {
                        $(`.${currentPathObj.class}`).addClass('active');
                    }
                }
            } , 100);
        }
    }
}]);