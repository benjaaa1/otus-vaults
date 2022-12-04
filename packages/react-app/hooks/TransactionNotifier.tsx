// import { createContainer } from 'unstated-next'
import { useWeb3Context } from '../context'
import { toast } from 'react-toastify'
import { TransactionStatusData } from '@synthetixio/transaction-notifier'
import { useCallback, useEffect, useState } from 'react'
import { NetworkIdByName } from '@synthetixio/contracts-interface';
import { ethers } from 'ethers';

type BlockExplorerInstance = {
  baseLink: string;
  txLink: (txId: string) => string;
  addressLink: (address: string) => string;
  tokenLink: (address: string) => string;
  blockLink: (blockNumber: string) => string;
};

const NotificationSuccess = () => { }

const NotificationPending = () => { }

const NotificationError = ({
  failureReason,
}: {
  failureReason: string | undefined
}) => {
  return <div>{failureReason}</div>
}

const getBaseUrl = () => {
  return `https://goerli-optimism.etherscan.io`;
};

const generateExplorerFunctions = (baseUrl: string) => {
  return {
    baseLink: baseUrl,
    txLink: (txId: string) => `${baseUrl}/tx/${txId}`,
    addressLink: (address: string) => `${baseUrl}/address/${address}`,
    tokenLink: (address: string) => `${baseUrl}/token/${address}`,
    blockLink: (blockNumber: string) => `${baseUrl}/block/${blockNumber}`,
  };
};

const useBlockExplorer = () => {
  const { network } = useWeb3Context()

  const [blockExplorerInstance, setBlockExplorerInstance] = useState<BlockExplorerInstance | null>(
    null
  );

  useEffect(() => {
    if (network) {
      const baseUrl = getBaseUrl();
      setBlockExplorerInstance(generateExplorerFunctions(baseUrl));
    }
  }, [network]);

  return {
    blockExplorerInstance,
  };
};

export const useTransactionNotifier = () => {
  const { transactionNotifier } = useWeb3Context() // Connector.useContainer();
  const { blockExplorerInstance } = useBlockExplorer();

  return useCallback(
    ({
      txHash,
      onTxConfirmed,
      onTxFailed,
    }: {
      txHash: string
      onTxSent?: () => void
      onTxConfirmed?: () => void
      onTxFailed?: (failureMessage: TransactionStatusData) => void
    }) => {
      const link =
        blockExplorerInstance != null
          ? blockExplorerInstance.txLink(txHash)
          : undefined
      if (transactionNotifier) {
        const toastProps = {
          onClick: () => window.open(link, '_blank'),
        }
        const emitter = transactionNotifier.hash(txHash)
        emitter.on('txSent', () => {
          toast(NotificationPending, { ...toastProps, toastId: txHash })
        })
        emitter.on(
          'txConfirmed',
          ({ transactionHash }: TransactionStatusData) => {
            toast.update(transactionHash, {
              ...toastProps,
              render: NotificationSuccess,
              autoClose: 10000,
            })
            if (onTxConfirmed != null) {
              onTxConfirmed()
            }
          }
        )
        emitter.on(
          'txFailed',
          ({ transactionHash, failureReason }: TransactionStatusData) => {
            toast.update(transactionHash, {
              ...toastProps,
              render: <NotificationError failureReason={failureReason} />,
            })
            if (onTxFailed != null) {
              onTxFailed({ transactionHash, failureReason })
            }
          }
        )
      }
    },
    [transactionNotifier]
  )
}

// const TransactionNotifier = createContainer(useTransactionNotifier);

// export default TransactionNotifier;
