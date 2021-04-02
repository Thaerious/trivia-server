import assert from 'assert';
import GameManager from "../src/server/GameManager.js";
import GameModel from "../src/server/GameModel.js";
import {Game} from "../src/server/Game.js";
import fs from "fs";

const file = fs.readFileSync('./test/data/test-data-00.json');
const data = JSON.parse(file);
let gameModel = new GameModel(data);
let game = new Game(gameModel);

describe('class GameManager', function () {
    let gameManager = new GameManager();

    describe('#connect()', function () {
        it('has database', async function () {
            await gameManager.connect('./assets/trivia.db');
        });
        it('missing database, creates it', async function () {
            await gameManager.connect('./assets/test.db');
            assert.equal(await fs.existsSync('./assets/test.db'), true);
        });
    });

    describe('#clearAll()', function () {
        it("doesn't throw error", async function () {
           await gameManager.clearAll();
        });
    });

    describe(`#addGame()`, function () {
        it("returns true is game added", async function () {
            let r = await gameManager.addGame({userId : "test-user"}, game);
            assert.equal(r, true);
        });
        it("returns false is game already exists", async function () {
            let r = await gameManager.addGame({userId : "test-user"}, game);
            assert.equal(r, false);
        });
    });

    describe(`#hasGame()`, function () {
        it(`has game`, async function () {
            let r = await gameManager.hasGame({userId : "test-user"});
            assert.equal(r, true);
        });
        it(`doesn't have game`, async function () {
            let r = await gameManager.hasGame({userId : "test-user-not"});
            assert.equal(r, false);
        });
    });

    describe(`#listGames()`, function () {
        it(`one game`, async function () {
            let r = await gameManager.listGames();
            assert.equal(r.length, 1);
        });
    });

    describe(`#getGame()`, function () {
        it(`has game`, async function () {
            let r = await gameManager.getGame({userId : "test-user"});
            assert.equal(r, JSON.stringify(game));
        });
    });

    describe(`#deleteGame()`, function () {
        it(`is deleted`, async function () {
            await gameManager.deleteGame({userId : "test-user"});
            let r = await gameManager.hasGame({userId : "test-user"});
            assert.equal(r, false);
        });
    });

    describe(`#getHashes()`, function () {
        it(`has values`, async function () {
            let r = await gameManager.getHashes({userId : "test-user"});
            assert.notEqual(r, undefined);
        });
        it(`does not have values`, async function () {
            let r = await gameManager.getHashes({userId : "nota-user"});
            assert.equal(r, undefined);
        });
    });
});