var defaultnamespaceColors;
if ((localStorage.getItem('api-url') != null) && (localStorage.getItem('api-url') != "")) {
    $("#api-url-input").val(localStorage.getItem('api-url'));
    $("#settings-api-url-input").val(localStorage.getItem('api-url'));
}
if ((localStorage.getItem('api-key') != null) && (localStorage.getItem('api-key') != "")) {
    $("#api-key-input").val(localStorage.getItem('api-key'));
    $("#settings-api-key-input").val(localStorage.getItem('api-key'));
}

$.ajax({
    type: "POST",
    url: "/updatePrefs",
    data: `{"namespaceColors":""}`,
    dataType: "json",
    contentType: "application/json; charset=utf-8"
}).done(function (response) {

    var res = ``;
    response['namespaceColors'].forEach(function (v, i) {
        res += String.raw`${JSON.stringify(v).replace(/\\\\/g, '\\')}` + `\n`;
    });
    defaultnamespaceColors = res;
});

if ((localStorage.getItem('tagPresentation') != null)) {
    //if namespaceColors exist in localStorage, send to flask session to store.
    $.ajax({
        type: "POST",
        url: "/updatePrefs",
        data: localStorage.getItem('tagPresentation'),
        dataType: "json",
        contentType: "application/json; charset=utf-8"
    });

    var res = ``;
    JSON.parse(localStorage.tagPresentation)['namespaceColors'].forEach(function (v, i) {
        res += String.raw`${JSON.stringify(v).replace(/\\\\/g, '\\')}` + `\n`;
    });
    $("#inputTextarea").val(res);
} else {
    //else load default namespaceColors from flask
    $("#inputTextarea").val(defaultnamespaceColors);    
}


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
});

function validateName(name) {
    if (name.match(/^[a-zA-Z]([a-zA-Z0-9]|-|_)*$/m) != null) {
        //Allowed characters in Name: a-z, A-Z, 0-9, dash, underscore. Names cannot begin with a number.
        return true;
    } else { return false; }
}

$('#submitEntry').on('click', function () {
    if (!$('#modifyMode').is(':checked')) {
        var val = $("#inputTextarea").val().replace(/\n/g, ',');
        val = val.replace(/,+$/m, "") //remove comma(s) at end of string in case last char is newline    
        var tagPresentationDict = `{ "namespaceColors": [${val.replace(/\\/g, '\\\\')}] }`; //{"studio":[regex,"hex color"]}

        localStorage.setItem("api-url", $("#settings-api-url-input").val());
        localStorage.setItem("api-key", $("#settings-api-key-input").val());    
        localStorage.setItem("tagPresentation", tagPresentationDict)
        //send to /updatePrefs
        $.ajax({
            type: "POST",
            url: "/updatePrefs",
            data: tagPresentationDict,
            dataType: "json",
            contentType: "application/json; charset=utf-8"
        });

    }
})

$('#resetEntry').click(function () {
    $("#inputTextarea").val(defaultnamespaceColors);
});