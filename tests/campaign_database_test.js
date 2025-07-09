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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const anchor = __importStar(require("@coral-xyz/anchor"));
const bn_js_1 = __importDefault(require("bn.js"));
const web3_js_1 = require("@solana/web3.js");
const chai_1 = require("chai");
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
/**********************************************************************************/
/* create_campaign_database */
/**********************************************************************************/
describe('create_campaign_database', () => {
    // Configure the client to use the local cluster.
    const projectWallet = new web3_js_1.Keypair();
    const backend = new web3_js_1.Keypair();
    const provider = anchor.AnchorProvider.local();
    anchor.setProvider(provider);
    const payer = provider.wallet;
    const program = anchor.workspace.ShilltokCampaignProgram;
    const idConfig = new bn_js_1.default(1234567891234);
    const id = new bn_js_1.default(23482736);
    it('create_seed_for_admin_config', () => __awaiter(void 0, void 0, void 0, function* () {
        const my_id = new bn_js_1.default(1596006);
        const [campaignDatabase, _] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from('campg-db'), my_id.toArrayLike(Buffer, "le", 8)], new anchor.web3.PublicKey("M5du56w3AvJPiX148aBhRTmALn87TpqvnLrzcbgiL5X"));
        console.log(`campaignDatabase seed: ${campaignDatabase}`);
    }));
    it('create_campaign_database_success', () => __awaiter(void 0, void 0, void 0, function* () {
        const adminConfig = yield create_admin_config(idConfig, payer, program, backend, projectWallet);
        const [campaignDatabase, _] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from('campg-db'), id.toArrayLike(Buffer, "le", 8)], program.programId);
        const serviceFees = [{ lamportFee: 1000, tokenFeePercentage: 10 }];
        //anchor automatically fills the user of Account type Signer with the provider and the SystemProgram
        yield program.methods
            .createCampaignDatabase(idConfig, id, serviceFees)
            .accounts({
            adminConfig,
        })
            .rpc();
        const campaignDatabaseAccount = yield program.account.campaignDatabase.fetch(campaignDatabase);
        (0, chai_1.expect)(campaignDatabaseAccount.id.toNumber()).to.equal(id.toNumber());
        (0, chai_1.expect)(campaignDatabaseAccount.counter.toNumber()).to.equal(0);
    }));
});
