var current = location.href.split('/')[4].replace(/\?.*$/, '');
var next = parseInt(current) + 1
var prev = parseInt(current) - 1
var thres = 150
var submitToggle = true
var isNotShortcut = true

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

//prevent toggling sidebar if modifier keys are used in keyboard shortcut
$(document).keydown(function (e) {
    switch (true) {
        case (localStorage.getItem("sidebarToggleKey") == "ctrl" && e.which != 17 && e.ctrlKey):
        case (localStorage.getItem("sidebarToggleKey") == "shift" && e.which != 16 && e.shiftKey):
        case (localStorage.getItem("sidebarToggleKey") == "alt" && e.which != 18 && e.altKey):
            isNotShortcut = false;
    }
});

//toggle list of tags sidebar (localStorage.getItem("sidebarToggleKey"))
$(document).keyup(function (e) {
    switch (true) {
        case (localStorage.getItem("sidebarToggleKey") == "ctrl" && e.which == 17):
        case (localStorage.getItem("sidebarToggleKey") == "shift" && e.which == 16):
        case (localStorage.getItem("sidebarToggleKey") == "alt" && e.which == 18):
            if (isNotShortcut) {
                offcanvas.toggle();
                e.preventDefault();
                return;
            } else { isNotShortcut = true; }
    }
});

//Submit #inputTags (Enter)
$(document).keyup(function (e) {
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
    if (currentXpos < windowWidthMax && currentXpos > windowWidthMin) {
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
//End resizable sidebar

function sendTags(tags) {
    $("#inputTags").prop('disabled', true);
    $("#submitTags").prop('disabled', true);
    submitToggle = false;
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
    }).fail(function () {
        $("#inputTags").addClass("bg-danger");
        $("#submitTags").addClass("bg-danger");
        setTimeout(function () {
            submitToggle = true;
            $("#inputTags").prop('disabled', false).removeClass("bg-danger");
            $("#submitTags").prop('disabled', false).removeClass("bg-danger");
        }, 1000);
    });
};

$("#inputTags").focus();