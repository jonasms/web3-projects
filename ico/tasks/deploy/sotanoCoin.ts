import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { Sotano } from "../../src/types/Sotano";

task("deploy:SotanoCoin")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const sotanoFactory = await ethers.getContractFactory("SotanoCoin");
    const sotano: Sotano = <Sotano>await sotanoFactory.deploy();
    await sotano.deployed();
    console.log("SotanoCoin deployed to: ", sotano.address);
  });
