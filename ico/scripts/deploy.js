require("hardhat");

async function main() {
  const Sotano = await ethers.getContractFactory("Sotano");
  console.log("Deploying Sotano");
  const sotano = await Sotano.deploy();
  console.log("Sotano deployed to: ", sotano.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
