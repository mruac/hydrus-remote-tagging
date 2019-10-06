var current = location.href.split('/')[4].replace(/\?.*$/, '');
var next = parseInt(current) + 1
var prev = parseInt(current) - 1
if ($('h1').hasClass('nm-text')) {
	window.location = next
} else {
	$("a#a-d-button").click(function() {
	    var hAction = this.getAttribute("value");
		$.post(current, {action: hAction}, function(){
			window.location = next
		});
	});
	$(document).keydown(function(e) {
	    switch(e.which) {
	        case 65: // a
		        $.post(current, {action: "archive"}, function(){
					window.location = next
				});
		        break;

	        case 68: // d
	        	$.post(current, {action: "delete"}, function(){
					window.location = next
				});
	        	break;

	        case 83: // s
				window.location = next
				break;

	        case 90: // z
				window.location = prev
				break;

	        default: return;
	    }
	    e.preventDefault();
	});
}