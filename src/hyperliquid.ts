import { FordefiWeb3Provider, EvmChainId } from '@fordefi/web3-provider';
import { ethers } from 'ethers';
import * as hl from "@nktkas/hyperliquid";
import { FordefiProviderConfig } from '@fordefi/web3-provider';
import dotenv from 'dotenv';
import fs from 'fs'

dotenv.config();

// Configure the Fordefi provider
const fordefiConfig: FordefiProviderConfig = {
  chainId: EvmChainId.NUMBER_42161, // Arbitrum
  address: '0x8BFCF9e2764BC84DE4BBd0a0f5AAF19F47027A73', // The Fordefi EVM Vault that will sign the message
  apiUserToken: process.env.FORDEFI_API_USER_TOKEN ?? (() => { throw new Error('FORDEFI_API_USER_TOKEN is not set'); })(), 
  apiPayloadSignKey: fs.readFileSync('./fordefi_secret/private.pem', 'utf8') ?? (() => { throw new Error('PEM_PRIVATE_KEY is not set'); })(),
  rpcUrl: 'https://arbitrum-one-rpc.publicnode.com',
  skipPrediction: false 
};

// Create a singleton provider
let fordefiProvider: FordefiWeb3Provider | null = null;
let provider: ethers.providers.Web3Provider | null = null;

// Function to get or create the provider
function getProvider() {
    if (!fordefiProvider) {
        fordefiProvider = new FordefiWeb3Provider(fordefiConfig);
        provider = new ethers.providers.Web3Provider(fordefiProvider);
        
        // Set up connection event handling once
        provider.on('connect', (result: any) => {
            console.log(`Connected to chain: ${result}`);
        });
        
        provider.on('disconnect', (error: any) => {
            console.log(`Provider disconnected: ${error}`);
            // Optional: You could implement reconnection logic here
        });
    }
    
    return provider;
}

async function main() {
    try {
        // Get the singleton provider
        const provider = getProvider();
        if (!provider) {
            throw new Error("Failed to initialize provider");
        }

        const transport = new hl.HttpTransport();
        // This custom signer ensures we're using the correct chainId to construct the message we'll sign
        const customSigner = {
            getAddress: async () => fordefiConfig.address,
            signTypedData: async (domain:any, types:any, value:any) => {
                const modifiedDomain = {
                    ...domain,
                    chainId: fordefiConfig.chainId
                };
                return provider.getSigner()._signTypedData(
                    modifiedDomain,
                    types,
                    value
                );
            }
        };

        // Create a Hyperliquid wallet client using the Fordefi provider
        const client = new hl.WalletClient({ 
            wallet: customSigner, 
            transport 
        });
        console.log("Wallet client created successfully");

        // Account clearinghouse state
        const result = await client.withdraw3({
            destination: fordefiConfig.address, // Withdraw funds to your address
            amount: "6", // 6 USD
        });
        console.log("Withdrawal successful:", result);
        
    } catch (error: any) {
        // Simple error handler that provides useful information
        const errorMessage = error.message || String(error);
        
        if (errorMessage.includes("Insufficient balance")) {
            console.error("ERROR: Not enough funds for withdrawal");
        } else if (errorMessage.includes("provider") || errorMessage.includes("connect")) {
            console.error("ERROR: Provider connection issue");
        } else {
            console.error("ERROR:", errorMessage);
        }
    }
}

main().catch(error => {
    console.error("Unhandled error:", error);
});
