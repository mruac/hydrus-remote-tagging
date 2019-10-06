var apiUrl = document.getElementById('settings-api-url-input');
var apiKey = document.getElementById('settings-api-key-input');
var tagService = document.getElementById('settings-tag-service-input');
if ((localStorage.getItem('api-url') != null) && (localStorage.getItem('api-url') != "")) {
    document.getElementById('api-url-input').value = localStorage.getItem('api-url')
}
if ((localStorage.getItem('api-key') != null) && (localStorage.getItem('api-key') != "")) {
    document.getElementById('api-key-input').value = localStorage.getItem('api-key')
}
if ((localStorage.getItem('tag-service') != null) && (localStorage.getItem('tag-service') != "")) {
    document.getElementById('tag-service-input').value = localStorage.getItem('tag-service')
}
document.getElementById('settings-api-url-input').value = localStorage.getItem('api-url')
document.getElementById('settings-api-key-input').value = localStorage.getItem('api-key')
document.getElementById('settings-tag-service-input').value = localStorage.getItem('tag-service')

$('#settings-save-btn').click(function() {
    localStorage.setItem("api-url", apiUrl.value);
    localStorage.setItem("api-key", apiKey.value);
    localStorage.setItem("tag-service", tagService.value);
    console.log("saved")
});