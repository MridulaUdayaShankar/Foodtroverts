$(document).ready(function () {
    //=========================GLOBAL===============================//
    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyCOSZbFya-dU4ArdvJH1Ky343FY1Y6lhU8",
        authDomain: "thedemo-833f6.firebaseapp.com",
        databaseURL: "https://thedemo-833f6.firebaseio.com",
        projectId: "thedemo-833f6",
        storageBucket: "thedemo-833f6.appspot.com",
        messagingSenderId: "932306555354"
    };
    firebase.initializeApp(config);

    var database = firebase.database();

    var connectionsRef = database.ref("/connections");
    var connectedRef = database.ref(".info/connected");
    var selectedFile;
    var userImgURL = "";
    var storageRef;
    var userDisplayImg = $("<img>");

    var foodPrefArr = ["American","Chinese","Filipino","French","German","Indian","Italian","Japanese","Korean","Mexican","Norwegian","Portuguese","Spanish","Thai", "Vietnamese"];

    var selectedRestName = "";
    var selectedRestAddress = "";
    var selectedRestImgUrl = "";


    for(var i = 0; i < foodPrefArr.length; i++){
        var foodOption = $("<option>");
        foodOption.attr("value", foodPrefArr[i]);
        foodOption.text(foodPrefArr[i]);
        $("#foodPref").append(foodOption);
    };

    //input an event when a file is uploaded.
    $("#file").on("change", function (event) {
        //append a small image of user.
        // setting selectedFile to be the file being uploaded.
        selectedFile = event.target.files[0];

        $("#fileLabel").text(selectedFile.name);
    });


    //button for city entry
    $("#submitImage").on("click", function () {
        event.preventDefault();
        var fileName = selectedFile.name;
        storageRef = firebase.storage().ref("images/" + fileName);
        console.log("what is file name? " + fileName);

        var uploadTask = storageRef.put(selectedFile);
        $("#uploadedImg").html("<img class='animated infinite rotateIn rotateOut loading' src='assets/images/logo_small.svg'>");
        // Register three observers:
        // 1. 'state_changed' observer, called any time the state changes
        // 2. Error observer, called on failure
        // 3. Completion observer, called on successful completion
        uploadTask.on('state_changed', function (snapshot) {
            // Observe state change events such as progress, pause, and resume
            // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
            var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload is ' + progress + '% done');
            switch (snapshot.state) {
                case firebase.storage.TaskState.PAUSED: // or 'paused'
                    console.log('Upload is paused');
                    break;
                case firebase.storage.TaskState.RUNNING: // or 'running'
                    console.log('Upload is running');
                    break;
            }
        }, function (error) {
            // Handle unsuccessful uploads
        }, function () {
            // Handle successful uploads on complete
            // For instance, get the download URL: https://firebasestorage.googleapis.com/...
            uploadTask.snapshot.ref.getDownloadURL().then(function (downloadURL) {
                console.log('File available at', downloadURL);
                userImgURL = downloadURL;
                userDisplayImg.attr("src",downloadURL);
                userDisplayImg.addClass("userImage")
                $("#uploadedImg").html(userDisplayImg);
                
            });
        });
    });



    connectedRef.on("value", function (snap) {
        var userObj = {};
        if (snap.val()) {
            $("#submitPref").on("click", function (event) {
                event.preventDefault();

                var userName = $("#userName").val().trim();
                var userFoodPref = $("#foodPref").val().trim();
                var userPrefTime = $("#timePref").val().trim();
                var userLoc = $("#userLoc").val().trim();
                console.log("ENTERED SUBMIT")
                if(userName !== '' && userFoodPref !== 'Select' && userPrefTime !== 'Select'){
                    console.log("ENTERED IF")
                $("#userForm").addClass("d-none");
                $("#restaurant-list").removeClass("d-none");
                $("#restaurantP").append("<img class='animated infinite rotateIn rotateOut loadingRest' src='assets/images/logo_small.svg'>");

              

                userObj["name"] = userName;
                userObj["preference"] = userFoodPref;
                userObj["preference time"] = userPrefTime;
                userObj["location"] = userLoc;
                userObj["imageURL"] = userImgURL;
                console.log(userObj);

                //=====IPData=======/
                $.get("https://api.ipdata.co/", function (res) {

                    if (userLoc === "") {
                        var currentCity = res["postal"];
                        userObj.location = currentCity;
                    }
                    //=====Google Places=======/

                    var authKey = "AIzaSyCOSZbFya-dU4ArdvJH1Ky343FY1Y6lhU8";
                    var city = userObj["location"];
                    var preference = userObj["preference"];
                    var queryURL = "https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/textsearch/json?query=" + preference + " restaurants+in+" + city + "&key=" + authKey;

                    $.ajax({
                        url: queryURL,
                        method: "GET"
                    }).then(function (response) {
                        // console.log("Place ID: " + response.results[0].place_id);
                        var results = response.results

                        for (var i = 0; i < 5; i++) {
                            var restDiv = $('<div>');
                            var restNameTag = $('<h4>');
                            var restAddressTag = $('<p>');
                            var restAddress = results[i]["formatted_address"];
                            var restName = results[i]["name"];

                            restDiv.addClass('restSelected');
                            restDiv.attr('data-id', results[i]['id']);
                            restDiv.attr('data-name', restName);
                            restDiv.attr('data-address', restAddress);
                            // restDiv.attr('data-url', results[i]['url'])

                            restNameTag.text(restName);
                            restAddressTag.text(restAddress);

                            restDiv.append(restNameTag);
                            restDiv.append(restAddressTag);
                            $("#restaurantP img:last-child").remove();
                            $('#restaurantP').append(restDiv);

                        }


                    }, "jsonp");
                });
            } else {
                console.log("ENTERED ELSE")
                var msgErrorTag = $("<h4>");
                var msgError = "Missing an input please check."
                msgErrorTag.text(msgError);

                msgErrorTag.attr("id","errorText")
                msgErrorTag.addClass("font-weight-bold text-danger text-right my-auto");

                $("#submitMessage").html(msgErrorTag);
                // $("#warningModal").modal('toggle');
                // $("#warningModal").modal('show');
              // alert("Fill it out");
            }
            //
            });



            $(document).on("click", ".restSelected", function () {

                $("#restaurant-list").addClass("d-none");
                $("#buddy-list").removeClass("d-none");

                //push id into object

                dataID = $(this);
                userObj["rest ID"] = dataID.attr("data-id")

                console.log(userObj);
                var con = connectionsRef.push(userObj);
                var newID = con.getKey();
                var userMatched = false;
                var listOfBuddies = [];
                var listofBudImgs = [];
                

                // adding new section for the 'matched' restaurant results to display when matched with your buddy.
                var restNameMatchTag = $('<h3>');
                var restAddressMatch = $('<p>');
                restNameMatchTag.text($(this).attr('data-name'));
                restAddressMatch.text($(this).attr('data-address'));
                // console.log($(this).attr('data-name'));
                $('#restaurant-info').append(restNameMatchTag);
                $('#restaurant-info').append(restAddressMatch);
                console.log($(this).attr('data-address'));

                
                //Cycling through current connections, however it is currently including the user from above due to "connectionsRef.push(userObj)"
                //May need to create a unique number ID as part of the object prior to push.
                database.ref("/connections").on("child_added", function (childSnapshot) {

                    matchRestID = childSnapshot.val()["rest ID"];
                    matchUniqueID = childSnapshot.key;
                    // console.log(userObj["rest ID"]);
                    // console.log(matchRestID);
                    // console.log(newID);
                    // console.log(matchUniqueID);

                    if ((matchRestID === userObj["rest ID"]) && (newID !== matchUniqueID)) {
                        console.log("WOOOHOOO")
                        var headerText = "";
                        userMatched = true;

                        listOfBuddies.push(childSnapshot.val()["name"]);
                        console.log(listOfBuddies);
                        listofBudImgs.push(childSnapshot.val()["imageURL"])

                        $("#buddyResults").empty();
                        var buddyDiv = $("<div>");
                        var header = $("<h3>");

                        header.text("We found some fellow Foodtroverts!");
                        buddyDiv.append(header);


                        for (var i = 0; i < listOfBuddies.length; i++) {
                            var imageTag = $("<img>");
                            var imageSrc = listofBudImgs[i];
                            var personName = $("<p>");

                            imageTag.attr("src", imageSrc);
                            imageTag.addClass("userImage");
                            personName.text(listOfBuddies[i]);

                            buddyDiv.append(imageTag);
                            buddyDiv.append(personName);
                            $("#buddyResults").append(buddyDiv);
                        }
                        console.log(headerText);

                    } else if (userMatched === false) {
                        console.log("sorry no match yet :(")
                        $("#buddyResults").empty();

                        var buddyDiv = $("<div>");
                        var header = $("<h3>");
                        var loadingImg = $("<img>");
                        loadingImg.attr("src", "assets/images/logo_small.svg");
                        loadingImg.addClass('animated infinite rotateIn rotateOut loading');
                        header.text("Searching for fellow Foodtroverts...");
                        buddyDiv.append(loadingImg);
                        buddyDiv.append(header);


                        $("#buddyResults").append(buddyDiv);
                    }

                })
                con.onDisconnect().remove().then(function () {
                    // storageRef.delete();
                });
            });
        }
    });

});

