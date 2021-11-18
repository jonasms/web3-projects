import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import type { SotanoCoin } from "../src/types/SotanoCoin";
import type {Factory} from "../src/types/Factory";
import { Signers } from "./types";
import { expect } from "chai";

const { utils } = ethers;
const { parseEther } = utils;

describe("SotanoCoin", function () {
    before (async function () {
        const accounts: SignerWithAddress[] = await ethers.getSigners();
        [
            this.account1,
            this.account2,
            this.account3,
            this.account4,
            this.account5,
            this.account6,
            this.account7,
            this.account8,
            this.account9,
            this.account10,
            this.account11
        ] = accounts;
        this.accounts = accounts;
        this.accountAddresses = accounts.map(a => a.address);
    });

    beforeEach(async function () {
      const SotanoCoinArtifact: Artifact = await artifacts.readArtifact("SotanoCoin");
      this.sotanoCoin = <SotanoCoin>await waffle.deployContract(this.account1, SotanoCoinArtifact);
      this.address = this.sotanoCoin.address;
    });

    describe("Purchase", function () {
        describe("'None' Phase", function () {
            it("Should fail when `phase` is Phase.None", async function() {
                await expect(this.sotanoCoin.purchase({ value: parseEther("1") })).to.be.reverted;
                expect(await this.sotanoCoin.totTokensPurchased()).to.equal(0);
            });
        });

        describe("'Seed' Phase", function () {
            beforeEach(async function() {
                // Advance to phase 'Seed'
                await this.sotanoCoin.advancePhase();
            });

            it("Should fail when purchaser is NOT whitelisted", async function() {
                await expect(this.sotanoCoin.purchase({ value: parseEther("1") })).to.be.reverted;
                expect(await this.sotanoCoin.totTokensPurchased()).to.equal(0);
            });
    
            it("Should succeed when purchaser is whitelisted", async function() {
                await this.sotanoCoin.addToWhitelist([this.account1.address]);
                await this.sotanoCoin.purchase({ value: parseEther("1") });
                expect(await this.sotanoCoin.totTokensPurchased()).to.equal(parseEther("5"));
            });
    
            it("Should fail when purchaser has already ordered 7,500 tokens", async function() {
                await this.sotanoCoin.addToWhitelist([this.account1.address]);
                await this.sotanoCoin.purchase({ value: parseEther("1500") });
                expect(await this.sotanoCoin.totTokensPurchased()).to.equal(parseEther("7500"));
                await expect(this.sotanoCoin.purchase({ value: parseEther("0.01") })).to.be.reverted;
            });

            it("Should allow purchase up to 7,500 tokens and refund excess", async function() {
                // TODO test refund?
                await this.sotanoCoin.addToWhitelist([this.account1.address]);
                await this.sotanoCoin.purchase({ value: parseEther("1500.01")});
                expect(
                    await this.sotanoCoin.investorToTokensOwed(this.account1.address)
                ).to.equal(parseEther("7500"));
                await expect(this.sotanoCoin.purchase({ value: parseEther("0.01")})).to.be.reverted;
            });
    
            it("Should fail when 75,000 tokens have been ordered", async function() {
                await this.sotanoCoin.addToWhitelist(this.accountAddresses);
                const { sotanoCoin, account11 } = this;
                // note: 10 different accounts purchase 1500ETH of tokens each
                const purchaseTransactions = this.accounts.slice(0, 10).map(async function (account: SignerWithAddress) {
                    return sotanoCoin.connect(account).purchase({ value: parseEther("1500") });    
                });

                return Promise.all(purchaseTransactions)
                    .then(async function() {
                        await expect(sotanoCoin.connect(account11).purchase({ value: parseEther("0.01") })).to.be.reverted;
                        expect(await sotanoCoin.totTokensPurchased()).to.equal(parseEther("75000"));
                    });
            });    
        });

        describe("'General' Phase", function () {
            beforeEach(async function() {
                // Advance to phase 'General'
                await this.sotanoCoin.advancePhase();
                await this.sotanoCoin.advancePhase();
            });

            it("Should allow for a purchaser to order up to 5,000 tokens", async function() {
                await this.sotanoCoin.purchase({ value: parseEther("1000")});
                await this.sotanoCoin.connect(this.account2).purchase({ value: parseEther("1000")});
                expect(
                    await this.sotanoCoin.investorToTokensOwed(this.account1.address)
                ).to.equal(parseEther("5000"));
                expect(
                    await this.sotanoCoin.investorToTokensOwed(this.account2.address)
                ).to.equal(parseEther("5000"));
                expect(await this.sotanoCoin.totTokensPurchased()).to.equal(parseEther("10000"));
            });

            it("Should fail when purchaser has already ordered 5,000 tokens", async function() {
                await this.sotanoCoin.purchase({ value: parseEther("1000")});
                expect(
                    await this.sotanoCoin.investorToTokensOwed(this.account1.address)
                ).to.equal(parseEther("5000"));
                await expect(this.sotanoCoin.purchase({ value: parseEther("0.01")})).to.be.reverted;
            });

            it("Should allow purchase up to 5,000 tokens and refund excess", async function() {
                // TODO test refund?
                await this.sotanoCoin.purchase({ value: parseEther("1000.01")});
                expect(
                    await this.sotanoCoin.investorToTokensOwed(this.account1.address)
                ).to.equal(parseEther("5000"));
                await expect(this.sotanoCoin.purchase({ value: parseEther("0.01")})).to.be.reverted;
            });

            it("Should fail when 150k tokens have been ordered in total", async function() {                
                const { sotanoCoin, account1, account2, accounts } = this;
                // note: 30 different accounts purchase 1000ETH of tokens each
                const purchaseTransactions = this.accounts.slice(0, 30).map(async function (account: SignerWithAddress) {
                    return sotanoCoin.connect(account).purchase({ value: parseEther("1000") });    
                });

                return Promise.all(purchaseTransactions).then(async function() {
                    expect(
                        await sotanoCoin.investorToTokensOwed(account1.address)
                    ).to.equal(parseEther("5000"));
                    expect(
                        await sotanoCoin.investorToTokensOwed(account2.address)
                    ).to.equal(parseEther("5000"));
    
                    expect(await sotanoCoin.totTokensPurchased()).to.equal(parseEther("150000"));
                    await expect(
                        sotanoCoin.connect(accounts[30]).purchase({ value: parseEther("0.01") })
                    ).to.be.reverted;
                });
            });
        });

        describe("'Open' Phase", function () {
            beforeEach(async function() {
                // Advance to phase 'Open'
                await this.sotanoCoin.advancePhase();
                await this.sotanoCoin.advancePhase();
                await this.sotanoCoin.advancePhase();
            });

            it("Should sell/distribute tokens up to the max supply of 150k tokens", async function() {
                // TODO get token balance instead of 'tokens owed'
                // TODO get total tokens distributed
                
                const [account31, account32, account33, account34] = this.accounts.slice(30)
                await this.sotanoCoin.connect(account31).purchase({ value: parseEther("8000")});
                await this.sotanoCoin.connect(account32).purchase({ value: parseEther("8000")});
                await this.sotanoCoin.connect(account33).purchase({ value: parseEther("8000")});
                await this.sotanoCoin.connect(account34).purchase({ value: parseEther("8000")});

                expect(
                    await this.sotanoCoin.balanceOf(account31.address)
                ).to.equal(parseEther("40000"));
                expect(
                    await this.sotanoCoin.balanceOf(account32.address)
                ).to.equal(parseEther("40000"));
                expect(
                    await this.sotanoCoin.balanceOf(account33.address)
                ).to.equal(parseEther("40000"));

                // note: Only gives purchaser up to total supply
                expect(
                    await this.sotanoCoin.balanceOf(account34.address)
                ).to.equal(parseEther("30000"));

                await expect(
                    this.sotanoCoin.purchase({ value: parseEther("0.01") })
                ).to.be.revertedWith("Total tokens purchased has already met phase limit.");

                expect(await this.sotanoCoin.totalSupply()).to.equal(parseEther("150000"));

            });
        });

        describe("Initial Token Distribution", function() {
            // Test that tokens are distributed when phase changes to 'Open'
            it("Should distribute all tokens owed when phase is changed to 'Open'", async function() {
                // Advance to phase 'General'
                await this.sotanoCoin.advancePhase();
                await this.sotanoCoin.advancePhase();

                await this.sotanoCoin.purchase({ value: parseEther("5") });
                await this.sotanoCoin.connect(this.account2).purchase({ value: parseEther("10") });
                await this.sotanoCoin.connect(this.account3).purchase({ value: parseEther("15") });

                expect(await this.sotanoCoin.totTokensPurchased()).to.equal(parseEther("150"));

                await this.sotanoCoin.advancePhase();

                expect(
                    await this.sotanoCoin.balanceOf(this.account1.address)
                ).to.equal(parseEther("25"));
                expect(
                    await this.sotanoCoin.balanceOf(this.account2.address)
                ).to.equal(parseEther("50"));
                expect(
                    await this.sotanoCoin.balanceOf(this.account3.address)
                ).to.equal(parseEther("75"));
            });
        });

        describe("Whitelist", function () {
            it("It should add an address to the whitelist", async function() {
                await this.sotanoCoin.addToWhitelist([this.account1.address]);
                expect(await this.sotanoCoin.whitelistedInvestors(this.account1.address)).to.equal(true);
            });
        });
    });
});
