import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import type { Campaign } from "../../src/types/Campaign";
// import type {Factory} from "../../src/types/Factory";
import { Signers } from "../types";
import { expect } from "chai";

const { utils } = ethers;
const { parseEther } = utils;

describe("Unit tests", function () {
  before(async function () {
    this.signers = {} as Signers;

    const [account1, account2]: SignerWithAddress[] = await ethers.getSigners();
    this.account1 = account1;
    this.account2 = account2;
  });

  // TODO test factory

  describe("Campaign", function () {
    beforeEach(async function () {
      const campaignArtifact: Artifact = await artifacts.readArtifact("Campaign");
      this.campaignArgs = ["Test Campaign", parseEther("10")];
      this.campaign = <Campaign>await waffle.deployContract(this.account1, campaignArtifact, this.campaignArgs);
    });

    it("Should have the given name and goal", async function() {
        expect(await this.campaign.name()).to.equal(this.campaignArgs[0]);
        expect(await this.campaign.goal()).to.equal(this.campaignArgs[1]);
    })

    it("Should cancel contract", async function() {
        expect(await this.campaign.canceled()).to.equal(false);
        await this.campaign.cancel();
        expect(await this.campaign.canceled()).to.equal(true);
    })

    it("Should withdraw given amount from contract", async function() {
    });

    it("Should contribute given amount to contract", async function() {
        expect(await ethers.provider.getBalance(this.campaign.address)).to.equal(parseEther("0"));
        await this.campaign.contribute({ value: parseEther("0.01") });
        expect(await ethers.provider.getBalance(this.campaign.address)).to.equal(parseEther("0.01"));
        expect(await this.campaign.getContributor(this.account1.address)).to.equal(parseEther("0.01"))
    });

    it("Should reject the contribution for being too lower", async function() {
        expect(await ethers.provider.getBalance(this.campaign.address)).to.equal(parseEther("0"));
        await expect(this.campaign.contribute({ value: parseEther("0.001") })).to.be.reverted;
        expect(await ethers.provider.getBalance(this.campaign.address)).to.equal(parseEther("0"));
        expect(await this.campaign.getContributor(this.account1.address)).to.equal(parseEther("0"))
    });

    // TODO test contribution breaks when goal is met
    // TODO test contribution breaks when campaign is canceled
    // TODO test contribution breaks when made more than 30 days after creation
  });
});
