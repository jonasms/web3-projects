require("hardhat");

async function main() {
  const Campaign = await ethers.getContractFactory("Campaign");
  console.log("Deploying Campaign");
  const campaign = await Campaign.deploy("Test Campaign", ethers.utils.parseEther("5"));
  console.log("Campaign deployed to: ", campaign.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
