var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
//var logger = require('morgan');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', require('./routes/index'));
app.use('/about', require('./routes/about'));
app.use('/tic-tac-toe', require('./routes/tic-tac-toe'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

server = app.listen(process.env.PORT || 3000);
var io = require('socket.io')(server);


var availableRooms = {}; // Open rooms

let rooms_arr = [];
let joinedSockets = [];
// let clientID; // Id of a user requesting names
for (var i = 0; i < 10; ++i) rooms_arr.push(false);
io.on('connection', (socket)=> {
    //console.log('User connected');

    function getRooms(){
        for (i=0; i<rooms_arr.length; i++){
            if (Object.keys(rooms_arr[i]).length==0) {
                //rooms++;
                rooms_arr[i] = true;
                return i;
            }
        }
    }

    socket.username = "Anonymous";

    socket.on('change_username',(data) => {
        //console.log('changhed to '+ data.username + ' ' + socket.id);
        socket.username = data.username;
    });

    socket.on('new_message', (data)=> {
      io.emit('new_message', {message : data.message, username : socket.username});
    })

    socket.on('typing', (data) =>{
        socket.broadcast.emit('typing', {username : socket.username});
    })


    // socket.on('getName', (data) => {
    //     //console.log(data.room);
    //     io.in(data.room).emit('Name',{});
    // })
    // socket.on('sendName',(data)=> {
    //     socket.emit('receiveName',{name : data.name, room : data.room, size : data.size});
    // })

    socket.on('sendName',(data)=> {
        console.log('Sending name to '+clientID);
        io.to(clientID).emit('receiveName',{name : data .name, room : data.room, size : data.size});
    })

//     socket.on('getName',(data)=>{
//         console.log('getting Id from new client '+data.socketId);
//         clientID = data.socketId;
//         var socketFromRoom;
//         for (var i=0; i<2, socketFromRoom==null;i++) {
// //            socketFromRoom = Object.keys(io.nsps['/'].adapter.rooms[data.room].sockets)[i];
//         }
//         io.to(data.room).emit('pushName',{room : data.room}); // Tries to fetch name only from one socket from one room
//     });

    socket.on('request_rooms', (data) => {
        console.log('Reuesting rooms from '+ socket.id);
        socket.emit('getRooms',{rooms : rooms_arr});
    });

    // Create a new game room and notify the creator of game.
    socket.on('createGame', (data) => {
        joinedSockets.forEach((obj)=>{
            if(socket.id === obj.id) {
                console.log ('Not permited for '+socket.id);
                return;
            }
        });
        var roomId = getRooms();
        rooms_arr[roomId]={name : data.name, size : data.size, id : 'room-'+roomId, win : data.win, borders : data.borders};
        socket.join('room-'+roomId);
        joinedSockets.push({id: socket.id, room : 'room-'+roomId});
        //for (var room in io.sockets.adapter.rooms) console.log (room);
        console.log('Creating room '+roomId+' for '+socket.id+' named '+socket.username);
        socket.emit('newGame', {borders : data.borders, username : socket.username, name: data.name, room: 'room-'+roomId, size : data.size, win : data.win });
        io.emit('getRooms',{rooms : rooms_arr});


    });

    // Connect the Player 2 to the room he requested. Show error if room full.
    socket.on('joinGame', function (data) {
        var room = io.nsps['/'].adapter.rooms[data.room];
        if (room && room.length === 1) {
            socket.join(data.room);
            socket.broadcast.to(data.room).emit('player1', {username : socket.username});
            socket.emit('player2', {borders : data.borders, username : socket.username, name: data.name, room: data.room, size : data.size, win : data.win})
            joinedSockets.push({id: socket.id, room : data.room});
            console.log('Joining to '+data.room);
            io.to(data.room).emit('new_message', {message : 'connected', username : socket.username});
        } else {
            console.log("Couldn't join "+socket.id+' '+data.room);
            socket.emit('err', { message: 'Sorry, The room is full!' });
        }
    });

    socket.on('disconnect', (reason) => {
        joinedSockets.forEach((obj)=>{
            if (socket.id == obj.id){
                // console.log(joinedSockets);
                // console.log(socket.id + ' disconnected. Socket '+obj.id+' left '+obj.room);
                socket.to(obj.room).emit('gameEnd',{});
                console.log('Deleting room from base: '+obj.room + ' '+socket.id+'disconnected');
                rooms_arr[parseInt(obj.room.split('-')[1],10)]={};
                io.emit('getRooms',{rooms : rooms_arr});
                joinedSockets.splice(joinedSockets.indexOf(obj),1);
            }
        })
    })

    // socket.onclose = function(reason) {
    //     var roomId = socket.rooms[0];
    //     console.log(roomId);
    //     Object.getPrototypeOf(this).onclose.call(this, reason);
    // }

    socket.on('gettingArr',(data)=>{
        var room = io.nsps['/'].adapter.rooms[data.room];
        if ((data.moves)&&(room.length===1)){
            var id = parseInt(data.room.split('-')[1],10);
            //console.log(data.room);
            rooms_arr[id] = false;
            //io.to(data.room).emit('gameEnd', {room: 'room-' + id});
            io.to(data.room).emit('gameEnd', {});
        }
    })
    /**
     * Handle the turn played by either player and notify the other.
     */
    socket.on('playTurn', (data) => {
        socket.broadcast.to(data.room).emit('turnPlayed', {
            tile: data.tile,
            room: data.room
        });
    });

    /**
     * Notify the players about the victor.
     */
    socket.on('gameEnded', (data) => {
        console.log(socket.id+' left '+data.room);
        socket.to(data.room).emit('gameEnd', data);
        console.log('Deleting room from base: room-'+parseInt(data.room.split('-')[1],10));
        rooms_arr[parseInt(data.room.split('-')[1],10)]={};
        io.emit('getRooms',{rooms : rooms_arr});
    });

});
























