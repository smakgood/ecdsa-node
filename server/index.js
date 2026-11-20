const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;
const keccak256 = require("ethereum-cryptography/keccak.js").keccak256;
const secp256k1 = require("ethereum-cryptography/secp256k1").secp256k1;

app.use(cors());
app.use(express.json());

const balances = {
  "02e9d30723f3603d19b548167835befa78c00fd0786d7ec47f6e7d1324007cb30a": 100,
  "022ec48b14c651870bae4c92d7d27e6d4614a5567620930cea153f9387961ff0b0": 50,
  "02a4a8b1d9e655270d3cf6b58f7d7d4e6c9b40b7f4c269584a10251fa2aa96578e": 75,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  const transaction = req.body;
  console.log(transaction);
  const { sender, recipient, amount, hexSign } = transaction;

  // Та же строка, что на клиенте: из неё снова считаем хеш и сверяем с подписью.
  // sender здесь — публичный ключ отправителя (адрес кошелька).
  const message = `${sender}${amount}${recipient}`;
  const hash = keccak256(Uint8Array.from(message));
  const isSigned = secp256k1.verify(hexSign, hash, sender);
  console.log("Is signed: ", isSigned);
  if (isSigned) {
    setInitialBalance(sender);
    setInitialBalance(recipient);

    if (balances[sender] < amount) {
      res.status(400).send({ message: "Not enough funds!" });
    } else {
      balances[sender] -= amount;
      balances[recipient] += amount;
      res.send({ balance: balances[sender] });
    }
  } else {
    res.status(400).send({ message: "Not signed!" });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}