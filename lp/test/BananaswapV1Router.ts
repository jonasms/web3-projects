import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import type { BananaswapV1Factory } from "../src/types/BananaswapV1Factory";
import type { BananaswapV1Router } from "../src/types/BananaswapV1Router";
// import type { BananaswapV1Pair } from "../src/types/BananaswapV1Pair";
import type { SotanoCoin } from "../src/types/SotanoCoin";

import { expect } from "chai";
import { BigNumber as BigNumberType } from "ethers";

const { utils, BigNumber } = ethers;
const { parseEther } = utils;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const conductIco = async (_token: SotanoCoin, investors: SignerWithAddress[], ethIn: BigNumberType) => {
  // advance to open phase
  await _token.advancePhase();
  await _token.advancePhase();
  await _token.advancePhase();

  // investors buy tokens
  for (let i = 0; i < investors.length; i++) {
    await _token.connect(investors[i]).purchase({ value: ethIn });
  }

  return ethIn.mul(investors.length);
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

  let investor;

  for (let i = 0; i < investors.length; i++) {
    investor = investors[i];
    // permit token transfer
    await token.connect(investor).approve(router.address, parseEther(_tokenAmt));

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
      );
  }
};

const ONE = ethers.BigNumber.from(1);
const TWO = ethers.BigNumber.from(2);

const sqrt = (value: BigNumberType) => {
  let z = value.add(ONE).div(TWO);
  let y = value;
  while (z.sub(y).isNegative()) {
    y = z;
    z = value.div(z).add(z).div(TWO);
  }
  return y;
};

const getAmountOut = (amountIn: BigNumberType, reserveIn: BigNumberType, reserveOut: BigNumberType) => {
  const amountInLessFee = amountIn.mul(99);
  const numerator = amountInLessFee.mul(reserveOut);
  const denominator = reserveIn.mul(100).add(amountInLessFee);

  return numerator.div(denominator);
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

  const ICO_RATE = 5;
  const icoDeposit = parseEther("10");
  const tokenBalAtIco = icoDeposit.mul(ICO_RATE);

  before(async function () {
    signers = await ethers.getSigners();
    [admin, treasury, account1, account2] = signers;
    accounts = signers.slice(2);
  });

  describe("BananaswapV1Router", function () {
    beforeEach(async function () {
      const pairArtifact: Artifact = await artifacts.readArtifact("BananaswapV1Pair");
      //   console.log("BYTECODE HASH: ", utils.keccak256(pairArtifact.bytecode));

      // deploy Sotano Coin
      const tokenArtifact: Artifact = await artifacts.readArtifact("SotanoCoin");
      token = <SotanoCoin>await waffle.deployContract(admin, tokenArtifact, [treasury.address]);
      //   console.log("TOKEN ADDRESS: ", token.address);

      await conductIco(token, accounts.slice(0, 6), icoDeposit);

      // deploy Factory
      const factoryArtifact: Artifact = await artifacts.readArtifact("BananaswapV1Factory");
      factory = <BananaswapV1Factory>await waffle.deployContract(admin, factoryArtifact);
      //   console.log("FACTORY ADDRESS: ", factory.address);

      // deploy Router
      const routerArtifact: Artifact = await artifacts.readArtifact("BananaswapV1Router");
      router = <BananaswapV1Router>await waffle.deployContract(admin, routerArtifact, [factory.address]);
      //   console.log("ROUTER ADDRESS: ", router.address);

      // grant allowance via SotanoCoin
      await token.connect(account1).approve(router.address, parseEther("4"));

      //   const allowance = await token.connect(account1).allowance(account1.address, router.address);
      //   console.log("ALLOWANCE: ", allowance.toString());

      // deploy Pair by adding Liquidity
      await router
        .connect(account1)
        .depositLiquidity(token.address, parseEther("4"), parseEther("4"), parseEther("1"), {
          value: parseEther("1"),
        });

      pairAddress = await factory.getPair(token.address);
      console.log("PAIR ADDRESS: ", pairAddress);

      const pairContract = await ethers.getContractFactory("BananaswapV1Pair");
      pair = await pairContract.attach(pairAddress);
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
      // TODO test deposit with token fees on
    });

    describe("Withdraw Liquidity", () => {
      let tokensDeposited = parseEther("16");
      let ethDeposited = parseEther("4");
      beforeEach(async () => {
        // 5 accounts @ 16 : 4 each, 80 : 20 total
        // Total Liquidity:
        //  Tokens: 84 (4 + 80)
        //  ETH: 21 (1 + 20)
        await conductLiquidityDeposits(accounts.slice(1, 6), 16, 4, router, token);
        // await conductLiquidityDeposits(accounts.slice(1, 11), 8, 2, router, token);
      });

      // No swaps
      it("Liquidity withdrawl should result in expected tokens", async () => {
        let tokenReserve = parseEther("84");
        let ethReserve = parseEther("21");
        let tokenBalance = await token.balanceOf(account2.address);

        const totalSupplyBeforeWithdrawl = await pair.totalSupply();

        expect(await pair.getReserves()).to.deep.equal([tokenReserve, ethReserve]);
        // TODO place test below somehwere
        // expect(await pair.balanceOf(account1.address)).to.deep.equal(parseEther("2").sub(1000));
        let expectedLiquidityBalance = sqrt(tokensDeposited.mul(ethDeposited));
        expect(await pair.balanceOf(account2.address)).to.equal(expectedLiquidityBalance);

        // SOT balance should be icoDeposit - tokensDeposited
        expect(await token.balanceOf(account2.address)).to.equal(tokenBalAtIco.sub(tokensDeposited));

        /* FIRST WITHDRAW */
        let liquidityToWithdraw = parseEther("1");
        await pair.connect(account2).approve(pairAddress, liquidityToWithdraw);
        await router.connect(account2).withdrawLiquidity(token.address, liquidityToWithdraw);

        expectedLiquidityBalance = expectedLiquidityBalance.sub(liquidityToWithdraw);
        let totLiquidityWithdrawn = liquidityToWithdraw;
        let tokenBal = await token.balanceOf(pairAddress);
        let ethBal = await pair.provider.getBalance(pairAddress);
        let totalSupply = await pair.totalSupply();
        let tokensOut = tokenBal.mul(liquidityToWithdraw).div(totalSupply);
        let ethOut = ethBal.mul(liquidityToWithdraw).div(totalSupply);

        tokenReserve = tokenReserve.sub(tokensOut);
        ethReserve = ethReserve.sub(ethOut);

        expect(await pair.balanceOf(account2.address)).to.equal(expectedLiquidityBalance);
        expect(await totalSupply).to.equal(totalSupplyBeforeWithdrawl.sub(totLiquidityWithdrawn));
        expect(await pair.getReserves()).to.deep.equal([tokenReserve, ethReserve]);
        // SOT balance should be startingTokenBal + tokensOut from withdrawl
        expect(await token.balanceOf(account2.address)).to.equal(tokenBalance.add(tokensOut));

        /* SECOND WITHDRAW */
        liquidityToWithdraw = parseEther("3");
        await pair.connect(account2).approve(pairAddress, liquidityToWithdraw);
        await router.connect(account2).withdrawLiquidity(token.address, liquidityToWithdraw);

        expectedLiquidityBalance = expectedLiquidityBalance.sub(liquidityToWithdraw);
        totLiquidityWithdrawn = totLiquidityWithdrawn.add(liquidityToWithdraw);

        tokenBal = await token.balanceOf(pairAddress);
        ethBal = await pair.provider.getBalance(pairAddress);
        totalSupply = await pair.totalSupply();
        tokensOut = tokenBal.mul(liquidityToWithdraw).div(totalSupply);
        ethOut = ethBal.mul(liquidityToWithdraw).div(totalSupply);

        tokenReserve = tokenReserve.sub(tokensOut);
        ethReserve = ethReserve.sub(ethOut);

        expect(await pair.balanceOf(account2.address)).to.deep.equal(expectedLiquidityBalance);
        expect(await pair.totalSupply()).to.equal(totalSupplyBeforeWithdrawl.sub(totLiquidityWithdrawn));
        expect(await pair.getReserves()).to.deep.equal([tokenReserve, ethReserve]);

        // SOT balance restored to original 25
        // expect(await token.balanceOf(account2.address)).to.equal(parseEther("25"));
      });
    });

    describe("Swap", () => {
      describe("With Token Transaction Fees", () => {
        beforeEach(async () => {
          // 5 accounts @ 16 : 4 each, 80 : 20 total
          // Total Liquidity:
          //  Tokens: 84 (4 + 80)
          //  ETH: 21 (1 + 20)
          await conductLiquidityDeposits(accounts.slice(1, 6), 16, 4, router, token);
          //   await conductLiquidityDeposits(accounts.slice(0, 10), 8, 2, router, token);
          await token.toggleFees();
        });
        it("Token => ETH Swap", async () => {
          console.log("MADE IT OUT OF BEFORE_EACH");

          /**
           * Token Reserve should increase by 8 tokens less the tsx tax
           * ETH reserve should decrease by equiv. of 8 tokens less the tsx tax
           */
          const [startingTokenReserve, startingETHReserve] = await pair.getReserves();
          const tokensIn = parseEther("8");
          const tokensInAfterFee = tokensIn.sub(tokensIn.mul(2).div(100));
          const expectedEthOut = getAmountOut(tokensInAfterFee, startingTokenReserve, startingETHReserve);
          const balBeforeSwap = await account2.getBalance();
          const startingTokenBal = await token.balanceOf(account2.address);

          await token.connect(account2).approve(router.address, tokensIn);

          // account2 swaps 8 tokens for ETH
          await router
            .connect(account2)
            .swapTokensWithFeeForETH(token.address, tokensIn, expectedEthOut.sub(parseEther("0.1")));

          expect(await token.balanceOf(account2.address)).to.equal(startingTokenBal.sub(tokensIn));

          // wallet should have (8 - 0.3%) tokens worth of ETH more than before swap
          // using 0.6% to buffer for gas costs
          const balAfterSwap = await account2.getBalance();
          const [endingTokenReserve, endingETHReserve] = await pair.getReserves();

          // using `>=` because difficutlt to measure ETH spent on gas fees
          expect(balAfterSwap.gte(balBeforeSwap.sub(expectedEthOut))).to.equal(true);
          expect(endingTokenReserve).to.equal(startingTokenReserve.add(tokensInAfterFee));
          expect(endingETHReserve).to.equal(startingETHReserve.sub(expectedEthOut));
        });

        it("ETH => Token Swap", async () => {
          // get wallet balance before swap

          const [startingTokenReserve, startingETHReserve] = await pair.getReserves();
          const tokenBalBeforeSwap = await token.balanceOf(account2.address);
          const walletBalBeforeSwap = await account2.getBalance();

          const ethIn = parseEther("2");
          const expectedTokensOut = getAmountOut(ethIn, startingETHReserve, startingTokenReserve);
          const expectedTokensOutLessFees = expectedTokensOut.sub(expectedTokensOut.mul(2).div(100));

          // swap ETH for token
          await router
            .connect(account2)
            .swapETHForTokensWithFee(token.address, expectedTokensOutLessFees.sub(parseEther("0.1")), { value: ethIn });

          // wallet balance before swap should be more than 2 ETH greater than after swap

          // account's token balance should be more than 7.8 tokens higher than before swap
          const tokenBalAfterSwap = await token.balanceOf(account2.address);

          // Test user's token balance
          // Should be equal to starting balance + num tokens less tsx fees equiv to 2 ETH
          expect(tokenBalAfterSwap).to.equal(tokenBalBeforeSwap.add(expectedTokensOutLessFees));

          // Test user's ETH balance
          // Balance + eth spent should be less than before swapping due to gas fees
          const walletBalAfterSwap = await account2.getBalance();
          expect(walletBalAfterSwap.add(ethIn).lt(walletBalBeforeSwap)).to.equal(true);

          // Token Reserve should be startingTokenReserve + expectedTokens (excluding fees)
          const [endingTokenReserve, endingETHReserve] = await pair.getReserves();
          expect(endingTokenReserve).to.equal(startingTokenReserve.sub(expectedTokensOut));
          // ETH reserve should be startingETHReserve - ethIn
          expect(endingETHReserve).to.equal(startingETHReserve.add(ethIn));
        });
      });

      describe("Without Token Transfer Fees", () => {
        it("Token => ETH Swap", async () => {
          // ending token reserve should equal starting token reserve
          // expect(endingTokenReserve.sub(parseEther("8"))).to.equal(startingTokenReserve);
        });
      });
    });
  });
});
