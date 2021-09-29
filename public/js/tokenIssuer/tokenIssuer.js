let tokenIssuerApp = angular.module('tokenIssuerApp', ['commonApp']);

tokenIssuerApp.controller('tokenIssuerCtrl' , function ($scope , $timeout, $q , tokenIssuerService) {

    $scope.supportedInteraction = ["create", "read", "vread", "search-type", "history", "delete", "update"];
    $scope.resourceAccessList = [];
    $scope.chosenInteraction = [];
    $scope.chosenResourceAccessList = [];
    $scope.addedResourceAccessList = [];
    $scope.generatedKey = "";
    $scope.curPage = 1;
    $scope.numPerPage = 10;
    let resourceTypeList = [];
    tokenIssuerService.getMetadata().then(res => {
        let fhirMetadata = res.data;
        for (let resource of fhirMetadata.rest[0].resource) {
            let obj = {
                resourceType : resource.type
            }
            for (let interaction of $scope.supportedInteraction) {
                obj[interaction] = false;
            }
            $scope.resourceAccessList.push(obj);
            resourceTypeList.push(resource.type);
        }
    });

    let selectMultipleTokenAccess = new SlimSelect({
        select: '#select-multiple-token-access',
        placeholder: "Select resource types",
        onChange: (e)=> {
            $timeout(()=> {
                if (e.length == 0) {
                    $scope.chosenResourceAccessList = [];
                    $scope.chosenInteraction = [];
                    selectMultipleAccessInteraction.set([]);
                }
                for (let item of e) {
                    let chosenResourceAccessExist = $scope.chosenResourceAccessList.find( v => v.resourceType === item.value);
                    if (!chosenResourceAccessExist) {
                        let resourceAccessObj = {
                            resourceType: item.value
                        };
                        $scope.chosenResourceAccessList.push(resourceAccessObj);
                    }
                }
            })
        }
    });

    let selectMultipleTokenAccessDataId = $("#select-multiple-token-access").attr("data-ssid");
    $(`.${selectMultipleTokenAccessDataId} .ss-content`).prepend(
        `
        <div class="ss-list">
            <div class="btn-group d-flex" role="group">
                <button class="btn btn-secondary w-100 mr-1 select-all">Select all</button>
                <button class="btn btn-secondary w-100 ml-1 deselect-all">Deselect all</button>
            </div>
        </div>
        `
    )
    
    $(`.${selectMultipleTokenAccessDataId} .ss-content .ss-list .select-all`).click(()=> {
        selectMultipleTokenAccess.set(resourceTypeList);
    });

    $(`.${selectMultipleTokenAccessDataId} .ss-content .ss-list .deselect-all`).click(()=> {
        $scope.clearSelectMultipleTokenAccess();
    });

    let selectMultipleAccessInteraction = new SlimSelect({
        select: '#select-multiple-access-interaction',
        placeholder: "Select interactions that this token can access",
        onChange: (e)=> {
            if (e.length == 0) {
                $scope.chosenInteraction = [];
            }
            for (let interaction of $scope.supportedInteraction ) {
                for (let chosenResourceAccess of $scope.chosenResourceAccessList) {
                    delete chosenResourceAccess[interaction];
                }
            }
            for (let item of e) {
                $scope.chosenInteraction.push(item.value);
            }
        }
    });
    
    $scope.clearSelectMultipleTokenAccess = function () {
        selectMultipleTokenAccess.set([]);
        selectMultipleAccessInteraction.set([]);
    }

    let selectMultipleAccessInteractionDataId = $("#select-multiple-access-interaction").attr("data-ssid");
    $(`.${selectMultipleAccessInteractionDataId} .ss-content`).prepend(
        `
        <div class="ss-list">
            <div class="btn-group d-flex" role="group">
                <button class="btn btn-secondary w-100 mr-1 select-all">Select all</button>
                <button class="btn btn-secondary w-100 ml-1 deselect-all">Deselect all</button>
            </div>
        </div>
        `
    )
    
    $(`.${selectMultipleAccessInteractionDataId} .ss-content .ss-list .select-all`).click(()=> {
        selectMultipleAccessInteraction.set($scope.supportedInteraction);
    });
    
    $(`.${selectMultipleAccessInteractionDataId} .ss-content .ss-list .deselect-all`).click(()=> {
        selectMultipleAccessInteraction.set([]);
    });
    

    $scope.add = function() {
        $timeout(()=> {
            if ($scope.chosenInteraction.length == 0 || $scope.chosenResourceAccessList.length == 0) {
                Swal.fire({
                    title: 'Error!',
                    text: 'Please chose the resource types and permission of interactions',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
                return ;
            }
            for (let chosenResourceAccess of $scope.chosenResourceAccessList) {
                let addedResourceAccessExist = $scope.addedResourceAccessList.find( v=> v.resourceType === chosenResourceAccess.resourceType);
                let cloneChosenResourceAccess = JSON.parse(JSON.stringify(chosenResourceAccess))
                for (let interaction of $scope.chosenInteraction) {
                    cloneChosenResourceAccess[interaction] = true;
                }
                if (!addedResourceAccessExist) {
                    $scope.addedResourceAccessList.push(cloneChosenResourceAccess);
                } else {
                    addedResourceAccessExist = Object.assign(addedResourceAccessExist, cloneChosenResourceAccess);
                }
            }
            $scope.clearSelectMultipleTokenAccess();
        })
    }

    $scope.remove = function(resourceType, key) {
        let hitResourceAccessIndex = $scope.addedResourceAccessList.findIndex( v=>  v.resourceType === resourceType);
        let hitResourceAccess = $scope.addedResourceAccessList[hitResourceAccessIndex];
        delete hitResourceAccess[key];
        //only have resourceType and $$hashKey        
        if (Object.keys(hitResourceAccess).length == 2) {
            $scope.addedResourceAccessList.splice(hitResourceAccessIndex,1);
        }
    }

    $scope.paginate = function (value) {
        var start, end, index;
        start = ($scope.curPage - 1) * $scope.numPerPage;
        end = start + $scope.numPerPage;
        index = $scope.addedResourceAccessList.indexOf(value);
        return (start <= index && index < end);
    }

    $scope.generate = function() {
        if ($scope.addedResourceAccessList.length == 0) {
            Swal.fire({
                title: 'Error!',
                text: 'Please add at least one item',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }
        if (!$scope.tokenName) {
            Swal.fire({
                title: 'Error!',
                text: 'Please type token name',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }
        tokenIssuerService.postGenerateKey({
            accessList : [...$scope.addedResourceAccessList],
            tokenName: $scope.tokenName
        }).then(res => {
            if (res.status != 200) {
                Swal.fire({
                    title: 'Error!',
                    text: res.data.result,
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            } else {
                Swal.fire({
                    toast: true,
                    position: 'top-right',
                    showConfirmButton: false,
                    text: `Generate Key Success`,
                    icon: 'info',
                    timer: 1500,
                    timerProgressBar: true
                });
                $scope.generatedKey = res.data.token;
            }
        })
    }

    $scope.copyKey = function () {
        Swal.fire({
            toast: true,
            position: 'top-right',
            showConfirmButton: false,
            text: `Copy Success`,
            icon: 'info',
            timer: 1000,
            timerProgressBar: true
        });
        navigator.clipboard.writeText($scope.generatedKey);
    }

});

tokenIssuerApp.service('tokenIssuerService' , function ($http) {
    return {
        getMetadata: getMetadata,
        postGenerateKey: postGenerateKey
    }

    function getMetadata() {
        let request = $http({
            method: "GET",
            url: `${myConfig.FHIR.base}/metadata`
        });
        return request.then(handleSuccess, handleError);
    }

    function postGenerateKey(body) {
        let request = $http({
            method: "POST",
            data : body,
            url: "/user/token/issue",
            headers: {
                "content-type": "application/json"
            }
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