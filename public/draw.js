const socket = io('/about');
(function init() {
    //alert('asd');
    var mouse = {
        click: false,
        move: false,
        pos: {x:0, y:0},
        pos_prev: false
    };
    var canvas  = document.getElementById('drawing');
    var context = canvas.getContext('2d');
    var width   = window.innerWidth;
    var height  = window.innerHeight;

    canvas.width = width;
    canvas.height = height;

    canvas.onmousedown = function(e){
        mouse.click = true;
    };
    canvas.onmouseup = function(e){
        mouse.click = false;
    };

    canvas.onmousemove = function(e) {
        mouse.pos.x = e.pageX / width;
        mouse.pos.y = e.pageY  ;
        mouse.move = true;
    };

    socket.on('draw_line', function (data) {
        var line = data.line;
        context.beginPath();
        context.lineWidth = 2;
        context.moveTo(line[0].x * width, line[0].y -100);
        context.lineTo(line[1].x * width, line[1].y -100);
        context.stroke();
    });

    function mainLoop() {
        if (mouse.click && mouse.move && mouse.pos_prev) {
            socket.emit('draw_line', { line: [ mouse.pos, mouse.pos_prev ] });
            mouse.move = false;
        }
        mouse.pos_prev = {x: mouse.pos.x, y: mouse.pos.y};
        setTimeout(mainLoop, 25);
    }
    mainLoop();
}());