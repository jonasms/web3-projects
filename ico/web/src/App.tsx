import React, { useState } from 'react';
import { ethers } from "ethers"
import Container from '@mui/material/Container';
import Box from "@mui/material/Box";
import SotanoCoinJSON from "../../artifacts/contracts/SotanoCoin.sol/SotanoCoin.json";

const SOTANOCOIN_ICO_CONTRACT = "0x093568B8e4812f1D252e0FD6573c745aB8B765Ca";

declare global {
  interface Window { ethereum: any; }
}

const App = () => {
  const [numTokens, setNumTokens] = useState(0);

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const contract = new ethers.Contract(SOTANOCOIN_ICO_CONTRACT, SotanoCoinJSON.abi, provider);



  return (
    <Container maxWidth="lg">
      <Box>{`Tokens: ${numTokens}`}</Box>
      {/* Display how many tokens a user owns */}
    </Container>
  );
}

export default App;
