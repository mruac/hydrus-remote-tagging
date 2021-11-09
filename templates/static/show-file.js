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

function insertTag(tag) {
    //FIXME: convert to class & add gender namespace
    //TODO: add custom namespace coloring in settings
    var tagel = '<span class="modifiable ';
    if (tag.startsWith("creator:")) {
        tagel += 'creator">';
    } else if (tag.startsWith("meta:")) {
        tagel += 'meta">';
    } else if (tag.startsWith("gender:")) {
        tagel += 'gender">';
    } else if (tag.startsWith("series:")) {
        tagel += 'series">';
    } else if (tag.startsWith("person:")) {
        tagel += 'person">';
    } else if (tag.startsWith("studio:")) {
        tagel += 'studio">';
    } else if (tag.indexOf(":") == 0) {
        tagel += 'namespaced">'
    } else {
        tagel += 'unnamespaced">';
    }
    tagel += `${tag}</span>`;

    if (tag > $.trim($("#listOfTags span:last").text())) {
        $("#listOfTags").append(`${tagel}`);
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

function sendTags(tags) {
    //compare tags against current metadata & split into add & del tags
    //FIXME: currentTags / deletedTags can be undefined if not set
    var currentTags = metadata["service_names_to_statuses_to_tags"][currentRepo]["0"];
    var deletedTags = metadata["service_names_to_statuses_to_tags"][currentRepo]["2"];
    if (currentTags == undefined){currentTags = [];}
    if (deletedTags == undefined){deletedTags = [];}
    var data = {
        "add": [],
        "del": [],
        hash: metadata["hash"],
    }
    tags = tags.split(',');
    tags = tags.filter((v, i) => tags.indexOf(v) === i); //remove duplicates
    tags.forEach(function (tag) {
        tag = tag.trim();
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
        //"live" update to prevent re-fetching tags. May need to redo this if using Displayed tags
        //input testing results
        //tag,tag = client:keep, hydrus:delete
        //emptytag = client:adds "", hydrus:does nothing
        $("#inputTags").val("");
        console.log(response);
        var addTags = response["0"];
        var delTags = response["1"];
        addTags.forEach(tag => { insertTag(tag) });
        delTags.forEach(tag => { removeTag(tag) });
    });
};

