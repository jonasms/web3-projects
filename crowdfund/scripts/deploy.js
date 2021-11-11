async function main() {
  const Campaign = await ethers.getContractFactory("Factory");
  console.log("Deploying Campaign");
  const campaign = await Campaign.deploy();
  console.log("Campaign deployed to: ", campaign.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
