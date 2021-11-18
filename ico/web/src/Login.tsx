import React from 'react';
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";



const Login = () => {
    const navigate = useNavigate();

    async function handleLogin() {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const _accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (_accounts && _accounts.length) {
            navigate("/investor");
        }
    }

  return (
      <Box>
        <Button onClick={handleLogin} variant="contained">Login</Button>
      </Box>
  );
}

export default Login;
