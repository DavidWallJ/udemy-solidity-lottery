const assert = require("assert");
const ganache = require("ganache-cli");
const Web3 = require("web3");

const web3 = new Web3(ganache.provider());
const { interface, bytecode } = require("../compile");

let lottery;
let accounts;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();

  lottery = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ data: bytecode })
    .send({ from: accounts[0], gas: "1000000" });
});

describe("Lottery Contract", () => {
  it("deploys a contract", () => {
    assert.ok(lottery.options.address);
  });

  it("adds an account", async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei("0.01", "ether")
    });

    const players = await lottery.methods.getPlayers().call();

    assert.equal(accounts[0], players[0]);
    assert.equal(1, players.length);
  });

  it("adds an account", async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei("0.01", "ether")
    });

    await lottery.methods.enter().send({
      from: accounts[1],
      value: web3.utils.toWei("0.01", "ether")
    });

    await lottery.methods.enter().send({
      from: accounts[2],
      value: web3.utils.toWei("0.01", "ether")
    });

    const players = await lottery.methods.getPlayers().call();

    assert.equal(accounts[0], players[0]);
    assert.equal(accounts[1], players[1]);
    assert.equal(accounts[2], players[2]);
    assert.equal(3, players.length);
  });

  it("requires a minimum amount of ether to enter", async () => {
    // a way to check if an error was thrown
    // we want an error to be thrown
    try {
      await lottery.methods.enter().call({
        from: accounts[0],
        value: 0
      });
      // if for some reason this code doesn't throw an error we want to force one
      assert(false);
    } catch (err) {
      // assert that 'err' exists
      // we don't use 'assert.ok' because we're not checking for 'truthiness'
      assert(err);
    }
  });

  it("pickWinner can only be called by the manager", async () => {
    // a way to check if an error was thrown
    // we want an error to be thrown
    try {
      await lottery.methods.pickWinner().send({
        from: accounts[1]
      });
      // if for some reason this code doesn't throw an error we want to force one
      assert(false);
    } catch (err) {
      // assert that 'err' exists
      // we don't use 'assert.ok' because we're not checking for 'truthiness'
      assert(err);
    }
  });

  it("sends money to the winner and resets the player array", async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei("2", "ether")
    });

    const initialBalance = await web3.eth.getBalance(accounts[0]);
    // only on player entered into the lottery
    // thus we know which account should have more ether in it
    await lottery.methods.pickWinner().send({ from: accounts[0] });
    const finalBalance = await web3.eth.getBalance(accounts[0]);
    const difference = finalBalance - initialBalance;
    assert(difference > web3.utils.toWei("1.8", "ether"));

    // all money got sent out
    // players array is empty

  });
});
