import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import type { BananaswapV1Factory } from "../src/types/BananaswapV1Factory";
import type { BananaswapV1Router } from "../src/types/BananaswapV1Router";
// import type { BananaswapV1Pair } from "../src/types/BananaswapV1Pair";
import type { SotanoCoin } from "../src/types/SotanoCoin";

import { expect } from "chai";

const { utils } = ethers;
const { parseEther } = utils;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const conductIco = async (_token: SotanoCoin, investors: SignerWithAddress[]) => {
  // advance to open phase
  await _token.advancePhase();
  await _token.advancePhase();
  await _token.advancePhase();

  // investors buy tokens
  for (let i = 0; i < investors.length; i++) {
    await _token.connect(investors[i]).purchase({ value: parseEther("5") });
  }
};

describe("Unit tests", function () {
  let token: SotanoCoin;
  let factory: BananaswapV1Factory;
  let router: BananaswapV1Router;
  let signers: SignerWithAddress[];
  let pairAddress: string;
  let pair: any;
  let [admin, treasury, account1, account2]: SignerWithAddress[] = [];
  let accounts: SignerWithAddress[];

  before(async function () {
    signers = await ethers.getSigners();
    [admin, treasury, account1, account2] = signers;
    accounts = signers.slice(2);
  });

  describe("BananaswapV1Router", function () {
    beforeEach(async function () {
      // deploy Sotano Coin
      const tokenArtifact: Artifact = await artifacts.readArtifact("SotanoCoin");
      token = <SotanoCoin>await waffle.deployContract(admin, tokenArtifact, [treasury.address]);
      console.log("TOKEN ADDRESS: ", token.address);

      // TODO conduct ico
      conductIco(token, accounts.slice(0, 11));

      // deploy Factory
      const factoryArtifact: Artifact = await artifacts.readArtifact("BananaswapV1Factory");
      factory = <BananaswapV1Factory>await waffle.deployContract(admin, factoryArtifact);
      console.log("FACTORY ADDRESS: ", factory.address);

      // deploy Router
      const routerArtifact: Artifact = await artifacts.readArtifact("BananaswapV1Router");
      router = <BananaswapV1Router>await waffle.deployContract(admin, routerArtifact, [factory.address]);
      console.log("ROUTER ADDRESS: ", router.address);

      // grant allowance via SotanoCoin
      await token.connect(account1).approve(router.address, parseEther("3"));
      const allowance = await token.connect(account1).allowance(admin.address, router.address);

      console.log("ALLOWANCE: ", allowance.toString());

      // deploy Pair by adding Liquidity
      await router
        .connect(account1)
        .depositLiquidity(token.address, parseEther("3"), parseEther("3"), parseEther("1"), {
          value: parseEther("1"),
        });

      pairAddress = await factory.getPair(token.address);

      const pairContract = await ethers.getContractFactory("BananaswapV1Pair");
      pair = await pairContract.attach(pairAddress);
      console.log("PAIR ADDRESS: ", pairAddress);
    });

    describe("Pairs", () => {
      it("Should have a pair for 'token'", async () => {
        expect(utils.isAddress(pairAddress)).to.equal(true);
        expect(pairAddress).to.not.equal(ZERO_ADDRESS);
      });
    });

    describe("Deposit Liquidity", () => {
      // depositing initial liquidity should
      // deposit tokens and eth in reserves (getReserves())
      // grant LP tokens to depositor
      it("Initial liquidity deposit should set reserves and grant LP tokens", async () => {
        const [tokenReserve, ethReserve] = await pair.getReserves();
        console.log("TOKEN RESERVE: ", tokenReserve);
        console.log("ETH RESERVE: ", ethReserve);
      });
    });
  });
});
