import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import type { BananaswapV1Factory } from "../src/types/BananaswapV1Factory";
import type { BananaswapV1Router } from "../src/types/BananaswapV1Router";
// import type { BananaswapV1Pair } from "../src/types/BananaswapV1Pair";
import type { SotanoCoin } from "../src/types/SotanoCoin";

import { expect } from "chai";

const { utils, BigNumber } = ethers;
const { parseEther } = utils;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const conductIco = async (_token: SotanoCoin, investors: SignerWithAddress[]) => {
  const value = 5;
  // advance to open phase
  await _token.advancePhase();
  await _token.advancePhase();
  await _token.advancePhase();

  // investors buy tokens
  for (let i = 0; i < investors.length; i++) {
    await _token.connect(investors[i]).purchase({ value: parseEther(value.toString()) });
  }

  return value * investors.length;
};

const conductLiquidityDeposits = async (
  investors: SignerWithAddress[],
  tokenAmt: number,
  ethAmt: number,
  router: BananaswapV1Router,
  token: SotanoCoin,
) => {
  const _tokenAmt = tokenAmt.toString();
  const _ethAmt = ethAmt.toString();
  const liquidityGrants = [];

  let investor;

  for (let i = 0; i < investors.length; i++) {
    investor = investors[i];
    // permit token transfer
    await token.connect(investor).approve(router.address, parseEther(_tokenAmt));
    liquidityGrants.push(
      await router
        .connect(investor)
        .depositLiquidity(
          token.address,
          parseEther(_tokenAmt),
          parseEther((tokenAmt / 2).toString()),
          parseEther((ethAmt / 2).toString()),
          {
            value: parseEther(_ethAmt),
          },
        ),
    );
  }

  return liquidityGrants.map(tx => tx.value.toString());
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
      await conductIco(token, accounts);

      // deploy Factory
      const factoryArtifact: Artifact = await artifacts.readArtifact("BananaswapV1Factory");
      factory = <BananaswapV1Factory>await waffle.deployContract(admin, factoryArtifact);
      console.log("FACTORY ADDRESS: ", factory.address);

      // deploy Router
      const routerArtifact: Artifact = await artifacts.readArtifact("BananaswapV1Router");
      router = <BananaswapV1Router>await waffle.deployContract(admin, routerArtifact, [factory.address]);
      console.log("ROUTER ADDRESS: ", router.address);

      // grant allowance via SotanoCoin
      await token.connect(account1).approve(router.address, parseEther("4"));
      const allowance = await token.connect(account1).allowance(account1.address, router.address);

      console.log("ALLOWANCE: ", allowance.toString());

      // deploy Pair by adding Liquidity
      await router
        .connect(account1)
        .depositLiquidity(token.address, parseEther("4"), parseEther("4"), parseEther("1"), {
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
      it("Initial liquidity deposit should set reserves and grant LP tokens", async () => {
        const [tokenReserve, ethReserve] = await pair.getReserves();
        expect(tokenReserve).to.equal(parseEther("4"));
        expect(ethReserve).to.equal(parseEther("1"));

        // TODO test LP tokens granted
      });
      // TODO test multiple deposits (tested below?)
      // TODO test bad token/eth ratio
    });
    describe("Withdraw Liquidity", () => {
      beforeEach(async () => {
        // Total Liquidity:
        //  Tokens: 84 (4 + 80)
        //  ETH: 21 (1 + 20)
        await conductLiquidityDeposits(accounts.slice(1, 11), 8, 2, router, token);
      });

      // No swaps
      it("Liquidity withdrawl should result in expected tokens", async () => {
        const totalSupply = await pair.totalSupply();
        expect(await pair.getReserves()).to.deep.equal([parseEther("84"), parseEther("21")]);
        // TODO place test below somehwere
        // expect(await pair.balanceOf(account1.address)).to.deep.equal(parseEther("2").sub(1000));
        expect(await pair.balanceOf(account2.address)).to.equal(parseEther("4"));

        // SOT balance should be 25 - 8
        expect(await token.balanceOf(account2.address)).to.equal(parseEther("17"));

        await pair.connect(account2).approve(pairAddress, parseEther("1"));
        await router.connect(account2).withdrawLiquidity(token.address, parseEther("1"));

        expect(await pair.balanceOf(account2.address)).to.equal(parseEther("3"));
        expect(await pair.totalSupply()).to.equal(totalSupply.sub(parseEther("1")));
        expect(await pair.getReserves()).to.deep.equal([parseEther("82"), parseEther("20.5")]);

        // SOT balance should be 25 - 8 + (8 / 4) = 19
        expect(await token.balanceOf(account2.address)).to.equal(parseEther("19"));

        await pair.connect(account2).approve(pairAddress, parseEther("3"));
        await router.connect(account2).withdrawLiquidity(token.address, parseEther("3"));

        expect(await pair.balanceOf(account2.address)).to.deep.equal(parseEther("0"));
        expect(await pair.totalSupply()).to.equal(totalSupply.sub(parseEther("4")));
        expect(await pair.getReserves()).to.deep.equal([parseEther("76"), parseEther("19")]);

        // SOT balance restored to original 25
        expect(await token.balanceOf(account2.address)).to.equal(parseEther("25"));
      });
    });
  });
});
