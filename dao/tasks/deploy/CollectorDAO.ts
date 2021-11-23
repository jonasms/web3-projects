import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { CollectorDAO } from "../../src/types/CollectorDAO";

task("deploy:SotanoCoin").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const daoFactory = await ethers.getContractFactory("CollectorDAO");
  const dao: CollectorDAO = <CollectorDAO>await daoFactory.deploy(process.env.REACT_APP_DEV_WALLET_ADDRESS);
  await dao.deployed();
  console.log("CollectorDAO deployed to: ", dao.address);
});
