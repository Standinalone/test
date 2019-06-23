var username = $("#username");
var chatroom = $("#chatroom");

$(function() {
//     var socket = io();

    var message = $("#message");
    var send_message = $("#send_message");
    var send_username = $("#send_username");
    var feedback = $("#feedback")


    send_message.click(function(){
        socket.emit('new_message', {message : message.val()})
    });
    send_username.click(function () {
        socket.emit('change_username',{username : username.val()});
    });

    socket.on('new_message', (data) => {
        chatroom.append("<p class='message'>" + escapeHtml(data.username) + ": " + escapeHtml(data.message) + "</p>");
        feedback.html("");
    });

    message.bind("keypress", () => {
        socket.emit('typing');
    });

    socket.on('typing',(data) => {
        feedback.html("<p><i>"+ data.username + " is typing..." + "</i></p>");
    })

    var entityMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;'
    };

    function escapeHtml (string) {
        return String(string).replace(/[&<>"'`=\/]/g, function (s) {return entityMap[s];});
    }
 });