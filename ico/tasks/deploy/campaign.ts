// import { task } from "hardhat/config";
// import { TaskArguments } from "hardhat/types";

// import { Campaign } from "../../src/types/Campaign";
// import { Campaign__factory } from "../../src/types/factories/Campaign__factory";

// task("deploy:Campaign")
//   .setAction(async function (taskArguments: TaskArguments, { ethers }) {
//     const campaignFactory: Campaign__factory = await ethers.getContractFactory("Campaign");
//     const campaign: Campaign = <Campaign>await campaignFactory.deploy();
//     await campaign.deployed();
//     console.log("Campaign deployed to: ", campaign.address);
//   });
