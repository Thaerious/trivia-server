import GameModel from "./GameModel.js";
import constants from "./constants.js";
import crypto from "crypto";

class Timer {
    constructor(game) {
        this.game = game;
    }

    start(startTime = 10) {
        if (startTime === 0) return;
        this.startTime = startTime;

        if (this.timeout) {
            clearTimeout(this.timeout);
            delete this.timeout;
        }

        this.currentTime = startTime;
        this.timeout = setTimeout(() => this.update(), 1000);
        this.game.broadcast({
            action: "start_timer",
            data: {time: startTime}
        });
    }

    stop() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            delete this.timeout;
        }
    }

    update() {
        this.currentTime = this.currentTime - 1;
        if (this.currentTime >= 0) {
            this.timeout = setTimeout(() => this.update(), 1000);
            this.onUpdate(this.currentTime);
        } else {
            this.onExpire();
        }
    }

    onUpdate() {
        this.game.broadcast({
            action: "update_timer",
            data: {
                'start-time' : this.startTime,
                time: this.currentTime,
                progress : Math.trunc(this.currentTime / this.startTime * 100)
            }
        });
    }

    onExpire() {
        delete this.timeout;
        this.game.onInput({action: "expire"});
        // this.game.broadcast({action: "stop_timer"});
    }

    clear() {
        if (this.timeout) clearTimeout(this.timeout);
    }
}

Timer.TIMES = {};
Object.assign(Timer.TIMES, constants.TIMES);

class Game {

    /**
     *
     * @param model GameDescriptionModel
     */
    constructor(model) {
        this.timer = new Timer(this);
        this.listeners = {};
        this.state = 0;
        if (model){
            this.model = model;
            this.lastUpdate = this.getUpdate();
        }
    }

    /**
     * @param input {action : string, data : {}}
     */
    onInput(input) {
        console.log(`(${this.state}) - ${JSON.stringify(input)}`);
        console.log("-----------------------------------");

        switch(input.action){
            case "next_round":
                this.model.nextRound();
                this.startRound();
            break;
            case "prev_round":
                this.model.prevRound();
                this.startRound();
                break;
            default:
                this[this.state](input);
            break;
        }
    }

    updateState(state, extraData = {}){
        this.state = state;
        const update = this.getUpdate()
        update.data = {...update.data, ... extraData};
        this.lastUpdate = update;
        this.broadcast(update);
    }

    addListener(name, cb) {
        this.listeners[name] = cb;
    }

    removeListener(name) {
        delete this.listeners[name];
    }

    broadcast(msg) {
        msg = msg ?? this.lastUpdate;

        for (let name in this.listeners) {
            this.listeners[name](msg);
        }
    }

    notify(name, msg) {
        this.listeners[name](msg);
    }

    createPlayerData() {
        let data = {};
        for (let player of this.model.players) {
            data[player.name] = {
                bets : [0, 0, 0, 0, 0, 0],
                total : 0
            }
        }
        return data;
    }

    startRound() {
        if (this.model.getRound().stateData.style === GameModel.STYLE.MULTIPLE_CHOICE) {
            this.model.getRound().setQuestionState();
            this.playersData = this.createPlayerData();
            this.updateState(1);
        } else if (this.model.getRound().stateData.style === GameModel.STYLE.JEOPARDY) {
            this.model.getRound().setBoardState();
            this.updateState(4);
        } else if (this.model.getRound().stateData.style === GameModel.STYLE.END_OF_GAME) {
            this.updateState(10);
        }
    }

    /**
     * Calculate the player scores based upon the MC answers
     * Blank values are considered to be false.
     * >= 0 are considered to be true.
     */
    updateMCScores() {
        let values = this.model.getRound().getValues();

        for (let name in this.playersData) {
            // the sum of bets must be <= the players available score

            this.playersData[name].bonus = true;
            let bonusFlag = true;

            if (this.sumMCBet(name) > this.model.getPlayer(name).score){
                this.playersData[name].bonus = false;
                continue;
            }

            for (let index = 0; index < this.playersData[name].bets.length; index++) {
                if (this.playersData[name].bets[index] === ""){
                    if (values[index] === "true") bonusFlag = false;
                    this.playersData[name].bonus = false;
                }
                else if (values[index] === "true") {
                    this.playersData[name].total += this.playersData[name].bets[index];
                } else {
                    bonusFlag = false;
                    this.playersData[name].total -= this.playersData[name].bets[index];
                }
            }
            if (bonusFlag){
                this.playersData[name].total += parseInt(this.model.getUpdate().round.bonus);
            }

            this.model.getPlayer(name).score += this.playersData[name].total;
        }
    }

    /**
     * Return the sum of all multiple choice bets for the given name.
     * @param name
     */
    sumMCBet(name) {
        let r = 0;
        for (let index = 0; index < this.playersData[name].bets.length; index++) {
            r = r + parseInt(this.playersData[name].bets[index]);
        }
        return r;
    }

    getUpdate() {
        return {
            action: "update_model",
            'id-hash': crypto.randomBytes(8).toString('hex'),
            'time-stamp': new Date(),
            data: {
                model: this.model.getUpdate(),
                state: this.state
            }
        }
    }

    [0](input) {
        switch (input.action) {
            case "join":
                this.model.addPlayer(input.data.name);
                this.broadcast();
                break;
            case "start":
                this.broadcast({action : "start_game"});
                this.model.nextRound();
                this.startRound();
                break;
        }
    }

    [1](input) {
        switch (input.action) {
            case "join":
                this.model.addPlayer(input.data.name);
                this.broadcast();
                break;
            case "continue":
                this.model.getRound().setAnswerState();
                this.updateState(2);
                // this.timer.start(Timer.TIMES.MULTIPLE_CHOICE);
                break;
        }
    }

    [2](input) {
        switch (input.action) {
            case "join":
                this.model.addPlayer(input.data.name);
                this.broadcast();
                break;
            case "continue":
            case "expire":
                this.model.getRound().setRevealState();
                this.updateMCScores();
                this.updateState(3, {bets : this.playersData});
                break;
            case "update":
                let name = input.player;
                let index = parseInt(input.data.index);
                if (input.data.checked){
                    let value = parseInt(input.data.value);
                    if (value < 0) value = 0;
                    this.playersData[name].bets[index] = value;
                } else {
                    this.playersData[name].bets[index] = "";
                }
                break;
        }
    }

    [3](input) {
        switch (input.action) {
            case "join":
                this.model.addPlayer(input.data.name);
                this.broadcast();
                break;
            case "continue":
                this.model.nextRound();
                this.startRound();
                break;
        }
    }

    [4](input) { // waiting for player to pick question
        switch (input.action) {
            case "join":
                this.model.addPlayer(input.data.name);
                this.broadcast();
                break;
            case "select":
                if (input.player !== "@HOST" && this.model.activePlayer.name !== input.player) return;
                if (!this.model.getRound().isSpent(input.data.col, input.data.row)) {
                    this.model.getRound().setQuestionState(input.data.col, input.data.row);
                    this.updateState(5);
                }
                this.notify("@HOST", {
                    action: "provide_answer",
                    'id-hash': crypto.randomBytes(8).toString('hex'),
                    'time-stamp': new Date(),
                    data: {
                        answer: this.model.getRound().getAnswer()
                    }
                });
                break;
        }
    }

    [5](input) { // waiting for host to read question and click continue
        switch (input.action) {
            case "join":
                this.model.addPlayer(input.data.name);
                this.broadcast();
                break;
            case "continue":
                if (input.player !== "@HOST") return;
                this.model.getRound().setSpent();
                this.updateState(6);
                this.timer.start(Timer.TIMES.ANSWER);
                break;
            case "back":
                this.updateState(4);
                break;
        }
    }

    [6](input) { // timer not expired awaiting answer
        switch (input.action) {
            case "join":
                this.model.addPlayer(input.data.name);
                this.broadcast();
                break;
            case "reject":
                this.model.getRound().setPlayerSpent();
                this.model.getRound().clearCurrentPlayer();
                this.timer.stop();
                if (this.model.getRound().countUnspentPlayers() > 0){
                    this.timer.start(Timer.TIMES.BUZZ);
                    this.updateState(7);
                } else {
                    this.model.getRound().setRevealState();
                    this.updateState(9);
                }
                break;
            case "expire":
                break;
            case "accept":
                let currentPlayer = this.model.getRound().getCurrentPlayer();
                console.log(currentPlayer);
                if (!currentPlayer) return;
                this.model.getPlayer(currentPlayer).score += this.model.getRound().getValue();
                this.model.getRound().setRevealState();
                this.timer.stop();
                this.updateState(9);
                break;
        }
    }

    [7](input) { // waiting for buzzer
        switch (input.action) {
            case "join":
                this.model.addPlayer(input.data.name);
                this.broadcast();
                break;
            case "buzz":
                if (this.model.getRound().hasPlayer(input.player)) {
                    this.model.getRound().setCurrentPlayer(input.player);
                    this.timer.start(Timer.TIMES.ANSWER);
                    this.updateState(8);
                }
                break;
            case "expire":
                this.broadcast({action: "stop_timer"});
                this.model.getRound().setRevealState();
                this.updateState(9);
                break;
        }
    }

    [8](input) { // awaiting answer to jeopardy question
        switch (input.action) {
            case "join":
                this.model.addPlayer(input.data.name);
                this.broadcast();
                break;
            case "reject":
                let currentPlayer = this.model.getRound().getCurrentPlayer();
                let player = this.model.getPlayer(currentPlayer);
                player.score -= (this.model.getRound().getValue() / 2);
                this.timer.stop();

                this.model.getRound().setPlayerSpent();
                this.model.getRound().clearCurrentPlayer();

                if (this.model.getRound().countUnspentPlayers() > 0){
                    this.timer.start(Timer.TIMES.BUZZ);
                    this.updateState(7);
                } else {
                    this.model.getRound().setRevealState();
                    this.updateState(9);
                }
                break;
            case "expire":
                break;
            case "accept":
                this.model.getPlayer(this.model.getRound().getCurrentPlayer()).score += this.model.getRound().getValue();
                this.model.getRound().setRevealState();
                this.timer.stop();
                this.updateState(9);
                break;
        }
    }

    [9](input) { // awaiting answer
        switch (input.action) {
            case "join":
                this.model.addPlayer(input.data.name);
                this.broadcast();
                break;
            case "continue":
                if (this.model.getRound().hasUnspent()) {
                    this.model.nextActivePlayer();
                    this.model.getRound().setBoardState();
                    this.model.getRound().resetSpentAndCurrentPlayers();
                    this.updateState(4);
                } else {
                    this.model.nextRound();
                    this.startRound();
                }
                break;
        }
    }

    [10](input) { // game over
        switch (input.action) {
            /* no accepted inputs */
        }
    }
}


export {
    Game, Timer
};