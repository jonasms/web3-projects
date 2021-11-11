import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import type { Campaign } from "../../src/types/Campaign";
// import type {Factory} from "../../src/types/Factory";
import { Signers } from "../types";
import { expect } from "chai";

describe("Unit tests", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.signers.admin = signers[0];
  });

  describe("Campaign", function () {
    beforeEach(async function () {
      const campaignArtifact: Artifact = await artifacts.readArtifact("Campaign");
      this.campaign = <Campaign>await waffle.deployContract(this.signers.admin, campaignArtifact, ["Test Campaign", 5000]);
      console.log("CAMPAIGN: ", this.campaign);
    });

    it("Should cancel contract", async function() {
        expect(await this.campaign.canceled()).to.equal(false);
        await this.campaign.cancel();
        expect(await this.campaign.canceled()).to.equal(true);
    })
  });
});
