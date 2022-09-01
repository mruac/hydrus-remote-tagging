var defaultNamespaceColors =
    [
        // ["className","regex","hexColor"], apply top to bottom
        ["character", "^character:.*$", "#00aa00"],
        ["creator", "^creator:.*$", "#ff0000"],
        ["meta", "^meta:.*$", "#6f6f6f"],  // default #111111 in hydrus
        ["person", "^person:.*$", "#008000"],
        ["series", "^series:.*$", "#d200d2"],
        ["studio", "^studio:.*$", "#ff0000"],
        ["namespaced", "^.*:.*$", "#72a0c1"],
        ["unnamespaced", "^(?!.*:).*$", "#00aaff"]
    ];

if ((localStorage.getItem('api-url') != null) && (localStorage.getItem('api-url') != "")) {
    $("#api-url-input").val(localStorage.getItem('api-url'));
    $("#settings-api-url-input").val(localStorage.getItem('api-url'));
}
if ((localStorage.getItem('api-key') != null) && (localStorage.getItem('api-key') != "")) {
    $("#api-key-input").val(localStorage.getItem('api-key'));
    $("#settings-api-key-input").val(localStorage.getItem('api-key'));
}
if (localStorage.getItem("sidebarToggleKey") != null) {
    $(`input[name="sidebarToggleKey"][value="${localStorage.getItem("sidebarToggleKey")}"]`).prop("checked", true);
} else {
    localStorage.setItem("sidebarToggleKey", "ctrl");
    $(`input[name="sidebarToggleKey"][value="${localStorage.getItem("sidebarToggleKey")}"]`).prop("checked", true);
}

if (localStorage.getItem('tagPresentation') == undefined) {
    localStorage.setItem('tagPresentation', JSON.stringify({ "namespaceColors": defaultNamespaceColors }));
}


let res = "";
JSON.parse(localStorage.tagPresentation)["namespaceColors"].forEach(v => {
    res += `["${v[0]}","${v[1]}","${v[2]}"]\n`;
});
$("#inputTextarea").val(res);


$('#modifyMode').change(function () {
    if ($('#modifyMode').is(':checked')) {
        //edit mode
        $('#submitEntry').prop('disabled', true);
        $("#entryAlert").addClass("d-none");
        $("#textformatAlert").addClass("d-none");
        $("#switchEntryMode").removeClass("d-none");
        $("#resetEntry").removeClass("d-none");

        //show textarea
        $("#inputTextarea").prop("disabled", false);

    } else {
        //view mode
        $("#resetEntry").addClass("d-none");
        $("#switchEntryMode").addClass("d-none");

        //validate & disable textarea edit mode
        $("#inputTextarea").prop("disabled", true);
        let val = $("#inputTextarea").val().replace(/\n/g, ',').replace(/\\/g, '\\\\');
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
});

function validateName(name) {
    if (name.match(/^[a-zA-Z]([a-zA-Z0-9]|-|_)*$/m) != null) {
        //Allowed characters in Name: a-z, A-Z, 0-9, dash, underscore. Names cannot begin with a number.
        return true;
    } else { return false; }
}

$('#submitEntry').on('click', function () {
    if (!$('#modifyMode').is(':checked')) {
        let val = $("#inputTextarea").val().replace(/\n/g, ',');
        val = val.replace(/,+$/m, "") //remove comma(s) at end of string in case last char is newline    
        let tagPresentationDict = `{ "namespaceColors": [${val.replace(/\\/g, '\\\\')}] }`; //{"studio":[regex,"hex color"]}

        localStorage.setItem("api-url", $("#settings-api-url-input").val());
        localStorage.setItem("api-key", $("#settings-api-key-input").val());
        localStorage.setItem("tagPresentation", tagPresentationDict)
        localStorage.setItem("sidebarToggleKey", $('input[name="sidebarToggleKey"]:checked').val())
    }
})

$('#alert').on('click', function (e) {
    $(e.currentTarget).remove();
})

$('#resetEntry').click(function () {
    let res = "";
    defaultNamespaceColors.forEach(v => {
        res += `["${v[0]}","${v[1]}","${v[2]}"]\n`;
    });
    $("#inputTextarea").val(res);
});