let tokenManagerApp = angular.module('tokenManagerApp' , ['commonApp', 'ui.bootstrap']);


tokenManagerApp.controller('tokenManagerCtrl', function($scope,$timeout,tokenManagerService) {
    $scope.currentPage = 1; //table
    $scope.numPerPage = 10; //table
    $scope.totalItem = 0;
    $scope.tokenList = [];
    $scope.clickedTokenObj = {};
    
    $scope.getTokens = function() {
        $timeout(()=> {
            tokenManagerService.getTokens($scope).then(res=> {
                $scope.tokenList = res.data.tokenList;
                $scope.totalItem = res.data.total;
            })
        })
    }
    $scope.getTokens();


    $scope.showTokenAccessList = function (tokenObj) {
        $scope.clickedTokenObj = tokenObj;
        $("#modelId").modal("show");
    }

    $scope.deleteToken = function(tokenObj) {
        Swal.fire({
            focusConfirm: false,
            title: "Are you sure??",
            text: "Any apps using this token will no longer be able to access the Burni. You cannot undo this action.",
            confirmButtonText: "Yes, I want to delete this token",
            cancelButtonText: `No`,
            showCancelButton: true,
            showCloseButton: true
            
        }).then((result)=> {
            if (result.isConfirmed) {
                tokenManagerService.deleteToken(tokenObj).then(res=> {
                    if (res.data.status == true) {
                        Swal.fire({
                            title: "Info!",
                            text: `Delete Token ${tokenObj.tokenName} success`
                        })
                        $scope.getTokens();
                    }
                })
            }
        })
    }

});

tokenManagerApp.service('tokenManagerService', function($http) {
    return {
        getTokens: getTokens,
        deleteToken: deleteToken
    }

    function getTokens ($scope) {
        let request = $http({
            method: "GET",
            url: "/user/token",
            params: {
                _offset: ($scope.currentPage - 1) * $scope.numPerPage,
                _count: $scope.numPerPage
            }
        });
        return request.then(handleSuccess, handleError);
    }

    function deleteToken(tokenObj) {
        let request = $http({
            method: "DELETE",
            url: `/user/token/${tokenObj._id}`
        });
        return request.then(handleSuccess, handleError);
    }

    function handleSuccess(res) {
        return res;
    }

    function handleError(err) {
        console.error(err);
        return err;
    }
});