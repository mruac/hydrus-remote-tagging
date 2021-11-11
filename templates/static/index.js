var apiUrl = document.getElementById('settings-api-url-input');
var apiKey = document.getElementById('settings-api-key-input');
if ((localStorage.getItem('api-url') != null) && (localStorage.getItem('api-url') != "")) {
    document.getElementById('api-url-input').value = localStorage.getItem('api-url')
}
if ((localStorage.getItem('api-key') != null) && (localStorage.getItem('api-key') != "")) {
    document.getElementById('api-key-input').value = localStorage.getItem('api-key')
}

if ((localStorage.getItem('tagPresentation') != null)) {
    $.ajax({
        type: "POST",
        url: "/updatePrefs",
        data: JSON.stringify({"namespaceColors":localStorage.getItem('tagPresentation')}),
        dataType: "json",
        contentType: "application/json; charset=utf-8"
    });
    
    $("#tagPresentation tbody tr").each(function (i, v) {
        $(v).remove();
    });

    JSON.parse(localStorage.getItem('tagPresentation'))["namespaceColors"].forEach(function (v, i) {
        $(`<tr><td><input class="form-check-input select-entry" type="checkbox" value="" disabled></td><td>${v[0]}</td><td>${v[1]}</td><td><input type="color" class="form-control form-control-color" value="${v[2]}" title="Choose your color" disabled></td></tr>`).appendTo("#tagPresentation tbody")
    });
    $("#tagPresentation").tableDnDUpdate();

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
    $("#tagPresentation").tableDnD();
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
    console.log($('#modifyMode').is(':checked'));
    if ($('#modifyMode').is(':checked')) {
        //edit mode
        $("#editEntry").removeClass("d-none");
        $("#resetEntry").removeClass("d-none");
        $("#entryAlert").addClass("d-none");
        $("#allCheck").prop('disabled', false);
        $('#save-colors-btn').prop('disabled', true);
        $("#tagPresentation tbody tr").each(function (i, v) {
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
    } else {
        //view mode
        $("#editEntry").addClass("d-none");
        $("#resetEntry").addClass("d-none");
        $("#allCheck").prop('disabled', true).prop("checked", false);
        $('#save-colors-btn').prop('disabled', false);
        $("#tagPresentation tbody tr").each(function (i, v) {
            //hide add/delete
            //disable checkboxes
            $($(v).find('[type=checkbox]')).prop('disabled', true).prop("checked", false);
            //convert text values to text
            var name = $($(v).find('[type=text]')[0]).val();
            var regex = $($(v).find('[type=text]')[1]).val();
            $($(v).children()[1]).text(name);
            $($(v).children()[2]).text(regex);
            //disable color selection
            $($(v).find('[type=color]')).prop('disabled', true);
            //remove empty rows
            if (name == "" || regex == "") {
                $(v).remove();
            }
        });
    }
});

$('#deleteEntry').click(function () {
    if ($("#modifyMode").prop('checked')) {
        $(".select-entry:checked").each(function (i, v) {
            $(v).closest('tr').remove()
        });
    }
});

$('#addEntry').click(function () {
    if ($("#modifyMode").prop('checked')) {
        $(`<tr><td><input class="form-check-input select-entry" type="checkbox" value=""></td><td><input type="text" class="form-control w-100 mx-auto" placeholder="Tag / namespace" value=""></td><td><input type="text" class="form-control w-100 mx-auto" placeholder="Python Regex" value=""></td><td><input type="color" class="form-control form-control-color" value="" title="Choose your color"></td></tr>`).appendTo("#tagPresentation tbody");
        $("#tagPresentation").tableDnDUpdate();
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

$('#save-colors-btn').on('click', function () {
    var tagPresentationDict = { "namespaceColors": [] } //{"studio":[regex,"hex color"]}
    $(".entry-name .text-danger").each(function (i, v) {
        if ($(v).text().match(/^[a-zA-Z-_]*$/) == null) {
            $(v).addClass('text-danger');
        } //only allow alpha, hyphen and underscore
    })
    if ($(".entry-name.text-danger").length > 0) {
        $("#entryAlert").removeClass("d-none");
        return;
    }
    $("#tagPresentation tbody tr").each(function (i, v) {
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

})

$('#resetEntry').click(function () {
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
    $("#tagPresentation tbody tr").each(function (i, v) {
        $(v).remove();
    });

    defaults.forEach(function (v, i) {
        $(`<tr><td><input class="form-check-input select-entry" type="checkbox" value=""></td><td><input type="text" class="form-control w-100 mx-auto" placeholder="Tag / namespace" value="${v[0]}"></td><td><input type="text" class="form-control w-100 mx-auto" placeholder="Python Regex" value="${v[1]}"></td><td><input type="color" class="form-control form-control-color" value="${v[2]}" title="Choose your color"></td></tr>`).appendTo("#tagPresentation tbody")
    });
    $("#tagPresentation").tableDnDUpdate();
})