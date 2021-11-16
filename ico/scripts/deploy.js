require("hardhat");

async function main() {
  const Sotano = await ethers.getContractFactory("SotanoCoin");
  console.log("Deploying SotanoCoin");
  const sotano = await Sotano.deploy();
  console.log("SotanoCoin deployed to: ", sotano.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
