import * as React from 'react'

const LogoIcon = (props) => (
  <svg
    width={50}
    height={50}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g opacity={0.5} filter="url(#a)">
      <path
        d="M46 21c0 11.598-9.402 21-21 21S4 32.598 4 21 13.402 0 25 0s21 9.402 21 21Z"
        fill="url(#b)"
      />
      <path d="m25 15 5.196 3v6L25 27l-5.196-3v-6L25 15Z" fill="#515151" />
    </g>
    <defs>
      <linearGradient
        id="b"
        x1={25}
        y1={0}
        x2={25}
        y2={42}
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#242424" />
        <stop offset={1} stopColor="#242424" stopOpacity={0} />
      </linearGradient>
      <filter
        id="a"
        x={0}
        y={0}
        width={50}
        height={50}
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity={0} result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy={4} />
        <feGaussianBlur stdDeviation={2} />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
        <feBlend in2="BackgroundImageFix" result="effect1_dropShadow_10_288" />
        <feBlend
          in="SourceGraphic"
          in2="effect1_dropShadow_10_288"
          result="shape"
        />
      </filter>
    </defs>
  </svg>
)

export default LogoIcon
