﻿
var skydrive = skydrive || {}; 

(function () {

    "use strict";

    var _this = this;
    var selected, downloaded;



    skydrive.showUI = function (selectCallback, fileLoadedCallback) {


        WL.init({ client_id: "00000000480EF140", redirect_uri: window.location.origin});

       
        WL.login({ "scope": "wl.skydrive" }).then(
            function (response) {
                openFromSkyDrive();
            },
            function (response) {
                log("Failed to authenticate.");
            }
        );

        function openFromSkyDrive() {
            WL.fileDialog({
                mode: 'open',
                select: 'multi'
            }).then(
            function (response) {
                log("The following file is being downloaded:");
                log("");

                var files = response.data.files;
                for (var i = 0; i < files.length; i++) {
                    var file = files[i];
                    log(file.name);
                    WL.download({ "path": file.id + "/content" }, onDownloadFileCompleted).then(
                        function (response) {
                            var r = response;
                        },
                        function (responseFailed) {
                            log("Error downloading file: " + responseFailed.error.message);
                    });
                }
            },
            function (errorResponse) {
                log("WL.fileDialog errorResponse = " + JSON.stringify(errorResponse));
            }
        );
        }

        function onDownloadFileCompleted(response) {
            var msg = "";
            // For each folder selected...
            if (response.data.folders.length > 0) {
                for (folder = 0; folder < response.data.folders.length; folder++) {
                    // Use folder IDs to iterate through child folders and files as needed.
                    msg += "\n" + response.data.folders[folder].id;
                }
            }
            // For each file selected...
            if (response.data.files.length > 0) {
                for (file = 0; file < response.data.files.length; file++) {
                    // Use file IDs to iterate through files as needed.
                    msg += "\n" + response.data.files[file].id;
                }
            }
      
        }

        function log(message) {
            console.log(message);
        }

        function onDownloadFileCompleted(response) {
            var msg = "";
            // For each folder selected...
            if (response.data.folders.length > 0) {
                for (folder = 0; folder < response.data.folders.length; folder++) {
                    // Use folder IDs to iterate through child folders and files as needed.
                    msg += "\n" + response.data.folders[folder].id;
                }
            }
            // For each file selected...
            if (response.data.files.length > 0) {
                for (file = 0; file < response.data.files.length; file++) {
                    // Use file IDs to iterate through files as needed.
                    msg += "\n" + response.data.files[file].id;
                }
            }
            log(msg);
        };

    }

})();