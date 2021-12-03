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

    var res = ``;
    JSON.parse(localStorage.tagPresentation)['namespaceColors'].forEach(function(v,i){
        res += String.raw`${JSON.stringify(v).replace(/\\\\/g, '\\')}` + `\n`;
    });
    $("#inputTextarea").val(res);
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

$('#inputGUI').tableDnD();

var passthru = false;
$("#inputGUI").on("touchstart", function(e){
    if (passthru){e.stopPropagation();}})

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
            //show textarea
            $("#inputTextarea").prop("disabled", false);
        }

    } else {
        //view mode
        $("#resetEntry").addClass("d-none");
        $("#switchEntryMode").addClass("d-none");

        if ($('#inputGUI').hasClass("d-none")) {
            //validate & disable textarea edit mode
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
    }
});

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

$('#submitEntry').on('click', function () {
    if (!$('#modifyMode').is(':checked')) {
        if ($('#inputGUI').hasClass("d-none")) {
            //if textarea is visible
            var val = $("#inputTextarea").val().replace(/\n/g, ',').replace(/\\/g, '\\\\');
            val = val.replace(/,+$/m, "") //remove comma(s) at end of string in case last char is newline    
            var tagPresentationDict = `{ "namespaceColors": [${val}] }`; //{"studio":[regex,"hex color"]}
        } else {
            //if table is visible
            var arr = []
            $("#inputGUI tbody tr").each(function (i, v) {
                var name = $($(v).children()[1]).text();
                var regex = $($(v).children()[2]).text();
                var color = $(v).find('[type=color]').val();
                arr.push([name, regex, color]);
            })
            var tagPresentationDict = JSON.stringify({ "namespaceColors": arr })
        }

        localStorage.setItem("tagPresentation", tagPresentationDict)
        //send to /updatePrefs
        $.ajax({
            type: "POST",
            url: "/updatePrefs",
            data: tagPresentationDict,
            dataType: "json",
            contentType: "application/json; charset=utf-8"
        }).done(function(response){
            console.log(`sent prefs:\n${tagPresentationDict}`)
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
["unnamespaced", "^(?!.*:).*$", "#00aaff"]`
);
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