let navbarApp = angular.module("navbarApp", []);

navbarApp.controller('navbarCtrl' , function($scope,$timeout) {
    console.log(window.location);
})

