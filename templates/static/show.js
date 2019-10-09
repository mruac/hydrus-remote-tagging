var current = location.href.split('/')[4].replace(/\?.*$/, '');
var next = parseInt(current) + 1
var prev = parseInt(current) - 1
if ($('h1').hasClass('nm-text')) {
    window.location = next
} else {
    $("a#a-d-button").click(function() {
        var hAction = this.getAttribute("value");
        $.post(current, { action: hAction }, function() {
            window.location = next
        });
    });
    if ((localStorage.getItem('keybinds') == "true") || (localStorage.getItem('keybinds') == null)) {
        $(document).keydown(function(e) {
            switch (e.which) {
                case 65: // a
                    $.post(current, { action: "archive" }, function() {
                        window.location = next
                    });
                    break;

                case 68: // d
                    $.post(current, { action: "delete" }, function() {
                        window.location = next
                    });
                    break;

                case 83: // s
                    window.location = next
                    break;

                case 90: // z
                    window.location = prev
                    break;

                default:
                    return;
            }
            e.preventDefault();
        });
    }
}
if ((localStorage.getItem('swiping') == "true") || (localStorage.getItem('swiping') == null)) {
    $(function() {
        $("main").swipe({
            swipeStatus: function(event, phase, direction, distance, duration) {
                if (direction == 'right') {
                    $(this).css("transform", "translate("+distance+"px,0)");
                    if (distance >= 150) {
	                    $.post(current, { action: "archive" }, function() {
	                        window.location = next
	                    });
                	}
                } else if (direction == 'left') {
                    $(this).css("transform", "translate(-"+distance+"px,0)");
                    if (distance >= 150) {
	                    $.post(current, { action: "delete" }, function() {
	                        window.location = next
	                    });
                	}
                } else if (direction == 'up') {
                    $(this).css("transform", "translate(0,-"+distance+"px)");
                    if (distance >= 150) {
                    	window.location = next
                    }
                }
            },
            threshold: 150,
            cancelThreshold: 20,
            triggerOnTouchEnd: true
        });
    });
}