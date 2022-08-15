import algosdk, { assignGroupID } from "algosdk";
import ConstantProductAMM from "./constantproductamm_client";
import { getAccounts, SandboxAccount } from "./sandbox/accounts";
import { getAlgodClient } from "./sandbox/clients";

(async function () {
  const client = getAlgodClient();
  const acct = (await getAccounts()).pop();

  // Create the app client
  const appClient = new ConstantProductAMM({
    client: client, signer: acct.signer, sender: acct.addr,
  });

  // Deploy the app on chain
  const [appId, appAddr, txId] = await appClient.create();
  console.log(`Created app ${appId} with address ${appAddr} in tx ${txId}`);

  // Create the assets the pool will use
  const [assetA, assetB] = await createAssets(client, acct);
  console.log(`Created assets ${assetA} and ${assetB}`);

  // Setup seed transaction
  const sp = await appClient.client.getTransactionParams().do();
  const seedTxn = {
    txn: algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: acct.addr,
      suggestedParams: sp,
      to: appAddr,
      amount: 1_000_000,
    }),
    signer: acct.signer,
  };

  // Call bootstrap method for app we just created
  const bootstrapResult = await appClient.bootstrap(seedTxn, assetA, assetB);

  // Log pool token id
  const poolToken: number = Number(bootstrapResult.returnValue as bigint);
  console.log(typeof(poolToken))
  console.log(`Created pool token: ${poolToken}`);

  // Opt into pool token
  await client.sendRawTransaction(algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: acct.addr,
    suggestedParams: sp,
    to: acct.addr,
    amount: 0,
    assetIndex: poolToken
  }).signTxn(acct.privateKey)).do()
  console.log("Opted in")


  const axfer = {
    txn: algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: acct.addr, suggestedParams: sp, to: appAddr, amount: 1000, assetIndex: assetA 
    }),
    signer: acct.signer
  }

  const bxfer = {
    txn: algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: acct.addr, suggestedParams: sp, to: appAddr, amount: 10000, assetIndex: assetB
    }),
    signer: acct.signer
  }

  console.log("Minting pool token")
  const mintResult = await appClient.mint(axfer, bxfer, poolToken, assetA, assetB)
  console.log(`Mint confirmed in round: ${mintResult.txInfo['confirmed-round']}`)

})();

async function createAssets(
  client: algosdk.Algodv2,
  acct: SandboxAccount
): Promise<[number, number]> {
  const sp = await client.getTransactionParams().do();
  const a_create = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    from: acct.addr,
    suggestedParams: sp,
    unitName: "a",
    assetName: "Asset A",
    total: 1000000,
    decimals: 0,
    defaultFrozen: false,
  });

  const b_create = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    from: acct.addr,
    suggestedParams: sp,
    unitName: "b",
    assetName: "Asset B",
    total: 1000000,
    decimals: 0,
    defaultFrozen: false,
  });

  const grouped = assignGroupID([a_create, b_create]);

  await client
    .sendRawTransaction(
      grouped.map((txn) => {
        return txn.signTxn(acct.privateKey);
      })
    )
    .do();

  const a_result = await algosdk.waitForConfirmation(
    client,
    grouped[0].txID(),
    2
  );
  const b_result = await algosdk.waitForConfirmation(
    client,
    grouped[1].txID(),
    2
  );

  return [a_result["asset-index"], b_result["asset-index"]];
}
