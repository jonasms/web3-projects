import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import type { CollectorDAO } from "../src/types/CollectorDAO";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { signTypedData, SignTypedDataVersion, recoverTypedSignature, TypedDataUtils } from "@metamask/eth-sig-util";
import { signTypedData_v4 } from "eth-sig-util";
import { string } from "hardhat/internal/core/params/argumentTypes";

//@ts-ignore
// import EIP712 from "../utils/eip712";
// import { randomBytes } from "crypto";
// import EIP712 from "eip-712";

const { utils } = ethers;
const { parseEther, randomBytes, keccak256 } = utils;
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

      let wallet = new ethers.Wallet(randomBytes(32));

      let proposalId: string;
      let chainId: number;

      beforeEach(async function () {
        await this.dao.buyMembership({ value: parseEther("1") });
        const proposal = {
          targets: [this.account2.address], // TODO replace w/ test nftMarketplace contract address,
          values: [parseEther("1")],
          signatures: ["buyNFT(uint id, uint value)"],
          calldatas: [randomBytes(64)],
          description: "Buy an ape",
        };
        this.dao.propose(
          proposal.targets,
          proposal.values,
          proposal.signatures,
          proposal.calldatas,
          proposal.description,
        );
        proposalId = await this.dao.latestProposalIds(this.owner.address);
        chainId = (await provider.getNetwork()).chainId;
      });

      it("Should cast a 'FOR' vote", async function () {
        const typedData = {
          types: {
            EIP712Domain: [
              { name: "name", type: "string" },
              //   { name: "version", type: "string" },
              { name: "chainId", type: "uint256" },
              { name: "verifyingContract", type: "address" },
            ],
            Ballot: [
              { name: "proposalId", type: "uint256" },
              { name: "support", type: "uint8" },
            ],
          },
          primaryType: "Ballot" as "Ballot",
          domain: {
            name: await this.dao.name(),
            chainId: chainId,
            verifyingContract: this.dao.address,
          },
          message: {
            proposalId: parseInt(proposalId, 10),
            support: 1,
          },
        };

        // const sig = await this.owner._signTypedData(typedData.domain, typedData.types, typedData.message);
        console.log("WALLET PRIVATE KEY: ", wallet.privateKey);
        console.log("WALLET ADDRESS: ", wallet.address);
        const pKeyBuffer = Buffer.from(wallet.privateKey.slice(2), "hex");
        const uintArr = new Uint8Array(pKeyBuffer);

        console.log("UINT ARR: ", uintArr);

        const sig = signTypedData({
          data: typedData,
          privateKey: Buffer.from(wallet.privateKey.slice(2), "hex"),
          version: SignTypedDataVersion.V4,
        });

        console.log("SIG: ", sig);

        const extracedAddress = recoverTypedSignature({
          data: typedData,
          signature: sig,
          version: SignTypedDataVersion.V4,
        });
        console.log("EXTRACTED ADDRESS: ", extracedAddress);
        // console.log("WALLET; SIGNED ADDRESSED: ", this.owner.address);

        const { v, r, s } = ethers.utils.splitSignature(sig);

        // const message = [
        //   {
        //     type: "uint256",
        //     name: "proposalid",
        //     value: parseInt(proposalId, 10),
        //   },
        //   {
        //     type: "uint8",
        //     name: "support",
        //     value: 1,
        //   },
        // ];

        // console.log("PROP ID: ", proposalId, " | ", parseInt(proposalId, 10));

        // const message = utils.toUtf8Bytes("1");
        // const hash = ethers.utils.keccak256(message);
        // const _sig = await this.owner.signMessage(ethers.utils.arrayify(hash));
        // const recoveredKey = ethers.utils.verifyMessage(ethers.utils.arrayify(hash), _sig);
        // const { v, r, s } = ethers.utils.splitSignature(_sig);

        // console.log("SIG: ", _sig);

        // // const recoveredKey = ethers.utils.recoverPublicKey(
        // //   ethers.utils.hashMessage(Buffer.from(JSON.stringify(message))),
        // //   _sig,
        // // );
        // console.log("OWNER ADDRESS: ", this.owner.address);
        // console.log("RECOVERED KEY: ", recoveredKey);

        // console.log("V: ", v, "R: ", r, "S: ", s);

        await this.dao.castVotesBulk([proposalId], [1], [v], [r], [s]);
      });
    });
  });
});
