export const SNXIcon =
  'https://raw.githubusercontent.com/Synthetixio/synthetix-assets/master/snx/SNX.svg'

export default function SNXLogoIcon() {
  const props = {
    width: '40px',
    height: '40px',
  }

  return <img src={SNXIcon} {...props} alt="snx-icon" />
}
