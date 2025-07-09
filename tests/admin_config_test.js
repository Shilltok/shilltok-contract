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
const chai_2 = require("chai");
/**********************************************************************************/
/* create-admin-cf */
/**********************************************************************************/
describe('create_admin_config', () => {
    // Configure the client to use the local cluster.
    const projectWallet = new web3_js_1.Keypair();
    const backend = new web3_js_1.Keypair();
    const provider = anchor.AnchorProvider.local();
    anchor.setProvider(provider);
    const payer = provider.wallet;
    const program = anchor.workspace.ShilltokCampaignProgram;
    it('create_seed_for_admin_config', () => __awaiter(void 0, void 0, void 0, function* () {
        const idConfig = new bn_js_1.default(222046201);
        const [adminConfig, _] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from('admin-cf'), idConfig.toArrayLike(Buffer, "le", 8)], new anchor.web3.PublicKey("M5du56w3AvJPiX148aBhRTmALn87TpqvnLrzcbgiL5X"));
        console.log(`adminConfig seed: ${adminConfig}`);
    }));
    it('create_admin_config_success', () => __awaiter(void 0, void 0, void 0, function* () {
        const idConfig = new bn_js_1.default(123456789);
        const [adminConfig, _] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from('admin-cf'), idConfig.toArrayLike(Buffer, "le", 8)], program.programId);
        const adminConfigInfo = {
            id: idConfig,
            backend: backend.publicKey,
            projectWallet: projectWallet.publicKey
        };
        //anchor automatically fills the user of Account type Signer with the provider and the SystemProgram
        //console.log("Program: ", await program.methods.createAdminConfig(adminConfigInfo.id, adminConfigInfo.projectWallet));
        yield program.methods
            .createAdminConfig(adminConfigInfo.id, adminConfigInfo.backend, adminConfigInfo.projectWallet)
            .accounts({
            adminConfig,
        })
            .rpc();
        const adminConfigAccount = yield program.account.adminConfig.fetch(adminConfig);
        (0, chai_1.expect)(adminConfigAccount.idConfig.toNumber()).to.equal(123456789);
        (0, chai_1.expect)(adminConfigAccount.admin.toBase58()).to.equal(payer.publicKey.toBase58());
        (0, chai_1.expect)(adminConfigAccount.backend.toBase58()).to.equal(backend.publicKey.toBase58());
        (0, chai_1.expect)(adminConfigAccount.projectWallet.toBase58()).to.equal(projectWallet.publicKey.toBase58());
        (0, chai_1.expect)(adminConfigAccount.newAdmin).to.equal(null);
        //console.log('adminConfig address', adminConfig.toBase58())
    }));
    it('create_admin_config_fail_not_admin', () => __awaiter(void 0, void 0, void 0, function* () {
        const idConfig = new bn_js_1.default(123456799);
        const [adminConfig, _] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from('admin-cf'), idConfig.toArrayLike(Buffer, "le", 8)], program.programId);
        const adminConfigInfo = {
            id: idConfig,
            backend: backend.publicKey,
            projectWallet: projectWallet.publicKey
        };
        //anchor automatically fills the user of Account type Signer with the provider and the SystemProgram
        try {
            yield program.methods
                .createAdminConfig(adminConfigInfo.id, adminConfigInfo.backend, adminConfigInfo.projectWallet)
                .accounts({
                adminConfig,
            })
                .signers([projectWallet])
                .rpc();
            chai_2.assert.fail("This operation shall fail");
        }
        catch (error) {
            const errorMessage = error.message;
            //console.log('Error message:', errorMessage);
            chai_2.assert.isTrue(errorMessage.includes('unknown signer'));
        }
        //console.log('adminConfig address', adminConfig.toBase58())
    }));
});
/**********************************************************************************/
/* Helpers */
/**********************************************************************************/
function create_admin_config(adminConfig, idConfig, payer, program, backend, projectWallet) {
    return __awaiter(this, void 0, void 0, function* () {
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
    });
}
/**********************************************************************************/
/* set_new_admin */
/**********************************************************************************/
describe('set_new_admin', () => {
    // Configure the client to use the local cluster.
    const projectWallet = new web3_js_1.Keypair();
    const backend = new web3_js_1.Keypair();
    const alice = new web3_js_1.Keypair();
    const provider = anchor.AnchorProvider.local();
    anchor.setProvider(provider);
    const payer = provider.wallet;
    const program = anchor.workspace.ShilltokCampaignProgram;
    it('set_new_admin_success', () => __awaiter(void 0, void 0, void 0, function* () {
        const idConfig = new bn_js_1.default(123456791);
        const [adminConfig, _] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from('admin-cf'), idConfig.toArrayLike(Buffer, "le", 8)], program.programId);
        yield create_admin_config(adminConfig, idConfig, payer, program, backend, projectWallet);
        yield program.methods
            .setNewAdmin(idConfig, alice.publicKey)
            .accounts({
            adminConfig,
        })
            .rpc();
        const adminConfigAccount = yield program.account.adminConfig.fetch(adminConfig);
        (0, chai_1.expect)(adminConfigAccount.newAdmin.toBase58()).to.equal(alice.publicKey.toBase58());
    }));
    it('set_new_admin_fail_not_admin', () => __awaiter(void 0, void 0, void 0, function* () {
        const idConfig = new bn_js_1.default(123456792);
        // Create admin-cf account
        const [adminConfig, _] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from('admin-cf'), idConfig.toArrayLike(Buffer, "le", 8)], program.programId);
        yield create_admin_config(adminConfig, idConfig, payer, program, backend, projectWallet);
        try {
            yield program.methods
                .setNewAdmin(idConfig, alice.publicKey)
                .accounts({
                adminConfig,
            })
                .signers([alice])
                .rpc();
            chai_2.assert.fail("This operation shall fail");
        }
        catch (error) {
            const errorMessage = error.message;
            //console.log('Error message:', errorMessage);
            chai_2.assert.isTrue(errorMessage.includes('unknown signer'));
        }
    }));
});
/**********************************************************************************/
/* update_admin */
/**********************************************************************************/
describe('update_admin', () => {
    // Configure the client to use the local cluster.
    const projectWallet = new web3_js_1.Keypair();
    const backend = new web3_js_1.Keypair();
    const alice = new web3_js_1.Keypair();
    const bob = new web3_js_1.Keypair();
    const provider = anchor.AnchorProvider.local();
    anchor.setProvider(provider);
    const payer = provider.wallet;
    const program = anchor.workspace.ShilltokCampaignProgram;
    it('update_admin_fail_no_call_to_set_new_admin', () => __awaiter(void 0, void 0, void 0, function* () {
        const idConfig = new bn_js_1.default(123456793);
        const [adminConfig, _] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from('admin-cf'), idConfig.toArrayLike(Buffer, "le", 8)], program.programId);
        yield create_admin_config(adminConfig, idConfig, payer, program, backend, projectWallet);
        try {
            yield program.methods
                .updateAdmin(idConfig)
                .accounts({
                adminConfig,
            })
                //.signers([alice])
                .rpc();
            chai_2.assert.fail("This operation shall fail");
        }
        catch (error) {
            const errorMessage = error.message;
            chai_2.assert.isTrue(errorMessage.includes('No new admin'));
        }
        //const adminConfigAccount = await program.account.adminConfig.fetch(adminConfig);
        //expect(adminConfigAccount.newAdmin.toBase58()).to.equal(alice.publicKey.toBase58())
    }));
    it('update_admin_fail_new_admin_address_not_used', () => __awaiter(void 0, void 0, void 0, function* () {
        const idConfig = new bn_js_1.default(123456794);
        const [adminConfig, _] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from('admin-cf'), idConfig.toArrayLike(Buffer, "le", 8)], program.programId);
        yield create_admin_config(adminConfig, idConfig, payer, program, backend, projectWallet);
        yield program.methods
            .setNewAdmin(idConfig, alice.publicKey)
            .accounts({
            adminConfig,
        })
            .rpc();
        try {
            yield program.methods
                .updateAdmin(idConfig)
                .accounts({
                adminConfig,
            })
                //.signers([alice])
                .rpc();
            chai_2.assert.fail("This operation shall fail");
        }
        catch (error) {
            const errorMessage = error.message;
            chai_2.assert.isTrue(errorMessage.includes('Unauthorized user'));
        }
        //const adminConfigAccount = await program.account.adminConfig.fetch(adminConfig);
        //expect(adminConfigAccount.newAdmin.toBase58()).to.equal(alice.publicKey.toBase58())
    }));
    it('update_admin_success', () => __awaiter(void 0, void 0, void 0, function* () {
        const idConfig = new bn_js_1.default(123456795);
        const [adminConfig, _] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from('admin-cf'), idConfig.toArrayLike(Buffer, "le", 8)], program.programId);
        yield create_admin_config(adminConfig, idConfig, payer, program, backend, projectWallet);
        yield program.methods
            .setNewAdmin(idConfig, alice.publicKey)
            .accounts({
            adminConfig,
        })
            .rpc();
        yield program.methods
            .updateAdmin(idConfig)
            .accounts({
            signer: alice.publicKey,
            adminConfig,
        })
            .signers([alice])
            .rpc();
        const adminConfigAccount = yield program.account.adminConfig.fetch(adminConfig);
        (0, chai_1.expect)(adminConfigAccount.admin.toBase58()).to.equal(alice.publicKey.toBase58());
        (0, chai_1.expect)(adminConfigAccount.newAdmin).to.equal(null);
        try {
            yield program.methods
                .setNewAdmin(idConfig, bob.publicKey)
                .accounts({
                adminConfig,
            })
                .signers([projectWallet])
                .rpc();
            chai_2.assert.fail("This operation shall fail");
        }
        catch (error) {
            const errorMessage = error.message;
            chai_2.assert.isTrue(errorMessage.includes('unknown signer'));
        }
        const adminConfigAccount2 = yield program.account.adminConfig.fetch(adminConfig);
        yield program.methods
            .setNewAdmin(idConfig, bob.publicKey)
            .accounts({
            admin: alice.publicKey,
            adminConfig,
        })
            .signers([alice])
            .rpc();
    }));
});
/**********************************************************************************/
/* update_project_wallet */
/**********************************************************************************/
describe('update_project_wallet', () => {
    // Configure the client to use the local cluster.
    const projectWallet = new web3_js_1.Keypair();
    const backend = new web3_js_1.Keypair();
    const newProjectWallet = new web3_js_1.Keypair();
    const alice = new web3_js_1.Keypair();
    const provider = anchor.AnchorProvider.local();
    anchor.setProvider(provider);
    const payer = provider.wallet;
    const program = anchor.workspace.ShilltokCampaignProgram;
    it('update_project_wallet_fail_not_admin', () => __awaiter(void 0, void 0, void 0, function* () {
        const idConfig = new bn_js_1.default(123);
        const [adminConfig, _] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from('admin-cf'), idConfig.toArrayLike(Buffer, "le", 8)], program.programId);
        yield create_admin_config(adminConfig, idConfig, payer, program, backend, projectWallet);
        try {
            yield program.methods
                .updateProjectWallet(idConfig, newProjectWallet.publicKey)
                .accounts({
                adminConfig,
            })
                .signers([alice])
                .rpc();
            chai_2.assert.fail("This operation shall fail");
        }
        catch (error) {
            const errorMessage = error.message;
            chai_2.assert.isTrue(errorMessage.includes('unknown signer'));
        }
    }));
    it('update_project_wallet_success', () => __awaiter(void 0, void 0, void 0, function* () {
        const idConfig = new bn_js_1.default(124);
        const [adminConfig, _] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from('admin-cf'), idConfig.toArrayLike(Buffer, "le", 8)], program.programId);
        yield create_admin_config(adminConfig, idConfig, payer, program, backend, projectWallet);
        yield program.methods
            .updateProjectWallet(idConfig, newProjectWallet.publicKey)
            .accounts({
            adminConfig,
        })
            .rpc();
        const adminConfigAccount = yield program.account.adminConfig.fetch(adminConfig);
        (0, chai_1.expect)(adminConfigAccount.projectWallet.toBase58()).to.equal(newProjectWallet.publicKey.toBase58());
    }));
});
