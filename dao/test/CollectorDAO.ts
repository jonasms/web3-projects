import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import type { CollectorDAO } from "../src/types/CollectorDAO";
import { expect } from "chai";
import { signTypedData, SignTypedDataVersion, recoverTypedSignature } from "@metamask/eth-sig-util";

const { utils } = ethers;
const { parseEther, randomBytes, keccak256 } = utils;
const { provider } = waffle;
let wallet: any;

describe("CollectorDAO", function () {
  before(async function () {
    const accounts: SignerWithAddress[] = await ethers.getSigners();
    [wallet] = await provider.getWallets();
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

    describe("Create Proposal", function () {
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
        console.log("OWNER ADDRESS: ", this.owner.address);
        const writtenProposal = await this.dao.proposals(proposalId);

        expect(writtenProposal.forVotes).to.equal(0);
        expect(writtenProposal.againstVotes).to.equal(0);
        expect(writtenProposal.abstainVotes).to.equal(0);
        expect(writtenProposal.canceled).to.equal(false);
        expect(writtenProposal.executed).to.equal(false);
      });
    });

    describe("_castVote", function () {
      const Domain = async (gov: CollectorDAO) => ({
        name: await gov.name(),
        chainId: 1,
        verifyingContract: gov.address,
      });

      const Types = {
        Ballot: [
          { name: "proposalId", type: "uint256" },
          { name: "support", type: "uint8" },
        ],
      };

      let proposalId: string;
      let chainId: number;

      beforeEach(async function () {
        await this.dao.connect(wallet).buyMembership({ value: parseEther("1") });
        const proposal = {
          targets: [this.account2.address], // TODO replace w/ test nftMarketplace contract address,
          values: [parseEther("1")],
          signatures: ["buyNFT(uint id, uint value)"],
          calldatas: [randomBytes(64)],
          description: "Buy an ape",
        };
        this.dao
          .connect(wallet)
          .propose(proposal.targets, proposal.values, proposal.signatures, proposal.calldatas, proposal.description);
        proposalId = await this.dao.latestProposalIds(this.owner.address);
      });

      it("Should cast a 'FOR' vote", async function () {
        const typedData = {
          types: {
            Ballot: [
              { name: "proposalId", type: "uint256" },
              { name: "support", type: "uint8" },
            ],
          },
          domain: {
            /** contract name
             * In this case retrieved from a contract method that returns a string.
             * Using a method to insure against a typo.
             **/
            name: await this.dao.name(),
            chainId: (await provider.getNetwork()).chainId, // get chain id from ethers
            verifyingContract: this.dao.address, // contract address
          },
          message: {
            proposalId: parseInt(proposalId, 10),
            support: 1,
          },
        };

        const sig = await wallet._signTypedData(typedData.domain, typedData.types, typedData.message);
        const { v, r, s } = ethers.utils.splitSignature(sig);

        await this.dao.castVotesBulk([proposalId], [1], [v], [r], [s]);
      });
    });
  });
});
