import { useState } from "react";
import server from "./server";
import { keccak256 } from "ethereum-cryptography/keccak.js";
import * as secp from "ethereum-cryptography/secp256k1";

function Transfer({ address, setBalance, privateKey }) {
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const setValue = (setter) => (evt) => setter(evt.target.value);

  async function transfer(evt) {
    evt.preventDefault();
    const amount = parseInt(sendAmount);

    // Подписываем всю транзакцию целиком, а не только адрес отправителя:
    // при подмене суммы или получателя на сервере проверка подписи не пройдёт.
    const message = `${address}${amount}${recipient}`;
    const hash = keccak256(Uint8Array.from(message));

    // Подпись создаётся только владельцем privateKey; в запрос уходит открытый текст + hexSign.
    const signature = secp.secp256k1.sign(hash, privateKey);
    const transaction = {
      sender: address,
      amount,
      recipient: recipient,
      hexSign: signature.toCompactHex(),
    };
    console.log("trx: ", transaction);

    try {
      const {
        data: { balance },
      } = await server.post(`send`, transaction);
      setBalance(balance);
    } catch (ex) {
      alert(ex.response.data.message);
    }
  }

  return (
    <form className="container transfer" onSubmit={transfer}>
      <h1>Send Transaction</h1>

      <label>
        Send Amount
        <input
          placeholder="1, 2, 3..."
          value={sendAmount}
          onChange={setValue(setSendAmount)}
        ></input>
      </label>

      <label>
        Recipient
        <input
          placeholder="Type an address, for example: 0x2"
          value={recipient}
          onChange={setValue(setRecipient)}
        ></input>
      </label>

      <input type="submit" className="button" value="Transfer" />
    </form>
  );
}

export default Transfer;