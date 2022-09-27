import * as React from 'react'

const BTCBWIcon = (props) => (
  <svg
    width={64}
    height={64}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g filter="url(#filter0_d_17_921)">
      <circle cx={32} cy={28} r={28} fill="#18181B" />
      <circle cx={32} cy={28} r={27.5} stroke="#242424" />
    </g>
    <g clipPath="url(#clip0_17_921)">
      <mask
        id="mask0_17_921"
        style={{
          maskType: 'alpha',
        }}
        maskUnits="userSpaceOnUse"
        x={4}
        y={0}
        width={56}
        height={56}
      >
        <path
          d="M32 56C47.464 56 60 43.464 60 28C60 12.536 47.464 0 32 0C16.536 0 4 12.536 4 28C4 43.464 16.536 56 32 56Z"
          fill="url(#paint0_linear_17_921)"
        />
      </mask>
      <g mask="url(#mask0_17_921)">
        <path
          d="M42.4842 25.1125C42.9422 22.0559 40.6133 20.4124 37.4312 19.3156L38.4637 15.1739L35.9437 14.547L34.9374 18.5792C34.2754 18.4129 33.5958 18.2584 32.9176 18.1038L33.9312 14.0453L31.4112 13.4167L30.3787 17.5568C29.8304 17.4314 29.2908 17.309 28.7687 17.1778L28.7716 17.1646L25.2949 16.297L24.6241 18.989C24.6241 18.989 26.4951 19.4178 26.4558 19.444C27.4766 19.6992 27.6604 20.3745 27.6297 20.9111L26.4543 25.6288C26.5243 25.6463 26.6147 25.6725 26.7168 25.7118L26.4499 25.6463L24.802 32.2554C24.6766 32.5646 24.3601 33.0298 23.6455 32.8534C23.6718 32.8898 21.8138 32.397 21.8138 32.397L20.5626 35.2815L23.8438 36.0996C24.4534 36.2528 25.0513 36.4132 25.6391 36.5634L24.5963 40.7517L27.1149 41.3788L28.1474 37.2371C28.8157 37.4167 29.4856 37.5902 30.157 37.7577L29.1274 41.8818L31.6474 42.5089L32.6901 38.3295C36.9893 39.1431 40.2209 38.815 41.5816 34.9271C42.6783 31.7975 41.5276 29.9907 39.2658 28.8138C40.9137 28.4346 42.1533 27.3511 42.4842 25.1125ZM36.7238 33.1888C35.9466 36.3199 30.6747 34.6267 28.9655 34.2024L30.3509 28.6534C32.0601 29.0806 37.5391 29.925 36.7238 33.1888ZM37.5041 25.0674C36.7938 27.9154 32.4072 26.4674 30.9854 26.1129L32.2395 21.0817C33.6613 21.436 38.2449 22.0967 37.5041 25.0674Z"
          fill="white"
        />
      </g>
    </g>
    <defs>
      <filter
        id="filter0_d_17_921"
        x={0}
        y={0}
        width={64}
        height={64}
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity={0} result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy={4} />
        <feGaussianBlur stdDeviation={2} />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_17_921"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_17_921"
          result="shape"
        />
      </filter>
      <linearGradient
        id="paint0_linear_17_921"
        x1={32}
        y1={0}
        x2={32}
        y2={81.8788}
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#08021E" />
        <stop offset={1} stopColor="#1F0777" />
      </linearGradient>
      <clipPath id="clip0_17_921">
        <rect width={56} height={56} fill="white" transform="translate(4)" />
      </clipPath>
    </defs>
  </svg>
)

export default BTCBWIcon
