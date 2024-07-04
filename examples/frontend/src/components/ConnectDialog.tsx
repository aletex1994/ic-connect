import { useEffect, useState } from 'react';
import { Button, Modal, Spin, Typography } from 'antd';
import { useSiwbIdentity } from 'ic-use-siwb-identity';

export default function ConnectDialog({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (isOpen: boolean) => void }) {
  //   const { connect, connectors, error, isPending, variables, reset } = useConnect();
  //   const { isConnected } = useAccount();
  const { prepareLogin, isPrepareLoginIdle, prepareLoginError, loginError, setWalletProvider, login, getAddress, connectedBtcAddress, identity } =
    useSiwbIdentity();

  const [loading, setLoading] = useState<boolean>(false);
  const [manually, setManually] = useState<boolean>(false);
  /**
   * Preload a Siwb message on every address change.
   */
  useEffect(() => {
    if (!isPrepareLoginIdle) return;
    if (getAddress()) {
      prepareLogin();
      if (connectedBtcAddress && !identity && manually) {
        (async () => {
          setLoading(true);
          const res = await login();
          setLoading(false);
          if (res) {
            setManually(false);
            setIsOpen(false);
          }
        })();
      }
    }
  }, [prepareLogin, isPrepareLoginIdle, getAddress, setIsOpen, login, connectedBtcAddress, identity, manually]);

  /**
   * Show an error toast if the prepareLogin() call fails.
   */
  useEffect(() => {}, [prepareLoginError]);

  /**
   * Show an error toast if the login call fails.
   */
  useEffect(() => {}, [loginError]);

  return (
    <Modal
      className="z-50 w-80"
      open={isOpen}
      footer={null}
      onCancel={() => {
        setIsOpen(false);
      }}
    >
      <Typography.Title> Select Wallet</Typography.Title>
      <div className="mt-8">
        <Button
          key="wizz"
          onClick={async () => {
            setManually(true);
            await setWalletProvider('wizz');
          }}
          disabled={loading}
          block
        >
          Wizz Wallet
        </Button>
      </div>
      <div className="mt-8">
        <Button
          key="unisat"
          onClick={async () => {
            setManually(true);
            await setWalletProvider('unisat');
          }}
          disabled={loading}
          block
        >
          Unisat Wallet
        </Button>
      </div>
      {loading && <Spin fullscreen />}
    </Modal>
  );
}
