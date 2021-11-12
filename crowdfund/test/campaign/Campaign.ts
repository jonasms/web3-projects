import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import type { Campaign } from "../../src/types/Campaign";
import type {Factory} from "../../src/types/Factory";
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

  describe("Factory", function () {
    beforeEach(async function () {
        const factoryArtifact: Artifact = await artifacts.readArtifact("Factory");
        this.factory = <Factory>await waffle.deployContract(this.account1, factoryArtifact);
    });

    it("Should create a Campaign contract", async function() {
        await this.factory.createCampaign("Test Campaign", parseEther("10"));
        const _Campaign = await ethers.getContractFactory("Campaign");
        const campaignAddress = await this.factory.getCampaign(0);
        const campaign = _Campaign.attach(campaignAddress);

        expect(campaign.address).to.equal(campaignAddress);
        expect(await campaign.campaignName()).to.equal("Test Campaign");
        expect(await campaign.goal()).to.equal(parseEther("10"));
    })
  });

  describe("Campaign", function () {
    beforeEach(async function () {
      const campaignArtifact: Artifact = await artifacts.readArtifact("Campaign");
      this.campaignArgs = ["Test Campaign", parseEther("10")];
      this.campaign = <Campaign>await waffle.deployContract(this.account1, campaignArtifact, this.campaignArgs);
    });

    it("Should have the given name and goal", async function() {
        expect(await this.campaign.campaignName()).to.equal(this.campaignArgs[0]);
        expect(await this.campaign.goal()).to.equal(this.campaignArgs[1]);
    })

    it("Should cancel contract", async function() {
        expect(await this.campaign.canceled()).to.equal(false);
        await this.campaign.cancel();
        expect(await this.campaign.canceled()).to.equal(true);
    })

    it("Should withdraw given amount from contract", async function() {
        await this.campaign.contribute({ value: parseEther("3") });
        await this.campaign.contribute({ value: parseEther("4") });
        await this.campaign.contribute({ value: parseEther("4") });

        expect(await ethers.provider.getBalance(this.campaign.address)).to.equal(parseEther("11"));

        await this.campaign.withdraw(parseEther("5"));
        expect(await ethers.provider.getBalance(this.campaign.address)).to.equal(parseEther("6"));
        await this.campaign.withdraw(parseEther("6"));
        expect(await ethers.provider.getBalance(this.campaign.address)).to.equal(parseEther("0"));
    });

    it("Should contribute 0.01ETH to contract", async function() {
        expect(await ethers.provider.getBalance(this.campaign.address)).to.equal(parseEther("0"));
        await this.campaign.contribute({ value: parseEther("0.01") });
        expect(await ethers.provider.getBalance(this.campaign.address)).to.equal(parseEther("0.01"));
        expect(await this.campaign.getContributor(this.account1.address)).to.equal(parseEther("0.01"))
    });

    it("Should contribute over goal", async function() {
        await this.campaign.contribute({ value: parseEther("3") });
        await this.campaign.contribute({ value: parseEther("4") });
        await this.campaign.contribute({ value: parseEther("4") });

        expect(await ethers.provider.getBalance(this.campaign.address)).to.equal(parseEther("11"));
    });

    it("Should not contribute over goal", async function() {
        await this.campaign.contribute({ value: parseEther("3") });
        await this.campaign.contribute({ value: parseEther("4") });
        await this.campaign.contribute({ value: parseEther("3") });
        await expect(this.campaign.contribute({ value: parseEther("1") })).to.be.reverted;

        expect(await ethers.provider.getBalance(this.campaign.address)).to.equal(parseEther("10"));
    });

    it("Should reject the contribution for being too low", async function() {
        expect(await ethers.provider.getBalance(this.campaign.address)).to.equal(parseEther("0"));
        await expect(this.campaign.contribute({ value: parseEther("0.001") })).to.be.reverted;
        expect(await ethers.provider.getBalance(this.campaign.address)).to.equal(parseEther("0"));
        expect(await this.campaign.getContributor(this.account1.address)).to.equal(parseEther("0"))
    });

    it("Should award 1 contributor badge", async function() {
        expect(await ethers.provider.getBalance(this.campaign.address)).to.equal(parseEther("0"));
        await this.campaign.contribute({ value: parseEther("1") });
        expect(await this.campaign.ownerOf(1)).is.equal(this.account1.address);
    });

    it("Should award 3 contributor badges", async function() {
        expect(await ethers.provider.getBalance(this.campaign.address)).to.equal(parseEther("0"));
        await this.campaign.contribute({ value: parseEther("3.2") });
        expect(await this.campaign.ownerOf(1)).is.equal(this.account1.address);
        expect(await this.campaign.ownerOf(2)).is.equal(this.account1.address);
        expect(await this.campaign.ownerOf(3)).is.equal(this.account1.address);
    });

    it("Should not contribute when campaign is canceled", async function() {
        await this.campaign.cancel();
        await expect(this.campaign.contribute({ value: parseEther("1") })).to.be.reverted;
    })
  });
});
