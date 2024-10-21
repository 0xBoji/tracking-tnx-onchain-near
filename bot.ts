import * as nearAPI from "near-api-js";

const NEAR_RPC_API = 'https://rpc.testnet.near.org';
const TRACKED_ADDRESS = '121airdrop.testnet';
const USDT_ADDRESS = 'usdt.fakes.testnet';
const provider = new nearAPI.providers.JsonRpcProvider({url: NEAR_RPC_API});

let latestBlockHeight = 0;

const processTransaction = (transaction: any) => {
	if (
	  transaction.signer_id === TRACKED_ADDRESS ||
	  transaction.receiver_id === TRACKED_ADDRESS ||
	  transaction.receiver_id === USDT_ADDRESS
	) {
	  console.log('Transaction detected for tracked address or USDT transfer:');
	  console.log(`- Signer: ${transaction.signer_id}`);
	  console.log(`- Receiver: ${transaction.receiver_id}`);
	  console.log(`- Actions: ${JSON.stringify(transaction.actions)}`);
	  
	  // Add USDT transfer detection
	  if (transaction.receiver_id === USDT_ADDRESS) {
		const action = transaction.actions[0];
		if (action.FunctionCall && action.FunctionCall.method_name === 'ft_transfer') {
		  const args = JSON.parse(Buffer.from(action.FunctionCall.args, 'base64').toString());
		  console.log('USDT Transfer detected:');
		  console.log(`- From: ${transaction.signer_id}`);
		  console.log(`- To: ${args.receiver_id}`);
		  console.log(`- Amount: ${args.amount} USDT`);
		}
	  }
	  
	  console.log('---');
	}
};
setInterval(async () => {
  try {
    const latestBlock = await provider.block({ finality: 'final' });
    const height = latestBlock.header.height;
    
    if (height === latestBlockHeight) {
      return;
    }

    latestBlockHeight = height;
    console.log(`Processing block ${latestBlockHeight}`);

    const chunks = latestBlock.chunks;

    for (const chunk of chunks) {
      const chunkDetails = await provider.chunk(chunk.chunk_hash);
      const transactions = chunkDetails.transactions;
      
      if (transactions.length > 0) {
        for (const transaction of transactions) {
          processTransaction(transaction);
        }
      }
    }
  } catch (error) {
    console.error('Error Processing Block:', error);
  }
}, 500);