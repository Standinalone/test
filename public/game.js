const socket = io();
(function init() {

    const P1 = 'X';
    const P2 = 'O';
    let player;
    let game;
    let username='Anonymous';
   // module.exports(username);

    // const socket = io.connect('http://tic-tac-toe-realtime.herokuapp.com'),


    class Player {
        constructor(name, type) {
            this.name = name;
            this.type = type;
            this.currentTurn = true;
            this.playsArr = [];
            for (var i = 0; i < 25; ++i) this.playsArr.push(false);
        }

        // Set the bit of the move played by the player
        // tileValue - Bitmask used to set the recently played move.
        // updatePlaysArr(tileValue) {
        //     this.playsArr += tileValue;
        // }

        updatePlaysArr(tileValue) {
            this.playsArr[tileValue] = true;
        }

        getPlaysArr() {
            return this.playsArr;
        }

        // Set the currentTurn for player to turn and update UI to reflect the same.
        setCurrentTurn(turn) {
            this.currentTurn = turn;
            const message = turn ? 'Your turn' : 'Waiting for Opponent';
            $('#turn').text(message);
        }

        getPlayerName() {
            return this.name;
        }

        getPlayerType() {
            return this.type;
        }

        getCurrentTurn() {
            return this.currentTurn;
        }
    }

    // roomId Id of the room in which the game is running on the server.
    class Game {

        constructor(borders, roomId, size, win) {
            this.roomId = roomId;
            this.board = [];
            this.moves = 0;
            this.name = name;
            this.size = size;
            this.win = win;
            this.borders = borders;
        }
        getSize(){
            return this.size;
        }
        getName(){
            return this.name;
        }
        getMoves(){
            return this.moves;
        }

        // Create the Game board by attaching event listeners to the buttons.
        createGameBoard() {
            function tileClickHandler() {
                const row = parseInt(this.id.split('_')[1][0], 10);
                const col = parseInt(this.id.split('_')[1][1], 10);
                if (!player.getCurrentTurn() || !game) {
                    alert('Its not your turn!');
                    return;
                }

                if ($(this).prop('disabled')) {
                    alert('This tile has already been played on!');
                    return;
                }

                // Update board after your turn.
                game.playTurn(this);
                game.updateBoard(player.getPlayerType(), row, col, this.id);

                player.setCurrentTurn(false);
                //player.updatePlaysArr(1 << ((row * 3) + col));
                player.updatePlaysArr(game.getSize()*row+col); // Sends the tile's number

                game.checkWinner(game.getSize()*row+col);
            }

            var tbl = document.getElementsByClassName('center')[0];
            for (let i = 0; i < this.size; i++) {
                tbl.insertRow();
                this.board.push(['', '', '', '', '']);
                for (let j = 0; j < this.size; j++) {

                    var btn = document.createElement('Button');
                    btn.setAttribute('class','tile');
                    btn.id = 'button_'+i+j;
                    tbl.lastElementChild.appendChild(btn);

                    $(`#button_${i}${j}`).on('click', tileClickHandler);
                }
            }
        }

        // Remove the menu from DOM, display the gameboard and greet the player.
        displayBoard(message) {
            $('.menu').css('display', 'none');
            $('.btn_group').css('display', 'none');
            $('.gameBoard').css('display', 'block');
            if (!this.borders){
                message+='<br><a href="/images/Untitled.png" target="_blank">Правила</a>';
            }
            $('#userHello').html(message);
            $('#leave').css('display', 'block');
            this.createGameBoard();
        }

        /**
         * Update game board UI
         *
         * @param {string} type Type of player(X or O)
         * @param {int} row Row in which move was played
         * @param {int} col Col in which move was played
         * @param {string} tile Id of the the that was clicked
         */
        updateBoard(type, row, col, tile) {
            $(`#${tile}`).text(type).prop('disabled', true);
            this.board[row][col] = type;
            this.moves++;
        }

        getRoomId() {
            return this.roomId;
        }

        // Send an update to the opponent to update their UI's tile
        playTurn(tile) {
            const clickedTile = $(tile).attr('id');

            // Emit an event to update other player that you've played your turn.
            socket.emit('playTurn', {
                tile: clickedTile,
                room: this.getRoomId(),
            });
        }
        checkWinner(tile) {
            const currentPlayerPositions = player.getPlaysArr();

            var win = parseInt(this.win);
            var count = 1;
            var size = parseInt(this.size);
            var tile_copy = tile;
            //if (this.borders) {
                for (var tile_copy = tile; (((currentPlayerPositions[tile_copy - 1]) && (tile_copy % size))||((!(tile_copy%size) && currentPlayerPositions[tile_copy+size-1])&&(!this.borders))); tile_copy--) {
                    count++;
                    //alert('l');
                    if (!(tile_copy % size)){
                        tile_copy+=size;
                    }
                }
                for (var tile_copy = tile; ((((tile_copy + 1) % size) && (currentPlayerPositions[tile_copy + 1]))||(!((tile_copy + 1) % size)&&(currentPlayerPositions[tile_copy-size+1])&&(!this.borders))); tile_copy++) {
                    count++;
                    //alert('r');
                    if (!((tile_copy + 1) % size)){
                        tile_copy-=size;
                    }
                }
                if (count < win) {
                    for (var tile_copy = tile; (((tile_copy > size) && (currentPlayerPositions[tile_copy - size]))||((tile_copy < size)&&(currentPlayerPositions[size*size-tile_copy])&&(!this.borders))); tile_copy -= size) {
                        count++;
                        //alert('u');
                        if ((tile_copy < size)){
                            tile_copy=size*size+size-tile_copy;
                        }
                    }
                    for (var tile_copy = tile; (((tile_copy < (size * size) - size) && (currentPlayerPositions[tile_copy + size]))||((tile_copy > size*size-size)&&(currentPlayerPositions[tile_copy-size*size+size])&&(!this.borders))); tile_copy += size) {
                        count++;
                        //alert('d');
                        if ((tile_copy > size*size-size)){
                            tile_copy=tile_copy-size*size;
                        }
                    }
                    if (count < win) {
                        count = 1;
                        for (var tile_copy = tile; (((tile_copy % size) && (tile_copy > size) && (currentPlayerPositions[tile_copy - (size + 1)]))||((tile_copy == 0)&&(currentPlayerPositions[size*size-1])&&(!this.borders))); tile_copy -= (size + 1)) {
                            count++;
                            if ((tile_copy == 0)){
                                tile_copy=size*size+size;
                            }
                            //alert('ul');
                        }
                        for (var tile_copy = tile; ((((tile_copy + 1) % size) && (tile_copy < (size * size - size)) && (currentPlayerPositions[tile_copy + size + 1]))||((tile_copy == size*size-1)&&(currentPlayerPositions[0])&&(!this.borders))); tile_copy += (size + 1)) {
                            count++;
                            if ((tile_copy == size*size)){
                                tile_copy=-size-1;
                            }
                            //alert('dr');
                        }
                        if (count < win) {
                            count = 1;
                            for (var tile_copy = tile; ((((tile_copy + 1) % size) && (tile_copy > size) && (currentPlayerPositions[tile_copy - (size - 1)]))||((tile_copy == size-1)&&(currentPlayerPositions[size*size-size])&&(!this.borders))); tile_copy -= (size - 1)) {
                                count++;
                                //alert('ur');
                                if ((tile_copy == size-1)){
                                    tile_copy=size*size-1;
                                }
                            }
                            for (var tile_copy = tile; (((tile_copy % size) && (tile_copy < (size * size - size)) && (currentPlayerPositions[tile_copy + (size - 1)])||((tile_copy == size*size-size)&&(currentPlayerPositions[size-1])&&(!this.borders)))); tile_copy += (size - 1)) {
                                count++;
                                //alert('dl');
                                if ((tile_copy == size*size-size)){
                                    tile_copy=0;
                                }
                            }
                        }
                    }
                }

            if ((count > (win-1))||(this.checkTie())) {
                const tieMessage = 'Game Tied :(';
                game.endGame(tieMessage);
                socket.emit('gameEnded', {
                    room: this.getRoomId(),
                    message: tieMessage,
                });
                return;
            }
        }

        checkTie() {
            return this.moves >= this.size*this.size;
        }

        // Announce the winner if the current client has won.
        // Broadcast this on the room to let the opponent know.
        announceWinner() {
            const message = `${player.getPlayerName()} wins!`;
            socket.emit('gameEnded', {
                room: this.getRoomId(),
                message,
            });
            alert(message);
            location.reload();
        }

        // End the game if the other player won.
        endGame(message) {
            location.reload();
        }
    }

    // Create a new game. Emit newGame event.
    $('#new').on('click', () => {
        var name = $('#nameNew').val();
        var size = $('#size').val();
        var win = $('#win').val();
        var borders = $('#borders').is(':checked');
        if (!win) win=5;
        if (!size) size=10;
        if (!name) name='Тут что надо катка';

        socket.emit('createGame', {name : name, size : size, win : win, borders : borders});
    });

    $('#leave').on('click', () => {
        //game.endGame('lalal');
        socket.emit('gameEnded', {
            room: game.getRoomId(),
            message : 'qwer',
        });
        location.reload();
    });

    // New Game created by current client. Update the UI and create new Game var.
    socket.on('newGame', (data) => {
        rooms = data.rooms;
        const message =
            `Hello, ${data.username}<br>Room: ${data.name}. ${data.size}x${data.size} (max: ${data.win})<br>Borders: ${data.borders}`;

        // Create game for player 1
        player = new Player(data.username, P1);
        game = new Game(data.borders, data.room, data.size, data.win);
        game.displayBoard(message);
    });

    /**
     * If player creates the game, he'll be P1(X) and has the first turn.
     * This event is received when opponent connects to the room.
     */
    socket.on('player1', (data) => {
        //const message = `Hello, ${username}<br>Room: ${data.name}. ${data.size}x${data.size} (max: ${data.win}). <br>`;
        //$('#userHello').html(message);
        //chatroom.append("<p class='message'>" + data.username + " connected </p>");
        player.setCurrentTurn(true);
    });

    /**
     * Joined the game, so player is P2(O).
     * This event is received when P2 successfully joins the game room.
     */
    socket.on('player2', (data) => {
        const message = `Hello, ${data.username}<br>Room: ${data.name}. ${data.size}x${data.size} (max: ${data.win})<br>Borders: ${data.borders}`;

        // Create game for player 2
        //game = new Game(data.room);
        game = new Game(data.borders, data.room, data.size, data.win);
        game.displayBoard(message);
        player.setCurrentTurn(false);
    });

    /**
     * Opponent played his turn. Update UI.
     * Allow the current player to play now.
     */

    socket.on('getArr',(data)=>{
        //alert('asd');
        //alert(player.getPlaysArr());

        socket.emit('gettingArr',{moves : game.getMoves(), room : game.getRoomId()});
    })
    socket.on('turnPlayed', (data) => {
        const row = data.tile.split('_')[1][0];
        const col = data.tile.split('_')[1][1];
        const opponentType = player.getPlayerType() === P1 ? P2 : P1;

        game.updateBoard(opponentType, row, col, data.tile);
        player.setCurrentTurn(true);
    });

    // If the other player wins, this event is received. Notify user game has ended.
    socket.on('gameEnd', (data) => {
        alert('End of game :(');
        game.endGame(data.message);
        //socket.leave(data.room);
    });

    /**
     * End the game on any err event.
     */
    socket.on('err', (data) => {
        alert(data.message);
        //game.endGame(data.message);
    });
    let gameName;
    var rooms;
    socket.emit('request_rooms',{});
    socket.on('getRooms', (data) => {
        var rooms = data.rooms;
        var table = document.getElementsByClassName("btn_group")[0];
        while(table.hasChildNodes())
        {
            table.removeChild(table.firstChild);
        }
        for (var i = 0; i < rooms.length; i++) {
            if (Object.keys(rooms[i]).length>0) {
                var size = rooms[i].size;
                var win = rooms[i].win;
                var name = rooms[i].name;
                var borders = rooms[i].borders;
                var element = document.createElement("button");
                element.setAttribute('class', 'channel')
                const roomID = 'room-'+i;
                element.id = roomID;

                element.innerHTML = rooms[i].name +'<br>Размер: '+rooms[i].size+'x'+rooms[i].size+'<br>Макс. в ряд: '+rooms[i].win+'<br>Borders: '+rooms[i].borders;
                element.addEventListener('click', function () {
                    socket.emit('joinGame', {borders : borders, name: name, size: size, room: roomID, win : win});
                    player = new Player(name, P2);
                 });


                table.insertRow().insertCell();
                table.lastElementChild.lastElementChild.lastElementChild.appendChild(element);
            }
        }
    });
}());