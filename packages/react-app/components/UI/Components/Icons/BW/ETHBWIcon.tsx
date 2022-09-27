import * as React from 'react'

const ETHBWIcon = (props) => (
  <svg
    width={64}
    height={64}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g filter="url(#filter0_d_17_905)">
      <circle cx={32} cy={28} r={28} fill="#18181B" />
      <circle cx={32} cy={28} r={27.5} stroke="#242424" />
    </g>
    <g clipPath="url(#clip0_17_905)">
      <mask
        id="mask0_17_905"
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
          fill="url(#paint0_linear_17_905)"
        />
      </mask>
      <g mask="url(#mask0_17_905)">
        <path
          d="M32.6683 11.9V23.8006L42.7268 28.2952L32.6683 11.9Z"
          fill="white"
          fillOpacity={0.602}
        />
        <path
          d="M32.6682 11.9L22.6083 28.2952L32.6682 23.8006V11.9Z"
          fill="white"
        />
        <path
          d="M32.6683 36.007V44.0932L42.7335 30.168L32.6683 36.007Z"
          fill="white"
          fillOpacity={0.602}
        />
        <path
          d="M32.6682 44.0932V36.0057L22.6083 30.168L32.6682 44.0932Z"
          fill="white"
        />
        <path
          d="M32.6683 34.1355L42.7268 28.2952L32.6683 23.8033V34.1355Z"
          fill="white"
          fillOpacity={0.2}
        />
        <path
          d="M22.6083 28.2952L32.6682 34.1355V23.8033L22.6083 28.2952Z"
          fill="white"
          fillOpacity={0.602}
        />
      </g>
    </g>
    <defs>
      <filter
        id="filter0_d_17_905"
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
          result="effect1_dropShadow_17_905"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_17_905"
          result="shape"
        />
      </filter>
      <linearGradient
        id="paint0_linear_17_905"
        x1={32}
        y1={0}
        x2={32}
        y2={81.8788}
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#08021E" />
        <stop offset={1} stopColor="#1F0777" />
      </linearGradient>
      <clipPath id="clip0_17_905">
        <rect width={56} height={56} fill="white" transform="translate(4)" />
      </clipPath>
    </defs>
  </svg>
)

export default ETHBWIcon
