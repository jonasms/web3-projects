import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import type { BananaswapV1Factory } from "../src/types/BananaswapV1Factory";
import type { BananaswapV1Router } from "../src/types/BananaswapV1Router";
import type { SotanoCoin } from "../src/types/SotanoCoin";

import { expect } from "chai";

const { utils } = ethers;
const { parseEther } = utils;

describe("Unit tests", function () {
  let token: SotanoCoin;
  let factory: BananaswapV1Factory;
  let router: BananaswapV1Router;
  let signers: SignerWithAddress[];
  let pairAddress: string;
  let [admin, treasury, account1, account2]: SignerWithAddress[] = [];

  before(async function () {
    signers = await ethers.getSigners();
    [admin, treasury, account1, account2] = signers;
  });

  describe("BananaswapV1Router", function () {
    beforeEach(async function () {
      // deploy Sotano Coin
      const tokenArtifact: Artifact = await artifacts.readArtifact("SotanoCoin");
      token = <SotanoCoin>await waffle.deployContract(admin, tokenArtifact, [treasury.address]);

      console.log("TOKEN ADDRESS: ", token.address);
      // conduct ico

      // deploy Factory
      const factoryArtifact: Artifact = await artifacts.readArtifact("BananaswapV1Factory");
      factory = <BananaswapV1Factory>await waffle.deployContract(admin, factoryArtifact);

      console.log("FACTORY ADDRESS: ", factory.address);

      // deploy Router
      const routerArtifact: Artifact = await artifacts.readArtifact("BananaswapV1Router");
      router = <BananaswapV1Router>await waffle.deployContract(admin, routerArtifact, [factory.address]);

      console.log("ROUTER ADDRESS: ", router.address);

      // deploy Pair by adding Liquidity
      await router.depositLiquidity(token.address, parseEther("3"), parseEther("2.5"), parseEther("0.5"), {
        value: parseEther("1"),
      });

      pairAddress = await factory.getPair(token.address);
      console.log("PAIR ADDRESS: ", pairAddress);
    });

    describe("Pairs", () => {
      it("Should have a pair for 'token'", async () => {
        console.log("PAIR ADDRESS: ", pairAddress);
        // expect(pairAddress).to.be.undefined;

        expect(pairAddress).to.not.equal(undefined);
      });
    });
  });
});
