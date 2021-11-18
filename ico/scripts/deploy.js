require("hardhat");

async function main() {
  const Sotano = await ethers.getContractFactory("SotanoCoin");
  console.log("Deploying SotanoCoin");
  // dev_2 address
  const sotano = await Sotano.deploy("0x816a4bbE1bD9429Ed499Bb0e30c30c8F1178DCd3");
  console.log("SotanoCoin deployed to: ", sotano.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
