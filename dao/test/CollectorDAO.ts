import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import type { CollectorDao } from "../src/types/CollectorDao";
import { expect } from "chai";
// import { BigNumber } from "ethers";

const { utils } = ethers;
const { parseEther } = utils;
const { provider } = waffle;

describe("CollectorDAO", function () {
  before(async function () {
    const accounts: SignerWithAddress[] = await ethers.getSigners();
    [this.owner, this.account1, this.account2, this.account3] = accounts;
    this.accounts = accounts;
    this.accountAddresses = accounts.map(a => a.address);
  });

  beforeEach(async function () {
    const daoArtifact: Artifact = await artifacts.readArtifact("dao");
    this.dao = <CollectorDao>await waffle.deployContract(this.owner, daoArtifact);
    this.address = this.dao.address;
  });
});
