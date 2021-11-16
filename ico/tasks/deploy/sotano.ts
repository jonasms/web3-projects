import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { Sotano } from "../../src/types/Sotano";

task("deploy:Sotano")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const sotanoFactory = await ethers.getContractFactory("Sotano");
    const sotano: Sotano = <Sotano>await sotanoFactory.deploy();
    await sotano.deployed();
    console.log("Sotano deployed to: ", sotano.address);
  });
