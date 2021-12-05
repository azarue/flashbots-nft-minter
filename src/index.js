
// configure environment variables
const dotenv = require('dotenv');
//dotenv.config({ path: 'config/.env.wasteGas' });
dotenv.config({ path: 'config/.env.wasteGas' });
// load config file
const { ethers, flashbots, nft, gas } = require("./config");

// load ethers library 
const { providers, Wallet, BigNumber } = require("ethers");

// Flashbots relay is not an ehterum service, 
// it has different API endpoints that aren't covered by ethers.js 
// with proper typing and firnedly return types.
// We have our own budnle provider, this is a flashbot plugin  
// to the thers system that allows you to communicate with the flashbots relay in a deverloper friendly way
const { FlashbotsBundleProvider} = require("@flashbots/ethers-provider-bundle");

/// etherum porvider. interface to communicate with etherium
// Network id of goerli is 5
const provider = new providers.InfuraProvider(ethers.chainId);

// configure big number
const GWEI = BigNumber.from(10).pow(9);
const ETHER = BigNumber.from(10).pow(18);

const sendBundle = async (flashbotsProvider) => {

	// get the next block number
	const targetBlockNumber = (await provider.getBlockNumber()) + 1;
	console.log(`Current block number is ${targetBlockNumber}`);

	const bundleSubmitResponse = await flashbotsProvider.sendBundle(
		[
			{
				transaction: {
					chainId: ethers.chainId,
					type: 2, // ip1559 transaction
					value: ETHER.div(100).mul(nft.value), // 0.03
					data: nft.data,
					// gasLimit: gas.gasLimit, // remove this to force estimateGas by flashbots.
					maxFeePerGas: GWEI.mul(gas.maxFeePerGas),
					maxPriorityFeePerGas: GWEI.mul(gas.maxPriorityFeePerGas),
					to: nft.address,
				},
				signer: new Wallet(nft.minterPrivateKey, provider),
			},
		],
		targetBlockNumber
	);
	console.log(`Bundle sent for block ${targetBlockNumber}`);
	const response = await bundleSubmitResponse.wait();

	if (response !== 0) {
		console.log(`Bundle not included with response: ${response}, retrying...`);
		sendBundle(flashbotsProvider);
	} else {
		console.log("Bundle executed successfully");
	}
};

const main = async () => {
	const flashbotsProvider =
		await FlashbotsBundleProvider.create(
			provider,
			new Wallet(flashbots.authSignerPrivateKey),
			flashbots.relayEndpoint
		);

	sendBundle(flashbotsProvider);
};

// const main = async () => {
//   const flashbotsProvider = await FlashbotsBundleProvider.create(
//     provider,
//     new Wallet(flashbots.authSignerPrivateKey),
//     flashbots.relayEndpoint
//   );

//   sendBundle(flashbotsProvider);
// };


main();

