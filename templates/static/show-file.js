var current = location.href.split('/')[4].replace(/\?.*$/, '');
var next = parseInt(current) + 1;
var prev = parseInt(current) - 1;
var thres = 150
var MAXhandyTags = 50;
var submitToggle = true;
var isNotShortcut = true;
var frequentTagsMap = {}, historyTags = [], offcanvas_metadata_el, offcanvas_metadata, offcanvas_handy_el, offcanvas_handy;
var tagsSelected = [];

function initialise() {
    //skip if file is not image or video
    if ($('h1').hasClass('nm-text')) {
        toNextFile();
    }

    if (metadata["service_names_to_statuses_to_tags"][currentRepo] == undefined) {
        metadata["service_names_to_statuses_to_tags"][currentRepo] = { "0": [], "2": [] }
    }
    if (metadata["service_names_to_statuses_to_tags"][currentRepo]["0"] == undefined) {
        metadata["service_names_to_statuses_to_tags"][currentRepo]["0"] = [];
    }
    if (metadata["service_names_to_statuses_to_tags"][currentRepo]["2"] == undefined) {
        metadata["service_names_to_statuses_to_tags"][currentRepo]["2"] = [];
    }

    $("#handySidebar").height($(window).height() - $(".page-footer").outerHeight(true));
    $("#metadataSidebar").height($(window).height() - $(".page-footer").outerHeight(true));

    $(window).on("resize", function () {
        $("#handySidebar").height($(window).height() - $(".page-footer").outerHeight(true));
        $("#metadataSidebar").height($(window).height() - $(".page-footer").outerHeight(true));
    });

    //dynamically loads the namespaceColors into CSS
    let css = ``;
    JSON.parse(localStorage.tagPresentation)["namespaceColors"].forEach(function (v, i) {
        css += `.${v[0]}{color:${v[2]}}\n`;
    });
    $(`<style>${css}</style>`).appendTo("head");

    if (sessionStorage.getItem("frequent-tags") != null) {
        frequentTagsMap = JSON.parse(sessionStorage.getItem("frequent-tags"));
    }
    if (sessionStorage.getItem("history-tags") != null) {
        historyTags = JSON.parse(sessionStorage.getItem("history-tags"))["0"];
    }

    if (sessionStorage.getItem("frequentORhistory") == null) {
        sessionStorage.setItem("frequentORhistory", "true");
    }

    //load handySidebar tags
    if (sessionStorage.getItem('frequentORhistory') == "true") {//frequent
        loadFrequentTags();
    } else {//history
        loadRecentTags();
    }

    //hook into Bootstrap 5's offCanvas sidebars
    offcanvas_metadata_el = document.getElementById("metadataSidebar");
    offcanvas_metadata = new bootstrap.Offcanvas(offcanvas_metadata_el, {
        backdrop: false
    });
    offcanvas_handy_el = document.getElementById("handySidebar");
    offcanvas_handy = new bootstrap.Offcanvas(offcanvas_handy_el, {
        backdrop: false
    });

    //Keep sidebar(s) open/closed across pages
    if (sessionStorage.getItem('metadatasidebar') == "true") {
        offcanvas_metadata_el.classList.add('show');
    } else {
        offcanvas_metadata_el.classList.remove('show');
    }
    if (sessionStorage.getItem('handysidebar') == "true") {
        offcanvas_handy_el.classList.add('show');
    } else {
        offcanvas_handy_el.classList.remove('show');
    }

    offcanvas_metadata_el.addEventListener('hidden.bs.offcanvas', function () {
        sessionStorage.setItem('metadatasidebar', "false");
    });
    offcanvas_metadata_el.addEventListener('shown.bs.offcanvas', function () {
        sessionStorage.setItem('metadatasidebar', "true");
    });
    offcanvas_handy_el.addEventListener('hidden.bs.offcanvas', function () {
        sessionStorage.setItem('handysidebar', "false");
    });
    offcanvas_handy_el.addEventListener('shown.bs.offcanvas', function () {
        sessionStorage.setItem('handysidebar', "true");
    });

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

    //toggle sidebars (localStorage.getItem("sidebarToggleKey"));
    //metadataSidebar
    $(document).keyup(function (e) {
        switch (true) {
            case (localStorage.getItem("sidebarToggleKey") == "ctrl" && e.which == 17):
            case (localStorage.getItem("sidebarToggleKey") == "shift" && e.which == 16):
            case (localStorage.getItem("sidebarToggleKey") == "alt" && e.which == 18):
                if (isNotShortcut) {
                    offcanvas_metadata.toggle();
                    e.preventDefault();
                    return;
                } else { isNotShortcut = true; }
        }
    });
    $(".metadataSidebarToggle").on("click", function () {
        offcanvas_metadata.toggle();
    });

    //handySidebar
    $(".handySidebarToggle").on("click", function () {
        offcanvas_handy.toggle();
    });

    //Submit #inputTags (Enter);
    $(document).keyup(function (e) {
        if (e.which == 13 && submitToggle) {
            onSubmitTags();
        }
    });

    $("#submitTags").click(function () {
        if (submitToggle) {
            onSubmitTags();
        }
    });

    //#handyToggle button - switch between Recent and Most Used tags
    $("#handyToggle").on("click", function () {
        if (sessionStorage.getItem("frequentORhistory") == "false") { //frequent
            let starSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-star-fill" viewBox="0 0 16 16">
        <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
        </svg>`
            $("#handyToggle svg").remove();
            $("#handySidebarButton svg").remove();
            $("#handyToggle").append(starSVG);
            $("#handySidebarButton").append(starSVG);
            deselectTags("#handylistOfTags");
            loadFrequentTags();
            sessionStorage.setItem("frequentORhistory", "true");

        } else {//history
            let clockSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clock-fill" viewBox="0 0 16 16">
        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
      </svg>`
            $("#handyToggle svg").remove();
            $("#handySidebarButton svg").remove();
            $("#handyToggle").append(clockSVG);
            $("#handySidebarButton").append(clockSVG);
            deselectTags("#handylistOfTags");
            loadRecentTags();
            sessionStorage.setItem("frequentORhistory", "false");
        }
    });

    $("#fileViewer").on("click", function () {
        if (tagsSelected.length > 0) {
            deselectTags("#handylistOfTags");
            deselectTags("#listOfTags");
            exitCopyMode();
        }
    });

    if (metadata['service_names_to_statuses_to_tags']['all known tags']['0'] != undefined) {
        loadTags("#listOfTags", metadata['service_names_to_statuses_to_tags']["all known tags"]['0']);
    }
    if (sessionStorage.getItem("frequentORhistory") == "true") {
        loadFrequentTags();
    } else { loadRecentTags(); }
    loadResizable_MetadataSidebar();
    loadResizable_HandySidebar();
    $("#inputTags").focus();

}
function loadFrequentTags() {
    $("#handySidebarTitle").text("Frequent Tags");
    updatefrequentTags();
}

function loadRecentTags() {
    $("#handySidebarTitle").text("Recent Tags");
    loadTags("#handylistOfTags", historyTags)
}

function toNextFile() {
    window.location = next;
};

function insertTag(tag) {
    //finds existing tag and modifies it if it's in currentRepo, else adds the tag and inserts it
    let foundTagEl = findTagEl("#listOfTags", tag);
    if (foundTagEl != undefined && checkModifiable(tag) == "modifiable") {
        $(foundTagEl).addClass("modifiable");
        return;
    }

    let tagel = $(`<span class="modifiable ${findnamespaceColor(tag)}">${tag}</br></span>`);
    addSelectListener(tagel);
    if (tag > $.trim($("#listOfTags span:last").text())) {
        $("#listOfTags").append(tagel);
    } else {
        $("#listOfTags span").each(function (i, v) {
            if (!($.trim($(v).text()) < tag)) {
                $(v).before(tagel);
                return false;
            };
        });
    }
};

function removeTag(tag) {
    //finds existing and removes it if it's not in currentRepo, else it removes it
    let foundTagEl = findTagEl("#listOfTags", tag);
    if (foundTagEl != undefined) {
        $(foundTagEl).removeClass("modifiable");
        if (metadata['service_names_to_statuses_to_tags']["all known tags"]['0'].indexOf(tag) == -1) {
            $(foundTagEl).remove();
        }
    }
}

function findTagEl(tagListSelector, tag) {
    let tags = $(`${tagListSelector}`).children();
    for (let i = 0; i < tags.length; i++) {
        if ($(tags[i]).text() == tag) { return tags[i] }
    }
}

function loadResizable_MetadataSidebar() {
    var metadataWidthMin = $(window).width() * .20;
    var metadataWidthMax = $(window).width() * .80;
    $(window).on("resize", function () {
        metadataWidthMin = $(window).width() * .20;
        metadataWidthMax = $(window).width() * .80;
        var metadatasidebarWidth = parseInt($('#metadataSidebar').css("width"));
        if (metadatasidebarWidth < metadataWidthMin) {
            $('#metadataSidebar').css("width", metadataWidthMin + 'px');
        } else if (metadatasidebarWidth > metadataWidthMax) {
            $('#metadataSidebar').css("width", metadataWidthMax + 'px');
        }
    });
    if (localStorage.getItem("metadatasidebarWidth") != null &&
        parseInt(localStorage.getItem("metadatasidebarWidth")) > metadataWidthMin &&
        parseInt(localStorage.getItem("metadatasidebarWidth")) < metadataWidthMax) {
        $('#metadataSidebar').width(parseInt(localStorage.getItem("metadatasidebarWidth")));
    }

    var isResizingmetadataSidebar = false;
    //resizing with cursor
    $("#metadataSidebarDraggable").on("mousedown touchstart", function () {
        isResizingmetadataSidebar = true;
        $("body").addClass("no-select");
    });
    $(document).on("mousemove touchmove", function (e) {
        if (!isResizingmetadataSidebar) { return; }
        var currentXpos = e.clientX == undefined ? e.changedTouches[0]["clientX"] : e.clientX;
        if (currentXpos < metadataWidthMax && currentXpos > metadataWidthMin) {
            $('#metadataSidebar').css("width", `${$(window).width() - currentXpos}px`);
        }
    });
    $(document).on("mouseup touchend", function () {
        isResizingmetadataSidebar = false;
        $("body").removeClass("no-select");
        var metadatasidebarWidth = parseInt($('#metadataSidebar').css("width"));

        if (metadatasidebarWidth < metadataWidthMin) {
            $('#metadataSidebar').css("width", `${metadataWidthMin}px`);
        } else if (metadatasidebarWidth > metadataWidthMax) {
            $('#metadataSidebar').css("width", `${metadataWidthMax}px`);
        }
        localStorage.setItem("metadatasidebarWidth", $('#metadataSidebar').width());
    });
}

function loadResizable_HandySidebar() {
    var handyWidthMin = $(window).width() * .20;
    var handyWidthMax = $(window).width() * .70;
    $(window).on("resize", function () {
        handyWidthMin = $(window).width() * .20;
        handyWidthMax = $(window).width() * .70;
        var handysidebarWidth = parseInt($('#handySidebar').css("width"));
        if (handysidebarWidth < handyWidthMin) {
            $('#handySidebar').css("width", handyWidthMin + 'px');
        } else if (handysidebarWidth > handyWidthMax) {
            $('#handySidebar').css("width", handyWidthMax + 'px');
        }
    });
    if (localStorage.getItem("handysidebarWidth") != null &&
        parseInt(localStorage.getItem("handysidebarWidth")) > handyWidthMin &&
        parseInt(localStorage.getItem("handysidebarWidth")) < handyWidthMax) {
        $('#handySidebar').width(parseInt(localStorage.getItem("handysidebarWidth")));
    }

    var isResizinghandySidebar = false;
    //resizing with cursor
    $("#handySidebarDraggable").on("mousedown touchstart", function () {
        isResizinghandySidebar = true;
        $("body").addClass("no-select");
    });
    $(document).on("mousemove touchmove", function (e) {
        if (!isResizinghandySidebar) { return; }
        var currentXpos = e.clientX == undefined ? e.changedTouches[0]["clientX"] : e.clientX;
        if (currentXpos < handyWidthMax && currentXpos > handyWidthMin) {
            $('#handySidebar').css("width", `${currentXpos}px`);
        }
    });
    $(document).on("mouseup touchend", function () {
        isResizinghandySidebar = false;
        $("body").removeClass("no-select");
        var handysidebarWidth = parseInt($('#handySidebar').css("width"));

        if (handysidebarWidth < handyWidthMin) {
            $('#handySidebar').css("width", `${handyWidthMin}px`);
        } else if (handysidebarWidth > handyWidthMax) {
            $('#handySidebar').css("width", `${handyWidthMax}px`);
        }
        localStorage.setItem("handysidebarWidth", $('#handySidebar').width());
    });
}

function sendTags(tags) {
    $("#inputTags").prop('disabled', true);
    $("#submitTags").prop('disabled', true);
    submitToggle = false;

    let CRcurrentTags = metadata["service_names_to_statuses_to_tags"][currentRepo]["0"];
    let CRdeletedTags = metadata["service_names_to_statuses_to_tags"][currentRepo]["2"];
    if (metadata['service_names_to_statuses_to_tags']["all known tags"]['0'] == undefined) {
        metadata['service_names_to_statuses_to_tags']["all known tags"]['0'] = [];
    }
    if (metadata['service_names_to_statuses_to_tags']["all known tags"]['2'] == undefined) {
        metadata['service_names_to_statuses_to_tags']["all known tags"]['2'] = [];
    }
    let AKcurrentTags = metadata['service_names_to_statuses_to_tags']["all known tags"]['0'];
    let AKdeletedTags = metadata["service_names_to_statuses_to_tags"]["all known tags"]["2"];

    let data = {
        "add": [],
        "del": [],
        hash: metadata["hash"],
    }
    tags = tags.match(/(\\.|[^,])+/g);
    for (let i = 0; i < tags.length; i++) { //clean each tag
        tags[i] = tags[i].replaceAll("\\,", ",").replaceAll("\\\\", "\\"); //convert escaped chars to original chars
        tags[i] = tags[i].trim(); //trim whitespace around tag
        tags[i] = tags[i].toLowerCase();
    }
    tags = tags.filter((v, i) => tags.indexOf(v) === i); //remove duplicates
    tags.forEach(function (tag) { //sort tags into add & del
        if (tag == "") { return; }
        if (CRcurrentTags.indexOf(tag) > -1) {
            //check if tags exists in other repos before removing from All Known tags
            let res = repos['local_tags'].some(function (v) {
                if (metadata["service_names_to_statuses_to_tags"][v.name] != undefined) {
                    if (metadata["service_names_to_statuses_to_tags"][v.name]["0"] != undefined) {
                        if (metadata["service_names_to_statuses_to_tags"][v.name]["0"].indexOf(tag) > -1) {
                            return true;
                        }
                    }
                }
            });
            if (res) {
                AKdeletedTags.push(tag);
                AKcurrentTags.splice(AKcurrentTags.indexOf(tag), 1);
            }
            CRcurrentTags.splice(CRcurrentTags.indexOf(tag), 1);
            CRdeletedTags.push(tag);
            data["del"].push(tag);
        }
        else if (CRdeletedTags.indexOf(tag) > -1) {
            CRdeletedTags.splice(CRdeletedTags.indexOf(tag), 1);
            AKdeletedTags.splice(AKdeletedTags.indexOf(tag), 1);
            CRcurrentTags.push(tag);
            AKcurrentTags.push(tag);
            data["add"].push(tag);
        } else {
            CRcurrentTags.push(tag);
            AKcurrentTags.push(tag);
            data["add"].push(tag);
        }
    });

    console.log(data);
    recordTags(data["add"]);

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
        let addTags = response[currentRepo]["0"];
        let delTags = response[currentRepo]["1"];
        addTags.forEach(tag => { insertTag(tag) });
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

function updatefrequentTags() {
    //update frequentTags
    let sortedfrequentTags = Object.entries(frequentTagsMap).sort((a, b) => { //flatten and sort array by the [1] element
        if (a[1] > b[1]) {
            return 1;
        } else if (a[1] < b[1]) {
            return -1;
        } else {
            return 0;
        }
    });
    sortedfrequentTags = sortedfrequentTags.map((arr) => {
        return arr[0];
    });
    let frequentTags = sortedfrequentTags.reverse().slice(0, MAXhandyTags);
    loadTags("#handylistOfTags", frequentTags);
}

function findnamespaceColor(tag) { //matches namespaceColors to a tag
    let arr = JSON.parse(localStorage.tagPresentation)["namespaceColors"];
    for (let i = 0; i < arr.length; i++) {
        let re = new RegExp(`${arr[i][1]}`, 'gm');
        if (re.test(tag)) { return arr[i][0] }
    }
    return "";
}

function checkModifiable(tag) {
    if (metadata['service_names_to_statuses_to_tags'][currentRepo]['0'].indexOf(tag) > -1) { return "modifiable" }
    return ""
}

function loadTags(element, tags) {
    $(`${element} span`).remove(); //remove all existing tags
    tags.forEach(tag => {
        let tagel = $(`<span class="${findnamespaceColor(tag)} ${checkModifiable(tag)}">${tag}<br/></span>`);
        addSelectListener(tagel);
        $(element).append(tagel);
    });
}

function recordTags(tags) { //each time tags are added, process them here
    //check and add each tag to historyTags and frequentTags
    tags.forEach(function (tag) {
        historyTags.unshift(tag);

        //add to frequentTagsMap and increment counter if already exists
        if (frequentTagsMap[tag]) {
            frequentTagsMap[tag]++;
        } else {
            frequentTagsMap[tag] = 1;
        }
    });

    if (historyTags.length > MAXhandyTags) { historyTags.splice(MAXhandyTags, historyTags.length - MAXhandyTags); }
    sessionStorage.setItem("history-tags", JSON.stringify({ "0": historyTags }));

    sessionStorage.setItem("frequent-tags", JSON.stringify(frequentTagsMap));

    if (sessionStorage.getItem("frequentORhistory") == "true") {
        loadFrequentTags();
    } else { loadRecentTags(); }
}

function addSelectListener(el) {
    $(el).on("click", function (e) {
        if ($(e.target).css("background-color") == 'rgba(0, 0, 0, 0)') {
            selectTag(e.currentTarget);
            switchToCopyTagMode();
        } else {
            deselectTag(e.currentTarget);
            if (tagsSelected.length == 0) { exitCopyMode(); }
        }
    });
}

function selectTag(tagEl) {
    tagsSelected.push(tagEl);
    let color = rgba2hex($(tagEl).css("color"));
    $(tagEl).css("color", pickTextColorBasedOnBgColorSimple(color));
    $(tagEl).css("background-color", color);
}

function deselectTag(tagEl) {
    let foundIndex = tagsSelected.indexOf(tagEl);
    if (foundIndex > -1) {
        tagsSelected.splice(foundIndex, 1);
        $(tagEl).css("background-color", "");
        $(tagEl).css("color", "");
        switchToCopyTagMode()
    }
}

function deselectTags(element) {
    //if switching between handy and frequent tags, or clicking in image viwer clears all selected tags
    $(`${element} span`).each(function (i, v) {
        deselectTag(v);
    });
}

function pickTextColorBasedOnBgColorSimple(bgColor) { //https://stackoverflow.com/a/41491220/5791312
    let color = (bgColor.charAt(0) === '#') ? bgColor.substring(1, 7) : bgColor;
    let r = parseInt(color.substring(0, 2), 16); // hexToR
    let g = parseInt(color.substring(2, 4), 16); // hexToG
    let b = parseInt(color.substring(4, 6), 16); // hexToB
    return (((r * 0.299) + (g * 0.587) + (b * 0.114)) > 186) ?
        '#FFFFFF' : '#000000';
}

//https://stackoverflow.com/a/3627747/5791312
function rgba2hex(rgba) { return `#${rgba.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+\.{0,1}\d*))?\)$/).slice(1).map((n, i) => (i === 3 ? Math.round(parseFloat(n) * 255) : parseFloat(n)).toString(16).padStart(2, '0').replace('NaN', '')).join('')}` }

function switchToCopyTagMode() {
    if (tagsSelected.length > 0) {
        $("#submitTags").addClass("btn-primary").removeClass("btn-success");
        $("#submitTags").html(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard" viewBox="0 0 16 16">
        <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
        <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
      </svg>`);
    }
}

function exitCopyMode() {
    deselectTags("#handylistOfTags");
    deselectTags("#listOfTags");
    $("#submitTags").removeClass("btn-primary").addClass("btn-success").html(`→`);
}

function onSubmitTags() {
    let tags = $("#inputTags").val();
    if (tagsSelected.length > 0) {
        let res = ", ";
        tagsSelected.forEach(function (v) {
            res += v.textContent.replaceAll("\\", "\\\\").replaceAll(",", "\\,"); //escape escape char and delimiter
            res += ", ";
        });
        $("#inputTags").val(tags + res);
        exitCopyMode();
    } else if (tags == "") {
        toNextFile();
    } else {
        sendTags(tags);
    }

}

$(document).ready(function () {
    initialise();
});