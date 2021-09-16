const path = require("path");
const express = require("express");
const app = express();
const Web3 = require("web3");
var web3 = new Web3(
  new Web3.providers.HttpProvider("https://serious-panther-67.loca.lt/")
);
const Moralis = require("moralis");
const got = require("got");
var request = require("request");
Moralis.initialize("1Z8Bozsfs2I6IKQvfmDQfW9VmvHNUk2kwJKPprwG");
Moralis.serverURL =
  "http://2be0-2409-4062-2e01-c1c8-e182-d64f-b2bc-6886.ngrok.io ";
class TransactionChecker {
  web3;
  web3ws;
  account;
  subscription;

  constructor(projectId, account) {
    this.web3ws = new Web3(
      new Web3.providers.WebsocketProvider(
        "wss://ropsten.infura.io/ws/v3/" + projectId
      )
    );
    this.web3 = new Web3(
      new Web3.providers.HttpProvider(
        "https://ropsten.infura.io/v3/" + projectId
      )
    );
    this.account = account;
  }
  subscribe(topic) {
    this.subscription = this.web3ws.eth.subscribe(topic, (err, res) => {
      if (err) console.error(err);
    });
  }

  watchTransactions() {
    console.log("Watching all pending transactions...");
    this.subscription.on("data", (txHash) => {
      setTimeout(async () => {
        try {
          let tx = await this.web3.eth.getTransaction(txHash);
          if (tx != null) {
            if (this.account === tx.to) {
              console.log({
                address: tx.from,
                value: this.web3.utils.fromWei(tx.value, "ether"),
                timestamp: new Date()
              });
            }
          }
        } catch (err) {
          console.error(err);
        }
      }, 1000);
    });
  }
}
async function getBlockNumber() {
  let rt = await web3.eth.getBlockNumber();
  return rt;
}
let txChecker = new TransactionChecker(
  "09ef8655dbd645ad9083dab20b49fede",
  "0x59fb42Aae4122B1CCAc10B737BDd90F8E3C07FaC"
);
txChecker.subscribe("pendingTransactions");

//create a server object:
app.listen(3000, () => {
  console.log("Application started and Listening on port 3000");
});
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");

const client_cred_access_token = "fakeToken";
app.use("/static", express.static(__dirname + "/static"));

async function file_get_contents(uri) {
  let res = await fetch(uri),
    ret = await res.text();
  return ret;
}

const api_key = "AVU8I71ZTPSBYBP63CUW1X88UA2KK7I7RM";

app.get("/", (req, res) => {
  console.log(web3.utils.hexToAscii("0x57cb2fc4"));
  function numberWithCommas(x) {
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
  request(
    "https://api.bscscan.com/api?module=stats&action=bnbprice&apikey=" +
      api_key,
    function (error, response, body) {
      if (!error && response.statusCode === 200) {
        var BNBprice = JSON.parse(body);
        request(
          "https://api.bscscan.com/api?module=stats&action=bnbsupply&apikey=" +
            api_key,
          async function (error, response, body) {
            if (!error && response.statusCode === 200) {
              var marketCap =
                (JSON.parse(body).result / Math.pow(10, 18)) *
                BNBprice.result.ethusd;
              var validators = 0;
              const context = {
                token: "secret"
              };
              const axios = require("axios").default;
              const response = await axios(
                "https://api.bscscan.com/api?module=stats&action=validators&apikey=" +
                  api_key
              );
              var re = JSON.parse(JSON.stringify(response.data));
              var result = re.result;
              result.forEach((element) => {
                validators = validators + 1;
              });

              var block = await getBlockNumber();
              res.render(__dirname + "/layouts/home.html", {
                BNBprice: BNBprice.result,
                marketCap: numberWithCommas(Math.round(marketCap)),
                block: block,
                validators: validators,
                rawCap: numberWithCommas(
                  Math.round(JSON.parse(body).result / Math.pow(10, 18))
                )
              });
            }
          }
        );
      } else {
        return 0;
      }
    }
  );

  // var bnbp = document.querySelector("#bnbPRICE");
  // console.log(bnbp);
});
async function alloc() {
  var ball = await got(
    "https://api.bscscan.com/api?module=stats&action=bnbprice&apikey=" + api_key
  );
  return ball.body;
}
async function getAccountTransactions(
  accAddress,
  startBlockNumber,
  endBlockNumber,
  maxResults = 1
) {
  var array = [];
  for (var i = startBlockNumber; i <= endBlockNumber; i++) {
    var block = await web3.eth.getBlock(i, true);

    if (block != null && block.transactions != null) {
      block.transactions.forEach(function (e) {
        if (maxResults != array.length) {
          var from = e.from;
          var to = e.to;
          if (
            accAddress.toLowerCase() === "*" ||
            accAddress.toLowerCase() === from.toLowerCase() ||
            accAddress.toLowerCase() === to.toLowerCase()
          ) {
            array.push(e.hash);
          }
        }
      });
    }
  }

  return array;
}
app.get("/api/transactions/:addr", (req, res) => {
  async function main() {
    const addr = req.params.addr;
    var startPoint = req.query.startPoint;
    var maxResult = req.query.max_result;
    var bloc = await web3.eth.getBlockNumber();

    if (startPoint == null) {
      startPoint = 0;
    }
    if (maxResult == null) {
      maxResult = 10;
    }
    var txs = await getAccountTransactions(addr, startPoint, bloc, maxResult);
    res.send(txs);
  }
  main();
});
app.get("/address/:addr", (req, res) => {
  const addr = req.params.addr;
  const isValid = web3.utils.isAddress(req.params.addr);
  if (isValid === true) {
    async function getBalance(addr) {
      const a = await web3.eth.getBalance(addr);
      const balance = web3.utils.fromWei(a);
      var bal = [];

      var bat = await alloc();
      var batt = JSON.parse(bat);
      var usd = batt.result.ethusd;
      batt = balance * usd;

      res.render(__dirname + "/layouts/addr.html", {
        bat: parseFloat(batt).toFixed(2),
        usd: parseFloat(usd).toFixed(2),
        bal: balance,
        addr: addr
      });
    }
    getBalance(addr);
  }
});
