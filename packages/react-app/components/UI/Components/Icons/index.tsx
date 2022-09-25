export const SNXIcon =
  'https://raw.githubusercontent.com/Synthetixio/synthetix-assets/master/snx/SNX.svg'

export default function CryptoIcon() {
  const props = {
    width: '24px',
    height: '24px',
  }

  return <img src={SNXIcon} {...props} alt="snx-icon" />
}
