import { artifacts, ethers, waffle, network } from "hardhat";
import type { Artifact } from "hardhat/types";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import type { CollectorDAO } from "../src/types/CollectorDAO";
import { expect } from "chai";

const { utils } = ethers;
const { parseEther, randomBytes, keccak256 } = utils;
const { provider } = waffle;
let wallet: any;

async function mineBlocks(blockNumber: number) {
  while (blockNumber > 0) {
    blockNumber--;
    await network.provider.request({
      method: "evm_mine",
      params: [],
    });
  }
}

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
      let types: any;
      let domain: any;

      beforeEach(async function () {
        await this.dao.buyMembership({ value: parseEther("1") });
        await this.dao.connect(this.account1).buyMembership({ value: parseEther("1") });
        const proposal = {
          targets: [this.account3.address], // TODO replace w/ test nftMarketplace contract address,
          values: [parseEther("1")],
          signatures: ["buyNFT(uint id, uint value)"],
          calldatas: [randomBytes(64)], // TODO change this to something that would work
          description: "Buy an ape",
        };
        await this.dao.propose(
          proposal.targets,
          proposal.values,
          proposal.signatures,
          proposal.calldatas,
          proposal.description,
        );

        mineBlocks(1);

        proposalId = await this.dao.latestProposalIds(this.owner.address);
        types = {
          Ballot: [
            { name: "proposalId", type: "uint256" },
            { name: "support", type: "uint8" },
          ],
        };
        domain = {
          /** contract name
           * In this case retrieved from a contract method that returns a string.
           * Using a method to insure against a typo.
           **/
          name: await this.dao.name(),
          chainId: (await provider.getNetwork()).chainId, // get chain id from ethers
          verifyingContract: this.dao.address, // contract address
        };
      });

      it("Should cast a 'FOR' vote", async function () {
        const message = {
          proposalId: parseInt(proposalId, 10),
          support: 1,
        };

        const sig = await this.account1._signTypedData(domain, types, message);
        const { v, r, s } = ethers.utils.splitSignature(sig);

        await this.dao.castVotesBulk([proposalId], [1], [v], [r], [s]);
        const voteRecord = await this.dao.getVoteRecord(proposalId, this.account1.address);
        expect(voteRecord[0]).to.equal(true); // bool hasVoted; true
        expect(voteRecord[1]).to.equal(1); // uint8 support; FOR
      });
      it("Should cast an 'AGAINST' vote", async function () {
        const message = {
          proposalId: parseInt(proposalId, 10),
          support: 0,
        };

        const sig = await this.account1._signTypedData(domain, types, message);
        const { v, r, s } = ethers.utils.splitSignature(sig);

        await this.dao.castVotesBulk([proposalId], [0], [v], [r], [s]);
        const voteRecord = await this.dao.getVoteRecord(proposalId, this.account1.address);
        expect(voteRecord[0]).to.equal(true); // bool hasVoted; true
        expect(voteRecord[1]).to.equal(0); // uint8 support; AGAINST
      });

      // Should not allow a user to cast a vote more than once
      it("Should NOT allow a vote to be cast more than once", async function () {
        const message1 = {
          proposalId: parseInt(proposalId, 10),
          support: 1,
        };

        const sig1 = await this.account1._signTypedData(domain, types, message1);
        const { v: v1, r: r1, s: s1 } = ethers.utils.splitSignature(sig1);

        await this.dao.castVotesBulk([proposalId], [1], [v1], [r1], [s1]);

        // Second 'FOR' vote. Should reject.
        const message2 = {
          proposalId: parseInt(proposalId, 10),
          support: 1,
        };

        const sig2 = await this.account1._signTypedData(domain, types, message2);
        const { v: v2, r: r2, s: s2 } = ethers.utils.splitSignature(sig2);

        await expect(this.dao.castVotesBulk([proposalId], [1], [v2], [r2], [s2])).to.be.revertedWith(
          "_castVote: signer has already cast a vote.",
        );
      });

      // Should fail if the vote is changed
      it("Should fail IF the vote is changed", async function () {
        const message = {
          proposalId: parseInt(proposalId, 10),
          support: 1,
        };

        const sig = await this.account1._signTypedData(domain, types, message);
        const { v, r, s } = ethers.utils.splitSignature(sig);

        // Vote changed from 'FOR' to 'AGAINST'
        await expect(this.dao.castVotesBulk([proposalId], [0], [v], [r], [s])).to.be.revertedWith(
          "_castVote: signer is not a member",
        );

        // Checking that the given user's vote hasn't been counted.
        const voteRecord = await this.dao.getVoteRecord(proposalId, this.account1.address);
        expect(voteRecord[0]).to.equal(false); // bool hasVoted; false
      });

      // Should fail if the proposalId is changed
      it("Should fail if the proposalId is changed", async function () {
        const proposalB = {
          targets: [this.account3.address], // TODO replace w/ test nftMarketplace contract address,
          values: [parseEther("2")],
          signatures: ["buyNFT(uint id, uint value)"],
          calldatas: [randomBytes(64)], // TODO change this to something that would work
          description: "Buy a punk",
        };

        await this.dao
          .connect(this.account1)
          .propose(
            proposalB.targets,
            proposalB.values,
            proposalB.signatures,
            proposalB.calldatas,
            proposalB.description,
          );

        // Message and Sig intercepted by an attacker
        const message = {
          proposalId: parseInt(proposalId, 10),
          support: 1,
        };

        const sig = await this.account1._signTypedData(domain, types, message);
        const { v, r, s } = ethers.utils.splitSignature(sig);

        const proposalIdB = await this.dao.latestProposalIds(this.account1.address);

        // Attacker tries to use sig to vote 'FOR' a different proposal.
        // The sig resolves to the incorrect address.
        await expect(this.dao.connect(this.account1).castVotesBulk([proposalIdB], [1], [v], [r], [s])).to.revertedWith(
          "_castVote: signer is not a member",
        );
      });
      describe("castVotesBulk", function () {
        // Should cast multiple votes in one transaction
      });

      describe("execute", function () {
        beforeEach(async function () {
          // create proposal
          // create 20 memberships
        });

        // Should buy an nft using a queued proposal
        // cast votes; 10 for, 5 against
        // jump blocks
      });
    });
  });
});
