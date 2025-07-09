"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const anchor = __importStar(require("@coral-xyz/anchor"));
const anchor_1 = require("@coral-xyz/anchor");
const web3_js_1 = require("@solana/web3.js"); // Import SendTransactionError
const chai_1 = require("chai");
const spl_token_1 = require("@solana/spl-token");
/**********************************************************************************/
/* Helpers */
/**********************************************************************************/
function create_admin_config(idConfig, payer, program, backend, projectWallet) {
    return __awaiter(this, void 0, void 0, function* () {
        const [adminConfig, _] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from('admin-cf'), idConfig.toArrayLike(Buffer, "le", 8)], program.programId);
        yield program.methods
            .createAdminConfig(idConfig, backend.publicKey, projectWallet.publicKey)
            .accounts({
            adminConfig,
        })
            .rpc();
        const adminConfigAccount = yield program.account.adminConfig.fetch(adminConfig);
        (0, chai_1.expect)(adminConfigAccount.idConfig.toNumber()).to.equal(idConfig.toNumber());
        (0, chai_1.expect)(adminConfigAccount.admin.toBase58()).to.equal(payer.publicKey.toBase58());
        (0, chai_1.expect)(adminConfigAccount.backend.toBase58()).to.equal(backend.publicKey.toBase58());
        (0, chai_1.expect)(adminConfigAccount.projectWallet.toBase58()).to.equal(projectWallet.publicKey.toBase58());
        (0, chai_1.expect)(adminConfigAccount.newAdmin).to.equal(null);
        return adminConfig;
    });
}
function create_campaign_database(payer, idConfig, idDb, program, adminConfig) {
    return __awaiter(this, void 0, void 0, function* () {
        const [campaignDatabase] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from('campg-db'), idDb.toArrayLike(Buffer, "le", 8)], program.programId);
        const serviceFees = [{ lamportFee: 1000, tokenFeePercentage: 10 }];
        //anchor automatically fills the user of Account type Signer with the provider and the SystemProgram
        yield program.methods
            .createCampaignDatabase(idConfig, idDb, serviceFees)
            .accounts({
            adminConfig,
        })
            .rpc();
        return campaignDatabase;
    });
}
function create_project_wallet(provider, payer, projectWallet) {
    return __awaiter(this, void 0, void 0, function* () {
        const tx = new anchor_1.web3.Transaction().add(web3_js_1.SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: projectWallet.publicKey,
            space: 0,
            lamports: yield provider.connection.getMinimumBalanceForRentExemption(0),
            programId: web3_js_1.SystemProgram.programId,
        }));
        yield provider.sendAndConfirm(tx, [projectWallet]);
    });
}
describe('create_campaign', () => {
    // Configure the client to use the local cluster.
    const keypair = new web3_js_1.Keypair();
    const projectWallet = new web3_js_1.Keypair();
    const backend = new web3_js_1.Keypair();
    const provider = anchor.AnchorProvider.local();
    anchor.setProvider(provider);
    const payer = provider.wallet;
    const program = anchor.workspace.ShilltokCampaignProgram;
    const programHelperToken = anchor.workspace.TransferTokens;
    const idDb = new anchor_1.BN(123456792);
    const idConfig = new anchor_1.BN(987665243);
    create_project_wallet(provider, payer, projectWallet);
    const metadata = {
        name: 'Solana Gold',
        symbol: 'GOLDSOL',
        uri: 'https://raw.githubusercontent.com/solana-developers/program-examples/new-examples/tokens/tokens/.assets/spl-token.json',
    };
    // Generate new keypair to use as address for mint account.
    const mintKeypair = new web3_js_1.Keypair();
    // Generate new keypair to use as address for recipient wallet.
    const recipient = new web3_js_1.Keypair();
    // Derive the associated token address account for the mint and payer.
    const senderTokenAddress = (0, spl_token_1.getAssociatedTokenAddressSync)(mintKeypair.publicKey, payer.publicKey);
    it('Create an SPL Token!', () => __awaiter(void 0, void 0, void 0, function* () {
        const transactionSignature = yield programHelperToken.methods
            .createToken(metadata.name, metadata.symbol, metadata.uri)
            .accounts({
            payer: payer.publicKey,
            mintAccount: mintKeypair.publicKey,
        })
            .signers([mintKeypair])
            .rpc();
        console.log('Success!');
        console.log(`   Mint Address: ${mintKeypair.publicKey}`);
        console.log(`   Transaction Signature: ${transactionSignature}`);
    }));
    it('Mint tokens!', () => __awaiter(void 0, void 0, void 0, function* () {
        // Amount of tokens to mint.
        const amount = new anchor.BN(200);
        // Mint the tokens to the associated token account.
        const transactionSignature = yield programHelperToken.methods
            .mintToken(amount)
            .accounts({
            mintAuthority: payer.publicKey,
            recipient: payer.publicKey,
            mintAccount: mintKeypair.publicKey,
            associatedTokenAccount: senderTokenAddress,
        })
            .rpc();
        console.log('Success!');
        console.log(`   Associated Token Account Address: ${senderTokenAddress}`);
        console.log(`   Transaction Signature: ${transactionSignature}`);
    }));
    it('create_campaign_success', () => __awaiter(void 0, void 0, void 0, function* () {
        const adminConfig = yield create_admin_config(idConfig, payer, program, backend, projectWallet);
        const campaignDatabase = yield create_campaign_database(payer, idConfig, idDb, program, adminConfig);
        const campaignDatabaseAccount = yield program.account.campaignDatabase.fetch(campaignDatabase);
        if (!campaignDatabaseAccount) {
            throw new Error("Campaign Database Account does not exist!");
        }
        const [campaignInfo] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("cpn_info"), campaignDatabaseAccount.id.toArrayLike(Buffer, "le", 8), campaignDatabaseAccount.counter.toArrayLike(Buffer, "le", 8)], program.programId);
        const params = {
            idDb: new anchor_1.BN(campaignDatabaseAccount.id),
            campaignCounter: new anchor_1.BN(campaignDatabaseAccount.counter),
            name: "testUno",
            keywords: ["test1", "test2", "test3"],
            beginTimestamp: new anchor_1.BN(Math.floor(Date.now() / 1000) + 3600),
            endTimestamp: new anchor_1.BN(Math.floor(Date.now() / 1000) + 86400),
            tokenAmount: new anchor_1.BN(120),
            serviceFeeIndex: new anchor_1.BN(0),
            tokenName: "MyToken",
            tokenSymbol: "MTO",
            tokenDecimals: 9,
            scoreMinimal: new anchor_1.BN(0),
        };
        let campaignInitAccounts = {
            user: payer.publicKey,
            campaignAccount: campaignInfo,
            campaignDatabaseAccount: campaignDatabase,
            systemProgram: web3_js_1.SystemProgram.programId,
        };
        yield program.methods
            .initCampaign(params.idDb, params.campaignCounter, params.name, params.keywords, params.beginTimestamp, params.endTimestamp, params.scoreMinimal)
            .accounts(campaignInitAccounts)
            .signers([payer.payer])
            .rpc(); // <--- Get transaction instead of `.rpc()`
        // Initialize handle
        const [campaignHandles] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("cpn_hndl"), campaignDatabaseAccount.id.toArrayLike(Buffer, "le", 8), campaignDatabaseAccount.counter.toArrayLike(Buffer, "le", 8)], program.programId);
        let campaignInitHandlesAccount = {
            user: payer.publicKey,
            campaign_handles_account: campaignHandles,
            campaignAccount: campaignInfo,
            systemProgram: web3_js_1.SystemProgram.programId,
        };
        yield program.methods
            .initCampaignHandles(params.idDb, params.campaignCounter)
            .accounts(campaignInitHandlesAccount)
            .signers([payer.payer])
            .rpc();
        // Initialize assets
        const [campaignAssets] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("cpn_asst"), campaignDatabaseAccount.id.toArrayLike(Buffer, "le", 8), campaignDatabaseAccount.counter.toArrayLike(Buffer, "le", 8)], program.programId);
        let campaignInitAssetsAccount = {
            user: payer.publicKey,
            campaign_assets_account: campaignAssets,
            campaignAccount: campaignInfo,
            systemProgram: web3_js_1.SystemProgram.programId,
        };
        yield program.methods
            .initCampaignAssets(params.idDb, params.campaignCounter)
            .accounts(campaignInitAssetsAccount)
            .signers([payer.payer])
            .rpc();
        // Open campaign
        const recipientTokenAddress = (0, spl_token_1.getAssociatedTokenAddressSync)(mintKeypair.publicKey, campaignAssets, true);
        const recipientFeeAccount = (0, spl_token_1.getAssociatedTokenAddressSync)(mintKeypair.publicKey, projectWallet.publicKey);
        let openCampaignAccounts = {
            user: payer.publicKey,
            campaignAssetsAccount: campaignAssets,
            campaignAccount: campaignInfo,
            campaignDatabaseAccount: campaignDatabase,
            projectWallet: projectWallet.publicKey,
            mintAccount: mintKeypair.publicKey,
            senderTokenAccount: senderTokenAddress,
            recipientTokenAccount: recipientTokenAddress,
            recipientFeeAccount: recipientFeeAccount,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            associatedTokenProgram: spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: web3_js_1.SystemProgram.programId,
        };
        yield program.methods
            .openCampaign(params.idDb, params.campaignCounter, params.tokenAmount, params.serviceFeeIndex, params.tokenName, params.tokenSymbol, params.tokenDecimals)
            .accounts(openCampaignAccounts)
            .signers([payer.payer])
            .rpc(); // <--- Get transaction instead of `.rpc()`
        console.log("Campaign database address:", campaignDatabase);
        console.log("Campaign database:", yield program.account.campaignDatabase.fetch(campaignDatabase));
        console.log("Campaign info:", campaignInfo);
        console.log("Campaign info:", yield program.account.campaignInfo.fetch(campaignInfo));
        console.log("Campaign handles address:", campaignHandles);
        console.log("Campaign handles:", yield program.account.campaignHandles.fetch(campaignHandles));
        console.log("Campaign assets address:", campaignAssets);
        console.log("Campaign assets:", yield program.account.campaignAssets.fetch(campaignAssets));
        const allowList = [
        // Add more public keys as needed
        ];
    }));
});
