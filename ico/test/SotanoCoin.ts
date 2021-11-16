import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import type { SotanoCoin } from "../src/types/SotanoCoin";
import type {Factory} from "../src/types/Factory";
import { Signers } from "./types";
import { expect } from "chai";

const { utils } = ethers;
const { parseEther } = utils;

describe("Campaign", function () {
    beforeEach(async function () {
      const SotanoCoinArtifact: Artifact = await artifacts.readArtifact("SotanoCoin");
      this.sotanoCoin = <SotanoCoin>await waffle.deployContract(this.account1, SotanoCoinArtifact);
    });
});
