var apiUrl = document.getElementById('settings-api-url-input');
var apiKey = document.getElementById('settings-api-key-input');
if ((localStorage.getItem('api-url') != null) && (localStorage.getItem('api-url') != "")) {
    document.getElementById('api-url-input').value = localStorage.getItem('api-url')
}
if ((localStorage.getItem('api-key') != null) && (localStorage.getItem('api-key') != "")) {
    document.getElementById('api-key-input').value = localStorage.getItem('api-key')
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
$('#settings-save-btn').click(function() {
    localStorage.setItem("api-url", apiUrl.value);
    localStorage.setItem("api-key", apiKey.value);
    localStorage.setItem("tag-service", tagService.value);
    localStorage.setItem("keybinds", $("#settings-keybind-checkbox").prop('checked'));
    localStorage.setItem("swiping", $("#settings-swiping-checkbox").prop('checked'));
    $('#settings-save-btn').text('Saved');
    $('#settings-save-btn').addClass('btn-success');
    setTimeout(function() {
	    $('#settings-save-btn').text('Save');
	    $('#settings-save-btn').removeClass('btn-success');
	  }, 2000); 
});