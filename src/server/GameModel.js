import fs from 'fs';
import constants from './constants.js';

class GameModel{
    constructor(questions) {
        this.questions = questions;
        this.players = {}; // buzzer (enabled, disabled), name, role, score
        this.active_player = 0; // the player that chose the question
        this.current_player = -1; // the player currently answering
        this.attempts = 0;
        this.lastValue = 0;
        this.stateIndex = -1;
        this._state = "show_board";
    }

    save(filepath){
        fs.writeFileSync(filepath, JSON.stringify(this));
    }

    load(filepath){
        let json = fs.readFileSync(filepath);
        let obj = JSON.parse(json);
        for (let field in obj){
            this[field] = obj[field];
        }
    }

    /**
     * Set the point value for a question cell.
     * Set to zero length string ("") to indicate question is not available.
     * If row and column are omitted, use the row/col from the
     * most recent previous setQuestionState.
     * @param col
     * @param row
     * @param value
     * @rteurn game state update object
     */
    setValue(value, col, row){
        col = col ?? this.state_data.col;
        row = row ?? this.state_data.row;
        this.questionSet[col].questions[row].value = value;
    }

    /**
     * Retrieve the point value for the specified question.
     * If row and column are omitted, use the row/col from the
     * most recent previous setQuestionState.
     * @param col
     * @param row
     * @returns {*}
     */
    getValue(col, row){
        col = col ?? this.state_data.col;
        row = row ?? this.state_data.row;
        return this.questionSet[col].questions[row].value;
    }

    /**
     * Set the state data for the specified question question.
     * @param col
     * @param row
     * @returns game state update object
     */
    setQuestionState(col, row){
        this.state_data = {
            col: col,
            row: row,
            type: this.getQuestionType(col, row),
            text: this.getQuestion(col, row)
        }
    }

    /**
     * Retrieve the answer for the current question.
     * If row and column are omitted, use the row/col from the
     * most recent previous setQuestionState.
     * @param col
     * @param row
     * @returns game state update object
     */
    getAnswer(col, row){
        col = col ?? this.state_data.col;
        row = row ?? this.state_data.row;
        return this.questionSet[col].questions[row].a;
    }

    /**
     * Retrieve the question type
     * If row and column are omitted, use the row/col from the
     * most recent previous setQuestionState.
     * @param col
     * @param row
     * @returns game state update object
     */
    getQuestionType(col, row){
        col = col ?? this.state_data.col;
        row = row ?? this.state_data.row;
        return this.questionSet[col].questions[row].type;
    }

    /**
     * Set the buzzer state for player to value.
     * If player is omitted set it for the current player.
     * @param value
     * @param player
     */
    setBuzzer(value, player){
        if (this.playerCount() <= 0) return;
        player = player ?? this.current_player;
        this.players[player].buzzer = value;
    }

    /**
     * Retrieve the answer for the current question.
     * If row and column are omitted, use the row/col from the
     * previous setQuestionState or setAnswerState.
     * @param col
     * @param row
     * @returns game state update object
     */
    getQuestion(col, row){
        col = col ?? this.state_data.col;
        row = row ?? this.state_data.row;
        return this.questionSet[col].questions[row].q;
    }

    /**
     *
     * Set the game model state to "show answer"
     * @param col
     * @param row
     * @returns game state update object
     */
    setAnswerState(){
        this.state = "show_answer";
        this.state_data = {
            col    : this.state.col,
            row    : this.state.row,
            text   : this.getAnswer()
        };
    }

    /**
     * Retrieve the current player (last buzzed/chose question).
     * @returns {null|*}
     */
    currentPlayer(){
        if (this.current_player === -1) return null;
        return this.players[this.current_player];
    }

    /**
     * Retrieve the number of players permitted to buzz in.
     * @returns {number}
     */
    countEnabledBuzzers(){
        let r = 0;
        for (let i in this.players){
            let player = this.players[i];
            if (player.buzzer === "enabled") r = r + 1;
        }
        return r;
    }

    /**
     * Retrieve the game state of the game (without questions & answers).
     * Used to send a full update to clients.
     * @returns {{}}
     */
    getFullUpdate(){
        let sanitized = JSON.parse(JSON.stringify(this));
        sanitized.action = "update_model";
        delete sanitized.filepath;

        for (let category in sanitized.questionSet){
            for (let j in sanitized.questionSet[category].questions){
                let question = sanitized.questionSet[category].questions[j];
                delete question.a;
                delete question.q;
                delete question.type;
            }
        }

        sanitized.state = sanitized._state;
        delete sanitized._state;

        return sanitized;
    }

    /***
     * Set the score of a player.
     * @param index
     * @param value
     */
    setScore(value, index){
        index = index  ?? this.current_player;
        if (typeof index === "string") index = parseInt(index);
        console.log("set score " + index + " " + value);
        this.players[index].score = value;
    }

    /***
     * Set the score of a player.
     * @param index
     * @param value
     */
    getScore(index){
        index = index  ?? this.current_player;
        if (typeof index === "string") index = parseInt(index);
        console.log(`get score ${index}`);
        return this.players[index].score;
    }

    /**
     * Set the current player choosing the question.
     * Setting active player out of range will set it to -1
     * Returns, JSON object to broadcast
     */
    setActivePlayer(index){
        if (typeof index === "string") index = this.playerIndex(index);
        if (index < 0 || index> this.players.length) this.active_player = -1;
        this.active_player = index;
        return index;
    }

    /**
     * Return a count of enabled players.
     * @returns {number}
     */
    playerCount(){
        return Object.keys(this.players).length;
    }

    /**
     * return true if player exists and is enabled.
     * @param index
     */
    isEnabled(i){
        if (this.players[i] === undefined) return false;
        return this.players[i].enabled;
    }

    advanceActivePlayer(){
        this.active_player = this.active_player + 1;
        if (this.active_player >= this.playerCount()) this.active_player = 0;
    }

    getActivePlayer(){
        return this.active_player;
    }

    /**
     * Add a new player to the model
     * @param name
     * @param role
     * @returns {number} index of the player
     */
    addPlayer(name, role){
        if (role === "host") return -1;
        if (this.hasPlayer(name)){
            let index =  this.playerIndex(name);
            this.players[index].enabled = true;
            return index;
        }

        /* Get the next empty player slot, and fill it */
        for (let i = 0; i < 10; i = i + 1){
            if (this.players[i] === undefined){
                this.players[i] = {
                    name: name,
                    score: 0,
                    buzzer: "enabled",
                    role: role,
                    enabled: true
                }
                if (this.getActivePlayer() === -1) this.setActivePlayer(0);
                this.saveState();
                return i;
            }
        }
        return -1
    }

    disablePlayer(index){
        if (!this.players[index]) return;
        this.players[index].enabled = false;
    }

    /**
     * Enable all buzzers.
     */
    clearBuzzers(){
        for (let i in this.players) this.players[i].buzzer = "enabled";
    }

    hasPlayer(name){
        for (let i in this.players){
            if (this.players[i].name === name) return true;
        }
        return false;
    }

    playerIndex(name){
        for (let i in this.players){
            if (this.players[i].name === name) return i;
        }
        return -1;
    }

    getPlayer(index){
        return this.players[index];
    }

    removePlayer(index){
        if (typeof index === "string") index = this.playerIndex(index);
        delete this.players[index];
        if (this.active_player === index) this.advanceActivePlayer();
    }

    set state(value){
        this._state = value;
        if (value === "show_board"){
            this.saveState();
        }
    }

    saveState(){
        if (!fs.existsSync(constants.savePath)){
            fs.mkdirSync(constants.savePath, {recursive : true})
        };
        this.stateIndex = this.stateIndex + 1;
        this.save(`${constants.savePath}/prev_state.${this.stateIndex}.json`);
    }

    get state(){
        return this._state;
    }
}

export default GameModel;