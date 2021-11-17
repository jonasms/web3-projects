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

            it("Should fail when `phase` is Phase.Seed and purchaser is NOT whitelisted", async function() {
                await expect(this.sotanoCoin.purchase({ value: parseEther("1") })).to.be.reverted;
                expect(await this.sotanoCoin.totTokensPurchased()).to.equal(0);
            });
    
            it("Should succeed when `phase` is Phase.Seed and purchaser is whitelisted", async function() {
                await this.sotanoCoin.addToWhitelist([this.account1.address]);
                await this.sotanoCoin.purchase({ value: parseEther("1") });
                expect(await this.sotanoCoin.totTokensPurchased()).to.equal(parseEther("5"));
            });
    
            it("Should fail when `phase` is Phase.Seed and purchaser has already ordered 7,500 tokens", async function() {
                await this.sotanoCoin.addToWhitelist([this.account1.address]);
                await this.sotanoCoin.purchase({ value: parseEther("1500") });
                expect(await this.sotanoCoin.totTokensPurchased()).to.equal(parseEther("7500"));
                await expect(this.sotanoCoin.purchase({ value: parseEther("0.01") })).to.be.reverted;
            });
    
            it("Should fail when `phase` is Phase.Seed and more than 75,000 tokens have been ordered", async function() {
                await this.sotanoCoin.addToWhitelist(this.accountAddresses);
                const sotanoCoin = this.sotanoCoin;
                // 10 different accounts purchase 1500ETH of tokens each
                this.accounts.slice(10).map(async function (account: SignerWithAddress) {
                    await sotanoCoin.connect(account).purchase({ value: parseEther("1500") });    
                });
                await expect(this.sotanoCoin.connect(this.account11).purchase({ value: parseEther("0.01") })).to.be.reverted;
                expect(await this.sotanoCoin.totTokensPurchased()).to.equal(parseEther("75000"));

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
