var apiUrl = document.getElementById('settings-api-url-input');
var apiKey = document.getElementById('settings-api-key-input');
if ((localStorage.getItem('api-url') != null) && (localStorage.getItem('api-url') != "")) {
    document.getElementById('api-url-input').value = localStorage.getItem('api-url')
}
if ((localStorage.getItem('api-key') != null) && (localStorage.getItem('api-key') != "")) {
    document.getElementById('api-key-input').value = localStorage.getItem('api-key')
}

if ((localStorage.getItem('tagPresentation') != null)) {
    //if settings exist, send to flask session to store.
    $.ajax({
        type: "POST",
        url: "/updatePrefs",
        data: localStorage.getItem('tagPresentation'),
        dataType: "json",
        contentType: "application/json; charset=utf-8"
    });

    $("#inputGUI tbody tr").each(function (i, v) {
        $(v).remove();
    });

    JSON.parse(localStorage.getItem('tagPresentation'))["namespaceColors"].forEach(function (v, i) {
        $(`<tr><td><input class="form-check-input select-entry" type="checkbox" value="" disabled></td><td>${v[0]}</td><td>${v[1]}</td><td><input type="color" class="form-control form-control-color" value="${v[2]}" title="Choose your color" disabled></td></tr>`).appendTo("#inputGUI tbody")
    });
    $("#inputGUI").tableDnDUpdate();

}

document.getElementById('settings-api-url-input').value = localStorage.getItem('api-url')
document.getElementById('settings-api-key-input').value = localStorage.getItem('api-key')
if ((localStorage.getItem('keybinds') == "true") || (localStorage.getItem('keybinds') == null)) {
    $("#settings-keybind-checkbox").prop('checked', true)
} else {
    $("#settings-keybind-checkbox").prop('checked', false)
}
if ((localStorage.getItem('swiping') == "true") || (localStorage.getItem('swiping') == null)) {
    $("#settings-swiping-checkbox").prop('checked', true)
} else {
    $("#settings-swiping-checkbox").prop('checked', false)
}
$('#settings-save-btn').on('click', function () {
    localStorage.setItem("api-url", apiUrl.value);
    localStorage.setItem("api-key", apiKey.value);
    localStorage.setItem("keybinds", $("#settings-keybind-checkbox").prop('checked'));
    localStorage.setItem("swiping", $("#settings-swiping-checkbox").prop('checked'));
    $('#settings-save-btn').text('Saved');
    $('#settings-save-btn').addClass('btn-success');
    setTimeout(function () {
        $('#settings-save-btn').text('Save');
        $('#settings-save-btn').removeClass('btn-success');
    }, 2000);
});

$(document).ready(function () {
    $("#inputGUI").tableDnD();
});

/*
NOTE:
In view mode: You can re-arrange entries so that colors are applied top to bottom. Checkboxes are hidden / disabled.
In edit mode: re-arrange is disabled, input is enabled, checkboxes are visible / enbaled. Checkboxes can be used to select multiple entries for deletion.
*/

//view: convert value to text to allow DnD
//modify: convert placeholder to value
//default placeholders: ["Name","Regex"]
// allCheck - checkbox to toggle all checkboxes
// $(#selectCheck).prop('checked') - selected entries, returns bool
// deleteEntry - button
// addEntry - button
// modifyMode - $("#modifyMode").prop('checked') - true for settings mode

$('#allCheck').change(
    function () {
        if ($("#modifyMode").prop('checked')) {
            if ($("#allCheck").prop('checked')) {
                $(".select-entry").each(function (i, v) { $(v).prop('checked', true) })
            } else {
                $(".select-entry").each(function (i, v) { $(v).prop('checked', false) })
            }
        }
    });

$('#modifyMode').change(function () {
    if ($('#modifyMode').is(':checked')) {
        //edit mode
        $('#submitEntry').prop('disabled', true);
        $("#entryAlert").addClass("d-none");
        $("#textformatAlert").addClass("d-none");
        $("#switchEntryMode").removeClass("d-none");
        $("#resetEntry").removeClass("d-none");

        if ($('#inputGUI').hasClass("d-none")) {
            $("#inputTextarea").prop("disabled", false);
        }

        if ($('#inputText').hasClass("d-none")) {
            //if table visible
            $("#editEntry").removeClass("d-none");
            $("#allCheck").prop('disabled', false);
            $('#submitEntry').prop('disabled', true);
            $("#inputGUI tbody tr").each(function (i, v) {
                //show add/delete
                //enable checkboxes
                $($(v).find('[type=checkbox]')).prop('disabled', false);
                //convert text to input
                var name = $($(v).children()[1]).text();
                $($(v).children()[1]).removeClass('text-danger');
                var regex = $($(v).children()[2]).text();
                $($(v).children()[1]).html(`<input type="text" class="form-control w-100 mx-auto" placeholder="Tag / namespace" value="${name}">`);
                $($(v).children()[2]).html(`<input type="text" class="form-control w-100 mx-auto" placeholder="Python Regex" value="${regex}">`);
                //enable color selection
                $($(v).find('[type=color]')).prop('disabled', false);
            });
        }
    } else {
        //view mode
        $("#resetEntry").addClass("d-none");
        $("#switchEntryMode").addClass("d-none");

        if ($('#inputGUI').hasClass("d-none")) {
            //if textarea visible
            $("#inputTextarea").prop("disabled", true);
            var val = $("#inputTextarea").val().replace(/\n/g, ',').replace(/\\/g, '\\\\');
            val = val.replace(/,+$/m, "") //remove comma(s) at end of string in case last char is newline
            try {
                val = JSON.parse(`{"0":[${val}]}`)["0"]; //lazy way to parse string to array, lol
            } catch {
                $("#textformatAlert").removeClass("d-none");
                $('#submitEntry').prop('disabled', true);
                return;
            }
            if (!(val.every(function (v) { return validateName(v[0]) }))) {
                $("#entryAlert").removeClass("d-none");
                $('#submitEntry').prop('disabled', true);
                return;
            }
            $('#submitEntry').prop('disabled', false);
        }

        if ($("#inputText").hasClass("d-none")) {
            // if table visible
            $("#editEntry").addClass("d-none");
            $("#allCheck").prop('disabled', true).prop("checked", false);
            $("#inputGUI tbody tr").each(function (i, v) {
                //hide add/delete
                //disable checkboxes
                $($(v).find('[type=checkbox]')).prop('disabled', true).prop("checked", false);
                //convert text values to text
                var name = $($(v).find('[type=text]')[0]).val();
                var regex = $($(v).find('[type=text]')[1]).val();
                if (!validateName(name)) {
                    $($(v).children()[1]).addClass('text-danger');
                }
                $($(v).children()[1]).text(name);
                $($(v).children()[2]).text(regex);
                //disable color selection
                $($(v).find('[type=color]')).prop('disabled', true);
                //remove empty rows
                if (name == "" || regex == "") {
                    $(v).remove();
                }
            });

            if ($(".text-danger").length > 0) {
                $("#entryAlert").removeClass("d-none");
                $('#submitEntry').prop('disabled', true);
                return;
            }
            $('#submitEntry').prop('disabled', false);
        }
    }
});

//switch between textarea and table input
$("#switchEntryMode").click(function () {
    if ($('#inputGUI').hasClass("d-none")) {
        //if textarea mode, switch to table mode
        val = $("#inputTextarea").val().replace(/\n/g, ',').replace(/\\/g, '\\\\');
        if (val.endsWith(",")) { val = val.slice(0, -1); } //remove comma at end of string in case last char is newline
        try {
            val = JSON.parse(`{"0":[${val}]}`)["0"]; //lazy way to parse string to array, lol
        } catch {
            $("#textformatAlert").removeClass("d-none");
            return;
        }
        val.forEach(function (v, i) {
            $(`<tr><td class="entry-name"><input class="form-check-input select-entry" type="checkbox" value=""></td><td><input type="text" class="form-control w-100 mx-auto " placeholder="Tag / namespace" value="${v[0]}"></td><td class="entry-regex"><input type="text" class="form-control w-100 mx-auto " placeholder="Python Regex" value="${v[1]}"></td><td><input type="color" class="form-control form-control-color" value="${v[2]}" title="Choose your color"></td></tr>`).appendTo("#inputGUI tbody");
            $("#inputGUI").tableDnDUpdate();
        });
        $("#switchEntryMode").html(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-table" viewBox="0 0 16 16">
        <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm15 2h-4v3h4V4zm0 4h-4v3h4V8zm0 4h-4v3h3a1 1 0 0 0 1-1v-2zm-5 3v-3H6v3h4zm-5 0v-3H1v2a1 1 0 0 0 1 1h3zm-4-4h4V8H1v3zm0-4h4V4H1v3zm5-3v3h4V4H6zm4 4H6v3h4V8z"/></svg>`);
        $("#switchEntryMode").removeClass("btn-outline-info").addClass("btn-info");
        $("#inputGUI").removeClass("d-none");
        $("#inputText").addClass("d-none");
        $("#textformatAlert").addClass("d-none");
        $("#editEntry").removeClass("d-none");
    }else{
        //if table mode, switch to textarea mode
        $("#editEntry").addClass("d-none");
        //read from table rows and fill in textarea value
        var val = ``;
        $("#inputGUI tbody tr").each(function (i, v) {
            var name = $($(v).find('[type=text]')[0]).val();
            var regex = $($(v).find('[type=text]')[1]).val();
            var color = $(v).find('[type=color]').val();
            val += `["${name}", "${regex}", "${color}"]\n`
            $(v).remove();
        });
        $("#switchEntryMode").html(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-code" viewBox="0 0 16 16">
        <path d="M5.854 4.854a.5.5 0 1 0-.708-.708l-3.5 3.5a.5.5 0 0 0 0 .708l3.5 3.5a.5.5 0 0 0 .708-.708L2.707 8l3.147-3.146zm4.292 0a.5.5 0 0 1 .708-.708l3.5 3.5a.5.5 0 0 1 0 .708l-3.5 3.5a.5.5 0 0 1-.708-.708L13.293 8l-3.147-3.146z"/></svg>`);
        $("#switchEntryMode").removeClass("btn-info").addClass("btn-outline-info")
        $("#inputTextarea").val(val);
        $("#inputGUI").addClass("d-none");
        $("#inputText").removeClass("d-none");
    }
})

$('#deleteEntry').click(function () {
    if ($("#modifyMode").prop('checked')) {
        $(".select-entry:checked").each(function (i, v) {
            $(v).closest('tr').remove()
        });
    }
});

function validateName(name) {
    if (name.match(/^[a-zA-Z]([a-zA-Z0-9]|-|_)*$/m) != null) {
        //Allowed characters in Name: a-z, A-Z, 0-9, dash, underscore. Names cannot begin with a number.
        return true;
    } else { return false; }
}



$('#addEntry').click(function () {
    if ($("#modifyMode").prop('checked')) {
        $(`<tr><td class="entry-name"><input class="form-check-input select-entry" type="checkbox" value=""></td><td><input type="text" class="form-control w-100 mx-auto" placeholder="Tag / namespace" value=""></td><td class="entry-regex"><input type="text" class="form-control w-100 mx-auto" placeholder="Python Regex" value=""></td><td><input type="color" class="form-control form-control-color" value="" title="Choose your color"></td></tr>`).appendTo("#inputGUI tbody");
        $("#inputGUI").tableDnDUpdate();
    }
});

/*
<tr>
<td><input class="form-check-input selectCheck" type="checkbox" value=""></td>
<td><input type="text" class="form-control w-100 mx-auto" placeholder="Tag / namespace" value=""></td>
<td><input type="text" class="form-control w-100 mx-auto" placeholder="Python Regex" value=""></td>
<td><input type="color" class="form-control form-control-color" value="" title="Choose your color"></td>
</tr>
        */
//if (!validateName(v[0])){$("#resetEntry").addClass("d-none"); return;}
$('#submitEntry').on('click', function () {
    if (!$('#modifyMode').is(':checked')) {
        var tagPresentationDict = { "namespaceColors": [] } //{"studio":[regex,"hex color"]}

        $("#inputGUI tbody tr").each(function (i, v) {
            var name = $($(v).children()[1]).text();
            var regex = $($(v).children()[2]).text();
            var color = $(v).find('[type=color]').val();
            tagPresentationDict["namespaceColors"].push([name, regex, color]);
        })
        localStorage.setItem("tagPresentation", JSON.stringify(tagPresentationDict))
        //send to /updatePrefs
        $.ajax({
            type: "POST",
            url: "/updatePrefs",
            data: JSON.stringify(tagPresentationDict),
            dataType: "json",
            contentType: "application/json; charset=utf-8"
        });
    }
})

$('#resetEntry').click(function () {
    if ($('#inputGUI').hasClass("d-none")) {
        //textarea visible
        $("#inputTextarea").val(
`["character", "^character:.*$", "#00aa00"]
["creator", "^creator:.*$", "#ff0000"]
["meta", "^meta:.*$", "#6f6f6f"]
["person", "^person:.*$", "#008000"]
["series", "^series:.*$", "#d200d2"]
["studio", "^studio:.*$", "#ff0000"]
["namespaced", "^.*:.*$", "#72a0c1"]
["unnamespaced", "^(?!.*:).*$", "#00aaff"]`);
    }
    else {
        //table visible
        var defaults = [
            // ["className","regex","hexColor"], apply top to bottom
            ["character", "^character:.*$", "#00aa00"],
            ["creator", "^creator:.*$", "#ff0000"],
            ["meta", "^meta:.*$", "#6f6f6f"],  // default #111111
            ["person", "^person:.*$", "#008000"],
            ["series", "^series:.*$", "#d200d2"],
            ["studio", "^studio:.*$", "#ff0000"],
            ["namespaced", "^.*:.*$", "#72a0c1"],
            ["unnamespaced", "^(?!.*:).*$", "#00aaff"]
        ];
        $("#inputGUI tbody tr").each(function (i, v) {
            $(v).remove();
        });

        defaults.forEach(function (v, i) {
            $(`<tr>< class="entry-name"><input class="form-check-input select-entry" type="checkbox" value=""></td><td><input type="text" class="form-control w-100 mx-auto " placeholder="Tag / namespace" value="${v[0]}"></td><td class="entry-regex"><input type="text" class="form-control w-100 mx-auto " placeholder="Python Regex" value="${v[1]}"></td><td><input type="color" class="form-control form-control-color" value="${v[2]}" title="Choose your color"></td></tr>`).appendTo("#inputGUI tbody")
        });
        $("#inputGUI").tableDnDUpdate();

    }
});

