import React, { useState, useEffect, useRef } from 'react';
import { ethers } from "ethers"
import Container from '@mui/material/Container';
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import SotanoCoinJSON from "../../artifacts/contracts/SotanoCoin.sol/SotanoCoin.json";

const SOTANOCOIN_ICO_CONTRACT = process.env.REACT_APP_CONTRACT_ADDRESS;
console.log("ADDRESS: ", process.env.REACT_APP_CONTRACT_ADDRESS);
//"0x093568B8e4812f1D252e0FD6573c745aB8B765Ca";

declare global {
  interface Window { ethereum: any; }
}

const { utils } = ethers;
const { parseEther, formatEther } = utils;

const InvestorPortalView = ({ account, ...props }: any) => {
    const [statusMessage, setStatusMessage] = useState("");
    const [numTokens, setNumTokens] = useState(0);
    const [tokensToPurchase, setTokensToPurchase] = useState("0");
//   const [curPhase, setCurPase] = useState();
//   const account = useRef(props.account);
    const contract = useRef(props.contract);
  
    useEffect(() => {
        contract.current.investorToTokensOwed(account).then((tokensOwed: any) => {
            console.log("TOKENS OWED: ", formatEther(tokensOwed));
            setNumTokens(parseFloat(formatEther(tokensOwed)));
        });

    // TODO CUR PHASE
    // contract.current.curPhase().then((phase: any) => {
    //     setCurPhase(phase);
    // });
    },[account, contract])

    // const handlePurchase = () => {
    async function handlePurchase() {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const _contract = new ethers.Contract(
            SOTANOCOIN_ICO_CONTRACT!,
            SotanoCoinJSON.abi,
            signer
        );

        console.log("PURCHASING TOKENS: ", parseEther(tokensToPurchase));

        try {
            const tsx = await _contract.purchase({ value: parseEther(tokensToPurchase) });
            await tsx.wait();
            setStatusMessage("Transaction Completed");
        } catch (e) {
            console.error(e);
            setStatusMessage("Transaction Failed");
        }
    }
    //     contract.current.purchase({ value: parseEther(tokensToPurchase) })
    //         .then(() => {
    //             setStatusMessage("Transaction Completed");
    //         })
    //         .catch(() => {
    //             setStatusMessage("Transaction Failed");
    //         });
    // };

  const enablePurchasing = tokensToPurchase && parseFloat(tokensToPurchase) > 0;

  return (
    <Container maxWidth="lg">
        <Box>{`Account: ${account}`}</Box>
        <Box mt={1}>{`Tokens: ${numTokens}`}</Box>
      {/* <Box>{`Current Phase: ${curPhase}`}</Box> */}
        <Box mt={4}>
            <Box>
                <TextField
                    value={tokensToPurchase}
                    onChange={(evt: any) => {
                        console.log("EVENT: ", evt.target.value);
                        setTokensToPurchase(evt.target.value);
                    }}
                    label="Number"
                    type="number"
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
            </Box>
            <Box mt={1}>
                <Button variant="contained" disabled={!enablePurchasing} onClick={handlePurchase}>Purchase Tokens</Button>
            </Box>
            <Box mt={1}><Typography>{statusMessage}</Typography></Box>
        </Box>
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
