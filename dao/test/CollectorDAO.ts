import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import type { CollectorDAO } from "../src/types/CollectorDAO";
import { expect } from "chai";
import { BigNumber } from "ethers";

const { utils } = ethers;
const { parseEther, randomBytes } = utils;
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
      await this.dao.buyMembership({ value: parseEther("1") });
      expect(await this.dao.members(this.owner.address)).to.equal(true);
    });

    it("Should disallow a user from sending more or less than 1 ETH", async function () {
      await expect(this.dao.buyMembership({ value: parseEther("0.9") })).to.be.revertedWith(
        "Membership costs exactly 1 ETH.",
      );
      await expect(this.dao.buyMembership({ value: parseEther("1.1") })).to.be.revertedWith(
        "Membership costs exactly 1 ETH.",
      );
      expect(await this.dao.members(this.owner.address)).to.equal(false);
    });

    describe("Propose", function () {
      beforeEach(async function () {
        await this.dao.buyMembership({ value: parseEther("1") });
      });

      it("Should create a proposal", async function () {
        const proposal = {
          targets: [this.account2.address], // TODO replace w/ test nftMarketplace contract address,
          values: [parseEther("1")],
          signatures: ["buyNFT(uint id, uint value)"],
          calldatas: [randomBytes(64)],
          description: "Buy an ape",
        };

        await expect(
          this.dao.propose(
            proposal.targets,
            proposal.values,
            proposal.signatures,
            proposal.calldatas,
            proposal.description,
          ),
        ).to.emit(this.dao, "ProposalCreated");

        const proposalId = await this.dao.latestProposalIds(this.owner.address);
        const writtenProposal = await this.dao.proposals(proposalId);

        expect(writtenProposal.forVotes).to.equal(0);
        expect(writtenProposal.againstVotes).to.equal(0);
        expect(writtenProposal.abstainVotes).to.equal(0);
        expect(writtenProposal.canceled).to.equal(false);
        expect(writtenProposal.executed).to.equal(false);
      });
    });
  });
});
