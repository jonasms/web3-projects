import React, { useState, useEffect, useRef } from 'react';
import { ethers } from "ethers"
import Container from '@mui/material/Container';
import Box from "@mui/material/Box";
import SotanoCoinJSON from "../../artifacts/contracts/SotanoCoin.sol/SotanoCoin.json";

const SOTANOCOIN_ICO_CONTRACT = process.env.REACT_APP_CONTRACT_ADDRESS;
console.log("ADDRESS: ", process.env.REACT_APP_CONTRACT_ADDRESS);
//"0x093568B8e4812f1D252e0FD6573c745aB8B765Ca";

declare global {
  interface Window { ethereum: any; }
}

const { utils } = ethers;
const { formatEther } = utils;

const InvestorPortalView = ({ account, contract }: any) => {
  const [numTokens, setNumTokens] = useState(0);
  const _account = useRef(account);
  const _contract = useRef(contract);
  
  useEffect(() => {
    _contract.current.investorToTokensOwed(_account.current).then((tokensOwed: any) => {
        console.log("TOKENS OWED: ", formatEther(tokensOwed));
        setNumTokens(parseFloat(formatEther(tokensOwed)));
    });
  },[_account, _contract])



  return (
    <Container maxWidth="lg">
        <Box>{`Account: ${account}`}</Box>
      <Box>{`Tokens: ${numTokens}`}</Box>
      </Container>
    )
}

const InvestorPortal = () => {
    const [accounts, setAccounts] = useState();

    window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: any) => {
            setAccounts(accounts);
        })
        .catch((err: any) => {
            console.log("ERROR: ", err);
        });

    const provider = new ethers.providers.Web3Provider(window.ethereum);
        //   const signer = provider.getSigner();
    const contract = new ethers.Contract(SOTANOCOIN_ICO_CONTRACT!, SotanoCoinJSON.abi, provider);
        



    // @ts-ignore
    return accounts && accounts.length
        ? <InvestorPortalView account={accounts[0]} contract={contract} />
        : null;
}

export default InvestorPortal;
