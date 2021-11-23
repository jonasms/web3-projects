import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import type { CollectorDAO } from "../src/types/CollectorDAO";
import { expect } from "chai";
// import { BigNumber } from "ethers";

const { utils } = ethers;
const { parseEther } = utils;
const { provider } = waffle;

describe("CollectorDAO", function () {
  before(async function () {
    const accounts: SignerWithAddress[] = await ethers.getSigners();
    [this.owner, this.account1, this.account2, this.account3] = accounts;
    this.accounts = accounts;
    this.accountAddresses = accounts.map(a => a.address);
  });

  beforeEach(async function () {
    const daoArtifact: Artifact = await artifacts.readArtifact("CollectorDAO");
    this.dao = <CollectorDAO>await waffle.deployContract(this.owner, daoArtifact);
    this.address = this.dao.address;
  });

  describe("Membership", function () {
    it("Should allow a user to purchase a membership", async function () {
      await this.dao.connect(this.account1).buyMembership({ value: parseEther("1") });
      expect(await this.dao.members(this.account1.address)).to.equal(true);
    });

    it("Should disallow a user from sending more or less than 1 ETH", async function () {
      await expect(this.dao.connect(this.account1).buyMembership({ value: parseEther("0.9") })).to.be.revertedWith(
        "Membership costs exactly 1 ETH.",
      );
      await expect(this.dao.connect(this.account1).buyMembership({ value: parseEther("1.1") })).to.be.revertedWith(
        "Membership costs exactly 1 ETH.",
      );
      expect(await this.dao.members(this.account1.address)).to.equal(false);
    });
  });
});
