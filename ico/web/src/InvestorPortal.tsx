import React, { useState, useEffect, useRef, useCallback } from "react";
import { ethers } from "ethers";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import SotanoCoinJSON from "../../artifacts/contracts/SotanoCoin.sol/SotanoCoin.json";

const SOTANOCOIN_ICO_CONTRACT = process.env.REACT_APP_CONTRACT_ADDRESS;
console.log("ADDRESS: ", process.env.REACT_APP_CONTRACT_ADDRESS);
//"0x093568B8e4812f1D252e0FD6573c745aB8B765Ca";

declare global {
    interface Window {
        ethereum: any;
    }
}

const { utils } = ethers;
const { parseEther, formatEther } = utils;

const phaseMap = {
    0: "Closed",
    1: "Seed",
    2: "General",
    3: "Open",
};

const parseErrorMessage = (err: any) => {
    if (err && err.data && err.data.message) {
        return err.data.message;
    }

    if (err.message) {
        const startIdx = err.message.indexOf("error=") + "error=".length;
        const endIdx = err.message.indexOf(", method=");
        const jsonString = err.message.slice(startIdx, endIdx);

        try {
            const json = JSON.parse(jsonString);
            return json.message || "No error message.";
        } catch {
            return "No error message.";
        }
    }
};

const InvestorPortalView = ({ account, ...props }: any) => {
    const [statusMessage, setStatusMessage] = useState("");
    const [numTokensOwed, setNumTokensOwed] = useState(0);
    const [numTokensMinted, setNumTokensMinted] = useState(0);
    const [tokensToPurchase, setTokensToPurchase] = useState("0");
    const [curPhase, setCurPhase] = useState();
    const contract = useRef(props.contract).current;

    async function getTokensOwed() {
        contract.investorToTokensOwed(account).then((tokensOwed: any) => {
            console.log("TOKENS OWED: ", formatEther(tokensOwed));
            setNumTokensOwed(parseFloat(formatEther(tokensOwed)));
        });
    }

    async function getTokensMinted() {
        contract.balanceOf(account).then((tokens: any) => {
            console.log("TOKENS OWED: ", formatEther(tokens));
            setNumTokensMinted(parseFloat(formatEther(tokens)));
        });
    }

    async function getCurPhase() {
        const phase = await contract.curPhase();
        setCurPhase(phase);
    }

    const update = () => {
        getTokensOwed();
        getTokensMinted();
        getCurPhase();
    };

    const _getTokensOwed = useCallback(getTokensOwed, [account, contract]);
    const _getTokensMinted = useCallback(getTokensMinted, [account, contract]);
    const _getCurPhase = useCallback(getCurPhase, [contract]);

    useEffect(() => {
        _getTokensOwed();
        _getTokensMinted();
        _getCurPhase();
    }, [_getTokensOwed, _getTokensMinted, _getCurPhase]);

    async function handlePurchase() {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const _contract = new ethers.Contract(SOTANOCOIN_ICO_CONTRACT!, SotanoCoinJSON.abi, signer);

        console.log("PURCHASING TOKENS: ", parseEther(tokensToPurchase));

        try {
            const tsx = await _contract.purchase({ value: parseEther(tokensToPurchase) });
            await tsx.wait();
            update();
            setTokensToPurchase("");
            setStatusMessage("Transaction Completed");
        } catch (e: any) {
            console.log("ERROR: ", e);
            update();
            setTokensToPurchase("");
            setStatusMessage(`Transaction Failed: ${parseErrorMessage(e)}`);
        }
    }

    async function handleMint() {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const _contract = new ethers.Contract(SOTANOCOIN_ICO_CONTRACT!, SotanoCoinJSON.abi, signer);

        try {
            const tsx = await _contract.mintTokens();
            await tsx.wait();
            update();
        } catch (e: any) {
            console.log("ERROR: ", e);
            update();
        }
    }

    const enablePurchasing = tokensToPurchase && parseFloat(tokensToPurchase) > 0;
    const enableMinting = curPhase === 3 && numTokensOwed > 0;

    return (
        <Container maxWidth="lg">
            <Box>{`Account: ${account}`}</Box>
            <Box mt={1}>{`Tokens Unminted: ${numTokensOwed}`}</Box>
            <Box mt={1}>{`Tokens Minted: ${numTokensMinted}`}</Box>
            <Box mt={1}>{`Current Phase: ${(curPhase || curPhase === 0) && phaseMap[curPhase]}`}</Box>
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
                    <Button variant="contained" disabled={!enablePurchasing} onClick={handlePurchase}>
                        Purchase Tokens
                    </Button>
                </Box>
                <Box mt={1}>
                    <Typography>{statusMessage}</Typography>
                </Box>
            </Box>
            <Box mt={4}>
                <Button variant="outlined" disabled={!enableMinting} onClick={handleMint}>
                    Mint Tokens
                </Button>
            </Box>
        </Container>
    );
};

const InvestorPortal = () => {
    const [accounts, setAccounts] = useState();

    window.ethereum
        .request({ method: "eth_accounts" })
        .then((_accounts: any) => {
            if (!accounts) {
                setAccounts(_accounts);
            }
        })
        .catch((err: any) => {
            console.log("ERROR: ", err);
        });

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    //   const signer = provider.getSigner();
    const contract = new ethers.Contract(SOTANOCOIN_ICO_CONTRACT!, SotanoCoinJSON.abi, provider);

    // @ts-ignore
    return accounts && accounts.length ? <InvestorPortalView account={accounts[0]} contract={contract} /> : null;
};

export default InvestorPortal;
