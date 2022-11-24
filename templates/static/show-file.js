var current = location.href.split('/')[4].replace(/\?.*$/, ''),
    next = parseInt(current) + 1,
    prev = parseInt(current) - 1,
    MAXhandyTags = 50,
    submitToggle = true,
    suggestTagMode = false,
    selectTagMode = false,
    isNotShortcut = true,
    frequentTagsMap = {},
    historyTags = [],
    offcanvas_metadata_el,
    offcanvas_metadata,
    offcanvas_handy_el,
    offcanvas_handy,
    tagsSelected = [],
    enteredTags = "",
    g_requests = {},
    g_timers = {},
    g_caretLocation = 0,
    g_currentInputTag = "";

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

    $("#handySidebar").height($(window).height() - $("#page-footer").outerHeight(true));
    $("#metadataSidebar").height($(window).height() - $("#page-footer").outerHeight(true));

    $(window).on("resize", function () {
        $("#handySidebar").height($(window).height() - $("#page-footer").outerHeight(true));
        $("#metadataSidebar").height($(window).height() - $("#page-footer").outerHeight(true));
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
        switch (e.which) {
            case 17 && (localStorage.getItem("sidebarToggleKey") == "ctrl"):
            case 16 && (localStorage.getItem("sidebarToggleKey") == "shift"):
            case 18 && (localStorage.getItem("sidebarToggleKey") == "alt"):
                if (isNotShortcut) { e.preventDefault(); }
                break;
            case 38: //up pressed from #inputTags is foccused (being typed in)
                // if ($("#inputTags").is(':focus') && suggestTagMode && $(e.target).is("#inputTags")) { e.preventDefault(); }
                e.preventDefault();
                break;
            case 40: //down
                // if(!suggestTagMode){e.preventDefault(); }
                e.preventDefault();
                break;
            case 37: //left
            case 39: //right
                if (suggestTagMode) {
                    e.preventDefault();
                }
                break;
            default:
            case (localStorage.getItem("sidebarToggleKey") == "ctrl" && e.which != 17 && e.ctrlKey):
            case (localStorage.getItem("sidebarToggleKey") == "shift" && e.which != 16 && e.shiftKey):
            case (localStorage.getItem("sidebarToggleKey") == "alt" && e.which != 18 && e.altKey):
                isNotShortcut = false;
        }
    });

    //toggle sidebars (localStorage.getItem("sidebarToggleKey"));
    //metadataSidebar
    $(document).keyup(function (e) {
        switch (e.which) {

            case 17 && (localStorage.getItem("sidebarToggleKey") == "ctrl"):
            case 16 && (localStorage.getItem("sidebarToggleKey") == "shift"):
            case 18 && (localStorage.getItem("sidebarToggleKey") == "alt"):
                if (isNotShortcut) {
                    offcanvas_metadata.toggle();
                    e.preventDefault();
                    return;
                } else { isNotShortcut = true; }
                break;

            case 13: //Submit #inputTags (Enter);
                if (submitToggle) { //check if submitToggle allows you to press enter. It is set to false when there is a pending AJAX request to prevent multiple unintended reuqests.
                    onSubmitTags();
                }
                break;


            case 38: //up
                e.preventDefault();
                //enter suggest tag mode
                if ($("#inputTags").is(':focus') && !suggestTagMode && $(e.target).is("#inputTags")) {
                    exitCopyMode();
                    suggestTagMode = true;
                    enableSuggestTags(true);
                    selectTag($("#tagSuggest").children()[0]);
                }
                break;
            case 40: //down
                e.preventDefault();
                //exit suggest tag mode
                if (suggestTagMode) {
                    suggestTagMode = false;
                    exitCopyMode();
                }
                break;
            case 37: //left
            case 39: //right
                if (suggestTagMode && selectTagMode) {
                    e.preventDefault();
                    //if only ONE tag selected && it is in suggestTags, nav left or right depending on the right/left key pressed.
                    //else don't do anything as user may be in copy + paste mode
                    let i = 0;
                    let els = $("#tagSuggest").children();
                    for (i; i < els.length; i++) {
                        if (els[i] === tagsSelected[0]) { break; }
                    }
                    deselectTag(els[i]);
                    if (e.which === 37) {
                        i -= 1;
                    } else if (e.which === 39) {
                        i += 1;
                    }
                    if (i < 0) { i = els.length + i; }
                    else if (i > els.length - 1) { i = i - els.length }
                    selectTag(els[i]);
                    ensureInView($("#tagSuggest")[0], els[i]);
                } else if ($("#tagSuggest").is(":visible")) {
                    if ($("#inputTags").get(0).selectionStart != g_caretLocation) {
                        let inputTags = $("#inputTags").val();
                        let nearestBeforeCommaLeft = findBeforeCommaIndex(inputTags, g_caretLocation, false);
                        let nearestBeforeCommaRight = findBeforeCommaIndex(inputTags, g_caretLocation, true);
                        let tag = inputTags.slice(nearestBeforeCommaLeft, nearestBeforeCommaRight).trim().toLowerCase();
                        if (tag != g_currentInputTag) {
                            g_currentInputTag = tag;
                            exitCopyMode();
                            suggestTagMode = false;
                            suggestAutocompleteTag();
                        }

                    }
                }
                g_caretLocation = $("#inputTags").get(0).selectionStart;
                break;
            default: //check if the inputTags has changed (to include foreign chars & alphanumeric chars)
                if ($("#inputTags").is(':focus')) {
                    if ($("#inputTags").val().length != enteredTags.length) {
                        while (Object.keys(g_timers).length > 0) { clearTimeout(g_timers[Object.keys(g_timers)[0]]); delete g_timers[Object.keys(g_timers)[0]]; }
                        while (Object.keys(g_requests).length > 0) { g_requests[Object.keys(g_requests)[0]].abort(); delete g_requests[Object.keys(g_requests)[0]]; } //abort previous ajax requests to prevent .done/fail functions from being executed late
                        exitCopyMode();
                        suggestTagMode = false;
                        suggestAutocompleteTag();
                        //update enteredTags for the next change.
                        enteredTags = $("#inputTags").val();
                    }
                }
                g_caretLocation = $("#inputTags").get(0).selectionStart;

                break;
        }
    });

    $("#inputTags").on("click", () => {
        g_caretLocation = $("#inputTags").get(0).selectionStart;
        //get current tag
        let inputTags = $("#inputTags").val();
        let nearestBeforeCommaLeft = findBeforeCommaIndex(inputTags, g_caretLocation, false);
        let nearestBeforeCommaRight = findBeforeCommaIndex(inputTags, g_caretLocation, true);
        let tag = inputTags.slice(nearestBeforeCommaLeft, nearestBeforeCommaRight).trim().toLowerCase();

        if (tag != g_currentInputTag) {
            g_currentInputTag = tag;
            exitCopyMode();
            suggestTagMode = false;
            suggestAutocompleteTag();
        }
    })

    $(".metadataSidebarToggle").on("click", function () {
        offcanvas_metadata.toggle();
    });

    //handySidebar
    $(".handySidebarToggle").on("click", function () {
        offcanvas_handy.toggle();
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

    const id = (Math.random() * 100000000 | 0).toString();
    g_requests[id] = $.ajax({
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
    }).then(() => { delete g_requests[id] });

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
        } else {
            deselectTag(e.currentTarget);
            if (tagsSelected.length == 0) { exitCopyMode(); }
        }
    });
}

function selectTag(tagEl) {
    if (tagEl === undefined) { return; }
    selectTagMode = true;
    tagsSelected.push(tagEl);
    let color = rgba2hex($(tagEl).css("color"));
    $(tagEl).css("color", pickTextColorBasedOnBgColorSimple(color));
    $(tagEl).css("background-color", color);
    switchToCopyTagMode();
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
    selectTagMode = false;
    deselectTags("#handylistOfTags");
    deselectTags("#listOfTags");
    deselectTags("#tagSuggest");
    // enableSuggestTags(false);
    tagsSelected = [];
    $("#submitTags").removeClass("btn-primary").addClass("btn-success").html(`→`);
}

function onSubmitTags() {
    let tags = $("#inputTags").val();
    if (tagsSelected.length === 1 && $(tagsSelected[0]).parent()[0] === $("#tagSuggest")[0]) {
        console.log("suggestTagMode: " + suggestTagMode);
        //Submit selected suggested tag
        let tag = $(tagsSelected[0]).text().replaceAll("\\", "\\\\").replaceAll(",", "\\,");

        let caretLocation = $("#inputTags").get(0).selectionStart;

        //"look" around the caretLocation to determine which tag is currently being typed
        //search for the nearest comma on the left/right side, excluding escaped commas
        let inputTags = $("#inputTags").val();
        let nearestBeforeCommaLeft = findBeforeCommaIndex(inputTags, caretLocation, false);
        let nearestBeforeCommaRight = findBeforeCommaIndex(inputTags, caretLocation, true);
        console.log({ "inputField": inputTags, "selectedTag": tag, "caretLocation": caretLocation, "left": nearestBeforeCommaLeft, "right": nearestBeforeCommaRight, "caret": inputTags.slice(0, caretLocation) + "^" + inputTags.slice(caretLocation, inputTags.length) });
        $("#inputTags").val(`${inputTags.slice(0, nearestBeforeCommaLeft)} ${tag}, ${inputTags.slice(nearestBeforeCommaRight, inputTags.length - 1)}`);
        $("#inputTags").get(0).selectionStart = nearestBeforeCommaLeft + tag.length + 2;
        $("#inputTags").get(0).selectionEnd = nearestBeforeCommaLeft + tag.length + 2;
        suggestTagMode = false;
        enableSuggestTags(false);
        exitCopyMode();
    } else if (tagsSelected.length > 0 && selectTagMode) {
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
        enableSuggestTags(false);
        exitCopyMode();
        sendTags(tags);
    }

}

function suggestAutocompleteTag() { //$("#inputTags").val() - called each time a new character is typed
    //list of Suggested tags is not selected by default, user has to press up/down to select a tag and press Enter, or mobile user can tap to select & enter.
    //list of Suggest tags is hidden when focus is lost from #inputTags. User has to start typing again (not delete/backspace) to initiate tagSuggestion again.

    // see fixme where it requests to change from using arrays to dictionary objects & implements a self-destroying / cancelling method using a unique id.
    //2000ms wait before sending ajax, cancel wait if user types again. prevents sending ajax on every keystroke while user is actively typing
    //cancel ajax Promise if user types again before it is resolved.
    const id = (Math.random() * 100000000 | 0).toString();

    g_timers[id] = setTimeout(() => {
        enableSuggestTags(false);
        exitCopyMode();

        //use caretLocation to determine which tag is being typed in the comma seperated list of tags
        let caretLocation = -1;
        if ($("#inputTags").get(0).selectionStart === $("#inputTags").get(0).selectionEnd) {
            caretLocation = $("#inputTags").get(0).selectionStart;
        }

        //"look" around the caretLocation to determine which tag is currently being typed
        //search for the nearest comma on the left/right side, excluding escaped commas
        let inputTags = $("#inputTags").val();
        let nearestBeforeCommaLeft = findBeforeCommaIndex(inputTags, caretLocation, false);
        let nearestBeforeCommaRight = findBeforeCommaIndex(inputTags, caretLocation, true);
        let tag = inputTags.slice(nearestBeforeCommaLeft, nearestBeforeCommaRight).trim().toLowerCase();
        console.log({ "tag": tag, "caretLocation": caretLocation, "commaLeft": nearestBeforeCommaLeft, "commaRight": nearestBeforeCommaRight });

        if (
            tag.length < 3 || //don't search for tags less than 4 chars
            tag.match(/.*?:(.*)/)?.[1].length < 3 //don't search for namespace tags with no value
        ) {
            return;
        }
        /*
        FIXME: Prevent user from doing these when there are pending requests:
            - Selecting tags in suggestedTags
            - Submitting tags to the selectedTagRepo

        Solution: use a dictionary object instead of an array to manage requests. eg:
        //Checks if there are any pending requests.
        if (Object.keys(requests).length > 0){console.log("there are pending requests!")}

        const id = (Math.random() * 100000000 | 0).toString();
        reqs[id] = new Promise((resolve, reject) => {
            setTimeout(() => {resolve("Success!"); }, 10000);
        }).then((response) => {
            console.log(`deleting ${id}`)
            delete reqs[id];
        })
        */

/*         requests.push(
            $.ajax({
                type: "GET",
                url: "/searchTags",
                data: { "tag": tag },
                dataType: "json",
                contentType: "application/json;charset=utf-8"
            }).done(function (response) {
                enableSuggestTags(true);
                updateSuggestTags(response);
            }).fail(function () {
                enableSuggestTags(false);
                exitCopyMode();
            })
        ); */

        //TODO: Make searchTags / suggestTags non blocking for those with shitty internet (eg. in tunnel)
        
        const id = (Math.random() * 100000000 | 0).toString();
        g_requests[id] = $.ajax({
                type: "GET",
                url: "/searchTags",
                data: { "tag": tag },
                dataType: "json",
                contentType: "application/json;charset=utf-8"
            }).done(function (response) {
                enableSuggestTags(true);
                updateSuggestTags(response);
            }).fail(function () {
                enableSuggestTags(false);
                exitCopyMode();
            }).then(() => {delete g_requests[id]});
        

    }, 500);

    return;



    function updateSuggestTags(tags) {
        let el = $("#tagSuggest");
        el.children().each(function (i, v) { v.remove(); });
        tags.forEach(function (tag) {
            let tagel = $(`<span class="${findnamespaceColor(tag.value)}">${tag.value}</span>`);
            addSelectListener(tagel);
            el.append($(tagel));
        });
    }

}

//caretLocation: 28, commaLeft: 29, commaRight: 27
//red line, medium:green, pink, series:pokémon red,, green, , blue & yellow 
function findBeforeCommaIndex(string, caret, goRight) {
    let i = caret;
    if (string.at(i) === ',' && string.at(i - 1) != '\\') { i--; }
    if (goRight) {
        if (string.at(i) === ',' && string.at(i - 1) != '\\') { return i + 1; }
        for (i; i < string.length; i++) {
            if (string.at(i) === ',') {
                if (string.at(i - 1) != '\\') { return i; } else { continue; }
            }
        }
        return string.length;
    } else { //go left
        if (string.at(i) === ',' && string.at(i - 1) != '\\') { return i + 1; }
        for (i; i > -1; i--) {
            //in the first iteration of this for loop, if i === ',', then continue
            if (string.at(i) === ',') {
                if (string.at(i - 1) != '\\') { return i + 1; } else { continue; }
            }
        }
        return 0;
    }
}

function enableSuggestTags(enable = $("#tagSuggest").is(":visible")) {
    if (enable) {
        $("#pageID").addClass("d-none");
        $("#tagSuggest").removeClass("d-none");
    } else {
        $("#tagSuggest").addClass("d-none");
        $("#pageID").removeClass("d-none");
        suggestTagMode = false;
    }
    return;
}

function ensureInView(container, element) {
    //Check if out of view
    let eRightOutsideView = element.getBoundingClientRect().right - container.offsetWidth;
    let eLeftOutsideView = element.getBoundingClientRect().left;

    if (eRightOutsideView > 0) {
        container.scrollLeft += eRightOutsideView + 10;
    }
    else if (eLeftOutsideView < 0) {
        container.scrollLeft += (eLeftOutsideView - 10);
    }
}

$(document).ready(function () {
    initialise();
});