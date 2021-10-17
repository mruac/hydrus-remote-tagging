var current = location.href.split('/')[4].replace(/\?.*$/, '');
var next = parseInt(current) + 1
var prev = parseInt(current) - 1
var thres = 150
$("#inputTags").focus();

//skip if file is not image or video
if ($('h1').hasClass('nm-text')) {
    window.location = next
};

//hook into Bootstrap 5's offCanvas sidebar #metadataSidebar
var offcanvas_el = document.getElementById("metadataSidebar")
var offcanvas = new bootstrap.Offcanvas(offcanvas_el, { backdrop: false })

//ovveride Bootstrap 5's focusin eventlistener to allow text input while #metadataSidebar is open
document.addEventListener('focusin', function (e) {
    e.stopImmediatePropagation();
});

//Moved from SHIFT to Alt. - Still yet to figure out how to stop TAB navigation if I want to use it.
//toggle list of tags sidebar
var toggleSidebarKey = true;
$(document).keyup(function (e) {
    if (e.which == 18) {
        offcanvas.toggle();
        e.preventDefault();
        return;
    }
});


$(document).keypress(function (e) {
    if (e.which == 13) {
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

function sendTags(tags) {
    $.ajax({
        type: "POST",
        url: "/updateTags",
        data: {
            tags: tags,
            hash: metadata["hash"]
        },
        dataType: "json"
    }).done(function (response) {
        $("#inputTags").val("");
        console.log(response);

        //NOTE: crude way? could be done with dynamic update on taglist - would need to re-sort or insert as needed alphabetically
        //update taglist with updated tags
        window.location.reload(false);
    });
};