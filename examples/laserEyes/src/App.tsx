// // import icLogo from './assets/ic.svg';
// // import btcLogo from './assets/btc.svg';
// import { SignIdentity } from '@dfinity/agent';
// import './App.css';
// // import { Button, Typography } from 'antd';
// import { LaserEyesClient, LaserEyesProvider, MAINNET } from '@omnisat/lasereyes';
// import { useLaserEyes, UNISAT } from '@omnisat/lasereyes';
// import { SiwbConnector } from 'ic-siwb-lasereyes-connector';
// import { useState } from 'react';

// // import { useSiwbIdentity } from 'ic-use-siwb-identity'

// function WalletConnector() {
//   const [icIdentity, setIcIdentity] = useState<SignIdentity | undefined>(undefined);

//   const { connect, connected, address, balance, signMessage, signPsbt, switchNetwork, requestAccounts, getPublicKey, getNetwork } = useLaserEyes();

//   const handleConnect = () => {
//     connect(UNISAT);
//   };

//   const handleSendBTC = async () => {
//     //const recipient = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';
//     //const amount = 1000; // 1000 sats
//     // await sendBTC(recipient, amount);
//   };

//   const handleSignMessage = async () => {
//     const message = 'SIGN ME, BABY';
//     const signature = await signMessage(message);
//     console.log(signature);
//   };

//   const handleICLogin = async () => {
//     const client = {
//       signMessage,
//       requestAccounts,
//       getPublicKey,
//       getNetwork,
//     } as LaserEyesClient;
//     await SiwbConnector.connect(client);
//     const delegation = await SiwbConnector.getDelegationIdentity();
//     if (delegation) {
//       setIcIdentity(delegation);
//     }
//   };

//   const handleICLogout = async () => {
//     await SiwbConnector.disconnect();
//     setIcIdentity(undefined);
//   };

//   const handleSignPsbt = async () => {
//     const psbtBase64 = '...'; // Your PSBT as a base64 string
//     const tx = await signPsbt(psbtBase64);
//     console.log(tx);
//   };

//   const handleSwitchNetwork = () => {
//     switchNetwork('testnet');
//   };

//   return (
//     <div>
//       {!connected ? (
//         <button onClick={handleConnect}>Connect Wallet</button>
//       ) : (
//         <div>
//           <p>Connected Address: {address}</p>
//           <p>Balance: {balance}</p>

//           <button onClick={handleSendBTC}>Send BTC</button>

//           <button onClick={handleSignMessage}>Sign Message</button>

//           <button onClick={handleSignPsbt}>Sign PSBT</button>

//           <button onClick={handleSwitchNetwork}>Switch Network</button>

//           <p>IC Login</p>
//           <button onClick={handleICLogin}>Login with IC</button>

//           <button onClick={handleICLogout}>Disconnect with IC</button>

//           {icIdentity && <p>IC Identity: {icIdentity.getPrincipal().toText()}</p>}
//         </div>
//       )}
//     </div>
//   );
// }

// function App() {
//   return (
//     <LaserEyesProvider config={{ network: MAINNET }}>
//       <WalletConnector />
//     </LaserEyesProvider>
//   );
// }

// export default App;

import icLogo from './assets/ic.svg';
import btcLogo from './assets/btc.svg';
import './App.css';
import { useSiwbIdentity } from 'ic-siwb-lasereyes-connector';
import { Button, Typography } from 'antd';

// import { useSiwbIdentity } from 'ic-use-siwb-identity'

function App() {
  const { identity, identityAddress, clear } = useSiwbIdentity();

  return (
    <>
      <div>
        <a href="https://internetcomputer.org" target="_blank">
          <img src={icLogo} className="logo" alt="IC logo" />
        </a>
        <a href="https://bitcoin.org" target="_blank">
          <img src={btcLogo} className="logo btc" alt="BTC logo" />
        </a>
      </div>
      <h1>IC x BTC </h1>
      <div className="card">
        <Typography.Title level={5} style={{ color: '#fff' }}>
          BTC Address is
        </Typography.Title>
        <Typography.Text style={{ color: '#fff' }}>{identityAddress}</Typography.Text>
      </div>
      <div className="card">
        <Typography.Title level={5} style={{ color: '#fff' }}>
          Identity Principal is
        </Typography.Title>
        <Typography.Text style={{ color: '#fff' }}>{identity?.getPrincipal().toText()}</Typography.Text>
      </div>
      <Button
        type="dashed"
        onClick={() => {
          clear();
        }}
      >
        Click here to try again
      </Button>
    </>
  );
}

export default App;
