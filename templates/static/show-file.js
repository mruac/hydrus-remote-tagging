var current = location.href.split('/')[4].replace(/\?.*$/, '');
var next = parseInt(current) + 1
var prev = parseInt(current) - 1
var thres = 150
var submitToggle = true



//skip if file is not image or video
if ($('h1').hasClass('nm-text')) {
    window.location = next
};

//hook into Bootstrap 5's offCanvas sidebar #metadataSidebar
var offcanvas_el = document.getElementById("metadataSidebar")
var offcanvas = new bootstrap.Offcanvas(offcanvas_el, {
    backdrop: false
})

//Keep #metadataSidebar open/closed across pages
if (sessionStorage.getItem('sidebar')) {
    offcanvas_el.classList.add('show')
} else {
    offcanvas_el.classList.remove('show')
}


offcanvas_el.addEventListener('hidden.bs.offcanvas', function () {
    sessionStorage.setItem('sidebar', false);
})
offcanvas_el.addEventListener('shown.bs.offcanvas', function () {
    sessionStorage.setItem('sidebar', true);
})


//ovveride Bootstrap 5's focusin eventlistener to allow text input while #metadataSidebar is open
document.addEventListener('focusin', function (e) {
    e.stopImmediatePropagation();
});

//toggle list of tags sidebar (Alt)
var toggleSidebarKey = true;
$(document).keyup(function (e) {
    if (e.which == 18) {
        offcanvas.toggle();
        e.preventDefault();
        return;
    }
});

//Submit #inputTags (Enter)
$(document).keypress(function (e) {
    if (e.which == 13 && submitToggle) {
        tags = $("#inputTags").val();
        if (tags == "") {
            toNextFile();
        } else {
            sendTags(tags);
        }
    }
});

$("#submitTags").click(function () {
    tags = $("#inputTags").val();
    if (tags == "") {
        toNextFile();
    } else {
        sendTags(tags);
    }
});

function toNextFile() {
    window.location = next;
};

//flask renders a var object with namespaces and colors

function insertTag(tag, className) {
    var tagel = `<span class="modifiable ${className}">${tag}</span>`;

    if (tag > $.trim($("#listOfTags span:last").text())) {
        $("#listOfTags").append(`${tagel}</br>`);
    } else {
        $("#listOfTags span").each(function (i, v) {
            if (!($.trim($(v).text()) < tag)) {
                $(v).before(`${tagel}</br>`);
                return false;
            };
        });
    }
};

function removeTag(tag) {
    $("#listOfTags span").each(function (i, v) {
        if ($.trim($(v).text()) == tag) {
            $(v).nextAll('br:first').remove();
            $(v).remove();
            return false;
        }
    });
}

/*
fixed: Revise tag class checking mechanism - doesn't work properly when tags are bulk added. - Works fine on page load though.
Some tags of the same class gets colored and some don't. - Swapped .forEach to for (var i = 0; i < tags.length; i++) since forEach doesn't work on the tags arr directly.
NOTE:ADDME: Add "Delete File" option (add this last as it this isn't archive/delete - and when delete reason via api is possible)
*/

//Begin resizable sidebar
var windowWidthMin = $(window).width() * .20;
var windowWidthMax = $(window).width() * .80;
$(window).on("resize", function () {
    windowWidthMin = $(window).width() * .20;
    windowWidthMax = $(window).width() * .80;
    var sidebarWidth = parseInt($('#metadataSidebar').css("width"));
    if (sidebarWidth < windowWidthMin) {
        $('#metadataSidebar').css("width", windowWidthMin + 'px');
    } else if (sidebarWidth > windowWidthMax) {
        $('#metadataSidebar').css("width", windowWidthMax + 'px');
    }
});
if (localStorage.getItem("sidebarWidth") != null &&
    parseInt(localStorage.getItem("sidebarWidth")) > windowWidthMin &&
    parseInt(localStorage.getItem("sidebarWidth")) < windowWidthMax) {
    $('#metadataSidebar').width(parseInt(localStorage.getItem("sidebarWidth")));
}

var isResizingSidebar = false;
//resizing with cursor
$("#metadataSidebarDraggable").on("mousedown touchstart", function () {
    isResizingSidebar = true;
    $("body").addClass("no-select");
});
$(document).on("mousemove touchmove", function (e) {
    if (!isResizingSidebar) { return; }
    var currentXpos = e.clientX == undefined ? e.changedTouches[0]["clientX"] : e.clientX;
    if ( currentXpos < windowWidthMax && currentXpos > windowWidthMin) {
        $('#metadataSidebar').css("width", `${$(window).width() - currentXpos}px`);
    }
});
$(document).on("mouseup touchend", function () {
    isResizingSidebar = false;
    $("body").removeClass("no-select");
    var sidebarWidth = parseInt($('#metadataSidebar').css("width"));

    if (sidebarWidth < windowWidthMin) {
        $('#metadataSidebar').css("width", `${windowWidthMin}px`);
    } else if (sidebarWidth > windowWidthMax) {
        $('#metadataSidebar').css("width", `${windowWidthMax}px`);
    }
    localStorage.setItem("sidebarWidth", $('#metadataSidebar').width());
});

//resizing with touch

//End resizable sidebar


function sendTags(tags) {
    $("#inputTags").prop('disabled', true);
    $("#submitTags").prop('disabled', true);
    submitToggle = false;
    //FIXME: Add loading indicator & prevent further input until resolved (.done() is reached) else return failed indicator. - Indicator could be color of inpput bar & button?
    // FIXME: when appendTags is tagged, appendTags is tagged twice. & Add support to remove it if it already exists.
    //NOTE: fixed? when a file is tagged with multiple tags in one query, appendTags will be placed in the middle of these tags and fail to place a <br> after it.
    /* Eg. [a,b,c,d], appendTag = "beet", result: a <br> b <br> beetc <br> d */
    //TESTME: handle when [currentRepo] doesn't exist - check & initialise
    if (metadata["service_names_to_statuses_to_tags"][currentRepo] !== undefined) {
        var currentTags = metadata["service_names_to_statuses_to_tags"][currentRepo]["0"];
        var deletedTags = metadata["service_names_to_statuses_to_tags"][currentRepo]["2"];
        if (currentTags == undefined) { currentTags = []; }
        if (deletedTags == undefined) { deletedTags = []; }
    } else {
        currentTags = [];
        deletedTags = [];
    }
    var data = {
        "add": [],
        "del": [],
        hash: metadata["hash"],
    }
    tags = tags.split(',');
    for (var i = 0; i < tags.length; i++) { //clean each tag
        tags[i] = tags[i].trim(); //trim whitespace around tag
        tags[i] = tags[i].toLowerCase();
    }
    tags = tags.filter((v, i) => tags.indexOf(v) === i); //remove duplicates
    //NOTE: move "remove dupe tags" to python side to catch any "appendTags" since those are applied on python's side?
    tags.forEach(function (tag) { //sort tags into add & del
        if (tag == "") { return; }
        if (currentTags.indexOf(tag) > -1) {
            currentTags.splice(currentTags.indexOf(tag), 1);
            data["del"].push(tag);
            deletedTags.push(tag);
        }
        else if (deletedTags.indexOf(tag) > -1) {
            deletedTags.splice(deletedTags.indexOf(tag), 1);
            data["add"].push(tag);
            currentTags.push(tag);
        } else {
            data["add"].push(tag);
            currentTags.push(tag);
        }
    });
    console.log(data);
    $.ajax({
        type: "POST",
        url: "/updateTags",
        data: JSON.stringify(data),
        dataType: "json",
        contentType: "application/json; charset=utf-8"
    }).done(function (response) {
        $("#inputTags").prop('disabled', false).val("");
        $("#inputTags").focus();
        $("#submitTags").prop('disabled', false);
        submitToggle = true;
        console.log(response);
        var addTags = response[currentRepo]["0"];
        var delTags = response[currentRepo]["1"];
        addTags.forEach(tag => { insertTag(tag, response["matches"][tag]) });
        delTags.forEach(tag => { removeTag(tag) });
    }).fail(function (jqXHR, textStatus, errorThrown) {
        $("#inputTags").addClass("bg-danger");
        $("#submitTags").addClass("bg-danger");
        setTimeout(function () {
            submitToggle = true;
            $("#inputTags").prop('disabled', false).removeClass("bg-danger");
            $("#submitTags").prop('disabled', false).removeClass("bg-danger");
        }, 1000);
        console.log(jqXHR); console.log(textStatus); console.log(errorThrown);
    });
};

$("#inputTags").focus();