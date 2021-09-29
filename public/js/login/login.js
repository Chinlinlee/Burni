$(()=> {
    $(".nav").load('/html/navbar.html')
})
let loginApp = angular.module('loginApp' , []);

loginApp.controller('loginCtrl' , function($scope, $q, loginService) {
    $scope.username= "";
    $scope.password= "";

    $scope.login = ()=> {
        loginService.login($scope).then(res=> {
            if (res.status == 401) {
                alert('Invalid username or password');
            } else {
                window.location = "/tokenIssuer";
            }
        });
    }

    $scope.submit = function() {
        $scope.login();
    }

    // $("#inputUsername,#inputPassword").keyup( (event)=> {
    //     if(event.keyCode == 13) {
    //         $scope.login();
    //     }
    // });

});

loginApp.service('loginService', function($http) {
    return {
        login: login
    };
    function login($scope) {
        let request = $http({
            method: "POST",
            url: "/user/adminLogin",
            params: {
                username : $scope.username,
                password: $scope.password
            }
        });
        return request.then(handleSuccess, handleError);
    }

    function handleSuccess(res) {
        return res;
    }

    function handleError(err) {
        console.error(err)
        return err;
    }
});