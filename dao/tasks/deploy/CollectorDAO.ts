import { ethers } from "hardhat";
import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { CollectorDAO } from "../../src/types/CollectorDAO";
import { NftMarketplace } from "../../src/types/NftMarketplace";
import { Proposal } from "../../src/types/Proposal";

task("deploy:CollectorDAO").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  // deploy CollectorDAO
  const daoFactory = await ethers.getContractFactory("CollectorDAO");
  const dao: CollectorDAO = <CollectorDAO>await daoFactory.deploy();
  await dao.deployed();
  console.log("CollectorDAO deployed to: ", dao.address);
});

task("deploy:SupportContracts").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  // deploy NftMarketplace
  const nftMarketplaceFactory = await ethers.getContractFactory("NftMarketplace");
  const marketplace: NftMarketplace = <NftMarketplace>await nftMarketplaceFactory.deploy();
  await marketplace.deployed();
  console.log("NftMarketplace deployed to: ", marketplace.address);

  await marketplace.addNftContract("0x90F79bf6EB2c4f870365E785982E1f101E93b906", [[0, ethers.utils.parseEther("1")]]);

  // deploy Proposal
  const proposalFactory = await ethers.getContractFactory("Proposal");
  const proposal: Proposal = <Proposal>await proposalFactory.deploy(marketplace.address);
  await proposal.deployed();
  console.log("Proposal deployed to: ", proposal.address);
});
