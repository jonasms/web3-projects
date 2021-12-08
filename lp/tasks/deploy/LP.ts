// require("hardhat");

// async function main() {
//   const Factory = await ethers.getContractFactory("BananaswapV1Factory");
//   console.log("Deploying Banaswap");
//   // dev_2 address
//   const factory = await Factory.deploy("0x816a4bbE1bD9429Ed499Bb0e30c30c8F1178DCd3");
//   console.log("Factory deployed to: ", factory.address);

//   const Router = await ethers.getContractFactory("BananaswapV1Router");
//   const router = await Router.deploy(factory.address);
//   console.log("Router deployed to: ", router.address);
// }

// main()
//   .then(() => process.exit(0))
//   .catch(error => {
//     console.error(error);
//     process.exit(1);
//   });

// import { ethers } from "hardhat";
import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { SotanoCoin } from "../../src/types/SotanoCoin";
import { BananaswapV1Factory } from "../../src/types/BananaswapV1Factory";
import { BananaswapV1Router } from "../../src/types/BananaswapV1Router";

let token: SotanoCoin;
let factory: BananaswapV1Factory;
let router: BananaswapV1Router;

task("deploy:all").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const tokenFactory = await ethers.getContractFactory("SotanoCoin");
  // dev_2 address
  token = <SotanoCoin>await tokenFactory.deploy("0x816a4bbE1bD9429Ed499Bb0e30c30c8F1178DCd3");
  await token.deployed();
  console.log("SotanoCoin deployed to: ", token.address);

  const factoryFactory = await ethers.getContractFactory("BananaswapV1Factory");
  factory = <BananaswapV1Factory>await factoryFactory.deploy();
  await factory.deployed();
  console.log("BananaswapV1Factory deployed to: ", factory.address);

  const routerFactory = await ethers.getContractFactory("BananaswapV1Router");
  router = <BananaswapV1Router>await routerFactory.deploy(factory.address);
  await router.deployed();
  console.log("BananaswapV1Router deployed to: ", router.address);
});

task("deploy:SotanoCoin").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const tokenFactory = await ethers.getContractFactory("SotanoCoin");
  // dev_2 address
  token = <SotanoCoin>await tokenFactory.deploy("0x816a4bbE1bD9429Ed499Bb0e30c30c8F1178DCd3");
  await token.deployed();
  console.log("SotanoCoin deployed to: ", token.address);
});

task("deploy:BananaswapV1Factory").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const factoryFactory = await ethers.getContractFactory("BananaswapV1Factory");
  factory = <BananaswapV1Factory>await factoryFactory.deploy();
  await factory.deployed();
  console.log("BananaswapV1Factory deployed to: ", factory.address);
});

task("deploy:BananaswapV1Router").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const routerFactory = await ethers.getContractFactory("BananaswapV1Router");
  router = <BananaswapV1Router>await routerFactory.deploy(factory.address);
  await router.deployed();
  console.log("BananaswapV1Router deployed to: ", router.address);
});
